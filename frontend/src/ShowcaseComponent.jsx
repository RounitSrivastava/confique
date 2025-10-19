import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './Showcase.css';
import { Search, X, Image as ImageIcon, ThumbsUp, AlertCircle, Trash2, MoreVertical } from 'lucide-react';
import ProjectDetailsPage from './ProjectDetailsPage';

// IMPORT YOUR BANNER IMAGE HERE
import StartupBanner from './assets/Screenshot 2025-10-17 233807.png';

// Default API URL for production
const DEFAULT_API_URL = "https://confique.onrender.com";

// Loading Component
const LoadingSpinner = ({ message = "Loading ideas..." }) => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>{message}</p>
  </div>
);

// === AddIdeaModal Component ===
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

    if (!currentUser) {
      setValidationError('Please log in to submit an idea.');
      return;
    }

    if (!formData.logoUrl) {
      setValidationError('Please upload an Idea Logo. It is mandatory.');
      return;
    }
    if (!formData.bannerUrl) {
      setValidationError('Please upload a Banner Image. It is mandatory.');
      return;
    }
    if (!formData.launchedDate.trim()) {
      setValidationError('Launch On / Status (e.g., YYYY-MM-DD or Coming Soon) is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setValidationError('');
    
    try {
      await onSubmit({
        ...formData,
        month: activeMonth,
        userId: currentUser._id,
        author: currentUser.name,
        authorAvatar: currentUser.avatar,
      });
      
      setFormData({
        title: '',
        description: '',
        websiteLink: '',
        launchedDate: '',
        logoUrl: '',
        bannerUrl: '',
        fullDescription: '',
      });
      onClose();
    } catch (error) {
      console.error('Submission error:', error);
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

// === StartupCard Component ===
const StartupCard = ({ idea, onSelectIdea, onUpvote, onDeleteIdea, currentUser, onRequireLogin, likedIdeas, isAdmin }) => {
  const isLiked = likedIdeas?.has(idea.id);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (isUpvoting) {
      return;
    }

    setIsUpvoting(true);
    try {
      await onUpvote(idea.id);
    } catch (error) {
      console.error('Upvote error:', error);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!isAdmin) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${idea.name}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await onDeleteIdea(idea.id);
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete idea. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
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
      
      <div className="card-actions">
        <div className={`card-upvote ${isLiked ? 'liked' : ''} ${isUpvoting ? 'upvoting' : ''}`} onClick={handleUpvote}>
          <ThumbsUp 
            size={20} 
            className="upvote-icon"
            fill={isLiked ? '#ef4444' : 'none'}
            color={isLiked ? '#ef4444' : '#6b7280'}
          />
          <span className="upvote-count">{idea.upvotes}</span>
          {isLiked && <span className="upvote-text">Upvoted</span>}
        </div>

        {isAdmin && (
          <div className="admin-menu-container">
            <button 
              className="admin-menu-btn" 
              onClick={toggleMenu}
              disabled={isDeleting}
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="admin-dropdown-menu">
                <button 
                  className="admin-menu-item delete-item" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 size={14} />
                  {isDeleting ? 'Deleting...' : 'Delete Idea'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showMenu && (
        <div className="menu-overlay" onClick={() => setShowMenu(false)} />
      )}
    </div>
  );
};

// === ShowcaseComponent (Main Component - Optimized) ===
const ShowcaseComponent = ({ 
  currentUser, 
  onRequireLogin, 
  API_URL = DEFAULT_API_URL,
  callApi,
  likedIdeas = new Set()
}) => {
  const [activeMonth, setActiveMonth] = useState('October \'25');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddIdeaModalOpen, setIsAddIdeaModalOpen] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [localLikedIdeas, setLocalLikedIdeas] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDetailsView, setIsDetailsView] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [submissionError, setSubmissionError] = useState('');

  const isAdmin = currentUser && currentUser.email === 'confique01@gmail.com';
  const effectiveLikedIdeas = likedIdeas.size > 0 ? likedIdeas : localLikedIdeas;

  // Enhanced API fetch function
  const apiFetch = useCallback(async (endpoint, options = {}) => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (user && user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }

    // Use callApi if available from parent
    if (callApi) {
      return await callApi(endpoint, { ...options, headers });
    }

    // Fallback to direct fetch
    const finalEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${finalEndpoint}`;
    
    console.log(`🔗 API call: ${options.method || 'GET'} ${url}`, options.body);

    try {
      const response = await fetch(url, { 
        ...options, 
        headers,
        mode: 'cors'
      });
      
      if (!response.ok) {
        let errorText = 'No error message';
        try {
          errorText = await response.text();
        } catch (e) {
          console.error('Could not read error response:', e);
        }
        console.error(`❌ API Error ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      // Handle empty responses
      const contentLength = response.headers.get('content-length');
      if (contentLength === '0' || response.status === 204) {
        return { ok: true, status: response.status };
      }
      
      return response;
    } catch (error) {
      console.error(`🚨 Network error for ${url}:`, error);
      throw error;
    }
  }, [API_URL, callApi]);

  // ✅ OPTIMIZATION 1: Removed heavy console.logs from the mapping/filtering logic to speed up main thread execution.
  const fetchIdeas = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching ideas from API...');
      const response = await apiFetch('/posts');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      
      const allPosts = await response.json();
      console.log('📦 Raw API response:', allPosts.length, 'posts');
      
      const showcasePosts = allPosts
        .filter(post => {
          // Only keep showcase posts that are approved
          return post.type === 'showcase' && post.status === 'approved';
        })
        .map(post => {
          // Data transformation to fit the component's expectations
          const transformedPost = {
            id: post._id,
            name: post.title,
            description: post.description || post.content,
            logo: post.logoUrl || "https://placehold.co/60x60/cccccc/000000?text=Logo",
            banner: post.bannerUrl || "https://placehold.co/800x400/cccccc/000000?text=Banner",
            upvotes: post.upvotes || 0,
            month: post.month || 'October \'25',
            websiteLink: post.websiteLink,
            launchedDate: post.launchedDate,
            comments: Array.isArray(post.showcaseComments) ? post.showcaseComments : [],
            commentCount: post.commentCount || 0,
            upvoters: Array.isArray(post.upvoters) ? post.upvoters : [],
            fullDescription: post.fullDescription || post.content,
            userId: post.userId,
            author: post.author,
            authorAvatar: post.authorAvatar,
            timestamp: post.timestamp || post.createdAt
          };
          
          return transformedPost;
        });
      
      console.log(`🎉 Final showcase posts: ${showcasePosts.length}`);
      setIdeas(showcasePosts);
      
    } catch (err) {
      console.error('❌ Failed to fetch ideas:', err);
      setError('Failed to load ideas. Please check your connection.');
    } finally {
      // We only set isLoading to false AFTER both fetchIdeas and fetchLikedIdeas are done (see useEffect)
      // However, to ensure a smooth flow, we'll keep the final setIsLoading outside the fetch functions.
      // For now, let's keep it here, but the main optimization is Promise.all below.
    }
  }, [apiFetch]);

  // Fetch user's liked posts
  const fetchLikedIdeas = useCallback(async () => {
    if (!currentUser) {
      setLocalLikedIdeas(new Set());
      return;
    }
    
    try {
      console.log('🔄 Fetching liked ideas...');
      const response = await apiFetch('/users/liked-posts');
      
      if (response.ok) {
        const data = await response.json();
        const likedSet = new Set(data.likedPostIds || data.likedPosts || []);
        console.log(`✅ User liked posts: ${likedSet.size} ideas`);
        setLocalLikedIdeas(likedSet);
      } else {
        console.warn('⚠️ Could not fetch liked posts, using empty set');
        setLocalLikedIdeas(new Set());
      }
    } catch (error) {
      console.error('❌ Error fetching liked ideas:', error);
      setLocalLikedIdeas(new Set());
    }
  }, [currentUser, apiFetch]);

  // Add showcase idea submission
  const handleAddIdeaSubmit = async (ideaData) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    console.log('🚀 Submitting new idea:', ideaData);

    try {
      const response = await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: ideaData.title,
          description: ideaData.description,
          content: ideaData.fullDescription || ideaData.description,
          fullDescription: ideaData.fullDescription,
          websiteLink: ideaData.websiteLink,
          launchedDate: ideaData.launchedDate,
          logoUrl: ideaData.logoUrl,
          bannerUrl: ideaData.bannerUrl,
          month: ideaData.month,
          type: 'showcase',
          status: 'pending', // Ideas need admin approval
          author: currentUser.name,
          authorAvatar: currentUser.avatar,
          userId: currentUser._id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Submission failed: ${response.status}`);
      }

      const newIdea = await response.json();
      console.log('✅ Idea submitted successfully:', newIdea);

      // Refresh the ideas list to show the new submission
      await fetchIdeas();
      
      // Show success message
      alert('Your idea has been submitted successfully! It will be reviewed by an admin before appearing in the showcase.');
      
      return newIdea;

    } catch (error) {
      console.error('❌ Idea submission failed:', error);
      setSubmissionError(`Failed to submit idea: ${error.message}. Please try again.`);
      throw error;
    }
  };

  // Enhanced upvote function with proper state management
  const handleUpvoteIdea = async (ideaId) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    const idea = ideas.find(idea => idea.id === ideaId);
    if (!idea) {
      console.error('❌ Idea not found for upvote:', ideaId);
      return;
    }

    console.log(`🔼 Upvoting idea ${ideaId} for user ${currentUser._id}`);

    // Check if user already upvoted
    const hasUserUpvoted = effectiveLikedIdeas.has(ideaId);
    
    // Optimistic update - update UI immediately
    setIdeas(prevIdeas =>
      prevIdeas.map(idea =>
        idea.id === ideaId
          ? { 
              ...idea, 
              upvotes: hasUserUpvoted ? idea.upvotes - 1 : idea.upvotes + 1
            }
          : idea
      )
    );

    // Update liked ideas set optimistically
    if (hasUserUpvoted) {
      setLocalLikedIdeas(prev => {
        const newSet = new Set(prev);
        newSet.delete(ideaId);
        return newSet;
      });
    } else {
      setLocalLikedIdeas(prev => new Set([...prev, ideaId]));
    }

    try {
      // Send upvote request to backend
      const response = await apiFetch(`/posts/${ideaId}/upvote`, {
        method: 'PUT',
        body: JSON.stringify({
          userId: currentUser._id,
          action: hasUserUpvoted ? 'unvote' : 'upvote' // Explicit action
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upvote failed with response:', errorText);
        throw new Error(`Upvote failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Upvote successful:', result);
      
      // Sync with server response
      if (result.upvotes !== undefined) {
        setIdeas(prevIdeas =>
          prevIdeas.map(idea =>
            idea.id === ideaId
              ? { 
                  ...idea, 
                  upvotes: result.upvotes,
                  upvoters: result.upvoters || idea.upvoters
                }
              : idea
          )
        );
      }

      // Update liked status based on server response
      if (result.hasUpvoted !== undefined) {
        if (result.hasUpvoted) {
          setLocalLikedIdeas(prev => new Set([...prev, ideaId]));
        } else {
          setLocalLikedIdeas(prev => {
            const newSet = new Set(prev);
            newSet.delete(ideaId);
            return newSet;
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Upvote failed:', error);
      
      // Revert optimistic update on error
      setIdeas(prevIdeas =>
        prevIdeas.map(idea =>
          idea.id === ideaId
            ? { 
                ...idea, 
                upvotes: hasUserUpvoted ? idea.upvotes + 1 : idea.upvotes - 1
              }
            : idea
        )
      );

      // Revert liked status
      if (hasUserUpvoted) {
        setLocalLikedIdeas(prev => new Set([...prev, ideaId]));
      } else {
        setLocalLikedIdeas(prev => {
          const newSet = new Set(prev);
          newSet.delete(ideaId);
          return newSet;
        });
      }
      
      alert(`Upvote failed: ${error.message}. Please try again.`);
    }
  };

  // ADMIN: Delete showcase idea
  const handleDeleteIdea = async (ideaId) => {
    if (!isAdmin) {
      alert('You do not have permission to delete ideas.');
      return;
    }

    try {
      const response = await apiFetch(`/posts/${ideaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete idea');
      }

      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== ideaId));
      console.log('🗑️ Idea deleted successfully');
      
    } catch (error) {
      console.error('Error deleting idea:', error);
      throw new Error('Failed to delete idea: ' + error.message);
    }
  };

  // Add comment to showcase idea
  const handleAddComment = async (ideaId, commentText) => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (!commentText.trim()) {
      throw new Error('Comment cannot be empty');
    }

    console.log(`💬 Adding comment to idea ${ideaId}`);

    const commentData = {
      text: commentText.trim(),
      author: currentUser.name,
      authorAvatar: currentUser.avatar,
      userId: currentUser._id,
      timestamp: new Date().toISOString()
    };

    try {
      // Try main endpoint first
      let response = await apiFetch(`/posts/${ideaId}/showcase-comments`, {
        method: 'POST',
        body: JSON.stringify(commentData),
      });

      // If main endpoint fails, try alternative
      if (!response.ok) {
        console.log('🔄 Trying alternative comment endpoint...');
        response = await apiFetch(`/posts/${ideaId}/comments`, {
          method: 'POST',
          body: JSON.stringify(commentData),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Comment failed:', errorText);
        throw new Error(`Failed to add comment: ${response.status}`);
      }

      const newComment = await response.json();
      console.log('✅ Comment successful:', newComment);
      
      // Update local state
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

      return newComment;
      
    } catch (error) {
      console.error('❌ Comment failed:', error);
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  };

  const handleSelectIdea = (idea) => {
    console.log('🔍 Selecting idea:', idea.name, 'ID:', idea.id);
    setSelectedIdea(idea);
    setIsDetailsView(true);
  };

  const handleGoBack = () => {
    setIsDetailsView(false);
    setSelectedIdea(null);
  };

  // Refresh data function
  const handleRefresh = () => {
    fetchIdeas();
    fetchLikedIdeas();
  };

  // ✅ OPTIMIZATION 2: Use Promise.all to fetch data concurrently
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing Showcase Component...');
      try {
        await Promise.all([
          fetchIdeas(),
          fetchLikedIdeas()
        ]);
      } catch (e) {
        console.error("Initialization failed:", e);
        setError("Failed to initialize data. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [fetchIdeas, fetchLikedIdeas]); // Dependencies remain the same

  const months = ['October \'25'];

  // ✅ OPTIMIZATION 3: Use useMemo for efficient filtering and sorting
  const filteredIdeas = useMemo(() => {
    return ideas.filter(idea => {
      if (!idea || idea.month !== activeMonth) return false;
      
      const lowerSearchTerm = searchTerm.toLowerCase();
      const nameMatches = idea.name?.toLowerCase().includes(lowerSearchTerm);
      const descriptionMatches = idea.description?.toLowerCase().includes(lowerSearchTerm);

      return nameMatches || descriptionMatches;
    }).sort((a, b) => b.upvotes - a.upvotes);
  }, [ideas, activeMonth, searchTerm]);

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
        onUpvote={handleUpvoteIdea}
        likedIdeas={effectiveLikedIdeas}
      />
    );
  }

  // Main Showcase View
  return (
    <div className="showcase-page-container">
      <header className="showcase-top-header">
        <div className="logo">Startup Showcase</div>
        <div className="header-actions">
          {isAdmin && (
            <div className="admin-badge">
              🔧 Admin Mode
            </div>
          )}
          <div className="header-buttons">
            <button 
              onClick={handleRefresh}
              className="refresh-btn"
              title="Refresh data"
            >
              🔄
            </button>
            <button 
              className="post-idea-btn"
              onClick={() => {
                if (!currentUser) {
                  onRequireLogin();
                  return;
                }
                setIsAddIdeaModalOpen(true);
                setSubmissionError('');
              }}
            >
              Post an Idea
            </button>
          </div>
        </div>
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

      {/* BANNER */}
      <div className="hero-banner">
          <img 
            src={StartupBanner} 
            alt="Startup Showcase Banner" 
            className="full-width-banner-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/1200x400/cccccc/000000?text=Startup+Showcase+Banner";
            }}
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
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {submissionError && (
        <div className="submission-error-message">
          <AlertCircle size={16} />
          {submissionError}
          <button 
            onClick={() => setSubmissionError('')}
            className="close-error-btn"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div className="idea-list-container">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="no-results">
            <p>{error}</p>
            <button 
              onClick={handleRefresh} 
              className="retry-btn"
            >
              Try Again
            </button>
          </div>
        ) : filteredIdeas.length > 0 ? (
          <>
            <div className="results-count">
              Showing {filteredIdeas.length} idea{filteredIdeas.length !== 1 ? 's' : ''}
              {searchTerm && ` for "${searchTerm}"`}
            </div>
            {filteredIdeas.map(idea => (
              <StartupCard 
                key={idea.id} 
                idea={idea} 
                onSelectIdea={handleSelectIdea}
                onUpvote={handleUpvoteIdea}
                onDeleteIdea={handleDeleteIdea}
                currentUser={currentUser}
                onRequireLogin={onRequireLogin}
                likedIdeas={effectiveLikedIdeas}
                isAdmin={isAdmin}
              />
            ))}
          </>
        ) : (
          <div className="no-results">
            <p>No ideas found</p>
            {searchTerm && (
              <p>Try adjusting your search terms.</p>
            )}
            <button 
              onClick={() => setSearchTerm('')}
              className="retry-btn"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      <AddIdeaModal
        isOpen={isAddIdeaModalOpen} 
        onClose={() => {
          setIsAddIdeaModalOpen(false);
          setSubmissionError('');
        }}
        onSubmit={handleAddIdeaSubmit}
        activeMonth={activeMonth}
        currentUser={currentUser}
        onRequireLogin={onRequireLogin}
      />
    </div>
  );
};

export default ShowcaseComponent;