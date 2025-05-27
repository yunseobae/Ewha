// src/pages/EventList.js
import React from 'react';
import { Link } from 'react-router-dom';

const sampleEvents = [
  { id: 1, title: '7th 이화의밤', date: '2025-07-19' },
];

function EventList() {
  return (
    <div>
      <h1>이화의 밤 신청</h1>
      <ul>
        {sampleEvents.map(event => (
          <li key={event.id}>
            <Link to={`/event/${event.id}`}>
              {event.title} - {event.date}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default EventList;
