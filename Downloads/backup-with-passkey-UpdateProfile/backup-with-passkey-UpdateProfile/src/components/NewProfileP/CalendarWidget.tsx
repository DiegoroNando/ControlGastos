import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarWidget: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const currentMonth = currentDate.toLocaleString('es-ES', { month: 'long' });
  const currentYear = currentDate.getFullYear();
  const currentMonthNumber = currentDate.getMonth();

  const firstDayOfMonth = new Date(currentYear, currentMonthNumber, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonthNumber + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const calendarDays: Array<{ date: string; isEmpty: boolean; isToday?: boolean; key: string }> = [];

  for (let i = 0; i < adjustedFirstDay; i++) {
    calendarDays.push({ date: '', isEmpty: true, key: `empty-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const isToday =
      today.getDate() === day &&
      today.getMonth() === currentMonthNumber &&
      today.getFullYear() === currentYear;

    calendarDays.push({ date: day.toString(), isEmpty: false, isToday, key: `day-${day}` });
  }

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const goToPreviousMonth = () => setCurrentDate(new Date(currentYear, currentMonthNumber - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentYear, currentMonthNumber + 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 w-full relative">
      <div className="absolute" style={{ width: '247.63px', height: '161.26px', top: '38.59px', left: '19.25px' }}>
        <div className="text-center mb-4">
          <h3 className="text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide">
            CALENDARIO ESCOLAR {currentYear}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <button onClick={goToPreviousMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-gray-800 capitalize">{currentMonth}</h2>
            <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button onClick={goToToday} className="text-xs text-[#9F2241] hover:underline mt-1">Ir a hoy</button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, idx) => (
            <div key={idx} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(day => (
            <div
              key={day.key}
              className={`aspect-square flex items-center justify-center text-xs sm:text-sm relative transition-colors ${
                day.isEmpty
                  ? ''
                  : day.isToday
                  ? 'bg-[#9F2241] text-white rounded-full font-bold shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 rounded-full cursor-pointer'
              }`}
            >
              {!day.isEmpty && day.date}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarWidget;
