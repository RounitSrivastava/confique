import React, { useState, useEffect } from 'react';
import './Showcase.css';
import { ChevronDown, Search, X, Image as ImageIcon, ThumbsUp, AlertCircle } from 'lucide-react';
import ProjectDetailsPage from './ProjectDetailsPage';

// IMPORT YOUR BANNER IMAGE HERE
import StartupBanner from './assets/Screenshot 2025-10-17 233807.png';

// Default API URL for production
const DEFAULT_API_URL = "https://confique.onrender.com";

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
        <img src={idea.logo} alt={`${idea.name} logo`} className="card-logo" />
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
  API_URL = DEFAULT_API_URL  // Default to production URL
}) => {
  const [activeMonth, setActiveMonth] = useState('October \'25');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddIdeaModalOpen, setIsAddIdeaModalOpen] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [likedIdeas, setLikedIdeas] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug API_URL on component mount
  useEffect(() => {
    console.log('🔧 ShowcaseComponent mounted with API_URL:', API_URL);
  }, [API_URL]);

  // --- Date/Time Closure Logic ---
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

  // --- Details View State ---
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isDetailsView, setIsDetailsView] = useState(false);

  // Fetch showcase ideas from existing posts API
  const fetchIdeas = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔧 Fetching ideas from:', `${API_URL}/api/posts`);
      
      // Use the existing posts endpoint - it will return all posts including showcase
      const response = await fetch(`${API_URL}/api/posts`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
          upvotes: post.upvotes || 0,
          month: post.month || 'October \'25',
          websiteLink: post.websiteLink,
          launchedDate: post.launchedDate,
          comments: post.comments || [],
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
      
      console.log('✅ Loaded showcase posts:', showcasePosts.length);
      setIdeas(showcasePosts);
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
      setError('Failed to load ideas. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's liked posts (existing endpoint)
  const fetchLikedIdeas = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/liked-posts`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setLikedIdeas(new Set(data.likedPostIds || []));
      }
    } catch (error) {
      console.error('Error fetching liked ideas:', error);
    }
  };

  useEffect(() => {
    fetchIdeas();
    if (currentUser) {
      fetchLikedIdeas();
    }
  }, [currentUser, API_URL]);

  const months = ['October \'25'];

  const filteredIdeas = ideas.filter(idea => {
    if (!idea || idea.month !== activeMonth) return false;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    const nameMatches = idea.name?.toLowerCase().includes(lowerSearchTerm);
    const descriptionMatches = idea.description?.toLowerCase().includes(lowerSearchTerm);

    return nameMatches || descriptionMatches;
  });

  // Submit new showcase idea using existing posts endpoint
  const handleAddIdeaSubmit = async (ideaData) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    try {
      console.log('🔧 Submitting idea to:', `${API_URL}/api/posts`);
      
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({
          ...ideaData,
          type: 'showcase',
          content: ideaData.description, // Map description to content for posts
          images: [] // Showcase posts don't use the images array
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const newIdea = await response.json();
      
      // Transform the response to match frontend format
      const transformedIdea = {
        id: newIdea._id,
        name: newIdea.title,
        description: newIdea.content,
        logo: newIdea.logoUrl,
        banner: newIdea.bannerUrl,
        upvotes: newIdea.upvotes || 0,
        month: newIdea.month || 'October \'25',
        websiteLink: newIdea.websiteLink,
        launchedDate: newIdea.launchedDate,
        comments: newIdea.comments || [],
        creator: {
          name: newIdea.author || 'Anonymous',
          role: 'Creator',
          avatar: newIdea.authorAvatar
        },
        upvoters: newIdea.upvoters || [],
        fullDescription: newIdea.fullDescription || newIdea.content,
        userId: newIdea.userId,
        author: newIdea.author,
        authorAvatar: newIdea.authorAvatar,
        timestamp: newIdea.timestamp || newIdea.createdAt
      };
      
      setIdeas(prevIdeas => [transformedIdea, ...prevIdeas]);
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
      console.log('🔧 Upvoting idea at:', `${API_URL}/api/posts/${ideaId}/upvote`);
      
      // Use the existing upvote endpoint for showcase posts
      const response = await fetch(`${API_URL}/api/posts/${ideaId}/upvote`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Upvote failed');
      }

      // Update with server response if needed
      const updatedPost = await response.json();
      console.log('Upvote successful:', updatedPost);
      
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
      console.log('🔧 Adding comment at:', `${API_URL}/api/posts/${ideaId}/showcase-comments`);
      
      // Use the showcase comments endpoint from your existing routes
      const response = await fetch(`${API_URL}/api/posts/${ideaId}/showcase-comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (response.ok) {
        const newComment = await response.json();
        
        // Update the idea with the new comment
        setIdeas(prevIdeas =>
          prevIdeas.map(idea =>
            idea.id === ideaId
              ? {
                  ...idea,
                  comments: [newComment, ...(idea.comments || [])],
                  commentCount: (idea.commentCount || 0) + 1
                }
              : idea
          )
        );
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