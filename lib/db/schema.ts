import {
  pgTable,
  serial,
  text,
  real,
  timestamp,
  integer,
  unique,
} from "drizzle-orm/pg-core";

// Fornecedores
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact"),
  phone: text("phone"),
  category: text("category"),
  taxRate: real("tax_rate").default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// Materiais
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("un"),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// Mão de Obra
export const labor = pgTable("labor", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role"),
  dailyRate: real("daily_rate").default(0),
  phone: text("phone"),
  taxRate: real("tax_rate").default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// Formas de Pagamento
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "cascade" }),
  laborId: integer("labor_id").references(() => labor.id, { onDelete: "cascade" }),
  method: text("method").notNull(),
});

// Preços por Fornecedor/Material
export const supplierMaterialPrices = pgTable(
  "supplier_material_prices",
  {
    id: serial("id").primaryKey(),
    supplierId: integer("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    materialId: integer("material_id")
      .notNull()
      .references(() => materials.id, { onDelete: "cascade" }),
    price: real("price").notNull(),
    lastUpdated: timestamp("last_updated", { withTimezone: true, mode: "string" }).defaultNow(),
  },
  (table) => [
    unique("supplier_material_prices_supplier_id_material_id_key").on(
      table.supplierId,
      table.materialId
    ),
  ]
);

// Obras
export const works = pgTable("works", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  startDate: timestamp("start_date", { withTimezone: true, mode: "string" }),
  endDate: timestamp("end_date", { withTimezone: true, mode: "string" }),
  status: text("status").default("ACTIVE"),
  budget: real("budget").default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});

// Transações
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { withTimezone: true, mode: "string" }).defaultNow(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull().default("EXPENSE"),
  category: text("category"),
  supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  laborId: integer("labor_id").references(() => labor.id, { onDelete: "set null" }),
  workId: integer("work_id").references(() => works.id, { onDelete: "set null" }),
  taxAmount: real("tax_amount").default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).defaultNow(),
});
