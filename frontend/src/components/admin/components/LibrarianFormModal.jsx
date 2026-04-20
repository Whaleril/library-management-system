import { useState } from 'react'

const initialForm = { name: '', email: '', password: '', staffId: '' }

const buildInitialForm = (mode, librarian) => {
  if (mode === 'edit' && librarian) {
    return {
      name: librarian.name || '',
      email: librarian.email || '',
      password: '',
      staffId: librarian.staffId || ''
    }
  }

  return initialForm
}

const LibrarianFormModal = ({ open, mode, librarian, loading, onClose, onSubmit }) => {
  const [form, setForm] = useState(() => buildInitialForm(mode, librarian))

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      staffId: form.staffId.trim()
    }

    if (mode === 'create') {
      payload.password = form.password
    }

    onSubmit(payload)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === 'create' ? 'Create Librarian' : 'Edit Librarian'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
          {mode === 'create' && (
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>
          )}
          <div className="form-group">
            <label>Staff ID</label>
            <input
              type="text"
              required
              value={form.staffId}
              onChange={(e) => setForm((prev) => ({ ...prev, staffId: e.target.value }))}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : mode === 'create' ? 'Create' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LibrarianFormModal
