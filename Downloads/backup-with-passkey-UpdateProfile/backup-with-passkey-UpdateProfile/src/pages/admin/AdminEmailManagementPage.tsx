import React, { useState, useEffect, useCallback } from 'react';
import { PageTitle, Alert, LoadingSpinner, Button, Card, Input, Select } from '../../components/common/CommonComponents';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGuard from '../../components/admin/PermissionGuard';
import { UserRole, User, CandidateBlock, ALL_CANDIDATE_BLOCKS } from '../../types';
import { getUsersWhoHaveNotVoted, getUsers } from '../../services/databaseService';
import { sendMassEmailToNonVoters, sendAutomatedReminder } from '../../services/emailService';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'voting' | 'nomination' | 'general';
}

const predefinedTemplates: EmailTemplate[] = [
  {
    id: 'voting_reminder',
    name: 'Recordatorio de Votación',
    subject: 'Recordatorio: Tu voto es importante - Sistema de Votaciones',
    content: `
      <p>Estimado/a participante,</p>
      <p>Te recordamos que el <strong>período de votación está activo</strong> y tu participación es muy importante para el proceso democrático del Comité de Ética.</p>
      <p><strong>¿Qué necesitas hacer?</strong></p>
      <ul>
        <li>Ingresar al sistema de votaciones</li>
        <li>Revisar los candidatos disponibles en tu bloque</li>
        <li>Emitir tu voto de manera informada</li>
      </ul>
      <p>Tu participación hace la diferencia. ¡No olvides votar!</p>
    `,
    type: 'voting'
  },
  {
    id: 'nomination_reminder',
    name: 'Recordatorio de Nominación',
    subject: 'Recordatorio: Período de Nominaciones Activo',
    content: `
      <p>Estimado/a participante,</p>
      <p>El <strong>período de nominaciones está activo</strong> y puedes nominar a colegas elegibles para el Comité de Ética.</p>
      <p><strong>Acciones disponibles:</strong></p>
      <ul>
        <li>Nominar a un colega de tu bloque</li>
        <li>Postularte como candidato (auto-nominación)</li>
        <li>Revisar los requisitos de elegibilidad</li>
      </ul>
      <p>Tu participación en este proceso es fundamental para una representación democrática.</p>
    `,
    type: 'nomination'
  },
  {
    id: 'general_reminder',
    name: 'Recordatorio General',
    subject: 'Información del Sistema de Votaciones',
    content: `
      <p>Estimado/a participante,</p>
      <p>Te enviamos este recordatorio sobre el proceso electoral del Comité de Ética.</p>
      <p>Por favor, mantente informado sobre las fechas importantes y participa activamente en el proceso democrático.</p>
      <p>Para más información, ingresa al sistema de votaciones.</p>
    `,
    type: 'general'
  }
];

const AdminEmailManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [nonVoters, setNonVoters] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info'; text: string} | null>(null);
  
  // Email form state
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customSubject, setCustomSubject] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [recipientFilter, setRecipientFilter] = useState<'all_non_voters' | 'all_users' | 'by_block'>('all_non_voters');
  const [selectedBlock, setSelectedBlock] = useState<CandidateBlock | ''>('');
  
  // Automated reminders state
  const [reminderType, setReminderType] = useState<'nomination' | 'voting'>('voting');
  const [daysRemaining, setDaysRemaining] = useState<number>(3);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [nonVotersData, usersData] = await Promise.all([
        getUsersWhoHaveNotVoted(),
        getUsers()
      ]);
      
      setNonVoters(nonVotersData);
      setAllUsers(usersData.filter(u => u.role !== UserRole.SUPERADMIN));
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({type: 'error', text: 'Error al cargar los datos'});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = predefinedTemplates.find(t => t.id === templateId);
    if (template) {
      setCustomSubject(template.subject);
      setCustomContent(template.content);
    } else {
      setCustomSubject('');
      setCustomContent('');
    }
  };

  const getRecipients = () => {
    switch (recipientFilter) {
      case 'all_non_voters':
        return nonVoters;
      case 'all_users':
        return allUsers;
      case 'by_block':
        return selectedBlock ? allUsers.filter(u => u.assignedBlock === selectedBlock) : [];
      default:
        return [];
    }
  };

  const handleSendMassEmail = async () => {
    const recipients = getRecipients();
    
    if (recipients.length === 0) {
      setMessage({type: 'error', text: 'No hay destinatarios seleccionados'});
      return;
    }
    
    if (!customSubject.trim() || !customContent.trim()) {
      setMessage({type: 'error', text: 'Asunto y contenido son requeridos'});
      return;
    }

    setIsSending(true);
    try {
      const success = await sendMassEmailToNonVoters(recipients, customSubject, customContent);
      if (success) {
        setMessage({type: 'success', text: `Correo masivo enviado exitosamente a ${recipients.length} destinatarios`});
        // Reset form
        setSelectedTemplate('');
        setCustomSubject('');
        setCustomContent('');
      } else {
        setMessage({type: 'error', text: 'Error al enviar el correo masivo'});
      }
    } catch (error) {
      console.error('Error sending mass email:', error);
      setMessage({type: 'error', text: 'Error al enviar el correo masivo'});
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAutomatedReminder = async () => {
    const recipients = allUsers;
    
    if (recipients.length === 0) {
      setMessage({type: 'error', text: 'No hay usuarios para enviar recordatorios'});
      return;
    }

    setIsSending(true);
    try {
      const success = await sendAutomatedReminder(recipients, reminderType, daysRemaining);
      if (success) {
        setMessage({type: 'success', text: `Recordatorio automático enviado a ${recipients.length} usuarios`});
      } else {
        setMessage({type: 'error', text: 'Error al enviar el recordatorio automático'});
      }
    } catch (error) {
      console.error('Error sending automated reminder:', error);
      setMessage({type: 'error', text: 'Error al enviar el recordatorio automático'});
    } finally {
      setIsSending(false);
    }
  };
  if (!currentUser || (currentUser.role !== UserRole.SUPERADMIN && currentUser.role !== UserRole.ADMIN)) {
    return <Alert type="error" title="Acceso Denegado" message="Esta sección es solo para Administradores." />;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const recipients = getRecipients();

  return (
    <PermissionGuard section="emails">
      <div className="space-y-8">
        <PageTitle title="Gestión de Correos Masivos" subtitle="Envía recordatorios y notificaciones a los usuarios del sistema." />
        
        {message && (
          <Alert 
            type={message.type} 
            message={message.text} 
            onClose={() => setMessage(null)} 
            className="mb-6"
          />
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card title="Usuarios sin Votar" className="text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-custom-pink">{nonVoters.length}</div>
              <div className="text-sm text-text-secondary dark:text-neutral-400">
                usuarios no han votado en bloques activos
              </div>
            </div>
          </Card>
          
          <Card title="Total de Usuarios" className="text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">{allUsers.length}</div>
              <div className="text-sm text-text-secondary dark:text-neutral-400">
                usuarios registrados (excl. superadmin)
              </div>
            </div>
          </Card>
          
          <Card title="Destinatarios Seleccionados" className="text-center">
            <div className="space-y-2">
              <div className="text-3xl font-bold text-green-600">{recipients.length}</div>
              <div className="text-sm text-text-secondary dark:text-neutral-400">
                destinatarios para el correo
              </div>
            </div>
          </Card>
        </div>

        {/* Mass Email Section */}
        <Card title="Envío de Correo Masivo">
          <div className="space-y-6">
            {/* Recipient Filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Filtro de Destinatarios:"
                name="recipientFilter"
                value={recipientFilter}
                onChange={(e) => setRecipientFilter(e.target.value as typeof recipientFilter)}
                options={[
                  { value: 'all_non_voters', label: `Usuarios sin votar (${nonVoters.length})` },
                  { value: 'all_users', label: `Todos los usuarios (${allUsers.length})` },
                  { value: 'by_block', label: 'Por bloque específico' }
                ]}
              />
              
              {recipientFilter === 'by_block' && (
                <Select
                  label="Bloque:"
                  name="selectedBlock"
                  value={selectedBlock}
                  onChange={(e) => setSelectedBlock(e.target.value as CandidateBlock)}
                  options={[
                    { value: '', label: 'Seleccionar bloque...' },
                    ...ALL_CANDIDATE_BLOCKS.map(block => ({ value: block, label: block }))
                  ]}
                />
              )}
            </div>

            {/* Template Selection */}
            <Select
              label="Plantilla de Correo:"
              name="template"
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              options={[
                { value: '', label: 'Seleccionar plantilla o crear personalizado...' },
                ...predefinedTemplates.map(template => ({ 
                  value: template.id, 
                  label: `${template.name} (${template.type})` 
                }))
              ]}
            />

            {/* Subject and Content */}
            <Input
              label="Asunto del Correo:"
              name="subject"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Ingresa el asunto del correo..."
              required
            />

            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-neutral-200 mb-2">
                Contenido del Correo:
              </label>
              <textarea
                value={customContent}
                onChange={(e) => setCustomContent(e.target.value)}              placeholder="Ingresa el contenido del correo (HTML permitido)..."
                className="w-full h-40 p-3 border border-border-gray/60 dark:border-neutral-600 rounded-container-third bg-card-bg/40 dark:bg-neutral-800/30 backdrop-blur-md text-text-primary dark:text-neutral-200 focus:ring-2 focus:ring-custom-pink/40 focus:border-custom-pink/60 resize-vertical"
                required
              />
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-text-secondary dark:text-neutral-400">
                {recipients.length > 0 ? `Se enviará a ${recipients.length} destinatarios` : 'Selecciona destinatarios'}
              </div>
              <Button
                onClick={handleSendMassEmail}
                disabled={isSending || recipients.length === 0 || !customSubject.trim() || !customContent.trim()}
                className="min-w-[150px]"
              >
                {isSending ? 'Enviando...' : 'Enviar Correo Masivo'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Automated Reminders Section */}
        <Card title="Recordatorios Automáticos">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de Recordatorio:"
                name="reminderType"
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as typeof reminderType)}
                options={[
                  { value: 'voting', label: 'Recordatorio de Votación' },
                  { value: 'nomination', label: 'Recordatorio de Nominación' }
                ]}
              />
              
              <Input
                label="Días Restantes:"
                name="daysRemaining"
                type="number"
                min="1"
                max="30"
                value={daysRemaining}
                onChange={(e) => setDaysRemaining(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-container-second">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Vista Previa del Recordatorio:
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Asunto:</strong> Recordatorio: Período de {reminderType === 'voting' ? 'votación' : 'nominación'} - {daysRemaining} día(s) restante(s)
                <br />
                <strong>Destinatarios:</strong> {allUsers.length} usuarios
                <br />
                <strong>Contenido:</strong> Se enviará un recordatorio automático con la información del período activo.
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSendAutomatedReminder}
                disabled={isSending}
                variant="secondary"
                className="min-w-[200px]"
              >
                {isSending ? 'Enviando...' : 'Enviar Recordatorio Automático'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Non-Voters List */}
        {nonVoters.length > 0 && (
          <Card title={`Usuarios sin Votar (${nonVoters.length})`}>
            <div className="max-h-60 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {nonVoters.map(user => (
                  <div key={user.id} className="p-3 bg-gray-50 dark:bg-neutral-700 rounded-container-second">
                    <div className="font-medium text-text-primary dark:text-neutral-200">
                      {user.nombre} {user.apellidoPaterno}
                    </div>
                    <div className="text-xs text-text-secondary dark:text-neutral-400">
                      {user.email}
                    </div>
                    <div className="text-xs text-text-tertiary dark:text-neutral-500">
                      Bloque: {user.assignedBlock}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
};

export default AdminEmailManagementPage;
