import React, { useState, useEffect } from 'react';
import { User, CandidateBlock, ALL_CANDIDATE_BLOCKS, UserRole, AreaDepartamentoDireccion, ALL_AREA_DEPARTAMENTO_DIRECCION, UserSex, ALL_USER_SEX, EducationalLevel, ALL_EDUCATIONAL_LEVELS, EligibilityAnswers, EligibilityCriterionKey } from '../../types';
import { Input, Button, Select, FileUploadInput, Card } from '../common/CommonComponents';
import { EligibilityChecksAdminView } from './EligibilityChecksAdminView';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DEFAULT_PROFILE_PIC_BASE_URL, SUPERADMIN_INITIAL_DATA, EMAIL_REGEX, SUPERADMIN_CURP } from '../../constants';
import { updateUser as updateStorageUser, isWhitelisted } from '../../services/databaseService';
import { extractDateOfBirthFromCURP } from '../../utils/curpUtils';

// --- Icons (Simplified SVGs for brevity) ---
const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 spectra-icon-primary">
    <path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v.01a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2zM5.636 4.136a.75.75 0 011.06 0l.071.071a.75.75 0 01-1.06 1.06l-.071-.07a.75.75 0 010-1.061zm9.192 0a.75.75 0 010 1.06l-.07.071a.75.75 0 11-1.06-1.06l.07-.071a.75.75 0 011.06 0zm-9.192 9.192a.75.75 0 011.06 0l.071.07a.75.75 0 01-1.06 1.061l-.071-.071a.75.75 0 010-1.06zm9.192 0a.75.75 0 010 1.06l-.07.071a.75.75 0 11-1.06-1.06l.07-.07a.75.75 0 011.06 0zM2 10a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm15 0a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H17.75A.75.75 0 0117 10zm-7 5a.75.75 0 01.75-.75h.01a.75.75 0 010 1.5H10.75A.75.75 0 0110 15zm0-1.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm0-3.75a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
    <path d="M4 9.5a2.5 2.5 0 115 0 2.5 2.5 0 01-5 0zm8.5-.5a.5.5 0 000 1h.5a.5.5 0 000-1h-.5zM4.5 12a.5.5 0 000 1h8a.5.5 0 000-1h-8z" />
  </svg>
);
const EducationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 spectra-icon-primary">
    <path d="M10.362 3.234a1.25 1.25 0 00-1.932 0 1.56 1.56 0 00-.324.566l-.67 3.542a.75.75 0 001.43.27l.169-.893a1.561 1.561 0 013.048 0l.17.893a.75.75 0 001.43-.271l-.67-3.542a1.56 1.56 0 00-.324-.566zM5.25 7.632c.067.01.133.024.2.04l.816.192a2.312 2.312 0 001.308-.11l1.037-.519a1.063 1.063 0 011.21-.019l1.036.519a2.312 2.312 0 001.309.11l.815-.192c.068-.016.134-.03.2-.04A2.313 2.313 0 0015 5.687V12.5a2.25 2.25 0 01-2.25 2.25h-1.5v.625a.75.75 0 01-1.5 0v-.625H8.75v.625a.75.75 0 01-1.5 0v-.625h-1.5A2.25 2.25 0 013.5 12.5V5.687c0-.78.416-1.49 1.042-1.933.1-.068.206-.129.317-.18.05-.024.1-.046.15-.067a.75.75 0 01.241-.008z" />
  </svg>
);
const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 spectra-icon-primary">
    <path fillRule="evenodd" d="M4 4.5A2.5 2.5 0 016.5 2h7A2.5 2.5 0 0116 4.5v.25a.75.75 0 01-1.5 0v-.25A1 1 0 0013.5 3h-7a1 1 0 00-1 1v.25a.75.75 0 01-1.5 0v-.25zm.22 3.28a.75.75 0 001.06 1.06L7 7.06v7.88a.75.75 0 001.5 0V7.06l1.22 1.22a.75.75 0 001.06-1.06l-2.5-2.5a.75.75 0 00-1.06 0l-2.5 2.5zM14.5 9a.5.5 0 000-1h-3a.5.5 0 000 1h3z" clipRule="evenodd" />
    <path d="M3 9.5a2.5 2.5 0 012.201-2.472L3.72 5.558a.75.75 0 011.06-1.061l1.5 1.5A.75.75 0 016.5 6.5V15a2.5 2.5 0 002.5 2.5h3A2.5 2.5 0 0014.5 15V6.5a.75.75 0 01.22-.53l1.5-1.5a.75.75 0 011.061 1.06L15.299 7.028A2.5 2.5 0 0117.5 9.5V15a4 4 0 01-4 4h-3a4 4 0 01-4-4V9.5z"/>
  </svg>
);
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-white">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);
// --- End Icons ---

