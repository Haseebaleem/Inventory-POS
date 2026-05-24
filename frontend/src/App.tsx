import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from '@/pages/LoginPage';
import AppLayout from '@/components/AppLayout';
import { RequireAuth } from '@/components/RequireAuth';
import RoleRedirect from '@/pages/RoleRedirect';
import PlaceholderPage from '@/pages/PlaceholderPage';

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<RoleRedirect />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth roles={['OWNER']}>
                <PlaceholderPage title="Dashboard" />
              </RequireAuth>
            }
          />
          <Route path="/pos" element={<PlaceholderPage title="POS Counter" />} />
          <Route
            path="/products"
            element={
              <RequireAuth roles={['OWNER']}>
                <PlaceholderPage title="Products" />
              </RequireAuth>
            }
          />
          <Route
            path="/categories"
            element={
              <RequireAuth roles={['OWNER']}>
                <PlaceholderPage title="Categories" />
              </RequireAuth>
            }
          />
          <Route
            path="/staff"
            element={
              <RequireAuth roles={['OWNER']}>
                <PlaceholderPage title="Staff" />
              </RequireAuth>
            }
          />
          <Route
            path="/business"
            element={
              <RequireAuth roles={['OWNER']}>
                <PlaceholderPage title="Business Settings" />
              </RequireAuth>
            }
          />
          <Route path="/sales" element={<PlaceholderPage title="Sales History" />} />
          <Route path="/sales/:id" element={<PlaceholderPage title="Sale Detail" />} />
          <Route
            path="/audit-logs"
            element={
              <RequireAuth roles={['OWNER']}>
                <PlaceholderPage title="Audit Logs" />
              </RequireAuth>
            }
          />
        </Route>
        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </>
  );
}
