import { adminDelete, adminGet, adminPost, adminPut } from './adminApiClient'

export function listLibrarians(query) {
  return adminGet('/admin/librarians', query)
}

export function createLibrarian(payload) {
  return adminPost('/admin/librarians', payload)
}

export function getLibrarianDetail(id) {
  return adminGet(`/admin/librarians/${id}`)
}

export function updateLibrarian(id, payload) {
  return adminPut(`/admin/librarians/${id}`, payload)
}

export function deleteLibrarian(id) {
  return adminDelete(`/admin/librarians/${id}`)
}

export function listUsers(query) {
  return adminGet('/admin/users', query)
}

export function updateUserRole(id, role) {
  return adminPut(`/admin/users/${id}/role`, { role })
}

export function resetUserPassword(id, payload = {}) {
  return adminPost(`/admin/users/${id}/reset-password`, payload)
}
