import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import ThemeSwitcher from '../common/ThemeSwitcher';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { UserRole } from '../../types';

interface AdminSidebarProps {
  isOpen?: boolean;
  closeSidebar?: () => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const HomeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);


const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = false, closeSidebar = () => {} }) => {
  const { currentUser, logout } = useAuth(); 
  const location = useLocation();
  const { canAccess, isLoading } = useAdminPermissions(currentUser?.curp, currentUser?.role);
  
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .admin-sidebar-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      .admin-sidebar-scrollbar::-webkit-scrollbar-track {
        background: transparent;
        border-radius: 12px;
      }
      .admin-sidebar-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, rgba(97, 18, 50, 0.3), rgba(97, 18, 50, 0.6));
        border-radius: 12px;
        transition: all 0.3s ease;
      }
      .admin-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, rgba(97, 18, 50, 0.5), rgba(97, 18, 50, 0.8));
        transform: scaleY(1.1);
      }
      .dark .admin-sidebar-scrollbar::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, rgba(255, 183, 3, 0.2), rgba(255, 183, 3, 0.4));
      }
      .dark .admin-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, rgba(255, 183, 3, 0.4), rgba(255, 183, 3, 0.6));
      }
      .admin-sidebar-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(97, 18, 50, 0.3) transparent;
      }
      .dark .admin-sidebar-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 183, 3, 0.3) transparent;
      }
    `;
    if (!document.head.querySelector('#admin-sidebar-style')) {
      styleElement.id = 'admin-sidebar-style';
      document.head.appendChild(styleElement);
    }
  }, []);
  
  const baseAdminPath = ROUTES.DASHBOARD;
  // Enhanced navigation styles with hierarchical corner radius and theme-aware colors
  const navLinkClasses = "spectra-admin-btn flex items-center px-4 py-3.5 text-sm font-medium rounded-container-fourth transition-all duration-300 group hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm";
  const activeNavLinkClasses = "bg-gradient-to-r from-primary-maroon/15 to-primary-maroon/10 dark:from-accent-gold/20 dark:to-accent-gold/10 text-primary-maroon dark:text-accent-gold font-semibold shadow-spectra-sm border border-primary-maroon/20 dark:border-accent-gold/20 spectra-admin-btn active";
  const inactiveNavLinkClasses = "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-700/40 border border-transparent hover:border-slate-200/60 dark:hover:border-slate-600/40";

  const iconClasses = "mr-4 h-5 w-5 flex-shrink-0 transition-all duration-300";
  const activeIconClasses = "text-primary-maroon dark:text-accent-gold drop-shadow-sm";
  const inactiveIconClasses = "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:scale-110";
  // Define all menu items with their permission requirements
  const allMenuItems = [
    { 
      to: ROUTES.ADMIN_STATS, 
      label: 'Estadísticas', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /> ,
      section: 'statistics'
    },
    { 
      to: ROUTES.ADMIN_USERS, 
      label: 'Gestión de Usuarios', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> ,
      section: 'users'
    },
    { 
      to: ROUTES.ADMIN_BLOCKS, 
      label: 'Gestión de Bloques', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /> ,
      section: 'blocks'
    },
    { 
      to: ROUTES.ADMIN_WHITELIST, 
      label: 'Lista Blanca y Carga', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /> ,
      section: 'whitelist'
    },
    { 
      to: ROUTES.ADMIN_CALENDAR, 
      label: 'Calendario Electoral', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008z" /> ,
      section: 'calendar'
    },
    { 
      to: ROUTES.ADMIN_EMAILS, 
      label: 'Gestión de Correos', 
      icon: <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /> ,
      section: 'emails'
    },
    {
      to: ROUTES.ADMIN_SETTINGS,
      label: 'Configuración Admin',
      icon: <SettingsIcon />,
      section: 'settings'
    },
    { 
      to: ROUTES.DASHBOARD, 
      label: 'Volver al Dashboard', 
      icon: <HomeIcon />,
      section: null // No permission check needed for dashboard
    },
  ];

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    // Always show dashboard link
    if (!item.section) return true;
    
    // SuperAdmin sees everything
    if (currentUser?.role === UserRole.SUPERADMIN) return true;
    
    // For other users, check permissions (but don't wait for loading)
    if (isLoading) return false;
    
    return canAccess(item.section);
  });
  return (
    <>      {/* Enhanced Mobile Overlay - Visible en tablet y móvil cuando está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-md lg:hidden animate-fade-in"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
        {/* Sidebar Container - Hamburguesa en tablet/móvil, fija solo en desktop grande */}      <aside
        className={`fixed left-0 z-40 transform
                    ${isOpen ? 'translate-x-0 shadow-apple-xl' : '-translate-x-full'} 
                    lg:translate-x-0 lg:shadow-apple-lg 
                    w-[320px] lg:w-[300px]
                    bg-gradient-to-br from-card-bg/98 via-card-bg/95 to-gray-50/80 dark:from-neutral-800/98 dark:via-neutral-800/95 dark:to-neutral-700/80
                    backdrop-blur-xl border-r border-border-gray/30 dark:border-neutral-700/40
                    flex flex-col
                    transition-all duration-300 ease-apple
                    max-lg:h-screen lg:h-[calc(100vh-4.5rem)] max-h-screen
                    overflow-hidden
                    lg:top-[4.5rem] lg:bottom-0 max-lg:inset-y-0
                    ${isOpen ? 'animate-fade-in' : ''}`}
        aria-label="Barra lateral de administración"
        id="admin-sidebar"      >{/* Sidebar Header - Sin margen superior en desktop ya que la sidebar empieza debajo de la navbar */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-border-gray/30 dark:border-neutral-700/40 bg-gradient-to-r from-transparent via-gray-50/20 to-transparent dark:from-transparent dark:via-neutral-700/20 dark:to-transparent max-lg:mt-0">{/* Sin margen superior tanto en móvil como desktop */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-custom-pink to-custom-pink-hover dark:from-custom-gold dark:to-yellow-400 rounded-container-fourth flex items-center justify-center shadow-apple-sm">
              <SettingsIcon className="w-5 h-5 text-white dark:text-neutral-900" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text-primary dark:text-neutral-100">
                Panel Admin
              </h2>
              <p className="text-xs text-text-tertiary dark:text-neutral-400">
                {currentUser?.nombre}
              </p>
            </div>          </div>
          
          {/* Botón de cerrar para móvil */}
          <button
            onClick={closeSidebar}
            className="lg:hidden p-2 rounded-container-fourth text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-700/60 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-slate-300/40 dark:focus:ring-slate-600/40"
            aria-label="Cerrar menú"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>{/* Scrollable Content Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto admin-sidebar-scrollbar">
          {/* Navigation Container - Flexible with padding */}
          <div className="flex-1 p-6">
            <nav className="space-y-2">
              {menuItems.map((item, index) => {
                const fullPath = item.to === ROUTES.DASHBOARD && !item.to.includes(ROUTES.ADMIN_STATS) 
                  ? ROUTES.DASHBOARD 
                  : item.to === ROUTES.ADMIN_STATS 
                    ? baseAdminPath 
                    : `${baseAdminPath}/${item.to}`.replace(/\/+/g, '/');
                  
                const isActive = 
                  item.to === ROUTES.DASHBOARD && !item.to.includes(ROUTES.ADMIN_STATS)
                    ? false 
                    : item.to === ROUTES.ADMIN_STATS 
                      ? (location.pathname === baseAdminPath || location.pathname === `${baseAdminPath}/`)
                      : location.pathname.startsWith(fullPath) && (location.pathname === fullPath || location.pathname.startsWith(`${fullPath}/`));
                
                const showSeparator = item.to === ROUTES.DASHBOARD && !item.to.includes(ROUTES.ADMIN_STATS);
              
              return (
                <React.Fragment key={item.label}>
                  {showSeparator && (
                    <div className="flex items-center my-6">
                      <div className="flex-1 border-t border-gradient-to-r from-transparent via-border-gray/40 to-transparent dark:from-transparent dark:via-neutral-700/40 dark:to-transparent"></div>
                      <span className="px-3 text-xs font-medium text-text-tertiary dark:text-neutral-500 uppercase tracking-wider">
                        Navegación
                      </span>
                      <div className="flex-1 border-t border-gradient-to-r from-transparent via-border-gray/40 to-transparent dark:from-transparent dark:via-neutral-700/40 dark:to-transparent"></div>
                    </div>
                  )}
                  <NavLink
                    to={fullPath}
                    end={item.to === ROUTES.ADMIN_STATS || item.to === ROUTES.ADMIN_SETTINGS}
                    onClick={closeSidebar}
                    className={({isActive: linkActive}) => `
                      ${navLinkClasses} 
                      ${(linkActive && !showSeparator) ? activeNavLinkClasses : inactiveNavLinkClasses}
                      ${showSeparator ? 'hover:bg-custom-pink/10 dark:hover:bg-custom-gold/10 hover:text-custom-pink dark:hover:text-custom-gold font-medium' : ''}
                      ${linkActive && !showSeparator ? 'transform translate-x-1 shadow-apple-md' : ''}
                    `}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={1.5} 
                      stroke="currentColor" 
                      className={`
                        ${iconClasses} 
                        ${isActive && !showSeparator ? activeIconClasses : inactiveIconClasses}
                        ${showSeparator ? 'text-text-tertiary group-hover:text-custom-pink dark:group-hover:text-custom-gold group-hover:scale-110' : ''}
                      `}
                    >
                      {item.icon}
                    </svg>
                    <span className="truncate">{item.label}</span>
                    {(isActive && !showSeparator) && (
                      <div className="ml-auto w-2 h-2 bg-custom-pink dark:bg-custom-gold rounded-full shadow-sm"></div>
                    )}
                  </NavLink>
                </React.Fragment>
              );              })}
            </nav>
          </div>
          
          {/* Bottom Section dentro del área scrolleable */}
          <div className="p-6 pt-0 space-y-4">
            {/* Separador visual */}
            <div className="border-t border-gradient-to-r from-transparent via-border-gray/40 to-transparent dark:from-transparent dark:via-neutral-700/40 dark:to-transparent"></div>
            
            {/* Theme Switcher Container */}
            <div className="flex justify-center">
              <div className="bg-gray-50/60 dark:bg-neutral-700/40 rounded-container-third p-3 backdrop-blur-sm border border-border-gray/30 dark:border-neutral-600/30">
                <ThemeSwitcher />
              </div>
            </div>
            
            {/* Logout Button */}
            <NavLink
              to={ROUTES.AUTH}
              onClick={() => {
                logout();
                closeSidebar();
              }}
              className={`${navLinkClasses} ${inactiveNavLinkClasses} group !text-slate-500 dark:!text-slate-400 hover:!bg-gradient-to-r hover:!from-red-100/60 hover:!to-red-50/40 dark:hover:!from-red-900/30 dark:hover:!to-red-800/20 hover:!text-red-600 dark:hover:!text-red-400 hover:!border-red-200/50 dark:hover:!border-red-700/50 w-full justify-center font-medium transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:ring-offset-2 focus:ring-offset-neutral-800`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className={`${iconClasses} ${inactiveIconClasses} group-hover:!text-red-600 dark:group-hover:!text-red-400 group-hover:scale-110 transition-all duration-300`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Cerrar Sesión
            </NavLink>
            
            {/* Padding inferior para evitar que se oculte detrás del footer */}
            <div className="h-16"></div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
