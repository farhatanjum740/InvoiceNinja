import { createClient } from '@supabase/supabase-js';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import { 
  User, InsertUser, 
  Company, InsertCompany, 
  Customer, InsertCustomer, 
  Product, InsertProduct,
  Invoice, InsertInvoice,
  InvoiceItem, InsertInvoiceItem
} from '@shared/schema';
import { supabase, pool, syncDirectDatabaseChange } from './db';

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

// Utility function to transform snake_case data from Supabase to camelCase
function snakeToCamel<T>(data: any): T {
  const result: any = {};
  
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // Convert snake_case to camelCase
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = data[key];
    }
  }
  
  return result as T;
}

export class SupabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    
    // Create a connection pool for the session store
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required');
    }
    
    // Use the imported pool from db.ts
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
    
    console.log('Using PostgreSQL session store');
  }
  
  // User Management
  async getUser(id: number): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !data) {
        console.error("Error fetching user:", error);
        return undefined;
      }
      
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
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
      
      if (error || !data) {
        return undefined;
      }
      
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
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
      
      if (error || !data) {
        return undefined;
      }
      
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return undefined;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: user.username,
          email: user.email,
          password: user.password,
          name: user.name || null
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating user:", error);
        throw new Error(`Failed to create user: ${error.message}`);
      }
      
      return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: data.password,
        name: data.name,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error("Error in createUser:", error);
      throw error;
    }
  }
  
  // Company Management
  async getCompanyByUserId(userId: number): Promise<Company | undefined> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        return undefined;
      }
      
      return {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        email: data.email,
        gstin: data.gstin,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        ifscCode: data.ifsc_code,
        logo: data.logo
      };
    } catch (error) {
      console.error("Error in getCompanyByUserId:", error);
      return undefined;
    }
  }
  
  async createCompany(company: InsertCompany): Promise<Company> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .insert({
          name: company.name,
          user_id: company.userId,
          email: company.email || null,
          gstin: company.gstin || null,
          address: company.address,
          city: company.city,
          state: company.state,
          pincode: company.pincode,
          phone: company.phone || null,
          bank_name: company.bankName || null,
          account_number: company.accountNumber || null,
          ifsc_code: company.ifscCode || null,
          logo: company.logo || null
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error creating company:", error);
        throw new Error(`Failed to create company: ${error.message}`);
      }
      
      return {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        email: data.email,
        gstin: data.gstin,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        ifscCode: data.ifsc_code,
        logo: data.logo
      };
    } catch (error) {
      console.error("Error in createCompany:", error);
      throw error;
    }
  }
  
  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    try {
      // Transform camelCase to snake_case for Supabase
      const updateData: any = {};
      
      if (company.name) updateData.name = company.name;
      if (company.email !== undefined) updateData.email = company.email;
      if (company.gstin !== undefined) updateData.gstin = company.gstin;
      if (company.address) updateData.address = company.address;
      if (company.city) updateData.city = company.city;
      if (company.state) updateData.state = company.state;
      if (company.pincode) updateData.pincode = company.pincode;
      if (company.phone !== undefined) updateData.phone = company.phone;
      if (company.bankName !== undefined) updateData.bank_name = company.bankName;
      if (company.accountNumber !== undefined) updateData.account_number = company.accountNumber;
      if (company.ifscCode !== undefined) updateData.ifsc_code = company.ifscCode;
      if (company.logo !== undefined) updateData.logo = company.logo;
      
      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating company:", error);
        return undefined;
      }
      
      return {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        email: data.email,
        gstin: data.gstin,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        ifscCode: data.ifsc_code,
        logo: data.logo
      };
    } catch (error) {
      console.error("Error in updateCompany:", error);
      return undefined;
    }
  }
  
  // Customer Management
  async getCustomersByUserId(userId: number): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error("Error fetching customers:", error);
        return [];
      }
      
      return data.map(c => ({
        id: c.id,
        name: c.name,
        userId: c.user_id,
        email: c.email,
        gstin: c.gstin,
        phone: c.phone,
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
      console.error("Error in getCustomersByUserId:", error);
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
      
      if (error || !data) {
        return undefined;
      }
      
      return {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        email: data.email,
        gstin: data.gstin,
        phone: data.phone,
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
      console.error("Error in getCustomer:", error);
      return undefined;
    }
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    try {
      console.log("Creating customer with data:", { 
        ...customer, 
        userId: customer.userId 
      });
      
      // First, manually set the sequence to a high enough value to avoid conflicts
      try {
        await pool.query("SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers) + 5, true)");
        console.log("Successfully reset sequence for customers table");
      } catch (seqError: any) {
        console.warn("Failed to reset sequence:", seqError.message || seqError);
      }
      
      // Try direct SQL first - more reliable approach
      try {
        // Generate a safe ID by adding a buffer to the current max ID
        const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) + 10 as next_id FROM customers');
        const nextId = maxIdResult.rows[0].next_id;
        console.log("Using generated ID for customer insert:", nextId);
        
        const result = await pool.query(
          `INSERT INTO customers (
            id, name, user_id, email, gstin, phone, 
            billing_address, billing_city, billing_state, billing_pincode,
            shipping_address, shipping_city, shipping_state, shipping_pincode,
            same_as_shipping
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          ) RETURNING *`,
          [
            nextId,
            customer.name,
            customer.userId,
            customer.email || null,
            customer.gstin || null,
            customer.phone || null,
            customer.billingAddress || null,
            customer.billingCity || null,
            customer.billingState || null,
            customer.billingPincode || null,
            customer.shippingAddress || null,
            customer.shippingCity || null,
            customer.shippingState || null,
            customer.shippingPincode || null,
            customer.sameAsShipping || false
          ]
        );
        
        if (result.rows.length > 0) {
          const newCustomer = result.rows[0];
          console.log("Successfully created customer with direct SQL using ID:", nextId);
          
          // Sync the direct database change with Supabase
          await syncDirectDatabaseChange('customers');
          
          return {
            id: newCustomer.id,
            name: newCustomer.name,
            userId: newCustomer.user_id,
            email: newCustomer.email,
            gstin: newCustomer.gstin,
            phone: newCustomer.phone,
            billingAddress: newCustomer.billing_address,
            billingCity: newCustomer.billing_city,
            billingState: newCustomer.billing_state,
            billingPincode: newCustomer.billing_pincode,
            shippingAddress: newCustomer.shipping_address,
            shippingCity: newCustomer.shipping_city,
            shippingState: newCustomer.shipping_state,
            shippingPincode: newCustomer.shipping_pincode,
            sameAsShipping: newCustomer.same_as_shipping
          };
        }
      } catch (directSqlError: any) {
        console.warn("Direct SQL insert failed, attempting Supabase Data API:", directSqlError.message || directSqlError);
      }
      
      // Fallback to Supabase Data API if direct SQL fails
      console.log("Attempting insert with Supabase Data API");
      const { data: createdCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          name: customer.name,
          user_id: customer.userId,
          email: customer.email || null,
          gstin: customer.gstin || null,
          phone: customer.phone || null,
          billing_address: customer.billingAddress || null,
          billing_city: customer.billingCity || null,
          billing_state: customer.billingState || null,
          billing_pincode: customer.billingPincode || null,
          shipping_address: customer.shippingAddress || null,
          shipping_city: customer.shippingCity || null,
          shipping_state: customer.shippingState || null,
          shipping_pincode: customer.shippingPincode || null,
          same_as_shipping: customer.sameAsShipping || false
        })
        .select()
        .single();
        
      if (insertError) {
        console.error("Supabase insert failed:", insertError);
        throw new Error(`Failed to create customer: ${insertError.message}`);
      }
      
      // If we reach here, the Supabase insert succeeded
      console.log("Successfully created customer with Supabase API, ID:", createdCustomer.id);
      return {
        id: createdCustomer.id,
        name: createdCustomer.name,
        userId: createdCustomer.user_id,
        email: createdCustomer.email,
        gstin: createdCustomer.gstin,
        phone: createdCustomer.phone,
        billingAddress: createdCustomer.billing_address,
        billingCity: createdCustomer.billing_city,
        billingState: createdCustomer.billing_state,
        billingPincode: createdCustomer.billing_pincode,
        shippingAddress: createdCustomer.shipping_address,
        shippingCity: createdCustomer.shipping_city,
        shippingState: createdCustomer.shipping_state,
        shippingPincode: createdCustomer.shipping_pincode,
        sameAsShipping: createdCustomer.same_as_shipping
      };
    } catch (error: any) {
      console.error("Error in createCustomer:", error.message || error);
      throw error;
    }
  }
  
  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    try {
      // Transform camelCase to snake_case for Supabase
      const updateData: any = {};
      
      if (customer.name) updateData.name = customer.name;
      if (customer.email !== undefined) updateData.email = customer.email;
      if (customer.gstin !== undefined) updateData.gstin = customer.gstin;
      if (customer.phone !== undefined) updateData.phone = customer.phone;
      if (customer.billingAddress) updateData.billing_address = customer.billingAddress;
      if (customer.billingCity) updateData.billing_city = customer.billingCity;
      if (customer.billingState) updateData.billing_state = customer.billingState;
      if (customer.billingPincode) updateData.billing_pincode = customer.billingPincode;
      if (customer.shippingAddress) updateData.shipping_address = customer.shippingAddress;
      if (customer.shippingCity) updateData.shipping_city = customer.shippingCity;
      if (customer.shippingState) updateData.shipping_state = customer.shippingState;
      if (customer.shippingPincode) updateData.shipping_pincode = customer.shippingPincode;
      if (customer.sameAsShipping !== undefined) updateData.same_as_shipping = customer.sameAsShipping;
      
      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating customer:", error);
        return undefined;
      }
      
      return {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        email: data.email,
        gstin: data.gstin,
        phone: data.phone,
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
      console.error("Error in updateCustomer:", error);
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
        console.error("Error deleting customer:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in deleteCustomer:", error);
      return false;
    }
  }
  
  // Product Management
  async getProductsByUserId(userId: number): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error("Error fetching products:", error);
        return [];
      }
      
      return data.map(p => ({
        id: p.id,
        name: p.name,
        userId: p.user_id,
        description: p.description,
        hsnCode: p.hsn_code,
        unit: p.unit,
        rate: p.rate,
        gstRate: p.gst_rate
      }));
    } catch (error) {
      console.error("Error in getProductsByUserId:", error);
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
      
      if (error || !data) {
        return undefined;
      }
      
      return {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        description: data.description,
        hsnCode: data.hsn_code,
        unit: data.unit,
        rate: data.rate,
        gstRate: data.gst_rate
      };
    } catch (error) {
      console.error("Error in getProduct:", error);
      return undefined;
    }
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      console.log("Creating product with data:", { 
        ...product, 
        userId: product.userId 
      });
      
      // First, manually set the sequence to a high enough value to avoid conflicts
      try {
        await pool.query("SELECT setval('products_id_seq', (SELECT MAX(id) FROM products) + 5, true)");
        console.log("Successfully reset sequence for products table");
      } catch (seqError: any) {
        console.warn("Failed to reset sequence:", seqError.message || seqError);
      }
      
      // Try direct SQL first - more reliable approach
      try {
        // Generate a safe ID by adding a buffer to the current max ID
        const maxIdResult = await pool.query('SELECT COALESCE(MAX(id), 0) + 10 as next_id FROM products');
        const nextId = maxIdResult.rows[0].next_id;
        console.log("Using generated ID for product insert:", nextId);
        
        const result = await pool.query(
          `INSERT INTO products (
            id, name, user_id, description, hsn_code, unit, rate, gst_rate
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          ) RETURNING *`,
          [
            nextId,
            product.name,
            product.userId,
            product.description || null,
            product.hsnCode || null,
            product.unit || 'Piece',
            product.rate || 0,
            product.gstRate || 0
          ]
        );
        
        if (result.rows.length > 0) {
          const newProduct = result.rows[0];
          console.log("Successfully created product with direct SQL using ID:", nextId);
          
          // Sync the direct database change with Supabase
          await syncDirectDatabaseChange('products');
          
          return {
            id: newProduct.id,
            name: newProduct.name,
            userId: newProduct.user_id,
            description: newProduct.description,
            hsnCode: newProduct.hsn_code,
            unit: newProduct.unit,
            rate: newProduct.rate,
            gstRate: newProduct.gst_rate
          };
        }
      } catch (directSqlError: any) {
        console.warn("Direct SQL insert failed, attempting Supabase Data API:", directSqlError.message || directSqlError);
      }
      
      // Fallback to Supabase Data API if direct SQL fails
      console.log("Attempting insert with Supabase Data API");
      const { data: createdProduct, error: insertError } = await supabase
        .from('products')
        .insert({
          name: product.name,
          user_id: product.userId,
          description: product.description || null,
          hsn_code: product.hsnCode || null,
          unit: product.unit || 'Piece',
          rate: product.rate || 0,
          gst_rate: product.gstRate || 0
        })
        .select()
        .single();
        
      if (insertError) {
        console.error("Supabase insert failed:", insertError);
        throw new Error(`Failed to create product: ${insertError.message}`);
      }
      
      // If we reach here, the Supabase insert succeeded
      console.log("Successfully created product with Supabase API, ID:", createdProduct.id);
      return {
        id: createdProduct.id,
        name: createdProduct.name,
        userId: createdProduct.user_id,
        description: createdProduct.description,
        hsnCode: createdProduct.hsn_code,
        unit: createdProduct.unit,
        rate: createdProduct.rate,
        gstRate: createdProduct.gst_rate
      };
    } catch (error: any) {
      console.error("Error in createProduct:", error.message || error);
      throw error;
    }
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      const updateData: any = {};
      
      if (product.name) updateData.name = product.name;
      if (product.description !== undefined) updateData.description = product.description;
      if (product.hsnCode !== undefined) updateData.hsn_code = product.hsnCode;
      if (product.unit) updateData.unit = product.unit;
      if (product.rate) updateData.rate = product.rate;
      if (product.gstRate !== undefined) updateData.gst_rate = product.gstRate;
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating product:", error);
        return undefined;
      }
      
      return {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        description: data.description,
        hsnCode: data.hsn_code,
        unit: data.unit,
        rate: data.rate,
        gstRate: data.gst_rate
      };
    } catch (error) {
      console.error("Error in updateProduct:", error);
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
        console.error("Error deleting product:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in deleteProduct:", error);
      return false;
    }
  }
  
  // Invoice Management
  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });
      
      if (error) {
        console.error("Error fetching invoices:", error);
        return [];
      }
      
      return data.map(inv => ({
        id: inv.id,
        userId: inv.user_id,
        customerId: inv.customer_id,
        invoiceNumber: inv.invoice_number,
        invoiceDate: inv.invoice_date,
        dueDate: inv.due_date,
        notes: inv.notes || null,
        status: inv.status,
        subtotal: inv.subtotal,
        cgst: inv.cgst || '0.00',
        sgst: inv.sgst || '0.00',
        igst: inv.igst || '0.00',
        total: inv.total,
        termsAndConditions: inv.terms_and_conditions || null,
        templateId: inv.template_id || 'standard',
        colorTheme: inv.color_theme || 'blue'
      }));
    } catch (error) {
      console.error("Error in getInvoicesByUserId:", error);
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
      
      if (error || !data) {
        console.error("Error fetching invoice:", error);
        return undefined;
      }
      
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
      console.error("Error in getInvoice:", error);
      return undefined;
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
      
      if (invoiceError || !invoiceData) {
        console.error("Error fetching invoice:", invoiceError);
        throw new Error('Invoice not found');
      }
      
      // Get the invoice items
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);
      
      if (itemsError) {
        console.error("Error fetching invoice items:", itemsError);
        throw new Error('Error fetching invoice items');
      }
      
      // Transform the data
      const invoice: Invoice = {
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
      
      const items: InvoiceItem[] = itemsData.map(item => ({
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
      
      return { invoice, items };
    } catch (error) {
      console.error("Error in getInvoiceWithItems:", error);
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
    
    console.log("Starting invoice creation through Supabase with", items.length, "items");

    try {
      // Prepare invoice data for Supabase
      const supabaseInvoice = {
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
      
      // Insert the invoice through Supabase
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .insert(supabaseInvoice)
        .select('id')
        .single();
      
      if (invoiceError) {
        console.error("Supabase invoice insert error:", invoiceError);
        throw new Error(`Failed to create invoice: ${invoiceError.message}`);
      }
      
      const invoiceId = invoiceData.id;
      console.log("Created invoice with ID:", invoiceId, "via Supabase");
      
      // Verify all products exist before creating invoice items
      if (items.some(item => item.productId)) {
        console.log("Invoice contains product references, verifying they exist...");
        
        // Get all product IDs from items that are not null
        const productIds = items
          .map(item => item.productId)
          .filter(id => id !== null && id !== undefined);
          
        if (productIds.length > 0) {
          console.log("Checking existence of products:", productIds);
          
          // Query database to verify products exist
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id')
            .in('id', productIds);
          
          if (productsError) {
            console.error("Error verifying products:", productsError);
          } else {
            const existingProductIds = products.map(p => p.id);
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
      }
      
      // Process items and prepare for insertion with detailed logging
      const supabaseItems = items.map((item, index) => {
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
        
        // Create a processed item object
        const processedItem = {
          invoice_id: invoiceId,
          product_id: null,  // Default to null
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
      
      console.log(`Inserting ${supabaseItems.length} invoice items via Supabase...`);
      
      // Insert all items through Supabase
      const { data: itemsData, error: itemsError } = await supabase
        .from('invoice_items')
        .insert(supabaseItems)
        .select('id');
      
      if (itemsError) {
        console.error("Supabase invoice items insert error:", itemsError);
        
        // Try to clean up the invoice if items insertion fails
        const { error: deleteError } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoiceId);
          
        if (deleteError) {
          console.error("Error deleting invoice after items insertion failure:", deleteError);
        }
        
        throw new Error(`Failed to create invoice items: ${itemsError.message}`);
      }
      
      console.log(`Successfully created ${itemsData.length} invoice items for invoice #${invoiceId} via Supabase`);
      
      // Get the complete invoice data for return
      const { data: completeInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();
        
      if (fetchError || !completeInvoice) {
        console.error("Error fetching complete invoice:", fetchError);
        return {
          id: invoiceId,
          userId: invoice.userId,
          customerId: invoice.customerId,
          invoiceNumber: supabaseInvoice.invoice_number,
          invoiceDate: supabaseInvoice.invoice_date,
          dueDate: invoice.dueDate,
          notes: invoice.notes,
          status: supabaseInvoice.status,
          subtotal: supabaseInvoice.subtotal,
          cgst: supabaseInvoice.cgst,
          sgst: supabaseInvoice.sgst,
          igst: supabaseInvoice.igst,
          total: supabaseInvoice.total,
          termsAndConditions: invoice.termsAndConditions,
          templateId: supabaseInvoice.template_id,
          colorTheme: supabaseInvoice.color_theme
        };
      }
      
      // Return the created invoice
      return {
        id: completeInvoice.id,
        userId: completeInvoice.user_id,
        customerId: completeInvoice.customer_id,
        invoiceNumber: completeInvoice.invoice_number,
        invoiceDate: completeInvoice.invoice_date,
        dueDate: completeInvoice.due_date,
        notes: completeInvoice.notes || null,
        status: completeInvoice.status,
        subtotal: completeInvoice.subtotal,
        cgst: completeInvoice.cgst || '0.00',
        sgst: completeInvoice.sgst || '0.00',
        igst: completeInvoice.igst || '0.00',
        total: completeInvoice.total,
        termsAndConditions: completeInvoice.terms_and_conditions || null,
        templateId: completeInvoice.template_id || 'standard',
        colorTheme: completeInvoice.color_theme || 'blue'
      };
    } catch (error) {
      console.error("Error creating invoice via Supabase:", error);
      throw error;
    }
  }
  
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    try {
      const updateData: any = {};
      
      if (invoice.customerId) updateData.customer_id = invoice.customerId;
      if (invoice.invoiceNumber) updateData.invoice_number = invoice.invoiceNumber;
      if (invoice.invoiceDate) updateData.invoice_date = invoice.invoiceDate;
      if (invoice.dueDate !== undefined) updateData.due_date = invoice.dueDate;
      if (invoice.notes !== undefined) updateData.notes = invoice.notes;
      if (invoice.status) updateData.status = invoice.status;
      if (invoice.subtotal) updateData.subtotal = invoice.subtotal;
      if (invoice.cgst !== undefined) updateData.cgst = invoice.cgst || '0.00';
      if (invoice.sgst !== undefined) updateData.sgst = invoice.sgst || '0.00';
      if (invoice.igst !== undefined) updateData.igst = invoice.igst || '0.00';
      if (invoice.total) updateData.total = invoice.total;
      if (invoice.termsAndConditions !== undefined) updateData.terms_and_conditions = invoice.termsAndConditions;
      if (invoice.templateId) updateData.template_id = invoice.templateId;
      if (invoice.colorTheme) updateData.color_theme = invoice.colorTheme;
      
      const { data, error } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating invoice:", error);
        return undefined;
      }
      
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
      console.error("Error in updateInvoice:", error);
      return undefined;
    }
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    try {
      // First delete all invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', id);
      
      if (itemsError) {
        console.error("Error deleting invoice items:", itemsError);
        return false;
      }
      
      // Then delete the invoice
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Error deleting invoice:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in deleteInvoice:", error);
      return false;
    }
  }
  
  // Invoice Item Management
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      
      if (error) {
        console.error("Error fetching invoice items:", error);
        return [];
      }
      
      return data.map(item => ({
        id: item.id,
        invoiceId: item.invoice_id,
        productId: item.product_id,
        description: item.description,
        unit: item.unit || 'Piece', // Default to 'Piece' if unit is not specified
        quantity: item.quantity,
        rate: item.rate,
        amount: item.amount,
        gstRate: item.gst_rate,
        hsnCode: item.hsn_code || null
      }));
    } catch (error) {
      console.error("Error in getInvoiceItems:", error);
      return [];
    }
  }
  
  async addInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .insert({
          invoice_id: item.invoiceId,
          product_id: item.productId,
          description: item.description,
          unit: item.unit || 'Piece',
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          gst_rate: item.gstRate,
          hsn_code: item.hsnCode || null
        })
        .select()
        .single();
      
      if (error) {
        console.error("Error adding invoice item:", error);
        throw new Error(`Failed to add invoice item: ${error.message}`);
      }
      
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
      console.error("Error in addInvoiceItem:", error);
      throw error;
    }
  }
  
  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    try {
      const updateData: any = {};
      
      if (item.productId !== undefined) updateData.product_id = item.productId;
      if (item.description) updateData.description = item.description;
      if (item.unit) updateData.unit = item.unit;
      if (item.quantity !== undefined) updateData.quantity = item.quantity;
      if (item.rate !== undefined) updateData.rate = item.rate;
      if (item.amount !== undefined) updateData.amount = item.amount;
      if (item.gstRate !== undefined) updateData.gst_rate = item.gstRate;
      if (item.hsnCode !== undefined) updateData.hsn_code = item.hsnCode;
      
      const { data, error } = await supabase
        .from('invoice_items')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Error updating invoice item:", error);
        return undefined;
      }
      
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
      console.error("Error in updateInvoiceItem:", error);
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
        console.error("Error deleting invoice item:", error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error in deleteInvoiceItem:", error);
      return false;
    }
  }
  
  // Analytics
  async getInvoiceStats(userId: number): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    unpaidInvoices: number;
    totalCustomers: number;
  }> {
    try {
      // Get invoice stats
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('id, total, status')
        .eq('user_id', userId);
      
      if (invoiceError) {
        console.error("Error fetching invoice stats:", invoiceError);
        return {
          totalInvoices: 0,
          totalRevenue: 0,
          unpaidInvoices: 0,
          totalCustomers: 0
        };
      }
      
      // Get customer count
      const { count: customerCount, error: customerError } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (customerError) {
        console.error("Error fetching customer count:", customerError);
      }
      
      // Calculate stats
      const totalInvoices = invoices.length;
      const totalRevenue = invoices.reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);
      const unpaidInvoices = invoices.filter(inv => inv.status !== 'paid').length;
      
      return {
        totalInvoices,
        totalRevenue,
        unpaidInvoices,
        totalCustomers: customerCount || 0
      };
    } catch (error) {
      console.error("Error in getInvoiceStats:", error);
      return {
        totalInvoices: 0,
        totalRevenue: 0,
        unpaidInvoices: 0,
        totalCustomers: 0
      };
    }
  }
}

// Export an instance of the SupabaseStorage class
export const storage = new SupabaseStorage();