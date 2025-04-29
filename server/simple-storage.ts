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
import { supabase, pool } from './db';

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
      const { data: createdCompany, error } = await supabase
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
        id: createdCompany.id,
        name: createdCompany.name,
        userId: createdCompany.user_id,
        email: createdCompany.email,
        gstin: createdCompany.gstin,
        address: createdCompany.address,
        city: createdCompany.city,
        state: createdCompany.state,
        pincode: createdCompany.pincode,
        phone: createdCompany.phone,
        bankName: createdCompany.bank_name,
        accountNumber: createdCompany.account_number,
        ifscCode: createdCompany.ifsc_code,
        logo: createdCompany.logo
      };
    } catch (error) {
      console.error("Error in createCompany:", error);
      throw error;
    }
  }
  
  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company | undefined> {
    try {
      // Convert camelCase to snake_case for Supabase
      const updateData: any = {};
      
      if (company.name !== undefined) updateData.name = company.name;
      if (company.email !== undefined) updateData.email = company.email;
      if (company.gstin !== undefined) updateData.gstin = company.gstin;
      if (company.address !== undefined) updateData.address = company.address;
      if (company.city !== undefined) updateData.city = company.city;
      if (company.state !== undefined) updateData.state = company.state;
      if (company.pincode !== undefined) updateData.pincode = company.pincode;
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
  
  // These are just stub implementations to make TypeScript happy
  // We'll implement the rest in a proper way when needed
  
  async getCustomersByUserId(userId: number): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        throw error;
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
      const customerData = {
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
      };
      
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();
      
      if (error) {
        throw error;
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
      console.error("Error in createCustomer:", error);
      throw error;
    }
  }
  
  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    try {
      const updateData: any = {};
      
      if (customer.name !== undefined) updateData.name = customer.name;
      if (customer.email !== undefined) updateData.email = customer.email;
      if (customer.gstin !== undefined) updateData.gstin = customer.gstin;
      if (customer.phone !== undefined) updateData.phone = customer.phone;
      if (customer.billingAddress !== undefined) updateData.billing_address = customer.billingAddress;
      if (customer.billingCity !== undefined) updateData.billing_city = customer.billingCity;
      if (customer.billingState !== undefined) updateData.billing_state = customer.billingState;
      if (customer.billingPincode !== undefined) updateData.billing_pincode = customer.billingPincode;
      if (customer.shippingAddress !== undefined) updateData.shipping_address = customer.shippingAddress;
      if (customer.shippingCity !== undefined) updateData.shipping_city = customer.shippingCity;
      if (customer.shippingState !== undefined) updateData.shipping_state = customer.shippingState;
      if (customer.shippingPincode !== undefined) updateData.shipping_pincode = customer.shippingPincode;
      if (customer.sameAsShipping !== undefined) updateData.same_as_shipping = customer.sameAsShipping;
      
      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
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
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error("Error in deleteCustomer:", error);
      return false;
    }
  }
  
  // Stub implementations for the rest of the methods
  
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
      // Check if a product with the same name already exists for this user
      const { data: existingProducts, error: checkError } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', product.userId)
        .eq('name', product.name);
      
      if (checkError) {
        console.error("Error checking for existing products:", checkError);
      } else if (existingProducts && existingProducts.length > 0) {
        throw { 
          code: 'DUPLICATE_NAME',
          message: `A product with the name "${product.name}" already exists in your catalog.`
        };
      }
      
      const { data, error } = await supabase
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
      
      if (error) {
        console.error("Error creating product:", error);
        throw error;
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
      console.error("Error in createProduct:", error);
      throw error;
    }
  }
  
  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      // If trying to change the name, check for duplicates first
      if (product.name && product.userId) {
        const { data: existingProducts, error: checkError } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', product.userId)
          .eq('name', product.name)
          .neq('id', id);
        
        if (checkError) {
          console.error("Error checking for existing products:", checkError);
        } else if (existingProducts && existingProducts.length > 0) {
          throw { 
            code: 'DUPLICATE_NAME',
            message: `A product with the name "${product.name}" already exists in your catalog.`
          };
        }
      }
      
      const updateData: any = {};
      if (product.name) updateData.name = product.name;
      if (product.description !== undefined) updateData.description = product.description;
      if (product.hsnCode !== undefined) updateData.hsn_code = product.hsnCode;
      if (product.unit !== undefined) updateData.unit = product.unit;
      if (product.rate !== undefined) updateData.rate = product.rate;
      if (product.gstRate !== undefined) updateData.gst_rate = product.gstRate;
      
      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error || !data) {
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
      throw error;
    }
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    try {
      // Check if the product is used in any invoice items
      const { data: usedInInvoices, error: checkError } = await supabase
        .from('invoice_items')
        .select('id')
        .eq('product_id', id)
        .limit(1);
      
      if (checkError) {
        console.error("Error checking if product is used in invoices:", checkError);
      } else if (usedInInvoices && usedInInvoices.length > 0) {
        throw {
          code: 'PRODUCT_IN_USE',
          message: 'This product cannot be deleted because it is used in one or more invoices.'
        };
      }
      
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
      throw error;
    }
  }
  
  async getInvoicesByUserId(userId: number): Promise<Invoice[]> {
    return [];
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return undefined;
  }
  
  async getInvoiceWithItems(id: number): Promise<{invoice: Invoice, items: InvoiceItem[]}> {
    throw new Error("Method not implemented.");
  }
  
  async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
    throw new Error("Method not implemented.");
  }
  
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    return undefined;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    return false;
  }
  
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return [];
  }
  
  async addInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    throw new Error("Method not implemented.");
  }
  
  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    return undefined;
  }
  
  async deleteInvoiceItem(id: number): Promise<boolean> {
    return false;
  }
  
  async getInvoiceStats(userId: number): Promise<{
    totalInvoices: number;
    totalRevenue: number;
    unpaidInvoices: number;
    totalCustomers: number;
  }> {
    return {
      totalInvoices: 0,
      totalRevenue: 0,
      unpaidInvoices: 0,
      totalCustomers: 0
    };
  }
}

export const storage = new SupabaseStorage();