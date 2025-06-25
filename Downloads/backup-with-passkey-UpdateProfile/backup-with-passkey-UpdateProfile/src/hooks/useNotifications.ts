import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { realTimeNotificationManager } from '../services/realTimeNotificationManager';

export interface Notification {
  id: string;
  type: 'candidacy_withdrawal' | 'voting_reminder' | 'nomination_reminder' | 'general';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  userData?: {
    nombre: string;
    apellidoPaterno: string;
    curp: string;
    assignedBlock: string;
  };
}

export const useNotifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Definir generateRealNotifications primero
  const generateRealNotifications = useCallback(async () => {
    try {
      const realNotifications: Notification[] = [];

      // Importar servicios necesarios dinámicamente para evitar dependencias circulares
      const { getUsers, getElectionSettings, getUsersWhoHaveNotVoted } = await import('../services/databaseService');
      
      // 1. Verificar retiros de candidatura recientes (últimos 7 días)
      const users = await getUsers();
      const recentWithdrawals = users.filter(user => 
        user.hasRevokedCandidacyPreviously
        // Para candidatos que retiraron recientemente, no tenemos timestamp específico
        // pero podemos mostrar todos los que han retirado su candidatura
      );

      recentWithdrawals.forEach(user => {
        realNotifications.push({
          id: `withdrawal-${user.curp}`,
          type: 'candidacy_withdrawal',
          title: 'Retiro de Candidatura',
          message: `${user.nombre} ${user.apellidoPaterno} ha retirado su candidatura del bloque ${user.assignedBlock}. Se requiere seguimiento administrativo para el oficio formal.`,
          timestamp: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000), // Simulado en últimos 7 días
          read: false,
          userData: {
            nombre: user.nombre,
            apellidoPaterno: user.apellidoPaterno,
            curp: user.curp,
            assignedBlock: user.assignedBlock
          }
        });
      });

      // 2. Verificar recordatorios de votación (si hay usuarios que no han votado)
      try {
        const usersWhoHaventVoted = await getUsersWhoHaveNotVoted();
        
        if (usersWhoHaventVoted.length > 0) {
          const electionSettings = await getElectionSettings();
          const votingEndDate = electionSettings?.votingPeriod?.endDate;
          const daysRemaining = votingEndDate ? 
            Math.ceil((new Date(votingEndDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : 0;

          realNotifications.push({
            id: `voting-reminder-${Date.now()}`,
            type: 'voting_reminder',
            title: 'Recordatorio de Votación',
            message: `${usersWhoHaventVoted.length} usuario${usersWhoHaventVoted.length !== 1 ? 's' : ''} aún no ha${usersWhoHaventVoted.length !== 1 ? 'n' : ''} votado. ${daysRemaining > 0 ? `Quedan ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}.` : 'El período termina pronto.'}`,
            timestamp: Date.now(),
            read: false
          });
        }
      } catch (error) {
        console.warn('No se pudieron obtener usuarios sin votar:', error);
      }

      // 3. Verificar recordatorios de nominación (si el período está activo)
      const electionSettings = await getElectionSettings();
      if (electionSettings?.nominationPeriod?.endDate) {
        const nominationEndDate = electionSettings.nominationPeriod.endDate;
        const daysRemaining = Math.ceil((new Date(nominationEndDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

        if (daysRemaining <= 3 && daysRemaining > 0) {
          realNotifications.push({
            id: `nomination-reminder-${Date.now()}`,
            type: 'nomination_reminder',
            title: 'Período de Nominaciones',
            message: `Quedan ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''} para el cierre de nominaciones de candidatos.`,
            timestamp: Date.now(),
            read: false
          });
        }
      }

      // 4. Verificar candidatos pendientes de elegibilidad
      const pendingCandidates = users.filter(user => 
        user.isRegisteredAsCandidate && 
        !user.isEligibleForVoting &&
        !user.hasRevokedCandidacyPreviously
      );

      if (pendingCandidates.length > 0) {
        realNotifications.push({
          id: `pending-eligibility-${Date.now()}`,
          type: 'general',
          title: 'Candidatos Pendientes de Elegibilidad',
          message: `${pendingCandidates.length} candidato${pendingCandidates.length !== 1 ? 's' : ''} requiere${pendingCandidates.length === 1 ? '' : 'n'} revisión de elegibilidad por parte del administrador.`,
          timestamp: Date.now(),
          read: false
        });
      }

      // 5. Verificar nuevos usuarios registrados que requieren atención
      const newUsers = users.filter(user => 
        !user.hasLoggedInOnce && 
        user.role !== UserRole.SUPERADMIN
      );

      if (newUsers.length > 0) {
        realNotifications.push({
          id: `new-users-${Date.now()}`,
          type: 'general',
          title: 'Nuevos Usuarios Registrados',
          message: `${newUsers.length} usuario${newUsers.length !== 1 ? 's' : ''} nuevo${newUsers.length !== 1 ? 's' : ''} se ha${newUsers.length !== 1 ? 'n' : ''} registrado y aún no ha${newUsers.length !== 1 ? 'n' : ''} iniciado sesión.`,
          timestamp: Date.now(),
          read: false
        });
      }

      // Ordenar por timestamp más reciente primero y limitar a máximo 10 notificaciones
      realNotifications.sort((a, b) => b.timestamp - a.timestamp);
      const limitedNotifications = realNotifications.slice(0, 10);
      
      setNotifications(limitedNotifications);

    } catch (error) {
      console.error('Error generating real notifications:', error);
      // En caso de error, mostrar notificación de error
      setNotifications([{
        id: `error-${Date.now()}`,
        type: 'general',
        title: 'Error del Sistema',
        message: 'No se pudieron cargar las notificaciones del sistema. Intente refrescar la página.',
        timestamp: Date.now(),
        read: false
      }]);
    }
  }, []);

  // Definir loadRealNotifications después de generateRealNotifications
  const loadRealNotifications = useCallback(async () => {
    // Solo cargar notificaciones reales para superadministradores
    if (currentUser?.role === UserRole.SUPERADMIN) {
      await generateRealNotifications();
    } else {
      // Para usuarios regulares, no cargar notificaciones de prueba
      setNotifications([]);
    }
  }, [currentUser, generateRealNotifications]);

  // Load notifications from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem(`notifications_${currentUser?.curp}`);
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
        setNotifications([]);
      }
    } else {
      // Load real notifications instead of default mock data
      loadRealNotifications();
    }
  }, [currentUser, loadRealNotifications]);
  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (currentUser?.curp && notifications.length > 0) {
      localStorage.setItem(`notifications_${currentUser.curp}`, JSON.stringify(notifications));
    }
  }, [notifications, currentUser]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
      timestamp: Date.now()
    };

    setNotifications(prev => [newNotification, ...prev]);
    return newNotification;
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    if (currentUser?.curp) {
      localStorage.removeItem(`notifications_${currentUser.curp}`);
    }
  }, [currentUser]);  const refreshNotifications = useCallback(async () => {
    if (currentUser?.role === UserRole.SUPERADMIN) {
      await generateRealNotifications();
    }
  }, [currentUser, generateRealNotifications]);

  // Register this hook with the real-time notification manager
  useEffect(() => {
    if (currentUser?.role === UserRole.SUPERADMIN) {
      realTimeNotificationManager.registerRefreshCallback(refreshNotifications);
      return () => {
        realTimeNotificationManager.unregisterRefreshCallback(refreshNotifications);
      };
    }
  }, [currentUser, refreshNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    refreshNotifications // Nueva función para refrescar notificaciones
  };
};
