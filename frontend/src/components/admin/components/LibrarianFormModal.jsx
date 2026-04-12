import React, { useMemo, useState } from 'react'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  staffId: '',
}

const LibrarianFormModal = ({ open, mode = 'create', initialValue, loading, onClose, onSubmit }) => {
  const [form, setForm] = useState(() => {
    if (mode === 'edit' && initialValue) {
      return {
        name: initialValue.name || '',
        email: initialValue.email || '',
        password: '',
        staffId: initialValue.staffId || '',
      }
    }
    return emptyForm
  })

  const title = useMemo(() => (mode === 'create' ? 'Create Librarian' : 'Edit Librarian'), [mode])

  if (!open) return null

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      staffId: form.staffId.trim(),
    }

    if (mode === 'create') {
      payload.password = form.password
    }

    onSubmit(payload)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content admin-modal-md">
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button type="button" className="admin-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="admin-modal-body admin-form-grid">
            <div className="admin-field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => updateField('name', e.target.value)} required />
            </div>

            <div className="admin-field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
            </div>

            {mode === 'create' && (
              <div className="admin-field">
                <label>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  minLength={8}
                  maxLength={32}
                  placeholder="At least 8 chars with letters and numbers"
                />
              </div>
            )}

            <div className="admin-field">
              <label>Staff ID</label>
              <input value={form.staffId} onChange={(e) => updateField('staffId', e.target.value)} required />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LibrarianFormModal
