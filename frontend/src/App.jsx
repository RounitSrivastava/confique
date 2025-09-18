import React, { useState, useEffect, useRef } from 'react';
import { Analytics } from "@vercel/analytics/react";
import API_URL from './api';
import confiquelogo from './assets/A4_-_1__4_-removebg-preview.png';
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
    Edit3,
    Trash2,
    Mail,
    Flag,
    Check,
    ArrowDownToLine
} from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

// Import predefined avatars
import avatar1 from './assets/Confident Expression in Anime Style.png';
import avatar2 from './assets/ChatGPT Image Aug 3, 2025, 11_19_26 AM.png';

const placeholderAvatar = 'https://placehold.co/40x40/cccccc/000000?text=A';

// Utility function to compress image files before upload
const compressImage = (file, callback) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxWidth = 1000;
            const maxHeight = 1000;

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

            const quality = 0.95;
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            callback(compressedDataUrl);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

// Error Boundary Component for robust error handling in React
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

// Custom Alert/Confirm Modal component - replaces native alert/confirm
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

// Vercel Analytics integration
<Analytics />

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
                    <a href="mailto:confique01@gmail.com" className="email-link">
                        <Mail size={16} /> confique01@gmail.com
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
    const [showErrorAlert, setShowErrorAlert] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setReason('');
            setReportSuccess(false);
            setShowErrorAlert(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (reason) {
            await onReport(post._id, reason);
            setReportSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } else {
            setShowErrorAlert(true);
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
            <CustomMessageModal
                isOpen={showErrorAlert}
                onClose={() => setShowErrorAlert(false)}
                title="Input Required"
                message="Please select a reason for reporting."
                showConfirm={false}
            />
        </div>
    );
};

// Post Options Component (e.g., for edit, delete, report)
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

    if (!currentUser) return null; // Hide the options button if the user is not logged in

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
                    {isAuthorOrAdmin && (post.type === 'event' || post.type === 'culturalEvent') && (
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

// Comment Item Component - Renders a single comment
const CommentItem = ({ comment, currentUser }) => {
    const isCommentAuthor = currentUser && comment.authorId === currentUser._id;
    const avatarSrc = isCommentAuthor ? currentUser.avatar : (comment.authorAvatar || placeholderAvatar);

    return (
        <div className="comment-item">
            <div className="comment-avatar">
                <img
                    src={avatarSrc}
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
};

// Comment Section Component - Handles displaying and adding comments
const CommentSection = ({ comments, onAddComment, onCloseComments, currentUser }) => {
    const [newCommentText, setNewCommentText] = useState('');
    const [showCommentAlert, setShowCommentAlert] = useState(false);

    const handleAddCommentSubmit = (e) => {
        e.preventDefault();
        if (newCommentText.trim()) {
            onAddComment(newCommentText);
            setNewCommentText('');
        } else {
            setShowCommentAlert(true);
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
                        <CommentItem key={comment._id} comment={comment} currentUser={currentUser} />
                    ))
                ) : (
                    <p className="no-comments-message">No comments yet. Be the first to comment!</p>
                )}
            </div>
            <CustomMessageModal
                isOpen={showCommentAlert}
                onClose={() => setShowCommentAlert(false)}
                title="Empty Comment"
                message="Please enter some text to add a comment."
                showConfirm={false}
            />
        </div>
    );
};

