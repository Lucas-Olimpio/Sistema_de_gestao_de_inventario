import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * Generic export API route.
 *
 * Query params:
 *  - entity: "products" | "payables" | "receivables" | "movements" | "customers" | "suppliers"
 *  - format: "csv" | "xlsx" (default: "csv")
 *
 * Returns a file download with Content-Disposition header.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity");
  const format = searchParams.get("format") || "csv";

  if (!entity) {
    return NextResponse.json(
      { error: "Parâmetro 'entity' é obrigatório" },
      { status: 400 },
    );
  }

  try {
    const { data, filename } = await fetchEntityData(entity);

    if (format === "xlsx") {
      return buildXlsxResponse(data, filename);
    }
    return buildCsvResponse(data, filename);
  } catch (err: any) {
    console.error("[Export]", err);
    return NextResponse.json(
      { error: err.message || "Erro ao exportar dados" },
      { status: 500 },
    );
  }
}

// ─── Data Fetchers ────────────────────────────────────────

type ExportRow = Record<string, string | number | null>;

async function fetchEntityData(
  entity: string,
): Promise<{ data: ExportRow[]; filename: string }> {
  switch (entity) {
    case "products": {
      const products = await prisma.product.findMany({
        where: { deletedAt: null },
        include: { category: { select: { name: true } } },
        orderBy: { name: "asc" },
      });
      return {
        filename: "produtos",
        data: products.map((p) => ({
          Nome: p.name,
          SKU: p.sku,
          Categoria: p.category?.name || "",
          "Preço Venda": Number(p.price),
          "Preço Custo": Number(p.costPrice),
          Quantidade: p.quantity,
          "Estoque Mínimo": p.minStock,
        })),
      };
    }

    case "payables": {
      const payables = await prisma.accountsPayable.findMany({
        include: {
          purchaseOrder: {
            select: { code: true, supplier: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return {
        filename: "contas-a-pagar",
        data: payables.map((p) => ({
          "Código OC": p.purchaseOrder.code,
          Fornecedor: p.purchaseOrder.supplier?.name || "",
          Valor: Number(p.amount),
          Status: p.status,
          Vencimento: p.dueDate ? p.dueDate.toISOString().split("T")[0] : "",
          "Pago em": p.paidAt ? p.paidAt.toISOString().split("T")[0] : "",
          "Criado em": p.createdAt.toISOString().split("T")[0],
        })),
      };
    }

    case "receivables": {
      const receivables = await prisma.accountsReceivable.findMany({
        include: {
          salesOrder: {
            select: { code: true, customer: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return {
        filename: "contas-a-receber",
        data: receivables.map((r) => ({
          "Código PV": r.salesOrder.code,
          Cliente: r.salesOrder.customer?.name || "",
          Valor: Number(r.amount),
          Status: r.status,
          Vencimento: r.dueDate ? r.dueDate.toISOString().split("T")[0] : "",
          "Recebido em": r.receivedAt
            ? r.receivedAt.toISOString().split("T")[0]
            : "",
          "Criado em": r.createdAt.toISOString().split("T")[0],
        })),
      };
    }

    case "movements": {
      const movements = await prisma.stockMovement.findMany({
        include: { product: { select: { name: true, sku: true } } },
        orderBy: { createdAt: "desc" },
        take: 5000, // Limit to avoid OOM on serverless
      });
      return {
        filename: "movimentacoes",
        data: movements.map((m) => ({
          Produto: m.product.name,
          SKU: m.product.sku,
          Tipo: m.type === "IN" ? "Entrada" : "Saída",
          Quantidade: m.quantity,
          Motivo: m.reason || "",
          Data: m.createdAt.toISOString().split("T")[0],
        })),
      };
    }

    case "customers": {
      const customers = await prisma.customer.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      });
      return {
        filename: "clientes",
        data: customers.map((c) => ({
          Nome: c.name,
          "CPF/CNPJ": c.cpfCnpj || "",
          Email: c.email || "",
          Telefone: c.phone || "",
          Endereço: c.address || "",
        })),
      };
    }

    case "suppliers": {
      const suppliers = await prisma.supplier.findMany({
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      });
      return {
        filename: "fornecedores",
        data: suppliers.map((s) => ({
          Nome: s.name,
          CNPJ: s.cnpj || "",
          Email: s.email || "",
          Telefone: s.phone || "",
        })),
      };
    }

    default:
      throw new Error(`Entidade '${entity}' não suportada para exportação`);
  }
}

// ─── Response Builders ────────────────────────────────────

function buildCsvResponse(data: ExportRow[], filename: string) {
  const csv = Papa.unparse(data, { delimiter: ";", header: true });
  // Use BOM for Excel compatibility with UTF-8
  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
    },
  });
}

function buildXlsxResponse(data: ExportRow[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}
