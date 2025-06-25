import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { User, UserRole, CandidateBlock, ALL_USER_ROLES, ALL_CANDIDATE_BLOCKS, VoteRecord, AreaDepartamentoDireccion, ALL_AREA_DEPARTAMENTO_DIRECCION, UserSex, ALL_USER_SEX, EducationalLevel, ALL_EDUCATIONAL_LEVELS, EligibilityCriterionKey, EligibilityAnswers } from '../../types';
import { Button, Input, Select, Card, Modal, ConfirmationModal, LoadingSpinner, Alert } from '../common/CommonComponents';
import { getUsers, updateUser, deleteUser, getWhitelist, addToWhitelist, removeFromWhitelist, isWhitelisted, addUser as addUserService, getUserByCurp, getVotes } from '../../services/databaseService';
import { EditProfileForm } from '../profile/ProfileComponents';
import { SUPERADMIN_CURP, CURP_REGEX, EMAIL_REGEX, ELIGIBILITY_QUESTIONS } from '../../constants';
import { extractDateOfBirthFromCURP } from '../../utils/curpUtils';
import { useToast } from '../../contexts/ToastContext';

declare global {
  interface Window {
    XLSX: any; 
  }
}

interface UserManagementTableProps {
  users: User[];
  allVotes: VoteRecord[];
  onRefreshData: () => void;
  isLoading: boolean;
}

export const UserManagementTable: React.FC<UserManagementTableProps> = ({ users, allVotes, onRefreshData, isLoading }) => {
  const { error: showError } = useToast();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [isMassVerifyModalOpen, setIsMassVerifyModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showMassDeleteModal, setShowMassDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
  };
  const handleDeleteUser = (user: User) => {
    if (user.curp === SUPERADMIN_CURP) {
        showError("No se puede eliminar al superadministrador principal.");
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
      const nonSuperAdminUserIds = filteredUsers
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
      onRefreshData();    } catch (error) {
      console.error('Error deleting users:', error);
      showError('Ocurrió un error al eliminar usuarios. Por favor, inténtelo de nuevo.');
    } finally {
      setIsDeleting(false);
    }
  };  const handleSaveUser = (_updatedUser: User) => {
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
  });

  return (
    <Card title="Gestión de Usuarios" padding="none" actions={        <div className="flex space-x-2">
          <Button variant="secondary" size="sm" onClick={() => setIsMassVerifyModalOpen(true)} disabled={isLoading || candidatesNeedingVerification.length === 0}>
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
      ) : (      <div className="overflow-x-auto rounded-container-second">
        <table className="min-w-full divide-y divide-border-gray/35 dark:divide-neutral-700/35 text-sm backdrop-blur-md">
          <thead className="bg-gray-50/60 dark:bg-neutral-700/40 backdrop-blur-md">
            <tr>
              <th className="px-3 py-3 text-center font-semibold text-text-secondary dark:text-neutral-400 tracking-wider">
                <input 
                  type="checkbox" 
                  className="form-checkbox h-4 w-4 text-custom-pink rounded focus:ring-2 focus:ring-custom-pink dark:focus:ring-custom-pink dark:border-neutral-600" 
                  onChange={(e) => handleSelectAllUsers(e.target.checked)}
                  checked={filteredUsers.length > 0 && filteredUsers.filter(u => u.curp !== SUPERADMIN_CURP).length === selectedUsers.length}
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
          <tbody className="bg-card-bg/70 dark:bg-neutral-800/50 backdrop-blur-md divide-y divide-border-gray/30 dark:divide-neutral-700/30">
            {filteredUsers.length > 0 ? filteredUsers.map(user => {
              const userVotes = user.isRegisteredAsCandidate && user.isEligibleForVoting
                ? allVotes.filter(vote => vote.candidateId === user.id).length 
                : null;              return (
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
                  <td className="px-5 py-3.5 whitespace-nowrap text-text-tertiary dark:text-neutral-400 text-xs truncate max-w-[120px]" title={user.email}>{user.email || 'N/A'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-text-secondary dark:text-neutral-300 text-center">{user.antiguedad !== undefined ? user.antiguedad : 'N/A'}</td>
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
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>Editar</Button>
                    {user.curp !== SUPERADMIN_CURP && <Button variant="danger" size="sm" onClick={() => handleDeleteUser(user)}>Eliminar</Button>}
                  </td>
                </tr>
              );
            }) : (
                <tr>
                    <td colSpan={11} className="text-center py-10 text-text-secondary dark:text-neutral-400">
                        No se encontraron usuarios con los filtros actuales.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      )}
      
      {isMassVerifyModalOpen && (
        <MassEligibilityVerificationModal
            isOpen={isMassVerifyModalOpen}
            onClose={() => setIsMassVerifyModalOpen(false)}
            candidatesToVerify={candidatesNeedingVerification}
            onSaveAll={handleMassVerificationSave}
        />
      )}

      {editingUser && (
        <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`Editando: ${editingUser.nombre} ${editingUser.apellidoPaterno}`} size="2xl">
          <EditProfileForm 
            user={editingUser} 
            onSave={handleSaveUser} 
            onCancel={() => setEditingUser(null)} 
          />
        </Modal>
      )}
      {deletingUser && (
         <ConfirmationModal
            isOpen={!!deletingUser}
            onClose={() => setDeletingUser(null)}
            onConfirm={confirmDeleteUser}
            title="Confirmar Eliminación"
            message={
                <>
                    <p>¿Estás seguro de que deseas eliminar al usuario?</p>
                    <p className="font-semibold my-1">{deletingUser.nombre} {deletingUser.apellidoPaterno} ({deletingUser.curp})</p>
                    <p className="text-xs text-text-tertiary dark:text-neutral-400">Esta acción no se puede deshacer y eliminará todos los datos asociados.</p>
                </>
            }
            confirmText="Sí, Eliminar"
            confirmButtonVariant="danger"
          />
      )}
        {showMassDeleteModal && (
        <ConfirmationModal
          isOpen={showMassDeleteModal}
          onClose={() => setShowMassDeleteModal(false)}
          onConfirm={confirmMassDeleteUsers}
          title="Confirmar Eliminación Masiva"
          message={
            <>
              <p>¿Estás seguro de que deseas eliminar a los {selectedUsers.length} usuarios seleccionados?</p>
              <p className="text-xs text-text-tertiary dark:text-neutral-400">Esta acción no se puede deshacer y eliminará todos los datos asociados de los usuarios seleccionados.</p>
            </>
          }
          confirmText="Sí, Eliminar Todo"
          confirmButtonVariant="danger"
          isLoading={isDeleting}
        />
      )}
    </Card>
  );
};

interface MassVerificationUserItemProps {
  user: User;
  initialAdminVerification: EligibilityAnswers;
  initialIsEligibleForVoting: boolean;
  onChanges: (updates: { adminEligibilityVerification: EligibilityAnswers, isEligibleForVotingCheckbox: boolean }) => void;
}

