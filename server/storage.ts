import { users, type User, type InsertUser, companies, type Company, type InsertCompany, customers, type Customer, type InsertCustomer, products, type Product, type InsertProduct, invoices, type Invoice, type InsertInvoice, invoiceItems, type InvoiceItem, type InsertInvoiceItem } from "@shared/schema";
import { supabase } from "./db";
import session from "express-session";
import MemoryStore from "memorystore";

// Initialize the memory store for sessions
const MemStore = MemoryStore(session);

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

// New implementation using Supabase only
export class SupabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Use memory store for sessions to avoid connection issues
    this.sessionStore = new MemStore({
      checkPeriod: 86400000 // 24 hours
    });
    console.log('Using memory store for sessions');
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Supabase user fetch error:", error);
        return undefined;
      }
      
      if (!data) return undefined;
      
      // Transform Supabase snake_case to camelCase
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        fullName: data.full_name,
        supabaseId: data.supabase_id,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Error in getUser:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
        
      if (error) {
        console.error("Supabase user fetch error:", error);
        return undefined;
      }
      
      if (!data) return undefined;
      
      // Transform Supabase snake_case to camelCase
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        fullName: data.full_name,
        supabaseId: data.supabase_id,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Error in getUserByUsername:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
        
      if (error) {
        console.error("Supabase user fetch error:", error);
        return undefined;
      }
      
      if (!data) return undefined;
      
      // Transform Supabase snake_case to camelCase
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        fullName: data.full_name,
        supabaseId: data.supabase_id,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Convert from camelCase to snake_case for Supabase
      const supabaseUser = {
        username: insertUser.username,
        email: insertUser.email,
        password: insertUser.password,
        name: insertUser.name,
        full_name: insertUser.fullName,
        supabase_id: insertUser.supabaseId
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert(supabaseUser)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase user insert error:", error);
        throw error;
      }
      
      // Transform back to camelCase for our app
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        fullName: data.full_name,
        supabaseId: data.supabase_id,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }

  async getCompanyByUserId(userId: number): Promise<Company | undefined> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error("Supabase company fetch error:", error);
        return undefined;
      }
      
      if (!data) return undefined;
      
      // Transform Supabase snake_case to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gstin: data.gstin,
        email: data.email,
        phone: data.phone,
        bankName: data.bank_name,
        bankAccountNo: data.bank_account_no,
        bankIfsc: data.bank_ifsc,
        logoUrl: data.logo_url,
        panNo: data.pan_no,
        iecCode: data.iec_code,
        adCode: data.ad_code
      };
    } catch (error) {
      console.error("Error in getCompanyByUserId:", error);
      return undefined;
    }
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    try {
      // Convert from camelCase to snake_case for Supabase
      const supabaseCompany = {
        user_id: company.userId,
        name: company.name,
        address: company.address,
        city: company.city,
        state: company.state,
        pincode: company.pincode,
        gstin: company.gstin,
        email: company.email,
        phone: company.phone,
        bank_name: company.bankName,
        bank_account_no: company.bankAccountNo,
        bank_ifsc: company.bankIfsc,
        logo_url: company.logoUrl,
        pan_no: company.panNo,
        iec_code: company.iecCode,
        ad_code: company.adCode
      };
      
      const { data, error } = await supabase
        .from('companies')
        .insert(supabaseCompany)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase company insert error:", error);
        throw error;
      }
      
      // Transform back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gstin: data.gstin,
        email: data.email,
        phone: data.phone,
        bankName: data.bank_name,
        bankAccountNo: data.bank_account_no,
        bankIfsc: data.bank_ifsc,
        logoUrl: data.logo_url,
        panNo: data.pan_no,
        iecCode: data.iec_code,
        adCode: data.ad_code
      };
    } catch (error) {
      console.error("Error in createCompany:", error);
      throw error;
    }
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    try {
      // Convert partial company from camelCase to snake_case
      const supabaseCompany: Record<string, any> = {};
      
      if ('userId' in company) supabaseCompany.user_id = company.userId;
      if ('name' in company) supabaseCompany.name = company.name;
      if ('address' in company) supabaseCompany.address = company.address;
      if ('city' in company) supabaseCompany.city = company.city;
      if ('state' in company) supabaseCompany.state = company.state;
      if ('pincode' in company) supabaseCompany.pincode = company.pincode;
      if ('gstin' in company) supabaseCompany.gstin = company.gstin;
      if ('email' in company) supabaseCompany.email = company.email;
      if ('phone' in company) supabaseCompany.phone = company.phone;
      if ('bankName' in company) supabaseCompany.bank_name = company.bankName;
      if ('bankAccountNo' in company) supabaseCompany.bank_account_no = company.bankAccountNo;
      if ('bankIfsc' in company) supabaseCompany.bank_ifsc = company.bankIfsc;
      if ('logoUrl' in company) supabaseCompany.logo_url = company.logoUrl;
      if ('panNo' in company) supabaseCompany.pan_no = company.panNo;
      if ('iecCode' in company) supabaseCompany.iec_code = company.iecCode;
      if ('adCode' in company) supabaseCompany.ad_code = company.adCode;
      
      const { data, error } = await supabase
        .from('companies')
        .update(supabaseCompany)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase company update error:", error);
        return undefined;
      }
      
      // Transform back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        gstin: data.gstin,
        email: data.email,
        phone: data.phone,
        bankName: data.bank_name,
        bankAccountNo: data.bank_account_no,
        bankIfsc: data.bank_ifsc,
        logoUrl: data.logo_url,
        panNo: data.pan_no,
        iecCode: data.iec_code,
        adCode: data.ad_code
      };
    } catch (error) {
      console.error("Error in updateCompany:", error);
      return undefined;
    }
  }

  async getCustomersByUserId(userId: number): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error("Supabase customer fetch error:", error);
        return [];
      }
      
      // Transform Supabase snake_case to camelCase
      return data.map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        gstin: c.gstin,
        billingAddress: c.billing_address,
        billingCity: c.billing_city,
        billingState: c.billing_state,
        billingPincode: c.billing_pincode,
        shippingAddress: c.shipping_address,
        shippingCity: c.shipping_city,
        shippingState: c.shipping_state,
        shippingPincode: c.shipping_pincode,
        sameAsShipping: c.same_as_shipping
      }));
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Supabase customer fetch error:", error);
        return undefined;
      }
      
      if (!data) return undefined;
      
      // Transform Supabase snake_case to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        gstin: data.gstin,
        billingAddress: data.billing_address,
        billingCity: data.billing_city,
        billingState: data.billing_state,
        billingPincode: data.billing_pincode,
        shippingAddress: data.shipping_address,
        shippingCity: data.shipping_city,
        shippingState: data.shipping_state,
        shippingPincode: data.shipping_pincode,
        sameAsShipping: data.same_as_shipping
      };
    } catch (error) {
      console.error("Error fetching customer:", error);
      return undefined;
    }
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      // Transform to snake_case for Supabase
      const supabaseCustomer = {
        user_id: customer.userId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        gstin: customer.gstin,
        billing_address: customer.billingAddress,
        billing_city: customer.billingCity,
        billing_state: customer.billingState,
        billing_pincode: customer.billingPincode,
        shipping_address: customer.shippingAddress,
        shipping_city: customer.shippingCity,
        shipping_state: customer.shippingState,
        shipping_pincode: customer.shippingPincode,
        same_as_shipping: customer.sameAsShipping
      };
      
      // Insert using Supabase
      const { data, error } = await supabase
        .from('customers')
        .insert(supabaseCustomer)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase customer insert error:", error);
        throw error;
      }
      
      // Transform back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        gstin: data.gstin,
        billingAddress: data.billing_address,
        billingCity: data.billing_city,
        billingState: data.billing_state,
        billingPincode: data.billing_pincode,
        shippingAddress: data.shipping_address,
        shippingCity: data.shipping_city,
        shippingState: data.shipping_state,
        shippingPincode: data.shipping_pincode,
        sameAsShipping: data.same_as_shipping
      };
    } catch (error) {
      console.error("Error creating customer:", error);
      throw error;
    }
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    try {
      // Convert partial customer from camelCase to snake_case
      const supabaseCustomer: Record<string, any> = {};
      
      if ('userId' in customer) supabaseCustomer.user_id = customer.userId;
      if ('name' in customer) supabaseCustomer.name = customer.name;
      if ('email' in customer) supabaseCustomer.email = customer.email;
      if ('phone' in customer) supabaseCustomer.phone = customer.phone;
      if ('gstin' in customer) supabaseCustomer.gstin = customer.gstin;
      if ('billingAddress' in customer) supabaseCustomer.billing_address = customer.billingAddress;
      if ('billingCity' in customer) supabaseCustomer.billing_city = customer.billingCity;
      if ('billingState' in customer) supabaseCustomer.billing_state = customer.billingState;
      if ('billingPincode' in customer) supabaseCustomer.billing_pincode = customer.billingPincode;
      if ('shippingAddress' in customer) supabaseCustomer.shipping_address = customer.shippingAddress;
      if ('shippingCity' in customer) supabaseCustomer.shipping_city = customer.shippingCity;
      if ('shippingState' in customer) supabaseCustomer.shipping_state = customer.shippingState;
      if ('shippingPincode' in customer) supabaseCustomer.shipping_pincode = customer.shippingPincode;
      if ('sameAsShipping' in customer) supabaseCustomer.same_as_shipping = customer.sameAsShipping;
      
      // Update using Supabase
      const { data, error } = await supabase
        .from('customers')
        .update(supabaseCustomer)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase customer update error:", error);
        return undefined;
      }
      
      // Transform back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        gstin: data.gstin,
        billingAddress: data.billing_address,
        billingCity: data.billing_city,
        billingState: data.billing_state,
        billingPincode: data.billing_pincode,
        shippingAddress: data.shipping_address,
        shippingCity: data.shipping_city,
        shippingState: data.shipping_state,
        shippingPincode: data.shipping_pincode,
        sameAsShipping: data.same_as_shipping
      };
    } catch (error) {
      console.error("Error updating customer:", error);
      return undefined;
    }
  }

  async deleteCustomer(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Supabase customer delete error:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting customer:", error);
      return false;
    }
  }

  async getProductsByUserId(userId: number): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error("Supabase product fetch error:", error);
        return [];
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
      return [];
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Supabase product fetch error:", error);
        return undefined;
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
      return undefined;
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
        throw error;
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
      throw error;
    }
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      // Convert partial product from camelCase to snake_case
      const supabaseProduct: Record<string, any> = {};
      
      if ('userId' in product) supabaseProduct.user_id = product.userId;
      if ('name' in product) supabaseProduct.name = product.name;
      if ('description' in product) supabaseProduct.description = product.description;
      if ('hsnCode' in product) supabaseProduct.hsn_code = product.hsnCode;
      if ('unit' in product) supabaseProduct.unit = product.unit;
      if ('rate' in product) supabaseProduct.rate = product.rate;
      if ('gstRate' in product) supabaseProduct.gst_rate = product.gstRate;
      
      // Update using Supabase
      const { data, error } = await supabase
        .from('products')
        .update(supabaseProduct)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase product update error:", error);
        return undefined;
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
      console.error("Error updating product:", error);
      return undefined;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Supabase product delete error:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
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

export const storage = new SupabaseStorage();