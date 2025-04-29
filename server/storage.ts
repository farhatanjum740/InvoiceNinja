import { createClient } from '@supabase/supabase-js';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { InsertCompany, InsertCustomer, InsertInvoice, InsertInvoiceItem, InsertProduct, InsertUser, Invoice, InvoiceItem, Product, User, companies, customers, invoiceItems, invoices, products, users } from '@shared/schema';
import { Company } from '@shared/schema';
import { Customer } from '@shared/schema';
import { supabase } from './db';
import { refreshSupabaseSchemaCache } from './db';
import { Pool } from '@neondatabase/serverless';

const MemoryStore = createMemoryStore(session);

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

export class SupabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    console.log("Using memory store for sessions");
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
      
      return {
        id: data.id,
        username: data.username,
        password: data.password,
        email: data.email,
        fullName: data.full_name,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error("Error fetching user:", error);
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
      
      return {
        id: data.id,
        username: data.username,
        password: data.password,
        email: data.email,
        fullName: data.full_name,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error("Error fetching user by username:", error);
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
      
      return {
        id: data.id,
        username: data.username,
        password: data.password,
        email: data.email,
        fullName: data.full_name,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Convert camelCase to snake_case for Supabase
      const supabaseUser = {
        username: insertUser.username,
        password: insertUser.password,
        email: insertUser.email,
        full_name: insertUser.fullName
      };
      
      const { data, error } = await supabase
        .from('users')
        .insert(supabaseUser)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase user creation error:", error);
        throw new Error(`Failed to create user: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("Failed to create user: No data returned");
      }
      
      return {
        id: data.id,
        username: data.username,
        password: data.password,
        email: data.email,
        fullName: data.full_name,
        createdAt: data.created_at
      };
    } catch (error) {
      console.error("Error creating user:", error);
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
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postal_code,
        country: data.country,
        website: data.website,
        gstin: data.gstin,
        panNumber: data.pan_number,
        logoUrl: data.logo_url,
        bankName: data.bank_name,
        bankAccountNumber: data.bank_account_number,
        bankIfsc: data.bank_ifsc
      };
    } catch (error) {
      console.error("Error fetching company by user ID:", error);
      return undefined;
    }
  }
  
  async createCompany(company: InsertCompany): Promise<Company> {
    try {
      // Convert camelCase to snake_case for Supabase
      const supabaseCompany = {
        user_id: company.userId,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        city: company.city,
        state: company.state,
        postal_code: company.postalCode,
        country: company.country,
        website: company.website,
        gstin: company.gstin,
        pan_number: company.panNumber,
        logo_url: company.logoUrl,
        bank_name: company.bankName,
        bank_account_number: company.bankAccountNumber,
        bank_ifsc: company.bankIfsc
      };
      
      const { data, error } = await supabase
        .from('companies')
        .insert(supabaseCompany)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase company creation error:", error);
        throw new Error(`Failed to create company: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("Failed to create company: No data returned");
      }
      
      // Transform Supabase snake_case to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postal_code,
        country: data.country,
        website: data.website,
        gstin: data.gstin,
        panNumber: data.pan_number,
        logoUrl: data.logo_url,
        bankName: data.bank_name,
        bankAccountNumber: data.bank_account_number,
        bankIfsc: data.bank_ifsc
      };
    } catch (error) {
      console.error("Error creating company:", error);
      throw error;
    }
  }
  
  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    try {
      // Convert partial company from camelCase to snake_case
      const supabaseCompany: Record<string, any> = {};
      
      if ('userId' in company) supabaseCompany.user_id = company.userId;
      if ('name' in company) supabaseCompany.name = company.name;
      if ('email' in company) supabaseCompany.email = company.email;
      if ('phone' in company) supabaseCompany.phone = company.phone;
      if ('address' in company) supabaseCompany.address = company.address;
      if ('city' in company) supabaseCompany.city = company.city;
      if ('state' in company) supabaseCompany.state = company.state;
      if ('postalCode' in company) supabaseCompany.postal_code = company.postalCode;
      if ('country' in company) supabaseCompany.country = company.country;
      if ('website' in company) supabaseCompany.website = company.website;
      if ('gstin' in company) supabaseCompany.gstin = company.gstin;
      if ('panNumber' in company) supabaseCompany.pan_number = company.panNumber;
      if ('logoUrl' in company) supabaseCompany.logo_url = company.logoUrl;
      if ('bankName' in company) supabaseCompany.bank_name = company.bankName;
      if ('bankAccountNumber' in company) supabaseCompany.bank_account_number = company.bankAccountNumber;
      if ('bankIfsc' in company) supabaseCompany.bank_ifsc = company.bankIfsc;
      
      // Update using Supabase
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
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postal_code,
        country: data.country,
        website: data.website,
        gstin: data.gstin,
        panNumber: data.pan_number,
        logoUrl: data.logo_url,
        bankName: data.bank_name,
        bankAccountNumber: data.bank_account_number,
        bankIfsc: data.bank_ifsc
      };
    } catch (error) {
      console.error("Error updating company:", error);
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
        console.error("Supabase customers fetch error:", error);
        return [];
      }
      
      // Transform Supabase snake_case to camelCase with backward compatibility
      return data.map(c => {
        // Map the DB fields to our schema
        const customer: any = {
          id: c.id,
          userId: c.user_id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          gstin: c.gstin,
          // Default billing fields to empty strings if not present
          billingAddress: c.billing_address || c.address || "",
          billingCity: c.billing_city || c.city || "",
          billingState: c.billing_state || c.state || "",
          billingPincode: c.billing_pincode || c.pincode || c.postal_code || "",
          // Default shipping fields
          shippingAddress: c.shipping_address || c.address || "",
          shippingCity: c.shipping_city || c.city || "",
          shippingState: c.shipping_state || c.state || "",
          shippingPincode: c.shipping_pincode || c.pincode || c.postal_code || "",
          sameAsShipping: c.same_as_shipping !== undefined ? c.same_as_shipping : true
        };
        
        console.log("Transformed customer:", customer);
        return customer;
      });
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
      
      // Transform with same logic as getCustomersByUserId
      const customer: any = {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        gstin: data.gstin,
        // Default billing fields to empty strings if not present
        billingAddress: data.billing_address || data.address || "",
        billingCity: data.billing_city || data.city || "",
        billingState: data.billing_state || data.state || "",
        billingPincode: data.billing_pincode || data.pincode || data.postal_code || "",
        // Default shipping fields
        shippingAddress: data.shipping_address || data.address || "",
        shippingCity: data.shipping_city || data.city || "",
        shippingState: data.shipping_state || data.state || "",
        shippingPincode: data.shipping_pincode || data.pincode || data.postal_code || "",
        sameAsShipping: data.same_as_shipping !== undefined ? data.same_as_shipping : true
      };
      
      console.log("Fetched individual customer:", customer);
      return customer;
    } catch (error) {
      console.error("Error fetching customer:", error);
      return undefined;
    }
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      // Convert camelCase to snake_case for Supabase
      const supabaseCustomer = {
        user_id: customer.userId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        postal_code: customer.postalCode,
        country: customer.country,
        gstin: customer.gstin
      };
      
      const { data, error } = await supabase
        .from('customers')
        .insert(supabaseCustomer)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase customer creation error:", error);
        throw new Error(`Failed to create customer: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("Failed to create customer: No data returned");
      }
      
      // Transform Supabase snake_case to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postal_code,
        country: data.country,
        gstin: data.gstin
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
      if ('address' in customer) supabaseCustomer.address = customer.address;
      if ('city' in customer) supabaseCustomer.city = customer.city;
      if ('state' in customer) supabaseCustomer.state = customer.state;
      if ('postalCode' in customer) supabaseCustomer.postal_code = customer.postalCode;
      if ('country' in customer) supabaseCustomer.country = customer.country;
      if ('gstin' in customer) supabaseCustomer.gstin = customer.gstin;
      
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
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postal_code,
        country: data.country,
        gstin: data.gstin
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
        console.error("Supabase products fetch error:", error);
        return [];
      }
      
      // Transform Supabase snake_case to camelCase and handle field name differences
      return data.map(p => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        description: p.description,
        hsnCode: p.hsn_code,
        unit: p.unit,
        // Use rate instead of price to match schema.ts definition
        rate: p.price || p.rate || "0.00", // Try both field names with fallback
        gstRate: p.gst_rate || 0,
        // Include these but they're not in schema
        price: p.price || p.rate || "0.00", // Backward compatibility
        imageUrl: p.image_url
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
      
      // Transform Supabase snake_case to camelCase with consistent field handling
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name || "",
        description: data.description || "",
        hsnCode: data.hsn_code || "",
        unit: data.unit || "Piece",
        // Use rate instead of price to match schema.ts definition
        rate: data.price || data.rate || "0", // Try both field names with fallback
        gstRate: data.gst_rate || 0,
        // Include these for backward compatibility
        price: data.price || data.rate || "0", // Backward compatibility
        imageUrl: data.image_url || null
      };
    } catch (error) {
      console.error("Error fetching product:", error);
      return undefined;
    }
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      // Convert camelCase to snake_case for Supabase
      const supabaseProduct = {
        user_id: product.userId,
        name: product.name,
        description: product.description,
        hsn_code: product.hsnCode,
        unit: product.unit,
        price: product.price,
        gst_rate: product.gstRate,
        image_url: product.imageUrl
      };
      
      const { data, error } = await supabase
        .from('products')
        .insert(supabaseProduct)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase product creation error:", error);
        throw new Error(`Failed to create product: ${error.message}`);
      }
      
      if (!data) {
        throw new Error("Failed to create product: No data returned");
      }
      
      // Transform with same consistent field handling as getProduct
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name || "",
        description: data.description || "",
        hsnCode: data.hsn_code || "",
        unit: data.unit || "Piece",
        // Use rate instead of price to match schema.ts definition
        rate: data.price || data.rate || "0", // Try both field names with fallback
        gstRate: data.gst_rate || 0,
        // Include these for backward compatibility
        price: data.price || data.rate || "0", // Backward compatibility
        imageUrl: data.image_url || null
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
      if ('price' in product) supabaseProduct.price = product.price;
      if ('gstRate' in product) supabaseProduct.gst_rate = product.gstRate;
      if ('imageUrl' in product) supabaseProduct.image_url = product.imageUrl;
      
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
      
      // Transform with same consistent field handling as getProduct
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name || "",
        description: data.description || "",
        hsnCode: data.hsn_code || "",
        unit: data.unit || "Piece",
        // Use rate instead of price to match schema.ts definition
        rate: data.price || data.rate || "0", // Try both field names with fallback
        gstRate: data.gst_rate || 0,
        // Include these for backward compatibility
        price: data.price || data.rate || "0", // Backward compatibility
        imageUrl: data.image_url || null
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
    try {
      // Attempt to force refresh the schema cache before fetching invoices
      try {
        await refreshSupabaseSchemaCache();
        await supabase.rpc('reload_schema_cache').catch(e => console.warn("RPC cache refresh failed:", e));
      } catch (cacheError) {
        console.warn("Schema cache refresh during getInvoicesByUserId failed:", cacheError);
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId);
        
      if (error) {
        console.error("Supabase invoices fetch error:", error);
        
        // Try falling back to direct SQL query
        console.log("Attempting direct SQL fallback for invoice list");
        try {
          const pool = await this.getDirectDbConnection();
          const result = await pool.query(`
            SELECT * FROM invoices WHERE user_id = $1
          `, [userId]);
          
          await pool.end();
          
          if (result.rows && result.rows.length > 0) {
            console.log(`Found ${result.rows.length} invoices via direct SQL`);
            
            return result.rows.map(i => ({
              id: i.id,
              userId: i.user_id,
              customerId: i.customer_id,
              invoiceNumber: i.invoice_number,
              invoiceDate: i.invoice_date,
              dueDate: i.due_date,
              notes: i.notes || null,
              status: i.status,
              subtotal: i.subtotal,
              cgst: i.cgst || '0.00',
              sgst: i.sgst || '0.00',
              igst: i.igst || '0.00',
              total: i.total,
              termsAndConditions: i.terms_and_conditions || null,
              templateId: i.template_id || 'standard',
              colorTheme: i.color_theme || 'blue'
            }));
          } else {
            return [];
          }
        } catch (sqlError) {
          console.error("Direct SQL fallback also failed:", sqlError);
          return [];
        }
      }
      
      // Transform Supabase snake_case to camelCase
      return data.map(i => ({
        id: i.id,
        userId: i.user_id,
        customerId: i.customer_id,
        invoiceNumber: i.invoice_number,
        invoiceDate: i.invoice_date,
        dueDate: i.due_date,
        notes: i.notes || null,
        status: i.status,
        subtotal: i.subtotal,
        cgst: i.cgst || '0.00',
        sgst: i.sgst || '0.00',
        igst: i.igst || '0.00',
        total: i.total,
        termsAndConditions: i.terms_and_conditions || null,
        templateId: i.template_id || 'standard',
        colorTheme: i.color_theme || 'blue'
      }));
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error("Supabase invoice fetch error:", error);
        return undefined;
      }
      
      if (!data) return undefined;
      
      // Transform Supabase snake_case to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        customerId: data.customer_id,
        invoiceNumber: data.invoice_number,
        invoiceDate: data.invoice_date,
        dueDate: data.due_date,
        notes: data.notes || null,
        status: data.status,
        subtotal: data.subtotal,
        cgst: data.cgst || '0.00',
        sgst: data.sgst || '0.00',
        igst: data.igst || '0.00',
        total: data.total,
        termsAndConditions: data.terms_and_conditions || null,
        templateId: data.template_id || 'standard',
        colorTheme: data.color_theme || 'blue'
      };
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return undefined;
    }
  }
  
  // Helper function to create a direct database connection for bypassing schema cache issues
  private async getDirectDbConnection(): Promise<Pool> {
    if (!process.env.DATABASE_URL) {
      throw new Error('No DATABASE_URL available for direct SQL connection');
    }
    return new Pool({ connectionString: process.env.DATABASE_URL });
  }
  
  // Helper function to force a schema refresh for Supabase
  private async forceSchemaRefresh(table: string, fields: string[]): Promise<boolean> {
    console.log(`Forcing schema refresh for ${table} table with fields: ${fields.join(', ')}`);
    
    try {
      // First try Supabase's native select to refresh the schema cache
      const selectQuery = fields.join(', ');
      await supabase.from(table).select(selectQuery).limit(1);
      
      // Also try to notify PostgREST to reload schema
      const pool = await this.getDirectDbConnection();
      try {
        await pool.query("SELECT pg_notify('pgrst', 'reload schema');");
        console.log("Sent schema reload notification to PostgREST");
      } catch (notifyError) {
        console.warn("Could not notify PostgREST to reload schema:", notifyError);
      } finally {
        await pool.end();
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to refresh schema for ${table}:`, error);
      return false;
    }
  }
  
  async getInvoiceWithItems(id: number): Promise<{ invoice: Invoice; items: InvoiceItem[] }> {
    try {
      // Get the invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();
        
      if (invoiceError) {
        console.error("Supabase invoice fetch error:", invoiceError);
        throw new Error('Invoice not found');
      }
      
      if (!invoiceData) {
        throw new Error('Invoice not found');
      }
      
      // Get the invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);
        
      if (itemsError) {
        console.error("Supabase invoice items fetch error:", itemsError);
        throw new Error('Error fetching invoice items');
      }
      
      // Transform Supabase snake_case to camelCase for invoice
      const invoice = {
        id: invoiceData.id,
        userId: invoiceData.user_id,
        customerId: invoiceData.customer_id,
        invoiceNumber: invoiceData.invoice_number,
        invoiceDate: invoiceData.invoice_date,
        dueDate: invoiceData.due_date,
        notes: invoiceData.notes || null,
        status: invoiceData.status,
        subtotal: invoiceData.subtotal,
        cgst: invoiceData.cgst || '0.00',
        sgst: invoiceData.sgst || '0.00',
        igst: invoiceData.igst || '0.00',
        total: invoiceData.total,
        termsAndConditions: invoiceData.terms_and_conditions || null,
        templateId: invoiceData.template_id || 'standard',
        colorTheme: invoiceData.color_theme || 'blue'
      };
      
      // Transform Supabase snake_case to camelCase for items
      const items = itemsData.map((item: any) => ({
        id: item.id,
        invoiceId: item.invoice_id,
        productId: item.product_id,
        description: item.description,
        unit: item.unit || 'Piece', // Adding unit field with default value
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        gstRate: item.gst_rate,
        hsnCode: item.hsn_code || null
      }));
      
      return { invoice, items };
    } catch (error) {
      console.error("Error fetching invoice with items:", error);
      throw error;
    }
  }

  async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    // Validate input data first
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Cannot create invoice: No invoice items provided");
    }
    
    // Validate invoice object
    if (!invoice || !invoice.userId || !invoice.customerId) {
      throw new Error("Cannot create invoice: Invalid invoice data (missing userId or customerId)");
    }
    
    console.log("Starting invoice creation process with", items.length, "items");

    // Forcibly refresh the schema cache for both tables
    await this.forceSchemaRefresh('invoices', [
      'id', 'user_id', 'customer_id', 'invoice_number', 'invoice_date', 'due_date', 
      'notes', 'status', 'subtotal', 'cgst', 'sgst', 'igst', 'total', 
      'terms_and_conditions', 'template_id', 'color_theme'
    ]);
    
    await this.forceSchemaRefresh('invoice_items', [
      'id', 'invoice_id', 'product_id', 'description', 'unit', 
      'quantity', 'rate', 'amount', 'gst_rate', 'hsn_code'
    ]);
    
    // Use direct database operations for best reliability
    if (process.env.DATABASE_URL) {
      try {
        console.log("Using direct SQL transaction for invoice creation");
        const pool = await this.getDirectDbConnection();
        
        try {
          // Start transaction
          await pool.query('BEGIN');
          
          // Prepare invoice data for SQL
          const sqlInvoice = {
            user_id: invoice.userId,
            customer_id: invoice.customerId,
            invoice_number: invoice.invoiceNumber || `INV-${Date.now()}`,
            invoice_date: invoice.invoiceDate,
            due_date: invoice.dueDate || null,
            notes: invoice.notes || '',
            status: invoice.status || 'draft',
            subtotal: invoice.subtotal || '0.00',
            cgst: invoice.cgst || '0.00',
            sgst: invoice.sgst || '0.00',
            igst: invoice.igst || '0.00',
            total: invoice.total || '0.00',
            terms_and_conditions: invoice.termsAndConditions || '',
            template_id: invoice.templateId || 'standard',
            color_theme: invoice.colorTheme || 'blue'
          };
          
          // Insert the invoice and get the ID
          const invoiceResult = await pool.query(`
            INSERT INTO invoices
              (user_id, customer_id, invoice_number, invoice_date, due_date, notes, status, 
               subtotal, cgst, sgst, igst, total, terms_and_conditions, template_id, color_theme)
            VALUES 
              ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id
          `, [
            sqlInvoice.user_id,
            sqlInvoice.customer_id,
            sqlInvoice.invoice_number,
            sqlInvoice.invoice_date,
            sqlInvoice.due_date,
            sqlInvoice.notes,
            sqlInvoice.status,
            sqlInvoice.subtotal,
            sqlInvoice.cgst,
            sqlInvoice.sgst,
            sqlInvoice.igst,
            sqlInvoice.total,
            sqlInvoice.terms_and_conditions,
            sqlInvoice.template_id,
            sqlInvoice.color_theme
          ]);
          
          if (!invoiceResult.rows || invoiceResult.rows.length === 0) {
            throw new Error("Failed to create invoice - no ID returned");
          }
          
          const invoiceId = invoiceResult.rows[0].id;
          console.log("Created invoice with ID:", invoiceId);
          
          // First verify all products exist in the database
          if (items.some(item => item.productId)) {
            console.log("Invoice contains product references, verifying they exist...");
            
            // Get all product IDs from items that are not null
            const productIds = items
              .map(item => item.productId)
              .filter(id => id !== null && id !== undefined);
              
            if (productIds.length > 0) {
              console.log("Checking existence of products:", productIds);
              
              // Query database to verify products exist
              const productsQuery = await pool.query(`
                SELECT id FROM products WHERE id = ANY($1)
              `, [productIds]);
              
              const existingProductIds = productsQuery.rows.map(row => row.id);
              console.log("Found existing product IDs:", existingProductIds);
              
              // Check for any missing products
              const missingProductIds = productIds.filter(id => !existingProductIds.includes(id));
              if (missingProductIds.length > 0) {
                console.warn("Products not found in the database:", missingProductIds);
                
                // Instead of throwing an error, set those product IDs to null
                console.log("Setting non-existent product IDs to null...");
                items = items.map(item => {
                  if (item.productId && missingProductIds.includes(item.productId)) {
                    console.log(`Setting product_id ${item.productId} to null for "${item.description}"`);
                    return { ...item, productId: null };
                  }
                  return item;
                });
              }
            }
          }
          
          // Process items and prepare for insertion with detailed logging
          const sqlItems = items.map((item, index) => {
            console.log(`Processing invoice item ${index}:`, JSON.stringify(item, null, 2));
            
            // Safely handle potentially undefined fields
            if (!item) {
              console.warn(`Item at index ${index} is undefined or null, creating default item`);
              item = {
                productId: null,  // Always use null for product_id if item is undefined
                description: `Item ${index + 1}`,
                unit: 'Piece',
                quantity: 1,
                rate: 0,
                amount: 0,
                gstRate: 0,
                hsnCode: null
              };
            }
            
            // Ensure numeric values are valid numbers with better defensive checks
            const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity ?? 1);
            const rate = typeof item.rate === 'string' ? parseFloat(item.rate) : (item.rate ?? 0);
            const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : (quantity * rate);
            const gstRate = typeof item.gstRate === 'string' ? parseFloat(item.gstRate) : (item.gstRate ?? 0);
            
            // Create item with detailed logging to help debug
            const processedItem = {
              invoice_id: invoiceId,
              product_id: null, // Default to null
              description: item.description || `Item ${index + 1}`,
              unit: item.unit || 'Piece',
              quantity: isNaN(quantity) ? 1 : quantity,
              rate: isNaN(rate) ? 0 : rate,
              amount: isNaN(amount) ? quantity * rate : amount,
              gst_rate: isNaN(gstRate) ? 0 : gstRate,
              hsn_code: item.hsnCode || null
            };
            
            // Only set product_id if it's provided in the item
            if (item.productId !== undefined && item.productId !== null) {
              processedItem.product_id = item.productId;
            }
            
            console.log(`Processed invoice item ${index}:`, JSON.stringify(processedItem, null, 2));
            return processedItem;
          });
          
          // Insert each item in the same transaction
          console.log("Inserting", sqlItems.length, "invoice items...");
          
          let insertedItems = [];
          for (const item of sqlItems) {
            try {
              const itemResult = await pool.query(`
                INSERT INTO invoice_items
                  (invoice_id, product_id, description, unit, quantity, rate, amount, gst_rate, hsn_code)
                VALUES
                  ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id
              `, [
                item.invoice_id,
                item.product_id,
                item.description,
                item.unit,
                item.quantity,
                item.rate,
                item.amount,
                item.gst_rate,
                item.hsn_code
              ]);
              
              if (itemResult.rows && itemResult.rows.length > 0) {
                const itemId = itemResult.rows[0].id;
                console.log(`Added item ${itemId} to invoice ${invoiceId}`);
                insertedItems.push(itemId);
              }
            } catch (itemError: any) {
              console.error("Error inserting invoice item:", itemError);
              throw new Error(`Failed to insert invoice item: ${itemError.message || String(itemError)}`);
            }
          }
          
          // If we couldn't insert any items, rollback
          if (insertedItems.length === 0) {
            throw new Error("Failed to insert any invoice items");
          }
          
          // Commit the transaction
          await pool.query('COMMIT');
          console.log(`Successfully created invoice #${invoiceId} with ${insertedItems.length} items via direct SQL`);
          
          // Fetch the complete invoice data for return
          const completeInvoice = await pool.query(`
            SELECT * FROM invoices WHERE id = $1
          `, [invoiceId]);
          
          if (!completeInvoice.rows || completeInvoice.rows.length === 0) {
            throw new Error("Invoice was created but could not be retrieved");
          }
          
          // Transform the invoice data to camelCase
          const invoiceData = completeInvoice.rows[0];
          
          // Refresh Supabase schema cache to make the new records visible
          try {
            // First try standard refresh
            await refreshSupabaseSchemaCache();
            console.log("Refreshed Supabase schema cache after direct SQL insert");
            
            // Force a specific table refresh for invoices and invoice_items
            try {
              // Add a small delay to ensure PostgreSQL has time to commit
              await new Promise(resolve => setTimeout(resolve, 500));
              
              console.log("Performing targeted table refresh for invoices and invoice_items...");
              
              // Force refresh for invoices table
              const { error: invError } = await supabase.rpc('reload_schema_cache');
              if (invError) {
                console.warn("Error refreshing Supabase RPC schema cache:", invError);
              }
              
              // Also do a simple query to force cache refresh
              const { data, error } = await supabase
                .from('invoices')
                .select('id')
                .eq('id', invoiceId)
                .limit(1);
                
              if (error) {
                console.warn("Error during cache refresh query:", error);
              } else {
                console.log("Cache refresh query successful:", data);
              }
              
              // Do the same for invoice_items
              const { data: itemsData, error: itemsError } = await supabase
                .from('invoice_items')
                .select('id')
                .eq('invoice_id', invoiceId)
                .limit(1);
                
              if (itemsError) {
                console.warn("Error during invoice_items cache refresh query:", itemsError);
              } else {
                console.log("Invoice items cache refresh query successful:", itemsData);
              }
            } catch (targetedRefreshError) {
              console.warn("Error during targeted table refresh:", targetedRefreshError);
            }
          } catch (cacheError) {
            console.warn("Could not refresh Supabase schema cache, records may not be immediately visible:", cacheError);
          }
          
          // Return the formatted result
          return {
            id: invoiceData.id,
            userId: invoiceData.user_id,
            customerId: invoiceData.customer_id,
            invoiceNumber: invoiceData.invoice_number,
            invoiceDate: invoiceData.invoice_date,
            dueDate: invoiceData.due_date,
            notes: invoiceData.notes || null,
            status: invoiceData.status,
            subtotal: invoiceData.subtotal,
            cgst: invoiceData.cgst || '0.00',
            sgst: invoiceData.sgst || '0.00',
            igst: invoiceData.igst || '0.00',
            total: invoiceData.total,
            termsAndConditions: invoiceData.terms_and_conditions || null,
            templateId: invoiceData.template_id || 'standard',
            colorTheme: invoiceData.color_theme || 'blue'
          };
        } catch (txError: any) {
          // If anything goes wrong, rollback the transaction
          console.error("Transaction failed, rolling back:", txError);
          try {
            await pool.query('ROLLBACK');
          } catch (rollbackError) {
            console.error("Error during rollback:", rollbackError);
          }
          throw txError;
        } finally {
          await pool.end();
        }
      } catch (dbError: any) {
        console.error("Database error:", dbError);
        throw new Error(`Invoice creation failed: ${dbError.message || String(dbError)}`);
      }
    } else {
      throw new Error("No DATABASE_URL available");
    }
  }
  
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    try {
      // Convert partial invoice from camelCase to snake_case
      const supabaseInvoice: Record<string, any> = {};
      
      if ('userId' in invoice) supabaseInvoice.user_id = invoice.userId;
      if ('customerId' in invoice) supabaseInvoice.customer_id = invoice.customerId;
      if ('invoiceNumber' in invoice) supabaseInvoice.invoice_number = invoice.invoiceNumber;
      if ('invoiceDate' in invoice) supabaseInvoice.invoice_date = invoice.invoiceDate;
      if ('dueDate' in invoice) supabaseInvoice.due_date = invoice.dueDate;
      if ('notes' in invoice) supabaseInvoice.notes = invoice.notes;
      if ('status' in invoice) supabaseInvoice.status = invoice.status;
      if ('subtotal' in invoice) supabaseInvoice.subtotal = invoice.subtotal;
      if ('cgst' in invoice) supabaseInvoice.cgst = invoice.cgst || '0.00';
      if ('sgst' in invoice) supabaseInvoice.sgst = invoice.sgst || '0.00';
      if ('igst' in invoice) supabaseInvoice.igst = invoice.igst || '0.00';
      if ('total' in invoice) supabaseInvoice.total = invoice.total;
      if ('termsAndConditions' in invoice) supabaseInvoice.terms_and_conditions = invoice.termsAndConditions;
      if ('templateId' in invoice) supabaseInvoice.template_id = invoice.templateId;
      if ('colorTheme' in invoice) supabaseInvoice.color_theme = invoice.colorTheme;
      
      // Update using Supabase
      const { data, error } = await supabase
        .from('invoices')
        .update(supabaseInvoice)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase invoice update error:", error);
        return undefined;
      }
      
      // Transform back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        customerId: data.customer_id,
        invoiceNumber: data.invoice_number,
        invoiceDate: data.invoice_date,
        dueDate: data.due_date,
        notes: data.notes || null,
        status: data.status,
        subtotal: data.subtotal,
        cgst: data.cgst || '0.00',
        sgst: data.sgst || '0.00',
        igst: data.igst || '0.00',
        total: data.total,
        termsAndConditions: data.terms_and_conditions || null,
        templateId: data.template_id || 'standard',
        colorTheme: data.color_theme || 'blue'
      };
    } catch (error) {
      console.error("Error updating invoice:", error);
      return undefined;
    }
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    try {
      // First delete all associated invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
        
      if (itemsError) {
        console.error("Supabase invoice items delete error:", itemsError);
        return false;
      }
      
      // Then delete the invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Supabase invoice delete error:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting invoice:", error);
      return false;
    }
  }
  
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
        
      if (error) {
        console.error("Supabase invoice items fetch error:", error);
        return [];
      }
      
      // Transform Supabase snake_case to camelCase
      return data.map((item: any) => ({
        id: item.id,
        invoiceId: item.invoice_id,
        productId: item.product_id,
        description: item.description,
        unit: item.unit || 'Piece',
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        gstRate: item.gst_rate,
        hsnCode: item.hsn_code || null
      }));
    } catch (error) {
      console.error("Error fetching invoice items:", error);
      return [];
    }
  }
  
  async addInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    try {
      console.log("Adding invoice item:", JSON.stringify(item, null, 2));
      
      // Ensure all required fields exist and have fallbacks
      if (!item) {
        throw new Error("Cannot add invoice item: Item is undefined");
      }
      
      // First check if product exists if productId is provided
      let finalProductId = null;
      if (item.productId) {
        console.log(`Verifying product ID ${item.productId} exists before adding invoice item`);
        
        try {
          // Check if product exists in the database
          const { data, error } = await supabase
            .from('products')
            .select('id')
            .eq('id', item.productId)
            .single();
          
          if (error || !data) {
            console.warn(`Product with ID ${item.productId} not found in Supabase, will set product_id to null`);
          } else {
            console.log(`Verified product ID ${item.productId} exists`);
            finalProductId = item.productId;
          }
        } catch (productCheckError) {
          console.error("Error checking product existence:", productCheckError);
          console.warn(`Will use null for product_id due to error checking product existence`);
        }
      }
      
      // Perform type conversions and validations
      const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : (item.quantity ?? 1);
      const rate = typeof item.rate === 'string' ? parseFloat(item.rate) : (item.rate ?? 0);
      const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : (quantity * rate);
      const gstRate = typeof item.gstRate === 'string' ? parseFloat(item.gstRate) : (item.gstRate ?? 0);
      
      // Convert camelCase to snake_case for Supabase with improved error handling
      const supabaseItem = {
        invoice_id: item.invoiceId,
        product_id: finalProductId, // Use verified product ID or null
        description: item.description || 'Unnamed Item',
        unit: item.unit || 'Piece',
        quantity: isNaN(quantity) ? 1 : quantity,
        rate: isNaN(rate) ? 0 : rate,
        amount: isNaN(amount) ? (isNaN(quantity) ? 1 : quantity) * (isNaN(rate) ? 0 : rate) : amount,
        gst_rate: isNaN(gstRate) ? 0 : gstRate,
        hsn_code: item.hsnCode || null
      };
      
      console.log("Prepared invoice item for Supabase:", JSON.stringify(supabaseItem, null, 2));
      
      // Attempt insert with Supabase
      const { data, error } = await supabase
        .from('invoice_items')
        .insert(supabaseItem)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase invoice item creation error:", error);
        
        // Try with direct SQL if Supabase fails (common with schema cache issues)
        console.log("Trying direct SQL insert for invoice item as fallback");
        const pool = await this.getDirectDbConnection();
        
        try {
          // Double check product existence with direct SQL
          if (finalProductId !== null) {
            const productCheck = await pool.query(`
              SELECT id FROM products WHERE id = $1
            `, [finalProductId]);
            
            if (!productCheck.rows || productCheck.rows.length === 0) {
              console.warn(`Product with ID ${finalProductId} not found in direct SQL check, setting product_id to null`);
              finalProductId = null;
              supabaseItem.product_id = null;
            }
          }
          
          const result = await pool.query(`
            INSERT INTO invoice_items
              (invoice_id, product_id, description, unit, quantity, rate, amount, gst_rate, hsn_code)
            VALUES
              ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
          `, [
            supabaseItem.invoice_id,
            supabaseItem.product_id, // Use updated product_id
            supabaseItem.description,
            supabaseItem.unit,
            supabaseItem.quantity,
            supabaseItem.rate,
            supabaseItem.amount,
            supabaseItem.gst_rate,
            supabaseItem.hsn_code
          ]);
          
          if (result.rows && result.rows.length > 0) {
            const row = result.rows[0];
            console.log("Successfully inserted invoice item via direct SQL:", row.id);
            
            // Transform SQL result to camelCase
            return {
              id: row.id,
              invoiceId: row.invoice_id,
              productId: row.product_id,
              description: row.description,
              unit: row.unit || 'Piece',
              quantity: row.quantity,
              rate: row.rate,
              amount: row.amount,
              gstRate: row.gst_rate,
              hsnCode: row.hsn_code
            };
          } else {
            throw new Error("Direct SQL insert returned no rows");
          }
        } catch (sqlError) {
          console.error("Direct SQL insert failed:", sqlError);
          throw new Error(`Failed to create invoice item: ${error.message}`);
        } finally {
          await pool.end();
        }
      }
      
      if (!data) {
        throw new Error("Failed to create invoice item: No data returned");
      }
      
      console.log("Successfully created invoice item with Supabase:", data.id);
      
      // Transform Supabase snake_case to camelCase
      return {
        id: data.id,
        invoiceId: data.invoice_id,
        productId: data.product_id,
        description: data.description,
        unit: data.unit || 'Piece',
        quantity: data.quantity,
        rate: data.rate,
        amount: data.amount,
        gstRate: data.gst_rate,
        hsnCode: data.hsn_code
      };
    } catch (error) {
      console.error("Error adding invoice item:", error);
      throw error;
    }
  }
  
  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    try {
      // Convert partial item from camelCase to snake_case
      const supabaseItem: Record<string, any> = {};
      
      if ('invoiceId' in item) supabaseItem.invoice_id = item.invoiceId;
      if ('productId' in item) supabaseItem.product_id = item.productId;
      if ('description' in item) supabaseItem.description = item.description;
      if ('unit' in item) supabaseItem.unit = item.unit;
      if ('quantity' in item) supabaseItem.quantity = item.quantity;
      if ('rate' in item) supabaseItem.rate = item.rate;
      if ('amount' in item) supabaseItem.amount = item.amount;
      if ('gstRate' in item) supabaseItem.gst_rate = item.gstRate;
      if ('hsnCode' in item) supabaseItem.hsn_code = item.hsnCode;
      
      // Update using Supabase
      const { data, error } = await supabase
        .from('invoice_items')
        .update(supabaseItem)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error("Supabase invoice item update error:", error);
        return undefined;
      }
      
      // Transform back to camelCase
      return {
        id: data.id,
        invoiceId: data.invoice_id,
        productId: data.product_id,
        description: data.description,
        unit: data.unit || 'Piece',
        quantity: data.quantity,
        rate: data.rate,
        amount: data.amount,
        gstRate: data.gst_rate,
        hsnCode: data.hsn_code || null
      };
    } catch (error) {
      console.error("Error updating invoice item:", error);
      return undefined;
    }
  }
  
  async deleteInvoiceItem(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invoice_items')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error("Supabase invoice item delete error:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      return false;
    }
  }
  
  async getInvoiceStats(userId: number): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    unpaidInvoices: number;
    totalCustomers: number;
  }> {
    try {
      // Count total invoices
      const { count: invoicesCount, error: invoicesError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (invoicesError) {
        console.error("Supabase invoices count error:", invoicesError);
        throw invoicesError;
      }
      
      // Calculate total revenue
      const { data: revenueData, error: revenueError } = await supabase
        .from('invoices')
        .select('total')
        .eq('user_id', userId);
        
      if (revenueError) {
        console.error("Supabase revenue calculation error:", revenueError);
        throw revenueError;
      }
      
      // Calculate total revenue from data
      const totalRevenue = revenueData.reduce((sum, invoice) => {
        const total = parseFloat(invoice.total || '0');
        return sum + (isNaN(total) ? 0 : total);
      }, 0);
      
      // Count unpaid invoices
      const { count: unpaidCount, error: unpaidError } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'unpaid');
        
      if (unpaidError) {
        console.error("Supabase unpaid invoices count error:", unpaidError);
        throw unpaidError;
      }
      
      // Count total customers
      const { count: customersCount, error: customersError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
        
      if (customersError) {
        console.error("Supabase customers count error:", customersError);
        throw customersError;
      }
      
      return {
        totalInvoices: invoicesCount || 0,
        totalRevenue,
        unpaidInvoices: unpaidCount || 0,
        totalCustomers: customersCount || 0
      };
    } catch (error) {
      console.error("Error calculating invoice stats:", error);
      return {
        totalInvoices: 0,
        totalRevenue: 0,
        unpaidInvoices: 0,
        totalCustomers: 0
      };
    }
  }
}

export const storage = new SupabaseStorage();
