
import React from 'react';
import { PageTitle, Alert } from '../../components/common/CommonComponents';
import ElectionCalendarManagement from '../../components/admin/ElectionCalendarManagement';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const AdminElectionCalendarPage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser || (currentUser.role !== UserRole.SUPERADMIN && currentUser.role !== UserRole.ADMIN)) {
    return <Alert type="error" title="Acceso Denegado" message="Esta sección requiere permisos de administrador." />;
  }

  return (
    <PermissionGuard section="calendar" requiredLevel="read">
      <PageTitle title="Gestión de Calendario Electoral" subtitle="Define los periodos de nominación y votación." />
      <ElectionCalendarManagement />
    </PermissionGuard>
  );
};

export default AdminElectionCalendarPage;
