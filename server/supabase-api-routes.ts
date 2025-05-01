import { Router } from 'express';
import { supabase } from './supabase-client';

const router = Router();

// Database proxy routes

/**
 * Generic SELECT query proxy
 * This allows the client to perform authorized SELECT queries through the server
 * instead of using direct Supabase client on the frontend
 */
router.post('/select', async (req, res) => {
  try {
    const { table, columns = '*', filters, limit, order } = req.body;
    
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }
    
    // Start building the query
    let query = supabase
      .from(table)
      .select(columns);
    
    // Apply filters if provided (eq, neq, gt, lt, etc.)
    if (filters && Array.isArray(filters)) {
      filters.forEach(filter => {
        if (filter.column && filter.operator && filter.value !== undefined) {
          const { column, operator, value } = filter;
          // Use the appropriate filter method based on the operator
          switch (operator) {
            case 'eq':
              query = query.eq(column, value);
              break;
            case 'neq':
              query = query.neq(column, value);
              break;
            case 'gt':
              query = query.gt(column, value);
              break;
            case 'lt':
              query = query.lt(column, value);
              break;
            case 'gte':
              query = query.gte(column, value);
              break;
            case 'lte':
              query = query.lte(column, value);
              break;
            case 'in':
              query = query.in(column, Array.isArray(value) ? value : [value]);
              break;
            case 'is':
              query = query.is(column, value);
              break;
            case 'like':
              query = query.like(column, value);
              break;
            case 'ilike':
              query = query.ilike(column, value);
              break;
            default:
              // Ignore invalid operators
              break;
          }
        }
      });
    }
    
    // Apply limit if provided
    if (limit && !isNaN(Number(limit))) {
      query = query.limit(Number(limit));
    }
    
    // Apply ordering if provided
    if (order && order.column) {
      const { column, ascending = true, nullsFirst = false } = order;
      query = query.order(column, { ascending, nullsFirst });
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error: any) {
    console.error('Server error in select proxy:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generic INSERT query proxy
 */
router.post('/insert', async (req, res) => {
  try {
    const { table, data, options } = req.body;
    
    if (!table || !data) {
      return res.status(400).json({ error: 'Table name and data are required' });
    }
    
    // Configure the insert operation
    let query = supabase.from(table).insert(data);
    
    // Apply options if provided
    if (options) {
      // Return the inserted data if requested
      if (options.returning) {
        query = query.select();
      }
    } else {
      // By default, return the inserted data
      query = query.select();
    }
    
    // Execute the query
    const { data: result, error } = await query;
    
    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(result);
  } catch (error: any) {
    console.error('Server error in insert proxy:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generic UPDATE query proxy
 */
router.post('/update', async (req, res) => {
  try {
    const { table, data, filters, options } = req.body;
    
    if (!table || !data || !filters) {
      return res.status(400).json({ error: 'Table name, data, and filters are required' });
    }
    
    // Start building the query
    let query = supabase.from(table).update(data);
    
    // Apply filters (required for update operations)
    if (Array.isArray(filters)) {
      filters.forEach(filter => {
        if (filter.column && filter.operator && filter.value !== undefined) {
          const { column, operator, value } = filter;
          // Use the appropriate filter method
          switch (operator) {
            case 'eq':
              query = query.eq(column, value);
              break;
            case 'neq':
              query = query.neq(column, value);
              break;
            // Add other operators as needed
            default:
              // Ignore invalid operators
              break;
          }
        }
      });
    }
    
    // Apply options if provided
    if (options) {
      // Return the updated data if requested
      if (options.returning) {
        query = query.select();
      }
    } else {
      // By default, return the updated data
      query = query.select();
    }
    
    // Execute the query
    const { data: result, error } = await query;
    
    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(result);
  } catch (error: any) {
    console.error('Server error in update proxy:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generic DELETE query proxy
 */
router.post('/delete', async (req, res) => {
  try {
    const { table, filters, options } = req.body;
    
    if (!table || !filters) {
      return res.status(400).json({ error: 'Table name and filters are required' });
    }
    
    // Start building the query
    let query = supabase.from(table).delete();
    
    // Apply filters (required for delete operations)
    if (Array.isArray(filters)) {
      filters.forEach(filter => {
        if (filter.column && filter.operator && filter.value !== undefined) {
          const { column, operator, value } = filter;
          // Use the appropriate filter method
          switch (operator) {
            case 'eq':
              query = query.eq(column, value);
              break;
            case 'neq':
              query = query.neq(column, value);
              break;
            // Add other operators as needed
            default:
              // Ignore invalid operators
              break;
          }
        }
      });
    }
    
    // Apply options if provided
    if (options) {
      // Return the deleted data if requested
      if (options.returning) {
        query = query.select();
      }
    } else {
      // By default, return the deleted data
      query = query.select();
    }
    
    // Execute the query
    const { data: result, error } = await query;
    
    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(result);
  } catch (error: any) {
    console.error('Server error in delete proxy:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * RPC (Remote Procedure Call) proxy
 * For calling custom PostgreSQL functions
 */
router.post('/rpc', async (req, res) => {
  try {
    const { function: functionName, params } = req.body;
    
    if (!functionName) {
      return res.status(400).json({ error: 'Function name is required' });
    }
    
    // Call the RPC function
    const { data, error } = await supabase.rpc(functionName, params || {});
    
    if (error) {
      console.error('Supabase RPC error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json(data);
  } catch (error: any) {
    console.error('Server error in RPC proxy:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
