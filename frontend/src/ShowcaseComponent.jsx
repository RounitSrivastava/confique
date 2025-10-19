import React, { useState, useEffect } from 'react';
import './Showcase.css';
import { ChevronDown, Search, X, Image as ImageIcon, ThumbsUp, AlertCircle, Link as LinkIcon, MessageCircle } from 'lucide-react';
import ProjectDetailsPage from './ProjectDetailsPage';

// IMPORT YOUR BANNER IMAGE HERE
import StartupBanner from './assets/Screenshot 2025-10-17 233807.png';

// Default API URL for production
const DEFAULT_API_URL = "https://confique.onrender.com";

// --- Utility: Centralized API Caller (To be replaced by prop in App.jsx) ---
// Note: This is a placeholder. The actual callApi should come from App.jsx as a prop,
// or be defined here, handling the base URL and authorization logic consistently.
// For now, we will use standard fetch with Authorization headers where needed.
const apiFetch = async (endpoint, options = {}) => {
    // Assuming API_URL is passed in props and only contains the domain
    const apiUrl = options.API_URL || DEFAULT_API_URL;
    
    // FIX: Standardize API path to include /api, ensuring no double slashes
    let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    path = path.startsWith('/api') ? path : `/api${path}`;
    
    const response = await fetch(`${apiUrl}${path}`, options);
    
    if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
        } catch (e) {
            // ignore non-json response errors
        }
        throw new Error(errorMsg);
    }
    return response;
};

// Loading Component
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading ideas...</p>
  </div>
);

