// src/pages/admin/AdminPasswordSetupPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getAdminUsers, updateAdminPermissions } from '../../services/adminManagementService';
import { generatePasswordDigest } from '../../services/passwordService';
import { updateInCollection } from '../../services/databaseService';
import { AdminUser } from '../../types';
import { Button, Input, Card, Alert } from '../../components/common/CommonComponents';
import { ROUTES } from '../../constants';

const AdminPasswordSetupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setMessage({ type: 'error', text: 'Token de registro no válido' });
        setIsLoading(false);
        return;
      }

      try {
        const admins = await getAdminUsers();
        const adminWithToken = admins.find(a => 
          a.registrationToken === token && 
          a.registrationTokenExpiry && 
          a.registrationTokenExpiry > Date.now() && 
          !a.hasLoggedInOnce
        );

        if (!adminWithToken) {
          setMessage({ 
            type: 'error', 
            text: 'Token expirado o no válido. Contacta al superadministrador para obtener un nuevo enlace.' 
          });
        } else {
          setAdmin(adminWithToken);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        setMessage({ type: 'error', text: 'Error al verificar el token' });
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admin) return;

    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: 'Todos los campos son obligatorios' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      // Generate password digest
      const passwordDigest = await generatePasswordDigest(password);

      // Update admin with password and mark as logged in
      const updated = await updateInCollection(
        'admins', 
        { curp: admin.curp }, 
        { 
          passwordDigest, 
          hasLoggedInOnce: true,
          registrationToken: null,
          registrationTokenExpiry: null,
          updatedAt: Date.now()
        }
      );

      if (updated) {
        setMessage({ 
          type: 'success', 
          text: 'Contraseña establecida exitosamente. Redirigiendo al login...' 
        });
          // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate(ROUTES.AUTH + '?tab=login');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: 'Error al establecer la contraseña' });
      }
    } catch (error) {
      console.error('Error setting password:', error);
      setMessage({ type: 'error', text: 'Error interno al establecer la contraseña' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-maroon/5 to-primary-pink/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-maroon mx-auto mb-4"></div>
          <p className="text-text-secondary">Verificando token...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-maroon/5 to-primary-pink/5 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-neutral-100 mb-4">
              Token No Válido
            </h1>
            {message && (
              <Alert type={message.type} message={message.text} className="mb-6" />            )}
            <Button 
              onClick={() => navigate(ROUTES.AUTH)}
              className="w-full"
            >
              Ir al Login
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-maroon/5 to-primary-pink/5 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <Card className="p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🛡️</div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-neutral-100 mb-2">
              Configurar Contraseña
            </h1>
            <p className="text-text-secondary dark:text-neutral-400">
              Administrador del Sistema de Votaciones
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              👋 ¡Bienvenido, {admin.nombre} {admin.apellidoPaterno}!
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p><strong>CURP:</strong> {admin.curp}</p>
              <p><strong>Email:</strong> {admin.email}</p>
              <p><strong>Rol:</strong> Administrador</p>
            </div>
          </div>

          {message && (
            <Alert type={message.type} message={message.text} className="mb-6" />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nueva Contraseña:"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              minLength={6}
            />

            <Input
              label="Confirmar Contraseña:"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirma tu contraseña"
              required
              minLength={6}
            />

            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 text-sm mb-1">
                🔐 Requisitos de Seguridad:
              </h4>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <li>• Mínimo 6 caracteres</li>
                <li>• Usa una combinación de letras, números y símbolos</li>
                <li>• No uses información personal como tu nombre o CURP</li>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Configurando...' : 'Establecer Contraseña'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-text-tertiary dark:text-neutral-500">
              Al establecer tu contraseña, podrás acceder al sistema como administrador.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPasswordSetupPage;
