# Sistema de Votaciones para Comité de Ética

Un sistema completo de votaciones para comités de ética con gestión de usuarios, candidatos, postulaciones y administración avanzada.

## 📁 Estructura del Proyecto

```
sistema-votaciones-clean-organized/
├── src/                          # Código fuente principal
│   ├── components/               # Componentes React
│   │   ├── admin/               # Componentes de administración
│   │   ├── auth/                # Componentes de autenticación
│   │   ├── candidate/           # Componentes de candidatos
│   │   ├── common/              # Componentes comunes/reutilizables
│   │   ├── post/                # Componentes de publicaciones
│   │   └── profile/             # Componentes de perfil
│   ├── contexts/                # Contextos de React (Auth, Theme, etc.)
│   ├── hooks/                   # Custom hooks
│   ├── pages/                   # Páginas principales
│   │   └── admin/               # Páginas de administración
│   ├── services/                # Servicios (API, base de datos, etc.)
│   ├── utils/                   # Utilidades y helpers
│   ├── api/                     # Configuración de API
│   ├── App.tsx                  # Componente principal
│   ├── index.tsx                # Punto de entrada
│   ├── constants.ts             # Constantes globales
│   └── types.ts                 # Definiciones de tipos TypeScript
├── public/                      # Archivos públicos estáticos
├── docs/                        # Documentación consolidada
├── server.js                    # Servidor principal (email, etc.)
├── backend-server.js            # Servidor de API de base de datos
├── package.json                 # Dependencias y scripts
├── vite.config.ts              # Configuración de Vite
├── tailwind.config.js          # Configuración de Tailwind CSS
└── index.html                  # HTML principal
```

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js (v18 o superior)
- npm o yarn
- MongoDB (localhost:27017)

### Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   cd sistema-votaciones-clean-organized
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Crear archivo `.env` en la raíz del proyecto:
   ```env
   # Puerto del servidor principal
   PORT=3001
   
   # Configuración SMTP para emails
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_USER=resend
   SMTP_PASSWORD=tu_password_smtp
   
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=sistema_votaciones
   
   # API Keys (opcional)
   GEMINI_API_KEY=tu_api_key_opcional
   ```

### Ejecución

#### Desarrollo (Recomendado)
```bash
# Inicia todos los servicios (frontend + servidor principal + backend API)
npm run start:full
```

#### Servicios Individuales
```bash
# Solo frontend (puerto 5173)
npm run dev

# Solo servidor principal - emails (puerto 3001) 
npm run dev:server

# Solo backend API - base de datos (puerto 3002)
npm run dev:backend
```

#### Producción
```bash
# Construir para producción
npm run build

# Vista previa de producción
npm run preview
```

## 🌐 Acceso al Sistema

- **Frontend**: http://localhost:5173
- **API Principal**: http://localhost:3001
- **API Base de Datos**: http://localhost:3002
- **Probador de Emails**: http://localhost:3001/test-email
- **Probador de API**: Abrir `backend-api-tester.html` en navegador

## 🏗️ Arquitectura

### Frontend (React + TypeScript + Vite)
- **Framework**: React 19 con TypeScript
- **Build Tool**: Vite para desarrollo rápido
- **Enrutador**: React Router DOM con HashRouter
- **Estilos**: Tailwind CSS con sistema de diseño personalizado
- **Estados**: Context API para manejo de estado global
- **Animaciones**: React Transition Group

### Backend
- **Servidor Principal** (`server.js`): Manejo de emails con Nodemailer
- **API Backend** (`backend-server.js`): CRUD completo para MongoDB
- **Base de Datos**: MongoDB con driver oficial

### Características Principales

#### 🔐 Autenticación y Seguridad
- Sistema de registro con verificación por email
- Hash seguro de contraseñas con bcrypt
- Migración automática de contraseñas antiguas
- Validación de CURP mexicano
- Sistema de lista blanca para usuarios autorizados

#### 👥 Gestión de Usuarios
- Tres roles: Usuario, Candidato, SuperAdmin
- Perfiles completos con información educativa y laboral
- Sistema de elegibilidad para candidatos
- Importación masiva desde Excel

