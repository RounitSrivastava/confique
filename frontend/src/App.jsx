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
  Sun,
  Edit3,
  Trash2,
  Mail,
  Flag
} from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

// Import predefined avatars
import avatar1 from './assets/Confident Expression in Anime Style.png';
import avatar2 from './assets/ChatGPT Image Aug 3, 2025, 11_19_26 AM.png';


// Utility function to compress image
const compressImage = (file, callback) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const maxWidth = 800;
      const maxHeight = 800;

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = height * (maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = width * (maxHeight / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      const quality = 0.8;
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      callback(compressedDataUrl);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="error-fallback">Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}

const API_URL = 'http://localhost:5000/api';

// Custom Alert/Confirm Modal component
const CustomMessageModal = ({ isOpen, onClose, title, message, showConfirm = false, confirmText = 'Confirm' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content small-modal">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-message">{message}</p>
        </div>
        {showConfirm && (
          <div className="modal-actions">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={onClose}>
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Help & Support Modal Component
const HelpAndSupportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content small-modal">
        <div className="modal-header">
          <h2 className="modal-title">Help & Support</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-message">For any support or questions, please email us at:</p>
          <a href="mailto:support@confique.com" className="email-link">
            <Mail size={16} /> support@confique.com
          </a>
        </div>
      </div>
    </div>
  );
};

// Report Post Modal Component
const ReportPostModal = ({ isOpen, onClose, onReport, post }) => {
  const [reason, setReason] = useState('');
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setReportSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reason) {
      await onReport(post.id, reason);
      setReportSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      alert('Please select a reason for reporting.');
    }
  };

  if (!isOpen || !post) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content report-modal">
        <div className="modal-header">
          <h2 className="modal-title">Report Post</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        {reportSuccess ? (
          <div className="modal-body">
            <p className="modal-message">Thank you. Your report has been submitted for review.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <h4 className="modal-reason-heading">Why are you reporting this post?</h4>
              <div className="report-options">
                <label className="report-option">
                  <input
                    type="radio"
                    name="reason"
                    value="Offensive/Inappropriate Content"
                    checked={reason === 'Offensive/Inappropriate Content'}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <span>Offensive/Inappropriate Content</span>
                </label>
                <label className="report-option">
                  <input
                    type="radio"
                    name="reason"
                    value="Clickbait"
                    checked={reason === 'Clickbait'}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <span>Clickbait</span>
                </label>
                <label className="report-option">
                  <input
                    type="radio"
                    name="reason"
                    value="False or misleading information"
                    checked={reason === 'False or misleading information'}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <span>False or misleading information</span>
                </label>
                <label className="report-option">
                  <input
                    type="radio"
                    name="reason"
                    value="Spam"
                    checked={reason === 'Spam'}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <span>Spam</span>
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={!reason}>
                Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Post Options Component
const PostOptions = ({ post, onDelete, onEdit, isProfilePage, onReport, currentUser }) => {
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

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(post._id);
    setIsOpen(false);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(post);
    setIsOpen(false);
  };

  const handleReport = (e) => {
    e.stopPropagation();
    onReport(post);
    setIsOpen(false);
  };

  const isAuthorOrAdmin = currentUser && (post.userId === currentUser._id || currentUser.isAdmin);

  return (
    <div className="post-options-container" ref={dropdownRef}>
      <button
        className="post-options-button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>

      {isOpen && (
        <div className="post-options-menu">
          {isAuthorOrAdmin && post.type === 'event' && (
            <button className="post-option-item" onClick={handleEdit}>
              <Edit3 size={16} />
              <span>Edit</span>
            </button>
          )}
          {isAuthorOrAdmin && (
            <button className="post-option-item delete" onClick={handleDelete}>
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
          {!isAuthorOrAdmin && (
            <button className="post-option-item report" onClick={handleReport}>
              <Flag size={16} />
              <span>Report</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Comment Item Component
const CommentItem = ({ comment }) => (
  <div className="comment-item">
    <div className="comment-avatar">
      <img
        src={comment.authorAvatar || 'https://placehold.co/40x40/cccccc/000000?text=A'}
        alt={`${comment.author}'s avatar`}
        className="comment-avatar-img"
        loading="lazy"
        decoding="async"
      />
    </div>
    <div className="comment-content-wrapper">
      <div className="comment-header-info">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-timestamp">
          {new Date(comment.timestamp).toLocaleDateString()} at {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <p className="comment-text">{comment.text}</p>
    </div>
  </div>
);

// Comment Section Component
const CommentSection = ({ comments, onAddComment, onCloseComments, currentUser }) => {
  const [newCommentText, setNewCommentText] = useState('');

  const handleAddCommentSubmit = (e) => {
    e.preventDefault();
    if (newCommentText.trim()) {
      onAddComment(newCommentText, currentUser);
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
        {comments && comments.length > 0 ? (
          comments.map(comment => (
            <CommentItem key={comment._id} comment={comment} />
          ))
        ) : (
          <p className="no-comments-message">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
};

// Registration Form Modal Component with QR scrolling
const RegistrationFormModal = ({ isOpen, onClose, event, isLoggedIn, onRequireLogin, onRegister }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    transactionId: '',
    ...(event.registrationFields ?
      Object.fromEntries(
        event.registrationFields.split(',').map(field => [field.trim(), ''])
      ) : {})
  });
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const qrCodeRef = useRef(null);

  const customFields = event.registrationFields ?
    event.registrationFields.split(',').map(field => field.trim()) :
    [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }

    setFormSubmitted(true);

    if (event.price > 0 && event.enableRegistrationForm && event.paymentMethod === 'qr') {
      setShowPaymentStep(true);
    } else {
      setSuccessMessage(`Thank you ${formData.name} for registering for ${event.title}!`);
      setShowSuccessModal(true);
      onRegister(event._id, event.title);
    }
  };

  const handlePaymentConfirm = (e) => {
    e.preventDefault();

    if (event.price > 0 && event.paymentMethod === 'qr' && (!formData.transactionId || formData.transactionId.length !== 4)) {
      alert("Please enter the last 4 digits of your transaction number.");
      return;
    }
    setSuccessMessage(`Thank you ${formData.name} for your payment! Registration confirmed.`);
    setShowSuccessModal(true);
    onRegister(event._id, event.title);
  };

  const handleClose = () => {
    setShowPaymentStep(false);
    setFormSubmitted(false);
    onClose();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  if (!isOpen) return null;

  const renderFormContent = () => {
    if (showPaymentStep) {
      return (
        <form onSubmit={handlePaymentConfirm} className="modal-form">
          <div className="payment-step">
            <h3>Complete Your Payment</h3>
            <p>Please scan the QR code to make your payment and enter the transaction details below.</p>
            <div className="qr-payment-section" ref={qrCodeRef}>
              <img
                src={event.paymentQRCode}
                alt="Payment QR Code"
                className="payment-qr"
                loading="lazy"
                decoding="async"
              />
              <div className="form-group">
                <label className="form-label">Last 4 Digits of Transaction ID</label>
                <input
                  type="text"
                  name="transactionId"
                  className="form-input"
                  value={formData.transactionId}
                  onChange={handleChange}
                  placeholder="e.g., 1234"
                  maxLength={4}
                  required
                />
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowPaymentStep(false)}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Confirm Registration
              </button>
            </div>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            name="name"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone Number</label>
          <input
            type="tel"
            name="phone"
            className="form-input"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        {customFields.map(field => (
          field && !['name', 'email', 'phone'].includes(field.toLowerCase()) && (
            <div key={field} className="form-group">
              <label className="form-label">{field}</label>
              <input
                type="text"
                name={field}
                className="form-input"
                value={formData[field] || ''}
                onChange={handleChange}
                required
              />
            </div>
          )
        ))}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            {event.price > 0 && event.enableRegistrationForm ? 'Proceed to Payment' : 'Submit Registration'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <ErrorBoundary>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">Register for {event.title}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-form-container">
            {renderFormContent()}
          </div>
          <CustomMessageModal
            isOpen={showSuccessModal}
            onClose={handleSuccessModalClose}
            title="Registration Successful!"
            message={successMessage}
            showConfirm={false}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Add Post Modal Component
const AddPostModal = ({ isOpen, onClose, onSubmit, postToEdit, currentUser }) => {
  const initialFormData = {
    type: 'confession',
    title: '',
    content: '',
    author: '',
    location: '',
    eventStartDate: '',
    eventEndDate: '',
    price: 0,
    language: 'English',
    duration: '',
    ticketsNeeded: '',
    venueAddress: '',
    registrationLink: '',
    registrationOpen: true,
    enableRegistrationForm: false,
    registrationFields: '',
    paymentMethod: 'link',
    paymentLink: '',
    paymentQRCode: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [paymentQRPreview, setPaymentQRPreview] = useState('');
  const [showUploadAlert, setShowUploadAlert] = useState(false);
  const fileInputRef = useRef(null);
  const qrFileInputRef = useRef(null);

  useEffect(() => {
    if (postToEdit) {
      setFormData({
        type: postToEdit.type,
        title: postToEdit.title,
        content: postToEdit.content,
        author: postToEdit.author,
        location: postToEdit.location || '',
        eventStartDate: postToEdit.eventStartDate ? new Date(postToEdit.eventStartDate).toISOString().slice(0, 16) : '',
        eventEndDate: postToEdit.eventEndDate ? new Date(postToEdit.eventEndDate).toISOString().slice(0, 16) : '',
        price: postToEdit.price || 0,
        language: postToEdit.language || 'English',
        duration: postToEdit.duration || '',
        ticketsNeeded: postToEdit.ticketsNeeded || '',
        venueAddress: postToEdit.venueAddress || '',
        registrationLink: postToEdit.registrationLink || '',
        registrationOpen: postToEdit.registrationOpen !== undefined ? postToEdit.registrationOpen : true,
        enableRegistrationForm: postToEdit.enableRegistrationForm || false,
        registrationFields: postToEdit.registrationFields || '',
        paymentMethod: postToEdit.paymentMethod || 'link',
        paymentLink: postToEdit.paymentLink || '',
        paymentQRCode: postToEdit.paymentQRCode
      });
      setImagePreviews(postToEdit.images || []);
      setPaymentQRPreview(postToEdit.paymentQRCode || '');
    } else {
      setFormData(prev => ({
        ...initialFormData,
        author: currentUser?.name || ''
      }));
      setImagePreviews([]);
      setPaymentQRPreview('');
    }
  }, [postToEdit, currentUser, isOpen]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTypeChange = (e) => {
    const newType = e.target.value;
    setFormData(prev => ({
      ...initialFormData,
      type: newType,
      author: newType === 'event' ? (currentUser?.name || '') : (currentUser?.name || '')
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      alert("Please fill in all required fields.");
      return;
    }

    if (formData.type === 'event' && (!formData.location || !formData.venueAddress || !formData.eventStartDate || !formData.duration || !formData.ticketsNeeded)) {
      alert("Please fill in all required event details.");
      return;
    }
    
    const submissionData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        registrationOpen: formData.registrationOpen === 'true' || formData.registrationOpen === true,
        images: imagePreviews,
        paymentQRCode: paymentQRPreview,
    };
    
    onSubmit(submissionData);
    onClose();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    e.target.value = null;

    if (!files.length) return;

    const availableSlots = 4 - imagePreviews.length;
    if (availableSlots <= 0) {
      setShowUploadAlert(true);
      return;
    }

    const filesToProcess = files.slice(0, availableSlots);
    filesToProcess.forEach(file => {
      compressImage(file, (compressedDataUrl) => {
        setImagePreviews(prev => [...prev, compressedDataUrl]);
      });
    });
  };

  const handlePaymentQRUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, (compressedDataUrl) => {
      setPaymentQRPreview(compressedDataUrl);
    });
    e.target.value = null;
  };

  const removeImage = (index) => {
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const removeQRImage = () => {
    setPaymentQRPreview('');
  };

  if (!isOpen) return null;

  return (
    <ErrorBoundary>
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              {postToEdit ? 'Edit Post' : `Add New ${formData.type === 'confession' ? 'Confession' : 'Event'}`}
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
                  onChange={handleTypeChange}
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
                  onChange={handleFormChange}
                  name="title"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  className="form-textarea"
                  value={formData.content}
                  onChange={handleFormChange}
                  name="content"
                  rows={4}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Author</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.type === 'event' ? (currentUser?.name || '') : formData.author}
                  onChange={handleFormChange}
                  name="author"
                  placeholder={formData.type === 'confession' ? 'Anonymous' : ''}
                  disabled={formData.type === 'event'}
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
                      onChange={handleFormChange}
                      name="location"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Venue Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.venueAddress}
                      onChange={handleFormChange}
                      name="venueAddress"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={formData.eventStartDate}
                      onChange={handleFormChange}
                      name="eventStartDate"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">End Date & Time (optional)</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={formData.eventEndDate}
                      onChange={handleFormChange}
                      name="eventEndDate"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.price}
                      onChange={handleFormChange}
                      name="price"
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
                      name="registrationOpen"
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
                      onChange={handleFormChange}
                      name="language"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.duration}
                      onChange={handleFormChange}
                      name="duration"
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
                      onChange={handleFormChange}
                      name="ticketsNeeded"
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
                      onChange={handleFormChange}
                      name="registrationLink"
                      placeholder="https://example.com/register"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={formData.enableRegistrationForm}
                        onChange={handleFormChange}
                        name="enableRegistrationForm"
                      />
                      Enable Registration Form
                    </label>
                  </div>

                  {formData.price > 0 && formData.enableRegistrationForm && (
                    <div className="form-group">
                      <label className="form-label">Payment Method</label>
                      <select
                        className="form-select"
                        value={formData.paymentMethod}
                        onChange={handleFormChange}
                        name="paymentMethod"
                      >
                        <option value="link">Payment Link</option>
                        <option value="qr">QR Code</option>
                      </select>

                      {formData.paymentMethod === 'link' && (
                        <div className="form-group">
                          <label className="form-label">Payment Link</label>
                          <input
                            type="url"
                            className="form-input"
                            value={formData.paymentLink}
                            onChange={handleFormChange}
                            name="paymentLink"
                            placeholder="https://example.com/payment"
                            required
                          />
                        </div>
                      )}

                      {formData.paymentMethod === 'qr' && (
                        <div className="form-group">
                          <label className="form-label">QR Code Image</label>
                          <div className="image-upload-container">
                            {paymentQRPreview ? (
                              <div className="payment-qr-preview">
                                <img src={paymentQRPreview} alt="Payment QR" loading="lazy" decoding="async" />
                                <button
                                  type="button"
                                  className="remove-image-btn"
                                  onClick={removeQRImage}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="upload-btn-wrapper">
                                <div className="upload-btn">
                                  <ImageIcon size={16} />
                                  <span>Upload QR Code</span>
                                </div>
                                <input
                                  ref={qrFileInputRef}
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePaymentQRUpload}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                          <img src={preview} alt={`Preview ${index + 1}`} loading="lazy" decoding="async" />
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
                  {postToEdit ? 'Update' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <CustomMessageModal
        isOpen={showUploadAlert}
        onClose={() => setShowUploadAlert(false)}
        title="Image Upload Limit"
        message="You can only add up to 4 images per post."
        showConfirm={false}
      />
    </ErrorBoundary>
  );
};

// Event Detail Page Component
const EventDetailPage = ({ event, onClose, isLoggedIn, onRequireLogin, onAddToCalendar, onRegister, isRegistered }) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showGeolocationAlert, setShowGeolocationAlert] = useState(false);
  const [geolocationError, setGeolocationError] = useState('');
  const [showAddedToCalendarAlert, setShowAddedToCalendarAlert] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState('');

  if (!event) return null;

  const displayContent = showFullContent ? event.content : event.content.substring(0, 200) + '...';
  const hasMoreContent = event.content.length > 200;

  const isEventPast = new Date() > (event.eventEndDate || event.eventStartDate);
  const isRegistrationOpen = event.registrationOpen && !isEventPast;
  const hasRegistrationMethod = event.registrationLink || event.enableRegistrationForm;

  const formatDateRange = () => {
    if (!event.eventStartDate) return "N/A";

    const start = new Date(event.eventStartDate);
    const end = event.eventEndDate ? new Date(event.eventEndDate) : null;

    if (end && start.toDateString() !== end.toDateString()) {
      const startDate = start.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const endDate = end.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
      const startTime = start.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const endTime = end.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return `${startDate} - ${endDate}, ${startTime} to ${endTime}`;
    }

    const date = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const startTime = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const endTime = end ? end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';

    return `${date}, ${startTime}${endTime ? ` to ${endTime}` : ''}`;
  };

  const handleGetDirections = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const destination = encodeURIComponent(event.venueAddress);
        const origin = `${latitude},${longitude}`;

        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${destination}&origin=${origin}`,
          '_blank'
        );
      }, (error) => {
        setGeolocationError('Could not get your location. Please enable location services.');
        setShowGeolocationAlert(true);
      });
    } else {
      setGeolocationError('Geolocation is not supported by your browser');
      setShowGeolocationAlert(true);
    }
  };

  const handleRegistrationClick = () => {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }

    if (isRegistered) {
      return;
    }

    if (event.enableRegistrationForm) {
      setShowRegistrationForm(true);
    } else if (event.registrationLink) {
      window.open(event.registrationLink, '_blank');
    }
  };

  const handleAddToCalendar = () => {
    if (event.eventStartDate) {
      const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      const timeOptions = { hour: '2-digit', minute: '2-digit' };
      const formattedDate = new Date(event.eventStartDate).toLocaleDateString('en-US', dateOptions);
      const formattedTime = new Date(event.eventStartDate).toLocaleTimeString('en-US', timeOptions);
      setCalendarMessage(`Event "${event.title}" on ${formattedDate} at ${formattedTime} has been added to your calendar!`);
      setShowAddedToCalendarAlert(true);
      onAddToCalendar(event);
    }
  };

  const registrationButtonText = () => {
    if (isRegistered) return "REGISTERED";
    if (isEventPast) return "EVENT ENDED";
    if (!isRegistrationOpen) return "REGISTRATION CLOSED";
    if (!hasRegistrationMethod) return "NO REGISTRATION REQUIRED";
    return "REGISTER NOW";
  };

  const isButtonDisabled = isRegistered || isEventPast || !isRegistrationOpen || !hasRegistrationMethod;


  return (
    <ErrorBoundary>
      <div className="event-detail-page-container">
        <div className="event-detail-header">
          {event.images && event.images.length > 0 ? (
            <img
              src={event.images[0]}
              alt={event.title}
              onError={(e) => e.target.src = "https://placehold.co/800x450/cccccc/000000?text=Event+Image"}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <img src="https://placehold.co/800x450/cccccc/000000?text=No+Event+Image" alt="Placeholder" loading="lazy" decoding="async" />
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
              <span>{formatDateRange()}</span>
            </div>
            <div className="event-detail-meta-item">
              <MapPin size={18} />
              <span>{event.venueAddress}</span>
            </div>

            <div className="event-detail-price-book">
              <span className="event-detail-price">
                {event.price === 0 ? 'FREE' : `₹${event.price}`}
              </span>
              <button
                className={`event-detail-book-button ${isButtonDisabled ? 'disabled' : ''}`}
                onClick={handleRegistrationClick}
                disabled={isButtonDisabled}
              >
                {registrationButtonText()}
              </button>
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
            isLoggedIn={isLoggedIn}
            onRequireLogin={onRequireLogin}
            onRegister={onRegister}
          />
        )}
        <CustomMessageModal
          isOpen={showGeolocationAlert}
          onClose={() => setShowGeolocationAlert(false)}
          title="Geolocation Error"
          message={geolocationError}
          showConfirm={false}
        />
        <CustomMessageModal
          isOpen={showAddedToCalendarAlert}
          onClose={() => setShowAddedToCalendarAlert(false)}
          title="Event Added"
          message={calendarMessage}
          showConfirm={false}
        />
      </div>
    </ErrorBoundary>
  );
};

// Event Detail Sidebar Component
const EventDetailSidebar = ({ events, currentEvent, onOpenEventDetail }) => {
  const upcomingEvents = events.filter(e =>
    e.type === 'event' &&
    e._id !== currentEvent?._id &&
    new Date(e.eventStartDate) > new Date()
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
                key={event._id}
                className="sidebar-event-item clickable"
                onClick={() => onOpenEventDetail(event)}
              >
                <h4 className="sidebar-event-title">{event.title}</h4>
                <div className="sidebar-event-date">
                  {new Date(event.eventStartDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="sidebar-event-time">
                  {new Date(event.eventStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

// Post Card Component
const PostCard = ({ post, onLike, onShare, onAddComment, likedPosts, isCommentsOpen, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser, onDeletePost, onEditPost, isProfilePage, registrationCount, onReportPost }) => {
  const overlayRef = useRef(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const contentRef = useRef(null);
  const [needsShowMore, setNeedsShowMore] = useState(false);
  const [showShareAlert, setShowShareAlert] = useState(false);

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
  const isUserPost = currentUser && post.userId === currentUser._id;

  const handleCommentIconClick = (e) => {
    e.stopPropagation();
    setOpenCommentPostId(isCommentsOpen ? null : post._id);
  };

  const handleBackArrowClick = (e) => {
    e.stopPropagation();
    setOpenCommentPostId(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target)) {
        setOpenCommentPostId(null);
      }
    };

    if (isCommentsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCommentsOpen, setOpenCommentPostId]);

  const handleAddToCalendarClick = () => {
    if (post.type === 'event' && post.eventStartDate) {
      onAddToCalendar(post);
    }
  };

  const handleShare = async (postId, postTitle, postContent) => {
    const shareUrl = `${window.location.origin}/posts/${postId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: postTitle,
          text: postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''),
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      try {
        const tempInput = document.createElement('textarea');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        setShowShareAlert(true);
      } catch (err) {
        setShowShareAlert(true);
      }
    }
  };

  const renderPostCardContent = () => (
    <>
      <div className="post-header">
        <div className="post-avatar-container">
          <img
            src={post.authorAvatar || 'https://placehold.co/40x40/cccccc/000000?text=A'}
            alt={`${post.author}'s avatar`}
            className="post-avatar"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="post-info">
          <h3 className="post-author">{post.author}</h3>
          <p className="post-timestamp">
            {new Date(post.timestamp).toLocaleDateString()} at {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="post-header-actions">
          <span className={`post-type-badge ${post.type}`}>
            {getPostTypeLabel(post.type)}
          </span>
          <PostOptions
            post={post}
            onDelete={onDeletePost}
            onEdit={onEditPost}
            isProfilePage={isProfilePage}
            currentUser={currentUser}
          />
        </div>
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
            {post.eventStartDate && (
              <div className="event-detail">
                <Clock size={16} />
                <span>
                  {new Date(post.eventStartDate).toLocaleDateString()} at{' '}
                  {new Date(post.eventStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        )}

        {post.images.length > 0 && (
          <div className={`post-images ${post.images.length === 1 ? 'single' : post.images.length === 2 ? 'double' : post.images.length === 3 ? 'triple' : 'quad'}`}>
            {post.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Post image ${index + 1}`}
                className="post-image"
                onError={handleImageError}
                loading="lazy"
                decoding="async"
              />
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
              <button className="action-btn" onClick={handleAddToCalendarClick}>
                <CalendarPlus size={20} />
                <span>Add to Calendar</span>
              </button>
            </div>
          )}

          <div className="post-actions">
            <button className={`action-btn ${likedPosts?.has(post._id) ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); onLike(post._id); }}>
              <Heart size={20} fill={likedPosts?.has(post._id) ? '#ef4444' : 'none'} stroke={likedPosts?.has(post._id) ? '#ef4444' : '#9ca3af'} />
              <span>{post.likes}</span>
            </button>
            <button className="action-btn" onClick={handleCommentIconClick}>
              <MessageIcon size={20} />
              <span>{post.commentData ? post.commentData.length : 0}</span>
            </button>
            {post.type === 'event' && isUserPost && (
              <div className="post-stat">
                <Ticket size={20} />
                <span>{registrationCount || 0}</span>
              </div>
            )}
            <button className="action-btn" onClick={(e) => { e.stopPropagation(); handleShare(post._id, post.title, post.content); }}>
              <Share2 size={20} />
              <span>Share</span>
            </button>
          </div>

          {isCommentsOpen && (
            <CommentSection
              comments={post.commentData || []}
              onAddComment={(commentText) => onAddComment(post._id, commentText)}
              onCloseComments={handleBackArrowClick}
              currentUser={currentUser}
            />
          )}
        </>
      )}
      <CustomMessageModal
        isOpen={showShareAlert}
        onClose={() => setShowShareAlert(false)}
        title="Link Copied!"
        message="The link has been copied to your clipboard."
        showConfirm={false}
      />
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

// Home Component
const HomeComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser, registrations, onReportPost }) => {
  const newsHighlights = [...posts]
    .filter(post => post.type === 'news')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 2);

  return (
    <div>
      {newsHighlights.length > 0 && (
        <>
          <div className="posts-container news-highlights-section">
            {newsHighlights.map(post => (
              <PostCard
                key={post._id}
                post={post}
                onLike={onLike}
                onShare={onShare}
                onAddComment={onAddComment}
                likedPosts={likedPosts}
                isCommentsOpen={openCommentPostId === post._id}
                setOpenCommentPostId={setOpenCommentPostId}
                onOpenEventDetail={onOpenEventDetail}
                onAddToCalendar={onAddToCalendar}
                currentUser={currentUser}
                isProfilePage={false}
                registrationCount={registrations[post._id]}
                onReportPost={onReportPost}
              />
            ))}
          </div>
          <hr className="section-divider" />
        </>
      )}

      <div className="posts-container">
        {posts.filter(p => p.type !== 'news').map(post => (
          <PostCard
            key={post._id}
            post={post}
            onLike={onLike}
            onShare={onShare}
            onAddComment={onAddComment}
            likedPosts={likedPosts}
            isCommentsOpen={openCommentPostId === post._id}
            setOpenCommentPostId={setOpenCommentPostId}
            onOpenEventDetail={onOpenEventDetail}
            onAddToCalendar={onAddToCalendar}
            currentUser={currentUser}
            isProfilePage={false}
            registrationCount={registrations[post._id]}
            onReportPost={onReportPost}
          />
        ))}
      </div>
    </div>
  );
};

// Events Component
const EventsComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser, registrations, onReportPost }) => {
  const eventPosts = posts.filter(post => post.type === 'event');

  return (
    <div id="events-section-content">
      <div className="posts-container">
        {eventPosts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onLike={onLike}
            onShare={onShare}
            onAddComment={onAddComment}
            likedPosts={likedPosts}
            isCommentsOpen={openCommentPostId === post._id}
            setOpenCommentPostId={setOpenCommentPostId}
            onOpenEventDetail={onOpenEventDetail}
            onAddToCalendar={onAddToCalendar}
            currentUser={currentUser}
            isProfilePage={false}
            registrationCount={registrations[post._id]}
            onReportPost={onReportPost}
          />
        ))}
      </div>
    </div>
  );
};

// Confessions Component
const ConfessionsComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser, registrations, onReportPost }) => {
  const confessionPosts = posts.filter(post => post.type === 'confession');

  return (
    <div>
      <div className="posts-container">
        {confessionPosts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onLike={onLike}
            onShare={onShare}
            onAddComment={onAddComment}
            likedPosts={likedPosts}
            isCommentsOpen={openCommentPostId === post._id}
            setOpenCommentPostId={setOpenCommentPostId}
            onOpenEventDetail={onOpenEventDetail}
            onAddToCalendar={onAddToCalendar}
            currentUser={currentUser}
            isProfilePage={false}
            registrationCount={registrations[post._id]}
            onReportPost={onReportPost}
          />
        ))}
      </div>
    </div>
  );
};

// Notifications Component
const NotificationsComponent = ({ notifications, adminNotifications, currentUser, onDeleteReportedPost }) => {
  const isAdmin = currentUser?.isAdmin;
  const displayNotifications = isAdmin ? adminNotifications : notifications;

  return (
    <div>
      <h2 className="page-title">{isAdmin ? 'Admin Panel: Reported Posts' : 'Notifications'}</h2>
      <div className="notifications-container">
        {displayNotifications.length > 0 ? (
          <div className="notifications-list">
            {displayNotifications.map((notification) => (
              <div key={notification._id} className={`notification-item ${notification.type || ''}`}>
                <Bell size={20} className="notification-icon" />
                <div className="notification-content">
                  <p className="notification-text">
                    {notification.message}
                    {isAdmin && notification.reportReason && (
                      <span className="report-reason">
                        Report Reason: {notification.reportReason}
                      </span>
                    )}
                  </p>
                  <span className="notification-timestamp">
                    {new Date(notification.timestamp).toLocaleDateString()}
                  </span>
                  {isAdmin && notification.postId && (
                    <div className="admin-actions">
                      <button
                        className="btn-danger"
                        onClick={() => onDeleteReportedPost(notification.postId._id)}
                      >
                        <Trash2 size={16} /> Delete Post
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="placeholder-card">
            <p className="placeholder-text">
              {isAdmin ? 'No reported posts to review.' : 'No new notifications.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Profile Settings Modal Component
const ProfileSettingsModal = ({ isOpen, onClose, onSave, currentUser }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || '');
  const [customAvatar, setCustomAvatar] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedAvatar(currentUser?.avatar || '');
      setCustomAvatar('');
      setAvatarError('');
    }
  }, [isOpen, currentUser]);

  const predefinedAvatars = [
    { src: avatar1, alt: 'Anime style avatar' },
    { src: avatar2, alt: 'ChatGPT avatar' }
  ];

  const handleCustomImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setAvatarError('Image size cannot exceed 2MB.');
        return;
      }
      compressImage(file, (compressedDataUrl) => {
        setCustomAvatar(compressedDataUrl);
        setSelectedAvatar(null);
        setAvatarError('');
      });
    }
  };

  const handleSave = () => {
    if (!selectedAvatar && !customAvatar) {
      setAvatarError('Please select or upload an avatar.');
      return;
    }
    const newAvatar = customAvatar || selectedAvatar;
    onSave(newAvatar);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content profile-settings-modal">
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile Image</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body profile-settings-body">
          <div className="current-avatar-container">
            <h4 className="modal-subtitle">Current Profile Image</h4>
            <div className="current-avatar-preview">
              <img src={currentUser.avatar || 'https://placehold.co/80x80/cccccc/000000?text=A'} alt="Current Avatar" loading="lazy" decoding="async" />
            </div>
          </div>
          <div className="avatar-options-container">
            <h4 className="modal-subtitle">Choose a new avatar</h4>
            <div className="predefined-avatars-grid">
              {predefinedAvatars.map((av, index) => (
                <div
                  key={index}
                  className={`avatar-option ${selectedAvatar === av.src ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedAvatar(av.src);
                    setCustomAvatar('');
                    setAvatarError('');
                  }}
                >
                  <img src={av.src} alt={av.alt} loading="lazy" decoding="async" />
                </div>
              ))}
            </div>
            <div className="or-divider">
              <span className="or-text">OR</span>
            </div>
            <div className="custom-avatar-upload-section">
              <h4 className="modal-subtitle">Upload your own</h4>
              <div className="custom-upload-container">
                {customAvatar ? (
                  <div className="custom-avatar-preview">
                    <img src={customAvatar} alt="Custom Avatar" loading="lazy" decoding="async" />
                    <button className="remove-image-btn" onClick={() => setCustomAvatar('')}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button className="upload-button" onClick={() => fileInputRef.current.click()}>
                    <ImageIcon size={20} />
                    <span>Upload Image</span>
                  </button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleCustomImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>
          {avatarError && <p className="error-message">{avatarError}</p>}
        </div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};


// Users Component
const UsersComponent = ({ posts, currentUser, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, setIsModalOpen, onDeletePost, onEditPost, registrations, onReportPost, onEditProfile }) => {
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

  const userPosts = posts.filter(post =>
    post.userId === currentUser._id
  );

  const userStats = {
    posts: userPosts.length,
    likesReceived: userPosts.reduce((sum, post) => sum + post.likes, 0),
    commentsReceived: userPosts.reduce((sum, post) => sum + (post.commentData ? post.commentData.length : 0), 0),
    registrationsReceived: userPosts.reduce((sum, post) => {
      return post.type === 'event' ? sum + (registrations[post._id] || 0) : sum;
    }, 0)
  };

  return (
    <div>
      <h2 className="page-title">Your Profile</h2>

      <div className="profile-header">
        <div className="profile-avatar-container">
          <img src={currentUser.avatar || 'https://placehold.co/80x80/cccccc/000000?text=A'} alt={`${currentUser.name}'s avatar`} className="profile-avatar-img" loading="lazy" decoding="async" />
          <button className="edit-avatar-button" onClick={onEditProfile}>
            <Edit3 size={16} />
          </button>
        </div>
        <div className="profile-info">
          <h3 className="profile-name">{currentUser.name}</h3>
          <p className="profile-email">{currentUser.email}</p>
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
            <div className="stat-item">
              <span className="stat-number">{userStats.registrationsReceived}</span>
              <span className="stat-label">Registrations</span>
            </div>
          </div>
        </div>
      </div>

      <h3 className="section-subtitle">Your Posts</h3>

      {userPosts.length > 0 ? (
        <div className="posts-container">
          {userPosts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              onLike={onLike}
              onShare={onShare}
              onAddComment={onAddComment}
              likedPosts={likedPosts}
              isCommentsOpen={openCommentPostId === post._id}
              setOpenCommentPostId={setOpenCommentPostId}
              onOpenEventDetail={onOpenEventDetail}
              onAddToCalendar={onAddToCalendar}
              currentUser={currentUser}
              onDeletePost={onDeletePost}
              onEditPost={onEditPost}
              isProfilePage={true}
              registrationCount={registrations[post._id]}
              onReportPost={onReportPost}
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

// Home Right Sidebar Component
const HomeRightSidebar = ({ posts, onOpenPostDetail }) => {
  const popularPosts = [...posts].sort((a, b) => b.likes - a.likes).slice(0, 3);
  return (
    <div className="sidebar-widget">
      <div className="widget-header">
        <h3 className="widget-title">Popular Posts</h3>
      </div>
      <div className="widget-content">
        <div className="widget-list">
          {popularPosts.map(post => (
            <div
              key={post._id}
              className="popular-post-item clickable"
              onClick={() => onOpenPostDetail(post)}
            >
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

// Events Right Sidebar Component
const EventsRightSidebar = ({ posts, myCalendarEvents, onOpenEventDetail }) => {
  const [value, onChange] = useState(new Date());

  const allEvents = [...posts, ...myCalendarEvents];

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasEvent = allEvents.some(post =>
        post.type === 'event' &&
        post.eventStartDate &&
        new Date(post.eventStartDate).getDate() === date.getDate() &&
        new Date(post.eventStartDate).getMonth() === date.getMonth() &&
        new Date(post.eventStartDate).getFullYear() === date.getFullYear()
      );
      return hasEvent ? <div className="event-dot"></div> : null;
    }
    return null;
  };

  const upcomingCalendarEvents = myCalendarEvents
    .filter(e => new Date(e.eventStartDate) > new Date())
    .sort((a,b) => new Date(a.eventStartDate) - new Date(b.eventStartDate))
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

      {upcomingCalendarEvents.length > 0 && (
        <div className="sidebar-widget my-calendar-events">
          <div className="widget-header">
            <h3 className="widget-title">My Calendar Events</h3>
          </div>
          <div className="widget-content">
            <div className="widget-list">
              {upcomingCalendarEvents.map(event => (
                <div
                  key={event._id}
                  className="sidebar-event-item clickable"
                  onClick={() => onOpenEventDetail(event)}
                >
                  <h4 className="sidebar-event-title">{event.title}</h4>
                  <div className="sidebar-event-date">
                    {new Date(event.eventStartDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="sidebar-event-time">
                    {new Date(event.eventStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

// Confessions Right Sidebar Component
const ConfessionsRightSidebar = ({ posts, onOpenPostDetail }) => {
  const recentConfessions = [...posts]
    .filter(post => post.type === 'confession')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3);
  return (
    <div className="sidebar-widget">
      <div className="widget-header">
        <h3 className="widget-title">Recent Confessions</h3>
      </div>
      <div className="widget-content">
        <div className="widget-list">
          {recentConfessions.map(post => (
            <div 
              key={post._id} 
              className="recent-confession-item clickable"
              onClick={() => onOpenPostDetail(post)}
            >
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

// Users Right Sidebar Component
const UsersRightSidebar = ({ currentUser, posts, registrations }) => {
  if (!currentUser) return null;

  const userPosts = posts.filter(post => post.userId === currentUser._id);

  const userStats = {
    posts: userPosts.length,
    likesReceived: userPosts.reduce((sum, post) => sum + post.likes, 0),
    commentsReceived: userPosts.reduce((sum, post) => sum + (post.commentData ? post.commentData.length : 0), 0),
    registrationsReceived: userPosts.reduce((sum, post) => {
      return post.type === 'event' ? sum + (registrations[post._id] || 0) : sum;
    }, 0)
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
          <p className="widget-item">Registrations: <span className="widget-stat">{userStats.registrationsReceived}</span></p>
        </div>
      </div>
    </div>
  );
};

// Notifications Right Sidebar Component
const NotificationsRightSidebar = ({ onShowHelpModal }) => {
  return (
    <div className="sidebar-widget">
      <div className="widget-header">
        <h3 className="widget-title">Help</h3>
      </div>
      <div className="widget-content">
        <div className="widget-list">
          <button className="widget-item-button" onClick={onShowHelpModal}>
            Help & Support
          </button>
        </div>
      </div>
    </div>
  );
};

// Google Account Picker Simulation Modal
const GoogleAccountPickerModal = ({ isOpen, onClose, onSelectAccount }) => {
  if (!isOpen) return null;

  const simulatedAccounts = [
    { name: 'John Doe', email: 'john.doe@example.com', avatar: 'https://placehold.co/40x40/FF5733/FFFFFF?text=JD' },
    { name: 'Jane Smith', email: 'jane.smith@example.com', avatar: 'https://placehold.co/40x40/33FF57/FFFFFF?text=JS' },
    { name: 'Simulated Admin', email: 'confique01@gmail.com', avatar: 'https://placehold.co/40x40/3366FF/FFFFFF?text=SA' },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-content small-modal">
        <div className="modal-header">
          <h2 className="modal-title">Choose a Google Account</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body google-account-picker">
          {simulatedAccounts.map((account, index) => (
            <div key={index} className="google-account-item" onClick={() => onSelectAccount(account)}>
              <img src={account.avatar} alt={account.name} className="google-account-avatar" />
              <div className="google-account-info">
                <div className="google-account-name">{account.name}</div>
                <div className="google-account-email">{account.email}</div>
              </div>
            </div>
          ))}
          <p className="simulation-note">
            (This is a simulation for demonstration purposes. It does not connect to actual Google services.)
          </p>
        </div>
      </div>
    </div>
  );
};


// Login Modal Component
const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [showGooglePicker, setShowGooglePicker] = useState(false); // New state for Google picker

  useEffect(() => {
    if (isOpen) {
      setIsRegistering(false);
      setError('');
      setFormData({ name: '', email: '', password: '' });
      setShowGooglePicker(false); // Reset picker state
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isRegistering ? `${API_URL}/auth/register` : `${API_URL}/auth/login`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        onLogin(data);
        onClose();
      } else {
        setError(data.message || 'An error occurred. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please check your network connection.');
      console.error(err);
    }
  };

  const handleGoogleLoginClick = () => {
    // Redirect to backend's Google OAuth initiation route
    window.location.href = `${API_URL}/auth/google`;
  };

  // This function is no longer called directly from the button,
  // but it's kept for clarity on what the backend redirect would eventually do.
  const handleSelectGoogleAccount = (account) => {
    // This part is now handled by the backend /api/auth/google/callback
    // The frontend will receive the token and user data via URL parameters after redirect
    console.log("Simulated Google account selected:", account);
    // This function might be removed or adapted if a real Google login manages the frontend state directly
  };


  if (!isOpen) return null;

  return (
    <ErrorBoundary>
      <div className="modal-overlay">
        <div className="modal-content login-modal">
          <div className="modal-header">
            <h2 className="modal-title">{isRegistering ? 'Sign Up' : 'Login'}</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
          <div className="modal-body">
            <button className="btn-google" onClick={handleGoogleLoginClick}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_353_57)">
                  <path d="M19.999 10.231C19.999 9.596 19.946 8.948 19.825 8.324H10.204V11.845H15.912C15.659 13.111 14.937 14.17 13.923 14.861L13.945 15.006L17.151 17.478L17.34 17.495C19.231 15.823 20.315 13.256 19.999 10.231Z" fill="#4285F4"/>
                  <path d="M10.204 19.999C12.879 19.999 15.111 19.124 16.711 17.581L13.923 14.861C13.175 15.367 12.277 15.696 11.294 15.801C10.292 16.036 9.387 16.04 8.441 15.834C6.551 15.541 4.975 14.341 4.417 12.639L4.296 12.648L1.085 15.119L0.985 15.15C2.697 18.397 6.223 19.999 10.204 19.999Z" fill="#34A853"/>
                  <path d="M4.417 12.639C4.161 11.996 4.025 11.314 4.025 10.64C4.025 9.966 4.161 9.284 4.417 8.641L4.407 8.496L1.161 6.096L0.985 6.183C0.354 7.424 0 8.989 0 10.64C0 12.291 0.354 13.856 0.985 15.097L4.417 12.639Z" fill="#FBBC04"/>
                  <path d="M10.204 4.01C11.642 4.01 12.870 4.545 13.864 5.485L16.762 2.607C15.105 1.011 12.859 0 10.204 0C6.223 0 2.697 1.602 0.985 4.849L4.409 7.317L4.417 7.323C4.975 5.621 6.551 4.421 8.441 4.128C9.387 3.922 10.292 3.926 11.294 4.161C11.332 4.084 11.371 4.01 11.41 3.937L10.204 4.01Z" fill="#EA4335"/>
                </g>
                <defs>
                  <clipPath id="clip0_353_57">
                    <rect width="20" height="20" fill="white"/>
                  </clipPath>
                </defs>
              </svg>
              <span>Login with Google</span>
            </button>
            <div className="or-divider"><span className="or-text">Or</span></div>
            <form onSubmit={handleSubmit} className="login-form">
              {isRegistering && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="eg:something@gmail.com"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="btn-primary">
                {isRegistering ? 'Sign Up' : 'Login'}
              </button>
            </form>
            <div className="login-footer">
              <p>
                {isRegistering ? 'Already have an account?' : 'Don\'t have an account?'}
                <button
                  className="toggle-login-btn"
                  onClick={() => setIsRegistering(!isRegistering)}
                >
                  {isRegistering ? 'Login' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* GoogleAccountPickerModal is removed as it's replaced by direct redirect */}
    </ErrorBoundary>
  );
};

// Profile Dropdown Component
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
        <div className="avatar-wrapper">
          <img src={user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A'} alt={`${user.name}'s avatar`} className="avatar-img" loading="lazy" decoding="async" />
        </div>
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu">
          <div className="profile-info">
            <div className="profile-avatar">
              <img src={user.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A'} alt={`${user.name}'s avatar`} className="avatar-img" loading="lazy" decoding="async" />
            </div>
            <div className="profile-details">
              <div className="profile-name-display">{user.name}</div>
              <div className="profile-email">{user.email}</div>
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

// Main App Component
const App = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [openCommentPostId, setOpenCommentPostId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [myCalendarEvents, setMyCalendarEvents] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [postToEdit, setPostToEdit] = useState(null);
  const [registrations, setRegistrations] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportPostData, setReportPostData] = useState(null);
  const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false);

  const hasOpenModal = isModalOpen || showLoginModal || showHelpModal || isReportModalOpen || showProfileSettingsModal;

  // Helper to format dates from backend strings to Date objects
  const formatPostDates = (post) => {
    return {
      ...post,
      timestamp: new Date(post.timestamp),
      eventStartDate: post.eventStartDate ? new Date(post.eventStartDate) : null,
      eventEndDate: post.eventEndDate ? new Date(post.eventEndDate) : null,
      commentData: post.commentData ? post.commentData.map(comment => ({
        ...comment,
        timestamp: new Date(comment.timestamp),
      })) : [],
    };
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_URL}/posts`);
      const data = await res.json();
      setPosts(data.map(formatPostDates)); // Format dates on fetch
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    }
  };

  const fetchRegistrations = async (userId) => {
    if (!currentUser || !currentUser.token) return; // Ensure user and token exist
    try {
      const res = await fetch(`${API_URL}/users/profile`, { // Fetch current user's profile to get registrations
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      const data = await res.json();
      if (res.ok && data.registrations) {
        const registrationsMap = data.registrations.reduce((acc, reg) => {
          acc[reg.eventId] = (acc[reg.eventId] || 0) + 1;
          return acc;
        }, {});
        setRegistrations(registrationsMap);
      }
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser || !currentUser.token) return;
    try {
      const res = await fetch(`${API_URL}/notifications`, {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      const data = await res.json();
      setNotifications(data.map(formatPostDates)); // Assuming notifications might have timestamps
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchAdminNotifications = async () => {
    if (!currentUser || !currentUser.isAdmin || !currentUser.token) return;
    try {
      const res = await fetch(`${API_URL}/users/admin/reported-posts`, {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      const data = await res.json();
      setAdminNotifications(data.map(formatPostDates)); // Assuming reports might have timestamps
    } catch (error) {
      console.error('Failed to fetch admin notifications:', error);
    }
  };

  useEffect(() => {
    // Check URL for Google OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const name = urlParams.get('name');
    const email = urlParams.get('email');
    const avatar = urlParams.get('avatar');
    const isAdmin = urlParams.get('isAdmin') === 'true';
    const _id = urlParams.get('_id');

    if (token && name && email && _id) {
      const user = { _id, name, email, avatar: avatar || null, token, isAdmin };
      handleLogin(user);
      // Clear URL parameters after processing
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedUser = JSON.parse(localStorage.getItem('currentUser'));
      if (savedUser && savedUser.token) {
        setIsLoggedIn(true);
        setCurrentUser(savedUser);
      }
    }
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]); // Re-run if theme changes, but primarily on mount

  useEffect(() => {
    fetchPosts(); // Always fetch posts on initial load

    if (isLoggedIn && currentUser) {
      fetchRegistrations(currentUser._id);
      fetchNotifications();
      if (currentUser.isAdmin) {
        fetchAdminNotifications();
      }
    }
  }, [isLoggedIn, currentUser]);


  useEffect(() => {
    if (hasOpenModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [hasOpenModal]);

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
      if (prev.some(e => e._id === event._id)) {
        return prev;
      }
      return [...prev, event];
    });
  };

  const handleRegisterEvent = async (eventId, eventTitle) => {
    if (!currentUser || !currentUser.token) return;

    try {
      const res = await fetch(`${API_URL}/users/register-event/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });
      if (res.ok) {
        // Re-fetch registrations to update count
        fetchRegistrations(currentUser._id);
        setNotifications(prev => [
          {
            _id: Date.now().toString(),
            message: `You are now registered for "${eventTitle}". See you there!`,
            timestamp: new Date(),
            type: 'success'
          },
          ...prev
        ]);
      } else {
        const errorData = await res.json();
        console.error('Registration failed:', errorData.message);
      }
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const handleAddPost = async (newPost) => {
    if (!isLoggedIn || !currentUser || !currentUser.token) return;

    try {
      const endpoint = postToEdit ? `${API_URL}/posts/${postToEdit._id}` : `${API_URL}/posts`;
      const method = postToEdit ? 'PUT' : 'POST';

      console.log(`[handleAddPost] Sending ${method} request to ${endpoint} with data:`, newPost);
      console.log(`[handleAddPost] Token being sent: Bearer ${currentUser.token}`);


      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(newPost),
      });

      if (res.ok) {
        const responseData = await res.json();
        console.log("[handleAddPost] Backend raw response for post:", responseData);

        // Ensure _id exists before processing
        if (!responseData._id) {
            console.error("[handleAddPost] Backend response is missing _id for the post:", responseData);
            // Fallback: Re-fetch all posts if _id is missing in response
            fetchPosts();
            return;
        }

        const formattedResponsePost = formatPostDates(responseData); // Format dates of the new/updated post
        console.log("[handleAddPost] Formatted post for state update:", formattedResponsePost);

        setPostToEdit(null);
        if (method === 'POST') {
          setPosts(prev => [formattedResponsePost, ...prev]); // Add new post to top
          console.log("[handleAddPost] New post successfully added to local state.");
        } else { // PUT request
          setPosts(prev => prev.map(p => p._id === formattedResponsePost._id ? formattedResponsePost : p)); // Update existing post
          console.log("[handleAddPost] Existing post successfully updated in local state.");
        }
        
        setNotifications(prev => [
          {
            _id: Date.now().toString(),
            message: `A new ${newPost.type} "${newPost.title}" has been posted.`,
            timestamp: new Date(),
          },
          ...prev
        ]);
      } else {
        const errorData = await res.json();
        console.error('[handleAddPost] Failed to save post:', errorData);
      }
    } catch (error) {
      console.error('[handleAddPost] Error saving post:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!isLoggedIn || !currentUser || !currentUser.token) return;
    try {
      const res = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });
      if (res.ok) {
        setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
        setMyCalendarEvents(prevEvents => prevEvents.filter(event => event._id !== postId));
        setLikedPosts(prev => {
          const newLiked = new Set(prev);
          newLiked.delete(postId);
          return newLiked;
        });
      } else {
        console.error('Failed to delete post:', await res.json());
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEditPost = (post) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (currentUser && (post.userId === currentUser._id || currentUser.isAdmin)) {
      setPostToEdit(post);
      setIsModalOpen(true);
      setActiveSection('profile');
    }
  };

  const handleLikePost = async (postId) => {
    if (!isLoggedIn || !currentUser || !currentUser.token) {
      setShowLoginModal(true);
      return;
    }

    const isCurrentlyLiked = likedPosts.has(postId);
    const endpoint = `${API_URL}/posts/${postId}/${isCurrentlyLiked ? 'unlike' : 'like'}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId ? { ...post, likes: data.likes } : post
          )
        );
        setLikedPosts(prev => {
          const newLiked = new Set(prev);
          if (isCurrentlyLiked) {
            newLiked.delete(postId);
          } else {
            newLiked.add(postId);
          }
          return newLiked;
        });
      } else {
        console.error('Failed to like/unlike post:', await res.json());
      }
    } catch (error) {
      console.error('Error liking/unliking post:', error);
    }
  };

  const handleAddComment = async (postId, commentText) => {
    if (!isLoggedIn || !currentUser || !currentUser.token) {
      setShowLoginModal(true);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });
      if (res.ok) {
        const commentData = await res.json();
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post._id === postId ? { ...post, commentData: commentData.map(c => ({...c, timestamp: new Date(c.timestamp)})), comments: commentData.length } : post
          )
        );
      } else {
        console.error('Failed to add comment:', await res.json());
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
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
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      try {
        const tempInput = document.createElement('textarea');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);

        const customAlert = document.createElement('div');
        customAlert.className = 'custom-alert';
        customAlert.innerHTML = 'Link copied to clipboard!';
        document.body.appendChild(customAlert);
        setTimeout(() => {
          document.body.removeChild(customAlert);
        }, 2000);
      } catch (err) {
        console.error('Copy to clipboard failed:', err);
      }
    }
  };

  const handleOpenEventDetail = (event) => {
    setSelectedEvent(event);
    setOpenCommentPostId(null);
    setSelectedPost(null);
  };

  const handleOpenPostDetail = (post) => {
    setSelectedPost(post);
    setOpenCommentPostId(null);
    setSelectedEvent(null);
  };

  const handleCloseEventDetail = () => {
    setSelectedEvent(null);
  };

  const handleLogin = (user) => {
    setIsLoggedIn(true);
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleOpenReportModal = (post) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    setReportPostData(post);
    setIsReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setIsReportModalOpen(false);
    setReportPostData(null);
  };

  const handleReportPost = async (postId, reason) => {
    if (!currentUser || !currentUser.token) return;
    try {
      await fetch(`${API_URL}/posts/${postId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ reason }),
      });
      // Re-fetch admin notifications to show the new report
      if (currentUser.isAdmin) {
        fetchAdminNotifications();
      }
    } catch (err) {
      console.error('Failed to report post:', err);
    }
  };

  const handleDeleteReportedPost = async (postId) => {
    if (!currentUser || !currentUser.isAdmin || !currentUser.token) return;
    try {
      await fetch(`${API_URL}/users/admin/delete-post/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });
      await fetchPosts();
      await fetchAdminNotifications();
      alert('Post and associated reports have been deleted.');
    } catch (err) {
      console.error('Failed to delete reported post:', err);
    }
  };

  const handleUpdateAvatar = async (newAvatar) => {
    if (!currentUser || !currentUser.token) return;

    console.log("[handleUpdateAvatar] Attempting to update avatar...");
    console.log("[handleUpdateAvatar] Current User:", currentUser);
    console.log("[handleUpdateAvatar] New Avatar URL:", newAvatar);
    console.log(`[handleUpdateAvatar] Token being sent: Bearer ${currentUser.token}`);

    try {
      const res = await fetch(`${API_URL}/auth/profile/avatar`, { // Specific endpoint for avatar update
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ avatar: newAvatar }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        console.log("[handleUpdateAvatar] Backend raw response for avatar update:", updatedUser);
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        console.log("[handleUpdateAvatar] Current user updated in state and localStorage.");
        await fetchPosts(); // Update posts to reflect new avatar
        console.log("[handleUpdateAvatar] Posts re-fetched to reflect new avatar.");
      } else {
        const errorData = await res.json();
        console.error('[handleUpdateAvatar] Failed to update avatar:', errorData);
      }
    } catch (err) {
      console.error('[handleUpdateAvatar] Error updating avatar:', err);
    }
    setShowProfileSettingsModal(false);
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
        registrations={registrations}
        onReportPost={handleOpenReportModal}
      />,
      rightSidebar: () => <HomeRightSidebar posts={posts} onOpenPostDetail={handleOpenPostDetail} />,
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
        registrations={registrations}
        onReportPost={handleOpenReportModal}
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
        registrations={registrations}
        onReportPost={handleOpenReportModal}
      />,
      rightSidebar: () => <ConfessionsRightSidebar posts={posts.filter(p => p.type === 'confession')} onOpenPostDetail={handleOpenPostDetail} />,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="nav-icon" />,
      component: () => <NotificationsComponent
        notifications={notifications}
        adminNotifications={adminNotifications}
        currentUser={currentUser}
        onDeleteReportedPost={handleDeleteReportedPost}
      />,
      rightSidebar: () => <NotificationsRightSidebar onShowHelpModal={() => setShowHelpModal(true)} />,
    },
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
          setPostToEdit(null);
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
      registrations={registrations}
      onReportPost={handleOpenReportModal}
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
      registrations={registrations}
      onReportPost={handleOpenReportModal}
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
      registrations={registrations}
      onReportPost={handleOpenReportModal}
    />,
    notifications: () => <NotificationsComponent
      notifications={notifications}
      adminNotifications={adminNotifications}
      currentUser={currentUser}
      onDeleteReportedPost={handleDeleteReportedPost}
    />,
    profile: () => <UsersComponent
      posts={posts} // Pass all posts to profile to filter user's own posts
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
      onDeletePost={handleDeletePost}
      onEditPost={handleEditPost}
      registrations={registrations}
      onReportPost={handleOpenReportModal}
      onEditProfile={() => setShowProfileSettingsModal(true)}
    />,
  };

  const sectionSidebars = {
    home: () => <HomeRightSidebar posts={posts} onOpenPostDetail={handleOpenPostDetail} />,
    events: () => <EventsRightSidebar
      posts={posts.filter(p => p.type === 'event')}
      myCalendarEvents={myCalendarEvents}
      onOpenEventDetail={handleOpenEventDetail}
    />,
    confessions: () => <ConfessionsRightSidebar posts={posts.filter(p => p.type === 'confession')} onOpenPostDetail={handleOpenPostDetail} />,
    notifications: () => <NotificationsRightSidebar onShowHelpModal={() => setShowHelpModal(true)} />,
    profile: () => <UsersRightSidebar currentUser={currentUser} posts={posts} registrations={registrations} />,
  };

  const CurrentComponent = sectionComponents[activeSection] || (() => null);
  const CurrentRightSidebar = sectionSidebars[activeSection] || (() => null);

  return (
    <div className={`app ${hasOpenModal ? 'modal-open' : ''}`}>
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />

      <ReportPostModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        onReport={handleReportPost}
        post={reportPostData}
      />

      {currentUser && (
        <ProfileSettingsModal
          isOpen={showProfileSettingsModal}
          onClose={() => setShowProfileSettingsModal(false)}
          onSave={handleUpdateAvatar}
          currentUser={currentUser}
        />
      )}

      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="header-left">
              <a href="#" className="app-logo-link" onClick={(e) => { e.preventDefault(); setActiveSection('home'); }}>
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
                    setSelectedPost(null);
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

      <div className={`main-layout-container ${hasOpenModal ? 'modal-open' : ''}`}>
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
                    setSelectedPost(null);
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
            {/* Conditional rendering to show a single post at the top of the feed */}
            {selectedPost ? (
              <div className="single-post-and-feed">
                <PostCard
                  post={selectedPost}
                  onLike={handleLikePost}
                  onShare={handleShareClick}
                  onAddComment={handleAddComment}
                  likedPosts={likedPosts}
                  isCommentsOpen={openCommentPostId === selectedPost._id}
                  setOpenCommentPostId={setOpenCommentPostId}
                  onOpenEventDetail={handleOpenEventDetail}
                  onAddToCalendar={handleAddToCalendar}
                  currentUser={currentUser}
                  onDeletePost={handleDeletePost}
                  onEditPost={handleEditPost}
                  isProfilePage={selectedPost.userId === currentUser?._id}
                  registrationCount={registrations[selectedPost._id]}
                  onReportPost={handleOpenReportModal}
                />
                <hr className="section-divider" />
                <h3 className="section-subtitle">More Posts</h3>
                <div className="posts-container">
                  {posts
                    .filter(p => p._id !== selectedPost._id)
                    .map(post => (
                      <PostCard
                        key={post._id}
                        post={post}
                        onLike={handleLikePost}
                        onShare={handleShareClick}
                        onAddComment={handleAddComment}
                        likedPosts={likedPosts}
                        isCommentsOpen={openCommentPostId === post._id}
                        setOpenCommentPostId={setOpenCommentPostId}
                        onOpenEventDetail={handleOpenEventDetail}
                        onAddToCalendar={handleAddToCalendar}
                        currentUser={currentUser}
                        onDeletePost={handleDeletePost}
                        onEditPost={handleEditPost}
                        isProfilePage={post.userId === currentUser?._id}
                        registrationCount={registrations[post._id]}
                        onReportPost={handleOpenReportModal}
                      />
                    ))}
                </div>
              </div>
            ) : selectedEvent ? (
              <EventDetailPage
                event={selectedEvent}
                onClose={handleCloseEventDetail}
                isLoggedIn={isLoggedIn}
                onRequireLogin={() => setShowLoginModal(true)}
                onAddToCalendar={handleAddToCalendar}
                onRegister={(eventId) => handleRegisterEvent(eventId, selectedEvent.title)}
                isRegistered={registrations[selectedEvent._id] > 0} // Check if user is registered for this event
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
                currentUser={currentUser}
                onDeletePost={handleDeletePost}
                onEditPost={handleEditPost}
                registrations={registrations}
                onReportPost={handleOpenReportModal}
              />
            )}
          </div>
        </main>
        <aside className="right-sidebar">
          <div className="right-sidebar-content">
            {!hasOpenModal && (
              selectedEvent ? (
                <EventDetailSidebar
                  events={posts}
                  currentEvent={selectedEvent}
                  onOpenEventDetail={handleOpenEventDetail}
                />
              ) : (
                <CurrentRightSidebar
                  posts={posts}
                  onOpenPostDetail={handleOpenPostDetail}
                />
              )
            )}
          </div>
        </aside>
      </div>

      <AddPostModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPostToEdit(null);
        }}
        onSubmit={handleAddPost}
        postToEdit={postToEdit}
        currentUser={currentUser}
      />

      <HelpAndSupportModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(true)}
      />
    </div>
  );
};

export default App;