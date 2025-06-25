import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/CommonComponents';
import { ROUTES } from '../../constants';
import { useNavigate } from 'react-router-dom';
import { User } from '../../types';

interface WelcomePageProps {
  onContinue?: () => void;
  registeredUser?: User | null; // Add prop for registered user data
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onContinue, registeredUser }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Animate in the content after component mounts
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      // User is logged in, navigate to dashboard
      navigate(ROUTES.DASHBOARD);
    }
  };
  const getUserName = () => {
    // Use registered user data if available, otherwise fall back to current user
    const user = registeredUser || currentUser;
    if (user?.nombre) {
      return `${user.nombre} ${user.apellidoPaterno || ''}`.trim();
    }
    return 'Estimado usuario';
  };
  // If no user data is available at all, redirect to login
  if (!registeredUser && !currentUser) {
    console.warn('WelcomePage: No user data found, redirecting to login');
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-maroon via-primary-maroon-hover to-primary-maroon-darker dark:from-accent-gold dark:via-accent-gold-hover dark:to-accent-gold-darker flex items-center justify-center p-4">
      {/* Background decoration elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-10 w-32 h-32 bg-white/15 rounded-full blur-2xl"></div>
      </div>

      <div className={`w-full max-w-6xl mx-auto transition-all duration-1000 ease-out transform ${
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        
        <div className="bg-white/95 dark:bg-neutral-800/95 backdrop-blur-lg rounded-container-second shadow-2xl border border-white/50 dark:border-neutral-700/60 overflow-hidden">
          
          <div className="grid lg:grid-cols-2 gap-0 items-center min-h-[600px]">
            
            {/* Left Column - Welcome Message */}
            <div className="p-8 lg:p-12 space-y-6">
              
              {/* Header with institutional branding */}
              <div className="text-center lg:text-left">
                <div className="inline-block px-4 py-2 bg-primary-maroon/10 dark:bg-accent-gold/10 rounded-full mb-4">
                  <p className="text-sm font-medium text-primary-maroon dark:text-accent-gold uppercase tracking-wide">
                    Bienvenida del Titular de la USICAMM
                  </p>
                </div>
                
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Compañeras y compañeros de la USICAMM
                </h1>
                
                <div className="w-16 h-1 bg-gradient-to-r from-primary-maroon to-accent-gold mx-auto lg:mx-0 rounded-full mb-6"></div>
              </div>

              {/* Personalized welcome message */}
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p className="text-base leading-relaxed">
                  Les doy la más cordial bienvenida al nuevo sistema institucional, una plataforma que representa un paso firme hacia la modernización tecnológica de nuestra Unidad. Pero más allá de lo técnico, este avance refleja nuestro compromiso con una gestión pública más eficiente, transparente y, sobre todo, centrada en las personas.
                </p>

                <p className="text-base leading-relaxed font-medium text-primary-maroon dark:text-accent-gold">
                  <strong>Sabemos que modernizar no es solo digitalizar.</strong>
                </p>

                <p className="text-base leading-relaxed">
                  Modernizar es poner la tecnologia al servicio de los derechos del magisterio, para que cada proceso sea más claro, ágil y justo. Esta nueva herramienta busca precisamente eso: facilitar su trabajo diario, fortalecer la colaboración entre áreas y garantizar que la carrera de las maestras y los maestros esté respaldada por procedimientos ordenados, legales y accesibles.
                </p>

                <p className="text-base leading-relaxed">
                  Esté sistemá ha sido diseñado para ustedes, pará que opérarlo sea más sencillo, para que las respuestas lleguen más rápido y para que podamos servir mejor a quienes están en el aula, construyendo futuro todos los dias.
                </p>
              </div>

              {/* Personal greeting */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  ¡Bienvenido/a, {getUserName()}!
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gracias por su compromiso y por ser parte activa de esta transformación.
                </p>
              </div>

              {/* Signature */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">Lic. Mario Rafael Llergo Latourniere</p>
                  <p className="text-gray-600 dark:text-gray-400">Llergo Latourniere</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                    Modernización con justicia, dignidad y sentido humano
                  </p>
                </div>
              </div>

              {/* Continue Button */}
              <div className="pt-4">
                <Button
                  onClick={handleContinue}
                  size="md"
                  variant="primary"
                  className="min-w-[200px]"
                >
                  Continuar al Sistema
                </Button>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative h-full min-h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 lg:rounded-r-container-second overflow-hidden">
              
              {/* Decorative elements */}
              <div className="absolute inset-0">
                <div className="absolute top-10 right-10 w-32 h-32 bg-primary-maroon/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-20 left-10 w-40 h-40 bg-accent-gold/10 rounded-full blur-3xl"></div>
              </div>

              {/* Main image */}
              <div className="relative z-10 h-full flex items-center justify-center p-8">
                <div className="max-w-md w-full">                  <img
                    src="/ye.png"
                    alt="Bienvenida del Sistema"
                    className="w-full h-auto object-contain drop-shadow-2xl"
                    style={{
                      filter: 'drop-shadow(0 20px 60px rgba(0, 0, 0, 0.15))'
                    }}
                  />
                </div>
              </div>

              {/* Decorative corner element */}
              <div className="absolute top-6 right-6">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-maroon to-accent-gold rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom institutional information */}
        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm">
            Sistema Institucional de Gestión • Modernización Tecnológica
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
