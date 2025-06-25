
import React from 'react';
import { PageTitle, Alert } from '../../components/common/CommonComponents';
import { WhitelistManagement } from '../../components/admin/AdminComponents';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const AdminWhitelistPage: React.FC = () => {
  const { currentUser } = useAuth();

  const handleUsersUpdated = () => {
    // This callback can be used if the parent page needs to react to user updates
    // triggered by WhitelistManagement (e.g., refreshing a user count display on this page).
    // For now, it's just a placeholder callback.
  };  if (!currentUser || (currentUser.role !== UserRole.SUPERADMIN && currentUser.role !== UserRole.ADMIN)) {
    return <Alert type="error" title="Acceso Denegado" message="Esta sección es solo para Administradores." />;
  }

  return (
    <PermissionGuard section="whitelist" requiredLevel="read">
      <PageTitle title="Lista Blanca y Carga de Usuarios" subtitle="Gestiona los CURPs autorizados y carga usuarios masivamente." />
      <WhitelistManagement onUsersUpdated={handleUsersUpdated} />
    </PermissionGuard>
  );
};

export default AdminWhitelistPage;
