import React from 'react'

const Pagination = ({ page, size, total, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil((total || 0) / size))

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="btn-secondary"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </button>
      <span className="admin-pagination-text">Page {page} / {totalPages}</span>
      <button
        type="button"
        className="btn-secondary"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}

export default Pagination
