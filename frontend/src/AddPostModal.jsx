import React from 'react';
import { X, Plus } from 'lucide-react'; // For icons

const AddPostModal = ({ isOpen, onClose, modalType }) => {
  if (!isOpen) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // In a real application, you'd handle form submission here,
    // e.g., send data to an API, update state, etc.
    alert(`Submitting new ${modalType || 'item'}! (This is a placeholder action)`);
    onClose(); // Close the modal after submission
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{modalType === 'post' ? 'Create New Post' : 'Add New Event'}</h2>
          <button onClick={onClose} className="modal-close">
            <X size={24} /> {/* X icon from lucide-react */}
          </button>
        </div>
        <form className="modal-form" onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label htmlFor="modalTitle" className="form-label">Title</label>
            <input type="text" id="modalTitle" className="form-input" placeholder="Enter title" required />
          </div>
          <div className="form-group">
            <label htmlFor="modalContent" className="form-label">Content</label>
            <textarea id="modalContent" className="form-textarea" rows="4" placeholder="What's on your mind?" required></textarea>
          </div>
          {modalType === 'event' && (
            <>
              <div className="form-group">
                <label htmlFor="eventDate" className="form-label">Date & Time</label>
                <input type="datetime-local" id="eventDate" className="form-input" required />
              </div>
              <div className="form-group">
                <label htmlFor="eventLocation" className="form-label">Location</label>
                <input type="text" id="eventLocation" className="form-input" placeholder="e.g., Auditorium A" />
              </div>
              <div className="form-group">
                <label htmlFor="eventPrice" className="form-label">Price (Optional)</label>
                <input type="text" id="eventPrice" className="form-input" placeholder="e.g., Free, $10" />
              </div>
              <div className="form-group">
                <label htmlFor="eventOrganizer" className="form-label">Organizer (Optional)</label>
                <input type="text" id="eventOrganizer" className="form-input" placeholder="e.g., Tech Club" />
              </div>
            </>
          )}
          {/* Optional: Add image input fields here if needed */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{modalType === 'post' ? 'Create Post' : 'Add Event'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPostModal;