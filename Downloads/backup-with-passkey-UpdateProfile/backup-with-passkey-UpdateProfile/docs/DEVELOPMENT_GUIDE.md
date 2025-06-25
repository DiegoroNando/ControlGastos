# Guía de Desarrollo

## 🚀 Inicio Rápido para Desarrolladores

### Configuración del Entorno de Desarrollo

1. **Verificar Requisitos**
   ```bash
   node --version  # Debe ser v18+
   npm --version   # Verificar npm
   mongo --version # Verificar MongoDB
   ```

2. **Clonar y Configurar**
   ```bash
   cd sistema-votaciones-clean-organized
   npm install
   cp .env.example .env  # Configurar variables de entorno
   ```

3. **Iniciar Servicios de Desarrollo**
   ```bash
   npm run start:full
   ```

### Scripts de Desarrollo Útiles

```bash
# Solo frontend con hot reload
npm run dev

# Solo backend API con auto-restart
npm run dev:backend

# Solo servidor de emails con auto-restart
npm run dev:server

# Todos los servicios juntos
npm run start:full

# Build para producción
npm run build
```

## 🏗️ Arquitectura de Desarrollo

### Estructura de Carpetas src/

```
src/
├── components/           # Componentes React organizados por función
│   ├── admin/           # Componentes específicos de administración
│   ├── auth/            # Login, registro, autenticación
│   ├── candidate/       # Componentes relacionados con candidatos
│   ├── common/          # Componentes reutilizables (UI básico)
│   ├── post/            # Gestión de publicaciones
│   └── profile/         # Perfiles de usuario
├── contexts/            # React Contexts para estado global
├── hooks/               # Custom hooks reutilizables
├── pages/               # Páginas principales de la aplicación
├── services/            # Lógica de negocio y API calls
├── utils/               # Funciones de utilidad
└── api/                 # Configuración de endpoints
```

### Flujo de Datos

1. **Estado Global**: Manejado con React Context API
2. **API Calls**: Centralizados en services/
3. **Routing**: React Router con HashRouter
4. **Estilos**: Tailwind CSS con clases personalizadas

### Convenciones de Código

#### Naming Conventions
- **Componentes**: PascalCase (`UserProfile.tsx`)
- **Archivos**: camelCase para services/utils, PascalCase para componentes
- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **CSS Classes**: kebab-case o Tailwind classes

#### Estructura de Componentes
```tsx
// Imports
import React, { useState, useEffect } from 'react';
import { SomeType } from '../../types';

// Interfaces/Types
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// Component
export const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // State
  const [state, setState] = useState<SomeType>();
  
  // Effects
  useEffect(() => {
    // Logic
  }, []);
  
  // Handlers
  const handleAction = () => {
    // Handler logic
  };
  
  // Render
  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

## 🛠️ Herramientas de Desarrollo

### API Testing
- **URL**: Abrir `docs/backend-api-tester.html` en navegador
- **Endpoints**: Probar todos los endpoints del backend
- **Datos**: Crear, leer, actualizar, eliminar documentos

### Email Testing
- **URL**: http://localhost:3001/test-email
- **Función**: Probar envío de emails de verificación
- **SMTP**: Configurar credenciales en .env

### Database Debugging
```bash
# Conectar a MongoDB directamente
mongo sistema_votaciones

# Ver colecciones
show collections

# Ver usuarios
db.users.find().pretty()

# Ver configuración de bloques
db.blockSettings.find().pretty()
```

### Hot Reload
- **Frontend**: Cambios se reflejan automáticamente
- **Backend**: Nodemon reinicia servidor automáticamente
- **Estilos**: Tailwind CSS compila on-demand

## 📝 Patrones de Desarrollo

### Gestión de Estado
```tsx
// Context Pattern
const { user, login, logout } = useAuth();

// Local State Pattern
const [loading, setLoading] = useState(false);

// Form State Pattern
const [formData, setFormData] = useState({
  field1: '',
  field2: ''
});
```

### API Calls Pattern
```tsx
// En services/
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/users');
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// En componentes
const { success, error } = useToast();
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(false);

useEffect(() => {
  const loadUsers = async () => {
    setLoading(true);
    try {
      const userData = await fetchUsers();
      setUsers(userData);
      success('Usuarios cargados correctamente');
    } catch (err) {
      error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };
  
  loadUsers();
}, []);
```

### Error Handling
```tsx
// Toast notifications para UX
const { error, success } = useToast();

// Try-catch para API calls
try {
  await apiCall();
  success('Operación exitosa');
} catch (err) {
  error('Error en la operación');
  console.error(err);
}
```

## 🎨 Desarrollo de UI

### Tailwind CSS Custom Classes
```css
/* Clases personalizadas en index.css */
.spectra-btn-primary-enhanced {
  @apply bg-gradient-to-r from-custom-pink to-custom-pink-hover;
}

.spectra-form-enhanced {
  @apply bg-white/95 dark:bg-slate-700/95 border-2;
}
```

### Responsive Design
```tsx
// Mobile-first approach
<div className="
  w-full
  sm:w-1/2
  md:w-1/3
  lg:w-1/4
  xl:w-1/5
">
  Content
</div>
```

### Dark Mode Support
```tsx
// Classes automáticas
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
  Content
</div>
```

## 🔧 Troubleshooting

### Problemas Comunes

1. **Puerto en uso**
   ```bash
   # Encontrar proceso usando el puerto
   netstat -ano | findstr :3001
   # Terminar proceso
   taskkill /PID <PID> /F
   ```

2. **Dependencies issues**
   ```bash
   # Limpiar cache
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **MongoDB connection**
   ```bash
   # Verificar que MongoDB esté corriendo
   mongo --eval "db.adminCommand('ismaster')"
   ```

4. **Build errors**
   ```bash
   # Verificar TypeScript
   npx tsc --noEmit
   ```

### Debug Tips

1. **Console Logging**: Usar console.log() liberalmente durante desarrollo
2. **React DevTools**: Instalar extensión para debugging de componentes
3. **Network Tab**: Verificar API calls en DevTools
4. **MongoDB Logs**: Revisar logs de MongoDB para issues de DB

## 📦 Deployment

### Build para Producción
```bash
npm run build
```

### Variables de Entorno para Producción
```env
NODE_ENV=production
MONGODB_URI=mongodb://production-server:27017
SMTP_HOST=smtp.production.com
# ... otras variables
```

Esta guía proporciona todo lo necesario para comenzar el desarrollo en el proyecto organizado.
