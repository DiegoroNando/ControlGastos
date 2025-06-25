
import React, { useState } from 'react';
import { PageTitle, Alert } from '../../components/common/CommonComponents';
import BlockManagement from '../../components/admin/BlockManagement';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

const AdminBlockManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshTrigger, setRefreshTrigger] = useState(0); // For potential future use if page needs to trigger refresh of BlockManagement

  const handleSettingsChanged = () => {
    // This function can be used to update any page-level state if BlockManagement changes affect it.
    // For now, it primarily serves as a prop for BlockManagement.
    setRefreshTrigger(prev => prev + 1);
  };
  if (!currentUser || (currentUser.role !== UserRole.SUPERADMIN && currentUser.role !== UserRole.ADMIN)) {
    return <Alert type="error" title="Acceso Denegado" message="Esta sección requiere permisos de administrador." />;
  }

  return (
    <PermissionGuard section="blocks" requiredLevel="read">
      <PageTitle title="Gestión de Bloques de Candidatos" subtitle="Habilita o deshabilita bloques para la votación." />
      <BlockManagement onSettingsChanged={handleSettingsChanged} />
    </PermissionGuard>
  );
};

export default AdminBlockManagementPage;
