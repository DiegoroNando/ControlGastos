import React from 'react';
import GobiImg from '../Assets/Images/gobbi.png';

interface LoaderProps {
  onClose: () => void;
}

export function Loader({ onClose }: LoaderProps) {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center animate-fadeIn">
      <div className="w-80 h-80 bg-gradient-to-br from-red-500 to-purple-700 rounded-full flex flex-col items-center justify-center p-6 animate-fadeIn">
        <img src={GobiImg} alt="GOBI" className="w-24 h-24 mb-4 object-contain animate-float" />
        <h1 className="text-white text-2xl font-bold text-center mb-2">¡Bienvenido docente!</h1>
        <p className="text-white text-base text-center">Soy GOBI, tu asistente virtual</p>
        <button
          onClick={onClose}
          className="mt-6 w-16 h-16 bg-white text-red-500 rounded-full flex items-center justify-center font-semibold text-lg hover:bg-gray-100 transition-colors transform hover:scale-110 duration-200"
        >
          Ok
        </button>
      </div>
    </div>
  );
}
