import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO: Altere este valor para gerar dados em         ║
// ║  períodos diferentes. Exemplos:                              ║
// ║    1  = último mês                                           ║
// ║    6  = últimos 6 meses                                      ║
// ║    12 = último ano                                           ║
// ║    24 = últimos 2 anos                                       ║
// ╚══════════════════════════════════════════════════════════════╝
const SEED_MONTHS = 6;

// ─── Helpers ────────────────────────────────────────────────────
function randomDate(from: Date, to: Date): Date {
  const diff = to.getTime() - from.getTime();
  return new Date(from.getTime() + Math.random() * diff);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(
    Math.floor(Math.random() * 14) + 7,
    Math.floor(Math.random() * 60),
    0,
    0,
  );
  return d;
}

function monthsAgoRange(): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - SEED_MONTHS);
  return { start, end };
}

/** Generate a date at a specific fraction of the timeline (0=start, 1=end) */
function dateAtFraction(fraction: number): Date {
  const { start, end } = monthsAgoRange();
  const diff = end.getTime() - start.getTime();
  const d = new Date(start.getTime() + diff * fraction);
  d.setHours(
    Math.floor(Math.random() * 14) + 7,
    Math.floor(Math.random() * 60),
    0,
    0,
  );
  return d;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let poCounter = 0;
function nextPOCode(): string {
  poCounter++;
  return `PO-${String(poCounter).padStart(4, "0")}`;
}

let vdCounter = 0;
function nextVDCode(): string {
  vdCounter++;
  return `VD-${String(vdCounter).padStart(4, "0")}`;
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  console.log(`\n🌱 Gerando seed para os últimos ${SEED_MONTHS} meses...\n`);

  const { start: periodStart, end: periodEnd } = monthsAgoRange();

  // Limpar dados existentes
  await prisma.accountsReceivable.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.goodsReceiptItem.deleteMany();
  await prisma.goodsReceipt.deleteMany();
  await prisma.accountsPayable.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  // ─── Categorias ────────────────────────────────────────────
  const categorias = await Promise.all([
    prisma.category.create({
      data: {
        name: "Eletrônicos",
        description: "Dispositivos eletrônicos e acessórios",
      },
    }),
    prisma.category.create({
      data: { name: "Móveis", description: "Móveis para escritório e casa" },
    }),
    prisma.category.create({
      data: { name: "Roupas", description: "Vestuário masculino e feminino" },
    }),
    prisma.category.create({
      data: {
        name: "Alimentos",
        description: "Produtos alimentícios em geral",
      },
    }),
    prisma.category.create({
      data: {
        name: "Ferramentas",
        description: "Ferramentas manuais e elétricas",
      },
    }),
  ]);

  const [eletronicos, moveis, roupas, alimentos, ferramentas] = categorias;

  // ─── Produtos ─────────────────────────────────────────────
  const produtosData = [
    {
      name: "Notebook Dell Inspiron",
      description: "Notebook 15.6 polegadas, 16GB RAM, 512GB SSD",
      sku: "ELET-001",
      price: 3599.99,
      quantity: 0,
      minStock: 5,
      categoryId: eletronicos.id,
    },
    {
      name: "Mouse Logitech MX Master",
      description: "Mouse sem fio ergonômico",
      sku: "ELET-002",
      price: 449.9,
      quantity: 0,
      minStock: 10,
      categoryId: eletronicos.id,
    },
    {
      name: "Teclado Mecânico Keychron",
      description: "Teclado mecânico wireless, switches brown",
      sku: "ELET-003",
      price: 699.0,
      quantity: 0,
      minStock: 8,
      categoryId: eletronicos.id,
    },
    {
      name: 'Monitor Samsung 27"',
      description: "Monitor IPS 4K, 60Hz",
      sku: "ELET-004",
      price: 2199.0,
      quantity: 0,
      minStock: 5,
      categoryId: eletronicos.id,
    },
    {
      name: "Mesa Escritório L",
      description: "Mesa em L para escritório, 1.60m x 1.40m",
      sku: "MOV-001",
      price: 899.0,
      quantity: 0,
      minStock: 3,
      categoryId: moveis.id,
    },
    {
      name: "Cadeira Ergonômica",
      description: "Cadeira ergonômica com apoio lombar",
      sku: "MOV-002",
      price: 1299.0,
      quantity: 0,
      minStock: 5,
      categoryId: moveis.id,
    },
    {
      name: "Estante Modular",
      description: "Estante modular de madeira, 5 prateleiras",
      sku: "MOV-003",
      price: 459.9,
      quantity: 0,
      minStock: 4,
      categoryId: moveis.id,
    },
    {
      name: "Camiseta Básica Algodão",
      description: "Camiseta 100% algodão, diversas cores",
      sku: "ROUP-001",
      price: 49.9,
      quantity: 0,
      minStock: 30,
      categoryId: roupas.id,
    },
    {
      name: "Calça Jeans Slim",
      description: "Calça jeans slim fit masculina",
      sku: "ROUP-002",
      price: 159.9,
      quantity: 0,
      minStock: 15,
      categoryId: roupas.id,
    },
    {
      name: "Jaqueta Impermeável",
      description: "Jaqueta corta-vento impermeável",
      sku: "ROUP-003",
      price: 289.0,
      quantity: 0,
      minStock: 10,
      categoryId: roupas.id,
    },
    {
      name: "Café Premium 500g",
      description: "Café torrado e moído, grãos selecionados",
      sku: "ALIM-001",
      price: 32.9,
      quantity: 0,
      minStock: 20,
      categoryId: alimentos.id,
    },
    {
      name: "Azeite Extra Virgem 500ml",
      description: "Azeite de oliva extra virgem importado",
      sku: "ALIM-002",
      price: 45.5,
      quantity: 0,
      minStock: 15,
      categoryId: alimentos.id,
    },
    {
      name: "Furadeira de Impacto",
      description: "Furadeira de impacto 750W com maleta",
      sku: "FERR-001",
      price: 349.9,
      quantity: 0,
      minStock: 5,
      categoryId: ferramentas.id,
    },
    {
      name: "Kit Chaves de Fenda",
      description: "Kit com 12 chaves de fenda e Phillips",
      sku: "FERR-002",
      price: 89.9,
      quantity: 0,
      minStock: 10,
      categoryId: ferramentas.id,
    },
    {
      name: "Serra Circular",
      description: 'Serra circular 7.1/4", 1400W',
      sku: "FERR-003",
      price: 599.0,
      quantity: 0,
      minStock: 3,
      categoryId: ferramentas.id,
    },
  ];

  const produtos = await Promise.all(
    produtosData.map((p) => prisma.product.create({ data: p })),
  );

  // ─── Fornecedores ─────────────────────────────────────────
  const fornecedores = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "TechDistribuidora Ltda",
        cnpj: "12.345.678/0001-90",
        email: "vendas@techdistribuidora.com.br",
        phone: "(11) 3456-7890",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Casa & Conforto SA",
        cnpj: "23.456.789/0001-01",
        email: "comercial@casaeconforto.com.br",
        phone: "(21) 2345-6789",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Moda Express Ltda",
        cnpj: "34.567.890/0001-12",
        email: "pedidos@modaexpress.com.br",
        phone: "(31) 9876-5432",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Ferragens Nacional",
        cnpj: "45.678.901/0001-23",
        email: "contato@ferragensnacional.com.br",
        phone: "(41) 3333-4444",
      },
    }),
    prisma.supplier.create({
      data: {
        name: "AgroFoods Distribuidora",
        cnpj: "56.789.012/0001-34",
        email: "vendas@agrofoods.com.br",
        phone: "(51) 4444-5555",
      },
    }),
  ]);

  // ─── Clientes ─────────────────────────────────────────────
  const clientes = await Promise.all([
    prisma.customer.create({
      data: {
        name: "João Silva",
        cpfCnpj: "123.456.789-00",
        email: "joao.silva@email.com",
        phone: "(11) 98765-4321",
        address: "Rua das Flores, 123 - São Paulo/SP",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Maria Oliveira",
        cpfCnpj: "987.654.321-00",
        email: "maria@oliveira.com",
        phone: "(21) 99876-5432",
        address: "Av. Brasil, 456 - Rio de Janeiro/RJ",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Tech Solutions Ltda",
        cpfCnpj: "56.789.012/0001-34",
        email: "compras@techsolutions.com.br",
        phone: "(31) 3333-2222",
        address: "Rua da Inovação, 789 - Belo Horizonte/MG",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Ana Costa",
        cpfCnpj: "456.789.012-33",
        email: "ana.costa@email.com",
        phone: "(41) 98888-7777",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Carlos Mendes",
        cpfCnpj: "321.654.987-11",
        email: "carlos.mendes@email.com",
        phone: "(51) 97777-6666",
        address: "Rua dos Pinheiros, 321 - Porto Alegre/RS",
      },
    }),
    prisma.customer.create({
      data: {
        name: "Escritório Total Ltda",
        cpfCnpj: "67.890.123/0001-45",
        email: "compras@escritoriototal.com.br",
        phone: "(61) 3456-7890",
        address: "SQN 308 Bloco A - Brasília/DF",
      },
    }),
  ]);

  // ─── Gerar Ordens de Compra distribuídas no tempo ────────
  // Dividir o período em fatias para distribuição uniforme
  const totalPOs = Math.max(8, SEED_MONTHS * 2); // ~2 POs por mês
  const poStatuses = [
    "RECEBIDA",
    "RECEBIDA",
    "RECEBIDA",
    "EM_TRANSITO",
    "APROVADA",
    "PENDENTE",
    "CANCELADA",
  ];

  let totalMovements = 0;
  let totalPayables = 0;
  let totalReceipts = 0;

  for (let i = 0; i < totalPOs; i++) {
    const fraction = i / totalPOs;
    const poDate = dateAtFraction(fraction);
    const supplier = fornecedores[i % fornecedores.length];
    const status = poStatuses[i % poStatuses.length];

    // Pick 2-3 random products for each PO
    const numItems = randomInt(2, 3);
    const shuffled = [...produtos].sort(() => Math.random() - 0.5);
    const poProducts = shuffled.slice(0, numItems);

    const items = poProducts.map((p) => ({
      productId: p.id,
      quantity: randomInt(5, 50),
      unitPrice: p.price * (0.7 + Math.random() * 0.2), // 70-90% of retail
    }));

    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const po = await prisma.purchaseOrder.create({
      data: {
        code: nextPOCode(),
        supplierId: supplier.id,
        status,
        totalValue,
        notes: `Pedido de compra gerado automaticamente`,
        createdAt: poDate,
        items: {
          create:
            status === "RECEBIDA"
              ? items.map((it) => ({ ...it, receivedQty: it.quantity }))
              : items,
        },
      },
    });

    // For RECEBIDA: create goods receipt, stock movements, accounts payable
    if (status === "RECEBIDA") {
      const receiptDate = new Date(
        poDate.getTime() + randomInt(1, 7) * 86400000,
      );

      await prisma.goodsReceipt.create({
        data: {
          purchaseOrderId: po.id,
          notes: "Recebimento completo",
          createdAt: receiptDate,
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              receivedQty: it.quantity,
              hasDivergence: false,
            })),
          },
        },
      });

      totalReceipts++;

      for (const item of items) {
        // Stock IN movement
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: "IN",
            quantity: item.quantity,
            reason: `Recebimento ${po.code}`,
            createdAt: receiptDate,
          },
        });

        // Update product stock
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });

        totalMovements++;
      }

      // Accounts payable - some paid, some pending
      const isPaid = fraction < 0.7; // Older POs are paid
      const payDate = new Date(
        receiptDate.getTime() + randomInt(7, 30) * 86400000,
      );

      await prisma.accountsPayable.create({
        data: {
          purchaseOrderId: po.id,
          amount: totalValue,
          status: isPaid ? "PAGO" : "PENDENTE",
          paidAt: isPaid ? payDate : null,
          createdAt: receiptDate,
        },
      });

      totalPayables++;
    }
  }

  // ─── Gerar Ordens de Venda distribuídas no tempo ──────────
  const totalSOs = Math.max(8, SEED_MONTHS * 3); // ~3 SOs por mês
  const soStatuses = [
    "FATURADA",
    "FATURADA",
    "FATURADA",
    "APROVADA",
    "PENDENTE",
    "CANCELADA",
  ];

  let totalReceivables = 0;

  for (let i = 0; i < totalSOs; i++) {
    const fraction = (i + 0.2) / totalSOs; // Offset to not overlap with POs
    const soDate = dateAtFraction(fraction);
    const customer = clientes[i % clientes.length];
    const status = soStatuses[i % soStatuses.length];

    // Pick 1-3 random products
    const numItems = randomInt(1, 3);
    const shuffled = [...produtos].sort(() => Math.random() - 0.5);
    const soProducts = shuffled.slice(0, numItems);

    const items = soProducts.map((p) => ({
      productId: p.id,
      quantity: randomInt(1, 10),
      unitPrice: p.price,
    }));

    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const so = await prisma.salesOrder.create({
      data: {
        code: nextVDCode(),
        customerId: customer.id,
        status,
        totalValue,
        notes: `Pedido de venda gerado automaticamente`,
        createdAt: soDate,
        items: { create: items },
      },
    });

    // For FATURADA: stock OUT + accounts receivable
    if (status === "FATURADA") {
      const invoiceDate = new Date(
        soDate.getTime() + randomInt(0, 3) * 86400000,
      );

      for (const item of items) {
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: "OUT",
            quantity: item.quantity,
            reason: `Venda ${so.code}`,
            createdAt: invoiceDate,
          },
        });

        // Decrement stock (allow negative for seed data)
        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });

        totalMovements++;
      }

      // Accounts receivable - some received, some pending
      const isReceived = fraction < 0.6;
      const receivedDate = new Date(
        invoiceDate.getTime() + randomInt(7, 30) * 86400000,
      );

      await prisma.accountsReceivable.create({
        data: {
          salesOrderId: so.id,
          amount: totalValue,
          status: isReceived ? "RECEBIDO" : "PENDENTE",
          receivedAt: isReceived ? receivedDate : null,
          createdAt: invoiceDate,
        },
      });

      totalReceivables++;
    }
  }

  // ─── Movimentações extras (avulsas) ───────────────────────
  // Gerar movimentações avulsas distribuídas para mais volume nos gráficos
  const extraMovements = Math.max(10, SEED_MONTHS * 4);

  for (let i = 0; i < extraMovements; i++) {
    const fraction = i / extraMovements;
    const movDate = dateAtFraction(fraction);
    const product = produtos[i % produtos.length];
    const isIn = Math.random() > 0.4; // 60% IN, 40% OUT
    const qty = randomInt(2, 30);

    const inReasons = [
      "Compra do fornecedor",
      "Reposição de estoque",
      "Devolução de cliente",
      "Transferência entre filiais",
      "Ajuste de inventário",
    ];
    const outReasons = [
      "Venda online",
      "Venda loja física",
      "Venda atacado",
      "Perda/avaria",
      "Amostra para cliente",
    ];

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: isIn ? "IN" : "OUT",
        quantity: qty,
        reason: isIn
          ? inReasons[i % inReasons.length]
          : outReasons[i % outReasons.length],
        createdAt: movDate,
      },
    });

    // Update stock
    await prisma.product.update({
      where: { id: product.id },
      data: {
        quantity: isIn ? { increment: qty } : { decrement: qty },
      },
    });

    totalMovements++;
  }

  // ─── Relatório ────────────────────────────────────────────
  console.log("✅ Seed concluído com sucesso!");
  console.log(
    `  📅 Período: ${periodStart.toLocaleDateString("pt-BR")} a ${periodEnd.toLocaleDateString("pt-BR")} (${SEED_MONTHS} meses)`,
  );
  console.log(`  📦 ${categorias.length} categorias criadas`);
  console.log(`  📋 ${produtos.length} produtos criados`);
  console.log(`  🏭 ${fornecedores.length} fornecedores criados`);
  console.log(`  👥 ${clientes.length} clientes criados`);
  console.log(`  🛒 ${totalPOs} ordens de compra criadas`);
  console.log(`  📥 ${totalReceipts} recebimentos criados`);
  console.log(`  💰 ${totalPayables} contas a pagar criadas`);
  console.log(`  🛍️  ${totalSOs} pedidos de venda criados`);
  console.log(`  💵 ${totalReceivables} contas a receber criadas`);
  console.log(`  📊 ${totalMovements} movimentações de estoque criadas`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
