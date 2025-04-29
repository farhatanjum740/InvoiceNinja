/**
 * Format a number as a currency string in INR
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) {
    return "₹0.00";
  }
  
  // Convert string to number if needed
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number
  if (isNaN(numericAmount)) {
    return "₹0.00";
  }
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(numericAmount);
}

/**
 * Format a date string in the Indian format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    return dateString;
  }
}

/**
 * Convert a string representation of a number to a number
 */
export function parseStringToNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  return parseFloat(value) || 0;
}

/**
 * Helper function to get invoice total from either total or totalAmount field
 * This function handles multiple formats that might exist in the database
 * and converts the value to a number
 */
export function getInvoiceTotal(invoice: any): number {
  if (!invoice) return 0;
  
  // Check all possible properties that might contain the total
  let total;
  
  // First try directly accessing total or totalAmount
  if (invoice.total !== undefined && invoice.total !== null) {
    total = invoice.total;
  }
  else if (invoice.totalAmount !== undefined && invoice.totalAmount !== null) {
    total = invoice.totalAmount;
  }
  // If total is still undefined, try to calculate from subtotal + taxes
  else if (invoice.subtotal !== undefined && invoice.subtotal !== null) {
    // Convert subtotal to number, ensuring we handle both string and number values
    const subtotal = typeof invoice.subtotal === 'string' 
      ? parseFloat(invoice.subtotal || '0') 
      : (invoice.subtotal || 0);
      
    // Get tax values, defaulting to 0 for any missing values
    const cgst = typeof invoice.cgst === 'string' 
      ? parseFloat(invoice.cgst || '0') 
      : (invoice.cgst || 0);
      
    const sgst = typeof invoice.sgst === 'string' 
      ? parseFloat(invoice.sgst || '0') 
      : (invoice.sgst || 0);
      
    const igst = typeof invoice.igst === 'string' 
      ? parseFloat(invoice.igst || '0') 
      : (invoice.igst || 0);
    
    // Calculate total  
    total = subtotal + cgst + sgst + igst;
  }
  // Final fallback - search in invoice.invoice if it's a nested structure
  else if (invoice.invoice) {
    return getInvoiceTotal(invoice.invoice);
  }
  // Absolute final fallback
  else {
    total = 0;
  }
  
  // Convert to number if it's a string
  const numericTotal = typeof total === 'string' ? parseFloat(total || '0') : (total || 0);
  
  // Make sure we don't return NaN
  return isNaN(numericTotal) ? 0 : numericTotal;
}

/**
 * Formats an invoice total as currency, handling all possible formats
 */
export function formatInvoiceTotal(invoice: any): string {
  return formatCurrency(getInvoiceTotal(invoice));
}