
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import UserDashboardContent from './UserDashboardContent';
import CandidateDashboardContent from './CandidateDashboardContent';
import SuperAdminRoutesWrapper from './SuperAdminDashboardContent'; // Updated import
import { LoadingSpinner } from '../components/common/CommonComponents';
import { ProfilePage } from './ProfilePage';
import { ROUTES }  from '../constants';

const DashboardRouterPage: React.FC = () => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.AUTH} replace />;
  }

  let DashboardComponent;
  switch (currentUser.role) {
    case UserRole.SUPERADMIN:
      DashboardComponent = SuperAdminRoutesWrapper; // Use the wrapper for superadmin
      break;
    case UserRole.CANDIDATE:
      DashboardComponent = CandidateDashboardContent;
      break;
    case UserRole.USER:
    default:
      DashboardComponent =ProfilePage;
      break;
  }

  return <DashboardComponent />;
};

export default DashboardRouterPage;
