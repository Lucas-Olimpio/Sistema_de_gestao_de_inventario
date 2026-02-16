import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { fakerPT_BR as faker } from "@faker-js/faker";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const normalizedPath = dbPath.replace(/\\/g, "/");
const finalUrl = `file:///${normalizedPath}`;

const adapter = new PrismaLibSql({ url: finalUrl });

const prisma = new PrismaClient({ adapter });

// ╔══════════════════════════════════════════════════════════════╗
// ║  CONFIGURAÇÃO: Altere este valor para gerar dados em         ║
// ║  períodos diferentes. Exemplos:                              ║
// ║    npx tsx prisma/seed.ts 12                                 ║
// ║    1  = último mês                                           ║
// ║    6  = últimos 6 meses                                      ║
// ║    12 = último ano                                           ║
// ║    24 = últimos 2 anos                                       ║
// ╚══════════════════════════════════════════════════════════════╝

const args = process.argv.slice(2);
const SEED_MONTHS = args[0] ? parseInt(args[0]) : 6;

// ─── Helpers ────────────────────────────────────────────────────
function randomInt(min: number, max: number): number {
  return faker.number.int({ min, max });
}

function randomFloat(min: number, max: number): number {
  return faker.number.float({ min, max, fractionDigits: 2 });
}

