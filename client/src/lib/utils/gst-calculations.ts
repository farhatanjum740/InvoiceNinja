/**
 * Calculates the GST based on Indian GST rules:
 * - If customer state matches company state: Apply CGST + SGST
 * - If customer state differs from company state: Apply IGST
 * 
 * @param items The array of invoice items, each with quantity, rate, and gstRate
 * @param customer The customer details with billing state
 * @param company The company details with state
 * @returns Object containing cgst, sgst, and igst values
 */
export function calculateGST(
  items: any[],
  customer: any,
  company: any
): { cgst: number; sgst: number; igst: number } {
  if (!customer || !company || !items || !items.length) {
    return { cgst: 0, sgst: 0, igst: 0 };
  }

  // Calculate GST on an item-by-item basis based on their individual GST rates
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  
  // Process each item to calculate GST correctly
  items.forEach(item => {
    const itemAmount = parseFloat(item.amount) || (parseFloat(item.quantity) * parseFloat(item.rate));
    const gstRate = parseFloat(item.gstRate) || 0;
    const gstAmount = itemAmount * (gstRate / 100);
    
    // Same state: CGST + SGST
    if (customer.billingState === company.state) {
      totalCGST += gstAmount / 2;
      totalSGST += gstAmount / 2;
    } 
    // Different state: IGST
    else {
      totalIGST += gstAmount;
    }
  });
  
  // Round to 2 decimal places for currency
  return {
    cgst: parseFloat(totalCGST.toFixed(2)),
    sgst: parseFloat(totalSGST.toFixed(2)), 
    igst: parseFloat(totalIGST.toFixed(2))
  };
}

/**
 * Calculates GST breakdown for an individual invoice item
 * 
 * @param amount The amount of the invoice item (quantity * rate)
 * @param gstRate The GST rate as a percentage (e.g., 18 for 18%)
 * @param customer The customer details with billing state
 * @param company The company details with state
 * @returns Object containing cgst, sgst, and igst values for this item
 */
export function calculateItemGST(
  amount: number,
  gstRate: number,
  customer: any,
  company: any
): { cgst: number; sgst: number; igst: number } {
  if (!customer || !company) {
    return { cgst: 0, sgst: 0, igst: 0 };
  }

  const gstAmount = amount * (gstRate / 100);
  
  // Same state: CGST + SGST
  if (customer.billingState === company.state) {
    return {
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0
    };
  } 
  // Different state: IGST
  else {
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount
    };
  }
}
