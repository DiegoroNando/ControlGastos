import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation, useOutlet, Link } from 'react-router-dom';
import { SwitchTransition, CSSTransition } from 'react-transition-group';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ElectionProvider } from './contexts/ElectionContext';
import { ToastProvider } from './contexts/ToastContext';
import { Navbar, LoadingSpinner } from './components/common/CommonComponents';
import NetworkStatusIndicator from './components/common/NetworkStatusIndicator';
import RouteSecurityMiddleware from './components/common/RouteSecurityMiddleware';
import AuthPage from './pages/AuthPage';
import DashboardRouterPage from './pages/DashboardRouterPage';
import ViewCandidatesPage from './pages/ViewCandidatesPage';
import CandidatePublicProfilePage from './pages/CandidatePublicProfilePage';
import AdminPasswordSetupPage from './pages/admin/AdminPasswordSetupPage';
import { applyAutoOptimizations } from './services/performanceMonitor';
import { ROUTES, APP_NAME } from './constants';
import { initializeData } from './services/databaseService';
import { migrateFromLocalStorageToDatabase, isMigrationNeeded } from './services/migrationHelper';
import { initializeRouteSecurity } from './services/routeSecurityService';
import { UserRole } from './types';
import { ProfilePage } from './pages/ProfilePage';



const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-light-gray dark:bg-neutral-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.AUTH} state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};


const AppLayout: React.FC = () => {
  const location = useLocation();
  const currentOutlet = useOutlet();
  const nodeRef = React.useRef(null);
  const { currentUser } = useAuth();

  const isSuperAdminSection = currentUser?.role === UserRole.SUPERADMIN && location.pathname.startsWith(ROUTES.DASHBOARD);
  
  const contentAreaLayoutClasses = `flex-grow ${
    isSuperAdminSection ? '' : 'container mx-auto px-4 sm:px-6 lg:px-8'
  } py-8 relative z-10`;
  return (
    <div className="flex flex-col min-h-screen bg-light-bg dark:bg-dm-bg-main transition-colors duration-300">
      <Navbar />
      <div className="flex-grow flex flex-col relative">
        {/* SpectraUI Background Layer */}
        <div 
          className="absolute inset-0 bg-cover bg-fixed bg-center bg-no-repeat opacity-[0.03] dark:opacity-[0.02] pointer-events-none z-0"
          style={{ backgroundImage: 'url(https://picsum.photos/1920/1080?random&gravity=center&blur=3)' }}
        />
        
        {isSuperAdminSection ? (
          <main className="flex-grow relative z-10">
            {currentOutlet}
          </main>
        ) : (
          <main className={contentAreaLayoutClasses}>
            <SwitchTransition mode="out-in">
              <CSSTransition
                key={location.pathname} 
                nodeRef={nodeRef}       
                timeout={400}           
                classNames="spectra-page-transition"
                unmountOnExit
              >
                <div ref={nodeRef} className="spectra-page-wrapper">
                  {currentOutlet}
                </div>
              </CSSTransition>
            </SwitchTransition>
          </main>
        )}
      </div>
      
      {/* SpectraUI Footer */}
      <footer className="bg-white/35 dark:bg-dm-bg-main/35 border-t border-light-gray-alt/30 dark:border-accent-gold/20 text-text-tertiary dark:text-neutral-400 text-center p-5 backdrop-blur-md mt-auto relative z-10">
        <p className="text-xs font-medium">&copy; {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

interface AppProps {
  isMobile?: boolean;
}

function App({ isMobile = false }: AppProps) {
  // Estado eliminado para mayor rendimiento
  useEffect(() => {
    // Initialize route security system first
    initializeRouteSecurity();
    
    // Añadir clase para optimizaciones móviles
    if (isMobile) {
      document.documentElement.classList.add('mobile-device');
      console.log('📱 Aplicando optimizaciones para dispositivos móviles');
    }
    
    // Aplicar optimizaciones automáticas basadas en métricas
    window.addEventListener('load', () => {
      setTimeout(applyAutoOptimizations, 1000);
    });
    
    const initializeSystem = async () => {
      try {
        console.log('🚀 Starting system initialization (background)...');
        
        if (await isMigrationNeeded()) {
          console.log('📦 Migration from localStorage needed, starting migration...');
          const migrationResult = await migrateFromLocalStorageToDatabase();
          if (migrationResult.success) {
            console.log('✅ Migration completed successfully');
          } else {
            console.error('❌ Migration failed:', migrationResult.message);
          }
        } else {
          console.log('✅ No localStorage migration needed or already completed.');
        }
        
        await initializeData();
        console.log('DB Initialized/Ensured.');

      } catch (error) {
        console.error('❌ System initialization failed catastrophically:', error);
      } finally {
        // No longer setting isSystemInitialized
        console.log('🏁 System initialization process finished (background).');
      }
    };
      initializeSystem();
  }, []);
  
  // Directly render the app, AuthProvider will handle its own loading state
  return (
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>          <ElectionProvider>            <HashRouter>
              <NetworkStatusIndicator />
              <RouteSecurityMiddleware>
                <Routes>
                  <Route path={ROUTES.AUTH} element={<AuthPage />} />
                  <Route path={ROUTES.ADMIN_PASSWORD_SETUP} element={<AdminPasswordSetupPage />} />
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path={ROUTES.DASHBOARD + "/*"} element={<DashboardRouterPage />} />
                      <Route path={ROUTES.VIEW_CANDIDATES} element={<ViewCandidatesPage />} />
                      <Route path={ROUTES.CANDIDATE_PROFILE} element={<CandidatePublicProfilePage />} />
                      <Route path={ROUTES.CANDIDATE_POSTS} element={<CandidatePublicProfilePage />} />
                    </Route>
                    <Route path="*" element={
                      <div className="text-center py-20">
                        <h1 className="text-6xl font-bold text-text-tertiary dark:text-custom-gold">404</h1>
                        <p className="mt-4 text-xl text-text-secondary dark:text-neutral-400">Página No Encontrada</p>
                        <p className="mt-2 text-text-tertiary dark:text-neutral-400">La página que buscas no existe o fue movida.</p>
                        <Link to={ROUTES.DASHBOARD} className="text-custom-pink hover:underline mt-8 inline-block font-medium">Volver al inicio</Link>
                      </div>
                    } />
                  </Route>
                </Routes>
              </RouteSecurityMiddleware>
            </HashRouter>
          </ElectionProvider>
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
