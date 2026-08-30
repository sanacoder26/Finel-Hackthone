import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-shell"><div className="panel loading-box">Loading...</div></div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'customer') return <Navigate to="/customer/dashboard" replace />;
    if (user.role === 'agent') return <Navigate to="/agent/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
