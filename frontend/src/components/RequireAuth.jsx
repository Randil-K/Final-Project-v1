import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { Loading } from './AsyncState.jsx';
import { Alert } from '../design-system';

export default function RequireAuth({ roles, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return <Loading label="Checking your session…" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div style={{ padding: 'var(--space-8)' }}>
        <Alert tone="warning" title="This console is for authority officers and administrators">
          You are signed in as {user.fullName}. Ask an administrator if you need access.
        </Alert>
      </div>
    );
  }

  return children;
}
