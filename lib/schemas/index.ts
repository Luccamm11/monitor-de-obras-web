import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  contact: z.string().optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
  taxRate: z.number().min(0).default(0),
});

export const materialSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  unit: z.string().default('un'),
  category: z.string().optional(),
});

export const laborSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  role: z.string().optional(),
  dailyRate: z.number().min(0).default(0),
  phone: z.string().optional(),
  taxRate: z.number().min(0).default(0),
});

export const workSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'PAUSED', 'CANCELLED']).default('ACTIVE'),
  budget: z.number().min(0).default(0),
});

export const transactionSchema = z.object({
  date: z.string().or(z.date()).optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number(),
  type: z.enum(['EXPENSE', 'INCOME']).default('EXPENSE'),
  category: z.string().optional(),
  supplierId: z.number().optional().nullable(),
  laborId: z.number().optional().nullable(),
  workId: z.number().optional().nullable(),
  taxAmount: z.number().default(0),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
export type MaterialInput = z.infer<typeof materialSchema>;
export type LaborInput = z.infer<typeof laborSchema>;
export type WorkInput = z.infer<typeof workSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
