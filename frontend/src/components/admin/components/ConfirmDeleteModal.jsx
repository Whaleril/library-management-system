const ConfirmDeleteModal = ({ open, librarian, loading, onClose, onConfirm }) => {
  if (!open || !librarian) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Delete Librarian</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete <strong>{librarian.name}</strong>?</p>
          <p className="warning-text">This action cannot be undone.</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDeleteModal
