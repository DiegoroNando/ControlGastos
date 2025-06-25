import React from 'react';
import { ChevronDown } from 'lucide-react';

const options = ['opción 1', 'opción 2', 'opción 3', 'opción 4'];

const Listado: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-lg p-6 w-full min-h-[300px]">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-lg font-semibold text-gray-600">Listado</h3>
      <ChevronDown className="w-6 h-6 text-gray-500 cursor-pointer" />
    </div>
    <ul className="space-y-4 max-h-60 overflow-y-auto text-gray-700 text-sm font-medium">
      {options.map((opt, idx) => (
        <li key={idx} className={`pb-3 ${idx === options.length - 1 ? 'text-gray-400' : 'border-b border-dotted border-gray-300'}`}>{opt}</li>
      ))}
    </ul>
  </div>
);

export default Listado;
