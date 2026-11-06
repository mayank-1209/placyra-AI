import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center text-text-muted">
        <Loader2 className="w-10 h-10 animate-spin text-accent mb-3" />
        <p className="text-sm font-medium">Authenticating Placyra Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirect based on current role
    if (user?.role === 'student') {
      return <Navigate to="/student" replace />;
    } else {
      return <Navigate to="/tnp" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
