-- ============================================
-- Monitor de Obras Web - Schema SQL
-- Execute este SQL no SQL Editor do Supabase
-- ============================================

-- Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    category TEXT,
    tax_rate REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materiais
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'un',
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mão de Obra
CREATE TABLE IF NOT EXISTS labor (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    daily_rate REAL DEFAULT 0,
    phone TEXT,
    tax_rate REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Formas de Pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    labor_id INTEGER REFERENCES labor(id) ON DELETE CASCADE,
    method TEXT NOT NULL
);

-- Preços por Fornecedor/Material
CREATE TABLE IF NOT EXISTS supplier_material_prices (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    material_id INTEGER NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    price REAL NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(supplier_id, material_id)
);

-- Obras
CREATE TABLE IF NOT EXISTS works (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'ACTIVE',
    budget REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT NOW(),
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT CHECK(type IN ('EXPENSE', 'INCOME')) NOT NULL DEFAULT 'EXPENSE',
    category TEXT,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    labor_id INTEGER REFERENCES labor(id) ON DELETE SET NULL,
    work_id INTEGER REFERENCES works(id) ON DELETE SET NULL,
    tax_amount REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_work ON transactions(work_id);
CREATE INDEX IF NOT EXISTS idx_prices_material ON supplier_material_prices(material_id);
CREATE INDEX IF NOT EXISTS idx_prices_supplier ON supplier_material_prices(supplier_id);

-- ============================================
-- RLS (Row Level Security) - Desabilitado para simplificar
-- Em produção, habilite RLS e crie policies
-- ============================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_material_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies que permitem tudo (para uso simples)
CREATE POLICY "Allow all on suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on materials" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on labor" ON labor FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on payment_methods" ON payment_methods FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on supplier_material_prices" ON supplier_material_prices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on works" ON works FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
