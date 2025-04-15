import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertCompanySchema, insertCustomerSchema, insertProductSchema, insertInvoiceSchema, insertInvoiceItemSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  setupAuth(app);
  
  // Company routes
  app.get("/api/company", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const company = await storage.getCompanyByUserId(req.user!.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    
    res.json(company);
  });
  
  app.post("/api/company", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const companyData = insertCompanySchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      // Check if user already has a company
      const existingCompany = await storage.getCompanyByUserId(req.user!.id);
      if (existingCompany) {
        return res.status(400).json({ message: "User already has a company" });
      }
      
      const company = await storage.createCompany(companyData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.format()
        });
      }
      throw error;
    }
  });
  
  app.put("/api/company/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid company ID" });
    }
    
    try {
      const companyData = insertCompanySchema.partial().parse(req.body);
      
      // Check if company belongs to user
      const existingCompany = await storage.getCompanyByUserId(req.user!.id);
      if (!existingCompany || existingCompany.id !== id) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      const updatedCompany = await storage.updateCompany(id, companyData);
      if (!updatedCompany) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      res.json(updatedCompany);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.format()
        });
      }
      throw error;
    }
  });
  
  // Customer routes
  app.get("/api/customers", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const customers = await storage.getCustomersByUserId(req.user!.id);
    res.json(customers);
  });
  
  app.get("/api/customers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    const customer = await storage.getCustomer(id);
    if (!customer || customer.userId !== req.user!.id) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.json(customer);
  });
  
  app.post("/api/customers", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const customerData = insertCustomerSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.format()
        });
      }
      throw error;
    }
  });
  
  app.put("/api/customers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      
      // Check if customer belongs to user
      const existingCustomer = await storage.getCustomer(id);
      if (!existingCustomer || existingCustomer.userId !== req.user!.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      const updatedCustomer = await storage.updateCustomer(id, customerData);
      if (!updatedCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(updatedCustomer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.format()
        });
      }
      throw error;
    }
  });
  
  app.delete("/api/customers/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    // Check if customer belongs to user
    const existingCustomer = await storage.getCustomer(id);
    if (!existingCustomer || existingCustomer.userId !== req.user!.id) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    const deleted = await storage.deleteCustomer(id);
    if (!deleted) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.status(204).end();
  });
  
  // Product routes
  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const products = await storage.getProductsByUserId(req.user!.id);
    res.json(products);
  });
  
  app.get("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    const product = await storage.getProduct(id);
    if (!product || product.userId !== req.user!.id) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.json(product);
  });
  
  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const productData = insertProductSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.format()
        });
      }
      throw error;
    }
  });
  
  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      
      // Check if product belongs to user
      const existingProduct = await storage.getProduct(id);
      if (!existingProduct || existingProduct.userId !== req.user!.id) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const updatedProduct = await storage.updateProduct(id, productData);
      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.format()
        });
      }
      throw error;
    }
  });
  
  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    
    // Check if product belongs to user
    const existingProduct = await storage.getProduct(id);
    if (!existingProduct || existingProduct.userId !== req.user!.id) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const deleted = await storage.deleteProduct(id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    res.status(204).end();
  });
  
  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const invoices = await storage.getInvoicesByUserId(req.user!.id);
    res.json(invoices);
  });
  
  app.get("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    
    try {
      const { invoice, items } = await storage.getInvoiceWithItems(id);
      
      if (invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json({ invoice, items });
    } catch (error) {
      return res.status(404).json({ message: "Invoice not found" });
    }
  });
  
  app.post("/api/invoices", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const { invoice: invoiceData, items: itemsData } = req.body;
      
      // Validate invoice data
      const validatedInvoice = insertInvoiceSchema.parse({
        ...invoiceData,
        userId: req.user!.id
      });
      
      // Validate invoice items
      const validatedItems = itemsData.map((item: any) => 
        insertInvoiceItemSchema.omit({ invoiceId: true }).parse(item)
      );
      
      // Check if customer belongs to user
      const customer = await storage.getCustomer(validatedInvoice.customerId);
      if (!customer || customer.userId !== req.user!.id) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      // Create invoice with items
      const invoice = await storage.createInvoice(validatedInvoice, validatedItems);
      
      // Get complete invoice with items
      const completeInvoice = await storage.getInvoiceWithItems(invoice.id);
      
      res.status(201).json(completeInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.format()
        });
      }
      throw error;
    }
  });
  
  app.put("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    
    try {
      const { invoice: invoiceData } = req.body;
      
      // Validate invoice data
      const validatedInvoice = insertInvoiceSchema.partial().parse(invoiceData);
      
      // Check if invoice belongs to user
      const existingInvoice = await storage.getInvoice(id);
      if (!existingInvoice || existingInvoice.userId !== req.user!.id) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // If customer ID is changing, check if new customer belongs to user
      if (validatedInvoice.customerId && validatedInvoice.customerId !== existingInvoice.customerId) {
        const customer = await storage.getCustomer(validatedInvoice.customerId);
        if (!customer || customer.userId !== req.user!.id) {
          return res.status(404).json({ message: "Customer not found" });
        }
      }
      
      // Update invoice
      const updatedInvoice = await storage.updateInvoice(id, validatedInvoice);
      if (!updatedInvoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(updatedInvoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.format()
        });
      }
      throw error;
    }
  });
  
  app.delete("/api/invoices/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    
    // Check if invoice belongs to user
    const existingInvoice = await storage.getInvoice(id);
    if (!existingInvoice || existingInvoice.userId !== req.user!.id) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    const deleted = await storage.deleteInvoice(id);
    if (!deleted) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    res.status(204).end();
  });
  
  // Invoice Items routes
  app.post("/api/invoices/:id/items", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const invoiceId = parseInt(req.params.id);
    if (isNaN(invoiceId)) {
      return res.status(400).json({ message: "Invalid invoice ID" });
    }
    
    try {
      // Check if invoice belongs to user
      const existingInvoice = await storage.getInvoice(invoiceId);
      if (!existingInvoice || existingInvoice.userId !== req.user!.id) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Validate item data
      const itemData = insertInvoiceItemSchema.parse({
        ...req.body,
        invoiceId
      });
      
      // Add item to invoice
      const item = await storage.addInvoiceItem(itemData);
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.format()
        });
      }
      throw error;
    }
  });
  
  app.put("/api/invoice-items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }
    
    try {
      // Validate item data
      const itemData = insertInvoiceItemSchema.partial().parse(req.body);
      
      // Get the item
      const existingItem = await storage.invoiceItems.get(id);
      if (!existingItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Check if the invoice belongs to the user
      const invoice = await storage.getInvoice(existingItem.invoiceId);
      if (!invoice || invoice.userId !== req.user!.id) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Update the item
      const updatedItem = await storage.updateInvoiceItem(id, itemData);
      if (!updatedItem) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.format()
        });
      }
      throw error;
    }
  });
  
  app.delete("/api/invoice-items/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid item ID" });
    }
    
    // Get the item
    const existingItem = await storage.invoiceItems.get(id);
    if (!existingItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    // Check if the invoice belongs to the user
    const invoice = await storage.getInvoice(existingItem.invoiceId);
    if (!invoice || invoice.userId !== req.user!.id) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    const deleted = await storage.deleteInvoiceItem(id);
    if (!deleted) {
      return res.status(404).json({ message: "Item not found" });
    }
    
    res.status(204).end();
  });
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const stats = await storage.getInvoiceStats(req.user!.id);
    res.json(stats);
  });

  const httpServer = createServer(app);
  return httpServer;
}
