
import React, { useState, useEffect, useCallback } from 'react';
import { PageTitle, Alert, LoadingSpinner } from '../../components/common/CommonComponents';
import { UserManagementTable } from '../../components/admin/AdminComponents';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, User, VoteRecord } from '../../types';
import { getUsers, getVotes } from '../../services/databaseService';

const AdminUserManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [allVotes, setAllVotes] = useState<VoteRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fetchUsersAndVotes = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers.sort((a, b) => a.nombre.localeCompare(b.nombre)));
      const fetchedVotes = await getVotes();
      setAllVotes(fetchedVotes);
    } catch (error) {
      console.error('Error fetching users and votes:', error);
      setUsers([]);
      setAllVotes([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersAndVotes();
  }, [fetchUsersAndVotes, refreshTrigger]);

  const handleDataRefreshNeeded = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  if (!currentUser || (currentUser.role !== UserRole.SUPERADMIN && currentUser.role !== UserRole.ADMIN)) {
    return <Alert type="error" title="Acceso Denegado" message="Esta sección requiere permisos de administrador." />;
  }

  return (
    <PermissionGuard section="users" requiredLevel="read">
      <PageTitle title="Gestión de Usuarios" subtitle="Administra todos los usuarios del sistema." />
      {isLoadingData ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <UserManagementTable 
          users={users}
          allVotes={allVotes}
          onRefreshData={handleDataRefreshNeeded}
          isLoading={isLoadingData} // This will be false here, but good to pass if table had its own loading
        />
      )}
    </PermissionGuard>
  );
};

export default AdminUserManagementPage;
