import { supabase } from '../db';

/**
 * Reset sequences for tables that use auto-incrementing IDs.
 * This function ensures that new records will be assigned IDs that don't 
 * conflict with existing ones.
 */
export async function resetSequences(): Promise<void> {
  try {
    // Reset invoices sequence
    const { data: invoiceData, error: invoiceError } = await supabase.rpc('reset_invoices_sequence');
    if (invoiceError) {
      console.error('Failed to reset invoices sequence, falling back to manual SQL');
      // If the stored procedure isn't available, fall back to direct SQL query
      const { data, error } = await supabase.from('invoices').select('id').order('id', { ascending: false }).limit(1);
      if (!error && data && data.length > 0) {
        const maxId = data[0].id;
        await supabase.rpc('set_sequence_value', { seq_name: 'invoices_id_seq', value: maxId + 1 });
      }
    }

    // Reset invoice_items sequence
    const { data: itemData, error: itemError } = await supabase.rpc('reset_invoice_items_sequence');
    if (itemError) {
      console.error('Failed to reset invoice_items sequence, falling back to manual SQL');
      // If the stored procedure isn't available, fall back to direct SQL query
      const { data, error } = await supabase.from('invoice_items').select('id').order('id', { ascending: false }).limit(1);
      if (!error && data && data.length > 0) {
        const maxId = data[0].id;
        await supabase.rpc('set_sequence_value', { seq_name: 'invoice_items_id_seq', value: maxId + 1 });
      }
    }
    
    console.log('Database sequences reset successfully');
  } catch (error) {
    console.error('Failed to reset sequences:', error);
  }
}