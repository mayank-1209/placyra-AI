import React from 'react';
import { useAuthGate } from './useAuthGate';

export const RequireAuth = ({
  children,
  action = 'general_action',
  fallback = null,
  onAuthorized,
  className = '',
}) => {
  const { isAuthenticated, requireAuth } = useAuthGate();

  const handleClickCapture = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      e.stopPropagation();
      requireAuth(onAuthorized, { action });
    }
  };

  return (
    <div onClickCapture={handleClickCapture} className={className}>
      {children}
    </div>
  );
};

export default RequireAuth;
