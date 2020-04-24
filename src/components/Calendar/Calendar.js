import React from 'react';
import '@progress/kendo-theme-material/dist/all.css';
import './Calendar.scss';

import { Scheduler, AgendaView, DayView, WeekView, WorkWeekView, MonthView } from '@progress/kendo-react-scheduler';
import { Day } from '@progress/kendo-date-math';

const Calendar = ({
    events,
    handleDataChange
}) => (
    <div className="site-scheduler-container">
        <Scheduler data={events}
            onDataChange={handleDataChange}
            editable={{ add: true, remove: true, drag: true, resize: true, edit: true }}
            className="site-scheduler"
            height='100%'>
            <AgendaView />
            <DayView editable />
            <WeekView title="Full Week" />
            <WorkWeekView title="Work Week" workWeekStart={Day.Monday} workWeekEnd={Day.Thursday} />
            <MonthView editable />
        </Scheduler>
    </div>
);

export default Calendar;
