import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Outlet />;
  }

  const navItems = user.role === 'customer'
    ? [
        { to: '/customer/dashboard', label: 'Dashboard' },
      ]
    : [
        { to: '/agent/dashboard', label: 'Dashboard' },
      ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">AI</div>
          <div>
            <h2>Support Desk</h2>
            <small>{user.role === 'customer' ? 'Customer Portal' : 'Agent Portal'}</small>
          </div>
        </div>

        <nav className="side-nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div>
            <strong>{user.name}</strong>
            <small>{user.role}</small>
          </div>
          <button className="ghost-button" onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <span className="eyebrow">Support Hub</span>
            <h1>{user.role === 'customer' ? 'Customer Dashboard' : 'Agent Dashboard'}</h1>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