// Registration Form Modal component
const RegistrationFormModal = ({ isOpen, onClose, event, isLoggedIn, onRequireLogin, onRegister, isRegistered }) => {
    const getInitialFormData = () => {
        const base = { name: '', email: '', phone: '', transactionId: '' };
        if (event.registrationFields) {
            const customFields = event.registrationFields.split(',').map(field => field.split(':')[0].trim());
            customFields.forEach(field => {
                if (!base.hasOwnProperty(field.toLowerCase().replace(/ /g, ''))) {
                    base[field] = '';
                }
            });
        }
        return base;
    };
    const [formData, setFormData] = useState({});
    const [showPaymentStep, setShowPaymentStep] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showFormAlert, setShowFormAlert] = useState(false);
    const [formAlertMessage, setFormAlertMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData());
            setShowPaymentStep(false);
            setShowSuccessModal(false);
        }
    }, [isOpen, event]);

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

        if (isRegistered) {
            setFormAlertMessage("Thank you! Your registration has been confirmed.");
            setShowFormAlert(true);
            return;
        }

        if (!formData.name || !formData.email || !formData.phone) {
            setFormAlertMessage("Please fill in all required registration fields.");
            setShowFormAlert(true);
            return;
        }

        if (!/^\d{10}$/.test(formData.phone)) {
            setFormAlertMessage("Phone number must be exactly 10 digits.");
            setShowFormAlert(true);
            return;
        }

        const phoneKeywords = ['phone', 'mobile', 'contact'];
        const customPhoneFields = customFields
            .map(field => field.split(':')[0].trim())
            .filter(fieldName => phoneKeywords.some(keyword => fieldName.toLowerCase().includes(keyword)));

        for (const field of customPhoneFields) {
            const fieldValue = formData[field];
            if (fieldValue && !/^\d{10}$/.test(fieldValue)) {
                setFormAlertMessage(`The field '${field}' must be exactly 10 digits.`);
                setShowFormAlert(true);
                return;
            }
        }

        if (event.price > 0 && event.enableRegistrationForm && event.paymentMethod === 'qr') {
            setShowPaymentStep(true);
        } else {
            setSuccessMessage(`Thank you ${formData.name} for registering for ${event.title}!`);
            onRegister(event._id, { ...formData, eventTitle: event.title, type: event.type });
            setShowSuccessModal(true);
        }
    };

    const handlePaymentConfirm = (e) => {
        e.preventDefault();
        if (event.price > 0 && event.paymentMethod === 'qr' && (!formData.transactionId || formData.transactionId.length !== 4)) {
            setFormAlertMessage("Please enter the last 4 digits of your transaction number.");
            setShowFormAlert(true);
            return;
        }
        setSuccessMessage(`Thank you ${formData.name} for your payment! Registration confirmed.`);
        onRegister(event._id, { ...formData, eventTitle: event.title, type: event.type });
        setShowSuccessModal(true);
    };

    const handleClose = () => {
        setShowPaymentStep(false);
        onClose();
    };

    const handleSuccessModalClose = () => {
        setShowSuccessModal(false);
        onClose();
    };

    if (!isOpen) return null;

    const renderCustomField = (field) => {
        const isDropdown = field.includes(':');
        if (isDropdown) {
            const [fieldName, optionsString] = field.split(':');
            const options = optionsString.split('|');
            const name = fieldName.trim();
            return (
                <div key={name} className="form-group">
                    <label className="form-label">{name}</label>
                    <select
                        name={name}
                        className="form-input"
                        value={formData[name] || ''}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select an option</option>
                        {options.map((option, index) => (
                            <option key={index} value={option.trim()}>
                                {option.trim()}
                            </option>
                        ))}
                    </select>
                </div>
            );
        } else {
            const name = field.trim();
            const phoneKeywords = ['phone', 'mobile', 'contact'];
            const isPhoneField = phoneKeywords.some(keyword => name.toLowerCase().includes(keyword));

            return (
                <div key={name} className="form-group">
                    <label className="form-label">{name}</label>
                    <input
                        type={isPhoneField ? 'tel' : 'text'}
                        name={name}
                        className="form-input"
                        value={formData[name] || ''}
                        onChange={handleChange}
                        required
                    />
                </div>
            );
        }
    };

    const renderFormContent = () => {
        if (showPaymentStep) {
            return (
                <form onSubmit={handlePaymentConfirm} className="modal-form">
                    <div className="payment-step">
                        <h3>Complete Your Payment</h3>
                        <p>Please scan the QR code to make your payment and enter the transaction details below.</p>
                        <div className="qr-payment-section">
                            <img
                                src={event.paymentQRCode}
                                alt="Payment QR Code"
                                className="payment-qr"
                                loading="lazy"
                                decoding="async"
                                onError={(e) => e.target.src = "https://placehold.co/200x200/cccccc/000000?text=QR+Code+Error"}
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
                        placeholder="e.g., 9876543210"
                        required
                    />
                </div>

                {customFields.map(field => (
                    field && !['name', 'email', 'phone'].includes(field.toLowerCase()) && renderCustomField(field)
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
                    <CustomMessageModal
                        isOpen={showFormAlert}
                        onClose={() => setShowFormAlert(false)}
                        title="Validation Error"
                        message={formAlertMessage}
                        showConfirm={false}
                    />
                </div>
            </div>
        </ErrorBoundary>
    );
};

// Cultural Event Registration Modal
const CulturalEventRegistrationModal = ({ isOpen, onClose, event, isLoggedIn, onRequireLogin, onRegister, isRegistered }) => {
    const getInitialFormData = () => {
        const base = {
            name: '',
            email: '',
            phone: '',
            transactionId: '',
            selectedDates: [],
            paymentScreenshot: null, // NEW: Add paymentScreenshot field to initial state
        };

        if (event.registrationFields) {
            const customFields = event.registrationFields.split(',').map(field => field.split(':')[0].trim());
            customFields.forEach(field => {
                if (!base.hasOwnProperty(field.toLowerCase().replace(/ /g, ''))) {
                    base[field.toLowerCase()] = '';
                }
            });
        }
        if (event.ticketOptions && event.ticketOptions.length > 0) {
            base.ticketSelections = event.ticketOptions.map(() => ({ quantity: 0 }));
        } else {
            base.ticketSelections = [{ quantity: 0 }];
        }
        return base;
    };

    const [formData, setFormData] = useState(getInitialFormData);
    const [showFormAlert, setShowFormAlert] = useState(false);
    const [formAlertMessage, setFormAlertMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showPaymentStep, setShowPaymentStep] = useState(false);
    const [paymentScreenshot, setPaymentScreenshot] = useState(null); // State for payment screenshot
    const screenshotInputRef = useRef(null);

    const availableDates = event.availableDates || [];

    useEffect(() => {
        if (isOpen) {
            if (!isLoggedIn) {
                onRequireLogin();
                onClose(); // Close the current modal if not logged in
                return;
            }
            setFormData(getInitialFormData());
            setShowPaymentStep(false);
            setShowFormAlert(false);
            setFormAlertMessage('');
            setShowSuccessModal(false);
            setSuccessMessage('');
            setPaymentScreenshot(null);
        }
    }, [isOpen, event, isLoggedIn, onRequireLogin, onClose]);

    const customFields = event.registrationFields ?
        event.registrationFields.split(',').map(field => field.trim()) :
        [];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateSelect = (dateIsoString) => {
        setFormData(prev => {
            const newDates = new Set(prev.selectedDates || []);
            if (newDates.has(dateIsoString)) {
                newDates.delete(dateIsoString);
            } else {
                newDates.add(dateIsoString);
            }
            return { ...prev, selectedDates: Array.from(newDates) };
        });
    };

    const handleQuantityChange = (index, newQuantity) => {
        const updatedSelections = [...(formData.ticketSelections || [])];
        updatedSelections[index] = { ...updatedSelections[index], quantity: Math.max(0, parseInt(newQuantity) || 0) };
        setFormData(prev => ({ ...prev, ticketSelections: updatedSelections }));
    };

    const calculateTotalPrice = () => {
        const totalTicketPrice = (formData.ticketSelections || []).reduce((total, selection, index) => {
            const price = event.ticketOptions[index]?.ticketPrice || 0;
            return total + (price * (selection?.quantity || 0));
        }, 0);
        const numberOfDays = (formData.selectedDates || []).length;
        // If no dates are selected, the price should be the total ticket price for one day, or 0 if free.
        const effectiveNumberOfDays = Math.max(1, numberOfDays);
        return totalTicketPrice * effectiveNumberOfDays;
    };

    const totalPrice = calculateTotalPrice();
    const hasTicketsSelected = (formData.ticketSelections || []).some(selection => (selection?.quantity || 0) > 0);
    const hasDatesSelected = (formData.selectedDates || []).length > 0;
    const isFree = totalPrice === 0;
    const isPaymentMethodSet = event.culturalPaymentMethod === 'link' || event.culturalPaymentMethod === 'qr';
    
    // Corrected logic for enabling the "Proceed to Payment" button
    const isRegistrationFormValid = formData.name && formData.email && formData.phone && hasTicketsSelected && (event.availableDates.length === 0 || hasDatesSelected);
    const isProceedToPaymentEnabled = isRegistrationFormValid && totalPrice > 0 && isPaymentMethodSet;


    const handleProceedToPayment = (e) => {
        e.preventDefault();
        if (!isLoggedIn) {
            onRequireLogin();
            return;
        }

        if (isRegistered) {
            setFormAlertMessage("You are already registered for this event.");
            setShowFormAlert(true);
            return;
        }

        if (!formData.name || !formData.email || !formData.phone) {
            setFormAlertMessage("Please provide your name, email, and phone number.");
            setShowFormAlert(true);
            return;
        }
        if (event.availableDates.length > 0 && !hasDatesSelected) {
            setFormAlertMessage("Please select at least one booking date.");
            setShowFormAlert(true);
            return;
        }
        if (!hasTicketsSelected) {
            setFormAlertMessage("Please select at least one ticket.");
            setShowFormAlert(true);
            return;
        }

        if (totalPrice > 0 && isPaymentMethodSet) {
            setShowPaymentStep(true);
        } else {
            handleFinalRegistration();
        }
    };

    const handleFinalRegistration = async (e) => {
        if (e) e.preventDefault();
        
        if (isRegistered) {
            setFormAlertMessage("You are already registered for this event.");
            setShowFormAlert(true);
            return;
        }
        
        const selectedTickets = (formData.ticketSelections || [])
            .filter(selection => (selection?.quantity || 0) > 0)
            .map((selection, index) => ({
                ticketType: event.ticketOptions[index]?.ticketType,
                ticketPrice: event.ticketOptions[index]?.ticketPrice,
                quantity: selection.quantity,
            }));

        // New validation for payment screenshot
        if (event.culturalPaymentMethod === 'qr' && (event.enablePaymentScreenshot || false) && !isFree && !paymentScreenshot) {
            setFormAlertMessage("Please upload a payment screenshot.");
            setShowFormAlert(true);
            return;
        }

        const registrationData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            bookingDates: formData.selectedDates,
            selectedTickets,
            totalPrice,
            transactionId: formData.transactionId || null,
            // Pass the payment screenshot to the backend
            paymentScreenshot, 
            eventTitle: event.title,
            type: event.type,
        };

        if (event.registrationFields) {
            event.registrationFields.split(',').forEach(field => {
                const fieldName = field.split(':')[0].trim();
                const fieldValue = formData[fieldName];
                if (fieldValue) {
                    registrationData[fieldName] = fieldValue;
                }
            });
        }

        if (event.culturalPaymentMethod === 'qr' && !isFree && (!formData.transactionId || formData.transactionId.length < 4)) {
            setFormAlertMessage("Please enter the last 4 digits of your transaction number.");
            setShowFormAlert(true);
            return;
        }
        
        try {
            await onRegister(event._id, registrationData);
            setSuccessMessage(`Thank you ${formData.name} for registering for ${event.title}!`);
            setShowSuccessModal(true);
        } catch (error) {
            console.error("Error during registration process:", error);
            setFormAlertMessage("Registration failed. Please try again.");
            setShowFormAlert(true);
        }
    };

    const handlePaymentLinkClick = () => {
        if (event.culturalPaymentMethod === 'link' && event.culturalPaymentLink) {
            window.open(event.culturalPaymentLink, '_blank');
        }
    };

    // New function to handle screenshot upload
    const handlePaymentScreenshotUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        compressImage(file, (compressedDataUrl) => {
            setPaymentScreenshot(compressedDataUrl);
        });
        e.target.value = null;
    };

    const handleRemoveScreenshot = () => {
        setPaymentScreenshot(null);
        if (screenshotInputRef.current) {
            screenshotInputRef.current.value = null;
        }
    };

    const handleClose = () => {
        setShowPaymentStep(false);
        onClose();
    };

    if (!isOpen || !event) return null;

    const renderCustomField = (field) => {
        const isDropdown = field.includes(':');
        if (isDropdown) {
            const [fieldName, optionsString] = field.split(':');
            const options = optionsString.split('|');
            const name = fieldName.trim();
            return (
                <div key={name} className="form-group">
                    <label className="form-label">{name}</label>
                    <select
                        name={name}
                        className="form-input"
                        value={formData[name] || ''}
                        onChange={(e) => setFormData(prev => ({...prev, [name]: e.target.value}))}
                        required
                    >
                        <option value="">Select an option</option>
                        {options.map((option, index) => (
                            <option key={index} value={option.trim()}>
                                {option.trim()}
                            </option>
                        ))}
                    </select>
                </div>
            );
        } else {
            const name = field.trim();
            const phoneKeywords = ['phone', 'mobile', 'contact'];
            const isPhoneField = phoneKeywords.some(keyword => name.toLowerCase().includes(keyword));

            return (
                <div key={name} className="form-group">
                    <label className="form-label">{name}</label>
                    <input
                        type={isPhoneField ? 'tel' : 'text'}
                        name={name}
                        className="form-input"
                        value={formData[name] || ''}
                        onChange={(e) => setFormData(prev => ({...prev, [name]: e.target.value}))}
                        required
                    />
                </div>
            );
        }
    };

    const renderRegistrationForm = () => (
        <form onSubmit={handleProceedToPayment} className="modal-form">
            <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-input" name="name" value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} required />
            </div>
            <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" name="email" value={formData.email} onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))} required />
            </div>
            <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                    type="tel"
                    className="form-input"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                    placeholder="e.g., 9876543210"
                    required
                />
            </div>
            {customFields.map(field => (
                field && !['name', 'email', 'phone'].includes(field.toLowerCase()) && renderCustomField(field)
            ))}

            {availableDates.length > 0 && (
                <div className="form-group">
                    <label className="form-label">Select Booking Dates</label>
                    <div className="available-dates-grid">
                        {availableDates.map((dateIsoString, index) => (
                            <button
                                key={dateIsoString}
                                type="button"
                                className={`date-selection-btn ${(formData.selectedDates || []).includes(dateIsoString) ? 'selected' : ''}`}
                                onClick={() => handleDateSelect(dateIsoString)}
                            >
                                {new Date(dateIsoString).toLocaleDateString()}
                                {(formData.selectedDates || []).includes(dateIsoString) && <Check size={16} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="ticket-options-container">
                <label className="form-label">Select Tickets</label>
                {(event.ticketOptions || []).map((option, index) => (
                    <div key={index} className="ticket-selection-item">
                        <div className="ticket-info">
                            <span className="ticket-type">{option.ticketType}</span>
                            <span className="ticket-price">₹{option.ticketPrice}</span>
                        </div>
                        <input
                            type="number"
                            className="ticket-quantity-input"
                            value={(formData.ticketSelections && formData.ticketSelections[index]) ? formData.ticketSelections[index].quantity : 0}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            min="0"
                        />
                    </div>
                ))}
            </div>

            <div className="total-price-display">
                <span>Total Price: </span>
                <strong>₹{totalPrice}</strong>
            </div>

            <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={isRegistered || !isRegistrationFormValid || (totalPrice > 0 && !isProceedToPaymentEnabled)}
                >
                    {isProceedToPaymentEnabled ? 'Proceed to Payment' : 'Submit Registration'}
                </button>
            </div>
        </form>
    );

    const renderPaymentStep = () => (
        <form onSubmit={handleFinalRegistration} className="modal-form">
            <div className="payment-step">
                <h3>Complete Your Payment</h3>
                <p>Please use the method below to complete your payment.</p>

                {event.culturalPaymentMethod === 'link' && event.culturalPaymentLink && (
                    <div className="form-group">
                        <label className="form-label">Payment Link</label>
                        <button type="button" className="btn-secondary" onClick={handlePaymentLinkClick}>
                            <ArrowRight size={18} /> Open Payment Link
                        </button>
                    </div>
                )}

                {event.culturalPaymentMethod === 'qr' && event.culturalPaymentQRCode ? (
                    <div className="form-group">
                        <label className="form-label">Payment via QR Code</label>
                        <img
                            src={event.culturalPaymentQRCode}
                            alt="Payment QR Code"
                            className="payment-qr"
                            loading="lazy"
                            decoding="async"
                            onError={(e) => e.target.src = "https://placehold.co/200x200/cccccc/000000?text=QR+Code+Error"}
                        />
                        {/* Check if payment screenshot upload is enabled and render the upload field */}
                        {!!event.enablePaymentScreenshot && (
                            <div className="form-group payment-screenshot-upload">
                                <label className="form-label">Upload Payment Screenshot</label>
                                {paymentScreenshot ? (
                                    <div className="payment-qr-preview">
                                        <img src={paymentScreenshot} alt="Payment Screenshot" loading="lazy" decoding="async" />
                                        <button type="button" className="remove-image-btn" onClick={handleRemoveScreenshot}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label htmlFor="screenshot-file-input" className="upload-btn-wrapper">
                                        <div className="upload-btn">
                                            <ImageIcon size={16} />
                                            <span>Upload Screenshot</span>
                                        </div>
                                        <input
                                            id="screenshot-file-input"
                                            ref={screenshotInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePaymentScreenshotUpload}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                )}
                            </div>
                        )}
                        <label className="form-label">Last 4 Digits of Transaction ID</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.transactionId}
                            onChange={(e) => setFormData(prev => ({...prev, transactionId: e.target.value}))}
                            placeholder="Last 4 digits of Transaction ID"
                            maxLength={4}
                            required
                        />
                    </div>
                ) : (
                    <p className="placeholder-text error-message">
                        The event host has not provided a QR code for this event. Please contact them for payment details.
                    </p>
                )}
            </div>
            <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentStep(false)}>
                    Back
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={!isPaymentMethodSet || (!!event.enablePaymentScreenshot && !paymentScreenshot) || (event.culturalPaymentMethod === 'qr' && !formData.transactionId)}
                >
                    Confirm Registration
                </button>
            </div>
        </form>
    );

    return (
        <div className="modal-overlay">
            <div className="modal-content small-modal">
                <div className="modal-header">
                    <h2 className="modal-title">Register for {event.title}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="modal-body">
                    {isRegistered ? (
                        <div className="already-registered-message">
                            <Check size={48} className="success-icon" />
                            <h3>You are already registered for this event.</h3>
                            <p>Registration confirmed.</p>
                            <button className="btn-primary" onClick={onClose}>Close</button>
                        </div>
                    ) : (
                        showPaymentStep ? renderPaymentStep() : renderRegistrationForm()
                    )}
                </div>
            </div>
            <CustomMessageModal
                isOpen={showFormAlert}
                onClose={() => setShowFormAlert(false)}
                title="Validation Error"
                message={formAlertMessage}
                showConfirm={false}
            />
            <CustomMessageModal
                isOpen={showSuccessModal}
                onClose={handleClose}
                title="Registration Successful!"
                message={successMessage}
                showConfirm={false}
            />
        </div>
    );
};

const AddPostModal = ({ isOpen, onClose, onSubmit, postToEdit, currentUser, onShowSuccessAlert }) => {
    const getInitialFormData = (postToEdit, currentUser) => {
        const initial = {
            type: 'confession',
            title: '',
            content: '',
            author: currentUser?.name || '',
            location: '',
            venueAddress: '',
            eventStartDate: '',
            eventEndDate: '',
            price: 0,
            language: 'English',
            duration: '',
            registrationLink: '',
            registrationOpen: true,
            enableRegistrationForm: false,
            registrationFields: '',
            paymentMethod: 'link',
            paymentLink: '',
            paymentQRCode: '',
            ticketOptions: [{ ticketType: '', ticketPrice: 0 }],
            culturalPaymentMethod: 'link',
            culturalPaymentLink: '',
            culturalPaymentQRCode: '',
            availableDates: [''],
            enablePaymentScreenshot: false,
        };

        if (postToEdit) {
            const isCulturalEvent = postToEdit.type === 'culturalEvent';
            const editedData = {
                ...initial,
                ...postToEdit,
                eventStartDate: postToEdit.eventStartDate ? new Date(postToEdit.eventStartDate).toISOString().slice(0, 16) : '',
                eventEndDate: postToEdit.eventEndDate ? new Date(postToEdit.eventEndDate).toISOString().slice(0, 16) : '',
                price: isCulturalEvent ? 0 : (postToEdit.price || 0),
                ticketOptions: isCulturalEvent ? (postToEdit.ticketOptions || [{ ticketType: '', ticketPrice: 0 }]) : [{ ticketType: '', ticketPrice: 0 }],
                availableDates: isCulturalEvent ? (postToEdit.availableDates || ['']) : [''],
                enablePaymentScreenshot: postToEdit.enablePaymentScreenshot || false,
            };
            const allFields = Object.keys(initial);
            allFields.forEach(field => {
                if (!(field in editedData)) {
                    editedData[field] = initial[field];
                }
            });
            return editedData;
        }

        return initial;
    };

    const [formData, setFormData] = useState(() => getInitialFormData(postToEdit, currentUser));
    const [imagePreviews, setImagePreviews] = useState(postToEdit?.images || []);
    const [paymentQRPreview, setPaymentQRPreview] = useState(postToEdit?.paymentQRCode || postToEdit?.culturalPaymentQRCode || '');
    const [showUploadAlert, setShowUploadAlert] = useState(false);
    const [uploadAlertMessage, setUploadAlertMessage] = useState('');
    const fileInputRef = useRef(null);
    const qrFileInputRef = useRef(null);
    const [hasRegistration, setHasRegistration] = useState(!!postToEdit?.registrationLink || !!postToEdit?.enableRegistrationForm);
    const [registrationMethod, setRegistrationMethod] = useState(postToEdit?.registrationLink ? 'link' : (postToEdit?.enableRegistrationForm ? 'form' : ''));

    useEffect(() => {
        if (isOpen) {
            setFormData(getInitialFormData(postToEdit, currentUser));
            setImagePreviews(postToEdit?.images || []);
            setPaymentQRPreview(postToEdit?.paymentQRCode || postToEdit?.culturalPaymentQRCode || '');
            setHasRegistration(!!postToEdit?.registrationLink || !!postToEdit?.enableRegistrationForm);
            setRegistrationMethod(postToEdit?.registrationLink ? 'link' : (postToEdit?.enableRegistrationForm ? 'form' : ''));
            setShowUploadAlert(false);
            setUploadAlertMessage('');
        }
    }, [isOpen, postToEdit, currentUser]);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleTicketOptionChange = (index, e) => {
        const { name, value } = e.target;
        const newTicketOptions = [...formData.ticketOptions];
        newTicketOptions[index] = {
            ...newTicketOptions[index],
            [name]: name === 'ticketPrice' ? parseFloat(value) || 0 : value,
        };
        setFormData(prev => ({ ...prev, ticketOptions: newTicketOptions }));
    };

    const addTicketOption = () => {
        setFormData(prev => ({
            ...prev,
            ticketOptions: [...prev.ticketOptions, { ticketType: '', ticketPrice: 0 }]
        }));
    };

    const removeTicketOption = (index) => {
        const newTicketOptions = formData.ticketOptions.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, ticketOptions: newTicketOptions }));
    };

    const handleDateChange = (index, e) => {
        const { value } = e.target;
        const newDates = [...formData.availableDates];
        if (value) {
            newDates[index] = new Date(value).toISOString();
        } else {
            newDates[index] = '';
        }
        setFormData(prev => ({ ...prev, availableDates: newDates }));
    };

    const addDateInput = () => {
        setFormData(prev => ({
            ...prev,
            availableDates: [...prev.availableDates, '']
        }));
    };

    const removeDateInput = (index) => {
        const newDates = formData.availableDates.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, availableDates: newDates }));
    };

    const handleTypeChange = (e) => {
        const newType = e.target.value;
        setFormData(prev => ({
            ...getInitialFormData(null, currentUser),
            type: newType,
            author: currentUser?.name || '',
            registrationOpen: newType !== 'confession'
        }));
        setHasRegistration(newType !== 'confession');
        setRegistrationMethod(newType !== 'confession' ? 'link' : '');
        setPaymentQRPreview('');
    };

    const handleRegistrationToggle = () => {
        const newHasRegistration = !hasRegistration;
        setHasRegistration(newHasRegistration);
        if (!newHasRegistration) {
            setRegistrationMethod('');
            setFormData(prev => ({
                ...prev,
                registrationLink: '',
                enableRegistrationForm: false,
                registrationFields: '',
                paymentMethod: 'link',
                paymentLink: '',
                paymentQRCode: '',
                ticketOptions: [{ ticketType: '', ticketPrice: 0 }],
                culturalPaymentMethod: 'link',
                culturalPaymentLink: '',
                culturalPaymentQRCode: '',
                availableDates: [''],
                enablePaymentScreenshot: false,
            }));
        } else {
            const defaultMethod = formData.type === 'culturalEvent' ? 'form' : 'link';
            setRegistrationMethod(defaultMethod);
            setFormData(prev => ({
                ...prev,
                registrationLink: defaultMethod === 'link' ? prev.registrationLink : '',
                enableRegistrationForm: defaultMethod === 'form',
                registrationFields: defaultMethod === 'form' ? 'Team Name, Team Captain\'s Name, Captain\'s WhatsApp mobile number, Captain\'s Email Id' : '',
            }));
        }
    };

    const handleRegistrationMethodChange = (method) => {
        setRegistrationMethod(method);
        setFormData(prev => ({
            ...prev,
            registrationLink: method === 'link' ? prev.registrationLink : '',
            enableRegistrationForm: method === 'form',
            registrationFields: method === 'form' ? prev.registrationFields : '',
            paymentMethod: 'link',
            paymentLink: '',
            paymentQRCode: ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            setUploadAlertMessage("Please fill in the Title and Content fields.");
            setShowUploadAlert(true);
            return;
        }

        if ((formData.type === 'event' || formData.type === 'culturalEvent') && (!formData.location || !formData.venueAddress || !formData.eventStartDate || !formData.duration)) {
            setUploadAlertMessage("Please fill in all required event details (Location, Venue Address, Start Date, Duration).");
            setShowUploadAlert(true);
            return;
        }

        if (formData.type === 'culturalEvent') {
            const hasEmptyTicketFields = formData.ticketOptions.some(option => !option.ticketType || option.ticketPrice < 0);
            const hasEmptyDateFields = formData.availableDates.some(date => !date);
            if (hasEmptyTicketFields) {
                setUploadAlertMessage("Please fill in all required ticket details for the cultural event.");
                setShowUploadAlert(true);
                return;
            }
            if (hasEmptyDateFields) {
                setUploadAlertMessage("Please fill in all available dates for the cultural event.");
                setShowUploadAlert(true);
                return;
            }
        }

        if ((formData.type === 'event' || formData.type === 'culturalEvent') && hasRegistration) {
            if (!registrationMethod) {
                setUploadAlertMessage("Please select a registration method.");
                setShowUploadAlert(true);
                return;
            }

            if (registrationMethod === 'link' && !formData.registrationLink) {
                setUploadAlertMessage("Please provide a Registration Link.");
                setShowUploadAlert(true);
                return;
            }
            if (registrationMethod === 'form') {
                if (formData.type === 'event' && formData.price > 0 && formData.paymentMethod === 'link' && !formData.paymentLink) {
                    setUploadAlertMessage("Please provide a Payment Link or choose QR Code payment.");
                    setShowUploadAlert(true);
                    return;
                }
                if (formData.type === 'event' && formData.price > 0 && formData.paymentMethod === 'qr' && !paymentQRPreview) {
                    setUploadAlertMessage("Please upload a QR Code image for payment.");
                    setShowUploadAlert(true);
                    return;
                }
                if (formData.type === 'culturalEvent' && (formData.ticketOptions.reduce((sum, opt) => sum + opt.ticketPrice, 0) > 0)) {
                    if (formData.culturalPaymentMethod === 'link' && !formData.culturalPaymentLink) {
                        setUploadAlertMessage("Please provide a Payment Link or choose QR Code payment for the cultural event.");
                        setShowUploadAlert(true);
                        return;
                    }
                    if (formData.culturalPaymentMethod === 'qr' && !paymentQRPreview) {
                        setUploadAlertMessage("Please upload a QR Code image for payment for the cultural event.");
                        setShowUploadAlert(true);
                        return;
                    }
                }
            }
        }

        let submissionData = {
            ...formData,
            images: imagePreviews,
            userId: currentUser?._id,
            author: currentUser?.name || 'Anonymous',
            authorAvatar: currentUser?.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A',
            status: (formData.type === 'event' || formData.type === 'culturalEvent') ? 'pending' : 'approved',
            timestamp: postToEdit ? postToEdit.timestamp : new Date().toISOString(),
        };

        if (formData.type === 'event') {
            submissionData = {
                ...submissionData,
                price: parseFloat(formData.price) || 0,
                registrationLink: hasRegistration && registrationMethod === 'link' ? formData.registrationLink : '',
                enableRegistrationForm: hasRegistration && registrationMethod === 'form',
                registrationFields: hasRegistration && registrationMethod === 'form' ? formData.registrationFields : '',
                paymentMethod: hasRegistration && registrationMethod === 'form' && formData.price > 0 ? formData.paymentMethod : '',
                paymentLink: hasRegistration && registrationMethod === 'form' && formData.price > 0 && formData.paymentMethod === 'link' ? formData.paymentLink : '',
                paymentQRCode: hasRegistration && registrationMethod === 'form' && formData.price > 0 && formData.paymentMethod === 'qr' ? paymentQRPreview : '',
                ticketOptions: undefined,
                culturalPaymentMethod: undefined,
                culturalPaymentLink: undefined,
                culturalPaymentQRCode: undefined,
                availableDates: undefined,
                enablePaymentScreenshot: undefined,
            };
        } else if (formData.type === 'culturalEvent') {
            submissionData = {
                ...submissionData,
                price: undefined,
                registrationLink: hasRegistration && registrationMethod === 'link' ? formData.registrationLink : '',
                enableRegistrationForm: hasRegistration && registrationMethod === 'form',
                registrationFields: hasRegistration && registrationMethod === 'form' ? formData.registrationFields : '',
                ticketOptions: formData.ticketOptions,
                culturalPaymentMethod: hasRegistration ? formData.culturalPaymentMethod : '',
                culturalPaymentLink: hasRegistration && formData.culturalPaymentMethod === 'link' ? formData.culturalPaymentLink : '',
                culturalPaymentQRCode: hasRegistration && formData.culturalPaymentMethod === 'qr' ? paymentQRPreview : '',
                availableDates: formData.availableDates,
                paymentMethod: undefined,
                paymentLink: undefined,
                paymentQRCode: undefined,
                enablePaymentScreenshot: hasRegistration && formData.culturalPaymentMethod === 'qr' ? formData.enablePaymentScreenshot : false,
            };
        } else {
            submissionData = {
                ...submissionData,
                location: undefined,
                eventStartDate: undefined,
                eventEndDate: undefined,
                duration: undefined,
                price: undefined,
                language: undefined,
                registrationLink: undefined,
                registrationOpen: undefined,
                enableRegistrationForm: undefined,
                registrationFields: undefined,
                paymentMethod: undefined,
                paymentLink: undefined,
                paymentQRCode: undefined,
                ticketOptions: undefined,
                culturalPaymentMethod: undefined,
                culturalPaymentLink: undefined,
                culturalPaymentQRCode: undefined,
                availableDates: undefined,
                enablePaymentScreenshot: undefined,
            };
        }

        try {
            await onSubmit(submissionData);
            onClose();
            const postTypeLabel = submissionData.type === 'confession' ? 'Consights' : (submissionData.type === 'event' ? 'Event' : 'Cultural Event');
            const successMessage = submissionData.status === 'pending'
                ? `Your new ${postTypeLabel} "${submissionData.title}" has been submitted for admin approval.`
                : `Your new ${postTypeLabel} "${submissionData.title}" has been posted successfully!`;
            onShowSuccessAlert(successMessage);
        } catch (error) {
            console.error('Error submitting post:', error);
            setUploadAlertMessage(`Error submitting post: ${error.message || 'Unknown error.'}`);
            setShowUploadAlert(true);
        }
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        e.target.value = null;

        if (!files.length) return;

        const availableSlots = 4 - imagePreviews.length;
        if (availableSlots <= 0) {
            setUploadAlertMessage("You can only add up to 4 images per post.");
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
    
    const handleImageError = (e) => {
        e.target.src = "https://placehold.co/400x200/cccccc/000000?text=Image+Load+Error";
        e.target.onerror = null;
    };

    if (!isOpen) return null;

    return (
        <ErrorBoundary>
            <div className="modal-overlay">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title">
                            {postToEdit ? 'Edit Post' : `Add New ${formData.type === 'confession' ? 'Consights' : formData.type === 'event' ? 'Event' : 'Cultural Event'}`}
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
                                    <option value="confession">Consights</option>
                                    <option value="event">Event</option>
                                    <option value="culturalEvent">Cultural Event</option>
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

                            {(formData.type === 'event' || formData.type === 'culturalEvent') && (
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
                                        <label className="form-label">Duration</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.duration}
                                            onChange={handleFormChange}
                                            name="duration"
                                            placeholder="e.g., 2 hours, All Day"
                                            required
                                        />
                                    </div>

                                    {(formData.type === 'event' || formData.type === 'culturalEvent') && (
                                        <div className="form-group">
                                            <label className="form-label">Registration Required?</label>
                                            <div className="registration-toggle-group">
                                                <button
                                                    type="button"
                                                    className={`btn-toggle-option ${!hasRegistration ? 'active' : ''}`}
                                                    onClick={() => setHasRegistration(false)}
                                                >
                                                    No
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`btn-toggle-option ${hasRegistration ? 'active' : ''}`}
                                                    onClick={() => setHasRegistration(true)}
                                                >
                                                    Yes
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {hasRegistration && (
                                        <>
                                            <div className="form-group">
                                                <label className="form-label">Registration Method</label>
                                                <div className="registration-method-options">
                                                    <label className="radio-option">
                                                        <input
                                                            type="radio"
                                                            name="registrationMethod"
                                                            value="link"
                                                            checked={registrationMethod === 'link'}
                                                            onChange={() => handleRegistrationMethodChange('link')}
                                                        />
                                                        <span>External Link</span>
                                                    </label>
                                                    <label className="radio-option">
                                                        <input
                                                            type="radio"
                                                            name="registrationMethod"
                                                            value="form"
                                                            checked={registrationMethod === 'form'}
                                                            onChange={() => handleRegistrationMethodChange('form')}
                                                        />
                                                        <span>In-App Form</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {registrationMethod === 'link' && (
                                                <div className="form-group">
                                                    <label className="form-label">Registration Link</label>
                                                    <input
                                                        type="url"
                                                        className="form-input"
                                                        value={formData.registrationLink}
                                                        onChange={handleFormChange}
                                                        name="registrationLink"
                                                        placeholder="https://example.com/register"
                                                        required
                                                    />
                                                </div>
                                            )}

                                            {registrationMethod === 'form' && (
                                                <>
                                                    <div className="form-group">
                                                        <label className="form-label">Custom Registration Fields (comma-separated)</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={formData.registrationFields}
                                                            onChange={handleFormChange}
                                                            name="registrationFields"
                                                            placeholder="e.g., Roll Number, Branch:CSE|IT|ECE|Mech|Civil"
                                                            required
                                                        />
                                                    </div>

                                                    {formData.type === 'event' && (
                                                        <>
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

                                                            {formData.price > 0 && (
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
                                                                                        <button type="button" className="remove-image-btn" onClick={removeQRImage}>
                                                                                            <X size={14} />
                                                                                        </button>
                                                                                    </div>
                                                                                ) : (
                                                                                    <>
                                                                                        <label htmlFor="qr-file-input" className="upload-btn-wrapper">
                                                                                            <div className="upload-btn">
                                                                                                <ImageIcon size={16} />
                                                                                                <span>Upload QR Code</span>
                                                                                            </div>
                                                                                        </label>
                                                                                        <input
                                                                                            id="qr-file-input"
                                                                                            ref={qrFileInputRef}
                                                                                            type="file"
                                                                                            accept="image/*"
                                                                                            onChange={handlePaymentQRUpload}
                                                                                            style={{ display: 'none' }}
                                                                                        />
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {formData.type === 'culturalEvent' && (
                                                        <div className="cultural-event-section">
                                                            <div className="form-group">
                                                                <label className="form-label">Available Dates</label>
                                                                {formData.availableDates.map((date, index) => (
                                                                    <div key={index} className="date-input-row">
                                                                        <input
                                                                            type="date"
                                                                            className="form-input"
                                                                            value={date ? date.split('T')[0] : ''}
                                                                            onChange={(e) => handleDateChange(index, e)}
                                                                            required
                                                                        />
                                                                        <button type="button" onClick={() => removeDateInput(index)}>
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button type="button" className="btn-secondary add-date-option" onClick={addDateInput}>
                                                                    Add Date
                                                                </button>
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="form-label">Ticket Options</label>
                                                                {formData.ticketOptions.map((option, index) => (
                                                                    <div key={index} className="ticket-option-row">
                                                                        <input
                                                                            type="text"
                                                                            name="ticketType"
                                                                            placeholder="e.g., Adult Ticket"
                                                                            value={option.ticketType}
                                                                            onChange={(e) => handleTicketOptionChange(index, e)}
                                                                            required
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            name="ticketPrice"
                                                                            placeholder="Price (₹)"
                                                                            value={option.ticketPrice}
                                                                            onChange={(e) => handleTicketOptionChange(index, e)}
                                                                            min="0"
                                                                            required
                                                                        />
                                                                        <button type="button" onClick={() => removeTicketOption(index)}>
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                                <button type="button" className="btn-secondary add-ticket-option" onClick={addTicketOption}>
                                                                    Add Ticket Option
                                                                </button>
                                                            </div>
                                                            {formData.ticketOptions.reduce((sum, opt) => sum + opt.ticketPrice, 0) > 0 && (
                                                                <div className="form-group">
                                                                    <label className="form-label">Payment Method</label>
                                                                    <select
                                                                        className="form-select"
                                                                        value={formData.culturalPaymentMethod}
                                                                        onChange={handleFormChange}
                                                                        name="culturalPaymentMethod"
                                                                    >
                                                                        <option value="link">Payment Link</option>
                                                                        <option value="qr">QR Code</option>
                                                                    </select>
                                                                    {formData.culturalPaymentMethod === 'link' && (
                                                                        <div className="form-group">
                                                                            <label className="form-label">Payment Link</label>
                                                                            <input
                                                                                type="url"
                                                                                className="form-input"
                                                                                value={formData.culturalPaymentLink}
                                                                                onChange={handleFormChange}
                                                                                name="culturalPaymentLink"
                                                                                placeholder="https://example.com/payment"
                                                                                required
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    {formData.culturalPaymentMethod === 'qr' && (
                                                                        <>
                                                                            <div className="form-group">
                                                                                <label className="form-label">QR Code Image</label>
                                                                                <div className="image-upload-container">
                                                                                    {paymentQRPreview ? (
                                                                                        <div className="payment-qr-preview">
                                                                                            <img src={paymentQRPreview} alt="Payment QR" loading="lazy" decoding="async" />
                                                                                            <button type="button" className="remove-image-btn" onClick={removeQRImage}>
                                                                                                <X size={14} />
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <label htmlFor="qr-file-input" className="upload-btn-wrapper">
                                                                                                <div className="upload-btn">
                                                                                                    <ImageIcon size={16} />
                                                                                                    <span>Upload QR Code</span>
                                                                                                </div>
                                                                                            </label>
                                                                                            <input
                                                                                                id="qr-file-input"
                                                                                                ref={qrFileInputRef}
                                                                                                type="file"
                                                                                                accept="image/*"
                                                                                                onChange={handlePaymentQRUpload}
                                                                                                style={{ display: 'none' }}
                                                                                            />
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {/* Toggle for payment screenshot upload */}
                                                                            <div className="form-group">
                                                                                <label className="form-label">Enable Payment Screenshot Upload?</label>
                                                                                <label className="toggle-switch">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        name="enablePaymentScreenshot"
                                                                                        checked={formData.enablePaymentScreenshot}
                                                                                        onChange={handleFormChange}
                                                                                    />
                                                                                    <span className="slider round"></span>
                                                                                </label>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">Images (Max 5)</label>
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
                                        <div className={`image-upload-preview ${imagePreviews.length === 1 ? 'single' : imagePreviews.length === 2 ? 'double' : imagePreviews.length === 3 ? 'triple' : 'quad'}`}>
                                            {imagePreviews.map((preview, index) => (
                                                <div key={index} className="image-preview-item">
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="post-image"
                                                        onError={handleImageError}
                                                        loading="lazy"
                                                        decoding="async"
                                                    />
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
                title="Input Error"
                message={uploadAlertMessage}
                showConfirm={false}
            />
        </ErrorBoundary>
    );
};

const EventDetailPage = ({ event, onClose, isLoggedIn, onRequireLogin, onAddToCalendar, onRegister, isRegistered, onShowCalendarAlert }) => {
    const [showFullContent, setShowFullContent] = useState(false);
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [showCulturalEventRegistration, setShowCulturalEventRegistration] = useState(false);
    const [showGeolocationAlert, setShowGeolocationAlert] = useState(false);
    const [geolocationError, setGeolocationError] = useState('');

    const hasMoreContent = event.content.length > 200;
    const displayContent = showFullContent ? event.content : event.content.substring(0, 200) + (hasMoreContent ? '...' : '');
    const isEventPast = event.eventStartDate && new Date(event.eventStartDate) < new Date();
    const isRegistrationOpen = event.registrationOpen;
    const hasRegistrationMethod = event.enableRegistrationForm || event.registrationLink;

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
                    `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`,
                    '_blank'
                );
            }, (error) => {
                setGeolocationError('Could not get your location. Please enable location services and try again.');
                setShowGeolocationAlert(true);
            });
        } else {
            setGeolocationError('Geolocation is not supported by your browser.');
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

        if (event.type === 'culturalEvent' && event.enableRegistrationForm) {
            setShowCulturalEventRegistration(true);
        } else if (event.enableRegistrationForm) {
            setShowRegistrationForm(true);
        } else if (event.registrationLink) {
            window.open(event.registrationLink, '_blank');
        }
    };

    const handleAddToCalendarClick = () => {
        console.log("Button clicked. Attempting to add event:", event);
        if (!isLoggedIn) {
            console.log("User not logged in, requiring login.");
            onRequireLogin();
            return;
        }
        if (!event || !event.eventStartDate) {
            console.log("Event data is incomplete. Not adding to calendar.");
            return;
        }

        if (event.eventStartDate) {
            onAddToCalendar(event);
            onShowCalendarAlert();
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
                        <div className="event-detail-action-buttons-top">
                            {event.eventStartDate && (
                                <button className="action-btn" onClick={handleAddToCalendarClick}>
                                    <CalendarPlus size={20} />
                                    <span>Add to Calendar</span>
                                </button>
                            )}
                        </div>
                        {event.source && (
                            <p className="event-source-small">
                                Source: {event.source}
                            </p>
                        )}
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
                        <p style={{ whiteSpace: 'pre-wrap' }}>
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
                        isRegistered={isRegistered}
                    />
                )}
                {showCulturalEventRegistration && (
                    <CulturalEventRegistrationModal
                        isOpen={showCulturalEventRegistration}
                        onClose={() => setShowCulturalEventRegistration(false)}
                        event={event}
                        isLoggedIn={isLoggedIn}
                        onRequireLogin={onRequireLogin}
                        onRegister={onRegister}
                        isRegistered={isRegistered}
                    />
                )}
                <CustomMessageModal
                    isOpen={showGeolocationAlert}
                    onClose={() => setShowGeolocationAlert(false)}
                    title="Geolocation Error"
                    message={geolocationError}
                    showConfirm={false}
                />
            </div>
        </ErrorBoundary>
    );
};

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

const PostCard = ({ post, onLike, onShare, onAddComment, likedPosts, isCommentsOpen, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser, registrationCount, onReportPost, onDeletePost, onEditPost, isProfileView, onShowCalendarAlert, isLoggedIn, onExportData, onShowRegistrationModal, isRegistered, onRequireLogin }) => {
    const overlayRef = useRef(null);
    const [showFullContent, setShowFullContent] = useState(false);
    const contentRef = useRef(null);
    const [needsShowMore, setNeedsShowMore] = useState(false);
    const [showShareAlert, setShowShareAlert] = useState(false);
    
    const handleImageError = (e) => {
        e.target.src = "https://placehold.co/400x200/cccccc/000000?text=Image+Load+Error";
        e.target.onerror = null;
    };

    const contentToDisplay = post.content || '';
    const truncatedContent = contentToDisplay.length > 200 ? contentToDisplay.substring(0, 200) + '...' : contentToDisplay;

    useEffect(() => {
        if (contentRef.current && post.content) {
            const isOverflowing = contentRef.current.scrollHeight > contentRef.current.clientHeight;
            setNeedsShowMore(isOverflowing || post.content.length > 200);
        }
    }, [post.content]);

    const getPostTypeLabel = (type) => {
        switch (type) {
            case 'confession': return 'Consights';
            case 'event': return 'Event';
            case 'news': return 'News';
            case 'culturalEvent': return 'Cultural Event';
            default: return 'Post';
        }
    };

    const isInteractive = post.type !== 'news';
    const isUserPost = currentUser && post.userId === currentUser._id;
    const isLiked = likedPosts?.has(post._id);
    const isEventPast = post.eventStartDate && new Date(post.eventStartDate) < new Date();
    const isRegistrationOpen = post.registrationOpen;
    const hasRegistrationMethod = post.enableRegistrationForm || post.registrationLink;

    const handleCommentIconClick = (e) => {
        e.stopPropagation();
        if (isLoggedIn) {
            setOpenCommentPostId(isCommentsOpen ? null : post._id);
        } else {
            onRequireLogin();
        }
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
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isCommentsOpen, setOpenCommentPostId]);

    const handleAddToCalendarClick = () => {
        console.log("Button clicked. Attempting to add event:", post);
        if (!isLoggedIn) {
            console.log("User not logged in, requiring login.");
            onRequireLogin();
            return;
        }
        if (!post || !post.eventStartDate) {
            console.log("Event data is incomplete. Not adding to calendar.");
            return;
        }

        if (post.eventStartDate) {
            onAddToCalendar(post);
            onShowCalendarAlert();
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
                try {
                    const tempInput = document.createElement('textarea');
                    tempInput.value = shareUrl;
                    document.body.appendChild(tempInput);
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    setShowShareAlert(true);
                } catch (err) {
                    console.error('Copy to clipboard failed:', err);
                    setShowShareAlert(true);
                }
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
    
    const registrationButtonText = () => {
        if (isRegistered) return "REGISTERED";
        if (isEventPast) return "EVENT ENDED";
        if (!isRegistrationOpen) return "REGISTRATION CLOSED";
        if (!hasRegistrationMethod) return "NO REGISTRATION REQUIRED";
        return "REGISTER NOW";
    };

    const isButtonDisabled = isRegistered || isEventPast || !isRegistrationOpen || !hasRegistrationMethod;

    const renderPostCardContent = () => (
        <>
            <div className="post-header">
                <div className="post-avatar-container">
                    <img
                        src={isUserPost ? currentUser.avatar : post.authorAvatar || placeholderAvatar}
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
                    {(post.type === 'event' || post.type === 'culturalEvent') && post.status === 'pending' && currentUser?.isAdmin && (
                        <span className="post-status-badge pending">Pending</span>
                    )}
                    <PostOptions
                        post={post}
                        onDelete={onDeletePost}
                        onEdit={onEditPost}
                        isProfilePage={isProfileView}
                        currentUser={currentUser}
                        onReport={onReportPost}
                    />
                </div>
            </div>

            <div className="post-content">
                <h2 className="post-title">{post.title}</h2>
                <div className="post-text-container">
                    <p
                        ref={contentRef}
                        className={`post-text ${showFullContent ? 'expanded' : ''}`}
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
                        {showFullContent ? contentToDisplay : truncatedContent}
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

                {post.images && post.images.length > 0 && (
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
                        <>
                            <div className="event-action-buttons-top">
                                <button className="action-btn" onClick={() => onOpenEventDetail(post)}>
                                    <Info size={20} />
                                    <span>Details</span>
                                </button>
                                <button className="action-btn" onClick={handleAddToCalendarClick}>
                                    <CalendarPlus size={20} />
                                    <span>Add to Calendar</span>
                                </button>
                                <button
                                    className={`action-btn registration-inline-btn ${isButtonDisabled ? 'disabled' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); onOpenEventDetail(post); }}
                                    disabled={isButtonDisabled}
                                >
                                    <Ticket size={20} />
                                    <span>{registrationButtonText()}</span>
                                </button>
                            </div>
                            {post.source && (
                                <p className="event-source-display">
                                    Source: {post.source}
                                </p>
                            )}
                        </>
                    )}
                    {post.type === 'culturalEvent' && (
                        <div className="cultural-event-details">
                            <ul className="ticket-options-list">
                                {post.ticketOptions.map((option, index) => (
                                    <li key={index} className="ticket-option-item">
                                        <Ticket size={16} />
                                        <span>{option.ticketType}: ₹{option.ticketPrice}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                className={`action-btn btn-primary ${isButtonDisabled ? 'disabled' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isLoggedIn) {
                                        onRequireLogin();
                                        return;
                                    }
                                    onShowRegistrationModal(post);
                                }}
                                disabled={isButtonDisabled}
                            >
                                <Ticket size={18} /> {registrationButtonText()}
                            </button>
                        </div>
                    )}

                    <div className="post-actions">
                        <button className={`action-btn ${isLiked ? 'liked' : ''}`} onClick={(e) => { e.stopPropagation(); onLike(post._id); }}>
                            <Heart size={20} fill={isLiked ? '#ef4444' : 'none'} stroke={isLiked ? '#ef4444' : '#9ca3af'} />
                            <span>{post.likes}</span>
                        </button>
                        <button className="action-btn" onClick={handleCommentIconClick}>
                            <MessageIcon size={20} />
                            <span>{post.commentData ? post.commentData.length : 0}</span>
                        </button>
                        {isUserPost && isProfileView && (
                            <div className="post-stat">
                                <Ticket size={20} />
                                <span>{registrationCount || 0}</span>
                            </div>
                        )}
                        {isUserPost && isProfileView && (post.type === 'event' || post.type === 'culturalEvent') && (
                            <button
                                className="action-btn export-data-btn"
                                onClick={(e) => { e.stopPropagation(); onExportData(post._id, post.title); }}
                            >
                                <ArrowDownToLine size={20} />
                                <span className="export-text">Export Data</span>
                            </button>
                        )}
                        <button className="action-btn share-only-icon" onClick={(e) => { e.stopPropagation(); handleShare(post._id, post.title, post.content); }}>
                            <Share2 size={20} />
                            <span className="share-text">Share</span>
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

const HomeComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser, registrations, onReportPost, onDeletePost, onEditPost, onShowCalendarAlert, onExportData, onShowRegistrationModal, myRegisteredEvents, onRequireLogin }) => {
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
                                registrations={registrations}
                                onReportPost={onReportPost}
                                onDeletePost={onDeletePost}
                                onEditPost={onEditPost}
                                onShowCalendarAlert={onShowCalendarAlert}
                                isLoggedIn={!!currentUser}
                                onExportData={onExportData}
                                onShowRegistrationModal={onShowRegistrationModal}
                                isRegistered={myRegisteredEvents.has(post._id)}
                                onRequireLogin={onRequireLogin}
                            />
                        ))}
                    </div>
                    <hr className="section-divider" />
                </>
            )}

            <div className="posts-container">
                {posts.filter(p => p.type !== 'news' && p.type !== 'culturalEvent').map(post => (
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
                        isRegistered={myRegisteredEvents.has(post._id)}
                        isProfileView={false}
                        registrationCount={registrations[post._id]}
                        onReportPost={onReportPost}
                        onDeletePost={onDeletePost}
                        onEditPost={onEditPost}
                        onShowCalendarAlert={onShowCalendarAlert}
                        isLoggedIn={!!currentUser}
                        onExportData={onExportData}
                        onShowRegistrationModal={onShowRegistrationModal}
                        onRequireLogin={onRequireLogin}
                    />
                ))}
            </div>
        </div>
    );
};

const EventsComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser, registrations, onReportPost, onDeletePost, onEditPost, onShowCalendarAlert, onExportData, myRegisteredEvents, onRequireLogin }) => {
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
                        isRegistered={myRegisteredEvents.has(post._id)}
                        isProfileView={false}
                        registrationCount={registrations[post._id]}
                        onReportPost={onReportPost}
                        onDeletePost={onDeletePost}
                        onEditPost={onEditPost}
                        onShowCalendarAlert={onShowCalendarAlert}
                        isLoggedIn={!!currentUser}
                        onExportData={onExportData}
                        onRequireLogin={onRequireLogin}
                    />
                ))}
            </div>
        </div>
    );
};

const ConfessionsComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser, registrations, onReportPost, onDeletePost, onEditPost, onShowCalendarAlert, onExportData, onRequireLogin }) => {
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
                        isRegistered={false} // Confessions don't have registrations
                        isProfileView={false}
                        registrationCount={registrations[post._id]}
                        onReportPost={onReportPost}
                        onDeletePost={onDeletePost}
                        onEditPost={onEditPost}
                        onShowCalendarAlert={onShowCalendarAlert}
                        isLoggedIn={!!currentUser}
                        onExportData={onExportData}
                        onRequireLogin={onRequireLogin}
                    />
                ))}
            </div>
        </div>
    );
};

const CulturalEventsComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, currentUser, onReportPost, onDeletePost, onEditPost, onShowCalendarAlert, onExportData, onShowRegistrationModal, myRegisteredEvents, onRequireLogin }) => {
    const culturalEventPosts = posts.filter(post => post.type === 'culturalEvent');

    return (
        <div>
            <div className="posts-container">
                {culturalEventPosts.length > 0 ? (
                    culturalEventPosts.map(post => (
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
                            onShowRegistrationModal={onShowRegistrationModal}
                            isRegistered={myRegisteredEvents.has(post._id)}
                            isProfileView={false}
                            onReportPost={onReportPost}
                            onDeletePost={onDeletePost}
                            onEditPost={onEditPost}
                            onShowCalendarAlert={onShowCalendarAlert}
                            isLoggedIn={!!currentUser}
                            onExportData={onExportData}
                            onRequireLogin={onRequireLogin}
                        />
                    ))
                ) : (
                    <div className="placeholder-card">
                        <p className="placeholder-text">No cultural events found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const NotificationsComponent = ({ notifications, adminNotifications, pendingEvents, currentUser, onDeleteReportedPost, onApproveEvent, onRejectEvent }) => {
    const isAdmin = currentUser?.isAdmin;
    const displayNotifications = isAdmin ? adminNotifications : notifications;

    return (
        <div>
            <h2 className="page-title">{isAdmin ? 'Admin Panel: Reported Posts & Approvals' : 'Notifications'}</h2>
            <div className="notifications-container">
                {isAdmin && (
                    <div className="admin-pending-section">
                        <h3 className="admin-section-title">Pending Events ({pendingEvents.length})</h3>
                        {pendingEvents.length > 0 ? (
                            <div className="pending-events-list">
                                {pendingEvents.map(event => (
                                    <div key={event._id} className="pending-event-item">
                                        <div className="pending-event-info">
                                            <h4>{event.title}</h4>
                                            <p>{event.content.substring(0, 100)}...</p>
                                        </div>
                                        <div className="pending-event-actions">
                                            <button className="btn-approve" onClick={() => onApproveEvent(event._id)}>
                                                <Check size={16} /> Approve
                                            </button>
                                            <button className="btn-reject" onClick={() => onRejectEvent(event._id)}>
                                                <X size={16} /> Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="placeholder-card">
                                <p className="placeholder-text">No events awaiting approval.</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="admin-reported-section">
                    <h3 className="admin-section-title">{isAdmin ? 'Reported Posts' : 'Notifications'} ({displayNotifications.length})</h3>
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
        </div>
    );
};

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
            if (file.size > 2 * 1024 * 1024) {
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
                    <button
                        className="modal-close-large"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={36} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="modal-body profile-settings-body">
                    <div className="current-avatar-container">
                        <h4 className="modal-subtitle">Current Profile Image</h4>
                        <div className="current-avatar-preview">
                            <img src={currentUser.avatar || placeholderAvatar} alt="Current Avatar" loading="lazy" decoding="async" />
                        </div>
                    </div>
                    <div className="avatar-options-container">
                        <h4 className="modal-subtitle">Choose a new avatar</h4>
                        <div className="predefined-avatars-grid">
                            {predefinedAvatars.map((av, index) => (
                                <div
                                    key={index}
                                    className={`avatar-option selected ${selectedAvatar === av.src ? 'selected' : ''}`}
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
                                        <button
                                            className="remove-image-btn-large"
                                            onClick={() => setCustomAvatar('')}
                                            aria-label="Remove image"
                                        >
                                            <X size={20} strokeWidth={2.5} />
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

const UsersComponent = ({ posts, currentUser, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail, onAddToCalendar, setIsModalOpen, onDeletePost, onEditPost, registrations, onReportPost, onEditProfile, onShowCalendarAlert, onExportData, onShowRegistrationModal, myRegisteredEvents, onRequireLogin }) => {
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
            return post.type === 'event' || post.type === 'culturalEvent' ? sum + (registrations[post._id] || 0) : sum;
        }, 0)
    };

    const handleDeletePost = (postId) => {
        onDeletePost(postId);
    };

    const handleEditPost = (post) => {
        onEditPost(post);
    };

    return (
        <div>
            <h2 className="page-title">Your Profile</h2>

            <div className="profile-header">
                <div className="profile-avatar-container">
                    <img src={currentUser.avatar || placeholderAvatar} alt={`${currentUser.name}'s avatar`} className="profile-avatar-img" loading="lazy" decoding="async" />
                    <button className="edit-avatar-btn" onClick={onEditProfile}>
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
                            isProfileView={true}
                            onDeletePost={handleDeletePost}
                            onEditPost={handleEditPost}
                            registrationCount={registrations[post._id]}
                            onReportPost={onReportPost}
                            onShowCalendarAlert={onShowCalendarAlert}
                            onShowRegistrationModal={onShowRegistrationModal}
                            isRegistered={myRegisteredEvents.has(post._id)}
                            isLoggedIn={!!currentUser}
                            onExportData={onExportData}
                            onRequireLogin={onRequireLogin}
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
                                <span className="popular-stat">{post.commentData ? post.commentData.length : 0} comments</span>
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

    const allEvents = [...posts.filter(p => p.type === 'event'), ...myCalendarEvents];

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const hasEvent = allEvents.some(post =>
                post.eventStartDate &&
                new Date(post.eventStartDate).toDateString() === date.toDateString()
            );
            return hasEvent ? <div className="event-dot"></div> : null;
        }
        return null;
    };

    const upcomingCalendarEvents = myCalendarEvents;

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
                                        {event.eventStartDate ? new Date(event.eventStartDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric'
                                        }) : 'N/A'}
                                    </div>
                                    <div className="sidebar-event-time">
                                        {event.eventStartDate ? new Date(event.eventStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
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

const ConfessionsRightSidebar = ({ posts, onOpenPostDetail }) => {
    const recentConfessions = [...posts]
        .filter(post => post.type === 'confession')
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 3);
    return (
        <div className="sidebar-widget">
            <div className="widget-header">
                <h3 className="widget-title">Recent Consights</h3>
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

const UsersRightSidebar = ({ currentUser, posts, registrations }) => {
    if (!currentUser) return null;

    const userPosts = posts.filter(post => post.userId === currentUser._id);

    const userStats = {
        posts: userPosts.length,
        likesReceived: userPosts.reduce((sum, post) => sum + post.likes, 0),
        commentsReceived: userPosts.reduce((sum, post) => sum + (post.commentData ? post.commentData.length : 0), 0),
        registrationsReceived: userPosts.reduce((sum, post) => {
            return post.type === 'event' || post.type === 'culturalEvent' ? sum + (registrations[post._id] || 0) : sum;
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

const LoginModal = ({ isOpen, onClose, onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIsRegistering(false);
            setError('');
            setFormData({ name: '', email: '', password: '' });
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
        window.location.href = `${API_URL}/auth/google`;
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
                                    <path d="M19.999 10.231C19.999 9.596 19.946 8.948 19.825 8.324H10.204V11.845H15.912C15.659 13.111 14.937 14.17 13.923 14.861L13.945 15.006L17.151 17.478L17.34 17.495C19.231 15.823 20.315 13.256 19.999 10.231Z" fill="#4285F4" />
                                    <path d="M10.204 19.999C12.879 19.999 15.111 19.124 16.711 17.581L13.923 14.861C13.175 15.367 12.277 15.696 11.294 15.801C10.292 16.036 9.387 16.04 8.441 15.834C6.551 15.541 4.975 14.341 4.417 12.639L4.296 12.648L1.085 15.119L0.985 15.15C2.697 18.397 6.223 19.999 10.204 19.999Z" fill="#34A853" />
                                    <path d="M4.417 12.639C4.161 11.996 4.025 11.314 4.025 10.64C4.025 9.966 4.161 9.284 4.417 8.641L4.407 8.496L1.161 6.096L0.985 6.183C0.354 7.424 0 8.989 0 10.64C0 12.291 0.354 13.856 0.985 15.097L4.417 12.639Z" fill="#FBBC04" />
                                    <path d="M10.204 4.01C11.642 4.01 12.870 4.545 13.864 5.485L16.762 2.607C15.105 1.011 12.859 0 10.204 0C6.223 0 2.697 1.602 0.985 4.849L4.409 7.317L4.417 7.323C4.975 5.621 6.551 4.421 8.441 4.128C9.387 3.922 10.292 3.926 11.294 4.161C11.332 4.084 11.371 4.01 11.41 3.937L10.204 4.01Z" fill="#EA4335" />
                                </g>
                                <defs>
                                    <clipPath id="clip0_353_57">
                                        <rect width="20" height="20" fill="white" />
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
                                        placeholder="eg: John Doe"
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
        </ErrorBoundary>
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
                <div className="avatar-wrapper">
                    <img src={user.avatar || placeholderAvatar} alt={`${user.name}'s avatar`} className="avatar-img" loading="lazy" decoding="async" />
                </div>
            </button>

            {isOpen && (
                <div className="profile-dropdown-menu">
                    <div className="profile-info">
                        <div className="profile-avatar">
                            <img src={user.avatar || placeholderAvatar} alt={`${user.name}'s avatar`} className="avatar-img" loading="lazy" decoding="async" />
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

const CalendarModal = ({ isOpen, onClose, myCalendarEvents, onOpenEventDetail }) => {
    const [value, onChange] = useState(new Date());

    if (!isOpen) return null;

    const eventsOnSelectedDate = myCalendarEvents.filter(event =>
        event.eventStartDate && new Date(event.eventStartDate).toDateString() === value.toDateString()
    );

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const hasEvent = myCalendarEvents.some(event =>
                event.eventStartDate && new Date(event.eventStartDate).toDateString() === date.toDateString()
            );
            return hasEvent ? <div className="event-dot"></div> : null;
        }
        return null;
    };

    return (
        <div className="modal-overlay calendar-modal-overlay">
            <div className="modal-content calendar-modal-content">
                <div className="modal-header">
                    <h2 className="modal-title">My Calendar</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="modal-body">
                    <Calendar
                        onChange={onChange}
                        value={value}
                        tileContent={tileContent}
                        className="react-calendar"
                        prev2Label={null}
                        next2Label={null}
                        locale="en-US"
                    />
                    <div className="events-for-date">
                        <h3>Events on {value.toLocaleDateString()}</h3>
                        {eventsOnSelectedDate.length > 0 ? (
                            <ul className="event-list">
                                {eventsOnSelectedDate.map(event => (
                                    <li
                                        key={event._id}
                                        className="event-item clickable"
                                        onClick={() => {
                                            onOpenEventDetail(event);
                                            onClose();
                                        }}
                                    >
                                        <div className="event-info">
                                            <strong>{event.title}</strong>
                                            <small>{event.eventStartDate ? new Date(event.eventStartDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</small>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="no-events-message">No events planned for this day.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [activeSection, setActiveSection] = useState('home');
    const [posts, setPosts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [currentUser, setCurrentUser] = useState(() => {
        const savedUser = JSON.parse(localStorage.getItem('currentUser'));
        return savedUser || null;
    });
    const [isLoggedIn, setIsLoggedIn] = useState(!!currentUser);

    const [likedPosts, setLikedPosts] = useState(() => {
        const savedLikes = localStorage.getItem('likedPosts');
        return savedLikes ? new Set(JSON.parse(savedLikes)) : new Set();
    });

    const [openCommentPostId, setOpenCommentPostId] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [myCalendarEvents, setMyCalendarEvents] = useState(() => {
        const savedEvents = localStorage.getItem('myCalendarEvents');
        if (savedEvents) {
            return JSON.parse(savedEvents).map(event => ({
                ...event,
                eventStartDate: event.eventStartDate ? new Date(event.eventStartDate) : null,
                eventEndDate: event.eventEndDate ? new Date(event.eventEndDate) : null,
                timestamp: new Date(event.timestamp)
            }));
        }
        return [];
    });
    const [myRegisteredEvents, setMyRegisteredEvents] = useState(new Set());
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [showAddedToCalendarAlert, setShowAddedToCalendarAlert] = useState(false);

    // State for the post submission success popup
    const [showPostSuccessAlert, setShowPostSuccessAlert] = useState(false);
    const [postSuccessAlertMessage, setPostSuccessAlertMessage] = useState('');

    const [postToEdit, setPostToEdit] = useState(null);
    const [registrations, setRegistrations] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [adminNotifications, setAdminNotifications] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportPostData, setReportPostData] = useState(null);
    const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false);
    const [showCulturalEventRegistration, setShowCulturalEventRegistration] = useState(false);
    const [selectedCulturalEvent, setSelectedCulturalEvent] = useState(null);

    const hasOpenModal = isModalOpen || showLoginModal || showHelpModal || isReportModalOpen || showProfileSettingsModal || showCalendarModal || showAddedToCalendarAlert || showCulturalEventRegistration || showPostSuccessAlert;

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

    const callApi = async (endpoint, options = {}) => {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        if (user && user.token) {
            headers['Authorization'] = `Bearer ${user.token}`;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            console.error('API call failed: Not authorized. Forcing logout.');
            localStorage.removeItem('currentUser');
            window.location.reload();
            return;
        }

        if (!response.ok) {
            let errorMsg = 'An unknown error occurred.';
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
            } catch (e) {
            }
            throw new Error(errorMsg);
        }
        return response;
    };

    useEffect(() => {
        const eventsToSave = myCalendarEvents.map(event => ({
            ...event,
            eventStartDate: event.eventStartDate ? event.eventStartDate.toISOString() : null,
            eventEndDate: event.eventEndDate ? event.eventEndDate.toISOString() : null,
            timestamp: event.timestamp.toISOString(),
        }));
        localStorage.setItem('myCalendarEvents', JSON.stringify(eventsToSave));
    }, [myCalendarEvents]);

    useEffect(() => {
        localStorage.setItem('likedPosts', JSON.stringify(Array.from(likedPosts)));
    }, [likedPosts]);

    const fetchPosts = async () => {
        try {
            const res = await callApi('/posts');
            const data = await res.json();
            const filteredData = data.filter(post => {
                if (post.type === 'event' || post.type === 'culturalEvent') {
                    return post.status === 'approved' || (currentUser?.isAdmin && post.status === 'pending');
                }
                return true;
            });
            setPosts(filteredData.map(formatPostDates));
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        }
    };

    const fetchPendingEvents = async () => {
        if (!currentUser || !currentUser.isAdmin) return;
        try {
            const res = await callApi('/posts/pending-events');
            const data = await res.json();
            setPendingEvents(data.map(formatPostDates));
        } catch (error) {
            console.error('Failed to fetch pending events:', error);
            setPendingEvents([]);
        }
    };

    const fetchRegistrations = async () => {
        if (!currentUser) {
            setRegistrations({});
            return;
        }
        try {
            const res = await callApi('/users/my-events/registration-counts');
            const data = await res.json();
            setRegistrations(data.registrations);
        } catch (error) {
            console.error('Failed to fetch registrations:', error);
            setRegistrations({});
        }
    };

    const fetchMyRegistrations = async (user) => {
        if (!user) {
            setMyRegisteredEvents(new Set());
            return;
        }
        try {
            const res = await callApi('/users/my-events-registrations');
            const data = await res.json();
            setMyRegisteredEvents(new Set(data.registeredEventIds));
        } catch (error) {
            console.error('Error fetching my registrations:', error);
        }
    };

    const fetchNotifications = async () => {
        if (!currentUser) return;
        try {
            const res = await callApi('/notifications');
            const data = await res.json();
            setNotifications(data.map(n => ({ ...n, timestamp: new Date(n.timestamp) })));
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const fetchAdminNotifications = async () => {
        if (!currentUser || !currentUser.isAdmin) return;
        try {
            const reportedRes = await callApi('/users/admin/reported-posts');
            const data = await reportedRes.json();
            setAdminNotifications(data.map(n => ({ ...n, timestamp: new Date(n.timestamp) })));
            await fetchPendingEvents();
        } catch (error) {
            console.error('Failed to fetch admin notifications:', error);
            setAdminNotifications([]);
        }
    };

    const fetchLikedPosts = async (user) => {
        if (!user) {
            console.log("Not logged in, skipping fetchLikedPosts.");
            return;
        }
        try {
            const res = await callApi('/users/liked-posts');
            const data = await res.json();
            setLikedPosts(new Set(data.likedPostIds || []));
        } catch (error) {
            console.error('Error fetching liked posts:', error);
        }
    };

    useEffect(() => {
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
            window.history.replaceState({}, document.title, window.location.pathname);
        } else {
            const savedUser = JSON.parse(localStorage.getItem('currentUser'));
            if (savedUser && savedUser.token) {
                setIsLoggedIn(true);
                setCurrentUser(savedUser);
            }
        }
    }, []);

    useEffect(() => {
        const path = window.location.pathname;
        const postRegex = /^\/posts\/(.*)$/;
        const match = path.match(postRegex);

        if (match && posts.length > 0) {
            const postId = match[1];
            const postToDisplay = posts.find(p => p._id === postId);
            if (postToDisplay) {
                setSelectedPost(postToDisplay);
                setActiveSection('home');
            }
            window.history.replaceState({}, document.title, '/');
        }
    }, [posts]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            await fetchPosts();
            if (isLoggedIn && currentUser) {
                await fetchLikedPosts(currentUser);
                fetchRegistrations();
                fetchNotifications();
                fetchMyRegistrations(currentUser);
                if (currentUser.isAdmin) {
                    fetchAdminNotifications();
                }
            } else {
                setLikedPosts(new Set());
                setMyRegisteredEvents(new Set());
                setRegistrations({});
                setNotifications([]);
                setPendingEvents([]);
            }
        };

        fetchData();

    }, [isLoggedIn, currentUser]);

    useEffect(() => {
        if (hasOpenModal) {
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = '15px';
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [hasOpenModal]);

    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.type === 'event' && post.location?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (post.type === 'culturalEvent' && post.location?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleShowCalendarAlert = () => {
        setShowAddedToCalendarAlert(true);
    };

    const handleShowPostSuccessAlert = (message) => {
        setPostSuccessAlertMessage(message);
        setShowPostSuccessAlert(true);
    };

    const handleAddToCalendar = (event) => {
        console.log("1. Starting 'handleAddToCalendar' function.");
        console.log("Event object received:", event);

        if (!isLoggedIn) {
            console.log("2. User is not logged in. Showing login modal.");
            setShowLoginModal(true);
            return;
        }

        if (!event || !event.eventStartDate) {
            console.log("2. Event data is incomplete. Not adding.");
            return;
        }

        setMyCalendarEvents(prev => {
            console.log("3. Current state before adding:", prev);
            const isDuplicate = prev.some(e => e._id === event._id);
            console.log("3. Checking for duplicates. Is duplicate?", isDuplicate);

            if (isDuplicate) {
                console.log("4. Event is a duplicate. Not adding.");
                setNotifications(notificationPrev => [
                    {
                        _id: `notif-${Date.now()}`,
                        message: `Event "${event.title}" is already in your calendar.`,
                        timestamp: new Date(),
                        type: 'info'
                    },
                    ...notificationPrev
                ]);
                return prev;
            }

            const newState = [...prev, event];
            console.log("4. Event added successfully. New state length:", newState.length, "New state:", newState);

            setNotifications(notificationPrev => [
                {
                    _id: `notif-${Date.now()}`,
                    message: `Event "${event.title}" has been added to your calendar.`,
                    timestamp: new Date(),
                    type: 'success'
                },
                ...notificationPrev
            ]);

            return newState;
        });

        setTimeout(() => {
            console.log("5. Final state in localStorage should contain event:", localStorage.getItem('myCalendarEvents'));
        }, 100);

        handleShowCalendarAlert();
    };

    // Corrected `handleRegisterEvent` function
    const handleRegisterEvent = async (eventId, registrationData) => {
        if (!isLoggedIn || !currentUser) {
            console.error('User not authenticated for registration.');
            throw new Error('User not logged in.');
        }

        const post = posts.find(p => p._id === eventId);
        if (!post) {
            console.error('Post not found for registration.');
            throw new Error('Event not found.');
        }

        if (myRegisteredEvents.has(eventId)) {
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `You are already registered for "${post.title}".`,
                    timestamp: new Date(),
                    type: 'info'
                },
                ...prev
            ]);
            throw new Error(`You are already registered for "${post.title}".`);
        }

        try {
            const res = await callApi(`/users/register-event/${eventId}`, {
                method: 'POST',
                body: JSON.stringify(registrationData),
            });

            if (res.ok) {
                setMyRegisteredEvents(prev => new Set(prev).add(eventId));
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `You are now registered for "${post.title}". See you there!`,
                        timestamp: new Date(),
                        type: 'success'
                    },
                    ...prev
                ]);
                fetchRegistrations();
            } else {
                const errorData = await res.json();
                console.error('Registration failed:', errorData.message);
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Registration for "${post.title}" failed: ${errorData.message || 'Unknown error.'}`,
                        timestamp: new Date(),
                        type: 'error'
                    },
                    ...prev
                ]);
                // CRITICAL FIX: Throw an error to propagate failure to the modal
                throw new Error(errorData.message || 'Registration failed due to server error.');
            }
        } catch (err) {
            console.error('Registration failed:', err);
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Registration for "${post.title}" failed due to network error.`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
            // CRITICAL FIX: Re-throw the error to ensure the modal's catch block is executed.
            throw err;
        }
    };

    const handleAddPost = async (newPost) => {
        if (!isLoggedIn || !currentUser) {
            console.error('User not authenticated for posting.');
            return;
        }

        try {
            const endpoint = postToEdit ? `/posts/${postToEdit._id}` : `/posts`;
            const method = postToEdit ? 'PUT' : 'POST';

            let submissionData = {
                ...newPost,
                userId: currentUser?._id,
                author: currentUser?.name || 'Anonymous',
                authorAvatar: currentUser?.avatar || 'https://placehold.co/40x40/cccccc/000000?text=A',
                status: (newPost.type === 'event' || newPost.type === 'culturalEvent') ? 'pending' : 'approved',
                timestamp: postToEdit ? postToEdit.timestamp : new Date().toISOString(),
            };

            const res = await callApi(endpoint, {
                method,
                body: JSON.stringify(submissionData),
            });

            if (res.ok) {
                const responseData = await res.json();
                const formattedResponsePost = formatPostDates(responseData);
                setPostToEdit(null);
                if (method === 'POST') {
                    if (formattedResponsePost.status === 'pending') {
                        setNotifications(prev => [
                            {
                                _id: Date.now().toString(),
                                message: `Your new ${newPost.type} "${newPost.title}" has been submitted for admin approval.`,
                                timestamp: new Date(),
                                type: 'info'
                            },
                            ...prev
                        ]);
                        if (currentUser.isAdmin) {
                            fetchPendingEvents();
                        }
                    } else {
                        setPosts(prev => [formattedResponsePost, ...prev]);
                        setNotifications(prev => [
                            {
                                _id: Date.now().toString(),
                                message: `Your new ${newPost.type} "${newPost.title}" has been posted successfully!`,
                                timestamp: new Date(),
                                type: 'success'
                            },
                            ...prev
                        ]);
                    }
                    const postTypeLabel = submissionData.type === 'confession' ? 'Consights' : (submissionData.type === 'event' ? 'Event' : 'Cultural Event');
                    const successMessage = submissionData.status === 'pending'
                        ? `Your new ${postTypeLabel} "${submissionData.title}" has been submitted for admin approval.`
                        : `Your new ${postTypeLabel} "${submissionData.title}" has been posted successfully!`;
                    handleShowPostSuccessAlert(successMessage);

                } else {
                    setPosts(prev => prev.map(p => p._id === formattedResponsePost._id ? formattedResponsePost : p));
                    setNotifications(prev => [
                        {
                            _id: Date.now().toString(),
                            message: `Your ${newPost.type} "${newPost.title}" has been updated successfully!`,
                            timestamp: new Date(),
                            type: 'success'
                        },
                        ...prev
                    ]);
                    const postTypeLabel = submissionData.type === 'confession' ? 'Consights' : (submissionData.type === 'event' ? 'Event' : 'Cultural Event');
                    const successMessage = `Your ${postTypeLabel} "${newPost.title}" has been updated successfully!`;
                    handleShowPostSuccessAlert(successMessage);
                }
            } else {
                const errorData = await res.json();
                console.error('Failed to save post:', errorData);
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Failed to save ${newPost.type} "${newPost.title}": ${errorData.message || 'Unknown error.'}`,
                        timestamp: new Date(),
                        type: 'error'
                    },
                    ...prev
                ]);
            }
        } catch (error) {
            console.error('Error saving post:', error);
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Network error: Could not save ${newPost.type} "${newPost.title}".`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
        }
    };


    const handleApproveEvent = async (postId) => {
        if (!currentUser || !currentUser.isAdmin) {
            console.error('Admin not authenticated.');
            return;
        }

        try {
            const res = await callApi(`/posts/approve-event/${postId}`, {
                method: 'PUT',
            });
            if (res.ok) {
                await fetchPosts();
                await fetchPendingEvents();
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Event (ID: ${postId}) has been approved and is now live.`,
                        timestamp: new Date(),
                        type: 'success'
                    },
                    ...prev
                ]);
            } else {
                const errorData = await res.json();
                console.error('Failed to approve event:', errorData);
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Failed to approve event: ${errorData.message || 'Unknown error.'}`,
                        timestamp: new Date(),
                        type: 'error'
                    },
                    ...prev
                ]);
            }
        } catch (error) {
            console.log('Error approving event:', error);
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Network error: Could not approve event.`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
        }
    };

    const handleRejectEvent = async (postId) => {
        if (!currentUser || !currentUser.isAdmin) {
            console.error('Admin not authenticated.');
            return;
        }

        try {
            const res = await callApi(`/posts/reject-event/${postId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await fetchPosts();
                await fetchPendingEvents();
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Event (ID: ${postId}) has been rejected and deleted.`,
                        timestamp: new Date(),
                        type: 'info'
                    },
                    ...prev
                ]);
            } else {
                const errorData = await res.json();
                console.error('Failed to reject event:', errorData);
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Failed to reject event: ${errorData.message || 'Unknown error.'}`,
                        timestamp: new Date(),
                        type: 'error'
                    },
                    ...prev
                ]);
            }
        } catch (error) {
            console.error('Error rejecting event:', error);
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Network error: Could not reject event.`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
        }
    };


    const handleDeletePost = async (postId) => {
        if (!isLoggedIn || !currentUser) {
            console.error('User not authenticated for deleting posts.');
            return;
        }
        try {
            const res = await callApi(`/posts/${postId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
                setMyCalendarEvents(prevEvents => prevEvents.filter(event => event._id !== postId));
                setLikedPosts(prev => {
                    const newLiked = new Set(prev);
                    newLiked.delete(postId);
                    return newLiked;
                });
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Post has been deleted successfully.`,
                        timestamp: new Date(),
                        type: 'success'
                    },
                    ...prev
                ]);
            } else {
                const errorData = await res.json();
                console.error('Failed to delete post:', errorData);
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Failed to delete post: ${errorData.message || 'Unknown error.'}`,
                        timestamp: new Date(),
                        type: 'error'
                    },
                    ...prev
                ]);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Network error: Could not delete post.`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
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
            setSelectedPost(null);
            setSelectedEvent(null);
        }
    };

    const handleLikePost = async (postId) => {
        if (!isLoggedIn || !currentUser) {
            setShowLoginModal(true);
            return;
        }

        const isCurrentlyLiked = likedPosts.has(postId);
        const endpoint = `/posts/${postId}/${isCurrentlyLiked ? 'unlike' : 'like'}`;
        const method = 'PUT';

        setLikedPosts(prev => {
            const newLiked = new Set(prev);
            if (isCurrentlyLiked) {
                newLiked.delete(postId);
            } else {
                newLiked.add(postId);
            }
            return newLiked;
        });

        setPosts(prevPosts =>
            prevPosts.map(post =>
                post._id === postId
                    ? { ...post, likes: isCurrentlyLiked ? post.likes - 1 : post.likes + 1 }
                    : post
            )
        );

        try {
            await callApi(endpoint, {
                method,
            });
        } catch (error) {
            console.error('Failed to like/unlike post:', error);

            setLikedPosts(prev => {
                const newLiked = new Set(prev);
                if (isCurrentlyLiked) {
                    newLiked.add(postId);
                } else {
                    newLiked.delete(postId);
                }
                return newLiked;
            }
            );
            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post._id === postId
                        ? { ...post, likes: isCurrentlyLiked ? post.likes + 1 : post.likes - 1 }
                        : post
                )
            );
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Failed to ${isCurrentlyLiked ? 'unlike' : 'like'} post. Please try again.`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
        }
    };

    const handleAddComment = async (postId, commentText) => {
        if (!isLoggedIn || !currentUser) {
            setShowLoginModal(true);
            return;
        }

        try {
            const res = await callApi(`/posts/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ text: commentText }),
            });
            if (res.ok) {
                const commentData = await res.json();
                setPosts(prevPosts =>
                    prevPosts.map(post =>
                        post._id === postId ? {
                            ...post,
                            commentData: commentData.map(c => ({ ...c, timestamp: new Date(c.timestamp) })),
                            comments: commentData.length
                        } : post
                    )
                );
            } else {
                const errorData = await res.json();
                console.error('Failed to add comment:', errorData);
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Failed to add comment: ${errorData.message || 'Unknown error.'}`,
                        timestamp: new Date(),
                        type: 'error'
                    },
                    ...prev
                ]);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Network error: Could not add comment.`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
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
                try {
                    const tempInput = document.createElement('textarea');
                    tempInput.value = shareUrl;
                    document.body.appendChild(tempInput);
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    setShowShareAlert(true);
                } catch (err) {
                    console.error('Copy to clipboard failed:', err);
                    setShowShareAlert(true);
                }
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

    const handleOpenEventDetail = (event) => {
        setSelectedEvent(event);
        setSelectedPost(null);
        setOpenCommentPostId(null);
    };

    const handleOpenPostDetail = (post) => {
        setSelectedPost(post);
        setSelectedEvent(null);
        setOpenCommentPostId(null);
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
        setLikedPosts(new Set());
        setMyRegisteredEvents(new Set());
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
        if (!currentUser) {
            console.error('User not authenticated for reporting posts.');
            return;
        }
        try {
            const res = await callApi(`/posts/${postId}/report`, {
                method: 'POST',
                body: JSON.stringify({ reason }),
            });
            if (res.ok) {
                if (currentUser.isAdmin) {
                    fetchAdminNotifications();
                }
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Report for post ID ${postId} has been submitted. Thank you for your feedback!`,
                        timestamp: new Date(),
                        type: 'info'
                    },
                    ...prev
                ]);
            } else {
                const errorData = await res.json();
                console.error('Failed to report post:', errorData);
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Failed to report post: ${errorData.message || 'Unknown error.'}`,
                        timestamp: new Date(),
                        type: 'error'
                    },
                    ...prev
                ]);
            }
        } catch (error) {
            console.error('Error reporting post:', error);
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Network error: Could not report post.`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
        }
    };

    const handleDeleteReportedPost = async (postId) => {
        if (!currentUser || !currentUser.isAdmin) {
            console.error('User not authorized to delete reported posts.');
            return;
        }
        try {
            const res = await callApi(`/users/admin/delete-post/${postId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                await fetchPosts();
                await fetchPendingEvents();
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Reported post (ID: ${postId}) has been deleted successfully.`,
                        timestamp: new Date(),
                        type: 'success'
                    },
                    ...prev
                ]);
            } else {
                const errorData = await res.json();
                console.error('Failed to delete reported post:', errorData);
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Failed to delete reported post: ${errorData.message || 'Unknown error.'}`,
                        timestamp: new Date(),
                        type: 'error'
                    },
                    ...prev
                ]);
            }
        } catch (error) {
            console.error('Error deleting reported post:', error);
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Network error: Could not delete reported post.`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
        }
    };

    const handleUpdateAvatar = async (newAvatar) => {
        if (!currentUser) {
            console.error('User not authenticated for updating avatar.');
            return;
        }

        try {
            const res = await callApi(`/users/profile/avatar`, {
                method: 'PUT',
                body: JSON.stringify({ avatar: newAvatar }),
            });

            if (res.ok) {
                const { avatar: updatedAvatar } = await res.json();

                const newCurrentUser = { ...currentUser, avatar: updatedAvatar };

                setCurrentUser(newCurrentUser);
                localStorage.setItem('currentUser', JSON.stringify(newCurrentUser));

                setPosts(prevPosts =>
                    prevPosts.map(post => {
                        const updatedPost = post.userId === newCurrentUser._id
                            ? { ...post, authorAvatar: newCurrentUser.avatar }
                            : post;

                        const updatedComments = updatedPost.commentData.map(comment => {
                            if (comment.authorId === newCurrentUser._id) {
                                return { ...comment, authorAvatar: newCurrentUser.avatar };
                            }
                            return comment;
                        });

                        return { ...updatedPost, commentData: updatedComments };
                    })
                );

                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Your profile image has been updated successfully!`,
                        timestamp: new Date(),
                        type: 'success'
                    },
                    ...prev
                ]);
            } else {
                const errorData = await res.json();
                console.error('Failed to update avatar:', errorData);
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Failed to update profile image: ${errorData.message || 'Unknown error.'}`,
                        timestamp: new Date(),
                        type: 'error'
                    },
                    ...prev
                ]);
            }
        } catch (err) {
            console.error('Error updating avatar:', err);
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Network error: Could not update profile image.`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
        }
        setShowProfileSettingsModal(false);
    };

    const handleExportRegistrations = async (eventId, eventTitle) => {
        if (!currentUser || !currentUser.token) {
            console.error('User not authenticated.');
            setNotifications(prev => [
                { _id: Date.now().toString(), message: `Please log in to export registration data.`, timestamp: new Date(), type: 'error' },
                ...prev
            ]);
            return;
        }

        try {
            const res = await callApi(`/posts/export-registrations/${eventId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `registrations_${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);

                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Registration data for "${eventTitle}" downloaded successfully!`,
                        timestamp: new Date(),
                        type: 'success'
                    },
                    ...prev
                ]);
            } else {
                const errorData = await res.json();
                setNotifications(prev => [
                    {
                        _id: Date.now().toString(),
                        message: `Failed to export data: ${errorData.message || 'Unknown error.'}`,
                        timestamp: new Date(),
                        type: 'error'
                    },
                    ...prev
                ]);
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            setNotifications(prev => [
                {
                    _id: Date.now().toString(),
                    message: `Network error: Could not export registration data.`,
                    timestamp: new Date(),
                    type: 'error'
                },
                ...prev
            ]);
        }
    };

    const postCardProps = {
        onLike: handleLikePost,
        onShare: handleShareClick,
        onAddComment: handleAddComment,
        likedPosts,
        openCommentPostId,
        setOpenCommentPostId,
        onOpenEventDetail: handleOpenEventDetail,
        onAddToCalendar: handleAddToCalendar,
        currentUser,
        registrations,
        onReportPost: handleOpenReportModal,
        onDeletePost: handleDeletePost,
        onEditPost: handleEditPost,
        onShowCalendarAlert: handleShowCalendarAlert,
        isLoggedIn,
        onExportData: handleExportRegistrations,
        onShowRegistrationModal: (event) => {
            if (!isLoggedIn) {
                setShowLoginModal(true);
                return;
            }
            setSelectedCulturalEvent(event);
            setShowCulturalEventRegistration(true);
        },
        myRegisteredEvents,
        onRequireLogin: () => setShowLoginModal(true)
    };

    const menuItems = [
        {
            id: 'home',
            label: 'Home',
            icon: <Home className="nav-icon" />,
            action: () => setActiveSection('home'),
            component: () => <HomeComponent posts={filteredPosts} {...postCardProps} />,
            rightSidebar: () => <HomeRightSidebar posts={posts} onOpenPostDetail={handleOpenPostDetail} />,
        },
        {
            id: 'events',
            label: 'Events',
            icon: <CalendarIcon className="nav-icon" />,
            action: () => setActiveSection('events'),
            component: () => <EventsComponent posts={filteredPosts.filter(post => post.type === 'event')} {...postCardProps} />,
            rightSidebar: () => <EventsRightSidebar
                posts={posts.filter(p => p.type === 'event')}
                myCalendarEvents={myCalendarEvents}
                onOpenEventDetail={handleOpenEventDetail}
            />,
        },
        {
            id: 'confessions',
            label: 'Consights',
            icon: <MessageCircle className="nav-icon" />,
            action: () => setActiveSection('confessions'),
            component: () => <ConfessionsComponent posts={filteredPosts.filter(post => post.type === 'confession')} {...postCardProps} />,
            rightSidebar: () => <ConfessionsRightSidebar posts={posts.filter(p => p.type === 'confession')} onOpenPostDetail={handleOpenPostDetail} />,
        },
        {
            id: 'cultural-events',
            label: 'Cultural Events',
            icon: <Ticket className="nav-icon" />,
            action: () => setActiveSection('cultural-events'),
            component: () => <CulturalEventsComponent posts={filteredPosts.filter(post => post.type === 'culturalEvent')} {...postCardProps} />,
            rightSidebar: () => <EventsRightSidebar
                posts={posts.filter(p => p.type === 'culturalEvent')}
                myCalendarEvents={myCalendarEvents}
                onOpenEventDetail={handleOpenEventDetail}
            />,
        },
        {
            id: 'notifications',
            label: 'Notifications',
            icon: <Bell className="nav-icon" />,
            action: () => setActiveSection('notifications'),
            component: () => <NotificationsComponent
                notifications={notifications}
                adminNotifications={adminNotifications}
                pendingEvents={pendingEvents}
                currentUser={currentUser}
                onDeleteReportedPost={handleDeleteReportedPost}
                onApproveEvent={handleApproveEvent}
                onRejectEvent={handleRejectEvent}
            />,
            rightSidebar: () => <NotificationsRightSidebar onShowHelpModal={() => setShowHelpModal(true)} />,
        },
        {
            id: 'profile',
            label: 'Profile',
            icon: <User className="nav-icon" />,
            action: () => setActiveSection('profile'),
            component: () => <UsersComponent posts={posts} {...postCardProps} onEditProfile={() => setShowProfileSettingsModal(true)} />,
            rightSidebar: () => <UsersRightSidebar currentUser={currentUser} posts={posts} registrations={registrations} />,
        },
        {
            id: 'add',
            label: 'Add',
            icon: <Plus className="nav-icon" />,
            action: () => {
                if (!isLoggedIn) {
                    setShowLoginModal(true);
                } else {
                    setPostToEdit(null);
                    setIsModalOpen(true);
                    setSelectedPost(null);
                    setSelectedEvent(null);
                }
            }
        },
    ];

    const handleProfileClick = () => {
        setActiveSection('profile');
        setOpenCommentPostId(null);
        setSelectedPost(null);
        setSelectedEvent(null);
    };

    const CurrentComponent = menuItems.find(item => item.id === activeSection)?.component || (() => null);
    const CurrentRightSidebar = menuItems.find(item => item.id === activeSection)?.rightSidebar || (() => null);

    const renderMainContent = () => {
        if (selectedEvent) {
            return (
                <div className="main-content-detail-view">
                    <EventDetailPage
                        event={selectedEvent}
                        onClose={handleCloseEventDetail}
                        isLoggedIn={isLoggedIn}
                        onRequireLogin={() => setShowLoginModal(true)}
                        onAddToCalendar={handleAddToCalendar}
                        onRegister={handleRegisterEvent}
                        isRegistered={myRegisteredEvents.has(selectedEvent._id)}
                        onShowCalendarAlert={handleShowCalendarAlert}
                    />
                </div>
            );
        }

        if (selectedPost) {
            return (
                <div className="single-post-and-feed">
                    <PostCard
                        key={selectedPost._id}
                        post={selectedPost}
                        {...postCardProps}
                        isProfileView={selectedPost.userId === currentUser?._id}
                        registrationCount={registrations[selectedPost._id]}
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
                                    {...postCardProps}
                                    isProfileView={false}
                                    registrationCount={registrations[post._id]}
                                />
                            ))}
                    </div>
                </div>
            );
        }

        return <CurrentComponent />;
    };

    const renderRightSidebar = () => {
        if (selectedEvent) {
            return (
                <EventDetailSidebar
                    events={posts}
                    currentEvent={selectedEvent}
                    onOpenEventDetail={handleOpenEventDetail}
                />
            );
        }
        return <CurrentRightSidebar />;
    };

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
            {currentUser && (
                <CalendarModal
                    isOpen={showCalendarModal}
                    onClose={() => setShowCalendarModal(false)}
                    myCalendarEvents={myCalendarEvents}
                    onOpenEventDetail={(event) => {
                        handleOpenEventDetail(event);
                        setShowCalendarModal(false);
                    }}
                />
            )}
            <AddPostModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setPostToEdit(null);
                }}
                onSubmit={handleAddPost}
                postToEdit={postToEdit}
                currentUser={currentUser}
                onShowSuccessAlert={handleShowPostSuccessAlert}
            />
            <HelpAndSupportModal
                isOpen={showHelpModal}
                onClose={() => setShowHelpModal(false)}
            />
            <CustomMessageModal
                isOpen={showAddedToCalendarAlert}
                onClose={() => setShowAddedToCalendarAlert(false)}
                title="Event Added to Calendar"
                message="Your event has been saved. You can view it by opening the calendar."
                showConfirm={false}
            />
            {/* Thank you popup for AddPostModal */}
            <CustomMessageModal
                isOpen={showPostSuccessAlert}
                onClose={() => setShowPostSuccessAlert(false)}
                title="Success!"
                message={postSuccessAlertMessage}
                showConfirm={false}
            />
            {selectedCulturalEvent && (
                <CulturalEventRegistrationModal
                    isOpen={showCulturalEventRegistration}
                    onClose={() => setShowCulturalEventRegistration(false)}
                    event={selectedCulturalEvent}
                    isLoggedIn={isLoggedIn}
                    onRequireLogin={() => {
                        setShowCulturalEventRegistration(false);
                        setShowLoginModal(true);
                    }}
                    onRegister={handleRegisterEvent}
                    isRegistered={myRegisteredEvents.has(selectedCulturalEvent._id)}
                />
            )}

            <header className="header">
                <div className="header-container">
                    <div className="header-content">
                        <div className="header-left">
                            <a href="#" className="app-logo-link" onClick={(e) => { e.preventDefault(); setActiveSection('home'); setSelectedPost(null); setSelectedEvent(null); }}>
                                <img src={confiquelogo} width="24" height="24" alt="Confique Logo" />
                                <span className="app-title">Confique</span>
                            </a>
                        </div>
                        {activeSection === 'events' && isLoggedIn && (
                            <div className="mobile-calendar-icon-container">
                                <button className="mobile-calendar-icon" onClick={() => setShowCalendarModal(true)}>
                                    <CalendarIcon size={24} />
                                </button>
                            </div>
                        )}

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
                                    onProfileClick={handleProfileClick}
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

            <div className="main-layout-container">
                <aside className="left-sidebar">
                    <nav className="sidebar-nav">
                        {menuItems.filter(item => item.id !== 'profile').map(item => (
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
                        {currentUser && (
                            <button
                                key="profile"
                                className={`nav-button ${activeSection === 'profile' ? 'active' : ''}`}
                                onClick={handleProfileClick}
                            >
                                <User className="nav-icon" />
                                <span className="nav-label">Profile</span>
                            </button>
                        )}
                    </nav>
                </aside>
                <main className="main-content">
                    <div className="content-padding">
                        {renderMainContent()}
                    </div>
                </main>
                <aside className="right-sidebar">
                    <div className="right-sidebar-content">
                        {renderRightSidebar()}
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default App;