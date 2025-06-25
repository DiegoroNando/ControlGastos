import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Modal, 
  Alert, 
  Input, 
  LoadingSpinner
} from '../common/CommonComponents';
import { 
  AdminUser, 
  AdminPermissions, 
  UserRole 
} from '../../types';
import {
  getAllAdminUsers,
  createAdminUser,
  updateAdminPermissions,
  toggleAdminStatus,
  deleteAdminUser,
  changeAdminPassword,
  DEFAULT_PERMISSION_TEMPLATES,
  canAccessSection
} from '../../services/adminManagementService';
import { useAuth } from '../../contexts/AuthContext';
import { validateCURP } from '../../utils/curpUtils';
import AdvancedPermissionsEditor from './AdvancedPermissionsEditor';
import PermissionLevelSummary from './PermissionLevelSummary';

interface AdminManagementProps {
  onAdminChange?: () => void;
}

const AdminManagement: React.FC<AdminManagementProps> = ({ onAdminChange }) => {
  const { currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Create Admin Form State
  const [newAdminForm, setNewAdminForm] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    curp: '',
    email: '',
    permissionTemplate: 'SOLO_LECTURA' as keyof typeof DEFAULT_PERMISSION_TEMPLATES
  });

  // Permissions Edit State
  const [editingPermissions, setEditingPermissions] = useState<AdminPermissions>({});

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const adminUsers = await getAllAdminUsers();
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Error loading admins:', error);
      setMessage({ type: 'error', text: 'Error al cargar administradores' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    // Validation
    if (!newAdminForm.nombre.trim() || !newAdminForm.apellidoPaterno.trim() || 
        !newAdminForm.curp.trim() || !newAdminForm.email.trim()) {
      setMessage({ type: 'error', text: 'Todos los campos son obligatorios' });
      return;
    }

    if (!validateCURP(newAdminForm.curp)) {
      setMessage({ type: 'error', text: 'CURP inválido' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newAdminForm.email)) {
      setMessage({ type: 'error', text: 'Email inválido' });
      return;
    }

    // Check if admin already exists
    if (admins.some(admin => admin.curp === newAdminForm.curp)) {
      setMessage({ type: 'error', text: 'Ya existe un administrador con este CURP' });
      return;
    }

    if (admins.some(admin => admin.email === newAdminForm.email)) {
      setMessage({ type: 'error', text: 'Ya existe un administrador con este email' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const adminData = {
        ...newAdminForm,
        permissions: DEFAULT_PERMISSION_TEMPLATES[newAdminForm.permissionTemplate],
        createdBy: currentUser?.curp || ''
      };

      const result = await createAdminUser(adminData);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });        setNewAdminForm({
          nombre: '',
          apellidoPaterno: '',
          apellidoMaterno: '',
          curp: '',
          email: '',
          permissionTemplate: 'SOLO_LECTURA'
        });
        setIsCreateModalOpen(false);
        await loadAdmins();
        onAdminChange?.();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      setMessage({ type: 'error', text: 'Error al crear administrador' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPermissions = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setEditingPermissions(admin.permissions);
    setIsPermissionsModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updateAdminPermissions(selectedAdmin.curp, editingPermissions);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setIsPermissionsModalOpen(false);
        await loadAdmins();
        onAdminChange?.();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      setMessage({ type: 'error', text: 'Error al actualizar permisos' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin: AdminUser) => {
    try {
      const result = await toggleAdminStatus(admin.curp, !admin.isActive);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        await loadAdmins();
        onAdminChange?.();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error toggling admin status:', error);
      setMessage({ type: 'error', text: 'Error al cambiar estado del administrador' });
    }
  };

  const handleDeleteAdmin = async (admin: AdminUser) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al administrador ${admin.nombre} ${admin.apellidoPaterno}?`)) {
      return;
    }

    try {
      const result = await deleteAdminUser(admin.curp);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        await loadAdmins();
        onAdminChange?.();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      setMessage({ type: 'error', text: 'Error al eliminar administrador' });
    }
  };

  const handleChangePassword = async () => {
    if (!selectedAdmin) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await changeAdminPassword(selectedAdmin.curp, newPassword);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setNewPassword('');
        setConfirmPassword('');
        setIsPasswordModalOpen(false);
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Error al cambiar contraseña' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const openPasswordModal = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(true);
  };

  const getSectionAccessLevel = (admin: AdminUser, section: string): string => {
    const access = canAccessSection(admin, section);
    switch (access) {
      case 'write': return 'Completo';
      case 'read': return 'Solo lectura';
      case 'none': return 'Sin acceso';
      default: return 'Sin acceso';
    }
  };

  if (!currentUser || currentUser.role !== UserRole.SUPERADMIN) {
    return <Alert type="error" title="Acceso Denegado" message="Solo los superadministradores pueden gestionar administradores." />;
  }

  return (
    <div className="space-y-6">
      {message && (
        <Alert 
          type={message.type} 
          message={message.text} 
          onClose={() => setMessage(null)} 
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-text-primary dark:text-neutral-100">
            Gestión de Administradores
          </h2>
          <p className="text-sm text-text-secondary dark:text-neutral-400 mt-1">
            Crea y gestiona administradores subordinados con permisos granulares
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="spectra-btn-primary-enhanced"
        >
          ➕ Crear Administrador
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Administrador
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Accesos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4">
                      <div>
                        <div className="text-sm font-medium text-text-primary dark:text-neutral-100">
                          {admin.nombre} {admin.apellidoPaterno} {admin.apellidoMaterno}
                        </div>
                        <div className="text-xs text-text-tertiary dark:text-neutral-500">
                          CURP: {admin.curp}
                        </div>
                        <div className="text-xs text-text-tertiary dark:text-neutral-500">
                          Creado: {new Date(admin.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-text-secondary dark:text-neutral-300">
                      {admin.email}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        admin.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {admin.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                      {!admin.hasLoggedInOnce && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Pendiente primer acceso
                        </div>
                      )}
                    </td>                    <td className="px-4 py-4 text-xs">
                      <div className="space-y-2">
                        {/* Permission Summary Badges */}
                        <div className="flex flex-wrap gap-1">
                          {['statistics', 'users', 'blocks', 'settings'].map((section) => {
                            const access = canAccessSection(admin, section);
                            const colors = {
                              'write': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
                              'read': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
                              'none': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                            };
                            const icons = {
                              'write': '✏️',
                              'read': '👁️',
                              'none': '🚫'
                            };
                            const labels = {
                              'statistics': 'Stats',
                              'users': 'Users',
                              'blocks': 'Blocks', 
                              'settings': 'Config'
                            };
                            
                            return (
                              <span
                                key={section}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[access]}`}
                                title={`${labels[section as keyof typeof labels]}: ${getSectionAccessLevel(admin, section)}`}
                              >
                                <span className="mr-1">{icons[access]}</span>
                                {labels[section as keyof typeof labels]}
                              </span>
                            );
                          })}
                        </div>
                        
                        {/* Quick Stats */}
                        <div className="text-xs text-text-tertiary dark:text-neutral-500">
                          {(() => {
                            const accessCounts = ['statistics', 'users', 'blocks', 'calendar', 'whitelist', 'emails', 'settings']
                              .reduce((acc, section) => {
                                const access = canAccessSection(admin, section);
                                acc[access] = (acc[access] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);
                            
                            return `${accessCounts.write || 0} completo, ${accessCounts.read || 0} lectura, ${accessCounts.none || 0} sin acceso`;
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEditPermissions(admin)}
                          className="text-xs"
                        >
                          ⚙️ Permisos
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openPasswordModal(admin)}
                          className="text-xs"
                        >
                          🔑 Contraseña
                        </Button>
                        <Button
                          size="sm"
                          variant={admin.isActive ? "secondary" : "primary"}
                          onClick={() => handleToggleStatus(admin)}
                          className="text-xs"
                        >
                          {admin.isActive ? '⏸️ Desactivar' : '▶️ Activar'}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteAdmin(admin)}
                          className="text-xs"
                        >
                          🗑️ Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {admins.length === 0 && (
              <div className="text-center py-8 text-text-secondary dark:text-neutral-400">
                No hay administradores creados
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Create Admin Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="➕ Crear Nuevo Administrador"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre:"
              value={newAdminForm.nombre}
              onChange={(e) => setNewAdminForm(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre del administrador"
              required
            />
            <Input
              label="Apellido Paterno:"
              value={newAdminForm.apellidoPaterno}
              onChange={(e) => setNewAdminForm(prev => ({ ...prev, apellidoPaterno: e.target.value }))}
              placeholder="Apellido paterno"
              required
            />
          </div>
          
          <Input
            label="Apellido Materno:"
            value={newAdminForm.apellidoMaterno}
            onChange={(e) => setNewAdminForm(prev => ({ ...prev, apellidoMaterno: e.target.value }))}
            placeholder="Apellido materno (opcional)"
          />
          
          <Input
            label="CURP:"
            value={newAdminForm.curp}
            onChange={(e) => setNewAdminForm(prev => ({ ...prev, curp: e.target.value.toUpperCase() }))}
            placeholder="CURP del administrador"
            maxLength={18}
            required
          />
          
          <Input
            label="Email:"
            type="email"
            value={newAdminForm.email}
            onChange={(e) => setNewAdminForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="correo@ejemplo.com"
            required
          />
            <div className="space-y-4">
            <label className="block text-sm font-medium text-text-primary dark:text-neutral-100">
              Nivel de Permisos:
            </label>
            
            <PermissionLevelSummary
              selectedLevel={newAdminForm.permissionTemplate}
              onLevelSelect={(level) => setNewAdminForm(prev => ({ 
                ...prev, 
                permissionTemplate: level 
              }))}
            />
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              📧 Se enviará un correo electrónico al administrador con instrucciones para establecer su contraseña.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAdmin}
              disabled={isSubmitting}
              className="spectra-btn-primary-enhanced"
            >
              {isSubmitting ? '⏳ Creando...' : '✅ Crear Administrador'}
            </Button>
          </div>
        </div>
      </Modal>      {/* Edit Permissions Modal */}
      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title={`⚙️ Configurar Permisos - ${selectedAdmin?.nombre} ${selectedAdmin?.apellidoPaterno}`}
        size="xl"
      >
        <div className="space-y-6">
          {selectedAdmin && (
            <>
              {/* Permission Level Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  🎯 Configuración de Acceso por Secciones
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Configure el nivel de acceso para cada sección del sistema. Los niveles disponibles son:
                </p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-red-100 rounded-full"></span>
                    <span className="text-blue-700 dark:text-blue-300">🚫 Sin Acceso</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-blue-100 rounded-full"></span>
                    <span className="text-blue-700 dark:text-blue-300">👁️ Solo Lectura</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 bg-green-100 rounded-full"></span>
                    <span className="text-blue-700 dark:text-blue-300">✏️ Lectura y Escritura</span>
                  </div>
                </div>
              </div>

              {/* Advanced Permissions Editor */}
              <AdvancedPermissionsEditor
                admin={selectedAdmin}
                permissions={editingPermissions}
                onPermissionsChange={setEditingPermissions}
              />
            </>
          )}
          
          <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setIsPermissionsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSavePermissions}
              disabled={isSubmitting}
              className="spectra-btn-primary-enhanced"
            >
              {isSubmitting ? '⏳ Guardando...' : '✅ Guardar Permisos'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`🔑 Cambiar Contraseña - ${selectedAdmin?.nombre} ${selectedAdmin?.apellidoPaterno}`}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nueva Contraseña:"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />
          
          <Input
            label="Confirmar Contraseña:"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
            required
          />
          
          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <div className="text-sm text-red-600 dark:text-red-400">
              Las contraseñas no coinciden
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isSubmitting || !newPassword || newPassword !== confirmPassword}
              className="spectra-btn-primary-enhanced"
            >
              {isSubmitting ? '⏳ Cambiando...' : '✅ Cambiar Contraseña'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminManagement;
