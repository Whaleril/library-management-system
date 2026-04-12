import React from 'react'

const ResetPasswordModal = ({
  open,
  targetUser,
  manualMode,
  newPassword,
  submitting,
  onToggleManualMode,
  onPasswordChange,
  onCancel,
  onConfirm,
}) => {
  if (!open || !targetUser) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content admin-modal-md">
        <div className="admin-modal-header">
          <h3>Reset Password</h3>
          <button type="button" className="admin-modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="admin-modal-body">
          <p className="admin-modal-user-line">
            Target User: <strong>{targetUser.name}</strong> ({targetUser.email})
          </p>

          <label className="admin-checkbox-row">
            <input
              type="checkbox"
              checked={manualMode}
              onChange={(e) => onToggleManualMode(e.target.checked)}
            />
            <span>Set custom new password</span>
          </label>

          {manualMode && (
            <div className="admin-field">
              <label>New Password (8-32, letters + numbers)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => onPasswordChange(e.target.value)}
                minLength={8}
                maxLength={32}
                placeholder="e.g. NewPass123"
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            disabled={submitting || (manualMode && !newPassword)}
            onClick={onConfirm}
          >
            {submitting ? 'Resetting...' : 'Confirm Reset'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordModal
