// src/components/admin/AdvancedPermissionsEditor.tsx
import React, { useState } from 'react';
import { AdminUser, AdminPermissions, AdminPermission } from '../../types';
import { canAccessSection } from '../../services/adminManagementService';
import { Card } from '../common/CommonComponents';

interface AdvancedPermissionsEditorProps {
  admin: AdminUser;
  permissions: AdminPermissions;
  onPermissionsChange: (permissions: AdminPermissions) => void;
  isReadOnly?: boolean;
}

interface SectionInfo {
  key: string;
  name: string;
  description: string;
  icon: string;
  critical?: boolean;
}

const SECTIONS: SectionInfo[] = [
  {
    key: 'statistics',
    name: 'Estadísticas',
    description: 'Visualización de métricas del sistema y reportes de votación',
    icon: '📊'
  },
  {
    key: 'users',
    name: 'Gestión de Usuarios',
    description: 'Administración de perfiles de usuario y datos personales',
    icon: '👥'
  },
  {
    key: 'blocks',
    name: 'Bloques Electorales',
    description: 'Configuración de bloques de candidatos y estructura electoral',
    icon: '🗳️'
  },
  {
    key: 'calendar',
    name: 'Calendario Electoral',
    description: 'Gestión de fechas y períodos del proceso electoral',
    icon: '📅'
  },
  {
    key: 'whitelist',
    name: 'Lista Blanca',
    description: 'Control de usuarios autorizados para participar',
    icon: '✅'
  },
  {
    key: 'emails',
    name: 'Gestión de Emails',
    description: 'Envío de notificaciones y comunicaciones masivas',
    icon: '📧'
  },
  {
    key: 'settings',
    name: 'Configuración SMTP',
    description: 'Configuración crítica del sistema de correo electrónico',
    icon: '⚙️',
    critical: true
  }
];

const ACCESS_LEVELS = [
  { value: 'none', label: 'Sin Acceso', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300', icon: '🚫' },
  { value: 'read', label: 'Solo Lectura', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300', icon: '👁️' },
  { value: 'write', label: 'Lectura y Escritura', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300', icon: '✏️' }
];

const AdvancedPermissionsEditor: React.FC<AdvancedPermissionsEditorProps> = ({
  admin,
  permissions,
  onPermissionsChange,
  isReadOnly = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionAccessLevel = (sectionKey: string): 'none' | 'read' | 'write' => {
    return canAccessSection({ ...admin, permissions }, sectionKey);
  };

  const setSectionAccessLevel = (sectionKey: string, level: 'none' | 'read' | 'write') => {
    if (isReadOnly) return;

    const readPerm = `${sectionKey}_read` as AdminPermission;
    const writePerm = `${sectionKey}_write` as AdminPermission;

    let newPermissions = { ...permissions };

    switch (level) {
      case 'none':
        newPermissions[readPerm] = false;
        newPermissions[writePerm] = false;
        break;
      case 'read':
        newPermissions[readPerm] = true;
        newPermissions[writePerm] = false;
        break;
      case 'write':
        newPermissions[readPerm] = true;
        newPermissions[writePerm] = true;
        break;
    }

    onPermissionsChange(newPermissions);
  };

  const getAccessLevelInfo = (level: 'none' | 'read' | 'write') => {
    return ACCESS_LEVELS.find(al => al.value === level) || ACCESS_LEVELS[0];
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {SECTIONS.map((section) => {
          const currentLevel = getSectionAccessLevel(section.key);
          const levelInfo = getAccessLevelInfo(currentLevel);
          const isExpanded = expandedSections.has(section.key);

          return (
            <Card key={section.key} className={`transition-all ${section.critical ? 'ring-2 ring-amber-200 dark:ring-amber-800' : ''}`}>
              <div className="p-4">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{section.icon}</span>
                    <div>
                      <h3 className="font-medium text-text-primary dark:text-neutral-100 flex items-center space-x-2">
                        <span>{section.name}</span>
                        {section.critical && (
                          <span className="text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 px-2 py-1 rounded-full">
                            CRÍTICO
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-text-secondary dark:text-neutral-400">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Current Access Level Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${levelInfo.color} flex items-center space-x-1`}>
                      <span>{levelInfo.icon}</span>
                      <span>{levelInfo.label}</span>
                    </span>
                    
                    {/* Expand/Collapse Button */}
                    <button
                      onClick={() => toggleSection(section.key)}
                      className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>
                  </div>
                </div>

                {/* Expanded Controls */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <div className="grid grid-cols-3 gap-2">
                      {ACCESS_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setSectionAccessLevel(section.key, level.value as 'none' | 'read' | 'write')}
                          disabled={isReadOnly}
                          className={`
                            p-3 rounded-lg text-sm font-medium transition-all
                            ${currentLevel === level.value 
                              ? level.color + ' ring-2 ring-offset-2 ring-primary-maroon dark:ring-offset-gray-800' 
                              : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                            }
                            ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                          `}
                        >
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-lg">{level.icon}</span>
                            <span>{level.label}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Permission Details */}
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Permisos específicos:
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`flex items-center space-x-2 ${
                          permissions[`${section.key}_read` as AdminPermission] 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          <span>{permissions[`${section.key}_read` as AdminPermission] ? '✅' : '❌'}</span>
                          <span>Lectura</span>
                        </div>
                        <div className={`flex items-center space-x-2 ${
                          permissions[`${section.key}_write` as AdminPermission] 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          <span>{permissions[`${section.key}_write` as AdminPermission] ? '✅' : '❌'}</span>
                          <span>Escritura</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      <Card className="bg-blue-50 dark:bg-blue-900/20">
        <div className="p-4">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            📋 Resumen de Permisos
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {ACCESS_LEVELS.map((level) => {
              const count = SECTIONS.filter(s => getSectionAccessLevel(s.key) === level.value).length;
              return (
                <div key={level.value} className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${level.color.split(' ')[0]}`}></span>
                  <span className="text-blue-700 dark:text-blue-300">
                    {level.label}: {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdvancedPermissionsEditor;
