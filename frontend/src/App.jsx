import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthPage from './pages/auth/AuthPage';
import StudentDashboard from './pages/student-dashboard/StudentDashboard';
import TnpDashboard from './pages/tnp-dashboard/TnpDashboard';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tnp/*"
            element={
              <ProtectedRoute allowedRoles={['tnp_admin', 'alumni']}>
                <TnpDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/student" replace />} />
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
