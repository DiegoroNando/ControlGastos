import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Edit2, Save, XCircle } from 'lucide-react';



interface NavItem {
  label: string;
  progress: number;
}
interface ProcessItem {
  label: string;
  color: string;
}
interface ProfileSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface ProfileData {
  personalData: {
    nombre: string;
    genero: string;
    edad: string;
    curp: string;
    rfc: string;
    telefono: string;
    email: string;
  };
  education: {
    nivel: string;
    carrera: string;
    institucion: string;
    egreso: string;
    cedula: string;
    estudiosAdicionales: string;
  };
  experience: {
    cargo: string;
    escuela: string;
    grado: string;
    turno: string;
    anos: string;
    funcion: string;
    zona: string;
  };
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    personalData: {
      nombre: 'Camila Miller Ponce',
      genero: 'Femenino',
      edad: '32 años',
      curp: 'MIPC920315MMCLMR04',
      rfc: 'MIPC920315ABC',
      telefono: '+52 555 123 4567',
      email: 'camila.miller@educacion.gob.mx'
    },
    education: {
      nivel: 'Licenciatura',
      carrera: 'Educación Primaria',
      institucion: 'Escuela Normal Superior',
      egreso: '2015',
      cedula: '12345678',
      estudiosAdicionales: 'Maestría en Educación (En proceso)'
    },
    experience: {
      cargo: 'Maestra de Primaria',
      escuela: 'Primaria "Benito Juárez"',
      grado: '4° Grado',
      turno: 'Matutino',
      anos: '8 años',
      funcion: 'Docente Frente a Grupo',
      zona: 'Zona 45 - Sector VIII'
    }
  });

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    if (isEditMode) {
      // If canceling edit, you might want to reset to original data
      // For now, we'll just exit edit mode
    }
  };

  const handleSaveChanges = () => {
    setIsEditMode(false);
    // Here you would typically save to a backend/database
    console.log('Profile data saved:', profileData);
  };

  const handleInputChange = (section: keyof ProfileData, field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };
  const navItems: NavItem[] = [
    { label: 'Datos Personales', progress: 86 },
    { label: 'Nivel Educativo', progress: 65 },
    { label: 'Experiencia Profesional', progress: 85 }
  ];
  const processItems: ProcessItem[] = [
    { label: 'A', color: 'bg-red-500' },
    { label: 'R', color: 'bg-yellow-500' },
    { label: 'P', color: 'bg-amber-500' }
  ];

  // Close sidebar when window resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <>
      {/* Backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setSidebarOpen(false)} />}      {/* Mobile header */}
      {/* <div className="md:hidden flex justify-between items-center p-4 shadow-sm" style={{ backgroundColor: '#EEF0F3' }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
          <Menu className="w-6 h-6 text-gray-700" />
        </button>
        <span className="text-lg font-semibold text-gray-800">Perfil</span>
        <div className="w-10" />
      </div>      Sidebar container */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out rounded-tr-xl shadow-lg md:relative md:translate-x-0 md:block ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ width: '318px', backgroundColor: '#EEF0F3' }}>{/* Mobile close */}
        <div className="flex justify-end p-4 md:hidden">
          <button onClick={() => setSidebarOpen(false)} className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
            <X className="w-6 h-6 text-gray-700" />
          </button>
        </div>        {/* Profile header */}
        <div className="w-full h-64 relative flex items-center justify-center" style={{ 
          backgroundImage: 'url(public/cin.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          // clipPath: 'polygon(0 0, 100% 0, 100% 100%, 60% 100%, 50% 80%, 0% 80%, 0 100%)'
        }}>
            <div className="text-center relative">
            <div className="w-24 h-24 mx-auto relative">
              {/* Background frame image */}
              <img 
                src="F75 1.png"
                alt="Profile Frame" 
                className="w-full h-full object-contain absolute inset-0"
              />
              {/* Profile image */}
              <div className="absolute inset-2 rounded-full overflow-hidden">
                <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80" alt="Profile" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="mt-2 text-gray-200 uppercase text-sm">Lic.</div>
            <div className="font-semibold text-white">Camila Miller Ponce</div>
              {/* Contacto with edit icon - Below name, positioned to the right */}
            <div className="absolute -bottom-10 -right-8 sm:-right-14">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm sm:text-sm font-medium">Contacto</span>
                <button 
                  onClick={handleEditToggle}
                  className={`p-1 sm:p-1.5 rounded-lg transition-colors ${
                    isEditMode 
                      ? 'bg-red-500/20 hover:bg-red-500/30' 
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  {isEditMode ? (
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  ) : (
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* PERFIL Title - In white background area */}
        <div className="px-4 pb-2">
          <h2 className="text-gray-800 font-bold text-lg tracking-wide">PERFIL</h2>
        </div>        {/* Navigation */}
        <nav className="mt-4 px-4">
          <ul className="space-y-4">
            {navItems.map(item => (
              <li key={item.label} className="space-y-2">                <button onClick={() => setActiveSection(activeSection === item.label ? null : item.label)} className="w-full flex items-center justify-between text-left">                  <div className="flex items-center space-x-2">
                    {item.label === 'Datos Personales' && (
                      <img src="public/ic-01.svg" alt="Datos Personales Icon" className="w-5 h-5" />
                    )}
                    {item.label === 'Nivel Educativo' && (
                      <img src="public/ic-02.svg" alt="Nivel Educativo Icon" className="w-5 h-5" />
                    )}
                    {item.label === 'Experiencia Profesional' && (
                      <img src="public/ic-03.svg" alt="Experiencia Profesional Icon" className="w-5 h-5" />
                    )}
                    
                    <span className="text-gray-700 font-medium text-sm">{item.label}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transform transition-transform ${activeSection === item.label ? 'rotate-180' : ''}`} />
                  </div>
                  <span className="text-pink-600 font-semibold text-sm">{item.progress}%</span>
                </button>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${item.progress}%` }} />
                </div>                {/* Dropdown Content */}
                {activeSection === item.label && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border-l-3 border-pink-500 max-w-full overflow-hidden">                    {activeSection === 'Datos Personales' && (
                      <div className="space-y-3">
                        {/* Grid layout matching the image - 2 columns, 3 rows with individual cards */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Row 1: Nombre and CURP */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Nombre</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.personalData.nombre}
                                onChange={(e) => handleInputChange('personalData', 'nombre', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">
                                {profileData.personalData.nombre}
                              </div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">CURP</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.personalData.curp}
                                onChange={(e) => handleInputChange('personalData', 'curp', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800 break-all">
                                {profileData.personalData.curp}
                              </div>
                            )}
                          </div>

                          {/* Row 2: Número de contacto and Email */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Número de contacto</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.personalData.telefono}
                                onChange={(e) => handleInputChange('personalData', 'telefono', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">
                                {profileData.personalData.telefono}
                              </div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Email</label>
                            {isEditMode ? (
                              <input
                                type="email"
                                value={profileData.personalData.email}
                                onChange={(e) => handleInputChange('personalData', 'email', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800 break-all">
                                {profileData.personalData.email}
                              </div>
                            )}
                          </div>

                          {/* Row 3: Consideraciones Particulares and Fecha de Nacimiento */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Consideraciones Particulares</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value="Ninguna"
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">
                                Ninguna
                              </div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Fecha de Nacimiento</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value="17 Diciembre 1985"
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">
                                17 Diciembre 1985
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}                      {activeSection === 'Nivel Educativo' && (
                      <div className="space-y-3">
                        {/* Grid layout for education fields - 2 columns with individual cards */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Row 1: Nivel and Carrera */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Nivel</label>
                            {isEditMode ? (
                              <select
                                value={profileData.education.nivel}
                                onChange={(e) => handleInputChange('education', 'nivel', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              >
                                <option value="Licenciatura">Licenciatura</option>
                                <option value="Maestría">Maestría</option>
                                <option value="Doctorado">Doctorado</option>
                                <option value="Técnico">Técnico</option>
                              </select>
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.education.nivel}</div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Carrera</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.education.carrera}
                                onChange={(e) => handleInputChange('education', 'carrera', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.education.carrera}</div>
                            )}
                          </div>

                          {/* Row 2: Institución and Egreso */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Institución</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.education.institucion}
                                onChange={(e) => handleInputChange('education', 'institucion', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.education.institucion}</div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Egreso</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.education.egreso}
                                onChange={(e) => handleInputChange('education', 'egreso', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.education.egreso}</div>
                            )}
                          </div>

                          {/* Row 3: Cédula and Estudios Adicionales */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Cédula</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.education.cedula}
                                onChange={(e) => handleInputChange('education', 'cedula', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.education.cedula}</div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Estudios Adicionales</label>
                            {isEditMode ? (
                              <textarea
                                value={profileData.education.estudiosAdicionales}
                                onChange={(e) => handleInputChange('education', 'estudiosAdicionales', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1 resize-none"
                                rows={2}
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.education.estudiosAdicionales}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                      {activeSection === 'Experiencia Profesional' && (
                      <div className="space-y-3">
                        {/* Grid layout for experience fields - 2 columns with individual cards */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* Row 1: Cargo and Escuela */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Cargo</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.experience.cargo}
                                onChange={(e) => handleInputChange('experience', 'cargo', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.experience.cargo}</div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Escuela</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.experience.escuela}
                                onChange={(e) => handleInputChange('experience', 'escuela', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.experience.escuela}</div>
                            )}
                          </div>

                          {/* Row 2: Grado and Turno */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Grado</label>
                            {isEditMode ? (
                              <select
                                value={profileData.experience.grado}
                                onChange={(e) => handleInputChange('experience', 'grado', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              >
                                <option value="1° Grado">1° Grado</option>
                                <option value="2° Grado">2° Grado</option>
                                <option value="3° Grado">3° Grado</option>
                                <option value="4° Grado">4° Grado</option>
                                <option value="5° Grado">5° Grado</option>
                                <option value="6° Grado">6° Grado</option>
                              </select>
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.experience.grado}</div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Turno</label>
                            {isEditMode ? (
                              <select
                                value={profileData.experience.turno}
                                onChange={(e) => handleInputChange('experience', 'turno', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              >
                                <option value="Matutino">Matutino</option>
                                <option value="Vespertino">Vespertino</option>
                                <option value="Nocturno">Nocturno</option>
                              </select>
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.experience.turno}</div>
                            )}
                          </div>

                          {/* Row 3: Años and Función */}
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Años</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.experience.anos}
                                onChange={(e) => handleInputChange('experience', 'anos', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.experience.anos}</div>
                            )}
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Función</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.experience.funcion}
                                onChange={(e) => handleInputChange('experience', 'funcion', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.experience.funcion}</div>
                            )}
                          </div>

                          {/* Row 4: Zona (spanning full width) */}
                          <div className="bg-white rounded-lg p-3 shadow-sm col-span-2">
                            <label className="text-gray-400 text-xs font-medium block mb-1">Zona</label>
                            {isEditMode ? (
                              <input
                                type="text"
                                value={profileData.experience.zona}
                                onChange={(e) => handleInputChange('experience', 'zona', e.target.value)}
                                className="w-full text-sm font-medium text-gray-800 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-pink-500 rounded px-1 py-1"
                              />
                            ) : (
                              <div className="text-sm font-medium text-gray-800">{profileData.experience.zona}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
        {/* Processes and mode buttons */}
        <div className="mt-8 px-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Procesos</h3>
          <div className="flex space-x-3">
            {processItems.map(item => (
              <div key={item.label} className={`${item.color} w-10 h-10 rounded-full text-white flex items-center justify-center cursor-pointer transform hover:scale-105 transition-transform`}>{item.label}</div>
            ))}
          </div>
        </div>        <div className="mt-8 px-4 space-y-3">
          <button className="w-full px-4 py-2 bg-gray-200 rounded-lg text-gray-800 font-medium hover:bg-gray-300 transition-colors">Modo Claro</button>
          <button className="w-full px-4 py-2 bg-gray-800 rounded-lg text-white font-medium hover:bg-gray-700 transition-colors">Modo Oscuro</button>
        </div>
        
        {/* Save Button - Only shown in edit mode */}
        {isEditMode && (
          <div className="mt-4 px-4">
            <button 
              onClick={handleSaveChanges}
              className="w-full px-4 py-2 bg-green-500 rounded-lg text-white font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        )}
        
        <div className="mt-6 px-4 pb-4">
          <button className="w-full px-4 py-2 bg-red-500 rounded-lg text-white font-medium hover:bg-red-600 transition-colors">Cerrar sesión</button>
        </div>
        
       
      </aside>
    </>
  );
};

export default ProfileSidebar;
