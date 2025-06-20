import React, { useState, useEffect, useRef } from 'react';
import { Home, Calendar as CalendarIcon, MessageCircle, User, Plus, X, Image, MapPin, Clock, Heart, MessageCircle as MessageIcon, Share2, Bell, Search, Send, ArrowLeft, Info, CalendarPlus, Landmark, Languages, Timer, Ticket } from 'lucide-react'; // Added Landmark, Languages, Timer, Ticket
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

// Sample data (Keep your existing initialPosts)
const initialPosts = [
    {
        id: '1',
        type: 'confession',
        title: 'Late Night Thoughts',
        content: 'Sometimes I wonder if anyone else feels like they\'re just pretending to be an adult. Like, I\'m paying bills and making decisions, but inside I still feel like I\'m 16 and have no idea what I\'m doing.',
        images: ['https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg?auto=compress&cs=tinysrgb&w=400'],
        author: 'Anonymous',
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
        timestamp: new Date(2024, 5, 8, 9, 0),
        likes: 156,
        comments: 23,
        location: 'Central Park',
        eventDate: new Date(2025, 7, 1, 10, 0), // Note: Month is 0-indexed, so 7 is August
        price: 0, // Added price
        language: 'English', // Added language
        duration: '3 Hours', // Added duration
        ticketsNeeded: 'All ages', // Added ticketsNeeded
        venueAddress: '123 Main St, Central Park, City, Country', // Added venueAddress
        commentData: [
            { id: 'c3', author: 'EventFan', text: 'Can\'t wait for this!', timestamp: new Date(2024, 5, 8, 9, 30) },
        ]
    },
    {
        id: '3',
        type: 'confession',
        title: 'Small Victory',
        content: 'I finally worked up the courage to ask my crush out today. They said yes! I\'m still in shock. Sometimes taking that leap of faith really pays off.',
        images: ['https://images.pexels.com/photos/1415131/pexels-photo-1415131.jpeg?auto=compress&cs=tinysrgb&w=400'],
        author: 'Anonymous',
        timestamp: new Date(2024, 5, 12, 16, 45),
        likes: 89,
        comments: 12,
        commentData: []
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
        timestamp: new Date(2024, 5, 5, 11, 30),
        likes: 201,
        comments: 38,
        location: 'Innovation Hub',
        eventDate: new Date(2025, 8, 5, 18, 30), // Note: Month is 0-indexed, so 8 is September
        price: 479, // Added price
        language: 'English', // Added language
        duration: '2 Hours', // Added duration
        ticketsNeeded: '3 yrs & above', // Added ticketsNeeded
        venueAddress: 'joypee wishtown, I-7, Aoparpur, Sector 131, Noida, Uttar Pradesh 201304, India', // Added venueAddress
        commentData: []
    },
    {
        id: '5',
        type: 'news',
        title: 'Local Library Announces New Digital Archive',
        content: 'The City Library has launched a new online portal providing access to thousands of historical documents, photographs, and oral histories. A significant step in preserving local heritage.',
        images: ['https://images.pexels.com/photos/2034851/pexels-photo-2034851.jpeg?auto=compress&cs=tinysrgb&w=400'],
        author: 'City Council',
        timestamp: new Date(2025, 5, 12, 10, 0),
        likes: 78,
        comments: 10,
        commentData: []
    },
    {
        id: '6',
        type: 'news',
        title: 'New Park Section Opens to Public',
        content: 'A new section of Riverside Park, featuring renovated walking trails and a new playground, officially opened this morning. The expansion aims to provide more green space for residents.',
        images: [
            'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=400',
            'https://images.pexels.com/photos/2649117/pexels-photo-2649117.jpeg?auto=compress&cs=tinysrgb&w=400'
        ],
        author: 'Parks & Rec Dept.',
        timestamp: new Date(2025, 5, 11, 15, 0),
        likes: 112,
        comments: 20,
        commentData: []
    },
    {
        id: '7',
        type: 'news',
        title: 'Community Garden Harvest Festival Announced',
        content: 'The annual community garden harvest festival will be held next month, celebrating a season of growth and bounty. Expect fresh produce, local crafts, and family activities.',
        images: ['https://images.pexels.com/photos/265386/pexels-photo-265386.jpeg?auto=compress&cs=tinysrgb&w=400'],
        author: 'Community Garden Association',
        timestamp: new Date(2025, 5, 13, 9, 0),
        likes: 65,
        comments: 8,
        commentData: []
    },
    {
        id: '8',
        type: 'news',
        title: 'City Launches "Green Horizons" Environmental Initiative',
        content: 'The Mayor\'s office today unveiled the "Green Horizons" program, a comprehensive environmental initiative focused on urban reforestation, waste reduction, and promoting sustainable living among residents. The program includes community workshops and volunteer tree-planting drives starting next month.',
        images: ['https://images.pexels.com/photos/221540/pexels-photo-221540.jpeg?auto=compress&cs=tinysrgb&w=600'],
        author: 'Mayor\'s Office',
        timestamp: new Date(2025, 5, 13, 16, 0),
        likes: 95,
        comments: 15,
        commentData: []
    },
    {
        id: '9',
        type: 'news',
        title: 'Annual Summer Music Festival Breaks Attendance Records',
        content: 'The highly anticipated annual Summer Music Festival concluded last weekend, drawing record-breaking crowds to Central Plaza. Local and national artists performed across three stages, delighting thousands of music lovers. Organizers hailed it as the most successful festival to date.',
        images: ['https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=600'],
        author: 'Cultural Events Board',
        timestamp: new Date(2025, 5, 10, 20, 0),
        likes: 180,
        comments: 25,
        commentData: []
    },
    {
        id: '10',
        type: 'news',
        title: 'Local Businesses Report Strong Q2 Growth',
        content: 'Despite economic uncertainties, local businesses in the downtown district have reported significant growth in the second quarter of the year. Retail sales and service industry revenues saw an average increase =of 8%, indicating a robust local economy. Chamber of Commerce attributes success to community support and innovative business strategies.',
        images: ['https://images.pexels.com/photos/3183186/pexels-photo-3183186.jpeg?auto=compress&cs=tinysrgb&w=600'],
        author: 'Chamber of Commerce',
        timestamp: new Date(2025, 5, 13, 23, 0),
        likes: 105,
        comments: 18,
        commentData: []
    },
    {
        id: '11',
        type: 'news',
        title: 'New Vocational Training Center Opens Downtown',
        content: 'A state-of-the-art vocational training center has officially opened its doors in the downtown area, offering free and low-cost courses in various trades, including coding, culinary arts, and renewable energy. The initiative aims to equip local residents with valuable skills for the modern workforce. Enrollments are now open for the fall session.',
        images: ['https://images.pexels.com/photos/3771077/pexels-photo-3771077.jpeg?auto=compress&cs=tinysrgb&w=600'],
        author: 'City Education Dept.',
        timestamp: new Date(2025, 6, 14, 10, 0),
        likes: 70,
        comments: 9,
        commentData: []
    },
];

