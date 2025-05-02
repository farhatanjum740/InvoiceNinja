import type { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { z } from "zod";
import { storage } from "./simple-storage";
import { setupAuth } from "./auth-supabase";
import { supabase } from "./db";
import storageApiRoutes from "./storage-api-routes";
import supabaseApiRoutes from "./supabase-api-routes";
import { normalizeDate } from "./utils/date-utils";

// Create and configure the HTTP server
export async function registerRoutes(app: Express): Promise<Server> {
  // Provide environment variables to the client
  app.get("/api/env", (req, res) => {
    res.json({
      VITE_SUPABASE_URL: process.env.SUPABASE_URL,
      VITE_SUPABASE_KEY: process.env.SUPABASE_KEY
    });
  });

  // Check database connection status
  app.get("/api/health", async (req, res) => {
    try {
      // Simple health check endpoint
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(500).json({ status: "error", message: "Health check failed" });
    }
  });

  // Setup authentication routes
  setupAuth(app);

  // Register storage API routes
  app.use('/api/storage', storageApiRoutes);

  // Register Supabase API routes
  app.use('/api/supabase', supabaseApiRoutes);
  
  // Simple diagnostic path to check server status
  app.get('/server-check', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Server Diagnostic</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .success { color: green; }
          .error { color: red; }
          h1 { color: #333; }
          .box { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>Server Check Successful</h1>
        <div class="box">
          <p><span class="success">✓</span> Server is operational</p>
          <p><span class="success">✓</span> This route is being served correctly by the Express server</p>
          <p><span class="success">✓</span> Server time: ${new Date().toISOString()}</p>
          <p><span class="success">✓</span> Environment: ${process.env.NODE_ENV || 'not set'}</p>
        </div>
        
        <h2>Next Steps</h2>
        <div class="box">
          <p>If you're experiencing 404 errors on other routes, the issue is likely with how your server handles client-side routing paths.</p>
          <p>Follow the steps in <code>DEPLOYMENT_GUIDE.md</code> to configure your web server correctly.</p>
        </div>
        
        <h2>Main Application Links</h2>
        <div class="box">
          <p>Try these links to access the application:</p>
          <ul>
            <li><a href="/auth">/auth</a> - Login page</li>
            <li><a href="/dashboard">/dashboard</a> - Dashboard (requires authentication)</li>
            <li><a href="/invoices">/invoices</a> - Invoices page (requires authentication)</li>
          </ul>
        </div>
      </body>
      </html>
    `);
  });

  // Company endpoints
  app.get("/api/company", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      let company = await storage.getCompanyByUserId(req.user.id);
      
      if (!company) {
        try {
          // Auto-create a company profile with default values
          const newCompany = await storage.createCompany({
            userId: req.user.id,
            name: "My Company",
            email: req.user.email || "",
            phone: "",
            address: "",
            city: "",
            state: "",
            pincode: "",
            gstin: "",
            logo: "",
            bankName: "",
            accountNumber: "",
            ifscCode: "",
            templateId: "standard",
            colorTheme: "blue"
          });
          
          return res.json(newCompany);
        } catch (createError) {
          console.error("Error creating default company:", createError);
          
          // Even if we failed to create, try to fetch again in case it was created by another request
          company = await storage.getCompanyByUserId(req.user.id);
          if (company) {
            return res.json(company);
          }
          
          throw createError; // Re-throw if we still couldn't find a company
        }
      }
      
      return res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Support both PATCH and PUT methods for company updates
  const handleCompanyUpdate = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const companyId = parseInt(req.params.id);
      
      // First check if company belongs to user
      const company = await storage.getCompanyByUserId(req.user.id);
      
      if (!company || company.id !== companyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updatedCompany = await storage.updateCompany(companyId, req.body);
      
      return res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company:", error);
      return res.status(500).json({ error: "Server error" });
    }
  };
  
  app.patch("/api/company/:id", handleCompanyUpdate);
  app.put("/api/company/:id", handleCompanyUpdate);
  
  // Update company without ID parameter (uses the user's company)
  app.patch("/api/company", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      // Get the user's company
      const company = await storage.getCompanyByUserId(req.user.id);
      
      if (!company) {
        return res.status(404).json({ error: "Company not found" });
      }
      
      // Update the company with the request body
      const updatedCompany = await storage.updateCompany(company.id, req.body);
      
      return res.json(updatedCompany);
    } catch (error) {
      console.error("Error updating company:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Customer endpoints
  app.get("/api/customers", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const customers = await storage.getCustomersByUserId(req.user.id);
      return res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/customers", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const newCustomer = await storage.createCustomer({
        ...req.body,
        userId: req.user.id
      });
      
      return res.status(201).json(newCustomer);
    } catch (error) {
      console.error("Error creating customer:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/customers/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const customerId = parseInt(req.params.id);
      const customer = await storage.getCustomer(customerId);
      
      if (!customer || customer.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      return res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.patch("/api/customers/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const customerId = parseInt(req.params.id);
      
      // Check if customer belongs to user
      const customer = await storage.getCustomer(customerId);
      
      if (!customer || customer.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updatedCustomer = await storage.updateCustomer(customerId, req.body);
      
      if (!updatedCustomer) {
        return res.status(404).json({ error: "Customer not found or update failed" });
      }
      
      return res.json(updatedCustomer);
    } catch (error) {
      console.error("Error updating customer:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/api/customers/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const customerId = parseInt(req.params.id);
      
      // Check if customer belongs to user
      const customer = await storage.getCustomer(customerId);
      
      if (!customer || customer.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      await storage.deleteCustomer(customerId);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Product endpoints
  app.get("/api/products", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const products = await storage.getProductsByUserId(req.user.id);
      return res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/products", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const newProduct = await storage.createProduct({
        ...req.body,
        userId: req.user.id
      });
      
      return res.status(201).json(newProduct);
    } catch (error: any) {
      console.error("Error creating product:", error);
      
      // Handle our custom duplicate name error
      if (error.code === 'DUPLICATE_NAME') {
        return res.status(400).json({ 
          error: "Duplicate product name", 
          details: error.message
        });
      }
      
      // Provide more specific error messages for known DB error types
      if (error.code === '23505') {
        if (error.message.includes('products_user_id_name_key')) {
          return res.status(400).json({ 
            error: "Duplicate product name", 
            details: "You already have a product with this name. Each product name must be unique."
          });
        } else {
          return res.status(400).json({ 
            error: "Duplicate record", 
            details: "A product with this information already exists."
          });
        }
      }
      
      return res.status(500).json({ 
        error: "Server error", 
        message: error.message || "An unknown error occurred"
      });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || product.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      return res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.put("/api/products/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const productId = parseInt(req.params.id);
      
      // Check if product belongs to user
      const product = await storage.getProduct(productId);
      
      if (!product || product.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updatedProduct = await storage.updateProduct(productId, req.body);
      
      return res.json(updatedProduct);
    } catch (error: any) {
      console.error("Error updating product:", error);
      
      // Handle our custom duplicate name error
      if (error.code === 'DUPLICATE_NAME') {
        return res.status(400).json({ 
          error: "Duplicate product name", 
          details: error.message
        });
      }
      
      // Handle other database constraint errors
      if (error.code === '23505') {
        if (error.message.includes('products_user_id_name_key')) {
          return res.status(400).json({ 
            error: "Duplicate product name", 
            details: "You already have a product with this name. Each product name must be unique."
          });
        }
      }
      
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const productId = parseInt(req.params.id);
      
      // Check if product belongs to user
      const product = await storage.getProduct(productId);
      
      if (!product || product.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      await storage.deleteProduct(productId);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting product:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Invoice endpoints
  app.get("/api/invoices", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const invoices = await storage.getInvoicesByUserId(req.user.id);
      
      // Fix all dates in the invoices list using the imported normalizeDate function
      const fixedInvoices = invoices.map(invoice => {
        const fixedInvoice = {...invoice};
        
        // Handle invoice date
        if (fixedInvoice.invoiceDate) {
          const originalDate = fixedInvoice.invoiceDate as string;
          fixedInvoice.invoiceDate = normalizeDate(originalDate);
          if (originalDate !== fixedInvoice.invoiceDate) {
            console.log(`Fixed invoice ${fixedInvoice.id} date from ${originalDate} to ${fixedInvoice.invoiceDate}`);
          }
        }
        
        // Handle due date
        if (fixedInvoice.dueDate) {
          const originalDueDate = fixedInvoice.dueDate as string;
          fixedInvoice.dueDate = normalizeDate(originalDueDate);
          if (originalDueDate !== fixedInvoice.dueDate) {
            console.log(`Fixed invoice ${fixedInvoice.id} due date from ${originalDueDate} to ${fixedInvoice.dueDate}`);
          }
        }
        
        return fixedInvoice;
      });
      
      return res.json(fixedInvoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/invoices", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      // Log the received invoice data for debugging
      const { invoice } = req.body;
      let { items } = req.body;
      console.log("Attempting to create invoice with", items?.length || 0, "items");
      
      // Validate that we have items
      if (!items || items.length === 0) {
        return res.status(400).json({ error: "No invoice items provided" });
      }
      
      // PREVALIDATION: Check if all product IDs exist in the database
      const productIds = items
        .map((item: any) => item.productId)
        .filter((id: any) => id !== null && id !== undefined);
      
      if (productIds.length > 0) {
        console.log("Prevalidating product IDs:", productIds);
        
        try {
          const { data, error } = await supabase
            .from('products')
            .select('id')
            .in('id', productIds);
          
          if (error) {
            console.error("Error checking product existence:", error);
          } else if (data) {
            const existingProductIds = data.map((product: any) => product.id);
            const missingProductIds = productIds.filter((id: any) => !existingProductIds.includes(id));
            
            if (missingProductIds.length > 0) {
              console.warn(`Products with IDs ${missingProductIds.join(', ')} do not exist, will set to null`);
              
              // Set non-existent product IDs to null to avoid foreign key constraint errors
              const updatedItems = items.map((item: any) => {
                if (item.productId && missingProductIds.includes(item.productId)) {
                  console.log(`Setting product_id ${item.productId} to null for item "${item.description}"`);
                  return { ...item, productId: null };
                }
                return item;
              });
              
              // Replace items with updated version
              items = updatedItems;
            }
          }
        } catch (productCheckError) {
          console.error("Error during product validation:", productCheckError);
          // Continue with creation, letting storage layer handle any errors
        }
      }
      
      // Ensure user ID is set
      const invoiceWithUserId = {
        ...invoice,
        userId: req.user.id
      };
      
      console.log("Using transaction-based invoice creation method");
      
      try {
        const newInvoice = await storage.createInvoice(invoiceWithUserId, items);
        
        console.log("Invoice created successfully with ID:", newInvoice.id);
        return res.status(201).json(newInvoice);
      } catch (invoiceError: any) {
        // More detailed error reporting for invoice creation failures
        console.error("Invoice creation failed:", invoiceError.message || invoiceError);
        
        return res.status(500).json({ 
          error: "Invoice creation failed", 
          message: invoiceError.message || "Unknown error"
        });
      }
    } catch (error: any) {
      console.error("Error processing invoice request:", error);
      return res.status(500).json({ 
        error: "Server error", 
        message: error.message || "Unknown error"
      });
    }
  });

  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const invoiceWithItems = await storage.getInvoiceWithItems(invoiceId);
      
      // Normalize all dates to YYYY-MM-DD format on the server side for consistency
      const fixedInvoice = {
        ...invoiceWithItems.invoice
      };
      
      // Handle invoice date using the imported normalizeDate function
      const originalInvoiceDate = fixedInvoice.invoiceDate as string;
      fixedInvoice.invoiceDate = normalizeDate(originalInvoiceDate);
      if (originalInvoiceDate !== fixedInvoice.invoiceDate) {
        console.log("SERVER: Fixed invoice date from", originalInvoiceDate, "to", fixedInvoice.invoiceDate);
      }
      
      // Handle due date
      const originalDueDate = fixedInvoice.dueDate as string;
      fixedInvoice.dueDate = normalizeDate(originalDueDate);
      if (originalDueDate !== fixedInvoice.dueDate) {
        console.log("SERVER: Fixed due date from", originalDueDate, "to", fixedInvoice.dueDate);
      }
      
      const fixedResponse = {
        invoice: fixedInvoice,
        items: invoiceWithItems.items
      };
      
      // Log the fixed response for debugging
      console.log("Invoice response data (with fixed dates):", JSON.stringify({
        invoice: {
          ...fixedResponse.invoice,
          // Don't log sensitive fields
          password: undefined
        },
        itemsCount: fixedResponse.items.length,
        sampleItem: fixedResponse.items[0] || null
      }, null, 2));
      
      return res.json(fixedResponse);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.patch("/api/invoices/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const invoiceId = parseInt(req.params.id);
      
      // Check if invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
      
      return res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Update an invoice and its items completely
  app.put("/api/invoices/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const invoiceId = parseInt(req.params.id);
      const { invoice, items } = req.body;
      
      console.log(`Attempting to update invoice #${invoiceId} with ${items?.length || 0} items`);
      
      // Validate that we have items
      if (!items || items.length === 0) {
        return res.status(400).json({ error: "No invoice items provided" });
      }
      
      // Check if invoice belongs to user
      const existingInvoice = await storage.getInvoice(invoiceId);
      
      if (!existingInvoice || existingInvoice.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden: You do not have permission to update this invoice" });
      }
      
      // PREVALIDATION: Check if all product IDs exist in the database
      const productIds = items
        .map((item: any) => item.productId)
        .filter((id: any) => id !== null && id !== undefined);
      
      if (productIds.length > 0) {
        console.log("Prevalidating product IDs for update:", productIds);
        
        try {
          const { data, error } = await supabase
            .from('products')
            .select('id')
            .in('id', productIds);
          
          if (error) {
            console.error("Error checking product existence:", error);
          } else if (data) {
            const existingProductIds = data.map((product: any) => product.id);
            const missingProductIds = productIds.filter((id: any) => !existingProductIds.includes(id));
            
            if (missingProductIds.length > 0) {
              console.warn(`Products with IDs ${missingProductIds.join(', ')} do not exist, will set to null`);
              
              // Set non-existent product IDs to null to avoid foreign key constraint errors
              const updatedItems = items.map((item: any) => {
                if (item.productId && missingProductIds.includes(item.productId)) {
                  console.log(`Setting product_id ${item.productId} to null for item "${item.description}"`);
                  return { ...item, productId: null };
                }
                return item;
              });
              
              // Replace items with updated version
              req.body.items = updatedItems;
            }
          }
        } catch (productCheckError) {
          console.error("Error during product validation:", productCheckError);
          // Continue with update, letting storage layer handle any errors
        }
      }
      
      // Update the invoice
      try {
        // First, delete all existing invoice items
        await storage.deleteInvoiceItems(invoiceId);
        
        // Update the invoice
        const invoiceWithUserId = {
          ...invoice,
          userId: req.user.id,
          id: invoiceId
        };
        
        // Update the invoice details
        await storage.updateInvoice(invoiceId, invoiceWithUserId);
        
        // Add new invoice items
        for (const item of items) {
          await storage.addInvoiceItem({
            ...item,
            invoiceId: invoiceId
          });
        }
        
        // Fetch the updated invoice with items
        const updatedInvoice = await storage.getInvoiceWithItems(invoiceId);
        
        console.log("Invoice updated successfully with ID:", invoiceId);
        return res.status(200).json(updatedInvoice);
      } catch (updateError: any) {
        // More detailed error reporting for invoice update failures
        console.error("Invoice update failed:", updateError.message || updateError);
        
        return res.status(500).json({ 
          error: "Invoice update failed", 
          message: updateError.message || "Unknown error"
        });
      }
    } catch (error: any) {
      console.error("Error processing invoice update request:", error);
      return res.status(500).json({ 
        error: "Server error", 
        message: error.message || "Unknown error"
      });
    }
  });

  app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const invoiceId = parseInt(req.params.id);
      
      // Check if invoice belongs to user
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      await storage.deleteInvoice(invoiceId);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Invoice items endpoints
  app.post("/api/invoice-items", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      // Check if the invoice belongs to the user
      const invoice = await storage.getInvoice(req.body.invoiceId);
      
      if (!invoice || invoice.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const newItem = await storage.addInvoiceItem(req.body);
      
      return res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating invoice item:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.patch("/api/invoice-items/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const itemId = parseInt(req.params.id);
      
      // Get the item
      const items = await storage.getInvoiceItems(req.body.invoiceId);
      const item = items.find(i => i.id === itemId);
      
      if (!item) {
        return res.status(404).json({ error: "Invoice item not found" });
      }
      
      // Check if the invoice belongs to the user
      const invoice = await storage.getInvoice(item.invoiceId);
      
      if (!invoice || invoice.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updatedItem = await storage.updateInvoiceItem(itemId, req.body);
      
      return res.json(updatedItem);
    } catch (error) {
      console.error("Error updating invoice item:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  app.delete("/api/invoice-items/:id", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const itemId = parseInt(req.params.id);
      
      // First find the item to get the invoice ID
      const invoiceId = parseInt(req.query.invoiceId as string);
      
      if (!invoiceId) {
        return res.status(400).json({ error: "Invoice ID is required" });
      }
      
      // Check if the invoice belongs to the user
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice || invoice.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      await storage.deleteInvoiceItem(itemId);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting invoice item:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Dashboard/analytics endpoints
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const stats = await storage.getInvoiceStats(req.user.id);
      return res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return res.status(500).json({ error: "Server error" });
    }
  });

  // Create the HTTP server
  const httpServer = new Server(app);
  
  return httpServer;
}