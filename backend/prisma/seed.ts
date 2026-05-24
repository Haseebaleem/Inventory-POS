import { PrismaClient, Role, StockMovementType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const prisma = new PrismaClient();

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? 'owner@demo.local';
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? 'Owner123!';

  // 1. Business profile
  let business = await prisma.businessProfile.findFirst();
  if (!business) {
    business = await prisma.businessProfile.create({
      data: { name: 'Demo Store', currency: 'PKR', taxRate: 0 },
    });
    console.log('Created business profile:', business.name);
  } else {
    console.log('Business profile exists:', business.name);
  }

  // 2. Owner user
  let owner = await prisma.user.findUnique({ where: { email: ownerEmail } });
  if (!owner) {
    owner = await prisma.user.create({
      data: {
        email: ownerEmail,
        password: await bcrypt.hash(ownerPassword, 10),
        name: 'Demo Owner',
        role: Role.OWNER,
        businessProfileId: business.id,
      },
    });
    console.log(`Created owner: ${ownerEmail} / ${ownerPassword}`);
  } else {
    console.log(`Owner exists: ${ownerEmail}`);
  }

  // 3. Demo cashier
  const cashierEmail = 'cashier@demo.local';
  const cashierPassword = 'Cashier123!';
  let cashier = await prisma.user.findUnique({ where: { email: cashierEmail } });
  if (!cashier) {
    cashier = await prisma.user.create({
      data: {
        email: cashierEmail,
        password: await bcrypt.hash(cashierPassword, 10),
        name: 'Demo Cashier',
        role: Role.CASHIER,
        businessProfileId: business.id,
      },
    });
    console.log(`Created cashier: ${cashierEmail} / ${cashierPassword}`);
  } else {
    console.log(`Cashier exists: ${cashierEmail}`);
  }

  // 4. Categories
  const categoryNames = ['Beverages', 'Snacks', 'Bakery', 'Dairy', 'Stationery'];
  const categories = [];
  for (const name of categoryNames) {
    const slug = slugify(name);
    const c = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    categories.push(c);
  }
  console.log(`Categories ready: ${categories.length}`);

  // 5. Products (idempotent by SKU)
  const seedProducts: Array<{
    sku: string;
    name: string;
    price: number;
    costPrice: number;
    categoryName: string;
    barcode?: string;
  }> = [
    { sku: 'BEV-001', name: 'Cola 500ml', price: 120, costPrice: 80, categoryName: 'Beverages', barcode: '8901001000011' },
    { sku: 'BEV-002', name: 'Orange Juice 1L', price: 280, costPrice: 200, categoryName: 'Beverages', barcode: '8901001000022' },
    { sku: 'BEV-003', name: 'Mineral Water 1.5L', price: 90, costPrice: 50, categoryName: 'Beverages', barcode: '8901001000033' },
    { sku: 'BEV-004', name: 'Iced Tea 330ml', price: 150, costPrice: 100, categoryName: 'Beverages' },
    { sku: 'SNK-001', name: 'Potato Chips Salted', price: 100, costPrice: 65, categoryName: 'Snacks', barcode: '8901002000011' },
    { sku: 'SNK-002', name: 'Chocolate Bar 50g', price: 180, costPrice: 110, categoryName: 'Snacks' },
    { sku: 'SNK-003', name: 'Mixed Nuts 200g', price: 450, costPrice: 320, categoryName: 'Snacks' },
    { sku: 'SNK-004', name: 'Cookies Pack', price: 220, costPrice: 140, categoryName: 'Snacks' },
    { sku: 'BAK-001', name: 'White Bread Loaf', price: 160, costPrice: 100, categoryName: 'Bakery' },
    { sku: 'BAK-002', name: 'Croissant', price: 120, costPrice: 70, categoryName: 'Bakery' },
    { sku: 'BAK-003', name: 'Chocolate Muffin', price: 140, costPrice: 80, categoryName: 'Bakery' },
    { sku: 'BAK-004', name: 'Bagel Plain', price: 90, costPrice: 50, categoryName: 'Bakery' },
    { sku: 'DRY-001', name: 'Milk 1L', price: 250, costPrice: 180, categoryName: 'Dairy', barcode: '8901003000011' },
    { sku: 'DRY-002', name: 'Yogurt 500g', price: 220, costPrice: 150, categoryName: 'Dairy' },
    { sku: 'DRY-003', name: 'Cheese Slice 200g', price: 480, costPrice: 320, categoryName: 'Dairy' },
    { sku: 'DRY-004', name: 'Butter 250g', price: 380, costPrice: 260, categoryName: 'Dairy' },
    { sku: 'STA-001', name: 'Notebook A5', price: 200, costPrice: 120, categoryName: 'Stationery' },
    { sku: 'STA-002', name: 'Ballpoint Pen', price: 40, costPrice: 20, categoryName: 'Stationery' },
    { sku: 'STA-003', name: 'Pencil HB', price: 30, costPrice: 15, categoryName: 'Stationery' },
    { sku: 'STA-004', name: 'Stapler Small', price: 350, costPrice: 220, categoryName: 'Stationery' },
  ];

  const catBySlug = new Map(categories.map((c) => [c.name, c]));
  for (const sp of seedProducts) {
    const category = catBySlug.get(sp.categoryName);
    if (!category) continue;
    const existing = await prisma.product.findUnique({ where: { sku: sp.sku } });
    if (existing) continue;
    const stock = randInt(5, 60);
    const p = await prisma.product.create({
      data: {
        sku: sp.sku,
        barcode: sp.barcode ?? null,
        name: sp.name,
        price: sp.price,
        costPrice: sp.costPrice,
        stock,
        lowStockThreshold: 10,
        categoryId: category.id,
        active: true,
      },
    });
    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        type: StockMovementType.PURCHASE,
        quantity: stock,
        reason: 'Seed initial stock',
        actorId: owner.id,
      },
    });
  }
  console.log(`Products ready (${seedProducts.length} target).`);

  console.log('\nSeed complete.');
  console.log('---');
  console.log(`Owner login:   ${ownerEmail} / ${ownerPassword}`);
  console.log(`Cashier login: ${cashierEmail} / ${cashierPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
