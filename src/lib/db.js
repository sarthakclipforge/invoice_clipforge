import Dexie from 'dexie'

// IndexedDB database for offline-first invoice storage and session persistence.
// All invoice data mirrors the JSONB shape stored in Supabase invoice_data column.
// The `synced` flag: 0 = pending push to Supabase, 1 = confirmed in sync.

export const db = new Dexie('InvoiceKit')

db.version(2).stores({
  // Primary invoice store.
  // supabaseId = the UUID from Supabase (null for invoices not yet pushed).
  // localId = Dexie auto-increment PK (used for local routing before first sync).
  invoices: '++localId, supabaseId, invoiceNumber, clientName, updatedAt, synced',

  // Session store — replaces localStorage for PWA persistence.
  // iOS clears localStorage for PWAs inactive >7 days. IndexedDB is more durable.
  session: 'key',

  // Clients store.
  clients: '++localId, supabaseId, name, email, updatedAt, synced',
})

// ── Auth helpers ──────────────────────────────────────────────────────────────

export async function setSession(value) {
  await db.session.put({ key: 'invoicekit_auth', value })
}

export async function getSession() {
  const record = await db.session.get('invoicekit_auth')
  return record?.value ?? null
}

export async function clearSession() {
  await db.session.delete('invoicekit_auth')
}

// ── Invoice helpers ───────────────────────────────────────────────────────────

export async function saveInvoiceLocally(invoice) {
  // invoice must include: supabaseId (or null), invoiceNumber, clientName,
  // totalAmount, currency, invoice_data (the full state blob), updatedAt, synced.
  return db.invoices.put(invoice)
}

export async function getInvoiceBySupabaseId(supabaseId) {
  return db.invoices.where('supabaseId').equals(supabaseId).first()
}

export async function getAllInvoicesLocal() {
  return db.invoices.orderBy('updatedAt').reverse().toArray()
}

export async function getPendingInvoices() {
  return db.invoices.where('synced').equals(0).toArray()
}

export async function markSynced(localId, supabaseId) {
  await db.invoices.update(localId, { synced: 1, supabaseId })
}

export async function deleteInvoiceBySupabaseId(supabaseId) {
  if (!supabaseId) return
  await db.invoices.where('supabaseId').equals(supabaseId).delete()
}

export async function deleteInvoiceByLocalId(localId) {
  if (!localId) return
  await db.invoices.delete(localId)
}

export async function getLocalIdForSupabaseId(supabaseId) {
  const record = await db.invoices.where('supabaseId').equals(supabaseId).first()
  return record?.localId ?? null
}
