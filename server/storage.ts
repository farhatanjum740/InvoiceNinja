import { users, type User, type InsertUser, companies, type Company, type InsertCompany, customers, type Customer, type InsertCustomer, products, type Product, type InsertProduct, invoices, type Invoice, type InsertInvoice, invoiceItems, type InvoiceItem, type InsertInvoiceItem } from "@shared/schema";
import { db, client, supabase } from "./db";
import { eq, and, desc } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import MemoryStore from "memorystore";

const PostgresSessionStore = connectPg(session);

// Interface for storage operations
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Company management
  getCompanyByUserId(userId: number): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined>;
  
  // Customer management
  getCustomersByUserId(userId: number): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Product management
  getProductsByUserId(userId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Invoice management
  getInvoicesByUserId(userId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceWithItems(id: number): Promise<{invoice: Invoice, items: InvoiceItem[]}>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Invoice items
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  addInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;
  
  // Analytics
  getInvoiceStats(userId: number): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    unpaidInvoices: number;
    totalCustomers: number;
  }>;
  
  // Session store for authentication
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Use memory store for sessions to avoid connection issues
    const MemStore = MemoryStore(session);
    this.sessionStore = new MemStore({
      checkPeriod: 86400000 // 24 hours
    });
    console.log('Using memory store for sessions');
    
    // We'll implement PostgreSQL session store later when connection issues are resolved
    // For reference, here's how to set it up:
    //
    // this.sessionStore = new PostgresSessionStore({ 
    //   conObject: {
    //     host: process.env.PGHOST,
    //     port: parseInt(process.env.PGPORT || '5432'),
    //     database: process.env.PGDATABASE,
    //     user: process.env.PGUSER,
    //     password: process.env.PGPASSWORD,
    //     ssl: { rejectUnauthorized: false }
    //   },
    //   createTableIfMissing: true 
    // });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const [user] = await db.insert(users).values(insertUser).returning();
      return user;
    } catch (error) {
      console.error("Error in createUser:", error);
      // Create tables if they don't exist (first run situation)
      try {
        await db.execute(/* sql */`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            name TEXT,
            full_name TEXT,
            supabase_id TEXT UNIQUE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        
        // Try again after creating the table
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
      } catch (tableError) {
        console.error("Error creating users table:", tableError);
        throw error; // Rethrow the original error
      }
    }
  }

  async getCompanyByUserId(userId: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    const [updatedCompany] = await db
      .update(companies)
      .set(company)
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async getCustomersByUserId(userId: number): Promise<Customer[]> {
    return db.select().from(customers).where(eq(customers.userId, userId));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const [deletedCustomer] = await db
      .delete(customers)
      .where(eq(customers.id, id))
      .returning();
    return !!deletedCustomer;
  }

  async getProductsByUserId(userId: number): Promise<Product[]> {
    try {
      // Try using Supabase first
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error("Supabase product fetch error:", error);
        // Fall back to direct DB query
        return db.select().from(products).where(eq(products.userId, userId));
      }
      
      // Transform Supabase snake_case to camelCase
      return data.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        description: p.description || null,
        hsnCode: p.hsn_code || null,
        unit: p.unit || null,
        rate: p.rate,
        gstRate: p.gst_rate
      }));
    } catch (error) {
      console.error("Error fetching products:", error);
      // Fall back to direct DB query
      return db.select().from(products).where(eq(products.userId, userId));
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    try {
      // Try using Supabase first
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Supabase product fetch error:", error);
        // Fall back to direct DB query
        const [product] = await db.select().from(products).where(eq(products.id, id));
        return product;
      }
      
      if (!data) return undefined;
      
      // Transform Supabase snake_case to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description || null,
        hsnCode: data.hsn_code || null,
        unit: data.unit || null,
        rate: data.rate,
        gstRate: data.gst_rate
      };
    } catch (error) {
      console.error("Error fetching product:", error);
      // Fall back to direct DB query
      const [product] = await db.select().from(products).where(eq(products.id, id));
      return product;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      // Transform to snake_case for Supabase
      const supabaseProduct = {
        user_id: product.userId,
        name: product.name,
        description: product.description,
        hsn_code: product.hsnCode,
        unit: product.unit,
        rate: product.rate,
        gst_rate: product.gstRate
      };
      
      // Insert using Supabase
      const { data, error } = await supabase
        .from('products')
        .insert(supabaseProduct)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase product insert error:", error);
        // Fall back to direct DB insert
        const [newProduct] = await db.insert(products).values(product).returning();
        return newProduct;
      }
      
      // Transform back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description || null,
        hsnCode: data.hsn_code || null,
        unit: data.unit || null,
        rate: data.rate,
        gstRate: data.gst_rate
      };
    } catch (error) {
      console.error("Error creating product:", error);
      // Fall back to direct DB insert
      const [newProduct] = await db.insert(products).values(product).returning();
      return newProduct;
    }
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      // Transform to snake_case for Supabase
      const supabaseProduct: Record<string, any> = {};
      if (product.userId !== undefined) supabaseProduct.user_id = product.userId;
      if (product.name !== undefined) supabaseProduct.name = product.name;
      if (product.description !== undefined) supabaseProduct.description = product.description;
      if (product.hsnCode !== undefined) supabaseProduct.hsn_code = product.hsnCode;
      if (product.unit !== undefined) supabaseProduct.unit = product.unit;
      if (product.rate !== undefined) supabaseProduct.rate = product.rate;
      if (product.gstRate !== undefined) supabaseProduct.gst_rate = product.gstRate;
      
      // Update using Supabase
      const { data, error } = await supabase
        .from('products')
        .update(supabaseProduct)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase product update error:", error);
        // Fall back to direct DB update
        const [updatedProduct] = await db.update(products).set(product).where(eq(products.id, id)).returning();
        return updatedProduct;
      }
      
      if (!data) return undefined;
      
      // Transform back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description || null,
        hsnCode: data.hsn_code || null,
        unit: data.unit || null,
        rate: data.rate,
        gstRate: data.gst_rate
      };
    } catch (error) {
      console.error("Error updating product:", error);
      // Fall back to direct DB update
      const [updatedProduct] = await db.update(products).set(product).where(eq(products.id, id)).returning();
      return updatedProduct;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      // Delete using Supabase
      const { error } = await supabase.from('products').delete().eq('id', id);
        
      if (error) {
        console.error("Supabase product delete error:", error);
        // Fall back to direct DB delete
        const [deletedProduct] = await db.delete(products).where(eq(products.id, id)).returning();
        return !!deletedProduct;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      // Fall back to direct DB delete
      const [deletedProduct] = await db.delete(products).where(eq(products.id, id)).returning();
      return !!deletedProduct;
    }
  }

  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    return db.select().from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.id));  // Using ID instead of createdAt which doesn't exist
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getInvoiceWithItems(id: number): Promise<{ invoice: Invoice; items: InvoiceItem[] }> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    
    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    
    return {
      invoice,
      items
    };
  }

  async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    // Start a transaction
    return await db.transaction(async (tx) => {
      // Insert invoice
      const [newInvoice] = await tx.insert(invoices).values(invoice).returning();
      
      // Insert all invoice items with the new invoice ID
      if (items.length > 0) {
        const itemsWithInvoiceId = items.map(item => ({
          ...item,
          invoiceId: newInvoice.id
        }));
        
        await tx.insert(invoiceItems).values(itemsWithInvoiceId);
      }
      
      return newInvoice;
    });
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Delete associated invoice items first
      await tx.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));
      
      // Then delete the invoice
      const [deletedInvoice] = await tx
        .delete(invoices)
        .where(eq(invoices.id, id))
        .returning();
      
      return !!deletedInvoice;
    });
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async addInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [newItem] = await db.insert(invoiceItems).values(item).returning();
    return newItem;
  }

  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const [updatedItem] = await db
      .update(invoiceItems)
      .set(item)
      .where(eq(invoiceItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInvoiceItem(id: number): Promise<boolean> {
    const [deletedItem] = await db
      .delete(invoiceItems)
      .where(eq(invoiceItems.id, id))
      .returning();
    return !!deletedItem;
  }

  async getInvoiceStats(userId: number): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    unpaidInvoices: number;
    totalCustomers: number;
  }> {
    // Get total number of invoices
    const invoicesResult = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId));
    
    // Calculate total revenue
    const totalRevenue = invoicesResult.reduce((sum, invoice) => sum + Number(invoice.total), 0);
    
    // Count unpaid invoices (status is pending)
    const unpaidInvoices = invoicesResult.filter(invoice => invoice.status === 'pending').length;
    
    // Count total customers
    const customersResult = await db
      .select()
      .from(customers)
      .where(eq(customers.userId, userId));
    
    return {
      totalInvoices: invoicesResult.length,
      totalRevenue: totalRevenue,
      unpaidInvoices: unpaidInvoices,
      totalCustomers: customersResult.length
    };
  }
}

export const storage = new DatabaseStorage();