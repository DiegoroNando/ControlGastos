
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../index.css'; // Importamos CSS para estilos adicionales que no vienen de Tailwind CDN

// Configuración para mejora de rendimiento
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Elemento raíz de la aplicación
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No se pudo encontrar el elemento raíz para montar la aplicación");
}

// Crear la raíz de React
const root = ReactDOM.createRoot(rootElement);

// Renderizar la aplicación con StrictMode para detectar problemas durante el desarrollo
root.render(
  <React.StrictMode>
    <App isMobile={isMobile} />
  </React.StrictMode>
);
