// App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, 
  Calendar as CalendarIcon, 
  MessageCircle, 
  User, 
  Plus, 
  X, 
  Image as ImageIcon, 
  MapPin, 
  Clock, 
  Heart, 
  MessageCircle as MessageIcon, 
  Share2, 
  Bell, 
  Search, 
  Send, 
  ArrowLeft, 
  Info, 
  CalendarPlus, 
  Landmark, 
  Languages, 
  Timer, 
  Ticket, 
  LogOut, 
  ArrowRight,
  Moon,
  Sun
} from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

const initialPosts = [
  {
      id: '1',
      type: 'confession',
      title: 'Late Night Thoughts',
      content: 'Sometimes I wonder if anyone else feels like they\'re just pretending to be an adult. Like, I\'m paying bills and making decisions, but inside I still feel like I\'m 16 and have no idea what I\'m doing.',
      images: ['https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=400'],
      author: 'Anonymous',
      userId: 'user123',
      timestamp: new Date(2024, 5, 10, 14, 30),
      likes: 234,
      comments: 45,
      commentData: [
          { id: 'c1', author: 'UserA', text: 'Totally relate to this!', timestamp: new Date(2024, 5, 10, 15, 0) },
          { id: 'c2', author: 'UserB', text: 'You\'re not alone!', timestamp: new Date(2024, 5, 10, 15, 15) },
      ]
  },
  {
      id: '2',
      type: 'event',
      title: 'Community Art Festival',
      content: 'Join us for a weekend of creativity, music, and local art! Food trucks, live performances, and art workshops for all ages.',
      images: [
          'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=400',
          'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=400',
          'https://images.pexels.com/photos/1916825/pexels-photo-1916825.jpeg?auto=compress&cs=tinysrgb&w=400',
          'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=400'
      ],
      author: 'Community Center',
      userId: 'user456',
      timestamp: new Date(2024, 5, 8, 9, 0),
      likes: 156,
      comments: 23,
      location: 'Central Park',
      eventDate: new Date(2025, 7, 1, 10, 0),
      price: 0,
      language: 'English',
      duration: '3 Hours',
      ticketsNeeded: 'All ages',
      venueAddress: '123 Main St, Central Park, City, Country',
      registrationLink: 'https://example.com/art-festival',
      registrationOpen: true,
      commentData: [
          { id: 'c3', author: 'EventFan', text: 'Can\'t wait for this!', timestamp: new Date(2024, 5, 8, 9, 30) },
      ]
  },
  {
      id: '3',
      type: 'event',
      title: 'Past Music Concert',
      content: 'This was an amazing concert that already happened last month.',
      images: [
          'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=400'
      ],
      author: 'Music Events Inc',
      userId: 'user789',
      timestamp: new Date(2024, 3, 15, 14, 0),
      likes: 89,
      comments: 12,
      location: 'City Stadium',
      eventDate: new Date(2024, 4, 15, 19, 0),
      price: 50,
      language: 'English',
      duration: '4 Hours',
      ticketsNeeded: 'All ages',
      venueAddress: '456 Stadium Road, City, Country',
      registrationLink: 'https://example.com/music-concert',
      registrationOpen: false,
      commentData: [
          { id: 'c4', author: 'ConcertGoer', text: 'Had a great time!', timestamp: new Date(2024, 4, 16, 10, 0) },
      ]
  },
  {
      id: '4',
      type: 'event',
      title: 'Tech Meetup: AI & Future',
      content: 'Exploring the latest developments in AI technology and its impact on our daily lives. Network with like-minded professionals and students.',
      images: [
          'https://images.pexels.com/photos/3861972/pexels-photo-3861972.jpeg?auto=compress&cs=tinysrgb&w=400',
          'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=400'
      ],
      author: 'Tech Community',
      userId: 'user101',
      timestamp: new Date(2024, 5, 5, 11, 30),
      likes: 201,
      comments: 38,
      location: 'Innovation Hub',
      eventDate: new Date(2025, 8, 5, 18, 30),
      price: 479,
      language: 'English',
      duration: '2 Hours',
      ticketsNeeded: '3 yrs & above',
      venueAddress: 'joypee wishtown, I-7, Aoparpur, Sector 131, Noida, Uttar Pradesh 201304, India',
      registrationLink: 'https://example.com/tech-meetup',
      registrationOpen: true,
      commentData: []
  },
  {
      id: '5',
      type: 'event',
      title: 'Free Yoga in the Park',
      content: 'Join us every Saturday morning for free yoga sessions in the park. All levels welcome!',
      images: ['https://images.pexels.com/photos/1812964/pexels-photo-1812964.jpeg?auto=compress&cs=tinysrgb&w=400'],
      author: 'Community Wellness',
      userId: 'user112',
      timestamp: new Date(2024, 5, 12, 8, 0),
      likes: 89,
      comments: 15,
      location: 'City Park',
      eventDate: new Date(2025, 6, 5, 8, 0),
      price: 0,
      language: 'English',
      duration: '1 Hour',
      ticketsNeeded: 'All ages',
      venueAddress: '789 Park Avenue, City, Country',
      registrationOpen: true,
      commentData: []
  }
];

const CommentItem = ({ comment }) => (
  <div className="comment-item">
      <div className="comment-avatar"></div>
      <div className="comment-content-wrapper">
          <div className="comment-header-info">
              <span className="comment-author">{comment.author}</span>
              <span className="comment-timestamp">
                  {comment.timestamp.toLocaleDateString()} {comment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
          </div>
          <p className="comment-text">{comment.text}</p>
      </div>
  </div>
);

const CommentSection = ({ comments, onAddComment, onCloseComments }) => {
  const [newCommentText, setNewCommentText] = useState('');

  const handleAddCommentSubmit = (e) => {
      e.preventDefault();
      if (newCommentText.trim()) {
          onAddComment(newCommentText);
          setNewCommentText('');
      }
  };

  return (
      <div className="comment-section">
          <div className="comment-section-header">
              <button onClick={onCloseComments} className="back-to-post-btn" title="Back to Post">
                  <ArrowLeft size={18} />
              </button>
              <h4 className="comment-section-title">Comments</h4>
          </div>
          <form onSubmit={handleAddCommentSubmit} className="comment-input-form">
              <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="comment-input"
              />
              <button type="submit" className="comment-submit-btn" title="Add Comment">
                  <ArrowRight size={18} />
              </button>
          </form>
          <div className="comments-list">
              {comments.length > 0 ? (
                  comments.map(comment => (
                      <CommentItem key={comment.id} comment={comment} />
                  ))
              ) : (
                  <p className="no-comments-message">No comments yet. Be the first to comment!</p>
              )}
          </div>
      </div>
  );
};

const RegistrationFormModal = ({ isOpen, onClose, event }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
      e.preventDefault();
      alert(`Thank you ${name} for registering for ${event.title}! A confirmation has been sent to ${email}.`);
      onClose();
  };

  if (!isOpen) return null;

  return (
      <div className="modal-overlay">
          <div className="modal-content">
              <div className="modal-header">
                  <h2 className="modal-title">Register for {event.title}</h2>
                  <button className="modal-close" onClick={onClose}>
                      <X size={24} />
                  </button>
              </div>
              <div className="modal-form-container">
                  <form onSubmit={handleSubmit} className="modal-form">
                      <div className="form-group">
                          <label className="form-label">Full Name</label>
                          <input
                              type="text"
                              className="form-input"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                          />
                      </div>
                      <div className="form-group">
                          <label className="form-label">Email</label>
                          <input
                              type="email"
                              className="form-input"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                          />
                      </div>
                      <div className="form-group">
                          <label className="form-label">Phone Number</label>
                          <input
                              type="tel"
                              className="form-input"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              required
                          />
                      </div>
                      <div className="modal-actions">
                          <button type="button" className="btn-secondary" onClick={onClose}>
                              Cancel
                          </button>
                          <button type="submit" className="btn-primary">
                              Submit Registration
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
  );
};

const AddPostModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
      type: 'confession',
      title: '',
      content: '',
      author: '',
      location: '',
      eventDate: '',
      price: 0,
      language: 'English',
      duration: '',
      ticketsNeeded: '',
      venueAddress: '',
      registrationLink: '',
      registrationOpen: true,
      enableRegistrationForm: false,
      registrationFields: ''
  });
  
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
      e.preventDefault();
      const newPost = {
          id: Date.now().toString(),
          timestamp: new Date(),
          likes: 0,
          comments: 0,
          type: formData.type,
          title: formData.title,
          content: formData.content,
          images: imagePreviews,
          author: formData.author || 'Anonymous',
          ...(formData.type === 'event' && {
              location: formData.location,
              eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
              price: formData.price,
              language: formData.language,
              duration: formData.duration,
              ticketsNeeded: formData.ticketsNeeded,
              venueAddress: formData.venueAddress,
              registrationLink: formData.registrationLink,
              registrationOpen: formData.registrationOpen,
              enableRegistrationForm: formData.enableRegistrationForm,
              registrationFields: formData.registrationFields
          }),
          commentData: []
      };
      onSubmit(newPost);
      setFormData({
          type: 'confession',
          title: '',
          content: '',
          author: '',
          location: '',
          eventDate: '',
          price: 0,
          language: 'English',
          duration: '',
          ticketsNeeded: '',
          venueAddress: '',
          registrationLink: '',
          registrationOpen: true,
          enableRegistrationForm: false,
          registrationFields: ''
      });
      setImagePreviews([]);
      onClose();
  };

  const handleImageUpload = (e) => {
      const files = Array.from(e.target.files);
      e.target.value = null;
      
      if (!files.length) return;

      const availableSlots = 4 - imagePreviews.length;
      if (availableSlots <= 0) {
          alert('You can only add up to 4 images');
          return;
      }

      const filesToProcess = files.slice(0, availableSlots);
      const newPreviews = [];

      filesToProcess.forEach(file => {
          const reader = new FileReader();
          reader.onload = (e) => {
              newPreviews.push(e.target.result);
              if (newPreviews.length === filesToProcess.length) {
                  setImagePreviews(prev => [...prev, ...newPreviews]);
              }
          };
          reader.readAsDataURL(file);
      });
  };

  const removeImage = (index) => {
      const newPreviews = [...imagePreviews];
      newPreviews.splice(index, 1);
      setImagePreviews(newPreviews);
  };

  if (!isOpen) return null;

  return (
      <div className="modal-overlay">
          <div className="modal-content">
              <div className="modal-header">
                  <h2 className="modal-title">
                      Add New {
                          formData.type === 'confession' ? 'Confession' :
                              formData.type === 'event' ? 'Event' : 'News Item'
                      }
                  </h2>
                  <button className="modal-close" onClick={onClose}>
                      <X size={24} />
                  </button>
              </div>

              <div className="modal-form-container">
                  <form onSubmit={handleSubmit} className="modal-form">
                      <div className="form-group">
                          <label className="form-label">Type</label>
                          <select
                              className="form-select"
                              value={formData.type}
                              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                          >
                              <option value="confession">Confession</option>
                              <option value="event">Event</option>
                          </select>
                      </div>

                      <div className="form-group">
                          <label className="form-label">Title</label>
                          <input
                              type="text"
                              className="form-input"
                              value={formData.title}
                              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                              required
                          />
                      </div>

                      <div className="form-group">
                          <label className="form-label">Content</label>
                          <textarea
                              className="form-textarea"
                              value={formData.content}
                              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                              rows={4}
                              required
                          />
                      </div>

                      <div className="form-group">
                          <label className="form-label">Author</label>
                          <input
                              type="text"
                              className="form-input"
                              value={formData.author}
                              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                              placeholder="Anonymous"
                          />
                      </div>

      {formData.type === 'event' && (
                          <div className="event-form-section">
                              <div className="form-group">
                                  <label className="form-label">Location</label>
                                  <input
                                      type="text"
                                      className="form-input"
                                      value={formData.location}
                                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                      required
                                  />
                              </div>
                              <div className="form-group">
                                  <label className="form-label">Venue Address</label>
                                  <input
                                      type="text"
                                      className="form-input"
                                      value={formData.venueAddress}
                                      onChange={(e) => setFormData(prev => ({ ...prev, venueAddress: e.target.value }))}
                                      required
                                  />
                              </div>
                              <div className="form-group">
                                  <label className="form-label">Event Date</label>
                                  <input
                                      type="datetime-local"
                                      className="form-input"
                                      value={formData.eventDate}
                                      onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                                      required
                                  />
                              </div>
                              <div className="form-group">
                                  <label className="form-label">Price (₹)</label>
                                  <input
                                      type="number"
                                      className="form-input"
                                      value={formData.price}
                                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value ? parseFloat(e.target.value) : 0 }))}
                                      min="0"
                                      required
                                  />
                              </div>
                              <div className="form-group">
                                  <label className="form-label">Registration Open</label>
                                  <select
                                      className="form-select"
                                      value={formData.registrationOpen}
                                      onChange={(e) => setFormData(prev => ({ ...prev, registrationOpen: e.target.value === 'true' }))}
                                  >
                                      <option value="true">Yes</option>
                                      <option value="false">No</option>
                                  </select>
                              </div>
                              <div className="form-group">
                                  <label className="form-label">Language</label>
                                  <input
                                      type="text"
                                      className="form-input"
                                      value={formData.language}
                                      onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                                      required
                                  />
                              </div>
                              <div className="form-group">
                                  <label className="form-label">Duration</label>
                                  <input
                                      type="text"
                                      className="form-input"
                                      value={formData.duration}
                                      onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                                      placeholder="e.g., 3 Hours"
                                      required
                                  />
                              </div>
                              <div className="form-group">
                                  <label className="form-label">Tickets Needed For</label>
                                  <input
                                      type="text"
                                      className="form-input"
                                      value={formData.ticketsNeeded}
                                      onChange={(e) => setFormData(prev => ({ ...prev, ticketsNeeded: e.target.value }))}
                                      placeholder="e.g., All ages"
                                      required
                                  />
                              </div>
                              <div className="form-group">
                                  <label className="form-label">Registration Link</label>
                                  <input
                                      type="url"
                                      className="form-input"
                                      value={formData.registrationLink}
                                      onChange={(e) => setFormData(prev => ({ ...prev, registrationLink: e.target.value }))}
                                      placeholder="https://example.com/register"
                                  />
                              </div>
                              
                              <div className="form-group">
                                  <label className="form-label">
                                      <input
                                          type="checkbox"
                                          checked={formData.enableRegistrationForm}
                                          onChange={(e) => setFormData(prev => ({ ...prev, enableRegistrationForm: e.target.checked }))}
                                      />
                                      Enable Registration Form
                                  </label>
                              </div>
                              
                              {formData.enableRegistrationForm && (
                                  <div className="form-group">
                                      <label className="form-label">Registration Form Fields</label>
                                      <input
                                          type="text"
                                          className="form-input"
                                          value={formData.registrationFields}
                                          onChange={(e) => setFormData(prev => ({ ...prev, registrationFields: e.target.value }))}
                                          placeholder="Add fields (e.g., name, email, phone)"
                                      />
                                      <p className="form-hint">Enter comma-separated field names for your registration form</p>
                                  </div>
                              )}
                          </div>
                      )}

                      <div className="form-group">
                          <label className="form-label">Images (Max 4)</label>
                          <div className="image-upload-container">
                              <div className="upload-btn-wrapper">
                                  <div className="upload-btn">
                                      <ImageIcon size={16} />
                                      <span>Upload Images</span>
                                  </div>
                                  <input 
                                      ref={fileInputRef}
                                      type="file" 
                                      accept="image/*" 
                                      multiple 
                                      onChange={handleImageUpload}
                                  />
                              </div>
                              
                              {imagePreviews.length > 0 && (
                                  <div className="image-upload-preview">
                                      {imagePreviews.map((preview, index) => (
                                          <div key={index} className="image-preview-item">
                                              <img src={preview} alt={`Preview ${index + 1}`} />
                                              <button 
                                                  type="button" 
                                                  className="remove-image-btn"
                                                  onClick={() => removeImage(index)}
                                              >
                                                  <X size={14} />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="modal-actions">
                          <button type="button" className="btn-secondary" onClick={onClose}>
                              Cancel
                          </button>
                          <button type="submit" className="btn-primary">
                              Post
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
  );
};

const EventDetailPage = ({ event, onClose, onRequireLogin }) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  if (!event) return null;

  const displayContent = showFullContent ? event.content : event.content.substring(0, 200) + '...';
  const hasMoreContent = event.content.length > 200;
  
  // Check if event is in the past
  const isEventPast = new Date() > event.eventDate;
  // Check if registration is open
  const isRegistrationOpen = event.registrationOpen && !isEventPast;
  // Check if registration method exists
  const hasRegistrationMethod = event.registrationLink || event.enableRegistrationForm;

  const handleGetDirections = () => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((position) => {
              const { latitude, longitude } = position.coords;
              const destination = encodeURIComponent(event.venueAddress);
              const origin = `${latitude},${longitude}`;
              
              window.open(
                  `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`,
                  '_blank'
              );
          }, (error) => {
              alert('Could not get your location. Please enable location services.');
              console.error('Geolocation error:', error);
          });
      } else {
          alert('Geolocation is not supported by your browser');
      }
  };

  const handleRegistrationClick = () => {
      if (!event.enableRegistrationForm && event.registrationLink) {
          window.open(event.registrationLink, '_blank');
      } else if (event.enableRegistrationForm) {
          setShowRegistrationForm(true);
      }
  };

  return (
      <div className="event-detail-page-container">
          <div className="event-detail-header">
              {event.images && event.images.length > 0 ? (
                  <img src={event.images[0]} alt={event.title} onError={(e) => e.target.src = "https://placehold.co/800x450/cccccc/000000?text=Event+Image"} />
              ) : (
                  <img src="https://placehold.co/800x450/cccccc/000000?text=No+Event+Image" alt="Placeholder" />
              )}
              <div className="event-detail-header-overlay">
                  <button onClick={onClose} className="event-detail-back-button">
                      <ArrowLeft size={24} />
                  </button>
              </div>
          </div>

          <div className="event-detail-content-section">
              <div className="event-detail-title-card">
                  <h1>{event.title}</h1>
                  <div className="event-detail-meta-item">
                      <Landmark size={18} />
                      <span>{event.location}</span>
                  </div>
                  <div className="event-detail-meta-item">
                      <CalendarIcon size={18} />
                      <span>{event.eventDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, {event.eventDate?.toLocaleDateString('en-US', { year: 'numeric' })} | {event.eventDate?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} onwards</span>
                  </div>
                  <div className="event-detail-meta-item">
                      <MapPin size={18} />
                      <span>{event.venueAddress}</span>
                  </div>

                  <div className="event-detail-price-book">
                      <span className="event-detail-price">
                          {event.price === 0 ? 'FREE' : `₹${event.price}`}
                      </span>
                      {isEventPast ? (
                          <button className="event-detail-book-button disabled" disabled>
                              EVENT ENDED
                          </button>
                      ) : !isRegistrationOpen ? (
                          <button className="event-detail-book-button disabled" disabled>
                              REGISTRATION CLOSED
                          </button>
                      ) : !hasRegistrationMethod ? (
                          <button className="event-detail-book-button disabled" disabled>
                              NO REGISTRATION REQUIRED
                          </button>
                      ) : (
                          <button 
                              className="event-detail-book-button"
                              onClick={() => {
                                  if (onRequireLogin) {
                                      onRequireLogin();
                                  } else {
                                      handleRegistrationClick();
                                  }
                              }}
                          >
                              REGISTER NOW
                          </button>
                      )}
                  </div>
              </div>

              <div className="event-detail-about-section">
                  <h2>About the Event</h2>
                  <p>
                      {displayContent}
                      {hasMoreContent && (
                          <button onClick={() => setShowFullContent(!showFullContent)} className="show-more-button">
                              {showFullContent ? 'Show Less' : 'Show More'}
                          </button>
                      )}
                  </p>
              </div>

              <div className="event-detail-info-grid">
                  <div className="info-grid-item">
                      <Languages size={20} />
                      <div>
                          <strong>Language</strong>
                          <p>{event.language || 'N/A'}</p>
                      </div>
                  </div>
                  <div className="info-grid-item">
                      <Timer size={20} />
                      <div>
                          <strong>Duration</strong>
                          <p>{event.duration || 'N/A'}</p>
                      </div>
                  </div>
                  <div className="info-grid-item">
                      <Ticket size={20} />
                      <div>
                          <strong>Tickets Needed For</strong>
                          <p>{event.ticketsNeeded || 'N/A'}</p>
                      </div>
                  </div>
              </div>

              <div className="event-detail-venue-section">
                  <h2>Venue</h2>
                  <div className="venue-info">
                      <div>
                          <p><strong>{event.location}</strong></p>
                          <p>{event.venueAddress}</p>
                      </div>
                      <button className="get-directions-button" onClick={handleGetDirections}>
                          <MapPin size={16} /> GET DIRECTIONS
                      </button>
                  </div>
              </div>
          </div>
          
          {showRegistrationForm && (
              <RegistrationFormModal 
                  isOpen={showRegistrationForm}
                  onClose={() => setShowRegistrationForm(false)}
                  event={event}
              />
          )}
      </div>
  );
};

const EventDetailSidebar = ({ events, currentEvent, onOpenEventDetail }) => {
  const upcomingEvents = events.filter(e => 
      e.type === 'event' && 
      e.id !== currentEvent?.id && 
      e.eventDate > new Date()
  ).slice(0, 3);

  return (
      <div className="sidebar-widget">
          <div className="widget-header">
              <h3 className="widget-title">Upcoming Events</h3>
          </div>
          <div className="widget-content">
              {upcomingEvents.length > 0 ? (
                  <div className="widget-list">
                      {upcomingEvents.map(event => (
                          <div 
                              key={event.id} 
                              className="sidebar-event-item clickable"
                              onClick={() => onOpenEventDetail(event)}
                          >
                              <h4 className="sidebar-event-title">{event.title}</h4>
                              <div className="sidebar-event-date">
                                  {event.eventDate?.toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric' 
                                  })}
                              </div>
                              <div className="sidebar-event-time">
                                  {event.eventDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="no-events-message">
                      <CalendarPlus size={24} />
                      <p>No upcoming events found</p>
                  </div>
              )}
          </div>
      </div>
  );
};

const PostCard = ({ post, onLike, onShare, onAddComment, isLikedByUser, isCommentsOpen, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser }) => {
  const overlayRef = useRef(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const contentRef = useRef(null);
  const [needsShowMore, setNeedsShowMore] = useState(false);

  const handleImageError = (e) => {
      e.target.src = "https://placehold.co/400x200/cccccc/000000?text=Image+Load+Error";
      e.target.onerror = null;
  };

  useEffect(() => {
      if (contentRef.current) {
          const lineHeight = parseInt(getComputedStyle(contentRef.current).lineHeight);
          const maxHeight = lineHeight * 3;
          setNeedsShowMore(contentRef.current.scrollHeight > maxHeight);
      }
  }, [post.content]);

  const getPostTypeLabel = (type) => {
      switch (type) {
          case 'confession': return 'Confession';
          case 'event': return 'Event';
          case 'news': return 'News';
          default: return 'Post';
      }
  };

  const isInteractive = post.type !== 'news';
  
  // Check if the post belongs to the current user
  const isUserPost = currentUser && post.userId === currentUser.phone;

  const handleCommentIconClick = (e) => {
      e.stopPropagation();
      setOpenCommentPostId(isCommentsOpen ? null : post.id);
  };

  const handleBackArrowClick = (e) => {
      e.stopPropagation();
      setOpenCommentPostId(null);
  };

  useEffect(() => {
      const handleClickOutside = (event) => {
          if (isCommentsOpen && overlayRef.current && !overlayRef.current.contains(event.target)) {
              setOpenCommentPostId(null);
          }
      };

      if (isCommentsOpen) {
          document.addEventListener('mousedown', handleClickOutside);
      } else {
          document.removeEventListener('mousedown', handleClickOutside);
      }

      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, [isCommentsOpen, setOpenCommentPostId]);

  const handleAddToCalendar = () => {
      if (post.type === 'event' && post.eventDate) {
          const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
          const timeOptions = { hour: '2-digit', minute: '2-digit' };
          const formattedDate = post.eventDate.toLocaleDateString('en-US', dateOptions);
          const formattedTime = post.eventDate.toLocaleTimeString('en-US', timeOptions);
          alert(`Event "${post.title}" on ${formattedDate} at ${formattedTime} has been added to your calendar!`);
          onAddToCalendar(post);
      }
  };

  const renderPostCardContent = () => (
      <>
          <div className="post-header">
              <div className="post-avatar"></div>
              <div className="post-info">
                  <h3 className="post-author">{post.author}</h3>
                  <p className="post-timestamp">
                      {post.timestamp.toLocaleDateString()} at {post.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
              </div>
              <span className={`post-type-badge ${post.type}`}>
                  {getPostTypeLabel(post.type)}
              </span>
              {isUserPost && (
                <span className="post-type-badge user-post">
                  Your Post
                </span>
              )}
          </div>

          <div className="post-content">
              <h2 className="post-title">{post.title}</h2>
              <div className="post-text-container">
                  <p 
                      ref={contentRef}
                      className={`post-text ${showFullContent ? 'expanded' : ''}`}
                  >
                      {post.content}
                  </p>
                  {needsShowMore && (
                      <button 
                          className="show-more-button"
                          onClick={() => setShowFullContent(!showFullContent)}
                      >
                          {showFullContent ? 'Show Less' : 'Show More'}
                      </button>
                  )}
              </div>

              {post.type === 'event' && (
                  <div className="event-details">
                      {post.location && (
                          <div className="event-detail">
                              <MapPin size={16} />
                              <span>{post.location}</span>
                          </div>
                      )}
                      {post.eventDate && (
                          <div className="event-detail">
                              <Clock size={16} />
                              <span>
                                  {post.eventDate.toLocaleDateString()} at{' '}
                                  {post.eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                          </div>
                      )}
                  </div>
              )}

              {post.images.length > 0 && (
                  <div className={`post-images ${post.images.length === 1 ? 'single' : post.images.length === 2 ? 'double' : post.images.length === 3 ? 'triple' : 'quad'}`}>
                      {post.images.map((image, index) => (
                          <img key={index} src={image} alt={`Post image ${index + 1}`} className="post-image" onError={handleImageError} />
                      ))}
                  </div>
              )}
          </div>

          {isInteractive && (
              <>
                  {post.type === 'event' && (
                      <div className="event-action-buttons-top">
                          <button className="action-btn" onClick={() => onOpenEventDetail(post)}>
                              <Info size={20} />
                              <span>Details</span>
                          </button>
                          <button className="action-btn" onClick={handleAddToCalendar}>
                              <CalendarPlus size={20} />
                              <span>Add to Calendar</span>
                          </button>
                      </div>
                  )}

                  <div className="post-actions">
                      <button className={`action-btn ${isLikedByUser ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); onLike(post.id); }}>
                          <Heart size={20} fill={isLikedByUser ? '#ef4444' : 'none'} stroke={isLikedByUser ? '#ef4444' : '#9ca3af'} />
                          <span>{post.likes}</span>
                      </button>
                      <button className="action-btn" onClick={handleCommentIconClick}>
                          <MessageIcon size={20} />
                          <span>{post.commentData ? post.commentData.length : post.comments}</span>
                      </button>
                      <button className="action-btn" onClick={(e) => { e.stopPropagation(); onShare(post.id, post.title, post.content); }}>
                          <Share2 size={20} />
                          <span>Share</span>
                      </button>
                  </div>

                  {isCommentsOpen && (
                      <CommentSection
                          comments={post.commentData || []}
                          onAddComment={(commentText) => onAddComment(post.id, commentText)}
                          onCloseComments={handleBackArrowClick}
                      />
                  )}
              </>
          )}
      </>
  );

  return (
      isCommentsOpen ? (
          <div className={`post-card-overlay ${isCommentsOpen ? 'active' : ''}`} ref={overlayRef}>
              <div className="post-card comments-open-fixed">
                  {renderPostCardContent()}
              </div>
          </div>
      ) : (
          <div className="post-card">
              {renderPostCardContent()}
          </div>
      )
  );
};

const HomeComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser }) => {
  const newsHighlights = [...posts]
      .filter(post => post.type === 'news')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 2);

  return (
      <div>
          {newsHighlights.length > 0 && (
              <>
                  <div className="posts-container news-highlights-section">
                      {newsHighlights.map(post => (
                          <PostCard
                              key={post.id}
                              post={post}
                              onLike={onLike}
                              onShare={onShare}
                              onAddComment={onAddComment}
                              isLikedByUser={likedPosts.has(post.id)}
                              isCommentsOpen={openCommentPostId === post.id}
                              setOpenCommentPostId={setOpenCommentPostId}
                              onOpenEventDetail={onOpenEventDetail}
                              onAddToCalendar={onAddToCalendar}
                              currentUser={currentUser}
                          />
                      ))}
                  </div>
                  <hr className="section-divider" />
              </>
          )}

          <div className="posts-container">
              {posts.map(post => (
                  <PostCard
                      key={post.id}
                      post={post}
                      onLike={onLike}
                      onShare={onShare}
                      onAddComment={onAddComment}
                      isLikedByUser={likedPosts.has(post.id)}
                      isCommentsOpen={openCommentPostId === post.id}
                      setOpenCommentPostId={setOpenCommentPostId}
                      onOpenEventDetail={onOpenEventDetail}
                      onAddToCalendar={onAddToCalendar}
                      currentUser={currentUser}
                  />
              ))}
          </div>
      </div>
  );
};

const EventsComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser }) => {
  const eventPosts = posts.filter(post => post.type === 'event');

  return (
      <div id="events-section-content">
          <div className="posts-container">
              {eventPosts.map(post => (
                  <PostCard
                      key={post.id}
                      post={post}
                      onLike={onLike}
                      onShare={onShare}
                      onAddComment={onAddComment}
                      isLikedByUser={likedPosts.has(post.id)}
                      isCommentsOpen={openCommentPostId === post.id}
                      setOpenCommentPostId={setOpenCommentPostId}
                      onOpenEventDetail={onOpenEventDetail}
                      onAddToCalendar={onAddToCalendar}
                      currentUser={currentUser}
                  />
              ))}
          </div>
      </div>
  );
};

const ConfessionsComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser }) => {
  const confessionPosts = posts.filter(post => post.type === 'confession');

  return (
      <div>
          <div className="posts-container">
              {confessionPosts.map(post => (
                  <PostCard
                      key={post.id}
                      post={post}
                      onLike={onLike}
                      onShare={onShare}
                      onAddComment={onAddComment}
                      isLikedByUser={likedPosts.has(post.id)}
                      isCommentsOpen={openCommentPostId === post.id}
                      setOpenCommentPostId={setOpenCommentPostId}
                      onOpenEventDetail={onOpenEventDetail}
                      onAddToCalendar={onAddToCalendar}
                      currentUser={currentUser}
                  />
              ))}
          </div>
      </div>
  );
};

const UsersComponent = ({ posts, currentUser, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, setIsModalOpen }) => {
  if (!currentUser) {
    return (
      <div>
        <h2 className="page-title">Profile</h2>
        <div className="placeholder-card">
          <p className="placeholder-text">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Filter posts created by the current user
  const userPosts = posts.filter(post => 
    post.userId === currentUser.phone
  );

  // Calculate user stats
  const userStats = {
    posts: userPosts.length,
    likesReceived: userPosts.reduce((sum, post) => sum + post.likes, 0),
    commentsReceived: userPosts.reduce((sum, post) => sum + (post.commentData ? post.commentData.length : post.comments), 0)
  };

  return (
    <div>
      <h2 className="page-title">Your Profile</h2>
      
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar"></div>
        </div>
        <div className="profile-info">
          <h3 className="profile-name">+91 {currentUser.phone}</h3>
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-number">{userStats.posts}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{userStats.likesReceived}</span>
              <span className="stat-label">Likes</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{userStats.commentsReceived}</span>
              <span className="stat-label">Comments</span>
            </div>
          </div>
        </div>
      </div>
      
      <h3 className="section-subtitle">Your Posts</h3>
      
      {userPosts.length > 0 ? (
        <div className="posts-container">
          {userPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onLike={onLike}
              onShare={onShare}
              onAddComment={onAddComment}
              isLikedByUser={likedPosts.has(post.id)}
              isCommentsOpen={openCommentPostId === post.id}
              setOpenCommentPostId={setOpenCommentPostId}
              onOpenEventDetail={onOpenEventDetail}
              onAddToCalendar={onAddToCalendar}
              currentUser={currentUser}
            />
          ))}
        </div>
      ) : (
        <div className="placeholder-card">
          <p className="placeholder-text">You haven't created any posts yet.</p>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create Your First Post
          </button>
        </div>
      )}
    </div>
  );
};

const HomeRightSidebar = ({ posts }) => {
  const popularPosts = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 3);
  return (
      <div className="sidebar-widget">
          <div className="widget-header">
              <h3 className="widget-title">Popular Posts</h3>
          </div>
          <div className="widget-content">
              <div className="widget-list">
                  {popularPosts.map(post => (
                      <div key={post.id} className="popular-post-item">
                          <p className="widget-item-title">{post.title}</p>
                          <div className="popular-post-stats">
                              <span className="popular-stat">{post.likes} likes</span>
                              <span className="popular-stat">{post.comments} comments</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );
};

const EventsRightSidebar = ({ posts, myCalendarEvents, onOpenEventDetail }) => {
  const [value, onChange] = useState(new Date());
  
  // Combine all events for calendar indicators
  const allEvents = [...posts, ...myCalendarEvents];
  
  const tileContent = ({ date, view }) => {
      if (view === 'month') {
          const hasEvent = allEvents.some(post =>
              post.type === 'event' &&
              post.eventDate &&
              post.eventDate.getDate() === date.getDate() &&
              post.eventDate.getMonth() === date.getMonth() &&
              post.eventDate.getFullYear() === date.getFullYear()
          );
          return hasEvent ? <div className="event-dot"></div> : null;
      }
      return null;
  };
  
  // Get upcoming events from user's calendar
  const upcomingCalendarEvents = myCalendarEvents
      .filter(e => e.eventDate > new Date())
      .slice(0, 3);

  return (
      <>
          <div className="calendar-widget">
              <div className="widget-content calendar-container">
                  <Calendar
                      onChange={onChange}
                      value={value}
                      tileContent={tileContent}
                      className="react-calendar"
                      prev2Label={null}
                      next2Label={null}
                      locale="en-US"
                  />
              </div>
          </div>

          {/* My Calendar Events section */}
          {upcomingCalendarEvents.length > 0 && (
              <div className="sidebar-widget my-calendar-events">
                  <div className="widget-header">
                      <h3 className="widget-title">My Calendar Events</h3>
                  </div>
                  <div className="widget-content">
                      <div className="widget-list">
                          {upcomingCalendarEvents.map(event => (
                              <div 
                                  key={event.id} 
                                  className="sidebar-event-item clickable"
                                  onClick={() => onOpenEventDetail(event)}
                              >
                                  <h4 className="sidebar-event-title">{event.title}</h4>
                                  <div className="sidebar-event-date">
                                      {event.eventDate?.toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric' 
                                      })}
                                  </div>
                                  <div className="sidebar-event-time">
                                      {event.eventDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}
      </>
  );
};

const ConfessionsRightSidebar = ({ posts }) => {
  const recentConfessions = [...posts]
      .filter(post => post.type === 'confession')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 3);
  return (
      <div className="sidebar-widget">
          <div className="widget-header">
              <h3 className="widget-title">Recent Confessions</h3>
          </div>
          <div className="widget-content">
              <div className="widget-list">
                  {recentConfessions.map(post => (
                      <div key={post.id} className="recent-confession-item">
                          <p className="widget-item-title">{post.title}</p>
                          <p className="confession-preview">
                              {post.content.substring(0, 60)}...
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      </div>
  );
};

const UsersRightSidebar = ({ currentUser, posts }) => {
  if (!currentUser) return null;
  
  // Filter posts created by the current user
  const userPosts = posts.filter(post => 
    post.userId === currentUser.phone
  );

  // Calculate user stats
  const userStats = {
    posts: userPosts.length,
    likesReceived: userPosts.reduce((sum, post) => sum + post.likes, 0),
    commentsReceived: userPosts.reduce((sum, post) => sum + (post.commentData ? post.commentData.length : post.comments), 0)
  };

  return (
    <div className="sidebar-widget">
      <div className="widget-header">
        <h3 className="widget-title">Profile Stats</h3>
      </div>
      <div className="widget-content">
        <div className="widget-list">
          <p className="widget-item">Posts: <span className="widget-stat">{userStats.posts}</span></p>
          <p className="widget-item">Likes Received: <span className="widget-stat">{userStats.likesReceived}</span></p>
          <p className="widget-item">Comments: <span className="widget-stat">{userStats.commentsReceived}</span></p>
        </div>
      </div>
    </div>
  );
};

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [error, setError] = useState('');

  const handlePhoneSubmit = (e) => {
      e.preventDefault();
      if (!phoneNumber.match(/^\d{10}$/)) {
          setError('Please enter a valid 10-digit phone number');
          return;
      }
      setStep('otp');
      setError('');
  };

  const handleOtpSubmit = (e) => {
      e.preventDefault();
      if (otp === '123456') {
          onLogin(phoneNumber);
          onClose();
      } else {
          setError('Invalid OTP. Please try again.');
      }
  };

  if (!isOpen) return null;

  return (
      <div className="modal-overlay">
        <div className="modal-content login-modal">
          <div className="modal-header">
            <h2 className="modal-title">{step === 'phone' ? 'Login' : 'Verify OTP'}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="login-form">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <div className="phone-input-container">
                    <div className="country-code">+91</div>
                    <input
                      type="tel"
                      className="form-input"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter your phone number"
                      maxLength={10}
                      required
                    />
                  </div>
                  {error && <p className="error-message">{error}</p>}
                </div>
                <button type="submit" className="btn-primary">
                  Send OTP
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="login-form">
                <div className="form-group">
                  <p className="otp-instructions">
                    OTP sent to +91{phoneNumber}
                  </p>
                  <label className="form-label">Enter OTP</label>
                  <input
                    type="text"
                    className="form-input otp-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    maxLength={6}
                    required
                  />
                  {error && <p className="error-message">{error}</p>}
                </div>
                <button type="submit" className="btn-primary">
                  Verify OTP
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
  );
};

const ProfileDropdown = ({ user, onLogout, onProfileClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button 
        className="profile-dropdown-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="avatar" title={user.phone}></div>
      </button>
      
      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-info">
            <div className="profile-avatar">
              <div className="avatar"></div>
            </div>
            <div className="profile-details">
              <div className="profile-phone">+91 {user.phone}</div>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <button 
            className="dropdown-item"
            onClick={() => {
              onProfileClick();
              setIsOpen(false);
            }}
          >
            <User size={16} className="dropdown-item-icon" />
            <span>Profile</span>
          </button>
          <button 
            className="dropdown-item logout-btn"
            onClick={onLogout}
          >
            <LogOut size={16} className="dropdown-item-icon" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
};

const App = () => {
    const [activeSection, setActiveSection] = useState('home');
    const [posts, setPosts] = useState(initialPosts);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [openCommentPostId, setOpenCommentPostId] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [myCalendarEvents, setMyCalendarEvents] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        const savedPhone = localStorage.getItem('userPhone');
        if (savedPhone) {
            setIsLoggedIn(true);
            setCurrentUser({ phone: savedPhone });
        }
        
        // Set theme on initial load
        document.documentElement.setAttribute('data-theme', theme);
    }, []);

    useEffect(() => {
        if (openCommentPostId || selectedEvent || isModalOpen || showLoginModal) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [openCommentPostId, selectedEvent, isModalOpen, showLoginModal]);

    // Handle theme change
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const filteredPosts = posts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.type === 'event' && post.location?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleAddToCalendar = (event) => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }
        
        setMyCalendarEvents(prev => {
            if (prev.some(e => e.id === event.id)) {
                return prev;
            }
            return [...prev, event];
        });
    };

    const handleAddPost = (newPost) => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }
        
        const post = {
            ...newPost,
            id: Date.now().toString(),
            timestamp: new Date(),
            likes: 0,
            comments: 0,
            commentData: [],
            // Add userId to track post ownership
            userId: currentUser.phone
        };
        setPosts(prev => [post, ...prev]);
    };

    const handleLikePost = (postId) => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }
        
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId) {
                    const isCurrentlyLiked = likedPosts.has(postId);
                    if (isCurrentlyLiked) {
                        setLikedPosts(prev => {
                            const newLiked = new Set(prev);
                            newLiked.delete(postId);
                            return newLiked;
                        });
                        return { ...post, likes: post.likes - 1 };
                    } else {
                        setLikedPosts(prev => new Set(prev).add(postId));
                        return { ...post, likes: post.likes + 1 };
                    }
                }
                return post;
            })
        );
    };

    const handleAddComment = (postId, commentText) => {
        if (!isLoggedIn) {
            setShowLoginModal(true);
            return;
        }
        
        setPosts(prevPosts =>
            prevPosts.map(post => {
                if (post.id === postId) {
                    const newComment = {
                        id: Date.now().toString(),
                        author: 'Current User',
                        text: commentText,
                        timestamp: new Date(),
                    };
                    return {
                        ...post,
                        commentData: [...(post.commentData || []), newComment],
                        comments: (post.commentData ? post.commentData.length : post.comments) + 1,
                    };
                }
                return post;
            })
        );
    };

    const handleShareClick = async (postId, postTitle, postContent) => {
        const shareUrl = `${window.location.origin}/posts/${postId}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: postTitle,
                    text: postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''),
                    url: shareUrl,
                });
                console.log('Post shared successfully!');
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!');
                console.log('Link copied to clipboard:', shareUrl);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert('Could not copy link to clipboard. Please copy manually: ' + shareUrl);
            }
        }
    };

    const handleOpenEventDetail = (event) => {
        setSelectedEvent(event);
        setOpenCommentPostId(null);
    };

    const handleCloseEventDetail = () => {
        setSelectedEvent(null);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setCurrentUser(null);
        localStorage.removeItem('userPhone');
    };

    const menuItems = [
        {
            id: 'home',
            label: 'Home',
            icon: <Home className="nav-icon" />,
            component: () => <HomeComponent
                posts={filteredPosts}
                onLike={handleLikePost}
                onShare={handleShareClick}
                onAddComment={handleAddComment}
                likedPosts={likedPosts}
                openCommentPostId={openCommentPostId}
                setOpenCommentPostId={setOpenCommentPostId}
                onOpenEventDetail={handleOpenEventDetail}
                onAddToCalendar={handleAddToCalendar}
                currentUser={currentUser}
            />,
            rightSidebar: () => <HomeRightSidebar posts={posts} />,
        },
        {
            id: 'events',
            label: 'Events',
            icon: <CalendarIcon className="nav-icon" />,
            component: () => <EventsComponent
                posts={filteredPosts.filter(post => post.type === 'event')}
                onLike={handleLikePost}
                onShare={handleShareClick}
                onAddComment={handleAddComment}
                likedPosts={likedPosts}
                openCommentPostId={openCommentPostId}
                setOpenCommentPostId={setOpenCommentPostId}
                onOpenEventDetail={handleOpenEventDetail}
                onAddToCalendar={handleAddToCalendar}
                currentUser={currentUser}
            />,
            rightSidebar: () => <EventsRightSidebar 
                posts={posts.filter(p => p.type === 'event')}
                myCalendarEvents={myCalendarEvents}
                onOpenEventDetail={handleOpenEventDetail}
            />,
        },
        {
            id: 'confessions',
            label: 'Confessions',
            icon: <MessageCircle className="nav-icon" />,
            component: () => <ConfessionsComponent
                posts={filteredPosts.filter(post => post.type === 'confession')}
                onLike={handleLikePost}
                onShare={handleShareClick}
                onAddComment={handleAddComment}
                likedPosts={likedPosts}
                openCommentPostId={openCommentPostId}
                setOpenCommentPostId={setOpenCommentPostId}
                onOpenEventDetail={handleOpenEventDetail}
                onAddToCalendar={handleAddToCalendar}
                currentUser={currentUser}
            />,
            rightSidebar: () => <ConfessionsRightSidebar posts={posts.filter(p => p.type === 'confession')} />,
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: <Bell className="nav-icon" />,
            component: () => (
                <div>
                    <h2 className="page-title">Notifications</h2>
                    <div className="placeholder-card">
                        <p className="placeholder-text">No new notifications.</p>
                    </div>
                </div>
            ),
            rightSidebar: () => (
                <div className="sidebar-widget">
                    <div className="widget-header">
                        <h3 className="widget-title">Quick Links</h3>
                    </div>
                    <div className="widget-content">
                        <ul className="widget-list">
                            <li className="widget-item">Settings</li>
                            <li className="widget-item">Help & Support</li>
                        </ul>
                    </div>
                </div>
            ),
        },
        // Theme toggle button
        {
            id: 'theme-toggle',
            label: theme === 'light' ? 'Dark Mode' : 'Light Mode',
            icon: theme === 'light' ? <Moon className="nav-icon" /> : <Sun className="nav-icon" />,
            component: null,
            rightSidebar: null,
            action: toggleTheme
        },
        {
            id: 'add',
            label: 'Add',
            icon: <Plus className="nav-icon" />,
            component: null,
            rightSidebar: null,
            action: () => {
                if (!isLoggedIn) {
                    setShowLoginModal(true);
                } else {
                    setIsModalOpen(true);
                }
            }
        },
    ];

    const sectionComponents = {
        home: () => <HomeComponent
            posts={filteredPosts}
            onLike={handleLikePost}
            onShare={handleShareClick}
            onAddComment={handleAddComment}
            likedPosts={likedPosts}
            openCommentPostId={openCommentPostId}
            setOpenCommentPostId={setOpenCommentPostId}
            onOpenEventDetail={handleOpenEventDetail}
            onAddToCalendar={handleAddToCalendar}
            currentUser={currentUser}
        />,
        events: () => <EventsComponent
            posts={filteredPosts.filter(post => post.type === 'event')}
            onLike={handleLikePost}
            onShare={handleShareClick}
            onAddComment={handleAddComment}
            likedPosts={likedPosts}
            openCommentPostId={openCommentPostId}
            setOpenCommentPostId={setOpenCommentPostId}
            onOpenEventDetail={handleOpenEventDetail}
            onAddToCalendar={handleAddToCalendar}
            currentUser={currentUser}
        />,
        confessions: () => <ConfessionsComponent
            posts={filteredPosts.filter(post => post.type === 'confession')}
            onLike={handleLikePost}
            onShare={handleShareClick}
            onAddComment={handleAddComment}
            likedPosts={likedPosts}
            openCommentPostId={openCommentPostId}
            setOpenCommentPostId={setOpenCommentPostId}
            onOpenEventDetail={handleOpenEventDetail}
            onAddToCalendar={handleAddToCalendar}
            currentUser={currentUser}
        />,
        notifications: () => (
            <div>
                <h2 className="page-title">Notifications</h2>
                <div className="placeholder-card">
                    <p className="placeholder-text">No new notifications.</p>
                </div>
            </div>
        ),
        profile: () => <UsersComponent 
            posts={filteredPosts} 
            currentUser={currentUser} 
            onLike={handleLikePost}
            onShare={handleShareClick}
            onAddComment={handleAddComment}
            likedPosts={likedPosts}
            openCommentPostId={openCommentPostId}
            setOpenCommentPostId={setOpenCommentPostId}
            onOpenEventDetail={handleOpenEventDetail}
            onAddToCalendar={handleAddToCalendar}
            setIsModalOpen={setIsModalOpen}
        />,
    };

    const sectionSidebars = {
        home: () => <HomeRightSidebar posts={posts} />,
        events: () => <EventsRightSidebar 
            posts={posts.filter(p => p.type === 'event')}
            myCalendarEvents={myCalendarEvents}
            onOpenEventDetail={handleOpenEventDetail}
        />,
        confessions: () => <ConfessionsRightSidebar posts={posts.filter(p => p.type === 'confession')} />,
        notifications: () => (
            <div className="sidebar-widget">
                <div className="widget-header">
                    <h3 className="widget-title">Quick Links</h3>
                </div>
                <div className="widget-content">
                    <ul className="widget-list">
                        <li className="widget-item">Settings</li>
                        <li className="widget-item">Help & Support</li>
                    </ul>
                </div>
            </div>
        ),
        profile: () => <UsersRightSidebar currentUser={currentUser} posts={posts} />,
    };

    const CurrentComponent = sectionComponents[activeSection] || (() => null);
    const CurrentRightSidebar = sectionSidebars[activeSection] || (() => null);

    return (
        <div className={`app ${selectedEvent || isModalOpen ? 'modal-open' : ''}`}>
            <LoginModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onLogin={(phone) => {
                    setIsLoggedIn(true);
                    setCurrentUser({ phone });
                    localStorage.setItem('userPhone', phone);
                }}
            />
            
            <header className="header">
                <div className="header-container">
                    <div className="header-content">
                        <div className="header-left">
                            <a href="/" className="app-logo-link">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle-code"><path d="M7.9 20A10 10 0 1 0 4 16.1L2 22Z"/><path d="m10 8-2 2 2 2"/><path d="m14 8 2 2-2 2"/></svg>
                                <span className="app-title">Confique</span>
                            </a>
                        </div>
                        <div className="header-search">
                            <div className="search-container">
                                <Search className="search-icon" />
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="header-right">
                            {isLoggedIn ? (
                                <ProfileDropdown 
                                    user={currentUser} 
                                    onLogout={handleLogout}
                                    onProfileClick={() => {
                                        setActiveSection('profile');
                                        setOpenCommentPostId(null);
                                        setSelectedEvent(null);
                                    }}
                                />
                            ) : (
                                <button 
                                    className="login-button" 
                                    onClick={() => setShowLoginModal(true)}
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className={`main-layout-container ${selectedEvent ? 'event-detail-open' : ''}`}>
                <aside className="left-sidebar">
                    <nav className="sidebar-nav">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                className={`nav-button ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => {
                                    if (item.action) {
                                        item.action();
                                    } else {
                                        setActiveSection(item.id);
                                        setOpenCommentPostId(null);
                                        setSelectedEvent(null);
                                    }
                                }}
                            >
                                {item.icon}
                                <span className="nav-label">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                <main className="main-content">
                    <div className="content-padding">
                        {selectedEvent ? (
                            <EventDetailPage 
                                event={selectedEvent} 
                                onClose={handleCloseEventDetail}
                                onRequireLogin={() => setShowLoginModal(true)}
                            />
                        ) : (
                            <CurrentComponent
                                posts={filteredPosts}
                                onLike={handleLikePost}
                                onShare={handleShareClick}
                                onAddComment={handleAddComment}
                                likedPosts={likedPosts}
                                openCommentPostId={openCommentPostId}
                                setOpenCommentPostId={setOpenCommentPostId}
                                onOpenEventDetail={handleOpenEventDetail}
                                onAddToCalendar={handleAddToCalendar}
                            />
                        )}
                    </div>
                </main>
                <aside className="right-sidebar">
                    <div className="right-sidebar-content">
                        {!isModalOpen && (
                            selectedEvent ? (
                                <EventDetailSidebar 
                                    events={posts} 
                                    currentEvent={selectedEvent} 
                                    onOpenEventDetail={handleOpenEventDetail}
                                />
                            ) : (
                                <CurrentRightSidebar posts={posts} />
                            )
                        )}
                    </div>
                </aside>
            </div>

            <AddPostModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddPost}
            />
        </div>
    );
};

export default App;