import { db } from './db'
import { supabase } from './supabaseClient'

export async function getAllClientsLocal() {
  return db.clients.orderBy('name').toArray()
}

export async function getClientByName(name) {
  return db.clients.where('name').equalsIgnoreCase(name).first()
}

export async function saveClientLocally(client) {
  return db.clients.put(client)
}

export async function upsertClientToSupabase(client) {
  const payload = {
    name:         client.name,
    email:        client.email || '',
    address:      client.address || '',
    ship_address: client.shipAddress || '',
    updated_at:   new Date().toISOString(),
  }
  if (client.supabaseId) {
    return supabase.from('clients').update(payload).eq('id', client.supabaseId)
  } else {
    return supabase.from('clients').insert(payload).select('id').single()
  }
}

export async function getAllClientsFromSupabase() {
  return supabase.from('clients').select('*').order('name', { ascending: true })
}

export async function deleteClient(supabaseId, localId) {
  await db.clients.delete(localId)
  if (supabaseId) {
    await supabase.from('clients').delete().eq('id', supabaseId)
  }
}
