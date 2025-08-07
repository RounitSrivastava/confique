import React from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // For routing

const EventDetail = ({ events }) => {
  const { id } = useParams(); // Get the event ID from the URL
  const navigate = useNavigate(); // For navigating back

  // In a real app, you'd fetch the event details from an API using the 'id'
  // For now, let's find the event from the 'events' prop (simulated data)
  const event = events.find(e => e.id === id);

  if (!event) {
    return (
      <div className="post-detail-page-container">
        <div className="main-content-placeholder">
          <p>Event not found!</p>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '20px' }}>
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Helper to format date and time
  const formatDateTime = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString('en-US', options);
  };

  return (
    <div className="post-detail-page-container">
      <button onClick={() => navigate(-1)} className="btn-secondary" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
        Back to Events
      </button>

      <div className="post-card"> {/* Reusing post-card styling for consistent look */}
        <div className="post-header">
          <div className="post-avatar"></div> {/* Event creator avatar */}
          <div className="post-info">
            <h3 className="post-author">{event.author}</h3>
            <p className="post-timestamp">{formatDateTime(event.timestamp)}</p>
          </div>
          <span className="post-type-badge event">Event</span>
        </div>

        <div className="post-content">
          <h1 className="post-title">{event.title}</h1>
          <p className="post-text">{event.fullDescription || event.text}</p> {/* Use fullDescription if available */}

          {event.images && event.images.length > 0 && (
            <div className={`post-images ${event.images.length === 1 ? 'single' : event.images.length === 2 ? 'double' : event.images.length === 3 ? 'triple' : 'quad'}`}>
              {event.images.map((img, index) => (
                <img key={index} src={img} alt={`Event Image ${index + 1}`} className="post-image" />
              ))}
            </div>
          )}

          <div className="event-details" style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
            <div className="event-detail">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>{formatDateTime(event.date)}</span>
            </div>
            <div className="event-detail">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{event.location}</span>
            </div>
            {event.price && (
              <div className="event-detail">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span>{event.price}</span>
              </div>
            )}
            {event.organizer && (
              <div className="event-detail">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>{event.organizer}</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
          <button className="btn-primary">Register for Event</button>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;