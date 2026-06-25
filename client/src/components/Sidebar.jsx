import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/medicines', icon: '💊', label: 'Medicines' },
  { path: '/suppliers', icon: '🏭', label: 'Suppliers' },
  { path: '/purchases', icon: '🛒', label: 'Purchases' },
  { path: '/sales', icon: '💰', label: 'Billing' },
  { path: '/customers', icon: '👥', label: 'Customers' },
  { path: '/reports', icon: '📈', label: 'Reports' },
  { path: '/audit-logs', icon: '📋', label: 'Audit Logs' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">💊</div>
        <div className="logo-text">
          <span className="logo-title">PharmaCare</span>
          <span className="logo-subtitle">Inventory System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">Navigation</span>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{initials}</div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role">{user?.role || 'pharmacist'}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            ↪
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
