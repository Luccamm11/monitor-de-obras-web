export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      labor: {
        Row: {
          created_at: string | null
          daily_rate: number | null
          id: number
          name: string
          phone: string | null
          role: string | null
          tax_rate: number | null
        }
        Insert: {
          created_at?: string | null
          daily_rate?: number | null
          id?: number
          name: string
          phone?: string | null
          role?: string | null
          tax_rate?: number | null
        }
        Update: {
          created_at?: string | null
          daily_rate?: number | null
          id?: number
          name?: string
          phone?: string | null
          role?: string | null
          tax_rate?: number | null
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string | null
          created_at: string | null
          id: number
          name: string
          unit: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: number
          name: string
          unit?: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: number
          name?: string
          unit?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          id: number
          labor_id: number | null
          method: string
          supplier_id: number | null
        }
        Insert: {
          id?: number
          labor_id?: number | null
          method: string
          supplier_id?: number | null
        }
        Update: {
          id?: number
          labor_id?: number | null
          method?: string
          supplier_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_labor_id_fkey"
            columns: ["labor_id"]
            isOneToOne: false
            referencedRelation: "labor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_methods_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_material_prices: {
        Row: {
          id: number
          last_updated: string | null
          material_id: number
          price: number
          supplier_id: number
        }
        Insert: {
          id?: number
          last_updated?: string | null
          material_id: number
          price: number
          supplier_id: number
        }
        Update: {
          id?: number
          last_updated?: string | null
          material_id?: number
          price?: number
          supplier_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_material_prices_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_material_prices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          category: string | null
          contact: string | null
          created_at: string | null
          id: number
          name: string
          phone: string | null
          tax_rate: number | null
        }
        Insert: {
          category?: string | null
          contact?: string | null
          created_at?: string | null
          id?: number
          name: string
          phone?: string | null
          tax_rate?: number | null
        }
        Update: {
          category?: string | null
          contact?: string | null
          created_at?: string | null
          id?: number
          name?: string
          phone?: string | null
          tax_rate?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          date: string | null
          description: string
          id: number
          labor_id: number | null
          supplier_id: number | null
          tax_amount: number | null
          type: string
          work_id: number | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description: string
          id?: number
          labor_id?: number | null
          supplier_id?: number | null
          tax_amount?: number | null
          type?: string
          work_id?: number | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          date?: string | null
          description?: string
          id?: number
          labor_id?: number | null
          supplier_id?: number | null
          tax_amount?: number | null
          type?: string
          work_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_labor_id_fkey"
            columns: ["labor_id"]
            isOneToOne: false
            referencedRelation: "labor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          address: string | null
          budget: number | null
          created_at: string | null
          end_date: string | null
          id: number
          name: string
          start_date: string | null
          status: string | null
        }
        Insert: {
          address?: string | null
          budget?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: number
          name: string
          start_date?: string | null
          status?: string | null
        }
        Update: {
          address?: string | null
          budget?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: number
          name?: string
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
