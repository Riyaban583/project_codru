import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventClickArg } from '@fullcalendar/core';

const Calendar = () => {
  const handleEventClick = (info: EventClickArg) => {
    info.jsEvent.preventDefault();
    if (info.event.url) {
      window.open(info.event.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-brand-blue">Class Schedule</h2>
          <p className="text-gray-500 font-body text-sm mt-1">View your upcoming sessions securely</p>
        </div>
      </div>

      <div className="flex-1 bg-white p-2 rounded-2xl [&_.fc-toolbar-title]:text-brand-blue [&_.fc-toolbar-title]:font-display [&_.fc-toolbar-title]:font-bold [&_.fc-button-primary]:bg-brand-blue [&_.fc-button-primary]:border-brand-blue [&_.fc-button-primary:hover]:bg-blue-800 [&_.fc-col-header-cell]:bg-slate-50 [&_.fc-col-header-cell]:py-2 [&_.fc-theme-standard_td]:border-gray-100 [&_.fc-theme-standard_th]:border-gray-100">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          height="65vh"
          // We point directly to your secure backend proxy route
          events={`${import.meta.env.VITE_API}calendar-events`}
          eventClick={handleEventClick}
        />
      </div>
    </div>
  );
};

export default Calendar;