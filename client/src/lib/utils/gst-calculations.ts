/**
 * Calculates the GST based on Indian GST rules:
 * - If customer state matches company state: Apply CGST + SGST
 * - If customer state differs from company state: Apply IGST
 * 
 * @param subtotal The subtotal amount of the invoice
 * @param customer The customer details with billing state
 * @param company The company details with state
 * @returns Object containing cgst, sgst, and igst values
 */
export function calculateGST(
  subtotal: number,
  customer: any,
  company: any
): { cgst: number; sgst: number; igst: number } {
  if (!customer || !company) {
    return { cgst: 0, sgst: 0, igst: 0 };
  }

  // Get GST rates from invoice items
  const totalGstAmount = getTotalGSTAmount(subtotal);
  
  // Same state: CGST + SGST
  if (customer.billingState === company.state) {
    return {
      cgst: totalGstAmount / 2,
      sgst: totalGstAmount / 2,
      igst: 0
    };
  } 
  // Different state: IGST
  else {
    return {
      cgst: 0,
      sgst: 0,
      igst: totalGstAmount
    };
  }
}

/**
 * Calculates the total GST amount based on subtotal
 * In a real application, this would be calculated from individual line items
 * Each with their own GST rate (5%, 12%, 18%, 28%)
 * 
 * @param subtotal The subtotal amount of the invoice
 * @returns The total GST amount
 */
function getTotalGSTAmount(subtotal: number): number {
  // For demo purposes, assuming 18% GST (common rate for services)
  // In a real app, this would be calculated from individual line items
  return subtotal * 0.18;
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
