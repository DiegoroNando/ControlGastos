
import React from 'react';
import { Button } from './CommonComponents';
import { isoToDateUTC, dateToIsoUTC, isBusinessDay } from '../../utils/dateUtils';

interface MiniCalendarProps {
  currentDisplayMonthDate: Date;
  onMonthChange: (newMonthDate: Date) => void;
  selectedStartDateIso: string | null;
  selectedEndDateIso: string | null;
  onDateClick: (dateIso: string) => void;
  minSelectableDateIso?: string | null;
  maxSelectableDateIso?: string | null;
  highlightColorName?: 'pink' | 'green';
  title?: string;
  selectionState?: 'none' | 'start-selected';
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({
  currentDisplayMonthDate,
  onMonthChange,
  selectedStartDateIso,
  selectedEndDateIso,
  onDateClick,
  minSelectableDateIso,
  maxSelectableDateIso,
  highlightColorName = 'pink',
  title,
  selectionState = 'none',
}) => {
  const daysOfWeek = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

  const year = currentDisplayMonthDate.getUTCFullYear();
  const month = currentDisplayMonthDate.getUTCMonth(); // 0-indexed

  const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));
  const numDaysInMonth = lastDayOfMonth.getUTCDate();
  const firstDayWeekday = firstDayOfMonth.getUTCDay(); // 0 (Sun) to 6 (Sat)

  const calendarGrid: (Date | null)[] = [];

  for (let i = 0; i < firstDayWeekday; i++) {
    calendarGrid.push(null);
  }
  for (let day = 1; day <= numDaysInMonth; day++) {
    calendarGrid.push(new Date(Date.UTC(year, month, day)));
  }
  while (calendarGrid.length % 7 !== 0 || calendarGrid.length < 35) { // Ensure at least 5 full weeks
    if (calendarGrid.length === 42) break; // Max 6 weeks
    calendarGrid.push(null);
  }
   // Trim empty week if month fits in 5 weeks and the 6th is all nulls from previous month
  if (calendarGrid.length === 42 && calendarGrid[35] === null ) {
     const firstDayOfLastRenderedWeek = calendarGrid[35 - 7];
     if (firstDayOfLastRenderedWeek && firstDayOfLastRenderedWeek.getUTCMonth() !== month){
        // This check might be too aggressive or not perfectly aligned with all calendar views.
        // Simplified: if the 35th cell is part of the current month, or if the month is very short,
        // it might need 6 weeks. Otherwise, 5 weeks (35 cells) is often enough.
        // The primary goal is that all days of the *currentDisplayMonthDate* are shown.
     }
  }


  const handlePrevMonth = () => {
    onMonthChange(new Date(Date.UTC(year, month - 1, 1)));
  };

  const handleNextMonth = () => {
    onMonthChange(new Date(Date.UTC(year, month + 1, 1)));
  };
  const getHighlightStyling = () => {
    const styles = {
        textClass: 'text-white dark:text-white', // Text for highlighted days
        startEndBgClass: '',    // Background for start/end of a segment/range
        rangeBgClass: '',       // Background for business days within a segment (not start/end)
        startOnlyBgClass: '',   // Background for start date when no end date is set
        defaultTextClass: 'text-text-primary dark:text-neutral-200',
        weekendTextClass: 'text-gray-400 dark:text-neutral-500',
        otherMonthTextClass: 'text-gray-300 dark:text-neutral-600 opacity-70',
        hoverClass: 'hover:bg-gray-200 dark:hover:bg-neutral-600',
        enhancedHoverClass: 'hover:bg-custom-pink/30 dark:hover:bg-custom-pink/25 hover:scale-105 transform transition-all duration-150',
    };
    if (highlightColorName === 'pink') {
        styles.startEndBgClass = 'bg-custom-pink';
        styles.rangeBgClass = 'bg-custom-pink/70 dark:bg-custom-pink/60';
        styles.startOnlyBgClass = 'bg-custom-pink/80 dark:bg-custom-pink/70 ring-2 ring-custom-pink ring-opacity-50';
    } else if (highlightColorName === 'green') {
        styles.startEndBgClass = 'bg-green-600 dark:bg-green-500';
        styles.rangeBgClass = 'bg-green-500/70 dark:bg-green-500/60';
        styles.startOnlyBgClass = 'bg-green-600/80 dark:bg-green-500/70 ring-2 ring-green-500 ring-opacity-50';
    }
    return styles;
  };
  const highlightStyles = getHighlightStyling();


  return (
    <div className="p-3 bg-gray-50 dark:bg-neutral-700/30 rounded-container-second shadow-sm border border-border-gray/50 dark:border-neutral-600/50">
      {title && <h4 className="text-sm font-medium text-text-secondary dark:text-neutral-300 mb-2 text-center">{title}</h4>}
      <div className="flex items-center justify-between mb-3">
        <Button onClick={handlePrevMonth} size="sm" variant="ghost" className="!p-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg>
        </Button>
        <div className="text-sm font-semibold text-text-primary dark:text-neutral-100">
          {new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(currentDisplayMonthDate)}
        </div>
        <Button onClick={handleNextMonth} size="sm" variant="ghost" className="!p-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg>
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px text-xs text-center text-text-tertiary dark:text-neutral-400 mb-1.5">
        {daysOfWeek.map(day => <div key={day} className="font-medium">{day}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {calendarGrid.map((date, index) => {
          if (!date) return <div key={`empty-${index}`} className="w-full aspect-square"></div>;

          const dateIso = dateToIsoUTC(date);
          const dayOfMonth = date.getUTCDate();
          const isCurrentMonthDay = date.getUTCMonth() === month;
          const isDayBusiness = isBusinessDay(date);
          
          let isDisabledByMinMax = false;
          if (minSelectableDateIso) {
            const minDate = isoToDateUTC(minSelectableDateIso);
            if (date < minDate) isDisabledByMinMax = true;
          }
          if (maxSelectableDateIso && !isDisabledByMinMax) {
            const maxDate = isoToDateUTC(maxSelectableDateIso);
            if (date > maxDate) isDisabledByMinMax = true;
          }

          const canBeInteractedWith = isDayBusiness && !isDisabledByMinMax && isCurrentMonthDay;
            let wrapperClasses = "w-full aspect-square flex items-center justify-center";
          let buttonClasses = "w-full h-full flex items-center justify-center text-xs focus:outline-none apple-focus-ring";
          let textContent = isCurrentMonthDay ? dayOfMonth.toString() : "";

          // Handle special case: start date selected but no end date yet
          if (selectionState === 'start-selected' && selectedStartDateIso && !selectedEndDateIso && dateIso === selectedStartDateIso) {
            buttonClasses += ` ${highlightStyles.textClass}`;
            wrapperClasses += ` ${highlightStyles.startOnlyBgClass} rounded-full`;
          }
          // Handle complete range selection
          else if (isDayBusiness && isCurrentMonthDay && selectedStartDateIso && selectedEndDateIso &&
              date >= isoToDateUTC(selectedStartDateIso) && date <= isoToDateUTC(selectedEndDateIso)) {
            // Business day is within the selected range (inclusive)
            buttonClasses += ` ${highlightStyles.textClass}`;
            const isRangeStart = dateIso === selectedStartDateIso;
            const isRangeEnd = dateIso === selectedEndDateIso;

            if (isRangeStart && isRangeEnd) { // Single business day selected
                wrapperClasses += ` ${highlightStyles.startEndBgClass} rounded-full`;
            } else if (isRangeStart) {
                wrapperClasses += ` ${highlightStyles.startEndBgClass} rounded-l-full`;
                const nextDay = new Date(Date.UTC(year, month, dayOfMonth + 1));
                if (dateToIsoUTC(nextDay) > selectedEndDateIso || !isBusinessDay(nextDay)) {
                    wrapperClasses += " rounded-r-full"; // It's also the end of a segment
                }
            } else if (isRangeEnd) {
                wrapperClasses += ` ${highlightStyles.startEndBgClass} rounded-r-full`;
                const prevDay = new Date(Date.UTC(year, month, dayOfMonth - 1));
                if (dateToIsoUTC(prevDay) < selectedStartDateIso || !isBusinessDay(prevDay)) {
                    wrapperClasses += " rounded-l-full"; // It's also the start of a segment
                }
            } else { // Business day in the middle of the range
                wrapperClasses += ` ${highlightStyles.rangeBgClass}`;
                const prevDay = new Date(Date.UTC(year, month, dayOfMonth - 1));
                const nextDay = new Date(Date.UTC(year, month, dayOfMonth + 1));                if (dateToIsoUTC(prevDay) < selectedStartDateIso || !isBusinessDay(prevDay)) {
                    wrapperClasses += " rounded-l-full"; // Starts segment after weekend/out-of-range
                }
                if (dateToIsoUTC(nextDay) > selectedEndDateIso || !isBusinessDay(nextDay)) {
                    wrapperClasses += " rounded-r-full"; // Ends segment before weekend/out-of-range
                }
            }
          } else if (canBeInteractedWith) {
            // Enhanced hover for selectable dates when in selection mode
            if (selectionState === 'start-selected' && selectedStartDateIso) {
              buttonClasses += ` ${highlightStyles.defaultTextClass} ${highlightStyles.enhancedHoverClass} rounded-full`;
            } else {
              buttonClasses += ` ${highlightStyles.defaultTextClass} ${highlightStyles.hoverClass} rounded-full`;
            }
          } else if (!isDayBusiness && isCurrentMonthDay) { // Weekend
            buttonClasses += ` ${highlightStyles.weekendTextClass} cursor-not-allowed`;
          } else { // Other month or disabled
            buttonClasses += ` ${highlightStyles.otherMonthTextClass} cursor-not-allowed`;
            textContent = isCurrentMonthDay ? dayOfMonth.toString() : ""; // Show day number for disabled current month days
          }
          
          const isPressed = isDayBusiness && isCurrentMonthDay && selectedStartDateIso === dateIso; // Or more complex logic if needed

          return (
            <div key={dateIso} className={wrapperClasses}>
              <button
                type="button"
                onClick={() => canBeInteractedWith && onDateClick(dateIso)}
                disabled={!canBeInteractedWith}
                className={buttonClasses}
                aria-pressed={isPressed} 
                aria-label={`Día ${dayOfMonth}`}
              >
                {textContent}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
