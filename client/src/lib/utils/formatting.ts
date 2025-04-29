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
 */
export function getInvoiceTotal(invoice: any): number | string | undefined {
  // Check for totalAmount first (backend format)
  if (invoice.totalAmount !== undefined && invoice.totalAmount !== null) {
    return invoice.totalAmount;
  }
  
  // Then check for total (frontend format)
  if (invoice.total !== undefined && invoice.total !== null) {
    return invoice.total;
  }
  
  // If both are undefined or null, return undefined
  return undefined;
}