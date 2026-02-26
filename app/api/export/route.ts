import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logError } from "@/lib/logger";
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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity");
  const format = searchParams.get("format") || "csv";
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!entity) {
    return NextResponse.json(
      { error: "Parâmetro 'entity' é obrigatório" },
      { status: 400 },
    );
  }

  // Mandatory Date Range Validation to prevent Serverless Timeouts and OOMs
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const differenceInDays =
      (end.getTime() - start.getTime()) / (1000 * 3600 * 24);

    if (differenceInDays > 90) {
      return NextResponse.json(
        {
          error:
            "O intervalo de datas não pode exceder 90 dias para otimização do sistema.",
        },
        { status: 400 },
      );
    }
  } else if (!startDate || !endDate) {
    // Determine if the entity REQUIRES dates (movements definitely do contextually)
    // To match the UI requirement:
    if (entity === "movements") {
      return NextResponse.json(
        {
          error:
            "Parâmetros 'startDate' e 'endDate' são obrigatórios para esta extração.",
        },
        { status: 400 },
      );
    }
  }

  try {
    const filename = getFilenameForEntity(entity);

    if (format === "xlsx") {
      // XLSX needs all data in memory to create the workbook
      const data = await fetchAllEntityData(entity, startDate, endDate);
      return buildXlsxResponse(data, filename);
    }

    // CSV uses streaming to avoid OOM
    return buildCsvStreamResponse(entity, filename, startDate, endDate);
  } catch (err: any) {
    // Fire-and-forget logger using Vercel waitUntil to avoid blocking the response
    // while keeping the serverless function alive long enough to send the webhook
    waitUntil(
      logError({
        path: "/api/export",
        message: err.message || "Erro global ao exportar dados",
        error: err,
        payload: { entity, format },
      }).catch(console.error),
    );

    return NextResponse.json(
      { error: err.message || "Erro ao exportar dados" },
      { status: 500 },
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────

type ExportRow = Record<string, string | number | null>;

function getFilenameForEntity(entity: string): string {
  switch (entity) {
    case "products":
      return "produtos";
    case "payables":
      return "contas-a-pagar";
    case "receivables":
      return "contas-a-receber";
    case "movements":
      return "movimentacoes";
    case "customers":
      return "clientes";
    case "suppliers":
      return "fornecedores";
    default:
      throw new Error(`Entidade '${entity}' não suportada para exportação`);
  }
}

// ─── Streaming Fetchers ───────────────────────────────────

/**
 * Yields pages of data for the given entity.
 */
async function* fetchEntityDataStream(
  entity: string,
  startDate?: string | null,
  endDate?: string | null,
  batchSize = 1000,
): AsyncGenerator<ExportRow[]> {
  let skip = 0;
  let hasMore = true;

  while (hasMore) {
    let rows: ExportRow[] = [];

    switch (entity) {
      case "products": {
        const products = await prisma.product.findMany({
          where: { deletedAt: null },
          include: { category: { select: { name: true } } },
          orderBy: { name: "asc" },
          skip,
          take: batchSize,
        });
        rows = products.map((p) => ({
          Nome: p.name,
          SKU: p.sku,
          Categoria: p.category?.name || "",
          "Preço Venda": Number(p.price),
          "Preço Custo": Number(p.costPrice),
          Quantidade: p.quantity,
          "Estoque Mínimo": p.minStock,
        }));
        break;
      }

      case "payables": {
        const payables = await prisma.accountsPayable.findMany({
          include: {
            purchaseOrder: {
              select: { code: true, supplier: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: batchSize,
        });
        rows = payables.map((p) => ({
          "Código OC": p.purchaseOrder.code,
          Fornecedor: p.purchaseOrder.supplier?.name || "",
          Valor: Number(p.amount),
          Status: p.status,
          Vencimento: p.dueDate ? p.dueDate.toISOString().split("T")[0] : "",
          "Pago em": p.paidAt ? p.paidAt.toISOString().split("T")[0] : "",
          "Criado em": p.createdAt.toISOString().split("T")[0],
        }));
        break;
      }

      case "receivables": {
        const receivables = await prisma.accountsReceivable.findMany({
          include: {
            salesOrder: {
              select: { code: true, customer: { select: { name: true } } },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: batchSize,
        });
        rows = receivables.map((r) => ({
          "Código PV": r.salesOrder.code,
          Cliente: r.salesOrder.customer?.name || "",
          Valor: Number(r.amount),
          Status: r.status,
          Vencimento: r.dueDate ? r.dueDate.toISOString().split("T")[0] : "",
          "Recebido em": r.receivedAt
            ? r.receivedAt.toISOString().split("T")[0]
            : "",
          "Criado em": r.createdAt.toISOString().split("T")[0],
        }));
        break;
      }

      case "movements": {
        const dateFilter: any = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          dateFilter.lte = end;
        }

        const movements = await prisma.stockMovement.findMany({
          where:
            Object.keys(dateFilter).length > 0
              ? { createdAt: dateFilter }
              : undefined,
          include: { product: { select: { name: true, sku: true } } },
          orderBy: { createdAt: "desc" },
          skip,
          take: batchSize,
        });
        rows = movements.map((m) => ({
          Produto: m.product.name,
          SKU: m.product.sku,
          Tipo: m.type === "IN" ? "Entrada" : "Saída",
          Quantidade: m.quantity,
          Motivo: m.reason || "",
          Data: m.createdAt.toISOString().split("T")[0],
        }));
        break;
      }

      case "customers": {
        const customers = await prisma.customer.findMany({
          where: { deletedAt: null },
          orderBy: { name: "asc" },
          skip,
          take: batchSize,
        });
        rows = customers.map((c) => ({
          Nome: c.name,
          "CPF/CNPJ": c.cpfCnpj || "",
          Email: c.email || "",
          Telefone: c.phone || "",
          Endereço: c.address || "",
        }));
        break;
      }

      case "suppliers": {
        const suppliers = await prisma.supplier.findMany({
          where: { deletedAt: null },
          orderBy: { name: "asc" },
          skip,
          take: batchSize,
        });
        rows = suppliers.map((s) => ({
          Nome: s.name,
          CNPJ: s.cnpj || "",
          Email: s.email || "",
          Telefone: s.phone || "",
        }));
        break;
      }

      default:
        throw new Error(`Entidade '${entity}' não suportada para exportação`);
    }

    if (rows.length < batchSize) {
      hasMore = false;
    }

    if (rows.length > 0) {
      skip += rows.length;
      yield rows;
    } else {
      hasMore = false;
    }
  }
}

/**
 * Fetches all data for XLSX (which inherently requires all data in memory).
 */
async function fetchAllEntityData(
  entity: string,
  startDate?: string | null,
  endDate?: string | null,
): Promise<ExportRow[]> {
  const allRows: ExportRow[] = [];
  for await (const chunk of fetchEntityDataStream(entity, startDate, endDate)) {
    allRows.push(...chunk);
  }
  return allRows;
}

// ─── Response Builders ────────────────────────────────────

function buildCsvStreamResponse(
  entity: string,
  filename: string,
  startDate?: string | null,
  endDate?: string | null,
) {
  const encoder = new TextEncoder();
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]); // UTF-8 BOM

  const stream = new ReadableStream({
    async start(controller) {
      // Send BOM
      controller.enqueue(bom);

      let isFirstChunk = true;

      try {
        for await (const chunk of fetchEntityDataStream(
          entity,
          startDate,
          endDate,
        )) {
          if (chunk.length === 0) continue;

          // Only output headers on the first chunk
          const csvString = Papa.unparse(chunk, {
            delimiter: ";",
            header: isFirstChunk,
          });

          // Add a newline at the end if it's not the first chunk (to separate from previous rows)
          // Papa.unparse doesn't add a trailing newline by default.
          const textToEnqueue = isFirstChunk
            ? csvString + "\r\n"
            : csvString + "\r\n";
          controller.enqueue(encoder.encode(textToEnqueue));

          isFirstChunk = false;
        }

        // If no data was yielded at all, output an empty CSV
        if (isFirstChunk) {
          controller.enqueue(encoder.encode("Nenhum registo encontrado\r\n"));
        }
      } catch (err) {
        console.error("Stream error:", err);
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.csv"`,
      "Transfer-Encoding": "chunked",
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
