import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma Client Extension for automatic audit logging.
 *
 * Intercepts update and delete operations on critical models
 * and records before/after snapshots to the AuditLog table.
 *
 * NOTE: This extension works for direct Prisma calls.
 * Operations inside interactive $transactions need manual audit logging
 * (as already done with OrderStatusHistory).
 */

/**
 * Serializes data for audit log storage.
 * Handles Decimal, Date, and BigInt types for JSON compatibility.
 * Output is DB-agnostic (works with SQLite and PostgreSQL).
 */
function safeStringify(data: unknown): string | null {
  if (data == null) return null;
  try {
    return JSON.stringify(data, (_key, value) => {
      if (typeof value === "bigint") return value.toString();
      if (value instanceof Date) return value.toISOString();
      // Prisma Decimal objects have a toFixed method
      if (
        value &&
        typeof value === "object" &&
        typeof value.toFixed === "function"
      ) {
        return value.toString();
      }
      return value;
    });
  } catch {
    return null;
  }
}

/** Helper: create audit interceptors for a model */
function makeAuditHooks(basePrisma: PrismaClient, modelName: string) {
  return {
    async update({ args, query }: { args: any; query: any }) {
      const delegate = (basePrisma as any)[modelName];
      let before: unknown = null;
      try {
        if (args.where) {
          before = await delegate.findUnique({ where: args.where });
        }
      } catch {
        /* skip */
      }

      const result = await query(args);

      try {
        const entityId = args.where?.id || (result as any)?.id || "unknown";
        await basePrisma.auditLog.create({
          data: {
            action: "UPDATE",
            entity: modelName,
            entityId: String(entityId),
            oldData: safeStringify(before),
            newData: safeStringify(result),
          },
        });
      } catch (err) {
        console.error(`[AuditLog] Failed to log UPDATE on ${modelName}:`, err);
      }
      return result;
    },

    async delete({ args, query }: { args: any; query: any }) {
      const delegate = (basePrisma as any)[modelName];
      let before: unknown = null;
      try {
        if (args.where) {
          before = await delegate.findUnique({ where: args.where });
        }
      } catch {
        /* skip */
      }

      const result = await query(args);

      try {
        const entityId = args.where?.id || (result as any)?.id || "unknown";
        await basePrisma.auditLog.create({
          data: {
            action: "DELETE",
            entity: modelName,
            entityId: String(entityId),
            oldData: safeStringify(before),
            newData: null,
          },
        });
      } catch (err) {
        console.error(`[AuditLog] Failed to log DELETE on ${modelName}:`, err);
      }
      return result;
    },
  };
}

/**
 * Creates a Prisma Client Extension that adds audit logging.
 * Each critical model gets update/delete interceptors.
 */
export function createAuditExtension(basePrisma: PrismaClient) {
  return {
    query: {
      product: makeAuditHooks(basePrisma, "product"),
      salesOrder: makeAuditHooks(basePrisma, "salesOrder"),
      purchaseOrder: makeAuditHooks(basePrisma, "purchaseOrder"),
      accountsPayable: makeAuditHooks(basePrisma, "accountsPayable"),
      accountsReceivable: makeAuditHooks(basePrisma, "accountsReceivable"),
      customer: makeAuditHooks(basePrisma, "customer"),
      supplier: makeAuditHooks(basePrisma, "supplier"),
      category: makeAuditHooks(basePrisma, "category"),
    },
  };
}
