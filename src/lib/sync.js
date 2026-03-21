import { supabase } from './supabaseClient'
import {
  getPendingInvoices,
  markSynced,
  saveInvoiceLocally,
} from './db'

// Pushes any locally-created/edited invoices (synced: 0) to Supabase.
// Called on: app mount when online, window 'online' event.
export async function pushPendingToSupabase() {
  const pending = await getPendingInvoices()
  if (pending.length === 0) return

  for (const invoice of pending) {
    const payload = {
      invoice_number: invoice.invoiceNumber,
      client_name: invoice.clientName,
      total_amount: invoice.totalAmount,
      currency: invoice.currency,
      invoice_data: invoice.invoice_data,
      updated_at: invoice.updatedAt,
    }

    if (invoice.supabaseId) {
      // Existing invoice — update
      const { error } = await supabase
        .from('invoices')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', invoice.supabaseId)

      if (!error) {
        await markSynced(invoice.localId, invoice.supabaseId)
      }
    } else {
      // New invoice — insert and capture the returned UUID
      const { data, error } = await supabase
        .from('invoices')
        .insert(payload)
        .select('id')
        .single()

      if (!error && data) {
        await markSynced(invoice.localId, data.id)
      }
    }
  }
}

// Pulls all invoices from Supabase and upserts them into IndexedDB.
// Called on: app mount when online, after pushPendingToSupabase.
export async function pullFromSupabase() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return

  for (const row of data) {
    await saveInvoiceLocally({
      supabaseId: row.id,
      invoiceNumber: row.invoice_number,
      clientName: row.client_name,
      totalAmount: row.total_amount,
      currency: row.currency,
      invoice_data: row.invoice_data,
      updatedAt: row.updated_at,
      synced: 1,
    })
  }
}
