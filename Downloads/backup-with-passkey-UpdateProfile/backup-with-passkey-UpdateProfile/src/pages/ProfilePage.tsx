import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import ProfileSidebar from '../components/NewProfileP/ProfileSidebar';
import CardsContainer from '../components/NewProfileP/CardsContainer';
import CursosSection from '../components/NewProfileP/CursosSection';
import QuickLinks from '../components/NewProfileP/QuickLinks';
import RightSidePanel from '../components/NewProfileP/RightSidePanel';
import AIChatbot from '../components/NewProfileP/AIChatbot';

export function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Close sidebar when screen becomes desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50 relative">
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}      {/* Mobile menu button */}
      <div className="md:hidden flex justify-between items-center p-4 bg-white shadow-sm">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-gray-100 rounded-md shadow-sm hover:bg-gray-200 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <span className="text-lg font-semibold text-gray-800">Perfil</span>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>      {/* Sidebar */}
      <ProfileSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 overflow-hidden"> 
        <div className="bg-[#D4CFCD] shadow min-h-screen p-4 md:p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left main content */}
            <div className="flex-1 lg:w-1/2 space-y-6">{/* Cards Container */}
              <CardsContainer />

              {/* Quick Links */}
              <QuickLinks />        
              
              {/* Cursos Section */}
              <CursosSection />
              
              {/* Buzón and Listado Banner */}
              <div className="w-full">
                <img
                  src="buzonlistado.jpg"
                  alt="Buzón y Listado"
                  className="w-full h-auto object-cover rounded-xl"
                />
              </div>            </div>
            
            {/* Right side content */}
            <div className="flex-1 lg:w-1/2 space-y-4">
              <RightSidePanel />
            </div>
          </div>
        </div>
      </div>
      <AIChatbot />
    </div>
  );
}
