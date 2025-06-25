import React from 'react';
import { ConfirmationModal } from '../common/CommonComponents';
import { User } from '../../types';

interface MassDeleteUsersProps {
  isOpen: boolean;
  onClose: () => void;
  usersCount: number;
  onConfirmDelete: () => void;
  isDeleting: boolean;
}

const MassDeleteUsers: React.FC<MassDeleteUsersProps> = ({
  isOpen,
  onClose,
  usersCount,
  onConfirmDelete,
  isDeleting
}) => {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirmDelete}
      title="Confirmar Eliminación Masiva"
      message={
        <>
          <p>¿Estás seguro de que deseas eliminar a los <strong>{usersCount}</strong> usuarios seleccionados?</p>
          <p className="text-red-600 dark:text-red-400 my-2 font-medium">Esta acción es irreversible.</p>
          <p className="text-sm text-text-tertiary dark:text-neutral-400 my-2">
            La eliminación masiva eliminará todos los datos asociados, incluyendo:
          </p>
          <ul className="list-disc pl-5 text-sm text-text-tertiary dark:text-neutral-400 space-y-1">
            <li>Perfiles de usuario</li>
            <li>Candidaturas</li>
            <li>Votos emitidos por estos usuarios</li>
            <li>Nominaciones pendientes</li>
          </ul>
          <div className="bg-warning-bg/50 dark:bg-yellow-900/20 border-l-4 border-warning-text dark:border-yellow-500 p-3 my-3">
            <p className="text-xs text-warning-text dark:text-yellow-300">
              <strong>IMPORTANTE:</strong> Se recomienda hacer una copia de seguridad de la base de datos antes de realizar esta operación.
            </p>
          </div>
        </>
      }
      confirmText="Sí, Eliminar Usuarios Seleccionados"
      confirmButtonVariant="danger"
      isLoading={isDeleting}
    />
  );
};

export default MassDeleteUsers;