#### 🗳️ Sistema Electoral
- Gestión de bloques electorales
- Calendario electoral configurable
- Votación segura con validaciones
- Estadísticas en tiempo real

#### 📊 Panel de Administración
- Dashboard con métricas avanzadas
- Gestión completa de usuarios
- Configuración de bloques y períodos electorales
- Herramientas de análisis y reportes

#### 🎨 Interfaz de Usuario
- Diseño moderno y responsivo
- Modo oscuro/claro
- Animaciones fluidas
- Optimización para móviles

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Frontend solamente
npm run dev:server       # Servidor principal con auto-reload
npm run dev:backend      # Backend API con auto-reload
npm run start            # Frontend + servidor principal
npm run start:full       # Todos los servicios

# Producción
npm run build           # Construir para producción
npm run preview         # Vista previa de build
npm run server          # Servidor principal (sin auto-reload)
npm run backend         # Backend API (sin auto-reload)
```

## 📚 API Endpoints

### Servidor Principal (Puerto 3001)
- `POST /api/send-verification` - Enviar código de verificación
- `POST /api/send-reminder` - Enviar recordatorios masivos
- `GET /test-email` - Página de pruebas de email

### API Backend (Puerto 3002)
- `GET /api/health` - Estado del servidor
- `POST /api/db/connect` - Probar conexión MongoDB
- `POST /api/db/create` - Crear documentos
- `GET /api/db/read` - Leer documentos
- `PUT /api/db/update` - Actualizar documentos
- `DELETE /api/db/delete` - Eliminar documentos
- `DELETE /api/db/drop-collection` - Eliminar colección completa
- `GET /api/db/collections` - Listar colecciones

## 🔧 Configuración Avanzada

### Personalización de Temas
El sistema utiliza un sistema de colores personalizado definido en `tailwind.config.js`:
- Colores primarios: Rosa personalizado y dorado
- Soporte completo para modo oscuro
- Variables CSS personalizadas

### Base de Datos
El sistema utiliza las siguientes colecciones principales:
- `users` - Información de usuarios
- `posts` - Publicaciones de candidatos
- `votes` - Registros de votación
- `whitelist` - Lista de CURPs autorizados
- `blockSettings` - Configuración de bloques electorales

### Variables de Entorno Adicionales
```env
# Configuración avanzada de email
EMAIL_FROM_NAME="Sistema de Votaciones"
EMAIL_FROM_ADDRESS="noreply@sistema-votaciones.com"

# Configuración de base de datos
MONGODB_MAX_POOL_SIZE=10
MONGODB_SERVER_SELECTION_TIMEOUT=5000

# Configuración de desarrollo
NODE_ENV=development
VITE_API_URL=http://localhost:3001
```

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a MongoDB**
   - Verificar que MongoDB esté ejecutándose en puerto 27017
   - Revisar configuración en variables de entorno

2. **Errores de email**
   - Verificar credenciales SMTP en `.env`
   - Probar con la página de pruebas: `/test-email`

3. **Errores de build**
   - Limpiar caché: `rm -rf node_modules package-lock.json && npm install`
   - Verificar versión de Node.js

### Logs y Debugging
- Los logs del servidor se muestran en consola
- Utilizar herramientas de desarrollo del navegador para frontend
- API tester incluido para probar endpoints

## 🤝 Contribución

Este es un proyecto organizado y listo para desarrollo. La estructura modular facilita:
- Mantenimiento del código
- Adición de nuevas características
- Testing y debugging
- Despliegue en diferentes entornos

## 📄 Licencia

Proyecto propietario para sistema de votaciones de comité de ética.

---

## 📝 Notas de Migración

Este proyecto ha sido reorganizado desde una estructura plana a una estructura modular con:
- Separación clara de responsabilidades
- Mejor organización de archivos
- Documentación consolidada
- Eliminación de archivos innecesarios

### Archivos Consolidados
- Múltiples archivos `.md` → `README.md` principal
- Archivos de prueba dispersos → Estructura organizada
- Configuraciones duplicadas → Configuración única

Para más información técnica detallada, consultar la documentación en línea o los comentarios en el código fuente.
