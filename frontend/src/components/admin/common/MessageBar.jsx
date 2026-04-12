import React from 'react'

const MessageBar = ({ type = 'info', message, onClose }) => {
  if (!message) return null

  return (
    <div className={`admin-message ${type}`}>
      <span>{message}</span>
      <button type="button" className="admin-message-close" onClick={onClose}>×</button>
    </div>
  )
}

export default MessageBar