// ─── Main ───────────────────────────────────────────────────────
async function main() {
  console.log(
    `\n🌱 Gerando seed totalmente aleatório para os últimos ${SEED_MONTHS} meses...\n`,
  );

  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - SEED_MONTHS);

  // Limpar dados existentes
  console.log("🧹 Limpando banco de dados...");
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
  console.log("📂 Criando categorias...");
  const numCategories = 8;
  const categoriesData = faker.helpers.uniqueArray(
    () => faker.commerce.department(),
    numCategories,
  );

  const categories = await Promise.all(
    categoriesData.map((name) =>
      prisma.category.create({
        data: {
          name,
          description: faker.lorem.sentence(),
        },
      }),
    ),
  );

  // ─── Produtos ─────────────────────────────────────────────
  console.log("📦 Criando produtos...");
  const numProducts = 60;
  const products = [];

  for (let i = 0; i < numProducts; i++) {
    const category = categories[randomInt(0, categories.length - 1)];
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        sku: faker.string.alphanumeric({ length: 8, casing: "upper" }),
        price: parseFloat(faker.commerce.price({ min: 10, max: 5000 })),
        quantity: 0, // Será atualizado por movimentações
        minStock: randomInt(5, 20),
        categoryId: category.id,
      },
    });
    products.push(product);
  }

  // ─── Fornecedores ─────────────────────────────────────────
  console.log("🏭 Criando fornecedores...");
  const numSuppliers = 12;
  const suppliers = [];

  for (let i = 0; i < numSuppliers; i++) {
    const supplier = await prisma.supplier.create({
      data: {
        name: faker.company.name(),
        cnpj: faker.string
          .numeric(14)
          .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"), // Formato CNPJ
        email: faker.internet.email(),
        phone: faker.phone.number(),
      },
    });
    suppliers.push(supplier);
  }

  // ─── Clientes ─────────────────────────────────────────────
  console.log("👥 Criando clientes...");
  const numCustomers = 30;
  const customers = [];

  for (let i = 0; i < numCustomers; i++) {
    const isCompany = faker.datatype.boolean();
    const customer = await prisma.customer.create({
      data: {
        name: isCompany ? faker.company.name() : faker.person.fullName(),
        cpfCnpj: isCompany
          ? faker.string
              .numeric(14)
              .replace(
                /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                "$1.$2.$3/$4-$5",
              )
          : faker.string
              .numeric(11)
              .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4"),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: `${faker.location.streetAddress()} - ${faker.location.city()}/${faker.location.state({ abbreviated: true })}`,
      },
    });
    customers.push(customer);
  }

  // ─── Gerar Ordens de Compra ─────────────────────────────
  console.log("🛒 Gerando ordens de compra...");
  const numPOs = Math.max(15, SEED_MONTHS * 4); // ~4 POs/mês
  const poStatuses = [
    "RECEBIDA",
    "RECEBIDA",
    "RECEBIDA",
    "EM_TRANSITO",
    "APROVADA",
    "PENDENTE",
    "CANCELADA",
  ];

  let totalReceipts = 0;
  let totalPayables = 0;
  let totalMovements = 0;

  // Gerar datas aleatórias ordenadas para parecer realista
  const poDates = Array.from({ length: numPOs })
    .map(() => faker.date.between({ from: start, to: end }))
    .sort((a, b) => a.getTime() - b.getTime());

  let poCounter = 0;

  for (let i = 0; i < numPOs; i++) {
    const poDate = poDates[i];
    const supplier = suppliers[randomInt(0, suppliers.length - 1)];
    const status = faker.helpers.arrayElement(poStatuses);

    // 2-5 produtos por PO
    const numItems = randomInt(2, 5);
    const poProducts = faker.helpers.arrayElements(products, numItems);

    const items = poProducts.map((p) => ({
      productId: p.id,
      quantity: randomInt(10, 100),
      unitPrice: Number(p.price) * randomFloat(0.6, 0.9), // Custo mais baixo que venda
    }));

    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    poCounter++;
    const poCode = `PO-${String(poCounter).padStart(5, "0")}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        code: poCode,
        supplierId: supplier.id,
        status,
        totalValue,
        notes: faker.lorem.sentence(),
        createdAt: poDate,
        items: {
          create:
            status === "RECEBIDA"
              ? items.map((it) => ({ ...it, receivedQty: it.quantity }))
              : items,
        },
      },
    });

    if (status === "RECEBIDA") {
      const receiptDate = faker.date.between({
        from: poDate,
        to: new Date(poDate.getTime() + 7 * 24 * 60 * 60 * 1000),
      });

      await prisma.goodsReceipt.create({
        data: {
          purchaseOrderId: po.id,
          notes: "Recebimento automático",
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
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: "IN",
            quantity: item.quantity,
            reason: `Recebimento ${po.code}`,
            createdAt: receiptDate,
          },
        });

        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        });
        totalMovements++;
      }

      const isPaid = faker.datatype.boolean(); // 50% pago
      const dueDate = new Date(
        receiptDate.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
      const paidAt = isPaid
        ? faker.date.between({ from: receiptDate, to: dueDate })
        : null;

      await prisma.accountsPayable.create({
        data: {
          purchaseOrderId: po.id,
          amount: totalValue,
          status: isPaid ? "PAGO" : "PENDENTE",
          dueDate,
          paidAt: isPaid ? paidAt : null,
          createdAt: receiptDate,
        },
      });
      totalPayables++;
    }
  }

  // ─── Gerar Ordens de Venda ─────────────────────────────
  console.log("🛍️  Gerando ordens de venda...");
  const numSOs = Math.max(30, SEED_MONTHS * 10); // ~10 SOs/mês
  const soStatuses = [
    "FATURADA",
    "FATURADA",
    "FATURADA",
    "APROVADA",
    "PENDENTE",
    "CANCELADA",
  ];

  let totalReceivables = 0;

  const soDates = Array.from({ length: numSOs })
    .map(() => faker.date.between({ from: start, to: end }))
    .sort((a, b) => a.getTime() - b.getTime());

  let soCounter = 0;

  for (let i = 0; i < numSOs; i++) {
    const soDate = soDates[i];
    const customer = customers[randomInt(0, customers.length - 1)];
    const status = faker.helpers.arrayElement(soStatuses);

    // 1-4 produtos por venda
    const numItems = randomInt(1, 4);
    const soProducts = faker.helpers.arrayElements(products, numItems);

    const items = soProducts.map((p) => ({
      productId: p.id,
      quantity: randomInt(1, 5),
      unitPrice: Number(p.price), // Preço cheio
    }));

    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    soCounter++;
    const soCode = `VD-${String(soCounter).padStart(5, "0")}`;

    const hasInstallments = faker.datatype.boolean(); // 50% chance of installments
    const installmentsData: any[] = [];

    if (hasInstallments) {
      const numInstallments = randomInt(2, 6);
      const installmentAmount = Number(totalValue) / numInstallments;

      for (let k = 1; k <= numInstallments; k++) {
        const dueDate = new Date(soDate);
        dueDate.setMonth(dueDate.getMonth() + k);

        installmentsData.push({
          number: k,
          amount: installmentAmount,
          dueDate: dueDate,
          status: "PENDENTE",
        });
      }
    }

    const so = await prisma.salesOrder.create({
      data: {
        code: soCode,
        customerId: customer.id,
        status,
        totalValue,
        notes: faker.lorem.sentence(),
        createdAt: soDate,
        items: { create: items },
        installments:
          installmentsData.length > 0
            ? { create: installmentsData }
            : undefined,
      },
    });

    if (status === "FATURADA") {
      const invoiceDate = faker.date.between({
        from: soDate,
        to: new Date(soDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      });

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

        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
        totalMovements++;
      }

      if (installmentsData.length > 0) {
        // Create Receivables from Installments
        for (const inst of installmentsData) {
          const isReceived = faker.datatype.boolean();
          const receivedAt = isReceived
            ? faker.date.between({ from: invoiceDate, to: inst.dueDate })
            : null;

          await prisma.accountsReceivable.create({
            data: {
              salesOrderId: so.id,
              amount: inst.amount,
              status: isReceived ? "RECEBIDO" : "PENDENTE",
              dueDate: inst.dueDate,
              receivedAt: isReceived ? receivedAt : null,
              createdAt: invoiceDate,
            },
          });
          totalReceivables++;
        }
      } else {
        // Single Receivable
        const isReceived = faker.datatype.boolean();
        const dueDate = new Date(
          invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000,
        );
        const receivedAt = isReceived
          ? faker.date.between({ from: invoiceDate, to: dueDate })
          : null;

        await prisma.accountsReceivable.create({
          data: {
            salesOrderId: so.id,
            amount: totalValue,
            status: isReceived ? "RECEBIDO" : "PENDENTE",
            dueDate,
            receivedAt: isReceived ? receivedAt : null,
            createdAt: invoiceDate,
          },
        });
        totalReceivables++;
      }
    }
  }

  // ─── Movimentações Extras ─────────────────────────────
  console.log("📊 Gerando movimentações extras...");
  const extraMovements = Math.max(20, SEED_MONTHS * 5);

  for (let i = 0; i < extraMovements; i++) {
    const movDate = faker.date.between({ from: start, to: end });
    const product = products[randomInt(0, products.length - 1)];
    const isIn = faker.datatype.boolean(); // 50/50
    const qty = randomInt(1, 10);

    // Evitar saldo negativo excessivo se for OUT
    // Mas para seed, deixaremos passar para ver "casos reais"

    const inReasons = ["Ajuste de Estoque", "Devolução", "Bonificação"];
    const outReasons = ["Perda", "Avaria", "Uso Interno", "Ajuste de Estoque"];

    await prisma.stockMovement.create({
      data: {
        productId: product.id,
        type: isIn ? "IN" : "OUT",
        quantity: qty,
        reason: faker.helpers.arrayElement(isIn ? inReasons : outReasons),
        createdAt: movDate,
      },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        quantity: isIn ? { increment: qty } : { decrement: qty },
      },
    });
    totalMovements++;
  }

  const duration = (new Date().getTime() - new Date().getTime()) / 1000;
  console.log("\n✅ Seed concluído com sucesso!");
  console.log(
    `  📅 Período: ${start.toLocaleDateString()} a ${end.toLocaleDateString()}`,
  );
  console.log(`  📦 ${numCategories} categorias`);
  console.log(`  📋 ${numProducts} produtos base`);
  console.log(`  🏭 ${numSuppliers} fornecedores`);
  console.log(`  👥 ${numCustomers} clientes`);
  console.log(`  🛒 ${numPOs} ordens de compra`);
  console.log(`  🛍️  ${numSOs} pedidos de venda`);
  console.log(`  📊 +${totalMovements} movimentações de estoque`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
