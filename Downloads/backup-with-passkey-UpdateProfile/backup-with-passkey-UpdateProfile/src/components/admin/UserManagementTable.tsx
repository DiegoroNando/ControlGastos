import React, { useState, useMemo } from 'react';
import { User, UserRole, VoteRecord, EligibilityAnswers, ALL_USER_ROLES } from '../../types';
import { Button, Input, Select, Card, ConfirmationModal, LoadingSpinner } from '../common/CommonComponents';
import { updateUser, deleteUser } from '../../services/databaseService';
import { SUPERADMIN_CURP, ELIGIBILITY_QUESTIONS } from '../../constants';
import MassDeleteUsers from './MassDeleteUsers';
import { useAuth } from '../../contexts/AuthContext';
import { filterUsersByAccessSync } from '../../services/accessControlService';

// User Management Table Props Interface
interface UserManagementTableProps {
  users: User[];
  allVotes: VoteRecord[];
  onRefreshData: () => void;
  isLoading: boolean;
}

export const UserManagementTable: React.FC<UserManagementTableProps> = ({ users, allVotes, onRefreshData, isLoading }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [isMassVerifyModalOpen, setIsMassVerifyModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { currentUser } = useAuth();

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };

  const handleDeleteUser = (user: User) => {
    if (user.curp === SUPERADMIN_CURP) {
        alert("No se puede eliminar al superadministrador principal.");
        return;
    }
    setDeletingUser(user);
  };

  const confirmDeleteUser = () => {
    if (deletingUser) {
      deleteUser(deletingUser.id);
      setDeletingUser(null);
      onRefreshData(); 
    }
  };
  
  const handleUserSelect = (userId: string, isSelected: boolean) => {
    setSelectedUsers(prev => {
      if (isSelected) {
        return [...prev, userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  };
    const handleSelectAllUsers = (isSelected: boolean) => {
    if (isSelected) {
      // Don't select the superadmin
      const accessibleUsers = filterUsersByAccessSync(filteredUsers, currentUser?.role || UserRole.USER);
      const nonSuperAdminUserIds = accessibleUsers
        .filter(user => user.curp !== SUPERADMIN_CURP)
        .map(user => user.id);
      setSelectedUsers(nonSuperAdminUserIds);
    } else {
      setSelectedUsers([]);
    }
  };
  
  const confirmMassDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      setIsDeleting(true);
      
      // Delete users one by one
      for (const userId of selectedUsers) {
        await deleteUser(userId);
      }
      
      // Clear selected users and refresh data
      setSelectedUsers([]);
      setShowMassDeleteModal(false);
      onRefreshData();
    } catch (error) {
      console.error('Error deleting users:', error);
      alert('Ocurrió un error al eliminar usuarios. Por favor, inténtelo de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveUser = (updatedUser: User) => {
    setEditingUser(null);
    onRefreshData(); 
  };

  const handleMassVerificationSave = (updatedUsersData: Array<{ userId: string, adminEligibilityVerification: EligibilityAnswers, isEligibleForVoting: boolean }>) => {
    updatedUsersData.forEach(data => {
        const userToUpdate = users.find(u => u.id === data.userId);
        if (userToUpdate) {
            updateUser({
                ...userToUpdate,
                adminEligibilityVerification: data.adminEligibilityVerification,
                isEligibleForVoting: data.isEligibleForVoting,
            });
        }
    });
    setIsMassVerifyModalOpen(false);
    onRefreshData();
  };

  const candidatesNeedingVerification = useMemo(() => {
    return users.filter(u =>
        u.role === UserRole.CANDIDATE &&
        u.isRegisteredAsCandidate &&
        (!u.isEligibleForVoting ||
         Object.keys(u.adminEligibilityVerification || {}).length < Object.keys(ELIGIBILITY_QUESTIONS).length || 
         Object.values(u.adminEligibilityVerification || {}).some(v => v === null))
    );
  }, [users]);

  const filteredUsers = users.filter(user => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const nameMatch = `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno}`.toLowerCase().includes(lowerSearchTerm);
    const curpMatch = user.curp.toLowerCase().includes(lowerSearchTerm);
    const roleMatch = filterRole ? user.role === filterRole : true;
    const areaMatch = user.areaDepartamentoDireccion?.toLowerCase().includes(lowerSearchTerm);
    const puestoMatch = user.puesto?.toLowerCase().includes(lowerSearchTerm);
    const emailMatch = user.email?.toLowerCase().includes(lowerSearchTerm);
    const sexoMatch = user.sexo?.toLowerCase().includes(lowerSearchTerm);
    const antiguedadMatch = user.antiguedad?.toString().includes(searchTerm);
    const educationalLevelMatch = user.educationalLevel?.toLowerCase().includes(lowerSearchTerm);

    return (nameMatch || curpMatch || areaMatch || puestoMatch || emailMatch || sexoMatch || antiguedadMatch || educationalLevelMatch) && roleMatch;
  });  // Filter users based on admin access permissions
  const accessibleUsers = useMemo(() => {
    return filterUsersByAccessSync(filteredUsers, currentUser?.role || UserRole.USER);
  }, [filteredUsers, currentUser]);

  return (
    <Card title="Gestión de Usuarios" padding="none" actions={
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={() => setIsMassVerifyModalOpen(true)} disabled={isLoading || candidatesNeedingVerification.length === 0} className="spectra-btn-secondary-enhanced">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Verificación Masiva ({candidatesNeedingVerification.length})
          </Button>
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => setShowMassDeleteModal(true)} 
            disabled={isLoading || selectedUsers.length === 0}
            className="spectra-btn-danger-enhanced"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
            </svg>
            Eliminación masiva ({selectedUsers.length})
          </Button>
        </div>
    }>
      <div className="p-5 border-b border-border-gray/50 dark:border-neutral-700/50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
                placeholder="Buscar por nombre, CURP, email, área, puesto, sexo, antigüedad, nivel educ..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                name="userSearch"
            />
            <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
                options={[{value: '', label: 'Todos los Roles'}, ...ALL_USER_ROLES.map(r => ({value: r, label: r}))]}
                name="roleFilter"
            />
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border-gray/50 dark:divide-neutral-700/50 text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-700/40">
            <tr>
              <th className="px-3 py-3 text-center font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">
                <input 
                  type="checkbox" 
                  className="form-checkbox h-4 w-4 text-custom-pink rounded focus:ring-2 focus:ring-custom-pink dark:focus:ring-custom-pink dark:border-neutral-600" 
                  onChange={(e) => handleSelectAllUsers(e.target.checked)}
                  checked={accessibleUsers.length > 0 && accessibleUsers.filter(u => u.curp !== SUPERADMIN_CURP).length === selectedUsers.length}
                />
              </th>
              <th className="px-5 py-3 text-left font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">Nombre Completo</th>
              <th className="px-5 py-3 text-left font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">CURP</th>
              <th className="px-5 py-3 text-left font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">Email</th>
              <th className="px-5 py-3 text-left font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">Antigüedad</th>
              <th className="px-5 py-3 text-left font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">Rol</th>
              <th className="px-5 py-3 text-left font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">Bloque (Vot.)</th>
              <th className="px-5 py-3 text-center font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">Registrado Cand.</th>
              <th className="px-5 py-3 text-center font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">Elegible Votación</th>
              <th className="px-5 py-3 text-center font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">Votos Rec.</th>
              <th className="px-5 py-3 text-center font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">Nomin. Pend.</th>
              <th className="px-5 py-3 text-right font-semibold text-text-secondary dark:text-neutral-400 tracking-wider min-w-[150px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-card-bg dark:bg-neutral-800 divide-y divide-border-gray/30 dark:divide-neutral-700/30">
            {accessibleUsers.length > 0 ? accessibleUsers.map(user => {
              const userVotes = user.isRegisteredAsCandidate && user.isEligibleForVoting
                ? allVotes.filter(vote => vote.candidateId === user.id).length 
                : null;

              return (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-700/60 transition-colors">
                  <td className="px-3 py-3.5 whitespace-nowrap text-center">
                    {user.curp !== SUPERADMIN_CURP && (
                      <input 
                        type="checkbox" 
                        className="form-checkbox h-4 w-4 text-custom-pink rounded focus:ring-2 focus:ring-custom-pink dark:focus:ring-custom-pink dark:border-neutral-600"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                      />
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-text-primary dark:text-neutral-100">{user.nombre} {user.apellidoPaterno} {user.apellidoMaterno}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-text-tertiary dark:text-neutral-400 font-mono text-xs">{user.curp}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-text-tertiary dark:text-neutral-400 text-xs truncate max-w-[120px]" title={user.email}>{user.email || '-'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-text-secondary dark:text-neutral-300 text-center">{user.antiguedad !== undefined ? user.antiguedad : '-'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-text-secondary dark:text-neutral-300">{user.role}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-text-secondary dark:text-neutral-300 text-xs truncate max-w-[150px]" title={user.assignedBlock}>{user.assignedBlock}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${user.isRegisteredAsCandidate ? 'bg-success-bg text-success-text dark:bg-green-800/50 dark:text-green-300' : 'bg-gray-100 text-text-tertiary dark:bg-neutral-700 dark:text-neutral-400'}`}>
                          {user.isRegisteredAsCandidate ? 'Sí' : 'No'}
                      </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${user.isEligibleForVoting ? 'bg-success-bg text-success-text dark:bg-green-800/50 dark:text-green-300' : (user.isRegisteredAsCandidate ? 'bg-warning-bg text-warning-text dark:bg-orange-800/50 dark:text-orange-300' : 'bg-gray-100 text-text-tertiary dark:bg-neutral-700 dark:text-neutral-400')}`}>
                          {user.isEligibleForVoting ? 'Sí' : (user.isRegisteredAsCandidate ? 'Pendiente' : 'No Aplica')}
                      </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-text-secondary dark:text-neutral-300 text-center">
                    {userVotes !== null ? userVotes : 'N/A'}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-text-secondary dark:text-neutral-300 text-center">
                      {user.hasPendingPeerNominationDecision && user.peerNominations && user.peerNominations.length > 0 ? user.peerNominations.length : '0'}
                  </td>                  <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => handleEditUser(user)} title="Editar Usuario" className="spectra-icon-btn spectra-btn-secondary-enhanced">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                          <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                        </svg>
                    </Button>
                    {user.curp !== SUPERADMIN_CURP && (
                        <Button size="sm" variant="danger" onClick={() => handleDeleteUser(user)} title="Eliminar Usuario" className="spectra-icon-btn spectra-btn-danger-enhanced">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                        </Button>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={12} className="px-5 py-10 text-center text-text-tertiary dark:text-neutral-400">
                  No se encontraron usuarios que coincidan con los filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      <ConfirmationModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={confirmDeleteUser}
        title="Confirmar Eliminación de Usuario"
        message={
          <>
            <p>¿Estás seguro que deseas eliminar a <strong>{deletingUser?.nombre} {deletingUser?.apellidoPaterno}</strong>?</p>
            <p className="text-xs text-text-tertiary dark:text-neutral-400 mt-2">Esta acción no se puede deshacer</p>
          </>
        }
        confirmText="Sí, Eliminar"
        confirmButtonVariant="danger"
      />

      {/* Mass Delete Modal */}
      <MassDeleteUsers
        isOpen={showMassDeleteModal}
        onClose={() => setShowMassDeleteModal(false)}
        usersCount={selectedUsers.length}
        onConfirmDelete={confirmMassDeleteUsers}
        isDeleting={isDeleting}
      />
    </Card>
  );
};

// Export the component
export default UserManagementTable;
