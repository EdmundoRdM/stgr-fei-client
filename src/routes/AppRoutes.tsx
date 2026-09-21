import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoute } from './PublicRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthLayout } from '@/presentation/layouts/AuthLayout';
import { LoginView } from '@/presentation/views/auth/LoginView';
import { MaestroLandingView } from '@/presentation/views/profesor/MaestroLandingView';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public / Unauthenticated routes */}
      <Route element={<PublicRoute />}>
        <Route
          path="/login"
          element={
            <AuthLayout>
              <LoginView />
            </AuthLayout>
          }
        />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<MaestroLandingView />} />
      </Route>

      {/* Default fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
