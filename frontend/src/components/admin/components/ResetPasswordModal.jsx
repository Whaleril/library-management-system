import { useState } from 'react'

const ResetPasswordModal = ({ open, user, loading, result, onClose, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('')

  if (!open || !user) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(newPassword.trim())
  }

  const handleClose = () => {
    setNewPassword('')
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Reset Password</h3>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <p style={{ marginBottom: 12, color: '#4a5568' }}>
            User: <strong>{user.name}</strong> ({user.email})
          </p>
          <div className="form-group">
            <label>New Password (optional)</label>
            <input
              type="password"
              placeholder="Leave blank to generate temporary password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              maxLength={32}
            />
            <p style={{ marginTop: 6, fontSize: 12, color: '#718096' }}>Password rule: 8-32 chars, at least one letter and one number.</p>
          </div>

          {result && (
            <div className="success-message" style={{ marginTop: 12 }}>
              {result.tempPassword
                ? `Temporary password: ${result.tempPassword}`
                : 'Password reset completed.'}
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>Close</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Resetting...' : 'Confirm Reset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordModal
