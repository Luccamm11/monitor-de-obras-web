CREATE TABLE "labor" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text,
	"daily_rate" real DEFAULT 0,
	"phone" text,
	"tax_rate" real DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"unit" text DEFAULT 'un' NOT NULL,
	"category" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer,
	"labor_id" integer,
	"method" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_material_prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"supplier_id" integer NOT NULL,
	"material_id" integer NOT NULL,
	"price" real NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now(),
	CONSTRAINT "supplier_material_prices_supplier_id_material_id_key" UNIQUE("supplier_id","material_id")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact" text,
	"phone" text,
	"category" text,
	"tax_rate" real DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp with time zone DEFAULT now(),
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"type" text DEFAULT 'EXPENSE' NOT NULL,
	"category" text,
	"supplier_id" integer,
	"labor_id" integer,
	"work_id" integer,
	"tax_amount" real DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"status" text DEFAULT 'ACTIVE',
	"budget" real DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_labor_id_labor_id_fk" FOREIGN KEY ("labor_id") REFERENCES "public"."labor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_material_prices" ADD CONSTRAINT "supplier_material_prices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_material_prices" ADD CONSTRAINT "supplier_material_prices_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_labor_id_labor_id_fk" FOREIGN KEY ("labor_id") REFERENCES "public"."labor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_work_id_works_id_fk" FOREIGN KEY ("work_id") REFERENCES "public"."works"("id") ON DELETE set null ON UPDATE no action;