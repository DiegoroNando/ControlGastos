import React from 'react';
import { FileText, BookOpen } from 'lucide-react';

const QuickLinks: React.FC = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 w-full max-w-full">
    {/* First Quick Link Container */}    <div className="bg-[#B8860B] text-white rounded-xl p-3 lg:p-4 flex flex-col sm:flex-row items-start sm:items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] min-w-0">
      {/* Icon */}
      <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-grow w-full min-w-0">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>
              <span className="font-medium leading-tight truncate">Acuerdo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>
              <span className="font-medium leading-tight truncate">Convocatorias</span>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>
              <span className="font-medium leading-tight truncate">Contacto</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></div>
              <span className="font-medium leading-tight truncate">Guías de estudio</span>
            </div>
          </div>
        </div>
      </div>
    </div>    {/* Second Quick Link Container */}
    <div className="bg-[#EBD45B] text-gray-800 rounded-xl p-3 lg:p-4 flex flex-col sm:flex-row items-start sm:items-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] min-w-0">
      {/* Icon */}
      <div className="flex-shrink-0 mb-2 sm:mb-0 sm:mr-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-30 rounded-lg flex items-center justify-center">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-grow w-full min-w-0">
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gray-800 rounded-full flex-shrink-0"></div>
              <span className="font-medium leading-tight truncate">Acuerdo</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gray-800 rounded-full flex-shrink-0"></div>
              <span className="font-medium leading-tight truncate">Convocatorias</span>
            </div>
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gray-800 rounded-full flex-shrink-0"></div>
              <span className="font-medium leading-tight truncate">Contacto</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-gray-800 rounded-full flex-shrink-0"></div>
              <span className="font-medium leading-tight truncate">Guías de estudio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default QuickLinks;
