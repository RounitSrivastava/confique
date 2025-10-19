import React, { useState, useEffect } from 'react';
import './Showcase.css';
import { ChevronDown, Search, X, Image as ImageIcon, ThumbsUp } from 'lucide-react';
import ProjectDetailsPage from './ProjectDetailsPage';

// IMPORT YOUR BANNER IMAGE HERE
import StartupBanner from './assets/Screenshot 2025-10-17 233807.png';

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

  const handleSubmit = (e) => {
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

    onSubmit({
      ...formData,
      month: activeMonth,
      userId: currentUser._id,
      author: currentUser.name,
      authorAvatar: currentUser.avatar,
    });
    onClose();
    
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
              />
            </div>
            
            {validationError && (
              <div className="validation-error-message">
                ⚠️ {validationError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Idea Logo *</label>
              <div className="image-upload-container small-preview">
                {formData.logoUrl ? (
                  <div className="image-preview-item">
                    <img src={formData.logoUrl} alt="Logo" className="post-image" />
                    <button type="button" className="remove-image-btn" onClick={() => { setFormData(prev => ({ ...prev, logoUrl: '' })); setValidationError(''); }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="logo-upload" className={`upload-btn ${validationError.includes('Logo') ? 'error-border' : ''}`}>
                    <ImageIcon size={16} />
                    <span>Upload Logo</span>
                    <input id="logo-upload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logoUrl')} style={{ display: 'none' }} />
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
                    <button type="button" className="remove-image-btn" onClick={() => { setFormData(prev => ({ ...prev, bannerUrl: '' })); setValidationError(''); }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="banner-upload" className={`upload-btn ${validationError.includes('Banner') ? 'error-border' : ''}`}>
                    <ImageIcon size={16} />
                    <span>Upload Banner</span>
                    <input id="banner-upload" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'bannerUrl')} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary">Submit Idea</button>
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
      <div className="card-upvote" onClick={handleUpvote}>
        <ThumbsUp 
          size={20} 
          className={`upvote-icon ${isLiked ? 'liked' : ''}`} 
          fill={isLiked ? '#ef4444' : 'none'}
        />
        <span className="upvote-count">{idea.upvotes}</span>
      </div>
    </div>
  );
};

// === ShowcaseComponent (Main Component - Updated) ===
const ShowcaseComponent = ({ currentUser, onRequireLogin, API_URL }) => {
  const [activeMonth, setActiveMonth] = useState('October \'25');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddIdeaModalOpen, setIsAddIdeaModalOpen] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [likedIdeas, setLikedIdeas] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // --- Date/Time Closure Logic ---
  const SUBMISSION_DEADLINE = new Date('2025-10-31T23:59:59').getTime();
  
  const checkSubmissionStatus = () => {
    const now = new Date().getTime();
    return now < SUBMISSION_DEADLINE;
  };

  const [isPostingEnabled, setIsPostingEnabled] = useState(checkSubmissionStatus());

  useEffect(() => {
    if (!isPostingEnabled) {
      return; 
    }

    const intervalId = setInterval(() => {
      if (!checkSubmissionStatus()) {
        setIsPostingEnabled(false);
        clearInterval(intervalId);
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isPostingEnabled]);

  // --- Details View State ---
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isDetailsView, setIsDetailsView] = useState(false);

  // Fetch ideas from API
  const fetchIdeas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/showcase/ideas`);
      if (response.ok) {
        const data = await response.json();
        setIdeas(data);
      } else {
        console.error('Failed to fetch ideas');
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user's liked ideas
  const fetchLikedIdeas = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${API_URL}/showcase/liked-ideas`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLikedIdeas(new Set(data.likedIdeaIds || []));
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
  }, [currentUser]);

  const months = ['October \'25'];

  const filteredIdeas = ideas.filter(idea => {
    if (!idea || idea.month !== activeMonth) return false;
    
    const lowerSearchTerm = searchTerm.toLowerCase();

    const nameMatches = idea.name 
        && idea.name.toLowerCase().includes(lowerSearchTerm);
        
    const descriptionMatches = idea.description 
        && idea.description.toLowerCase().includes(lowerSearchTerm);

    return nameMatches || descriptionMatches;
  });

  const handleAddIdeaSubmit = async (ideaData) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/showcase/ideas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(ideaData),
      });

      if (response.ok) {
        const newIdea = await response.json();
        setIdeas(prevIdeas => [newIdea, ...prevIdeas]);
      } else {
        console.error('Failed to submit idea');
      }
    } catch (error) {
      console.error('Error submitting idea:', error);
    }
  };

  const handleUpvoteIdea = async (ideaId) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const isCurrentlyLiked = likedIdeas.has(ideaId);
    
    try {
      const response = await fetch(`${API_URL}/showcase/ideas/${ideaId}/upvote`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });

      if (response.ok) {
        // Update local state optimistically
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
      }
    } catch (error) {
      console.error('Error upvoting idea:', error);
    }
  };

  const handleAddComment = async (ideaId, commentText) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/showcase/ideas/${ideaId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ text: commentText }),
      });

      if (response.ok) {
        const updatedIdea = await response.json();
        setIdeas(prevIdeas =>
          prevIdeas.map(idea =>
            idea.id === ideaId ? updatedIdea : idea
          )
        );
      }
    } catch (error) {
      console.error('Error adding comment:', error);
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
          <div className="loading-message">Loading ideas...</div>
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
          <div className="no-results">No ideas found for {activeMonth}.</div>
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