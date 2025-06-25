// src/components/admin/PermissionLevelSummary.tsx
import React from 'react';
import { Card } from '../common/CommonComponents';
import { ADMIN_PERMISSION_LEVELS, SectionAccessLevel } from '../../services/adminManagementService';

interface PermissionLevelSummaryProps {
  selectedLevel?: keyof typeof ADMIN_PERMISSION_LEVELS;
  onLevelSelect?: (level: keyof typeof ADMIN_PERMISSION_LEVELS) => void;
  isReadOnly?: boolean;
}

const PermissionLevelSummary: React.FC<PermissionLevelSummaryProps> = ({
  selectedLevel,
  onLevelSelect,
  isReadOnly = false
}) => {
  const levelDetails = {
    SOLO_LECTURA: {
      title: '📖 Solo Lectura',
      description: 'Acceso de consulta únicamente a todas las secciones',
      color: 'blue',
      features: [
        'Ver estadísticas y reportes',
        'Consultar información de usuarios',
        'Revisar configuración de bloques',
        'Acceso a calendario electoral',
        'Ver lista blanca',
        'Consultar emails enviados',
        'Sin acceso a configuración SMTP'
      ]
    },
    LECTURA_ESCRITURA: {
      title: '✏️ Lectura y Escritura',
      description: 'Gestión completa de operaciones administrativas',
      color: 'green',
      features: [
        'Gestión completa de estadísticas',
        'Administrar usuarios y perfiles',
        'Configurar bloques electorales',
        'Gestionar calendario electoral',
        'Administrar lista blanca',
        'Enviar y gestionar emails',
        'Ver configuración SMTP (sin modificar)'
      ]
    },
    COMPLETO: {
      title: '🔧 Completo',
      description: 'Acceso total incluyendo configuración crítica',
      color: 'amber',
      features: [
        'Acceso completo a todas las funciones',
        'Gestión total de usuarios',
        'Configuración avanzada de bloques',
        'Control total del calendario',
        'Administración de lista blanca',
        'Gestión completa de emails',
        'Configuración SMTP completa'
      ]
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseClasses = isSelected ? 'ring-2 ring-offset-2 dark:ring-offset-gray-800' : '';
    const colorMap = {
      blue: isSelected 
        ? `bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-blue-500 ${baseClasses}`
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600',
      green: isSelected
        ? `bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 ring-green-500 ${baseClasses}`
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600',
      amber: isSelected
        ? `bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 ring-amber-500 ${baseClasses}`
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600'
    };
    return colorMap[color as keyof typeof colorMap];
  };

  const getSectionCount = (level: keyof typeof ADMIN_PERMISSION_LEVELS, accessType: SectionAccessLevel) => {
    return Object.values(ADMIN_PERMISSION_LEVELS[level]).filter(access => access === accessType).length;
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-text-primary dark:text-neutral-100 mb-2">
          🎯 Niveles de Permisos Disponibles
        </h3>
        <p className="text-sm text-text-secondary dark:text-neutral-400">
          Selecciona el nivel de acceso apropiado para el administrador
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(Object.keys(levelDetails) as Array<keyof typeof levelDetails>).map((level) => {
          const details = levelDetails[level];
          const isSelected = selectedLevel === level;
          const canSelect = onLevelSelect && !isReadOnly;
          
          return (
            <div
              key={level}
              className={`
                border rounded-lg p-4 transition-all cursor-pointer
                ${getColorClasses(details.color, isSelected)}
                ${canSelect ? 'hover:shadow-md' : 'cursor-default'}
              `}
              onClick={() => canSelect && onLevelSelect(level)}
            >
              <div className="text-center mb-3">
                <h4 className="font-medium text-text-primary dark:text-neutral-100 mb-1">
                  {details.title}
                </h4>
                <p className="text-xs text-text-secondary dark:text-neutral-400">
                  {details.description}
                </p>
              </div>

              {/* Access Level Stats */}
              <div className="flex justify-center space-x-4 mb-3 text-xs">
                <div className="text-center">
                  <div className="font-medium text-green-600 dark:text-green-400">
                    {getSectionCount(level, 'full') + getSectionCount(level, 'readwrite')}
                  </div>
                  <div className="text-text-tertiary dark:text-neutral-500">Completo</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-blue-600 dark:text-blue-400">
                    {getSectionCount(level, 'read')}
                  </div>
                  <div className="text-text-tertiary dark:text-neutral-500">Lectura</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600 dark:text-red-400">
                    {getSectionCount(level, 'none')}
                  </div>
                  <div className="text-text-tertiary dark:text-neutral-500">Sin acceso</div>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-1 text-xs text-text-secondary dark:text-neutral-400">
                {details.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
                {details.features.length > 4 && (
                  <li className="text-text-tertiary dark:text-neutral-500 italic">
                    y {details.features.length - 4} más...
                  </li>
                )}
              </ul>

              {isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-center space-x-2 text-xs text-green-600 dark:text-green-400">
                    <span>✓</span>
                    <span className="font-medium">Nivel Seleccionado</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Comparison Table */}
      <Card className="mt-6">
        <div className="p-4">
          <h4 className="font-medium text-text-primary dark:text-neutral-100 mb-3">
            📊 Comparación Rápida por Secciones
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 text-text-secondary dark:text-neutral-400">Sección</th>
                  <th className="text-center py-2 text-blue-600 dark:text-blue-400">Solo Lectura</th>
                  <th className="text-center py-2 text-green-600 dark:text-green-400">Lectura y Escritura</th>
                  <th className="text-center py-2 text-amber-600 dark:text-amber-400">Completo</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ADMIN_PERMISSION_LEVELS.SOLO_LECTURA).map(([section, _]) => (
                  <tr key={section} className="border-b dark:border-gray-700/50">
                    <td className="py-2 font-medium text-text-primary dark:text-neutral-100 capitalize">
                      {section.replace('_', ' ')}
                    </td>
                    <td className="text-center py-2">
                      {ADMIN_PERMISSION_LEVELS.SOLO_LECTURA[section as keyof typeof ADMIN_PERMISSION_LEVELS.SOLO_LECTURA] === 'read' ? '👁️' :
                       ADMIN_PERMISSION_LEVELS.SOLO_LECTURA[section as keyof typeof ADMIN_PERMISSION_LEVELS.SOLO_LECTURA] === 'readwrite' ? '✏️' :
                       ADMIN_PERMISSION_LEVELS.SOLO_LECTURA[section as keyof typeof ADMIN_PERMISSION_LEVELS.SOLO_LECTURA] === 'full' ? '🔧' : '🚫'}
                    </td>
                    <td className="text-center py-2">
                      {ADMIN_PERMISSION_LEVELS.LECTURA_ESCRITURA[section as keyof typeof ADMIN_PERMISSION_LEVELS.LECTURA_ESCRITURA] === 'read' ? '👁️' :
                       ADMIN_PERMISSION_LEVELS.LECTURA_ESCRITURA[section as keyof typeof ADMIN_PERMISSION_LEVELS.LECTURA_ESCRITURA] === 'readwrite' ? '✏️' :
                       ADMIN_PERMISSION_LEVELS.LECTURA_ESCRITURA[section as keyof typeof ADMIN_PERMISSION_LEVELS.LECTURA_ESCRITURA] === 'full' ? '🔧' : '🚫'}
                    </td>
                    <td className="text-center py-2">
                      {ADMIN_PERMISSION_LEVELS.COMPLETO[section as keyof typeof ADMIN_PERMISSION_LEVELS.COMPLETO] === 'read' ? '👁️' :
                       ADMIN_PERMISSION_LEVELS.COMPLETO[section as keyof typeof ADMIN_PERMISSION_LEVELS.COMPLETO] === 'readwrite' ? '✏️' :
                       ADMIN_PERMISSION_LEVELS.COMPLETO[section as keyof typeof ADMIN_PERMISSION_LEVELS.COMPLETO] === 'full' ? '🔧' : '🚫'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-3 flex justify-center space-x-6 text-xs text-text-tertiary dark:text-neutral-500">
            <div className="flex items-center space-x-1">
              <span>🚫</span>
              <span>Sin Acceso</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>👁️</span>
              <span>Solo Lectura</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>✏️</span>
              <span>Lectura y Escritura</span>
            </div>
            <div className="flex items-center space-x-1">
              <span>🔧</span>
              <span>Acceso Completo</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PermissionLevelSummary;
