/**
 * Round off amount to nearest integer (for invoice totals)
 */
export function roundToNearestInteger(amount: number): number {
  return Math.round(amount);
}

/**
 * Calculates the round-off adjustment needed to make the total a whole number
 */
export function calculateRoundOff(total: number): number {
  const roundedTotal = Math.round(total);
  return roundedTotal - total;
}

/**
 * Convert numbers to words for Indian Rupees (for invoice totals)
 */
export function amountToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  // Function to convert a number less than 1000 to words
  const convertLessThanOneThousand = (num: number): string => {
    if (num === 0) return '';
    
    if (num < 20) {
      return ones[num];
    }
    
    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    }
    
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + convertLessThanOneThousand(num % 100) : '');
  };
  
  // Round to 2 decimal places and split into rupees and paise
  const roundedAmount = Math.round(amount * 100) / 100;
  let rupeesValue = Math.floor(roundedAmount);
  const paise = Math.round((roundedAmount - rupeesValue) * 100);
  
  // Handle zero
  if (rupeesValue === 0 && paise === 0) {
    return 'Zero Rupees Only';
  }
  
  // For Indian number system (lakhs, crores)
  let result = '';
  
  if (rupeesValue >= 10000000) { // Crores
    result += convertLessThanOneThousand(Math.floor(rupeesValue / 10000000)) + ' Crore ';
    rupeesValue = rupeesValue % 10000000;
  }
  
  if (rupeesValue >= 100000) { // Lakhs
    result += convertLessThanOneThousand(Math.floor(rupeesValue / 100000)) + ' Lakh ';
    rupeesValue = rupeesValue % 100000;
  }
  
  if (rupeesValue >= 1000) { // Thousands
    result += convertLessThanOneThousand(Math.floor(rupeesValue / 1000)) + ' Thousand ';
    rupeesValue = rupeesValue % 1000;
  }
  
  if (rupeesValue > 0) {
    result += convertLessThanOneThousand(rupeesValue);
  }
  
  result = result.trim() + ' Rupees';
  
  if (paise > 0) {
    result += ' and ' + convertLessThanOneThousand(paise) + ' Paise';
  }
  
  return result + ' Only';
}

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
    
    // Get round-off value
    const roundOff = typeof invoice.roundOff === 'string'
      ? parseFloat(invoice.roundOff || '0')
      : (invoice.roundOff || 0);
      
    // Calculate total including round-off  
    total = subtotal + cgst + sgst + igst + roundOff;
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