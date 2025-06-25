import React from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';

const MedallasCarousel: React.FC = () => (
  <div className="w-full bg-[#ECE9E6] rounded-2xl flex items-center px-6 py-4 mb-8 shadow-sm">
    <span className="text-gray-500 font-medium mr-6">Medallas</span>
    <button className="p-2">
      <ChevronLeft className="w-6 h-6 text-gray-400" />
    </button>
    <div className="flex gap-6 flex-1 justify-center">
      {/* First slot: user icon */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center border-4"
        style={{ borderColor: 'gold', boxShadow: '0 0 0 2px #fff, 0 2px 8px 0 rgba(0,0,0,0.04)' }}
      >
        <User className="w-7 h-7 text-[#E7CD8C]" />
      </div>
      {/* Empty slots */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-14 h-14 rounded-full border-4"
          style={{ borderColor: 'gold', boxShadow: '0 0 0 2px #fff, 0 2px 8px 0 rgba(0,0,0,0.04)' }}
        />
      ))}
    </div>
    <button className="p-2">
      <ChevronRight className="w-6 h-6 text-gray-400" />
    </button>
  </div>
);

export default MedallasCarousel;
