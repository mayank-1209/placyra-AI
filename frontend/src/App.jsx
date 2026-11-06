import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './features/theme/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthModal from './features/auth/AuthModal';
import HomePage from './pages/home/HomePage';
import AuthPage from './pages/auth/AuthPage';
import StudentDashboard from './pages/student-dashboard/StudentDashboard';
import TnpDashboard from './pages/tnp-dashboard/TnpDashboard';
import BlogIndexPage from './features/blog/pages/BlogIndexPage';
import ArticlePage from './features/blog/pages/ArticlePage';
import CategoryPage from './features/blog/pages/CategoryPage';
import BlogEditorPage from './features/blog/pages/BlogEditorPage';
import AdManagerPage from './features/blog/pages/AdManagerPage';
import LegalPage from './pages/legal/LegalPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/student/*" element={<StudentDashboard />} />

            {/* Public Blog Section */}
            <Route path="/blog" element={<BlogIndexPage />} />
            <Route path="/blog/:slug" element={<ArticlePage />} />
            <Route path="/blog/category/:slug" element={<CategoryPage />} />

            {/* Editorial & Management Routes */}
            <Route
              path="/blog/editor"
              element={
                <ProtectedRoute allowedRoles={['author', 'editor', 'admin', 'super_admin']}>
                  <BlogEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ads"
              element={
                <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                  <AdManagerPage />
                </ProtectedRoute>
              }
            />

            {/* Public Static / Legal Pages */}
            <Route path="/about" element={<LegalPage type="about" />} />
            <Route path="/contact" element={<LegalPage type="contact" />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/cookie-policy" element={<LegalPage type="cookie-policy" />} />

            {/* Protected Management Routes */}
            <Route
              path="/tnp/*"
              element={
                <ProtectedRoute allowedRoles={['tnp_admin', 'alumni', 'admin', 'super_admin']}>
                  <TnpDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Global Auth Modal for Guest Action Interception */}
          <AuthModal />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
