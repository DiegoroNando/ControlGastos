import React, { useRef } from 'react'; 
import { Routes, Route, useLocation, useOutlet } from 'react-router-dom'; 
import { SwitchTransition, CSSTransition } from 'react-transition-group';
import { Alert } from '../components/common/CommonComponents';
import AdminSidebar from '../components/admin/AdminSidebar';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { ROUTES } from '../constants';

// Import admin section pages
import AdminStatisticsPage from './admin/AdminStatisticsPage';
import AdminUserManagementPage from './admin/AdminUserManagementPage';
import AdminBlockManagementPage from './admin/AdminBlockManagementPage';
import AdminElectionCalendarPage from './admin/AdminElectionCalendarPage';
import AdminWhitelistPage from './admin/AdminWhitelistPage';
import AdminEmailManagementPage from './admin/AdminEmailManagementPage';
import AdminSettingsPage from './admin/AdminSettingsPage';

const SuperAdminDashboardContent: React.FC = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const nodeRef = useRef<HTMLDivElement>(null);
  
  const currentAdminPageOutlet = useOutlet();

  if (!currentUser || currentUser.role !== UserRole.SUPERADMIN) {
    return <Alert type="error" title="Acceso Denegado" message="Esta área es solo para Superadministradores." />;
  }
  return (
    <div className="flex flex-col md:flex-row w-full min-h-[calc(100vh-4rem)] relative">
      {/* SpectraUI Background Layer */}
      <div className="spectra-background-layer"></div>

      {/* Sidebar Component - Visible solo en desktop y controlada por hamburger en móvil */}
      <div className="relative z-20 hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main Content Area - Con margen para la sidebar solo en desktop grande */}
      <main 
        id="admin-content-area" 
        className="flex-grow p-4 sm:p-6 lg:p-6 overflow-y-auto relative z-10 lg:ml-[300px] transition-all duration-300"
      >
        <SwitchTransition mode="out-in">
          <CSSTransition
            key={location.pathname} 
            nodeRef={nodeRef}       
            timeout={500}           
            classNames="admin-page-transition"
            unmountOnExit
          >
            <div ref={nodeRef} className="admin-page-wrapper max-w-7xl mx-auto">
              {currentAdminPageOutlet}
            </div>
          </CSSTransition>
        </SwitchTransition>
      </main>
    </div>
  );
};

const SuperAdminRoutesWrapper: React.FC = () => {
  return (
    <Routes>
      <Route element={<SuperAdminDashboardContent />}>
        <Route index element={<AdminStatisticsPage />} />
        <Route path={ROUTES.ADMIN_USERS} element={<AdminUserManagementPage />} />
        <Route path={ROUTES.ADMIN_BLOCKS} element={<AdminBlockManagementPage />} />
        <Route path={ROUTES.ADMIN_CALENDAR} element={<AdminElectionCalendarPage />} />
        <Route path={ROUTES.ADMIN_WHITELIST} element={<AdminWhitelistPage />} />
        <Route path={ROUTES.ADMIN_EMAILS} element={<AdminEmailManagementPage />} />
        <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettingsPage />} />
        <Route path="*" element={
            <div className="text-center py-10">
                <h2 className="text-2xl font-semibold text-text-primary dark:text-custom-gold">Sección No Encontrada</h2>
                <p className="text-text-secondary dark:text-neutral-400 mt-2">La sección de administrador que buscas no existe.</p>
            </div>
        } />
      </Route>
    </Routes>
  );
};

export default SuperAdminRoutesWrapper;
