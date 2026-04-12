import React from 'react'
import { ADMIN_MENU } from '../config/adminPages'

const AdminSidebar = ({ activePage, onSelectPage }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>🛠️ Admin Center</h1>
      </div>
      <nav className="sidebar-menu">
        <div className="menu-section">Administration</div>
        {ADMIN_MENU.map((item) => (
          <div
            key={item.key}
            className={`menu-item ${activePage === item.key ? 'active' : ''}`}
            onClick={() => onSelectPage(item.key)}
          >
            <span className="icon">{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  )
}

export default AdminSidebar
