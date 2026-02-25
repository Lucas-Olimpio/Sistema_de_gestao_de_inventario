import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { fakerPT_BR as faker } from "@faker-js/faker";
import { hashSync } from "bcryptjs";
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

function toDecimal(value: number): number {
  return Math.round(value * 100) / 100;
}

// ─── In-memory stock tracker (FIX #6 & #7) ──────────────────────
const stockTracker: Record<string, number> = {};

function getStock(productId: string): number {
  return stockTracker[productId] || 0;
}

function addStock(productId: string, qty: number): void {
  stockTracker[productId] = (stockTracker[productId] || 0) + qty;
}

function removeStock(productId: string, qty: number): boolean {
  const current = getStock(productId);
  if (current < qty) return false;
  stockTracker[productId] = current - qty;
  return true;
}

// ─── Cost tracker for weighted average (FIX #4) ─────────────────
const costTracker: Record<string, { totalCost: number; totalQty: number }> = {};

function updateWeightedCost(
  productId: string,
  receivedQty: number,
  unitCost: number,
): number {
  const current = costTracker[productId] || { totalCost: 0, totalQty: 0 };
  const newTotalCost = current.totalCost + receivedQty * unitCost;
  const newTotalQty = current.totalQty + receivedQty;
  const avgCost = newTotalQty > 0 ? newTotalCost / newTotalQty : unitCost;
  costTracker[productId] = { totalCost: newTotalCost, totalQty: newTotalQty };
  return avgCost;
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
  await prisma.transaction.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.installment.deleteMany();
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
  await prisma.user.deleteMany();

  // ─── Utilizador Admin ─────────────────────────────────────
  console.log("🔐 Criando utilizador admin...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@invenpro.com",
      password: hashSync("admin123", 12),
      role: "ADMIN",
    },
  });

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

  // ─── Produtos (FIX #5: Decimal) ───────────────────────────
  console.log("📦 Criando produtos...");
  const numProducts = 60;
  const products = [];

  for (let i = 0; i < numProducts; i++) {
    const category = categories[randomInt(0, categories.length - 1)];
    const price = parseFloat(faker.commerce.price({ min: 10, max: 5000 }));
    const product = await prisma.product.create({
      data: {
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        sku: faker.string.alphanumeric({ length: 8, casing: "upper" }),
        price: toDecimal(price), // FIX #5
        costPrice: toDecimal(0), // FIX #4: Will be calculated from receipts
        quantity: 0,
        minStock: randomInt(5, 20),
        categoryId: category.id,
      },
    });
    products.push({ ...product, _price: price });
    stockTracker[product.id] = 0;
    costTracker[product.id] = { totalCost: 0, totalQty: 0 };
  }

  // ─── Audit Logs for products (FIX #3) ──────────────────────
  console.log("📝 Gerando audit logs para produtos...");
  for (const p of products) {
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "CREATE",
        entity: "Product",
        entityId: p.id,
        newData: JSON.stringify({ name: p.name, sku: p.sku, price: p._price }),
        createdAt: faker.date.between({ from: start, to: end }),
      },
    });
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
          .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5"),
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
  const numPOs = Math.max(15, SEED_MONTHS * 4);
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
  let totalStatusHistory = 0;
  let totalAuditLogs = products.length; // Already created for products

  const poDates = Array.from({ length: numPOs })
    .map(() => faker.date.between({ from: start, to: end }))
    .sort((a, b) => a.getTime() - b.getTime());

  let poCounter = 0;

  for (let i = 0; i < numPOs; i++) {
    const poDate = poDates[i];
    const supplier = suppliers[randomInt(0, suppliers.length - 1)];
    const status = faker.helpers.arrayElement(poStatuses);

    const numItems = randomInt(2, 5);
    const poProducts = faker.helpers.arrayElements(products, numItems);

    const items = poProducts.map((p) => ({
      productId: p.id,
      quantity: randomInt(10, 100),
      unitPrice: p._price * randomFloat(0.6, 0.9),
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
        totalValue: toDecimal(totalValue), // FIX #5
        notes: faker.lorem.sentence(),
        createdAt: poDate,
        items: {
          create:
            status === "RECEBIDA"
              ? items.map((it) => ({
                  ...it,
                  unitPrice: toDecimal(it.unitPrice), // FIX #5
                  receivedQty: it.quantity,
                }))
              : items.map((it) => ({
                  ...it,
                  unitPrice: toDecimal(it.unitPrice), // FIX #5
                })),
        },
      },
    });

    // FIX #1: Generate OrderStatusHistory for POs with advanced statuses
    const poTransitions: Record<string, string[]> = {
      PENDENTE: [],
      APROVADA: ["PENDENTE"],
      EM_TRANSITO: ["PENDENTE", "APROVADA"],
      RECEBIDA: ["PENDENTE", "APROVADA", "EM_TRANSITO"],
      CANCELADA: ["PENDENTE"],
    };

    const history = poTransitions[status] || [];
    let prevStatus: string | null = null;
    for (const histStatus of [...history, status]) {
      const histDate = new Date(
        poDate.getTime() -
          (history.length - (totalStatusHistory % 10)) * 86400000,
      );
      await prisma.orderStatusHistory.create({
        data: {
          orderId: po.id,
          orderType: "PURCHASE",
          oldStatus: prevStatus,
          newStatus: histStatus,
          changedBy: "SYSTEM",
          changedAt: histDate > poDate ? poDate : histDate,
        },
      });
      prevStatus = histStatus;
      totalStatusHistory++;
    }

    // FIX #3: Audit log for PO
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "CREATE",
        entity: "PurchaseOrder",
        entityId: po.id,
        newData: JSON.stringify({
          code: poCode,
          status,
          totalValue: totalValue.toFixed(2),
        }),
        createdAt: poDate,
      },
    });
    totalAuditLogs++;

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

        // FIX #6: Track stock in memory
        addStock(item.productId, item.quantity);

        // FIX #4: Calculate weighted average cost
        const newCostPrice = updateWeightedCost(
          item.productId,
          item.quantity,
          item.unitPrice,
        );

        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: { increment: item.quantity },
            costPrice: toDecimal(newCostPrice), // FIX #4 + #5
          },
        });
        totalMovements++;
      }

      const isPaid = faker.datatype.boolean();
      const dueDate = new Date(
        receiptDate.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
      const paidAt = isPaid
        ? faker.date.between({ from: receiptDate, to: dueDate })
        : null;

      await prisma.accountsPayable.create({
        data: {
          purchaseOrderId: po.id,
          amount: toDecimal(totalValue), // FIX #5
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
  const numSOs = Math.max(30, SEED_MONTHS * 10);
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
  let skippedFaturada = 0;

  for (let i = 0; i < numSOs; i++) {
    const soDate = soDates[i];
    const customer = customers[randomInt(0, customers.length - 1)];
    let status = faker.helpers.arrayElement(soStatuses);

    const numItems = randomInt(1, 4);
    const soProducts = faker.helpers.arrayElements(products, numItems);

    const items = soProducts.map((p) => ({
      productId: p.id,
      quantity: randomInt(1, 5),
      unitPrice: p._price,
    }));

    // FIX #7: For FATURADA, check if stock is sufficient for all items
    if (status === "FATURADA") {
      const canFulfill = items.every(
        (item) => getStock(item.productId) >= item.quantity,
      );
      if (!canFulfill) {
        status = "APROVADA"; // Downgrade to APROVADA if not enough stock
        skippedFaturada++;
      }
    }

    const totalValue = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    soCounter++;
    const soCode = `VD-${String(soCounter).padStart(5, "0")}`;

    const hasInstallments = faker.datatype.boolean();
    const installmentsData: any[] = [];

    if (hasInstallments) {
      const numInstallments = randomInt(2, 6);
      const installmentAmount = totalValue / numInstallments;

      for (let k = 1; k <= numInstallments; k++) {
        const dueDate = new Date(soDate);
        dueDate.setMonth(dueDate.getMonth() + k);

        installmentsData.push({
          number: k,
          amount: toDecimal(installmentAmount), // FIX #5
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
        totalValue: toDecimal(totalValue), // FIX #5
        notes: faker.lorem.sentence(),
        createdAt: soDate,
        items: {
          create: items.map((it) => ({
            ...it,
            unitPrice: toDecimal(it.unitPrice), // FIX #5
          })),
        },
        installments:
          installmentsData.length > 0
            ? { create: installmentsData }
            : undefined,
      },
    });

    // FIX #1: Generate OrderStatusHistory for SOs
    const soTransitions: Record<string, string[]> = {
      PENDENTE: [],
      APROVADA: ["PENDENTE"],
      FATURADA: ["PENDENTE", "APROVADA"],
      CANCELADA: ["PENDENTE"],
    };

    const soHistory = soTransitions[status] || [];
    let soPrevStatus: string | null = null;
    for (const histStatus of [...soHistory, status]) {
      await prisma.orderStatusHistory.create({
        data: {
          orderId: so.id,
          orderType: "SALES",
          oldStatus: soPrevStatus,
          newStatus: histStatus,
          changedBy: "SYSTEM",
          changedAt: soDate,
        },
      });
      soPrevStatus = histStatus;
      totalStatusHistory++;
    }

    // FIX #3: Audit log for SO
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "CREATE",
        entity: "SalesOrder",
        entityId: so.id,
        newData: JSON.stringify({
          code: soCode,
          status,
          totalValue: totalValue.toFixed(2),
        }),
        createdAt: soDate,
      },
    });
    totalAuditLogs++;

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

        // FIX #6 & #7: removeStock already validated above
        removeStock(item.productId, item.quantity);

        await prisma.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
        totalMovements++;
      }

      if (installmentsData.length > 0) {
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
            amount: toDecimal(totalValue), // FIX #5
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

  // ─── Movimentações Extras (FIX #6: stock-safe) ────────────
  console.log("📊 Gerando movimentações extras...");
  const extraMovements = Math.max(20, SEED_MONTHS * 5);

  for (let i = 0; i < extraMovements; i++) {
    const movDate = faker.date.between({ from: start, to: end });
    const product = products[randomInt(0, products.length - 1)];
    let isIn = faker.datatype.boolean();
    const qty = randomInt(1, 10);

    // FIX #6: Only allow OUT if the product has enough stock
    if (!isIn && getStock(product.id) < qty) {
      isIn = true; // Force IN when stock is insufficient
    }

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

    if (isIn) {
      addStock(product.id, qty);
    } else {
      removeStock(product.id, qty);
    }

    await prisma.product.update({
      where: { id: product.id },
      data: {
        quantity: isIn ? { increment: qty } : { decrement: qty },
      },
    });
    totalMovements++;
  }

  // ─── Contas Bancárias e Transações (FIX #2) ────────────────
  console.log("🏦 Gerando contas bancárias e transações...");

  const bankAccounts = [
    {
      name: "Conta Principal",
      bankName: "Banco do Brasil",
      accountNumber: "12345-6",
    },
    { name: "Conta Operacional", bankName: "Itaú", accountNumber: "78901-2" },
    { name: "Poupança", bankName: "Caixa Econômica", accountNumber: "34567-8" },
  ];

  const createdBankAccounts = [];
  for (const ba of bankAccounts) {
    const account = await prisma.bankAccount.create({
      data: {
        name: ba.name,
        bankName: ba.bankName,
        accountNumber: ba.accountNumber,
        currentBalance: toDecimal(randomFloat(5000, 50000)),
      },
    });
    createdBankAccounts.push(account);
  }

  // Generate realistic transactions
  const numTransactions = Math.max(30, SEED_MONTHS * 8);
  const txDates = Array.from({ length: numTransactions })
    .map(() => faker.date.between({ from: start, to: end }))
    .sort((a, b) => a.getTime() - b.getTime());

  const creditDescriptions = [
    "Recebimento de cliente",
    "Pagamento de fatura",
    "Receita de venda",
    "Transferência recebida",
    "Devolução de fornecedor",
  ];
  const debitDescriptions = [
    "Pagamento a fornecedor",
    "Despesa operacional",
    "Salários",
    "Aluguel",
    "Conta de energia",
    "Internet/Telecom",
    "Material de escritório",
  ];

  for (let i = 0; i < numTransactions; i++) {
    const isCredit = faker.datatype.boolean();
    const account =
      createdBankAccounts[randomInt(0, createdBankAccounts.length - 1)];
    const amount = randomFloat(100, 10000);

    await prisma.transaction.create({
      data: {
        bankAccountId: account.id,
        amount: toDecimal(amount),
        type: isCredit ? "CREDIT" : "DEBIT",
        description: faker.helpers.arrayElement(
          isCredit ? creditDescriptions : debitDescriptions,
        ),
        referenceId: faker.string.alphanumeric(8),
        createdAt: txDates[i],
      },
    });
  }

  // ─── Summary ───────────────────────────────────────────────
  console.log("\n✅ Seed concluído com sucesso!");
  console.log(
    `  📅 Período: ${start.toLocaleDateString()} a ${end.toLocaleDateString()}`,
  );
  console.log(`  🔐 1 utilizador admin`);
  console.log(`  📦 ${numCategories} categorias`);
  console.log(`  📋 ${numProducts} produtos base`);
  console.log(`  🏭 ${numSuppliers} fornecedores`);
  console.log(`  👥 ${numCustomers} clientes`);
  console.log(`  🛒 ${numPOs} ordens de compra`);
  console.log(`  🛍️  ${numSOs} pedidos de venda`);
  console.log(`  📊 ${totalMovements} movimentações de estoque`);
  console.log(`  📜 ${totalStatusHistory} registros de histórico de status`);
  console.log(`  📝 ${totalAuditLogs} registros de auditoria`);
  console.log(`  🏦 ${createdBankAccounts.length} contas bancárias`);
  console.log(`  💳 ${numTransactions} transações bancárias`);
  if (skippedFaturada > 0) {
    console.log(
      `  ⚠️  ${skippedFaturada} pedidos rebaixados de FATURADA → APROVADA (estoque insuficiente)`,
    );
  }
}

main()
  .catch((e) => {
    console.error(JSON.stringify(e, null, 2));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
