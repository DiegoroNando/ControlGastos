import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Send, Lock, FileText } from 'lucide-react';
import CambioCard from './CambioCard';


const RightSidePanel: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: '', isEmpty: true, isToday: false, hasAttended: false, isPast: false });
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDay = new Date(year, month, day);
      const isToday = currentDay.toDateString() === today.toDateString();
      const isPast = currentDay < today && !isToday;
      const hasAttended = Math.random() > 0.7; // Random attendance for demo
      
      days.push({
        day: day,
        isEmpty: false,
        isToday,
        hasAttended,
        isPast
      });
    }
    
    return days;
  };
  const calendarDays = getCalendarDays();
  
  return (    <div className="flex flex-col gap-4 w-full">
      {/* CambioCard at the top */}
      <CambioCard />      {/* Medallas Component - in its original position */}
      <div className="bg-white rounded-2xl shadow-sm p-4 w-full">
        <div className="flex items-center justify-between">
          <div className="flex-shrink-0">
            <span className="text-sm font-medium text-gray-700">Medallas</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-full transition-all duration-200 ${
                    i === 0 
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-md' 
                      : 'border border-yellow-400 bg-white'
                  }`}
                >
                  {i === 0 && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <button className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Main layout: Components on left, Calendar on right */}
      <div className="flex gap-4">{/* Left side - Components */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Security Component */}
          <div className="bg-white rounded-2xl shadow-sm p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Seguridad</span>
            </div>
          </div>

          {/* Messages Component */}
          <div className="bg-white rounded-2xl shadow-sm p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <Send className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Mensajes</span>
            </div>
          </div>

          {/* Nomina Component */}
          <div className="bg-white rounded-2xl shadow-sm p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-800">Calendario</span>
            </div>
          </div>
        </div>
          {/* Right side - Calendar */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="text-center mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-2">CALENDARIO ESCOLAR {currentDate.getFullYear()}</div>
              <div className="flex items-center justify-between">
                <button className="p-1" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <div className="font-semibold text-gray-800 text-sm">
                  {monthNames[currentDate.getMonth()]}
                </div>
                <button className="p-1" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(day => (
                <div key={day} className="font-medium text-gray-500 py-1 text-xs">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`aspect-square flex items-center justify-center text-xs relative ${
                    day.isEmpty 
                      ? '' 
                      : day.isToday
                        ? 'bg-red-600 text-white rounded-full font-bold'
                        : day.hasAttended
                          ? 'bg-red-600 text-white rounded-full'
                          : day.isPast
                            ? 'text-gray-400'
                            : 'text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer'
                  }`}
                >
                  {!day.isEmpty && day.day}
                </div>
              ))}
            </div>
          </div>
          
         
        </div>
      </div>
       {/* PROFE Component - below calendar */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mt-4">
            <img
              src="profe.png"
              alt="PROFE - Profesionalización Cursos y evaluaciones"
              className="w-full h-auto object-cover rounded-xl"
            />
          </div>
    </div>
  );
};

export default RightSidePanel;
