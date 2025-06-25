import React from 'react';


interface CardProps {
  title: string;
  image: string;
  leftLabel: string;
  rightLabel: string;
}

const Card: React.FC<CardProps> = ({ title, image, leftLabel, rightLabel }) => (
  <div className="bg-[#eeeff0] rounded-xl shadow-lg overflow-hidden w-full max-w-sm mx-auto transform hover:scale-[1.02] transition-all duration-300 hover:shadow-xl">    <div className="p-1.5 sm:p-2 text-center border-b border-gray-200">
      <h2 className="text-xs sm:text-sm font-semibold text-gray-800">{title}</h2>
    </div><div className="mx-3 sm:mx-4 mt-1 sm:mt-2">
      <div className="h-16 sm:h-20 relative overflow-hidden rounded-t-2xl">
        {/* Purple border outline */}
        <div className="absolute inset-0 border-2 border-purple-400 rounded-t-2xl border-b-0" />        <img src={image} alt={`${title} Illustration`} className="w-full h-full object-cover" />
        {/* Decorative circles overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-2 left-3 w-3 h-3 bg-yellow-500 rounded-full opacity-80"></div>
          <div className="absolute top-4 right-4 w-2 h-2 bg-yellow-600 rounded-full opacity-70"></div>
          <div className="absolute bottom-3 left-4 w-3 h-3 bg-yellow-400 rounded-full opacity-60"></div>
          <div className="absolute bottom-5 right-3 w-2 h-2 bg-yellow-500 rounded-full opacity-80"></div>
        </div>
      </div>
      <div className="flex border-2 border-purple-400 border-t-0 rounded-b-2xl overflow-hidden">        <div className="flex-1 bg-[#B8860B] text-white text-center py-1">
          <span className="font-normal" style={{ fontSize: '10px' }}>{leftLabel}</span>
        </div>
        <div className="flex-1 bg-[#DAA520] text-white text-center py-1">
          <span className="font-normal" style={{ fontSize: '10px' }}>{rightLabel}</span>
        </div>
      </div>
    </div>    <div className="p-1.5 sm:p-2 text-center">
      <h3 className="text-xs font-bold text-gray-800 mb-1">¡FELICIDADES!</h3>
      <p className="text-xs text-gray-600 mb-1.5 sm:mb-2 leading-relaxed">
        Tienes la oportunidad de participar en este proceso
      </p>
      <button className="w-full border-2 border-[#B8860B] text-[#B8860B] font-semibold py-1 sm:py-1.5 px-3 rounded-full hover:bg-[#B8860B] hover:text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#B8860B] focus:ring-opacity-50 text-xs">
        PARTICIPAR
      </button>
    </div>
  </div>
);

const CardsContainer: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 w-full max-w-4xl mx-auto">
    <Card title="Admisión" image="4jun-12.png" leftLabel="Básico" rightLabel="Media Superior" />
    <Card title="Promoción" image="4jun-14.png" leftLabel="Básico" rightLabel="Media Superior" />
  </div>
);

export default CardsContainer;
