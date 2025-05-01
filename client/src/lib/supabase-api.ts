/**
 * Secure Supabase API client
 * This module provides functions to interact with the Supabase database
 * through the secure server-side API proxy instead of direct client access.
 * 
 * This pattern ensures that the Supabase service role key remains on the server
 * and is never exposed to the client.
 */

// Type definitions for API parameters
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'is' | 'like' | 'ilike';

export interface Filter {
  column: string;
  operator: FilterOperator;
  value: any;
}

export interface OrderOptions {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
}

export interface QueryOptions {
  returning?: boolean;
}

/**
 * Select data from a Supabase table
 * @param table - The table name
 * @param columns - The columns to select (default: '*')
 * @param filters - Optional array of filter conditions
 * @param limit - Optional result limit
 * @param order - Optional ordering options
 * @returns Promise resolving to the query results
 */
export async function select(table: string, {
  columns = '*',
  filters = [],
  limit,
  order,
}: {
  columns?: string,
  filters?: Filter[],
  limit?: number,
  order?: OrderOptions,
} = {}) {
  try {
    const response = await fetch('/api/supabase/select', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table,
        columns,
        filters,
        limit,
        order,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error selecting from ${table}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Error in select from ${table}:`, error);
    throw error;
  }
}

/**
 * Insert data into a Supabase table
 * @param table - The table name
 * @param data - The data to insert (object or array of objects)
 * @param options - Optional query options
 * @returns Promise resolving to the inserted data
 */
export async function insert(table: string, data: any, options?: QueryOptions) {
  try {
    const response = await fetch('/api/supabase/insert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table,
        data,
        options,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error inserting into ${table}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Error in insert into ${table}:`, error);
    throw error;
  }
}

/**
 * Update data in a Supabase table
 * @param table - The table name
 * @param data - The data to update
 * @param filters - Array of filter conditions to identify records to update
 * @param options - Optional query options
 * @returns Promise resolving to the updated data
 */
export async function update(table: string, data: any, filters: Filter[], options?: QueryOptions) {
  try {
    const response = await fetch('/api/supabase/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table,
        data,
        filters,
        options,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error updating ${table}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Error in update for ${table}:`, error);
    throw error;
  }
}

/**
 * Delete data from a Supabase table
 * @param table - The table name
 * @param filters - Array of filter conditions to identify records to delete
 * @param options - Optional query options
 * @returns Promise resolving to the deleted data
 */
export async function remove(table: string, filters: Filter[], options?: QueryOptions) {
  try {
    const response = await fetch('/api/supabase/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table,
        filters,
        options,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error deleting from ${table}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Error in delete from ${table}:`, error);
    throw error;
  }
}

/**
 * Call a PostgreSQL function via RPC
 * @param functionName - The function name to call
 * @param params - Optional parameters to pass to the function
 * @returns Promise resolving to the function result
 */
export async function callFunction(functionName: string, params?: Record<string, any>) {
  try {
    const response = await fetch('/api/supabase/rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: functionName,
        params,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error calling function ${functionName}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Error in RPC call to ${functionName}:`, error);
    throw error;
  }
}