const MassVerificationUserItem: React.FC<MassVerificationUserItemProps> = ({
  user,
  initialAdminVerification,
  initialIsEligibleForVoting,
  onChanges
}) => {
  const [adminVerification, setAdminVerification] = useState<EligibilityAnswers>(initialAdminVerification);
  const [isEligibleForVotingCheckbox, setIsEligibleForVotingCheckbox] = useState<boolean>(initialIsEligibleForVoting);
  const selfDeclaration = user.eligibilitySelfDeclaration || {};
  const isUserSeniorityMet = useMemo(() => user.antiguedad !== undefined && user.antiguedad >= 12, [user.antiguedad]);

  const canBeMarkedEligible = useMemo(() => {
    return isUserSeniorityMet && 
           Object.values(EligibilityCriterionKey).every(key => adminVerification[key] === true);
  }, [adminVerification, isUserSeniorityMet]);

  // Effect to adjust eligibility if criteria change
  useEffect(() => {
    if (!canBeMarkedEligible && isEligibleForVotingCheckbox) {
      setIsEligibleForVotingCheckbox(false);
      // Propagate this forced change
      onChanges({ adminEligibilityVerification: adminVerification, isEligibleForVotingCheckbox: false });
    }
  }, [canBeMarkedEligible, isEligibleForVotingCheckbox, adminVerification, onChanges]);


  const handleAdminAnswerChange = (criterion: EligibilityCriterionKey, value: boolean | null) => {
    const newAdminVerif = { ...adminVerification, [criterion]: value };
    setAdminVerification(newAdminVerif);

    const newCanBeMarkedEligible = isUserSeniorityMet && Object.values(EligibilityCriterionKey).every(key => newAdminVerif[key] === true);
    let newIsEligibleState = isEligibleForVotingCheckbox;

    if (!newCanBeMarkedEligible && newIsEligibleState) {
      newIsEligibleState = false;
      setIsEligibleForVotingCheckbox(false);
    }
    onChanges({ adminEligibilityVerification: newAdminVerif, isEligibleForVotingCheckbox: newIsEligibleState });
  };

  const handleFinalEligibilityChange = (isChecked: boolean) => {
    // This change is only possible if the checkbox is enabled (canBeMarkedEligible is true)
    if (canBeMarkedEligible) {
        setIsEligibleForVotingCheckbox(isChecked);
        onChanges({ adminEligibilityVerification: adminVerification, isEligibleForVotingCheckbox: isChecked });
    }
  };
  
  return (
    <div className="p-4 border border-border-gray/60 dark:border-neutral-600 rounded-container-second mb-4 bg-card-bg/40 dark:bg-neutral-800/30 backdrop-blur-md shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h5 className="font-semibold text-text-primary dark:text-custom-gold">{user.nombre} {user.apellidoPaterno}</h5>
          <p className="text-xs text-text-tertiary dark:text-neutral-400 font-mono">{user.curp} | {user.assignedBlock}</p>          <p className={`text-xs ${isUserSeniorityMet ? 'text-success-text dark:text-green-400' : 'text-error-text dark:text-red-400'}`}>
            Antigüedad: {user.antiguedad ?? 'N/A'} meses - {isUserSeniorityMet ? "Suficiente" : "Insuficiente (<12 meses)"}
          </p>
        </div>
      </div>

      {Object.values(EligibilityCriterionKey).map(key => {
        const questionDetail = ELIGIBILITY_QUESTIONS[key];
        const userDeclared = selfDeclaration[key];
        let userDeclaredText = 'No respondido';
        if (userDeclared === true) userDeclaredText = 'Sí';
        else if (userDeclared === false) userDeclaredText = 'No';

        return (
          <div key={key} className="py-1.5 border-t border-border-gray/40 dark:border-neutral-700/40 first:border-t-0 first:pt-0 last:pb-0">
            <p className="text-xs font-medium text-text-secondary dark:text-neutral-300">{questionDetail.question}</p>
            <p className="text-[0.65rem] text-text-tertiary dark:text-neutral-500 mb-1">Usuario declaró: <span className="font-semibold">{userDeclaredText}</span></p>
            <div className="flex items-center space-x-3 text-xs">
              <span className="text-text-primary dark:text-neutral-200">Admin:</span>
              <label className="flex items-center"><input type="radio" name={`admin_${user.id}_${key}`} checked={adminVerification[key] === true} onChange={() => handleAdminAnswerChange(key, true)} className="form-radio h-3 w-3 text-custom-pink mr-1"/> Cumple</label>
              <label className="flex items-center"><input type="radio" name={`admin_${user.id}_${key}`} checked={adminVerification[key] === false} onChange={() => handleAdminAnswerChange(key, false)} className="form-radio h-3 w-3 text-custom-pink mr-1"/> No Cumple</label>
              <label className="flex items-center"><input type="radio" name={`admin_${user.id}_${key}`} checked={adminVerification[key] === null || adminVerification[key] === undefined} onChange={() => handleAdminAnswerChange(key, null)} className="form-radio h-3 w-3 text-custom-pink mr-1"/> Pendiente</label>
            </div>
          </div>
        );
      })}
      <div className="mt-3 pt-2 border-t border-border-gray/40 dark:border-neutral-700/40">
        <label className="flex items-center">
          <input 
            type="checkbox" 
            checked={isEligibleForVotingCheckbox}
            onChange={(e) => handleFinalEligibilityChange(e.target.checked)}
            disabled={!canBeMarkedEligible}
            className="h-4 w-4 text-custom-pink border-border-gray dark:border-neutral-500 rounded focus:ring-custom-pink apple-focus-ring mr-2"
          />
          <span className={`text-sm font-medium ${!canBeMarkedEligible && isEligibleForVotingCheckbox ? 'text-error-text dark:text-red-400' : (isEligibleForVotingCheckbox ? 'text-success-text dark:text-green-300' : 'text-text-secondary dark:text-neutral-400')}`}>
            Elegible para Votación
          </span>
        </label>        {!canBeMarkedEligible && isEligibleForVotingCheckbox && (
            <p className="text-xs text-error-text dark:text-red-400 mt-1">
                No se puede marcar como elegible. Revise que la antigüedad sea &gt;= 12 meses y todas las verificaciones de admin sean "Cumple".
            </p>
        )}
         {!canBeMarkedEligible && !isEligibleForVotingCheckbox && (
            <p className="text-xs text-warning-text dark:text-orange-400 mt-1">
                No cumple requisitos para ser elegible (antigüedad y/o criterios de admin).
            </p>
        )}
      </div>
    </div>
  );
};


interface MassEligibilityVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidatesToVerify: User[];
  onSaveAll: (updatedUsersData: Array<{ userId: string, adminEligibilityVerification: EligibilityAnswers, isEligibleForVoting: boolean }>) => void;
}

