import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from '@/pages/LoginPage';
import AppLayout from '@/components/AppLayout';
import { RequireAuth } from '@/components/RequireAuth';
import RoleRedirect from '@/pages/RoleRedirect';
import PlaceholderPage from '@/pages/PlaceholderPage';
import CategoriesPage from '@/pages/CategoriesPage';
import StaffPage from '@/pages/StaffPage';
import BusinessPage from '@/pages/BusinessPage';
import ProductsPage from '@/pages/ProductsPage';
import ProductNewPage from '@/pages/ProductNewPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import AuditLogsPage from '@/pages/AuditLogsPage';
import TopProgressBar from '@/components/TopProgressBar';
import SplashScreen from '@/components/SplashScreen';
import { useAuthBootstrap } from '@/hooks/useAuthBootstrap';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';

export default function App() {
  const bootstrapped = useAuthBootstrap();

  if (!bootstrapped) {
    return <SplashScreen />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <TopProgressBar />
      <RouteErrorBoundary>
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
                  <ProductsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/products/new"
              element={
                <RequireAuth roles={['OWNER']}>
                  <ProductNewPage />
                </RequireAuth>
              }
            />
            <Route
              path="/products/:id"
              element={
                <RequireAuth roles={['OWNER']}>
                  <ProductDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/categories"
              element={
                <RequireAuth roles={['OWNER']}>
                  <CategoriesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/staff"
              element={
                <RequireAuth roles={['OWNER']}>
                  <StaffPage />
                </RequireAuth>
              }
            />
            <Route
              path="/business"
              element={
                <RequireAuth roles={['OWNER']}>
                  <BusinessPage />
                </RequireAuth>
              }
            />
            <Route path="/sales" element={<PlaceholderPage title="Sales History" />} />
            <Route path="/sales/:id" element={<PlaceholderPage title="Sale Detail" />} />
            <Route
              path="/audit-logs"
              element={
                <RequireAuth roles={['OWNER']}>
                  <AuditLogsPage />
                </RequireAuth>
              }
            />
          </Route>
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </RouteErrorBoundary>
    </>
  );
}
