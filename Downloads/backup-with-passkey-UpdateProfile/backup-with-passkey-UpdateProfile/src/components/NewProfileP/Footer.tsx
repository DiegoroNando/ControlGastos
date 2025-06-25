import React from 'react';
import GovLogo from '../Assets/Logo/Gobierno de México Logo Rojo.png';
import Pattern from '../Assets/Images/elements-03.png';
import { Facebook, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white pt-8">
      <div className="container mx-auto px-4 grid grid-cols-1 sm:grid-cols-5 gap-8 text-gray-700">
        {/* Column 1: Government Logo */}
        <div className="flex items-center">
          <img src={GovLogo} alt="Gobierno de México" className="h-12 object-contain" />
        </div>
        {/* Column 2: Enlaces */}
        <div>
          <h4 className="font-semibold mb-2">Enlaces</h4>
          <ul className="space-y-1 text-sm">
            <li>Participa</li>
            <li>Publicaciones oficiales</li>
            <li>Marco jurídico</li>
            <li>Plataforma nacional de transparencia</li>
          </ul>
        </div>
        {/* Column 3: ¿Qué es gob.mx? */}
        <div>
          <h4 className="font-semibold mb-2">¿Qué es gob.mx?</h4>
          <p className="text-sm leading-relaxed">
            Es el portal único de trámites, información y participación ciudadana. <span className="underline cursor-pointer">Leer más</span>
          </p>
        </div>
        {/* Column 4: List of links */}
        <div>
          <ul className="space-y-1 text-sm">
            <li>Portal de datos abiertos</li>
            <li>Declaración de accesibilidad</li>
            <li>Aviso de privacidad integral</li>
            <li>Aviso de privacidad simplificado</li>
            <li>Términos y condiciones</li>
            <li>Política de seguridad</li>
            <li>Mapa de sitio</li>
          </ul>
        </div>
        {/* Column 5: Denuncia & Social */}
        <div className="flex flex-col justify-between h-full">
          <div className="text-sm mb-4">Denuncia contra servidores públicos</div>
          <div>
            <div className="text-sm mb-1">Síguenos en</div>
            <div className="flex space-x-4">
              <Facebook className="w-5 h-5 cursor-pointer" />
              <Youtube className="w-5 h-5 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
      
    </footer>
  );
}