const MassEligibilityVerificationModal: React.FC<MassEligibilityVerificationModalProps> = ({
  isOpen,
  onClose,
  candidatesToVerify,
  onSaveAll
}) => {
  const [pendingChanges, setPendingChanges] = useState<Record<string, { adminEligibilityVerification: EligibilityAnswers, isEligibleForVoting: boolean }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const canCandidateBeInitiallyEligible = useCallback((user: User, adminVerif: EligibilityAnswers): boolean => {
    const seniorityMet = user.antiguedad !== undefined && user.antiguedad >= 12;
    const criteriaMet = Object.values(EligibilityCriterionKey).every(key => adminVerif[key] === true);
    return seniorityMet && criteriaMet;
  }, []);


  useEffect(() => {
    if (isOpen) {
      const initialChanges: Record<string, { adminEligibilityVerification: EligibilityAnswers, isEligibleForVoting: boolean }> = {};
      candidatesToVerify.forEach(candidate => {
        const initialAdminVerif = candidate.adminEligibilityVerification || {};
        initialChanges[candidate.id] = {
          adminEligibilityVerification: initialAdminVerif,
          isEligibleForVoting: canCandidateBeInitiallyEligible(candidate, initialAdminVerif) ? !!candidate.isEligibleForVoting : false
        };
      });
      setPendingChanges(initialChanges);
    }
  }, [isOpen, candidatesToVerify, canCandidateBeInitiallyEligible]);

  const handleUserChanges = (userId: string, updates: { adminEligibilityVerification: EligibilityAnswers, isEligibleForVotingCheckbox: boolean }) => {
    setPendingChanges(prev => ({
      ...prev,
      [userId]: {
        adminEligibilityVerification: updates.adminEligibilityVerification,
        isEligibleForVoting: updates.isEligibleForVotingCheckbox // Ensure correct prop name
      }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    const changesToSave = Object.entries(pendingChanges).map(([userId, data]) => ({
        userId,
        adminEligibilityVerification: data.adminEligibilityVerification,
        isEligibleForVoting: data.isEligibleForVoting
    }));
    onSaveAll(changesToSave);
    // onClose will be called by parent after save typically
    setIsSaving(false); 
  };
  
  const totalCandidates = candidatesToVerify.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Verificación Masiva de Elegibilidad (${totalCandidates} Candidatos)`} size="2xl">
      <div className="space-y-4">
        {totalCandidates === 0 ? (
          <Alert type="info" message="No hay candidatos que requieran verificación masiva en este momento." />
        ) : (
          <div className="max-h-[65vh] overflow-y-auto pr-2 -mr-2 space-y-3">
            {candidatesToVerify.map(candidate => (
              <MassVerificationUserItem
                key={candidate.id}
                user={candidate}
                initialAdminVerification={pendingChanges[candidate.id]?.adminEligibilityVerification || candidate.adminEligibilityVerification || {}}
                initialIsEligibleForVoting={pendingChanges[candidate.id]?.isEligibleForVoting !== undefined ? pendingChanges[candidate.id].isEligibleForVoting : (canCandidateBeInitiallyEligible(candidate, candidate.adminEligibilityVerification || {}) ? !!candidate.isEligibleForVoting : false)}
                onChanges={(updates) => handleUserChanges(candidate.id, updates)}
              />
            ))}
          </div>
        )}
        {totalCandidates > 0 && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-border-gray/40 dark:border-neutral-700/40">
            <Button variant="secondary" onClick={onClose} disabled={isSaving} className="spectra-btn-secondary-enhanced">Cancelar</Button>
            <Button onClick={handleSave} isLoading={isSaving} disabled={isSaving || Object.keys(pendingChanges).length === 0} className="spectra-btn-primary-enhanced spectra-btn-cta-pulse">
                Guardar Todos los Cambios
            </Button>
            </div>
        )}
      </div>
    </Modal>
  );
};


const parseIsCandidate = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const lowerVal = value.toLowerCase().trim();
        return lowerVal === 'sí' || lowerVal === 'si' || lowerVal === 'true' || lowerVal === '1' || lowerVal === 'yes';
    }
    return false;
};

const parseRole = (value: any, curp?: string): UserRole | null => {
    if (typeof value !== 'string') return null;
    const upperVal = value.toUpperCase().trim();
    if (upperVal === UserRole.SUPERADMIN && curp !== SUPERADMIN_CURP) {
        return null; // Prevent assigning SUPERADMIN to non-SUPERADMIN_CURP
    }
    if (ALL_USER_ROLES.includes(upperVal as UserRole)) {
        return upperVal as UserRole;
    }
    return null;
};

const parseSex = (value: any): UserSex | null => {
    if (typeof value !== 'string') return null;
    const trimmedVal = value.trim();
    const foundSex = ALL_USER_SEX.find(s => s.toLowerCase() === trimmedVal.toLowerCase());
    return foundSex || null;
};

const parseEducationalLevel = (value: any): { level: EducationalLevel, warning?: string } => {
    if (typeof value !== 'string' || !value.trim()) {
        return { level: EducationalLevel.BASICA, warning: "Nivel educativo no proporcionado, se usó 'Educación Básica' por defecto." };
    }
    const trimmedVal = value.trim().toLowerCase();
    
    if (trimmedVal === EducationalLevel.BASICA.toLowerCase() || trimmedVal === "basica" || trimmedVal === "básica") {
        return { level: EducationalLevel.BASICA };
    }
    if (trimmedVal === EducationalLevel.MEDIA_SUPERIOR.toLowerCase() || trimmedVal === "media superior" || trimmedVal === "media") {
        return { level: EducationalLevel.MEDIA_SUPERIOR };
    }

    return { 
        level: EducationalLevel.BASICA, 
        warning: `Nivel educativo '${value}' no reconocido. Se usó '${EducationalLevel.BASICA}' por defecto. Valores válidos: ${ALL_EDUCATIONAL_LEVELS.join(', ')}.`
    };
};


const parseBlock = (value: any): CandidateBlock | null => {
    if (typeof value !== 'string') return null;
    const trimmedVal = value.trim();
    if (ALL_CANDIDATE_BLOCKS.includes(trimmedVal as CandidateBlock)) { 
        return trimmedVal as CandidateBlock;
    }
    const blockPrefixMatch = trimmedVal.match(/^B[1-5]/i);
    if (blockPrefixMatch) {
        const foundBlock = ALL_CANDIDATE_BLOCKS.find(b => b.startsWith(blockPrefixMatch[0].toUpperCase()));
        if (foundBlock) return foundBlock;
    }
    return null;
};

const parseAreaDepartamentoDireccion = (value: any): AreaDepartamentoDireccion | null => {
    if (typeof value !== 'string') return null;
    const trimmedVal = value.trim();
    if (ALL_AREA_DEPARTAMENTO_DIRECCION.includes(trimmedVal as AreaDepartamentoDireccion)) {
        return trimmedVal as AreaDepartamentoDireccion;
    }
    const keyMatch = Object.keys(AreaDepartamentoDireccion).find(
        key => key === trimmedVal.toUpperCase()
    ) as keyof typeof AreaDepartamentoDireccion | undefined;

    if (keyMatch && AreaDepartamentoDireccion[keyMatch]) {
       return AreaDepartamentoDireccion[keyMatch];
    }
    
    const lowerTrimmedVal = trimmedVal.toLowerCase();
    for (const area of ALL_AREA_DEPARTAMENTO_DIRECCION) {
        if (area.toLowerCase().includes(lowerTrimmedVal)) return area;
    }
    return AreaDepartamentoDireccion.NO_ESPECIFICADO; 
};


interface ImportResult {
  successCount: number;
  errorCount: number;
  errors: { rowIndex: number; curp?: string; message: string }[];
}

interface NewUserFormData {
  curp: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  email: string; 
  sexo: UserSex;
  antiguedad: string; 
  educationalLevel: EducationalLevel; 
  areaDepartamentoDireccion: AreaDepartamentoDireccion;
  puesto: string;
  role: UserRole;
  assignedBlock: CandidateBlock;  // New fields for manual registration
  celular?: string;
  telefonoExtension?: string;
  consideracionesParticulares?: string;
  doctoradoTitulo?: string;
  maestriaTitulo?: string;
  licenciaturaTitulo?: string;
  diplomadoTitulo?: string;
  claveCentroTrabajo?: string;
  nombreCentroTrabajo?: string;
  entidadCentroTrabajo?: string;
  municipioCentroTrabajo?: string;
  tipoCentroTrabajo?: string;
  turnoCentroTrabajo?: string;
}

interface WhitelistManagementProps {
  onUsersUpdated: () => void; 
}

export const WhitelistManagement: React.FC<WhitelistManagementProps> = ({ onUsersUpdated }) => {
  const { success, error: showError } = useToast();
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newCurpInput, setNewCurpInput] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerModalError, setRegisterModalError] = useState('');
  const [newUserFormData, setNewUserFormData] = useState<NewUserFormData>({
    curp: '',
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '', 
    sexo: UserSex.MASCULINO, 
    antiguedad: '',
    educationalLevel: EducationalLevel.BASICA, 
    areaDepartamentoDireccion: ALL_AREA_DEPARTAMENTO_DIRECCION[0], 
    puesto: '',
    role: UserRole.USER,
    assignedBlock: ALL_CANDIDATE_BLOCKS[0],    // Initialize new fields for modal
    celular: '',
    telefonoExtension: '',
    consideracionesParticulares: '',
    doctoradoTitulo: '',
    maestriaTitulo: '',
    licenciaturaTitulo: '',
    diplomadoTitulo: '',
    claveCentroTrabajo: '',
    nombreCentroTrabajo: '',
    entidadCentroTrabajo: '',
    municipioCentroTrabajo: '',
    tipoCentroTrabajo: '',
    turnoCentroTrabajo: '',  });
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);
    const fetchWhitelist = useCallback(async () => {
    const whitelist = await getWhitelist();
    setWhitelist(whitelist.sort());
  }, []);
  useEffect(() => {
    fetchWhitelist();
  }, [fetchWhitelist]);  const handleVerifyOrRegisterCurp = async () => {
    setRegisterModalError('');
    const trimmedCurp = newCurpInput.trim().toUpperCase();

    if (!trimmedCurp) {
      showError('El CURP no puede estar vacío.');
      return;
    }
    if (!CURP_REGEX.test(trimmedCurp)) {
      showError('Formato de CURP inválido.');
      return;
    }
    if (trimmedCurp === SUPERADMIN_CURP) {
        showError('El CURP del superadministrador principal ya está gestionado.');
        return;
    }    const existingUser = await getUserByCurp(trimmedCurp);
    const curpIsWhitelisted = await isWhitelisted(trimmedCurp);    if (existingUser) {
      if (!curpIsWhitelisted) {
        try {
          await addToWhitelist(trimmedCurp);
          success(`Usuario existente ${existingUser.nombre} (${trimmedCurp}) agregado a la lista blanca.`);
          await fetchWhitelist();
          onUsersUpdated();
        } catch (error) {
          console.error('Error al agregar a lista blanca:', error);
          showError(`Error al agregar a la lista blanca: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        success(`Usuario ${existingUser.nombre} (${trimmedCurp}) ya existe y está en la lista blanca.`);
      }
      setNewCurpInput('');
    } else {
      const derivedBirthDate = extractDateOfBirthFromCURP(trimmedCurp);
      if (!derivedBirthDate) {
        showError(`CURP (${trimmedCurp}) inválido para extraer fecha de nacimiento. No se puede registrar.`);
        return;
      }
      // Reset all fields in newUserFormData when opening modal for a new CURP
      setNewUserFormData({ 
        curp: trimmedCurp,
        nombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        email: '', 
        sexo: UserSex.MASCULINO,
        antiguedad: '',
        educationalLevel: EducationalLevel.BASICA,
        areaDepartamentoDireccion: ALL_AREA_DEPARTAMENTO_DIRECCION[0], 
        puesto: '',
        role: UserRole.USER, // Default to USER, SUPERADMIN not an option here
        assignedBlock: ALL_CANDIDATE_BLOCKS[0], 
        celular: '',
        telefonoExtension: '',
        consideracionesParticulares: '',
        doctoradoTitulo: '',
        maestriaTitulo: '',
        licenciaturaTitulo: '',
        diplomadoTitulo: '',        claveCentroTrabajo: '',
        nombreCentroTrabajo: '',
        entidadCentroTrabajo: '',
        municipioCentroTrabajo: '',
        tipoCentroTrabajo: '',
        turnoCentroTrabajo: '',
      });      setIsRegisterModalOpen(true);
      setNewCurpInput(''); 
    }
  };
  
  const handleNewUserFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewUserFormData(prev => ({ ...prev, [name]: value }));
    setRegisterModalError('');
  };
  const handleRegisterNewUser = async () => {
    setRegisterModalError('');
    setIsRegisteringUser(true);

    if (newUserFormData.role === UserRole.SUPERADMIN) {
        setRegisterModalError('No se puede registrar un nuevo SUPERADMIN a través de este formulario.');
        setIsRegisteringUser(false); return;
    }
    if (!newUserFormData.nombre.trim()) {
        setRegisterModalError('El nombre es obligatorio.');
        setIsRegisteringUser(false); return;
    }
    if (!newUserFormData.apellidoPaterno.trim()) {
        setRegisterModalError('El apellido paterno es obligatorio.');
        setIsRegisteringUser(false); return;
    }
    if (!newUserFormData.email.trim()) {
        setRegisterModalError('El correo electrónico es obligatorio.');
        setIsRegisteringUser(false); return;
    }
    if (!EMAIL_REGEX.test(newUserFormData.email.trim())) {
        setRegisterModalError('Formato de correo electrónico inválido.');
        setIsRegisteringUser(false); return;
    }
     if (!newUserFormData.sexo) { 
        setRegisterModalError('El sexo es obligatorio.');
        setIsRegisteringUser(false); return;
    }
    if (!newUserFormData.puesto.trim()) {
        setRegisterModalError('El puesto es obligatorio.');
        setIsRegisteringUser(false); return;
    }
    if (!newUserFormData.educationalLevel || !ALL_EDUCATIONAL_LEVELS.includes(newUserFormData.educationalLevel)) {
        setRegisterModalError('El nivel educativo es obligatorio y debe ser uno de los valores permitidos.');
        setIsRegisteringUser(false); return;
    }

    const derivedBirthDate = extractDateOfBirthFromCURP(newUserFormData.curp);
    if (!derivedBirthDate) {
        setRegisterModalError(`CURP (${newUserFormData.curp}) inválido para extraer fecha de nacimiento. Verifica el CURP.`);
        setIsRegisteringUser(false); return;
    }
    
    let antiguedadValue: number | undefined = undefined;
    if (newUserFormData.antiguedad.trim() !== '') {
        const parsedAntiguedad = parseInt(newUserFormData.antiguedad, 10);
        if (isNaN(parsedAntiguedad) || parsedAntiguedad < 0) {
            setRegisterModalError('Antigüedad debe ser un número no negativo si se proporciona.');
            setIsRegisteringUser(false); return;
        }
        antiguedadValue = parsedAntiguedad;
    }    if (newUserFormData.role === UserRole.CANDIDATE && newUserFormData.curp !== SUPERADMIN_CURP && (antiguedadValue === undefined || antiguedadValue < 12)) {
        setRegisterModalError('Antigüedad de al menos 12 meses es obligatoria para registrar un usuario como candidato.');
        setIsRegisteringUser(false); return;
    }
    
     const userToAddPayload: Parameters<typeof addUserService>[0] = {
        curp: newUserFormData.curp,
        nombre: newUserFormData.nombre,
        apellidoPaterno: newUserFormData.apellidoPaterno,
        apellidoMaterno: newUserFormData.apellidoMaterno,
        email: newUserFormData.email.trim(), 
        sexo: newUserFormData.sexo,
        antiguedad: antiguedadValue,
        educationalLevel: newUserFormData.educationalLevel,
        fechaNacimiento: derivedBirthDate, 
        password: "", // New users are created without a password; they must register
        role: newUserFormData.role,
        assignedBlock: newUserFormData.assignedBlock,
        areaDepartamentoDireccion: newUserFormData.areaDepartamentoDireccion,
        puesto: newUserFormData.puesto.trim(),
        isRegisteredAsCandidate: newUserFormData.role === UserRole.CANDIDATE,
        // Pass new optional fields from form
        celular: newUserFormData.celular?.trim() || undefined,
        telefonoExtension: newUserFormData.telefonoExtension?.trim() || undefined,
        consideracionesParticulares: newUserFormData.consideracionesParticulares?.trim() || undefined,
        doctoradoTitulo: newUserFormData.doctoradoTitulo?.trim() || undefined,
        maestriaTitulo: newUserFormData.maestriaTitulo?.trim() || undefined,
        licenciaturaTitulo: newUserFormData.licenciaturaTitulo?.trim() || undefined,
        diplomadoTitulo: newUserFormData.diplomadoTitulo?.trim() || undefined,        claveCentroTrabajo: newUserFormData.claveCentroTrabajo?.trim() || undefined,
        nombreCentroTrabajo: newUserFormData.nombreCentroTrabajo?.trim() || undefined,
        entidadCentroTrabajo: newUserFormData.entidadCentroTrabajo?.trim() || undefined,
        municipioCentroTrabajo: newUserFormData.municipioCentroTrabajo?.trim() || undefined,
        tipoCentroTrabajo: newUserFormData.tipoCentroTrabajo?.trim() || undefined,
        turnoCentroTrabajo: newUserFormData.turnoCentroTrabajo?.trim() || undefined,};    try {
        await addUserService(userToAddPayload);
        try {
          await addToWhitelist(newUserFormData.curp);
        } catch (whitelistError) {
          console.error('Error al añadir a lista blanca:', whitelistError);
          setRegisterModalError(`Usuario registrado, pero error al añadir a lista blanca: ${whitelistError instanceof Error ? whitelistError.message : String(whitelistError)}`);
          setIsRegisteringUser(false);
          return;        }
        success(`Usuario ${newUserFormData.nombre} (${newUserFormData.curp}) registrado y agregado a la lista blanca.`);
        setIsRegisterModalOpen(false);
        await fetchWhitelist();
        onUsersUpdated(); 
    } catch (e: any) {
        setRegisterModalError(`Error al registrar usuario: ${e.message}`);
    } finally {
        setIsRegisteringUser(false);
    }
  };  const handleRemoveCurp = async (curpToRemove: string) => {
    if (curpToRemove === SUPERADMIN_CURP) {
        showError("No se puede eliminar el CURP del superadministrador principal de la lista blanca.");
        return;
    }
    await removeFromWhitelist(curpToRemove);
    success(`CURP ${curpToRemove} eliminado de la lista blanca.`);
    await fetchWhitelist(); 
  };
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportResult(null);
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };
  const handleDownloadTemplate = () => {
    if (!window.XLSX) {
        showError("La librería de Excel (XLSX) no está cargada. Intenta refrescar la página.");
        return;
    }
    const headers = [[
        "Nombre (Obligatorio)", "Apellido Paterno (Obligatorio)", "Apellido Materno (Opcional)", "CURP (Obligatorio)", "Email (Obligatorio)",        
        "Sexo (Obligatorio, Masculino/Femenino)", "Nivel Educativo (Obligatorio: Educación Básica / Educación Media Superior)", 
        "Antigüedad (Meses, Opcional, min 12 meses si 'Candidato' es Sí)", 
        "Fecha de Nacimiento (Opcional, YYYY-MM-DD)", "Área/Depto./Dir. General (Obligatorio)", "Puesto (Obligatorio)",
        "Rol (Opcional, defecto: USER)", "Bloque (Votación) (Obligatorio)", "Candidato (Sí/No, opcional, defecto: No)",        // New optional columns
        "Celular (Opcional)", "Teléfono - Extensión (Opcional)", "Consideraciones Particulares (Opcional)",
        "Doctorado (Título, Opcional)", "Maestría (Título, Opcional)", "Licenciatura (Título, Opcional)", "Diplomado (Título, Opcional)",
        "Empresa/Organización (Opcional)", "Sector/Industria (Opcional)", "Estado (Opcional)",
        "Ciudad/Municipio (Opcional)", "Modalidad Trabajo (Opcional)", "Código Centro Trabajo (Opcional)"
    ]];
    const ws = window.XLSX.utils.aoa_to_sheet(headers);
    ws['!cols'] = [ 
        { wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 25 }, { wch: 30 }, 
        { wch: 40 }, { wch: 60 }, { wch: 60 }, { wch: 35 }, { wch: 40 }, 
        { wch: 30 }, { wch: 30 }, { wch: 35 }, { wch: 40 },
        { wch: 25 }, { wch: 30 }, { wch: 35 }, { wch: 30 }, { wch: 30 }, 
        { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 },
        { wch: 30 }, { wch: 30 }, { wch: 40 }, { wch: 40 },
        { wch: 35 }, { wch: 30 }
    ];
    
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Plantilla Usuarios");

    // Create Catalogs Sheet
    const catalogSheetData: (string | null)[][] = [];
    const addCatalogSection = (title: string, values: readonly string[]) => {
        catalogSheetData.push([title]);
        values.forEach(val => catalogSheetData.push([val]));
        catalogSheetData.push([]); // Empty row for spacing
    };

    addCatalogSection("Sexo (Valores Permitidos para Columna 'Sexo (Obligatorio, Masculino/Femenino)')", ALL_USER_SEX);
    addCatalogSection("Nivel Educativo (Valores Permitidos para Columna 'Nivel Educativo (Obligatorio: Educación Básica / Educación Media Superior)')", ALL_EDUCATIONAL_LEVELS);
    addCatalogSection("Área/Departamento/Dirección General (Valores Permitidos para Columna 'Área/Depto./Dir. General (Obligatorio)')", ALL_AREA_DEPARTAMENTO_DIRECCION);
    addCatalogSection("Rol (Valores Permitidos para Columna 'Rol (Opcional, defecto: USER)')", ALL_USER_ROLES.filter(role => role !== UserRole.SUPERADMIN));
    addCatalogSection("Bloque (Votación) (Valores Permitidos para Columna 'Bloque (Votación) (Obligatorio)')", ALL_CANDIDATE_BLOCKS);
    
    const wsCatalog = window.XLSX.utils.aoa_to_sheet(catalogSheetData);
    wsCatalog['!cols'] = [ { wch: 100 } ]; // Single wide column for catalog values
    window.XLSX.utils.book_append_sheet(wb, wsCatalog, "Catálogos");    window.XLSX.writeFile(wb, "plantilla_importacion_usuarios.xlsx");
    success("Plantilla descargada.");
  };
  const handleImportExcel = async () => {
    if (!selectedFile) {
      showError("Por favor, selecciona un archivo Excel para importar.");
      return;
    }
    if (!window.XLSX) {
        showError("La librería de Excel (XLSX) no está cargada. Intenta refrescar la página.");
        return;
    }

    setIsImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      let jsonData: any[] | null = null; 
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No se pudo leer el archivo.");
        
        const workbook = window.XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        jsonData = window.XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null });

        const results: ImportResult = { successCount: 0, errorCount: 0, errors: [] };
        
        const excelHeaders = (window.XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[] || []).map(h => h?.toString().trim().toLowerCase());
        
        // Updated required headers to match the template's "Obligatorio" fields
        const requiredHeadersBase = [
            "nombre (obligatorio)", "apellido paterno (obligatorio)", "curp (obligatorio)", "email (obligatorio)",
            "sexo (obligatorio, masculino/femenino)", "nivel educativo (obligatorio: educación básica / educación media superior)",
            "área/depto./dir. general (obligatorio)", "puesto (obligatorio)", "bloque (votación) (obligatorio)"
        ];
        
        for (const header of requiredHeadersBase) {
            if (!excelHeaders.includes(header)) {
                results.errors.push({ rowIndex: 0, message: `Falta la columna requerida: ${header}` });
            }
        }
        if (results.errors.length > 0) {
            setImportResult(results); setIsImporting(false); return;
        }

        if (!jsonData) throw new Error("No se pudieron extraer datos JSON de la hoja de cálculo.");

        for (let i = 0; i < jsonData.length; i++) {
          const row: any = jsonData[i];
          const rowIndexExcel = i + 2; 

          const getVal = (key: string, isOptional: boolean = false) => {
            const headerKey = Object.keys(row).find(k => k.toLowerCase().startsWith(key.toLowerCase()));
            const value = headerKey ? row[headerKey] : null;
            if (value === null || value === undefined) return isOptional ? undefined : '';
            return value.toString().trim();
          };

          const nombre = getVal("nombre (obligatorio)");
          const apellidoPaterno = getVal("apellido paterno (obligatorio)");
          const apellidoMaterno = getVal("apellido materno (opcional)", true); 

          if (!nombre) { results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp: getVal("curp") || "N/A", message: "Columna 'Nombre (Obligatorio)' faltante o vacía." }); continue; }
          if (!apellidoPaterno) { results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp: getVal("curp") || "N/A", message: "Columna 'Apellido Paterno (Obligatorio)' faltante o vacía." }); continue; }

          const curp = getVal("curp (obligatorio)").toUpperCase();
          if (!curp || !CURP_REGEX.test(curp)) { results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp: curp || "N/A", message: "CURP (Obligatorio) inválido o faltante." }); continue; }
          
          const emailFromExcel = getVal("email (obligatorio)").toLowerCase(); 
          if (!emailFromExcel || !EMAIL_REGEX.test(emailFromExcel)) {
             results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp, message: `Email (Obligatorio) faltante o inválido: '${emailFromExcel}'.` }); continue;
          }
          
          const sexoInput = getVal("sexo (obligatorio, masculino/femenino)");
          const sexo = parseSex(sexoInput);
          if (!sexo) { results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp, message: `Sexo (Obligatorio, Masculino/Femenino) faltante o inválido: '${sexoInput}'.` }); continue; }

          const educationalLevelInput = getVal("nivel educativo (obligatorio", false); // isOptional = false
          if (!educationalLevelInput) {
             results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp, message: "Columna 'Nivel Educativo (Obligatorio)' faltante o vacía." }); continue;
          }
          const parsedEdu = parseEducationalLevel(educationalLevelInput);
          const educationalLevel = parsedEdu.level;
          if (parsedEdu.warning) { // Log warning but proceed with default
              results.errors.push({ rowIndex: rowIndexExcel, curp, message: parsedEdu.warning });
          }       
          
          const antiguedadInput = getVal("antigüedad (meses, opcional, min 12 meses si 'candidato' es sí)", true);
          let antiguedad: number | undefined = undefined;
          if (antiguedadInput) {
              const parsedAntiguedad = parseInt(antiguedadInput, 10);
              if (isNaN(parsedAntiguedad) || parsedAntiguedad < 0) { 
                  results.errors.push({ rowIndex: rowIndexExcel, curp, message: `Antigüedad inválida: '${antiguedadInput}'. Debe ser un número no negativo.` });
              } else {
                  antiguedad = parsedAntiguedad;
              }
          }

          let fechaNacimiento: string | null = null;
          const dobFromExcelRaw = getVal("fecha de nacimiento (opcional, yyyy-mm-dd)", true);
          let dobDateObj: Date | null = null;
          
          const dobHeaderKey = Object.keys(row).find(k => k.toLowerCase().startsWith("fecha de nacimiento"));
          if (dobHeaderKey && row[dobHeaderKey] instanceof Date) {
             dobDateObj = row[dobHeaderKey];
          }

          if (dobDateObj) {
              const year = dobDateObj.getFullYear();
              const month = (dobDateObj.getMonth() + 1).toString().padStart(2, '0');
              const day = dobDateObj.getDate().toString().padStart(2, '0');
              fechaNacimiento = `${year}-${month}-${day}`;
          } else if (typeof dobFromExcelRaw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dobFromExcelRaw)) {
              fechaNacimiento = dobFromExcelRaw;
          }
          
          if (!fechaNacimiento) { 
              fechaNacimiento = extractDateOfBirthFromCURP(curp);
              if (!fechaNacimiento) { results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp, message: "Fecha de Nacimiento faltante/inválida y no se pudo derivar del CURP." }); continue; }
          }
          
          const areaDepartamentoDireccionInput = getVal("área/depto./dir. general (obligatorio)", false);
          if (!areaDepartamentoDireccionInput) {
            results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp, message: "Columna 'Área/Depto./Dir. General (Obligatorio)' faltante o vacía." }); continue;
          }
          const areaDepartamentoDireccion = parseAreaDepartamentoDireccion(areaDepartamentoDireccionInput);
          if (!areaDepartamentoDireccion || (areaDepartamentoDireccion === AreaDepartamentoDireccion.NO_ESPECIFICADO && areaDepartamentoDireccionInput.trim() !== "" && areaDepartamentoDireccionInput.toLowerCase() !== "no especificado")) {
            results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp, message: `Área/Depto./Dir. General (Obligatorio) inválida: ${areaDepartamentoDireccionInput}.` }); continue;
          }

          const puesto = getVal("puesto (obligatorio)");
          if (!puesto) { results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp, message: "Columna 'Puesto (Obligatorio)' faltante o vacía." }); continue; }

          const roleInput = getVal("rol (opcional, defecto: user)", true);
          let role = parseRole(roleInput, curp); // Pass curp to parseRole for SUPERADMIN check
          if (!roleInput) { 
              role = UserRole.USER; 
          } else if (!role) { 
              results.errors.push({ rowIndex: rowIndexExcel, curp, message: `Rol inválido: '${roleInput}'. No se puede asignar SUPERADMIN. Se usará USER por defecto.` });
              role = UserRole.USER; 
          }
          // Ensure SUPERADMIN_CURP always has SUPERADMIN role, others cannot be SUPERADMIN via import
          if (curp === SUPERADMIN_CURP) {
              role = UserRole.SUPERADMIN;
          } else if (role === UserRole.SUPERADMIN) {
              results.errors.push({ rowIndex: rowIndexExcel, curp, message: `Rol SUPERADMIN no permitido para CURP ${curp}. Se asignará USER.` });
              role = UserRole.USER;
          }


          const assignedBlockInput = getVal("bloque (votación) (obligatorio)", false);
          if (!assignedBlockInput) {
            results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp, message: "Columna 'Bloque (Votación) (Obligatorio)' faltante o vacía." }); continue;
          }
          const assignedBlock = parseBlock(assignedBlockInput);
          if (!assignedBlock) { results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp, message: `Bloque (Votación) (Obligatorio) inválido: ${assignedBlockInput}. Bloques válidos: ${ALL_CANDIDATE_BLOCKS.join(', ')}.` }); continue;
          }

          const candidateInput = getVal("candidato (sí/no, opcional, defecto: no)", true);
          let isRegisteredAsCandidate: boolean;
           if (role === UserRole.CANDIDATE) {
              isRegisteredAsCandidate = true;
          } else if (candidateInput) {
              isRegisteredAsCandidate = parseIsCandidate(candidateInput);
              if (isRegisteredAsCandidate && role === UserRole.USER) {
                  role = UserRole.CANDIDATE; 
              }
          } else {
              isRegisteredAsCandidate = false;
          }
          if (role === UserRole.SUPERADMIN) { // Superadmin cannot be a candidate
              isRegisteredAsCandidate = false;
          }            if (isRegisteredAsCandidate && curp !== SUPERADMIN_CURP && (antiguedad === undefined || antiguedad < 12) ) {
            results.errorCount++; results.errors.push({ rowIndex: rowIndexExcel, curp, message: "Antigüedad (min. 12 meses, obligatoria para candidatos) faltante o inválida." }); continue;          }
          
          try {
            await addToWhitelist(curp);
          } catch (whitelistError) {
            console.error(`Error al añadir CURP ${curp} a lista blanca:`, whitelistError);
            results.errorCount++;
            results.errors.push({ 
              rowIndex: rowIndexExcel, 
              curp, 
              message: `Error al añadir a lista blanca: ${whitelistError instanceof Error ? whitelistError.message : String(whitelistError)}` 
            });
            continue;
          }

          const existingUser = await getUserByCurp(curp);
          const commonUserData = {
            nombre, apellidoPaterno, apellidoMaterno, email: emailFromExcel, sexo, educationalLevel, antiguedad,
            fechaNacimiento, areaDepartamentoDireccion, puesto,
            role: role, // Use the validated/corrected role
            assignedBlock: (curp === SUPERADMIN_CURP && existingUser) ? existingUser.assignedBlock : assignedBlock,
            isRegisteredAsCandidate: (curp === SUPERADMIN_CURP) ? false : isRegisteredAsCandidate,
            celular: getVal("celular (opcional)", true) || undefined,
            telefonoExtension: getVal("teléfono - extensión (opcional)", true) || undefined,
            consideracionesParticulares: getVal("consideraciones particulares (opcional)", true) || undefined,
            doctoradoTitulo: getVal("doctorado (título, opcional)", true) || undefined,
            maestriaTitulo: getVal("maestría (título, opcional)", true) || undefined,
            licenciaturaTitulo: getVal("licenciatura (título, opcional)", true) || undefined,
            diplomadoTitulo: getVal("diplomado (título, opcional)", true) || undefined,            claveCentroTrabajo: getVal("código centro trabajo (opcional)", true) || undefined,
            nombreCentroTrabajo: getVal("empresa/organización (opcional)", true) || undefined,
            entidadCentroTrabajo: getVal("estado (opcional)", true) || undefined,
            municipioCentroTrabajo: getVal("ciudad/municipio (opcional)", true) || undefined,
            tipoCentroTrabajo: getVal("sector/industria (opcional)", true) || undefined,
            turnoCentroTrabajo: getVal("modalidad trabajo (opcional)", true) || undefined,
          };

          if (existingUser) {
            const updatedUser: User = {
              ...existingUser, 
              ...commonUserData,
              eligibilitySelfDeclaration: isRegisteredAsCandidate ? existingUser.eligibilitySelfDeclaration : {},
              adminEligibilityVerification: {}, 
              isEligibleForVoting: false, 
              peerNominations: isRegisteredAsCandidate !== existingUser.isRegisteredAsCandidate ? [] : existingUser.peerNominations,
              hasPendingPeerNominationDecision: isRegisteredAsCandidate !== existingUser.isRegisteredAsCandidate ? false : existingUser.hasPendingPeerNominationDecision,
            };            if (curp === SUPERADMIN_CURP) { // Ensure SUPERADMIN_CURP keeps its role
                updatedUser.role = UserRole.SUPERADMIN;
                updatedUser.isRegisteredAsCandidate = false;
            }
            await updateUser(updatedUser);
          } else {
            await addUserService({
              curp, 
              ...commonUserData,
              password: "", // New users are created without a password; they must register
            });
          }
          results.successCount++;        }
        setImportResult(results); 
        await fetchWhitelist();
        if (results.successCount > 0) {
            onUsersUpdated();        }
      } catch (err: any) {
        console.error("Error importing Excel:", err);
        showError(`Error al procesar el archivo: ${err.message}`);
        setImportResult({ successCount: 0, errorCount: jsonData?.length || 0, errors: [{rowIndex: 0, message: `Error general: ${err.message}`}] });
      } finally {
        setIsImporting(false); if(fileInputRef.current) fileInputRef.current.value = ""; setSelectedFile(null);
      }
    };
    reader.onerror = () => { showError("No se pudo leer el archivo seleccionado."); setIsImporting(false); };
    reader.readAsArrayBuffer(selectedFile);
  };
  
  const areaOptions = ALL_AREA_DEPARTAMENTO_DIRECCION.map(area => ({ value: area, label: area }));
  const sexOptions = ALL_USER_SEX.map(s => ({ value: s, label: s }));
  const educationalLevelOptions = ALL_EDUCATIONAL_LEVELS.map(level => ({value: level, label: level}));
  const roleOptionsForManualRegister = ALL_USER_ROLES
    .filter(role => role !== UserRole.SUPERADMIN)
    .map(role => ({ value: role, label: role }));

  return (
    <Card title="Lista Blanca y Carga de Usuarios" padding="none">
      <div className="p-5 space-y-5">
        <div className="p-4 border border-border-gray/70 dark:border-neutral-700/50 rounded-container-third bg-gray-50/50 dark:bg-neutral-700/30">
            <h4 className="text-md font-semibold text-text-primary dark:text-custom-gold mb-1.5">Importar Usuarios desde Excel</h4>
            
            <div className="text-xs text-text-secondary dark:text-neutral-400 mb-3 space-y-1.5">
                <p>Para cargar o actualizar usuarios de forma masiva, usa un archivo Excel (.xlsx o .xls). Descarga la plantilla para asegurar el formato correcto.</p>
                <p>La plantilla ahora incluye una segunda pestaña llamada "Catálogos" con los valores válidos para campos como Sexo, Nivel Educativo, Área, Rol y Bloque. El rol "SUPERADMIN" no está disponible en el catálogo de la plantilla y no puede ser asignado mediante este método.</p>
                <h5 className="font-medium text-text-primary dark:text-neutral-200 pt-1">Instrucciones y Columnas de la Plantilla ("Plantilla Usuarios"):</h5>
                <ul className="list-disc list-inside pl-4 space-y-0.5">
                    <li><strong>Nombre (Obligatorio)</strong></li>
                    <li><strong>Apellido Paterno (Obligatorio)</strong></li>
                    <li>Apellido Materno (Opcional)</li>
                    <li><strong>CURP (Obligatorio):</strong> Formato CURP estándar de 18 caracteres.</li>
                    <li><strong>Email (Obligatorio):</strong> Formato de correo electrónico válido.</li>
                    <li><strong>Sexo (Obligatorio):</strong> Escribir "Masculino" o "Femenino". (Ver pestaña "Catálogos")</li>
                    <li><strong>Nivel Educativo (Obligatorio):</strong> Escribir "Educación Básica" o "Educación Media Superior". (Ver pestaña "Catálogos")</li>
                    <li>Antigüedad (Meses, Opcional): Número de meses. Obligatorio (mínimo 12) si 'Candidato' es 'Sí'.</li>
                    <li>Fecha de Nacimiento (Opcional): Formato AAAA-MM-DD. Si se omite o es inválida, se intentará derivar del CURP.</li>
                    <li><strong>Área/Depto./Dir. General (Obligatorio):</strong> Nombre completo del área. (Ver pestaña "Catálogos")</li>
                    <li><strong>Puesto (Obligatorio)</strong></li>
                    <li>Rol (Opcional): Escribir "USER" o "CANDIDATE". Por defecto es "USER". (Ver pestaña "Catálogos")</li>
                    <li><strong>Bloque (Votación) (Obligatorio):</strong> Formato "B# - Nombre del Bloque". (Ver pestaña "Catálogos")</li>
                    <li>Candidato (Sí/No, opcional): Escribir "Sí" o "No". Por defecto es "No". Si es "Sí", el rol se establecerá como "CANDIDATE" y se requiere antigüedad.</li>
                    <li>Celular (Opcional)</li>
                    <li>Teléfono - Extensión (Opcional)</li>
                    <li>Consideraciones Particulares (Opcional)</li>
                    <li>Doctorado (Título, Opcional)</li>
                    <li>Maestría (Título, Opcional)</li>
                    <li>Licenciatura (Título, Opcional)</li>
                    <li>Diplomado (Título, Opcional)</li>                    <li>Empresa/Organización (Opcional)</li>
                    <li>Sector/Industria (Opcional)</li>
                    <li>Estado (Opcional)</li>
                    <li>Ciudad/Municipio (Opcional)</li>
                    <li>Modalidad Trabajo (Opcional)</li>
                    <li>Código Centro Trabajo (Opcional)</li>
                </ul>
                <h5 className="font-medium text-text-primary dark:text-neutral-200 pt-2">Proceso de Importación:</h5>
                 <ul className="list-disc list-inside pl-4 space-y-0.5">
                    <li>Los CURPs en el archivo que no existan en el sistema serán creados como nuevos usuarios y sus CURPs se agregarán automáticamente a la lista blanca.</li>
                    <li>Los CURPs que ya existan en el sistema serán actualizados con la información proporcionada en el archivo Excel.</li>
                    <li>Los nuevos usuarios creados por este medio no tendrán una contraseña establecida. Deberán completar el proceso de registro individualmente usando la opción "Registrarse" en la página de inicio de sesión para verificar su CURP y crear su contraseña.</li>
                    <li>Cualquier error encontrado durante la importación (por fila) será reportado al finalizar el proceso.</li>
                </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} id="excel-upload"/>
                <label 
                    htmlFor="excel-upload"
                    className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1.5 text-sm h-8 border border-border-gray dark:border-neutral-600 shadow-apple-sm font-medium rounded-container-third text-text-primary dark:text-neutral-100 bg-card-bg dark:bg-neutral-700 hover:bg-gray-50/80 dark:hover:bg-neutral-600 cursor-pointer whitespace-nowrap"
                    role="button" tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();}}
                >
                    {selectedFile ? selectedFile.name : "Seleccionar archivo..."}
                </label>
                <Button onClick={handleImportExcel} disabled={!selectedFile || isImporting} isLoading={isImporting} size="sm" className="w-full sm:w-auto">
                    {isImporting ? "Importando..." : "Importar"}
                </Button>
                <Button onClick={handleDownloadTemplate} variant="secondary" size="sm" className="w-full sm:w-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1.5">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 10-1.09-1.03L10.75 11.364V2.75z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                    Descargar Plantilla
                </Button>
            </div>
            {importResult && (
            <div className="mt-3 text-xs">
                <Alert 
                type={importResult.errorCount > 0 ? (importResult.successCount > 0 ? 'warning' : 'error') : 'success'}
                title="Resultado de Importación"
                message={
                    <>
                    <p>{importResult.successCount} usuarios procesados, {importResult.errorCount} errores.</p>
                    {importResult.errors.length > 0 && (
                        <ul className="list-disc list-inside mt-1.5 max-h-28 overflow-y-auto text-[0.7rem] font-mono text-text-secondary dark:text-neutral-300">
                        {importResult.errors.map((err, idx) => (
                            <li key={idx}>Fila {err.rowIndex} (CURP: {err.curp || 'N/A'}): {err.message}</li>
                        ))}
                        </ul>
                    )}
                    </>
                }
                onClose={() => setImportResult(null)}
                />
            </div>
            )}
        </div>
        
        <div>
            <h4 className="text-md font-semibold text-text-primary dark:text-custom-gold mb-1.5">Gestión Manual de CURPs</h4>
            <div className="flex space-x-2">
                <Input 
                    placeholder="Ingresar CURP para añadir/registrar..."
                    value={newCurpInput} 
                    onChange={(e) => setNewCurpInput(e.target.value.toUpperCase())}
                    className="flex-grow"
                    maxLength={18}
                    name="manualCurp"
                />
                <Button 
                  onClick={handleVerifyOrRegisterCurp} 
                  size="md" 
                  className="text-center !h-auto !py-1 !leading-snug"
                >
                  Registrar
                </Button>
            </div>
        </div>
      </div>
      
      <div className="px-5 pb-5">
        <h5 className="text-sm font-semibold text-text-secondary dark:text-neutral-400 mt-2 mb-2">CURPs en Lista Blanca:</h5>
        {whitelist.length > 0 ? (
            <div className="max-h-72 overflow-y-auto border border-border-gray/50 dark:border-neutral-700/50 rounded-container-third">
            <ul className="divide-y divide-border-gray/30 dark:divide-neutral-700/30">
            {whitelist.map(curpEntry => (
                <li key={curpEntry} className="py-2.5 px-3.5 flex justify-between items-center text-sm hover:bg-gray-50/50 dark:hover:bg-neutral-700/40">
                <span className="text-text-primary dark:text-neutral-200 font-mono text-xs">{curpEntry}</span>
                {curpEntry !== SUPERADMIN_CURP && (
                    <Button variant="danger" size="sm" onClick={() => handleRemoveCurp(curpEntry)} className="!py-1 !px-2 !text-xs">Quitar</Button>
                )}
                </li>
            ))}
            </ul>
            </div>
        ) : (
            <p className="text-text-tertiary dark:text-neutral-400 text-sm py-4 text-center">La lista blanca de CURPs está vacía.</p>
        )}
      </div>

      <Modal 
        isOpen={isRegisterModalOpen} 
        onClose={() => setIsRegisterModalOpen(false)} 
        title="Registrar Nuevo Usuario"
        size="2xl" // Adjusted size to fit more fields
      >
        <form onSubmit={(e) => {e.preventDefault(); handleRegisterNewUser();}} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
          {registerModalError && <Alert type="error" message={registerModalError} onClose={() => setRegisterModalError('')} />}
          <Input label="CURP (No editable)" name="curp" value={newUserFormData.curp} readOnly disabled />
          
          <h5 className="text-sm font-semibold text-text-primary dark:text-custom-gold pt-2">Información Básica (Obligatoria)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <Input label="Nombre(s)" name="nombre" value={newUserFormData.nombre} onChange={handleNewUserFormChange} required />
            <Input label="Apellido Paterno" name="apellidoPaterno" value={newUserFormData.apellidoPaterno} onChange={handleNewUserFormChange} required />
            <Input label="Apellido Materno" name="apellidoMaterno" value={newUserFormData.apellidoMaterno} onChange={handleNewUserFormChange} />
            <Input label="Correo Electrónico" name="email" type="email" value={newUserFormData.email} onChange={handleNewUserFormChange} required placeholder="tu.correo@ejemplo.com"/>
            <Select 
                label="Sexo" name="sexo" value={newUserFormData.sexo} onChange={handleNewUserFormChange}
                options={sexOptions} required
            />
            <Select
                label="Nivel Educativo (General)" name="educationalLevel" value={newUserFormData.educationalLevel} onChange={handleNewUserFormChange}
                options={educationalLevelOptions} required
            />            <Input 
                label={`Antigüedad (Meses)${newUserFormData.role === UserRole.CANDIDATE && newUserFormData.curp !== SUPERADMIN_CURP ? ' (Obligatoria para Candidatos, min. 12 meses)' : ' (Opcional)'}`}
                name="antiguedad" 
                type="number" 
                value={newUserFormData.antiguedad}
                onChange={handleNewUserFormChange} 
                placeholder="Ej: 60" 
                min="0"
            />
            <Select
                label="Área/Departamento/Dirección General" name="areaDepartamentoDireccion" 
                value={newUserFormData.areaDepartamentoDireccion} 
                onChange={handleNewUserFormChange}
                options={areaOptions} 
                required
            />
            <Input label="Puesto" name="puesto" value={newUserFormData.puesto} onChange={handleNewUserFormChange} required placeholder="Ej: Jefe de Departamento"/>
            <Select
                label="Rol" name="role" value={newUserFormData.role} onChange={handleNewUserFormChange}
                options={roleOptionsForManualRegister} required // Use filtered options
            />
            <Select
                label="Bloque Asignado (Votación)" name="assignedBlock" value={newUserFormData.assignedBlock} onChange={handleNewUserFormChange}
                options={ALL_CANDIDATE_BLOCKS.map(b => ({ value: b, label: b }))} required
            />
          </div>

          <h5 className="text-sm font-semibold text-text-primary dark:text-custom-gold pt-3 border-t border-border-gray/30 dark:border-neutral-700/50 mt-4">Información Adicional (Opcional)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <Input label="Celular" name="celular" value={newUserFormData.celular || ''} onChange={handleNewUserFormChange} />
            <Input label="Teléfono - Extensión" name="telefonoExtension" value={newUserFormData.telefonoExtension || ''} onChange={handleNewUserFormChange} />
            <div className="md:col-span-2">
                <label htmlFor="new_consideracionesParticulares" className="block text-xs font-medium text-text-secondary dark:text-neutral-400 mb-1">Consideraciones Particulares</label>
                <textarea id="new_consideracionesParticulares" name="consideracionesParticulares" value={newUserFormData.consideracionesParticulares || ''} onChange={handleNewUserFormChange} rows={2} className="block w-full p-2 bg-gray-50 dark:bg-neutral-700/40 border border-border-gray dark:border-neutral-600 rounded-container-third shadow-apple-sm text-text-primary dark:text-neutral-100 sm:text-sm apple-focus-ring"></textarea>
            </div>
          </div>
          
          <h5 className="text-sm font-semibold text-text-primary dark:text-custom-gold pt-3 border-t border-border-gray/30 dark:border-neutral-700/50 mt-4">Títulos Educativos Específicos (Opcional)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <Input label="Doctorado (Título)" name="doctoradoTitulo" value={newUserFormData.doctoradoTitulo || ''} onChange={handleNewUserFormChange} />
            <Input label="Maestría (Título)" name="maestriaTitulo" value={newUserFormData.maestriaTitulo || ''} onChange={handleNewUserFormChange} />
            <Input label="Licenciatura (Título)" name="licenciaturaTitulo" value={newUserFormData.licenciaturaTitulo || ''} onChange={handleNewUserFormChange} />
            <Input label="Diplomado (Título)" name="diplomadoTitulo" value={newUserFormData.diplomadoTitulo || ''} onChange={handleNewUserFormChange} />
          </div>          <h5 className="text-sm font-semibold text-text-primary dark:text-custom-gold pt-3 border-t border-border-gray/30 dark:border-neutral-700/50 mt-4">Experiencia Profesional (Opcional)</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <Input label="Empresa/Organización" name="nombreCentroTrabajo" value={newUserFormData.nombreCentroTrabajo || ''} onChange={handleNewUserFormChange} />
            <Input label="Sector/Industria" name="tipoCentroTrabajo" value={newUserFormData.tipoCentroTrabajo || ''} onChange={handleNewUserFormChange} />
            <Input label="Estado" name="entidadCentroTrabajo" value={newUserFormData.entidadCentroTrabajo || ''} onChange={handleNewUserFormChange} />
            <Input label="Ciudad/Municipio" name="municipioCentroTrabajo" value={newUserFormData.municipioCentroTrabajo || ''} onChange={handleNewUserFormChange} />
            <Input label="Modalidad Trabajo" name="turnoCentroTrabajo" value={newUserFormData.turnoCentroTrabajo || ''} onChange={handleNewUserFormChange} />
            <Input label="Código Centro Trabajo" name="claveCentroTrabajo" value={newUserFormData.claveCentroTrabajo || ''} onChange={handleNewUserFormChange} />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-border-gray/30 dark:border-neutral-700/50 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsRegisterModalOpen(false)} disabled={isRegisteringUser} className="spectra-btn-secondary-enhanced">Cancelar</Button>
            <Button type="submit" isLoading={isRegisteringUser} disabled={isRegisteringUser} className="spectra-btn-primary-enhanced spectra-btn-cta-pulse">Registrar Usuario</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};
