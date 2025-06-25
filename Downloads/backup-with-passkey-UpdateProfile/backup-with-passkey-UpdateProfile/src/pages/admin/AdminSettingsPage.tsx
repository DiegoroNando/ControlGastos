import React, { useState, useEffect } from 'react';
import { PageTitle, Card, Button, Modal, Alert, Input, Select } from '../../components/common/CommonComponents';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { UserRole } from '../../types';
import { changePassword as serviceChangePassword } from '../../services/databaseService';
import { 
  SmtpConfig, 
  SMTP_PROVIDERS, 
  getSmtpConfig, 
  testSmtpConfig, 
  applySmtpConfig,
  getSmtpStatus,
  getProviderById,
  validateSmtpConfig,
  createDefaultConfig
} from '../../services/smtpConfigService';
import AdminDBTestPage from './AdminDBTestPage';
import AdminManagement from '../../components/admin/AdminManagement';

const AdminSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  
  // Password change states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // DB Test states
  const [showDBTestSection, setShowDBTestSection] = useState(false);
  
  // SMTP Configuration states
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);
  const [smtpConfig, setSmtpConfig] = useState<Partial<SmtpConfig>>({});
  const [smtpMessage, setSmtpMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isApplyingSmtp, setIsApplyingSmtp] = useState(false);
  const [currentSmtpStatus, setCurrentSmtpStatus] = useState<any>(null);  const [showSmtpPassword, setShowSmtpPassword] = useState(false);  // Load SMTP configuration on component mount
  useEffect(() => {
    const loadSmtpConfig = async () => {
      try {
        const stored = await getSmtpConfig();
        if (stored) {
          setSmtpConfig(stored);
        }
        
        // Get current server status
        const status = await getSmtpStatus();
        if (status.success) {
          setCurrentSmtpStatus(status.config);
        }
      } catch (error) {
        console.error('Error loading SMTP config:', error);
      }
    };
    
    loadSmtpConfig();
  }, []);

  const handleChangePassword = async () => {
    if (!currentUser) return;
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setIsChangingPassword(true);
    setPasswordChangeMessage(null);
    const result = await serviceChangePassword(currentUser.curp, currentPassword, newPassword);
    if (result.success) {
      setPasswordChangeMessage({ type: 'success', text: result.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordChangeMessage(null);
      }, 2000);
    } else {
      setPasswordChangeMessage({ type: 'error', text: result.message });    }
    setIsChangingPassword(false);
  };

  // SMTP Configuration Functions
  const handleProviderChange = (providerId: string) => {
    const provider = getProviderById(providerId);
    if (provider) {
      const defaultConfig = createDefaultConfig(providerId);
      setSmtpConfig(prev => ({
        ...prev,
        ...defaultConfig,
        username: prev.username || '',
        password: prev.password || '',
        fromAddress: prev.fromAddress || ''
      }));
    }
  };

  const handleSmtpConfigChange = (field: keyof SmtpConfig, value: any) => {
    setSmtpConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTestSmtpConfig = async () => {
    const validation = validateSmtpConfig(smtpConfig);
    if (!validation.valid) {
      setSmtpMessage({
        type: 'error',
        text: `Errores de validación: ${validation.errors.join(', ')}`
      });
      return;
    }

    setIsTestingSmtp(true);
    setSmtpMessage(null);
    
    const result = await testSmtpConfig(smtpConfig as SmtpConfig);
    setSmtpMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
    
    setIsTestingSmtp(false);
  };
  const handleApplySmtpConfig = async () => {
    const validation = validateSmtpConfig(smtpConfig);
    if (!validation.valid) {
      setSmtpMessage({
        type: 'error',
        text: `Errores de validación: ${validation.errors.join(', ')}`
      });
      return;
    }

    setIsApplyingSmtp(true);
    setSmtpMessage(null);
    
    const result = await applySmtpConfig({...smtpConfig, isActive: true} as SmtpConfig, currentUser?.curp || 'system');
    setSmtpMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
    
    if (result.success) {
      // Update current status
      const status = await getSmtpStatus();
      if (status.success) {
        setCurrentSmtpStatus(status.config);
      }
      
      // Close modal after a delay
      setTimeout(() => {
        setIsSmtpModalOpen(false);
        setSmtpMessage(null);
      }, 2000);
    }
    
    setIsApplyingSmtp(false);
  };
  const resetSmtpModal = async () => {
    setSmtpMessage(null);
    setShowSmtpPassword(false);
    try {
      const stored = await getSmtpConfig();
      if (stored) {
        setSmtpConfig(stored);
      } else {
        setSmtpConfig({});
      }
    } catch (error) {
      console.error('Error loading SMTP config:', error);
      setSmtpConfig({});
    }
  };
    if (!currentUser || currentUser.role !== UserRole.SUPERADMIN) {
    return <Alert type="error" title="Acceso Denegado" message="Esta sección es solo para Superadministradores." />;
  }

  return (
    <PermissionGuard section="settings" requiredLevel="read">
      <div className="space-y-6">
        <PageTitle title="Configuración de Superadministrador" subtitle="Gestiona la configuración de tu cuenta de administrador." />
      
      {/* Admin Management Section */}
      <Card title="👥 Gestión de Administradores">
        <div className="p-6">
          <AdminManagement onAdminChange={() => {
            // Trigger any necessary refreshes
            console.log('Admin configuration changed');
          }} />
        </div>
      </Card>
      
      <Card title="Seguridad de Cuenta Superadministrador">
          <div className="p-4">
              <p className="text-sm text-text-secondary dark:text-neutral-400 mb-4">
                  Actualiza la contraseña de la cuenta de superadministrador.
              </p>
              <Button onClick={() => setIsPasswordModalOpen(true)}>
                  Cambiar Contraseña
              </Button>
          </div>
      </Card>
      
      <Card title="Herramientas de Sistema">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-medium text-text-primary dark:text-white">Pruebas de Base de Datos</h3>
            <p className="text-sm text-text-secondary dark:text-neutral-400 mb-4">
                Herramientas para realizar pruebas y operaciones sobre la base de datos.
            </p>
            <Button onClick={() => setShowDBTestSection(!showDBTestSection)}>
                {showDBTestSection ? 'Ocultar Pruebas de DB' : 'Mostrar Pruebas de DB'}
            </Button>
          </div>
          
          {showDBTestSection && (
            <div className="mt-6 border-t pt-4 border-gray-200 dark:border-neutral-700">
              <AdminDBTestPage />
            </div>
          )}        </div>
      </Card>      <Card title="Configuración SMTP" className="relative">
        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-medium text-text-primary dark:text-white mb-2">Servidor de Correo Electrónico</h3>
            <p className="text-sm text-text-secondary dark:text-neutral-400 mb-4">
                Configura el servidor SMTP para el envío de correos electrónicos del sistema. 
                Compatible con Gmail, Outlook, Office 365, y otros proveedores principales.
            </p>
            
            {currentSmtpStatus && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                  <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                    ✅ Configuración Activa
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">Servidor:</span>
                    <span className="text-green-600 dark:text-green-400 ml-1">
                      {currentSmtpStatus.host}:{currentSmtpStatus.port}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">Usuario:</span>
                    <span className="text-green-600 dark:text-green-400 ml-1">
                      {currentSmtpStatus.user}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">Seguridad:</span>
                    <span className="text-green-600 dark:text-green-400 ml-1">
                      {currentSmtpStatus.secure ? 'SSL/TLS' : 'STARTTLS'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 dark:text-green-300">Estado:</span>
                    <span className="text-green-600 dark:text-green-400 ml-1">
                      Funcionando
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">              <Button 
                onClick={async () => {
                  await resetSmtpModal();
                  setIsSmtpModalOpen(true);
                }}
                className="spectra-btn-primary-enhanced"
              >
                📧 Configurar SMTP
              </Button>
              
              {currentSmtpStatus && (
                <Button 
                  variant="secondary"
                  onClick={async () => {
                    const status = await getSmtpStatus();
                    if (status.success) {
                      setCurrentSmtpStatus(status.config);
                      setSmtpMessage({ type: 'success', text: 'Estado del servidor actualizado' });
                      setTimeout(() => setSmtpMessage(null), 3000);
                    }
                  }}
                  className="spectra-btn-secondary-enhanced"
                >
                  🔄 Verificar Estado
                </Button>
              )}
            </div>
            
            {smtpMessage && !isSmtpModalOpen && (
              <div className="mt-4">
                <Alert 
                  type={smtpMessage.type} 
                  message={smtpMessage.text} 
                  onClose={() => setSmtpMessage(null)} 
                />
              </div>
            )}
          </div>
        </div>
      </Card>
        <Modal 
        isOpen={isSmtpModalOpen} 
        onClose={() => setIsSmtpModalOpen(false)} 
        title="🔧 Configuración del Servidor SMTP" 
        size="xl"
      >
        <div className="space-y-6">
          {smtpMessage && (
            <Alert 
              type={smtpMessage.type} 
              message={smtpMessage.text} 
              onClose={() => setSmtpMessage(null)} 
            />
          )}
          
          {/* Header informatico */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-300 text-sm">📧</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Configuración de Servidor SMTP
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Configura el servicio de correo electrónico para notificaciones del sistema. 
                  Selecciona tu proveedor favorito o configura uno personalizado.
                </p>
              </div>
            </div>
          </div>
          
          {/* Proveedor SMTP */}
          <div className="space-y-3">
            <Select
              label="🔧 Proveedor de Email:"
              name="provider"
              value={smtpConfig.provider || ''}
              onChange={(e) => handleProviderChange(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar proveedor...' },
                ...SMTP_PROVIDERS.map(provider => ({
                  value: provider.id,
                  label: `${provider.name}${provider.authType === 'api-key' ? ' (API)' : ''}`
                }))
              ]}
              required
            />
            
            {/* Información del proveedor seleccionado */}
            {smtpConfig.provider && (() => {
              const provider = getProviderById(smtpConfig.provider);
              return provider ? (
                <div className={`p-4 rounded-lg border ${
                  provider.authType === 'api-key' 
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        provider.authType === 'api-key' 
                          ? 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300' 
                          : 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-300'
                      }`}>
                        {provider.authType === 'api-key' ? '🔑' : '✉️'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm font-medium ${
                        provider.authType === 'api-key' 
                          ? 'text-purple-900 dark:text-purple-200' 
                          : 'text-green-900 dark:text-green-200'
                      }`}>
                        {provider.name}
                      </h4>
                      <p className={`text-xs mt-1 ${
                        provider.authType === 'api-key' 
                          ? 'text-purple-700 dark:text-purple-300' 
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {provider.description}
                      </p>
                      {provider.settings?.setupInstructions && (
                        <div className="mt-2">
                          <p className={`text-xs font-medium ${
                            provider.authType === 'api-key' 
                              ? 'text-purple-800 dark:text-purple-200' 
                              : 'text-green-800 dark:text-green-200'
                          }`}>
                            📋 Instrucciones:
                          </p>
                          <p className={`text-xs mt-1 ${
                            provider.authType === 'api-key' 
                              ? 'text-purple-700 dark:text-purple-300' 
                              : 'text-green-700 dark:text-green-300'
                          }`}>
                            {provider.settings.setupInstructions}
                          </p>
                          {provider.settings.documentationUrl && (
                            <a 
                              href={provider.settings.documentationUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`text-xs font-medium hover:underline ${
                                provider.authType === 'api-key' 
                                  ? 'text-purple-600 dark:text-purple-400' 
                                  : 'text-green-600 dark:text-green-400'
                              }`}
                            >
                              📖 Ver documentación →
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null;
            })()}
          </div>
          
          {smtpConfig.provider && (
            <>
              {/* Configuración del servidor */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-text-primary dark:text-neutral-200 border-b border-gray-200 dark:border-neutral-700 pb-2">
                  🌐 Configuración del Servidor
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Host SMTP:"
                    name="host"
                    value={smtpConfig.host || ''}
                    onChange={(e) => handleSmtpConfigChange('host', e.target.value)}
                    placeholder="smtp.ejemplo.com"
                    required
                    disabled={smtpConfig.provider !== 'custom'}
                    className={smtpConfig.provider !== 'custom' ? 'bg-gray-50 dark:bg-gray-800' : ''}
                  />
                  
                  <Input
                    label="Puerto:"
                    name="port"
                    type="number"
                    value={smtpConfig.port || ''}
                    onChange={(e) => handleSmtpConfigChange('port', parseInt(e.target.value) || '')}
                    placeholder="587"
                    required
                    disabled={smtpConfig.provider !== 'custom'}
                    className={smtpConfig.provider !== 'custom' ? 'bg-gray-50 dark:bg-gray-800' : ''}
                  />
                </div>
                
                {/* Seguridad */}
                <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={smtpConfig.secure || false}
                      onChange={(e) => handleSmtpConfigChange('secure', e.target.checked)}
                      disabled={smtpConfig.provider !== 'custom'}
                      className="mr-2 h-4 w-4 text-primary-maroon focus:ring-primary-maroon border-gray-300 rounded"
                    />
                    <span className="text-sm text-text-primary dark:text-neutral-200">
                      🔒 Usar SSL/TLS (puerto 465)
                    </span>
                  </label>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {smtpConfig.secure ? 'Conexión segura SSL/TLS' : 'Conexión STARTTLS'}
                  </div>
                </div>
              </div>
              
              {/* Credenciales */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-text-primary dark:text-neutral-200 border-b border-gray-200 dark:border-neutral-700 pb-2">
                  🔑 Credenciales de Acceso
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={`${getProviderById(smtpConfig.provider)?.authType === 'api-key' ? 'Usuario/API Key ID:' : 'Usuario/Email:'}`}
                    name="username"
                    value={smtpConfig.username || ''}
                    onChange={(e) => handleSmtpConfigChange('username', e.target.value)}
                    placeholder={getProviderById(smtpConfig.provider)?.authType === 'api-key' ? 'apikey o token_id' : 'usuario@ejemplo.com'}
                    required
                  />
                  
                  <div className="relative">
                    <Input
                      label={`${getProviderById(smtpConfig.provider)?.authType === 'api-key' ? 'API Key/Token:' : 'Contraseña:'}`}
                      name="password"
                      type={showSmtpPassword ? 'text' : 'password'}
                      value={smtpConfig.password || ''}
                      onChange={(e) => handleSmtpConfigChange('password', e.target.value)}
                      placeholder={getProviderById(smtpConfig.provider)?.authType === 'api-key' ? 'sk-...' : '••••••••••••'}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                      className="absolute right-3 top-9 text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {showSmtpPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Información del remitente */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-text-primary dark:text-neutral-200 border-b border-gray-200 dark:border-neutral-700 pb-2">
                  📨 Información del Remitente
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nombre del Remitente:"
                    name="fromName"
                    value={smtpConfig.fromName || ''}
                    onChange={(e) => handleSmtpConfigChange('fromName', e.target.value)}
                    placeholder="Sistema de Votaciones"
                    required
                  />
                  
                  <Input
                    label="Email del Remitente:"
                    name="fromAddress"
                    type="email"
                    value={smtpConfig.fromAddress || ''}
                    onChange={(e) => handleSmtpConfigChange('fromAddress', e.target.value)}
                    placeholder="noreply@ejemplo.com"
                    required
                  />
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200 dark:border-neutral-700">
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={handleTestSmtpConfig}
                    disabled={isTestingSmtp || isApplyingSmtp}
                    className="spectra-btn-secondary-enhanced flex items-center space-x-2"
                  >
                    <span>{isTestingSmtp ? '🔄' : '🧪'}</span>
                    <span>{isTestingSmtp ? 'Probando...' : 'Probar Conexión'}</span>
                  </Button>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="secondary" 
                    onClick={() => setIsSmtpModalOpen(false)} 
                    disabled={isTestingSmtp || isApplyingSmtp}
                    className="spectra-btn-secondary-enhanced"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleApplySmtpConfig} 
                    disabled={isTestingSmtp || isApplyingSmtp}
                    className="spectra-btn-primary-enhanced spectra-btn-cta-pulse flex items-center space-x-2"
                  >
                    <span>{isApplyingSmtp ? '⏳' : '✅'}</span>
                    <span>{isApplyingSmtp ? 'Aplicando...' : 'Aplicar Configuración'}</span>
                  </Button>
                </div>              </div>
            </>
          )}
        </div>
      </Modal>
      
      {/* Password Change Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Cambiar Contraseña de Superadministrador" size="md">
        <div className="space-y-4">
          {passwordChangeMessage && (
            <Alert type={passwordChangeMessage.type} message={passwordChangeMessage.text} onClose={() => setPasswordChangeMessage(null)} />
          )}
          
          <div>
            <label htmlFor="current-password" className="block spectra-form-label-enhanced">Contraseña Actual</label>
            <input
              id="current-password"
              type="password"
              name="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Tu contraseña actual"
              required
              className="w-full spectra-form-enhanced"
            />
          </div>
          
          <div>
            <label htmlFor="new-password-admin" className="block spectra-form-label-enhanced">Nueva Contraseña</label>
            <input
              id="new-password-admin"
              type="password"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className="w-full spectra-form-enhanced"
            />
          </div>
          
          <div>
            <label htmlFor="confirm-new-password-admin" className="block spectra-form-label-enhanced">Confirmar Nueva Contraseña</label>
            <input
              id="confirm-new-password-admin"
              type="password"
              name="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              required
              className={`w-full spectra-form-enhanced ${
                newPassword && confirmNewPassword && newPassword !== confirmNewPassword 
                  ? 'spectra-form-error-enhanced' 
                  : newPassword && confirmNewPassword && newPassword === confirmNewPassword 
                  ? 'spectra-form-success-enhanced' 
                  : ''
              }`}
            />
            {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                Las contraseñas no coinciden
              </div>
            )}
            {newPassword && confirmNewPassword && newPassword === confirmNewPassword && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium">
                Las contraseñas coinciden ✓
              </div>
            )}
          </div>
            <div className="flex justify-end space-x-2 pt-2">
            <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)} disabled={isChangingPassword} className="spectra-btn-secondary-enhanced">
              Cancelar
            </Button>
            <Button onClick={handleChangePassword} isLoading={isChangingPassword} disabled={isChangingPassword} className="spectra-btn-primary-enhanced spectra-btn-cta-pulse">
              Cambiar Contraseña
            </Button>
          </div>        </div>
      </Modal>
      </div>
    </PermissionGuard>
  );
};

export default AdminSettingsPage;
