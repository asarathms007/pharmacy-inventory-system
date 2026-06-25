import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import Suppliers from './pages/Suppliers';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Customers from './pages/Customers';
import AuditLogs from './pages/AuditLogs';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

const AppLayout = ({ children, title, subtitle }) => (
  <div className="app-layout">
    <Sidebar />
    <div className="main-content">
      <Navbar title={title} subtitle={subtitle} />
      <main className="page-content">{children}</main>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout title="Dashboard" subtitle="Overview of your pharmacy">
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/medicines" element={
              <ProtectedRoute>
                <AppLayout title="Medicines" subtitle="Manage your medicine inventory">
                  <Medicines />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/suppliers" element={
              <ProtectedRoute>
                <AppLayout title="Suppliers" subtitle="Manage your suppliers">
                  <Suppliers />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/purchases" element={
              <ProtectedRoute>
                <AppLayout title="Purchases" subtitle="Track stock purchases">
                  <Purchases />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/sales" element={
              <ProtectedRoute>
                <AppLayout title="Billing & Invoicing" subtitle="Professional POS and billing">
                  <Sales />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/customers" element={
              <ProtectedRoute>
                <AppLayout title="Customers" subtitle="Manage customer details">
                  <Customers />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/audit-logs" element={
              <ProtectedRoute>
                <AppLayout title="Audit Logs" subtitle="Track user actions">
                  <AuditLogs />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute>
                <AppLayout title="Reports" subtitle="Analytics and insights">
                  <Reports />
                </AppLayout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
