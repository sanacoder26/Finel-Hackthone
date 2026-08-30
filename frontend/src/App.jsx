import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import CreateTicketPage from './pages/customer/CreateTicketPage';
import CustomerTicketDetailPage from './pages/customer/CustomerTicketDetailPage';
import AgentDashboardPage from './pages/agent/AgentDashboardPage';
import AgentTicketDetailPage from './pages/agent/AgentTicketDetailPage';
import { apiConfigurationError } from './services/api';
import { socketConfigurationError } from './utils/socket';

export default function App() {
  const { user } = useAuth();
  const configurationError = apiConfigurationError || socketConfigurationError;

  if (configurationError) {
    return (
      <main className="configuration-error" role="alert">
        <div className="configuration-error__panel">
          <p className="eyebrow">AI Support Desk</p>
          <h1>Frontend configuration required</h1>
          <p>{configurationError}</p>
          <p>After adding the variables, create a new Vercel deployment.</p>
        </div>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<Layout />}>
        <Route
          path="/customer/dashboard"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/tickets/new"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CreateTicketPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/tickets/:id"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerTicketDetailPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/agent/dashboard"
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agent/tickets/:id"
          element={
            <ProtectedRoute allowedRoles={['agent']}>
              <AgentTicketDetailPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to={user?.role === 'agent' ? '/agent/dashboard' : user ? '/customer/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
