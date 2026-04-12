import React from 'react'

const ConfirmDialog = ({ open, title, message, confirmText = 'Confirm', onCancel, onConfirm, loading = false }) => {
  if (!open) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content admin-modal-sm">
        <h3>{title}</h3>
        <p className="admin-modal-message">{message}</p>
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
