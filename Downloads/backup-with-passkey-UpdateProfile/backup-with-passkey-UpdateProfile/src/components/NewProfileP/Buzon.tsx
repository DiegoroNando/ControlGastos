import React, { useState } from 'react';
import { Mail } from 'lucide-react';

const Buzon: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Comunicados');
  const buzonItems = [
    { label: 'Informe Presidencial', date: 'Hoy', active: true },
    { label: 'Citatorio para presentar', date: 'Ayer', active: false },
    { label: 'Ademdum', date: 'Antier', active: false },
    { label: 'Nombramiento de Dirección', date: 'Antier', active: false },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col w-full min-h-[300px]">
      <h3 className="text-lg font-semibold text-gray-600 mb-4">Buzón</h3>
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center mr-3 relative">
          <Mail className="h-6 w-6 text-white" />
          <span className="absolute top-0 right-0 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white"></span>
        </div>
        <div className="flex bg-gray-200 rounded-full p-1">
          <button
            onClick={() => setActiveTab('Comunicados')}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              activeTab === 'Comunicados' ? 'bg-blue-500 text-white shadow' : 'text-gray-600'
            }`}
          >
            Comunicados
          </button>
          <button
            onClick={() => setActiveTab('Circulares')}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              activeTab === 'Circulares' ? 'bg-blue-500 text-white shadow' : 'text-gray-600'
            }`}
          >
            Circulares
          </button>
        </div>
      </div>
      <ul className="space-y-2 overflow-y-auto flex-1">
        {buzonItems.map((item, idx) => (
          <li
            key={idx}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
              item.active ? 'bg-blue-50' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center">
              <span className={`w-2.5 h-2.5 rounded-full mr-4 ${item.active ? 'bg-yellow-500 border-2 border-yellow-300' : 'bg-gray-300'}`}></span>
              <span className="text-sm font-medium text-gray-800">{item.label}</span>
            </div>
            <span className="text-xs text-gray-500">{item.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Buzon;