interface DataItemProps {
  label: string;
  value: string | undefined | null;
  noTruncate?: boolean;
  isMultiline?: boolean;
}
const DataItem: React.FC<DataItemProps> = ({ label, value, noTruncate, isMultiline }) => {
  // Don't render if value is empty, null, undefined, or would show "N/A"
  if (!value || value.trim() === '') {
    return null;
  }
  
  return (
    <div>
      <p className="text-xs text-text-tertiary dark:text-neutral-500 mb-0.5">{label}</p>
      <p className={`text-sm font-medium text-text-primary dark:text-neutral-200 spectra-card bg-light-gray/20 dark:bg-neutral-700/30 backdrop-blur-md rounded-container-fourth px-3 py-1.5 inline-block w-full text-left ${!noTruncate ? 'truncate' : ''} ${isMultiline ? 'whitespace-pre-line min-h-[40px]' : ''}`}>
        {value}
      </p>
    </div>
  );
};

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}
const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children }) => (
  <div className="spectra-card bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-md shadow-spectra-md rounded-container-third p-5">
    <div className="flex items-center mb-4">
      {icon}
      <h3 className="ml-3 text-lg font-semibold text-text-primary dark:text-neutral-100">{title}</h3>
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-5">
      {children}
    </div>
  </div>
);