// === AddIdeaModal Component (with authentication check) ===
const AddIdeaModal = ({ isOpen, onClose, onSubmit, activeMonth, currentUser, onRequireLogin }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    websiteLink: '',
    launchedDate: '', 
    logoUrl: '',
    bannerUrl: '',
    fullDescription: '', 
  });

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication when modal opens
  useEffect(() => {
    if (isOpen && !currentUser) {
      onRequireLogin();
      onClose();
    }
  }, [isOpen, currentUser, onRequireLogin, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, [fieldName]: reader.result }));
        setValidationError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is logged in
    if (!currentUser) {
      setValidationError('Please log in to submit an idea.');
      return;
    }

    // Mandatory check for logo
    if (!formData.logoUrl) {
      setValidationError('Please upload an Idea Logo. It is mandatory.');
      return;
    }
    // Mandatory check for banner
    if (!formData.bannerUrl) {
      setValidationError('Please upload a Banner Image. It is mandatory.');
      return;
    }
    // Mandatory check for Launch Date/Status
    if (!formData.launchedDate.trim()) {
        setValidationError('Launch On / Status (e.g., YYYY-MM-DD or Coming Soon) is mandatory.');
        return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        month: activeMonth,
        userId: currentUser._id,
        author: currentUser.name,
        authorAvatar: currentUser.avatar,
      });
      
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        websiteLink: '',
        launchedDate: '',
        logoUrl: '',
        bannerUrl: '',
        fullDescription: '',
      });
      setValidationError('');
      onClose();
    } catch (error) {
      setValidationError('Failed to submit idea. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content add-idea-modal">
        <div className="modal-header">
          <h2 className="modal-title">Add Your Startup Idea for {activeMonth}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        {!currentUser ? (
          <div className="login-required-message">
            <p>Please log in to submit your startup idea.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label className="form-label">Idea Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Behale"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Short Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-textarea"
                placeholder="e.g., Time to replace your unhealthy food choices..."
                required
                disabled={isSubmitting}
              ></textarea>
            </div>
            <div className="form-group">
              <label className="form-label">Full Description</label>
              <textarea
                name="fullDescription"
                value={formData.fullDescription}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Provide a detailed explanation of your idea, concept, and target market."
                required
                disabled={isSubmitting}
              ></textarea>
            </div>
            <div className="form-group"> 
              <label className="form-label">Launched On / Status * (Required)</label>
              <input
                  type="text"
                  name="launchedDate"
                  value={formData.launchedDate}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="YYYY-MM-DD or Coming Soon"
                  required
                  disabled={isSubmitting}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Website Link</label>
              <input
                  type="url"
                  name="websiteLink"
                  value={formData.websiteLink}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="https://www.your-idea.com (Optional)"
                  disabled={isSubmitting}
              />
            </div>
            
            {validationError && (
              <div className="validation-error-message">
                <AlertCircle size={16} />
                {validationError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Idea Logo *</label>
              <div className="image-upload-container small-preview">
                {formData.logoUrl ? (
                  <div className="image-preview-item">
                    <img src={formData.logoUrl} alt="Logo" className="post-image" />
                    <button 
                      type="button" 
                      className="remove-image-btn" 
                      onClick={() => { setFormData(prev => ({ ...prev, logoUrl: '' })); setValidationError(''); }}
                      disabled={isSubmitting}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="logo-upload" className={`upload-btn ${validationError.includes('Logo') ? 'error-border' : ''}`}>
                    <ImageIcon size={16} />
                    <span>Upload Logo</span>
                    <input 
                      id="logo-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'logoUrl')} 
                      style={{ display: 'none' }} 
                      disabled={isSubmitting}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Banner Image *</label>
              <div className="image-upload-container wide-preview">
                {formData.bannerUrl ? (
                  <div className="image-preview-item">
                    <img src={formData.bannerUrl} alt="Banner" className="post-image" />
                    <button 
                      type="button" 
                      className="remove-image-btn" 
                      onClick={() => { setFormData(prev => ({ ...prev, bannerUrl: '' })); setValidationError(''); }}
                      disabled={isSubmitting}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="banner-upload" className={`upload-btn ${validationError.includes('Banner') ? 'error-border' : ''}`}>
                    <ImageIcon size={16} />
                    <span>Upload Banner</span>
                    <input 
                      id="banner-upload" 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleFileChange(e, 'bannerUrl')} 
                      style={{ display: 'none' }} 
                      disabled={isSubmitting}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Idea'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// === StartupCard Component (with authentication for upvotes) ===
const StartupCard = ({ idea, onSelectIdea, onUpvote, currentUser, onRequireLogin, likedIdeas }) => {
  const isLiked = likedIdeas?.has(idea.id);
  
  const handleUpvote = (e) => {
    e.stopPropagation();
    if (!currentUser) {
      onRequireLogin();
      return;
    }
    onUpvote(idea.id);
  };

  return (
    <div className="startup-card" onClick={() => onSelectIdea(idea)}>
      <div className="card-content">
        <img 
          src={idea.logo} 
          alt={`${idea.name} logo`} 
          className="card-logo" 
          onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/60x60/cccccc/000000?text=Logo"; }}
        />
        <div className="card-details">
            <div className="card-main-info"> 
                <h3 className="card-title">{idea.name}</h3>
                <p className="card-description">{idea.description}</p>
            </div>
        </div>
      </div>
      <div className={`card-upvote ${isLiked ? 'liked' : ''}`} onClick={handleUpvote}>
        <ThumbsUp 
          size={20} 
          className="upvote-icon"
          fill={isLiked ? '#ef4444' : 'none'}
        />
        <span className="upvote-count">{idea.upvotes}</span>
      </div>
    </div>
  );
};

// === ShowcaseComponent (Main Component - Updated) ===
const ShowcaseComponent = ({ 
  currentUser, 
  onRequireLogin, 
  API_URL = DEFAULT_API_URL 
}) => {
  const [activeMonth, setActiveMonth] = useState('October \'25');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddIdeaModalOpen, setIsAddIdeaModalOpen] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [likedIdeas, setLikedIdeas] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDetailsView, setIsDetailsView] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);

  useEffect(() => {
    console.log('🔧 ShowcaseComponent mounted with API_URL:', API_URL);
  }, [API_URL]);

  // --- Date/Time Closure Logic ---
  // Check against current time in IST (UTC+5:30) might be complex, rely on client time for deadline display
  const SUBMISSION_DEADLINE = new Date('2025-10-31T23:59:59').getTime();
  const [isPostingEnabled, setIsPostingEnabled] = useState(() => {
    const now = new Date().getTime();
    return now < SUBMISSION_DEADLINE;
  });

  useEffect(() => {
    if (!isPostingEnabled) return;

    const intervalId = setInterval(() => {
      const now = new Date().getTime();
      if (now >= SUBMISSION_DEADLINE) {
        setIsPostingEnabled(false);
        clearInterval(intervalId);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isPostingEnabled]);

  // Fetch showcase ideas from existing posts API
  const fetchIdeas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // FIX: Use apiFetch utility to correctly construct the URL
      const response = await apiFetch('/posts', { API_URL });
      
      const allPosts = await response.json();
      
      // Filter for showcase posts and transform data
      const showcasePosts = allPosts
        .filter(post => post.type === 'showcase' && post.status === 'approved')
        .map(post => ({
          id: post._id,
          name: post.title,
          description: post.content,
          logo: post.logoUrl,
          banner: post.bannerUrl,
          upvotes: post.likes || 0, // Assuming upvotes map to likes field
          month: post.month || 'October \'25',
          websiteLink: post.registrationLink || post.websiteLink, // Using registrationLink for flexibility
          launchedDate: post.launchedDate,
          comments: post.commentData || [], // Using commentData field
          creator: {
            name: post.author || 'Anonymous',
            role: 'Creator',
            avatar: post.authorAvatar
          },
          upvoters: post.upvoters || [],
          fullDescription: post.fullDescription || post.content,
          userId: post.userId,
          author: post.author,
          authorAvatar: post.authorAvatar,
          timestamp: post.timestamp || post.createdAt
        }));
      
      setIdeas(showcasePosts);
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
      setError('Failed to load ideas. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's liked posts (existing endpoint)
  const fetchLikedIdeas = async () => {
    if (!currentUser) {
      setLikedIdeas(new Set());
      return;
    }
    
    try {
      // FIX: Use apiFetch utility to correctly construct the URL
      const response = await apiFetch('/users/liked-posts', {
        API_URL,
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Assuming the response data includes IDs of liked posts
        setLikedIdeas(new Set(data.likedPostIds || []));
      }
    } catch (error) {
      console.error('Error fetching liked ideas:', error);
    }
  };

  useEffect(() => {
    fetchIdeas();
    fetchLikedIdeas();
  }, [currentUser, API_URL]);

  const months = ['October \'25'];

  const filteredIdeas = ideas.filter(idea => {
    if (!idea || idea.month !== activeMonth) return false;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const nameMatches = idea.name?.toLowerCase().includes(lowerSearchTerm);
    const descriptionMatches = idea.description?.toLowerCase().includes(lowerSearchTerm);

    return nameMatches || descriptionMatches;
  }).sort((a, b) => b.upvotes - a.upvotes); // Sort by upvotes

  // Submit new showcase idea using existing posts endpoint
  const handleAddIdeaSubmit = async (ideaData) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    try {
      // FIX: Use apiFetch utility to correctly construct the URL
      const response = await apiFetch('/posts', {
        API_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          ...ideaData,
          title: ideaData.title,
          content: ideaData.description, // Map description to content for posts
          type: 'showcase',
          images: [] 
        }),
      });

      const newPost = await response.json();
      
      // Refetch entire list to ensure consistency and pull new approved post
      await fetchIdeas();
      fetchLikedIdeas();
      
      setIsAddIdeaModalOpen(false);
    } catch (error) {
      console.error('Failed to submit idea:', error);
      throw error;
    }
  };

  // Upvote showcase idea using existing upvote endpoint
  const handleUpvoteIdea = async (ideaId) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const isCurrentlyLiked = likedIdeas.has(ideaId);
    const endpoint = isCurrentlyLiked ? `/posts/${ideaId}/unlike` : `/posts/${ideaId}/like`;
    
    // Optimistic update
    setIdeas(prevIdeas =>
      prevIdeas.map(idea =>
        idea.id === ideaId
          ? { 
              ...idea, 
              upvotes: isCurrentlyLiked ? idea.upvotes - 1 : idea.upvotes + 1 
            }
          : idea
      )
    );

    setLikedIdeas(prev => {
      const newLiked = new Set(prev);
      if (isCurrentlyLiked) {
        newLiked.delete(ideaId);
      } else {
        newLiked.add(ideaId);
      }
      return newLiked;
    });

    try {
      // FIX: Use apiFetch utility to correctly construct the URL
      const response = await apiFetch(endpoint, {
        API_URL,
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Upvote failed');
      }
      
    } catch (error) {
      console.error('Error upvoting idea:', error);
      // Revert optimistic update on error
      setIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === ideaId
            ? { 
                ...idea, 
                upvotes: isCurrentlyLiked ? idea.upvotes + 1 : idea.upvotes - 1 
              }
            : idea
        )
      );
      setLikedIdeas(prev => {
        const newLiked = new Set(prev);
        if (isCurrentlyLiked) {
          newLiked.add(ideaId);
        } else {
          newLiked.delete(ideaId);
        }
        return newLiked;
      });
    }
  };

  // Add comment to showcase idea using existing comments endpoint
  const handleAddComment = async (ideaId, commentText) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    try {
      // FIX: Use apiFetch utility to correctly construct the URL
      const response = await apiFetch(`/posts/${ideaId}/showcase-comments`, {
        API_URL,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (response.ok) {
        const newComment = await response.json();
        
        // Refetch the entire ideas list to pull the updated comments for consistency
        await fetchIdeas();

        // Also update the selectedIdea if it is the one being commented on
        setSelectedIdea(prev => {
            if (prev && prev.id === ideaId) {
                return { 
                    ...prev, 
                    comments: [newComment, ...prev.comments], 
                    commentCount: (prev.commentCount || 0) + 1 
                };
            }
            return prev;
        });

      } else {
        throw new Error('Failed to add comment to server.');
    }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const handleSelectIdea = (idea) => {
    setSelectedIdea(idea);
    setIsDetailsView(true);
  };

  const handleGoBack = () => {
    setIsDetailsView(false);
    setSelectedIdea(null);
  };

  // Conditional Render: Show Project Details Page
  if (isDetailsView) {
    return (
      <ProjectDetailsPage 
        project={selectedIdea} 
        onGoBack={handleGoBack}
        currentUser={currentUser}
        onRequireLogin={onRequireLogin}
        onAddComment={handleAddComment}
        API_URL={API_URL}
        onUpvote={handleUpvoteIdea} // Pass upvote handler
        likedIdeas={likedIdeas} // Pass liked state
      />
    );
  }

  // Main Showcase View
  return (
    <div className="showcase-page-container">
      <header className="showcase-top-header">
        <div className="logo">Startup Showcase</div>
        <button 
            className={`post-idea-btn ${!isPostingEnabled ? 'disabled-btn' : ''}`}
            onClick={() => {
              if (!currentUser) {
                onRequireLogin();
                return;
              }
              if (isPostingEnabled) {
                setIsAddIdeaModalOpen(true);
              }
            }}
            disabled={!isPostingEnabled}
        >
          {isPostingEnabled ? 'Post an Idea' : 'Submissions Closed'}
        </button>
      </header>

      <nav className="month-tabs">
        {months.map(month => (
          <button
            key={month}
            className={`tab ${activeMonth === month ? 'active' : ''}`}
            onClick={() => setActiveMonth(month)}
          >
            {month}
          </button>
        ))}
      </nav>

      {/* BANNER CODE using imported image */}
      <div className="hero-banner">
          <img 
            src={StartupBanner} 
            alt="Startup Showcase Banner" 
            className="full-width-banner-image"
          />
      </div>

      <div className="search-and-lucky-wrapper">
        <div className="search-input-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search Ideas"
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="idea-list-container">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="no-results">
            <p>Failed to load ideas. Please check your connection.</p>
            <button 
              onClick={fetchIdeas} 
              className="retry-btn"
              style={{ marginTop: '10px', padding: '8px 16px' }}
            >
              Try Again
            </button>
          </div>
        ) : filteredIdeas.length > 0 ? (
          filteredIdeas.map(idea => (
            <StartupCard 
              key={idea.id} 
              idea={idea} 
              onSelectIdea={handleSelectIdea}
              onUpvote={handleUpvoteIdea}
              currentUser={currentUser}
              onRequireLogin={onRequireLogin}
              likedIdeas={likedIdeas}
            />
          ))
        ) : (
          <div className="no-results">
            <p>No idea found</p>
            {searchTerm && (
              <p>Try adjusting your search terms.</p>
            )}
          </div>
        )}
      </div>

      <AddIdeaModal
        isOpen={isAddIdeaModalOpen && isPostingEnabled} 
        onClose={() => setIsAddIdeaModalOpen(false)}
        onSubmit={handleAddIdeaSubmit}
        activeMonth={activeMonth}
        currentUser={currentUser}
        onRequireLogin={onRequireLogin}
      />
    </div>
  );
};

export default ShowcaseComponent;