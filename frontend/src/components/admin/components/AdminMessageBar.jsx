const AdminMessageBar = ({ message }) => {
  if (!message?.text) return null

  return <div className={`message ${message.type}`}>{message.text}</div>
}

export default AdminMessageBar