// CommentItem Component (No changes)
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

// CommentSection Component (No changes)
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
                    <Send size={18} />
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

// AddPostModal Component (No changes)
const AddPostModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        type: 'confession',
        title: '',
        content: '',
        images: [''],
        author: '',
        location: '',
        eventDate: '',
    });

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
            images: formData.images.filter(img => img.trim() !== ''),
            author: formData.author || 'Anonymous',
            ...(formData.type === 'event' && {
                location: formData.location,
                eventDate: formData.eventDate ? new Date(formData.eventDate) : undefined,
            }),
            commentData: []
        };
        onSubmit(newPost);
        setFormData({
            type: 'confession',
            title: '',
            content: '',
            images: [''],
            author: '',
            location: '',
            eventDate: '',
        });
        onClose();
    };

    const addImageField = () => {
        if (formData.images.length < 4) {
            setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
        }
    };

    const updateImage = (index, value) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => i === index ? value : img)
        }));
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
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
                            <option value="news">News</option>
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
                        <>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.location}
                                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Event Date</label>
                                <input
                                    type="datetime-local"
                                    className="form-input"
                                    value={formData.eventDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label className="form-label">Images (Max 4)</label>
                        {formData.images.map((image, index) => (
                            <div key={index} className="image-input-group">
                                <input
                                    type="url"
                                    className="form-input"
                                    value={image}
                                    onChange={(e) => updateImage(index, e.target.value)}
                                    placeholder="Image URL"
                                />
                                {formData.images.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-image-btn"
                                        onClick={() => removeImage(index)}
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {formData.images.length < 4 && (
                            <button
                                type="button"
                                className="add-image-btn"
                                onClick={addImageField}
                            >
                                <Image size={16} />
                                Add Image
                            </button>
                        )}
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
    );
};

// NEW: EventDetailPage Component
const EventDetailPage = ({ event, onClose }) => {
    const [showFullContent, setShowFullContent] = useState(false);

    if (!event) return null;

    const displayContent = showFullContent ? event.content : event.content.substring(0, 200) + '...';
    const hasMoreContent = event.content.length > 200;

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
                        <span>Prometheus School, Noida. {event.venueAddress}</span> {/* Assuming this is part of location or a separate field */}
                    </div>

                    <div className="event-detail-price-book">
                        <span className="event-detail-price">
                            {event.price === 0 ? 'FREE' : `₹${event.price}`}
                        </span>
                        <button className="event-detail-book-button">BOOK TICKETS</button>
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
                        <button className="get-directions-button">
                            <MapPin size={16} /> GET DIRECTIONS
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// Post Card Component
const PostCard = ({ post, onLike, onShare, onAddComment, isLikedByUser, isCommentsOpen, setOpenCommentPostId, onOpenEventDetail }) => {
    const overlayRef = useRef(null);
    // Removed showEventDetails local state, now managed by onOpenEventDetail
    // const [showEventDetails, setShowEventDetails] = useState(false); // REMOVE THIS LINE

    const handleImageError = (e) => {
        e.target.src = "https://placehold.co/400x200/cccccc/000000?text=Image+Load+Error";
        e.target.onerror = null;
    };

    const getPostTypeLabel = (type) => {
        switch (type) {
            case 'confession': return 'Confession';
            case 'event': return 'Event';
            case 'news': return 'News';
            default: return 'Post';
        }
    };

    const isInteractive = post.type !== 'news';

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
            alert(`Event "${post.title}" on ${formattedDate} at ${formattedTime} has been notionally added to your calendar!`);
        }
    };

    // Removed handleRegisterClick from here, it will be in EventDetailPage now
    // const handleRegisterClick = () => {
    //     if (post.type === 'event') {
    //         alert(`You are now registered for the event: "${post.title}"!`);
    //     }
    // };

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
            </div>

            <div className="post-content">
                <h2 className="post-title">{post.title}</h2>
                <p className="post-text">{post.content}</p>

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
                    {/* NEW POSITION for Event Specific Buttons */}
                    {post.type === 'event' && (
                        <div className="event-action-buttons-top">
                            {/* This button now calls onOpenEventDetail from App */}
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

                    {/* Removed Expanded Event Details Section from here */}
                    {/* The EventDetailPage component now handles this outside PostCard */}

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

// HomeComponent, EventsComponent, ConfessionsComponent - Pass onOpenEventDetail
const HomeComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail }) => {
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
                    />
                ))}
            </div>
        </div>
    );
};

const EventsComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail }) => {
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
                    />
                ))}
            </div>
        </div>
    );
};

const ConfessionsComponent = ({ posts, onLike, onShare, onAddComment, likedPosts, openCommentPostId, setOpenCommentPostId, onOpenEventDetail }) => {
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
                        onAddComment={handleAddComment}
                        isLikedByUser={likedPosts.has(post.id)}
                        isCommentsOpen={openCommentPostId === post.id}
                        setOpenCommentPostId={setOpenCommentPostId}
                        onOpenEventDetail={onOpenEventDetail}
                    />
                ))}
            </div>
        </div>
    );
};

// UsersComponent, Right Sidebar Components (No changes)
const UsersComponent = () => (
    <div>
        <h2 className="page-title">Profile</h2>
        <div className="placeholder-card">
            <p className="placeholder-text">Profile management coming soon</p>
        </div>
    </div>
);

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

const EventsRightSidebar = ({ posts }) => {
    const [value, onChange] = useState(new Date());
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const hasEvent = posts.some(post =>
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
                <button className="add-event-calendar-btn">
                    <Plus size={20} />
                    Add Event
                </button>
            </div>
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

const UsersRightSidebar = () => (
    <div className="sidebar-widget">
        <div className="widget-header">
            <h3 className="widget-title">Profile Stats</h3>
        </div>
        <div className="widget-content">
            <div className="widget-list">
                <p className="widget-item">Posts: <span className="widget-stat">12</span></p>
                <p className="widget-item">Likes Received: <span className="widget-stat">234</span></p>
                <p className="widget-item">Comments: <span className="widget-stat">45</span></p>
            </div>
        </div>
    </div>
);

// Main App component
const App = () => {
    const [activeSection, setActiveSection] = useState('home');
    const [posts, setPosts] = useState(initialPosts);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [likedPosts, setLikedPosts] = useState(new Set());
    const [openCommentPostId, setOpenCommentPostId] = useState(null); // State to track which post has comments open
    const [selectedEvent, setSelectedEvent] = useState(null); // NEW state for event detail page

    // Effect to manage body overflow when a post's comments are open or event detail is open
    useEffect(() => {
        if (openCommentPostId || selectedEvent) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        // Cleanup function
        return () => {
            document.body.classList.remove('modal-open');
        };
    }, [openCommentPostId, selectedEvent]);

    const handleAddPost = (newPost) => {
        const post = {
            ...newPost,
            id: Date.now().toString(),
            timestamp: new Date(),
            likes: 0,
            comments: 0,
            commentData: [],
        };
        setPosts(prev => [post, ...prev]);
    };

    const handleLikePost = (postId) => {
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
        const shareUrl = `${window.location.origin}/posts/${postId}`; // Construct a hypothetical URL for the post

        if (navigator.share) {
            try {
                await navigator.share({
                    title: postTitle,
                    text: postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''), // Share a snippet of the content
                    url: shareUrl,
                });
                console.log('Post shared successfully!');
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('Link copied to clipboard!'); // Provide user feedback
                console.log('Link copied to clipboard:', shareUrl);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                alert('Could not copy link to clipboard. Please copy manually: ' + shareUrl);
            }
        }
    };

    // NEW: Function to open event detail page
    const handleOpenEventDetail = (event) => {
        setSelectedEvent(event);
        setOpenCommentPostId(null); // Ensure comments are closed if an event detail is opened
    };

    // NEW: Function to close event detail page
    const handleCloseEventDetail = () => {
        setSelectedEvent(null);
    };


    const menuItems = [
        {
            id: 'home',
            label: 'Home',
            icon: <Home className="nav-icon" />,
            component: () => <HomeComponent
                posts={posts}
                onLike={handleLikePost}
                onShare={handleShareClick}
                onAddComment={handleAddComment}
                likedPosts={likedPosts}
                openCommentPostId={openCommentPostId}
                setOpenCommentPostId={setOpenCommentPostId}
                onOpenEventDetail={handleOpenEventDetail} // Pass the handler
            />,
            rightSidebar: () => <HomeRightSidebar posts={posts} />,
        },
        {
            id: 'events',
            label: 'Events',
            icon: <CalendarIcon className="nav-icon" />,
            component: () => <EventsComponent
                posts={posts}
                onLike={handleLikePost}
                onShare={handleShareClick}
                onAddComment={handleAddComment}
                likedPosts={likedPosts}
                openCommentPostId={openCommentPostId}
                setOpenCommentPostId={setOpenCommentPostId}
                onOpenEventDetail={handleOpenEventDetail} // Pass the handler
            />,
            rightSidebar: () => <EventsRightSidebar posts={posts.filter(p => p.type === 'event')} />,
        },
        {
            id: 'confessions',
            label: 'Confessions',
            icon: <MessageCircle className="nav-icon" />,
            component: () => <ConfessionsComponent
                posts={posts}
                onLike={handleLikePost}
                onShare={handleShareClick}
                onAddComment={handleAddComment}
                likedPosts={likedPosts}
                openCommentPostId={openCommentPostId}
                setOpenCommentPostId={setOpenCommentPostId}
                onOpenEventDetail={handleOpenEventDetail} // Pass the handler
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
        {
            id: 'profile',
            label: 'Profile',
            icon: <User className="nav-icon" />,
            component: UsersComponent,
            rightSidebar: UsersRightSidebar,
        },
        {
            id: 'add',
            label: 'Add',
            icon: <Plus className="nav-icon" />,
            onClick: () => setIsModalOpen(true),
            component: () => <HomeComponent // This component is a placeholder as 'Add' button triggers a modal
                posts={posts}
                onLike={handleLikePost}
                onShare={handleShareClick}
                onAddComment={handleAddComment}
                likedPosts={likedPosts}
                openCommentPostId={openCommentPostId}
                setOpenCommentPostId={setOpenCommentPostId}
                onOpenEventDetail={handleOpenEventDetail} // Pass the handler
            />,
            rightSidebar: null,
        },
    ];

    const CurrentComponent = menuItems.find(item => item.id === activeSection)?.component || (() => null);
    const CurrentRightSidebar = menuItems.find(item => item.id === activeSection)?.rightSidebar || (() => null);

    return (
        <div className={`app ${selectedEvent ? 'event-detail-open' : ''}`}> {/* Add class to body/app for overflow */}
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
                                <input type="text" placeholder="Search..." className="search-input" />
                            </div>
                        </div>
                        <div className="header-right">
                            <div className="avatar"></div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="main-layout-container">
                <aside className="left-sidebar">
                    <nav className="sidebar-nav">
                        {menuItems.map(item => (
                            <button
                                key={item.id}
                                className={`nav-button ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => {
                                    if (item.onClick) {
                                        item.onClick();
                                    } else {
                                        setActiveSection(item.id);
                                        setOpenCommentPostId(null); // Close any open comments when switching sections
                                        setSelectedEvent(null); // Close event detail when switching sections
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
                            <EventDetailPage event={selectedEvent} onClose={handleCloseEventDetail} />
                        ) : (
                            <CurrentComponent
                                posts={posts} // Pass posts and handlers down
                                onLike={handleLikePost}
                                onShare={handleShareClick}
                                onAddComment={handleAddComment}
                                likedPosts={likedPosts}
                                openCommentPostId={openCommentPostId}
                                setOpenCommentPostId={setOpenCommentPostId}
                                onOpenEventDetail={handleOpenEventDetail}
                            />
                        )}
                    </div>
                </main>

                <aside className="right-sidebar">
                    <div className="right-sidebar-content">
                        {/* Only show right sidebar if no event is selected */}
                        {!selectedEvent && <CurrentRightSidebar posts={posts} />}
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