interface ProfileCardProps {
  user: User;
  onEdit?: () => void;
  isPublicView?: boolean; // When true, sensitive information will be hidden
}
export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onEdit, isPublicView = false }) => {
  const profilePic = user.profilePicUrl || `${DEFAULT_PROFILE_PIC_BASE_URL}${encodeURIComponent(user.nombre + ' ' + user.apellidoPaterno)}`;
  
  const userFullName = `${user.nombre} ${user.apellidoPaterno} ${user.apellidoMaterno}`;  const birthDateFormatted = user.fechaNacimiento 
    ? new Date(user.fechaNacimiento + 'T00:00:00Z').toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
    : 'N/A';

  return (    <div className="w-full spectra-card bg-gradient-card-light dark:bg-gradient-card-dark rounded-container-second shadow-spectra-lg overflow-hidden">
      {/* Header with SpectraUI gradient */}
      <div className="bg-gradient-primary-light dark:bg-gradient-primary-dark p-6 pb-16 rounded-t-xl relative text-white text-center">
        <span className="absolute top-4 right-4 text-sm font-semibold">N11</span> {/* Static from image */}
        <div className="relative w-32 h-32 mx-auto mb-3 mt-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-maroon/30 via-primary-maroon to-primary-maroon/70 dark:from-accent-gold/30 dark:via-accent-gold dark:to-accent-gold/70 transform scale-110 blur-sm"></div>
            <img 
                src={profilePic} 
                alt={userFullName} 
                className="relative w-full h-full object-cover rounded-full border-4 border-white/50 shadow-spectra-md"
            />
        </div>        <h2 className="text-2xl font-bold spectra-gradient-text-reverse">{userFullName}</h2>
        <p className="text-sm opacity-90">Servidor Público</p>
      </div>

      {/* Profile Stats Bar - Updated with SpectraUI colors */}
      <div className="relative -mt-8">
        <svg 
          width="100%" 
          height="44" 
          viewBox="0 0 400 44" 
          preserveAspectRatio="none" 
          className="w-full"
        >
          <path d="M 0 0 L 200 0 L 250 44 L 0 44 Z" fill="white" className="fill-white dark:fill-neutral-800" />
          <path d="M 200 0 L 400 0 L 400 44 L 250 44 Z" fill="#611232" className="fill-primary-maroon dark:fill-accent-gold" />
        </svg>        <div className="absolute inset-0 flex items-center">
          <div className="w-[50%] px-6"></div>          <div className="flex-1 flex justify-end items-center pr-6">
            <div className="flex items-center">
              <span className="text-sm font-medium text-white mr-2">Perfil</span>
              {onEdit && (
                <button 
                  onClick={onEdit} 
                  className="p-1 text-white hover:text-neutral-200 transition-colors rounded-full"
                  aria-label="Editar perfil"
                >
                  <EditIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Sections */}
      <div className="p-5 space-y-5 spectra-card bg-gradient-card-light dark:bg-gradient-card-dark backdrop-blur-md rounded-b-xl">
        {/* Datos Personales */}
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-custom-pink dark:text-custom-gold mr-2">
            <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
            <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-semibold text-text-primary dark:text-neutral-100">Datos Personales</h3>        </div>        <div className="bg-[#f5f6f7] dark:bg-neutral-800 rounded-container-second p-4">
          <div className="grid grid-cols-1 gap-4">
            <DataItem label="Nombre" value={userFullName} />
            {!isPublicView && <DataItem label="CURP" value={user.curp} noTruncate={true} />}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isPublicView && <DataItem label="Celular" value={user.celular} />}
              {!isPublicView && <DataItem label="Teléfono - Ext" value={user.telefonoExtension} />}
              {!isPublicView && <DataItem label="Fecha de Nacimiento" value={birthDateFormatted} />}
              {!isPublicView && <DataItem label="Consideraciones particulares" value={user.consideracionesParticulares} />}
            </div>
             <DataItem label="Presentación Adicional" value={user.descripcionAdicional} isMultiline={true} />
          </div>
        </div>        {/* Nivel Educativo */}
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-custom-pink dark:text-custom-gold mr-2">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
          <h3 className="text-lg font-semibold text-text-primary dark:text-neutral-100">Nivel Educativo</h3>        </div>
        {(user.doctoradoTitulo || user.maestriaTitulo || user.licenciaturaTitulo || user.diplomadoTitulo) && (
          <div className="bg-[#f5f6f7] dark:bg-neutral-800 rounded-container-second p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DataItem label="Doctorado" value={user.doctoradoTitulo} />
              <DataItem label="Maestría" value={user.maestriaTitulo} />
              <DataItem label="Licenciatura" value={user.licenciaturaTitulo} />
              <DataItem label="Diplomado" value={user.diplomadoTitulo} />
            </div>
          </div>
        )}        {/* Experiencia Profesional */}
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-custom-pink dark:text-custom-gold mr-2">
            <path fillRule="evenodd" d="M6 3.75A2.75 2.75 0 018.75 1h2.5A2.75 2.75 0 0114 3.75v.443c.572.055 1.14.122 1.706.2C17.053 4.582 18 5.75 18 7.07v3.469c0 1.126-.694 2.191-1.83 2.54-1.952.599-4.024.921-6.17.921s-4.219-.322-6.17-.921C2.694 12.73 2 11.665 2 10.539V7.07c0-1.321.947-2.489 2.294-2.676A41.047 41.047 0 016 4.193V3.75zm6.5 0v.325a41.622 41.622 0 00-5 0V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25zM10 10a1 1 0 00-1 1v.01a1 1 0 001 1h.01a1 1 0 001-1V11a1 1 0 00-1-1H10z" clipRule="evenodd" />
            <path d="M3 15.055v-.684c.126.053.255.1.39.142 2.092.642 4.313.987 6.61.987 2.297 0 4.518-.345 6.61-.987.135-.041.264-.089.39-.142v.684c0 1.347-.985 2.53-2.363 2.686a41.454 41.454 0 01-9.274 0C3.985 17.585 3 16.402 3 15.055z" />
          </svg>
          <h3 className="text-lg font-semibold text-text-primary dark:text-neutral-100">Experiencia Profesional</h3>
        </div>        
        {(user.nombreCentroTrabajo || user.puesto || user.antiguedad || user.tipoCentroTrabajo || user.entidadCentroTrabajo || user.municipioCentroTrabajo || user.turnoCentroTrabajo) && (
          <div className="bg-[#f5f6f7] dark:bg-neutral-800 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DataItem label="Empresa/Organización Actual" value={user.nombreCentroTrabajo} />
              <DataItem label="Cargo/Posición" value={user.puesto} />
              <DataItem label="Años de Experiencia Total" value={user.antiguedad ? `${Math.floor(user.antiguedad / 12)} años` : undefined} />
              <DataItem label="Sector/Industria" value={user.tipoCentroTrabajo} />
              <DataItem label="Ubicación de Trabajo" value={user.entidadCentroTrabajo ? `${user.entidadCentroTrabajo}${user.municipioCentroTrabajo ? `, ${user.municipioCentroTrabajo}` : ''}` : user.municipioCentroTrabajo} />
              <DataItem label="Modalidad de Trabajo" value={user.turnoCentroTrabajo} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface EditProfileFormProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({ user, onSave, onCancel }) => {
  const { currentUser, updateCurrentUser: updateAuthUser } = useAuth();
  const { success, error: showError, info } = useToast();
  const [formData, setFormData] = useState<User>({ 
    ...user,
    areaDepartamentoDireccion: user.areaDepartamentoDireccion || AreaDepartamentoDireccion.NO_ESPECIFICADO,
    puesto: user.puesto || 'No especificado',
    sexo: user.sexo || UserSex.MASCULINO,
    antiguedad: user.antiguedad === undefined ? undefined : Number(user.antiguedad),
    educationalLevel: user.educationalLevel || EducationalLevel.BASICA,
    eligibilitySelfDeclaration: user.eligibilitySelfDeclaration || {},
    adminEligibilityVerification: user.adminEligibilityVerification || {},
    isEligibleForVoting: !!user.isEligibleForVoting,
    hasRevokedCandidacyPreviously: !!user.hasRevokedCandidacyPreviously,
    isRegisteredAsCandidate: !!user.isRegisteredAsCandidate,
    // Initialize new fields
    celular: user.celular || '',
    telefonoExtension: user.telefonoExtension || '',
    consideracionesParticulares: user.consideracionesParticulares || '',
    descripcionAdicional: user.descripcionAdicional || '',
    doctoradoTitulo: user.doctoradoTitulo || '',
    maestriaTitulo: user.maestriaTitulo || '',
    licenciaturaTitulo: user.licenciaturaTitulo || '',    diplomadoTitulo: user.diplomadoTitulo || '',
    claveCentroTrabajo: user.claveCentroTrabajo || '',
    nombreCentroTrabajo: user.nombreCentroTrabajo || '',
    entidadCentroTrabajo: user.entidadCentroTrabajo || '',
    municipioCentroTrabajo: user.municipioCentroTrabajo || '',
    tipoCentroTrabajo: user.tipoCentroTrabajo || '',
    turnoCentroTrabajo: user.turnoCentroTrabajo || '',  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isWhitelistedUser, setIsWhitelistedUser] = useState(false);

  const MAX_DESC_CHARS = 1200;

  useEffect(() => {
    let initialFormData = { 
        ...user,
        areaDepartamentoDireccion: user.areaDepartamentoDireccion || AreaDepartamentoDireccion.NO_ESPECIFICADO,
        puesto: user.puesto || 'No especificado',
        sexo: user.sexo || UserSex.MASCULINO,
        antiguedad: user.antiguedad === undefined ? undefined : Number(user.antiguedad),
        educationalLevel: user.educationalLevel || EducationalLevel.BASICA,
        eligibilitySelfDeclaration: user.eligibilitySelfDeclaration || {},
        adminEligibilityVerification: user.adminEligibilityVerification || {},
        isEligibleForVoting: !!user.isEligibleForVoting,
        hasRevokedCandidacyPreviously: !!user.hasRevocadoCandidacyPreviously,
        isRegisteredAsCandidate: !!user.isRegisteredAsCandidate,
        // Initialize new fields from user prop
        celular: user.celular || '',
        telefonoExtension: user.telefonoExtension || '',
        consideracionesParticulares: user.consideracionesParticulares || '',
        descripcionAdicional: user.descripcionAdicional || '',
        doctoradoTitulo: user.doctoradoTitulo || '',
        maestriaTitulo: user.maestriaTitulo || '',
        licenciaturaTitulo: user.licenciaturaTitulo || '',
        diplomadoTitulo: user.diplomadoTitulo || '',
        claveCentroTrabajo: user.claveCentroTrabajo || '',
        nombreCentroTrabajo: user.nombreCentroTrabajo || '',        entidadCentroTrabajo: user.entidadCentroTrabajo || '',
        municipioCentroTrabajo: user.municipioCentroTrabajo || '',
        tipoCentroTrabajo: user.tipoCentroTrabajo || '',
        turnoCentroTrabajo: user.turnoCentroTrabajo || '',
    };
    const derivedDob = extractDateOfBirthFromCURP(user.curp);
    if (derivedDob) {
      initialFormData.fechaNacimiento = derivedDob;
    } else if (user.curp === SUPERADMIN_INITIAL_DATA.curp) {
      initialFormData.fechaNacimiento = SUPERADMIN_INITIAL_DATA.fechaNacimiento;
    }    setFormData(initialFormData);
    
    // Check whitelist status asynchronously
    const checkWhitelistStatus = async () => {
      try {
        const whitelistedStatus = await isWhitelisted(user.curp);
        setIsWhitelistedUser(whitelistedStatus);
      } catch (error) {
        console.error('Error checking whitelist status:', error);
        setIsWhitelistedUser(false);
      }
    };
    
    checkWhitelistStatus();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkedValue = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;
    
    let processedValue = isCheckbox ? checkedValue : value;
    if (name === "descripcionAdicional" && typeof processedValue === 'string') {
        processedValue = processedValue.substring(0, MAX_DESC_CHARS);
    }

    setFormData(prev => {
      let newFormData = {
        ...prev,
        [name]: processedValue,
      };
      if (name === 'curp' && currentUser?.role === UserRole.SUPERADMIN) {
        const newCurp = value.toUpperCase();
        const derivedDob = extractDateOfBirthFromCURP(newCurp);
        if (derivedDob) {
          newFormData.fechaNacimiento = derivedDob;
        } else if (newCurp === SUPERADMIN_INITIAL_DATA.curp) {
          newFormData.fechaNacimiento = SUPERADMIN_INITIAL_DATA.fechaNacimiento;
        } else {
           newFormData.fechaNacimiento = '';
        }
      }
      if (name === 'antiguedad') {
        const numValue = value === '' ? undefined : parseInt(value, 10);
        newFormData.antiguedad = isNaN(numValue as number) ? undefined : numValue;
      }
      if (name === 'educationalLevel' && !ALL_EDUCATIONAL_LEVELS.includes(value as EducationalLevel)) {
        newFormData.educationalLevel = EducationalLevel.BASICA; 
      }
      return newFormData;
    });

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleProfilePicChange = (base64DataUri: string) => {
    setFormData(prev => ({ ...prev, profilePicUrl: base64DataUri }));
    if (errors.profilePicUrl) setErrors(prev => ({ ...prev, profilePicUrl: '' }));
  };

  const handleAdminEligibilityAnswerChange = (criterion: EligibilityCriterionKey, value: boolean | null) => {
    setFormData(prev => ({
      ...prev,
      adminEligibilityVerification: {
        ...(prev.adminEligibilityVerification || {}),
        [criterion]: value,
      },
    }));
  };

  const handleAdminFinalVerificationChange = (isChecked: boolean) => {
    setFormData(prev => ({ ...prev, isEligibleForVoting: isChecked }));
  };


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'Nombre es obligatorio.';
    if (!formData.apellidoPaterno.trim()) newErrors.apellidoPaterno = 'Apellido Paterno es obligatorio.';
    if (!formData.email.trim()) newErrors.email = 'Correo electrónico es obligatorio.';
    else if (!EMAIL_REGEX.test(formData.email)) newErrors.email = 'Formato de correo inválido.';
    if (!formData.sexo) newErrors.sexo = 'Sexo es obligatorio.';
    
    const userAntiguedad = formData.antiguedad !== undefined ? Number(formData.antiguedad) : -1;

    if (formData.role === UserRole.CANDIDATE && formData.curp !== SUPERADMIN_CURP && userAntiguedad < 12) {
      newErrors.antiguedad = 'Antigüedad de al menos 12 meses es obligatoria para candidatos.';
    } else if (formData.antiguedad !== undefined && (isNaN(userAntiguedad) || userAntiguedad < 0)) {
      newErrors.antiguedad = 'Antigüedad debe ser un número no negativo si se proporciona.';
    }

    if (!formData.puesto.trim() || formData.puesto.trim() === 'No especificado') newErrors.puesto = 'Puesto es obligatorio.';
    
    if (formData.role === UserRole.CANDIDATE && formData.curp !== SUPERADMIN_CURP && !formData.profilePicUrl) {
      newErrors.profilePicUrl = 'Foto de perfil es obligatoria para candidatos.';
    }
    
    if (formData.curp !== SUPERADMIN_INITIAL_DATA.curp && !extractDateOfBirthFromCURP(formData.curp) ) {
        newErrors.curp = 'CURP inválido o no permite extraer fecha de nacimiento válida.';
    }
    if (!formData.fechaNacimiento && formData.curp !== SUPERADMIN_INITIAL_DATA.curp) {
        newErrors.fechaNacimiento = 'Fecha de nacimiento no pudo ser determinada del CURP.';
    }
    
    if (!formData.educationalLevel || !ALL_EDUCATIONAL_LEVELS.includes(formData.educationalLevel)) {
      newErrors.educationalLevel = 'Nivel educativo es obligatorio y debe ser uno de los valores válidos.';
    }
    
    if (formData.descripcionAdicional && formData.descripcionAdicional.length > MAX_DESC_CHARS) {
        newErrors.descripcionAdicional = `La descripción no puede exceder los ${MAX_DESC_CHARS} caracteres.`
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({}); 

    if (!(await validateForm())) {
      setIsLoading(false); 
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300)); 

    let updatedUser = { ...formData };
    const isEditingSelf = currentUser?.id === updatedUser.id;
    const isAdminEditing = currentUser?.role === UserRole.SUPERADMIN;
    let adminActionError: string | null = null;


    if (isAdminEditing) {
        let newRole = formData.role;
        let newIsRegisteredCandidate = updatedUser.isRegisteredAsCandidate; 

        if (newRole === UserRole.CANDIDATE) {
            if (updatedUser.hasRevokedCandidacyPreviously) {
                adminActionError = "Este usuario retiró su candidatura previamente y no puede volver a ser candidato.";
                newRole = UserRole.USER;
                newIsRegisteredCandidate = false;
            } else if (!(await isWhitelisted(updatedUser.curp))) {
                adminActionError = "El CURP del usuario no está en la lista blanca. No puede ser candidato.";
                newRole = UserRole.USER;
                newIsRegisteredCandidate = false;
            } else if ((updatedUser.antiguedad === undefined || Number(updatedUser.antiguedad) < 12) && updatedUser.curp !== SUPERADMIN_CURP) {
                adminActionError = "Se requiere antigüedad mínima de 12 meses para ser candidato.";
                newRole = UserRole.USER;
                newIsRegisteredCandidate = false;
            } else {
                newIsRegisteredCandidate = true; 
            }
        } else if (newRole === UserRole.USER) {
            newIsRegisteredCandidate = false;
            if (user.role === UserRole.CANDIDATE) { 
                 updatedUser.isEligibleForVoting = false;
            }
        } else if (newRole === UserRole.SUPERADMIN) {
            newIsRegisteredCandidate = false; 
        }
        
        updatedUser.role = newRole;
        updatedUser.isRegisteredAsCandidate = newIsRegisteredCandidate;

        if (adminActionError) {
            setErrors(prev => ({ ...prev, role: adminActionError || '' }));
            setIsLoading(false);
            return;
        }

    } else { 
      updatedUser.role = user.role;
      updatedUser.isRegisteredAsCandidate = user.isRegisteredAsCandidate;
      updatedUser.adminEligibilityVerification = user.adminEligibilityVerification; 
      updatedUser.isEligibleForVoting = user.isEligibleForVoting; 
    }
    
    if (currentUser?.id === updatedUser.id && 
        currentUser?.role !== UserRole.SUPERADMIN &&
        user.canChangeBlock && 
        updatedUser.assignedBlock !== user.assignedBlock) {
      updatedUser.canChangeBlock = false; 
    }
    
    if (isAdminEditing && updatedUser.role === UserRole.CANDIDATE) {
        const adminVerif = updatedUser.adminEligibilityVerification || {};
        const allAdminCriteriaMet = Object.values(EligibilityCriterionKey).every(key => {
            return adminVerif[key] === true; 
        });
        const seniorityMet = updatedUser.antiguedad !== undefined && Number(updatedUser.antiguedad) >= 1;
        updatedUser.isEligibleForVoting = !!(updatedUser.isEligibleForVoting && allAdminCriteriaMet && seniorityMet);
    } else if (!updatedUser.isRegisteredAsCandidate) { 
        updatedUser.isEligibleForVoting = false;
    }

    const finalUserToSave: User = {
        ...updatedUser,
        areaDepartamentoDireccion: updatedUser.areaDepartamentoDireccion || AreaDepartamentoDireccion.NO_ESPECIFICADO,
        puesto: updatedUser.puesto.trim() || 'No especificado',
        antiguedad: (updatedUser.antiguedad === undefined || Number(updatedUser.antiguedad) < 0) ? undefined : Number(updatedUser.antiguedad),
        educationalLevel: updatedUser.educationalLevel || EducationalLevel.BASICA, 
        canChangeBlock: !!updatedUser.canChangeBlock,
        peerNominations: updatedUser.peerNominations || [],
        hasPendingPeerNominationDecision: !!updatedUser.hasPendingPeerNominationDecision,
        votesCast: updatedUser.votesCast || {}, 
        eligibilitySelfDeclaration: updatedUser.eligibilitySelfDeclaration || {},
        adminEligibilityVerification: updatedUser.adminEligibilityVerification || {},
        isEligibleForVoting: !!updatedUser.isEligibleForVoting,
        hasRevokedCandidacyPreviously: !!updatedUser.hasRevocadoCandidacyPreviously,
        isRegisteredAsCandidate: !!updatedUser.isRegisteredAsCandidate,
        // Ensure new fields are included, trimming strings
        celular: updatedUser.celular?.trim() || undefined,
        telefonoExtension: updatedUser.telefonoExtension?.trim() || undefined,
        consideracionesParticulares: updatedUser.consideracionesParticulares?.trim() || undefined,
        descripcionAdicional: updatedUser.descripcionAdicional?.trim() || undefined,
        doctoradoTitulo: updatedUser.doctoradoTitulo?.trim() || undefined,
        maestriaTitulo: updatedUser.maestriaTitulo?.trim() || undefined,
        licenciaturaTitulo: updatedUser.licenciaturaTitulo?.trim() || undefined,        diplomadoTitulo: updatedUser.diplomadoTitulo?.trim() || undefined,
        claveCentroTrabajo: updatedUser.claveCentroTrabajo?.trim() || undefined,
        nombreCentroTrabajo: updatedUser.nombreCentroTrabajo?.trim() || undefined,
        entidadCentroTrabajo: updatedUser.entidadCentroTrabajo?.trim() || undefined,
        municipioCentroTrabajo: updatedUser.municipioCentroTrabajo?.trim() || undefined,
        tipoCentroTrabajo: updatedUser.tipoCentroTrabajo?.trim() || undefined,
        turnoCentroTrabajo: updatedUser.turnoCentroTrabajo?.trim() || undefined,
    };    await updateStorageUser(finalUserToSave); 
    if (currentUser?.id === finalUserToSave.id) {
      updateAuthUser(finalUserToSave); 
    }
    onSave(finalUserToSave); 
    setIsLoading(false);
  };
  
  const areaOptions = ALL_AREA_DEPARTAMENTO_DIRECCION.map(area => ({ value: area, label: area }));
  const sexOptions = ALL_USER_SEX.map(sex => ({ value: sex, label: sex }));
  const educationalLevelOptions = ALL_EDUCATIONAL_LEVELS.map(level => ({value: level, label: level}));
  
  const isUserSeniorityMetForAdminView = formData.antiguedad !== undefined && Number(formData.antiguedad) >= 1;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.role && (
          <div className="p-4 rounded-container-fourth bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{errors.role}</p>
          </div>
        )}        {currentUser?.id === user.id && formData.canChangeBlock && currentUser.role !== UserRole.SUPERADMIN && (
          <div className="p-4 rounded-container-fourth bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">Un administrador te ha concedido permiso para cambiar tu bloque asignado en esta sesión de edición.</p>
          </div>
        )}
        <h3 className="text-xl font-semibold text-text-primary dark:text-custom-gold mb-2">Editar Perfil</h3>
        
        <FileUploadInput
          label="Foto de Perfil"
          name="profilePicUrl"
          value={formData.profilePicUrl || ''}
          onChange={handleProfilePicChange}
          error={errors.profilePicUrl}
          defaultUserName={`${formData.nombre} ${formData.apellidoPaterno}`}
        />

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <Input label="Nombre(s)" name="nombre" value={formData.nombre} onChange={handleChange} error={errors.nombre} />
          <Input label="Apellido Paterno" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} error={errors.apellidoPaterno} />
          <Input label="Apellido Materno" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} />
          <Input 
            label="CURP" 
            name="curp" 
            value={formData.curp} 
            onChange={(e) => handleChange({ ...e, target: { ...e.target, name: 'curp', value: e.target.value.toUpperCase() } })}
            error={errors.curp}
            disabled={currentUser?.role !== UserRole.SUPERADMIN && user.curp === currentUser?.curp} 
            readOnly={currentUser?.role !== UserRole.SUPERADMIN && user.curp === currentUser?.curp}
            title={currentUser?.role !== UserRole.SUPERADMIN && user.curp === currentUser?.curp ? "No editable" : ""} 
          />
          <Input 
            label="Fecha de Nacimiento" 
            name="fechaNacimiento" 
            type="date" 
            value={formData.fechaNacimiento} 
            onChange={handleChange} 
            error={errors.fechaNacimiento}
            readOnly 
            title="Derivada del CURP (no editable)"
            className="bg-gray-100 dark:bg-neutral-800 cursor-not-allowed"
          />
          <Input label="Correo Electrónico" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} />
          <Select
            label="Sexo"
            name="sexo"
            value={formData.sexo}
            onChange={handleChange}
            options={sexOptions}
            error={errors.sexo}
          />
          <Input
            label={`Antigüedad (Meses)${formData.role === UserRole.CANDIDATE && formData.curp !== SUPERADMIN_CURP ? ' (Obligatorio para candidatos, min. 12 meses)' : ' (Opcional)'}`}
            name="antiguedad"
            type="number"
            value={formData.antiguedad === undefined ? '' : formData.antiguedad.toString()}
            onChange={handleChange}
            error={errors.antiguedad}
            placeholder="Ej: 60"
            min="0"
          />
           <Select
            label="Área/Departamento/Dirección General"
            name="areaDepartamentoDireccion"
            value={formData.areaDepartamentoDireccion}
            onChange={handleChange}
            options={areaOptions}
            error={errors.areaDepartamentoDireccion}
          />
          <Input 
            label="Puesto" 
            name="puesto" 
            value={formData.puesto} 
            onChange={handleChange} 
            error={errors.puesto}
            placeholder="Ej: Jefe de Departamento"
          />
           <Select
            label="Nivel Educativo (General)"
            name="educationalLevel"
            value={formData.educationalLevel || EducationalLevel.BASICA}
            onChange={handleChange}
            options={educationalLevelOptions}
            error={errors.educationalLevel}
          />
          <Select
            label="Bloque Asignado (para votación)"
            name="assignedBlock"
            value={formData.assignedBlock}
            onChange={handleChange}
            options={ALL_CANDIDATE_BLOCKS.map(b => ({ value: b, label: b }))}
            disabled={
                currentUser?.role !== UserRole.SUPERADMIN && 
                user.id === currentUser?.id && 
                !formData.canChangeBlock 
            }
            title={
                (currentUser?.role !== UserRole.SUPERADMIN && user.id === currentUser?.id && !formData.canChangeBlock) ?
                "El cambio de bloque debe ser autorizado por un administrador." : ""
            }
            error={errors.assignedBlock}
          />
        </div>
        
        {/* Additional Personal Info */}
        <h4 className="text-md font-semibold text-text-primary dark:text-neutral-300 pt-3 border-t border-border-gray/30 dark:border-neutral-700/50">Información Adicional</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Input label="Celular (Opcional)" name="celular" value={formData.celular || ''} onChange={handleChange} placeholder="Ej: 5512345678" />
            <Input label="Teléfono - Extensión (Opcional)" name="telefonoExtension" value={formData.telefonoExtension || ''} onChange={handleChange} placeholder="Ej: 12345 o 555-1234 ext. 678" />
            <div className="md:col-span-2">
                <label htmlFor="consideracionesParticulares" className="block text-sm font-medium text-text-secondary dark:text-neutral-400 mb-1.5">Consideraciones Particulares (Opcional)</label>
                <textarea
                    id="consideracionesParticulares"
                    name="consideracionesParticulares"
                    value={formData.consideracionesParticulares || ''}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full p-2.5 bg-gray-50 dark:bg-neutral-700/40 border border-border-gray dark:border-neutral-600 rounded-apple-md shadow-apple-sm text-text-primary dark:text-neutral-100 placeholder-text-tertiary dark:placeholder-neutral-400 sm:text-sm apple-focus-ring"
                    placeholder="Alergias, movilidad, etc."
                />
            </div>
            <div className="md:col-span-2">
                <label htmlFor="descripcionAdicional" className="block text-sm font-medium text-text-secondary dark:text-neutral-400 mb-1.5">Descripción Adicional (Presentación)</label>
                <textarea
                    id="descripcionAdicional"
                    name="descripcionAdicional"
                    value={formData.descripcionAdicional || ''}
                    onChange={handleChange}
                    rows={4}
                    maxLength={MAX_DESC_CHARS}
                    className="block w-full p-2.5 bg-gray-50 dark:bg-neutral-700/40 border border-border-gray dark:border-neutral-600 rounded-apple-md shadow-apple-sm text-text-primary dark:text-neutral-100 placeholder-text-tertiary dark:placeholder-neutral-400 sm:text-sm apple-focus-ring"
                    placeholder={`Escribe una breve descripción o presentación sobre ti, tus motivaciones o propuestas (máx. aprox. 200 palabras / ${MAX_DESC_CHARS} caracteres).`}
                />
                <div className="text-right text-xs text-text-tertiary dark:text-neutral-500 mt-1">
                    {formData.descripcionAdicional?.length || 0} / {MAX_DESC_CHARS}
                </div>
                 {errors.descripcionAdicional && <p className="mt-1 text-xs text-error-text dark:text-red-400">{errors.descripcionAdicional}</p>}
            </div>
        </div>

        {/* Educational Titles */}
        <h4 className="text-md font-semibold text-text-primary dark:text-neutral-300 pt-3 border-t border-border-gray/30 dark:border-neutral-700/50">Títulos Educativos Específicos</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Input label="Doctorado (Título, Opcional)" name="doctoradoTitulo" value={formData.doctoradoTitulo || ''} onChange={handleChange} placeholder="Ej: Doctorado en Ciencias"/>
            <Input label="Maestría (Título, Opcional)" name="maestriaTitulo" value={formData.maestriaTitulo || ''} onChange={handleChange} placeholder="Ej: Maestría en Administración"/>
            <Input label="Licenciatura (Título, Opcional)" name="licenciaturaTitulo" value={formData.licenciaturaTitulo || ''} onChange={handleChange} placeholder="Ej: Lic. en Derecho"/>
            <Input label="Diplomado (Título, Opcional)" name="diplomadoTitulo" value={formData.diplomadoTitulo || ''} onChange={handleChange} placeholder="Ej: Diplomado en Finanzas"/>
        </div>        {/* Work Experience Details */}
        <h4 className="text-md font-semibold text-text-primary dark:text-neutral-300 pt-3 border-t border-border-gray/30 dark:border-neutral-700/50">Experiencia Profesional</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <Input label="Empresa/Organización Actual (Opcional)" name="nombreCentroTrabajo" value={formData.nombreCentroTrabajo || ''} onChange={handleChange} placeholder="Ej: Secretaría de Educación Pública"/>
            <Input label="Sector/Industria (Opcional)" name="tipoCentroTrabajo" value={formData.tipoCentroTrabajo || ''} onChange={handleChange} placeholder="Ej: Educación, Gobierno, Salud" />
            <Input label="Ubicación Estado (Opcional)" name="entidadCentroTrabajo" value={formData.entidadCentroTrabajo || ''} onChange={handleChange} placeholder="Ej: Ciudad de México"/>
            <Input label="Ubicación Ciudad/Municipio (Opcional)" name="municipioCentroTrabajo" value={formData.municipioCentroTrabajo || ''} onChange={handleChange} placeholder="Ej: Benito Juárez"/>
            <Input label="Modalidad de Trabajo (Opcional)" name="turnoCentroTrabajo" value={formData.turnoCentroTrabajo || ''} onChange={handleChange} placeholder="Ej: Presencial, Híbrido, Remoto" />
            <Input label="Código de Centro de Trabajo (Opcional)" name="claveCentroTrabajo" value={formData.claveCentroTrabajo || ''} onChange={handleChange} placeholder="Para fines administrativos"/>
        </div>
        
           {currentUser?.role === UserRole.SUPERADMIN && user.curp !== currentUser.curp && (
            <div className="pt-3 border-t border-border-gray/30 dark:border-neutral-700/50">
                <Select
                label="Rol de Usuario"
                name="role"
                value={formData.role}
                onChange={handleChange}
                options={Object.values(UserRole).filter(r => r !== UserRole.SUPERADMIN || formData.curp === SUPERADMIN_INITIAL_DATA.curp ).map(role => ({ value: role, label: role }))}
                error={errors.role} 
                />
            </div>
          )}
        
        {currentUser?.role === UserRole.SUPERADMIN && user.id !== currentUser?.id && (
          <div className="mt-6 pt-4 border-t border-border-gray/50 dark:border-neutral-700/50">
            <h4 className="text-md font-semibold text-text-primary dark:text-neutral-200 mb-2">Control de Administrador (Permisos):</h4>
            <div className="flex items-center">
              <input
                id="canChangeBlockAdmin"
                name="canChangeBlock"
                type="checkbox"
                checked={!!formData.canChangeBlock}
                onChange={handleChange}
                className="h-4 w-4 text-custom-pink border-border-gray dark:border-neutral-600 rounded focus:ring-custom-pink apple-focus-ring"
              />
              <label htmlFor="canChangeBlockAdmin" className="ml-2 block text-sm text-text-primary dark:text-neutral-200">
                Permitir a <span className="font-semibold">{user.nombre}</span> cambiar su bloque (en su próxima edición de perfil)
              </label>
            </div>
          </div>
        )}        
        {formData.hasPendingPeerNominationDecision && formData.peerNominations && formData.peerNominations.length > 0 && (          <div className="p-4 rounded-container-fourth bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Nominaciones Pendientes</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">Este usuario tiene {formData.peerNominations.length} nominaciones de colegas pendientes. Si el administrador cambia el rol a Candidato y se cumplen los requisitos, estas nominaciones se limpiarán al guardar.</p>
          </div>
        )}

        {currentUser?.role === UserRole.SUPERADMIN && formData.role === UserRole.CANDIDATE && user.role !== UserRole.SUPERADMIN && (
            <EligibilityChecksAdminView
                user={formData} 
                adminVerificationAnswers={formData.adminEligibilityVerification || {}}
                onAdminAnswerChange={handleAdminEligibilityAnswerChange}
                isFinalVerificationChecked={!!formData.isEligibleForVoting}
                onFinalVerificationChange={handleAdminFinalVerificationChange}
                isUserSeniorityMet={isUserSeniorityMetForAdminView}
            />
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-border-gray/50 dark:border-neutral-700/50 mt-6">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading} className="spectra-btn-secondary-enhanced">Cancelar</Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading} className="spectra-btn-primary-enhanced spectra-btn-cta-pulse">Guardar Cambios</Button>
        </div>
      </form>
    </Card>
  );
};