import React, { useState } from 'react';
import './Showcase.css';
import { ArrowLeft, ExternalLink, MessageSquare, ArrowRight, ThumbsUp } from 'lucide-react';

// --- Configuration ---
const INITIAL_VISIBLE_LIMIT = 1;

// Comment Section Component (Updated with authentication)
const CommentSection = ({ initialComments = [], onNewComment, currentUser, onRequireLogin }) => {
  const [comments, setComments] = useState(initialComments);
  const [newCommentText, setNewCommentText] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_LIMIT);

  const handlePostComment = () => {
    if (!currentUser) {
      onRequireLogin();
      return;
    }

    if (newCommentText.trim() === '') return;

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;

    const formattedTime = `${day}/${month}/${year} at ${displayHours}:${minutes} ${ampm}`;

    const newComment = {
      id: Date.now(),
      user: currentUser.name,
      avatar: currentUser.avatar,
      text: newCommentText.trim(),
      timestamp: formattedTime,
    };

    setComments([newComment, ...comments]); 
    
    if (visibleCount < comments.length) {
        setVisibleCount(prev => prev + 1);
    }
    
    setNewCommentText('');
    onNewComment(newComment);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handlePostComment();
    }
  };
  
  const handleLoadMore = () => {
    setVisibleCount(comments.length);
  };
  
  const handleCollapseComments = () => {
    setVisibleCount(INITIAL_VISIBLE_LIMIT);
  };
  
  const isExpanded = visibleCount === comments.length && comments.length > INITIAL_VISIBLE_LIMIT;
  const displayedComments = comments.slice(0, visibleCount);
  const commentsToHide = comments.length - visibleCount;
  const showLoadMoreButton = comments.length > INITIAL_VISIBLE_LIMIT && visibleCount < comments.length;

  return (
    <div className="comment-section-wrapper">
      <div className="comment-header-bar">
        <ArrowLeft 
            size={24} 
            className={`back-arrow-icon ${isExpanded ? 'visible' : 'hidden'}`} 
            onClick={handleCollapseComments} 
        />
        <h2 className="section-title comment-title-header">Comments</h2>
      </div>

      <div className="comment-input-container-replicate">
        <input
          type="text"
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder={currentUser ? "Add a comment..." : "Please log in to comment"}
          className="comment-input-field"
          onKeyDown={handleKeyDown}
          disabled={!currentUser}
        />
        <button 
            type="button" 
            className="post-comment-btn-replicate" 
            onClick={handlePostComment} 
            disabled={newCommentText.trim() === '' || !currentUser}
        >
          <ArrowRight size={28} /> 
        </button>
      </div>

      <div className="comments-list-replicate">
        {displayedComments.map(comment => (
          <div key={comment.id} className="comment-item-replicate">
            <img src={comment.avatar} alt={comment.user} className="comment-avatar-replicate" />
            <div className="comment-content-wrapper-replicate">
              <div className="comment-user-header-replicate">
                <span className="comment-user-replicate">{comment.user}</span>
                <span className="comment-timestamp-replicate">{comment.timestamp}</span>
              </div>
              <p className="comment-text-replicate">{comment.text}</p>
            </div>
          </div>
        ))}

        {showLoadMoreButton && (
            <div className="load-more-wrapper">
                <button 
                    onClick={handleLoadMore} 
                    className="more-comments-btn"
                >
                    +{commentsToHide} more comment{commentsToHide > 1 ? 's' : ''}
                </button>
            </div>
        )}
        
        {comments.length === 0 && (
            <p className="no-comments-replicate">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
};

// Main Project Details Page Component (Updated with Backend Integration)
const ProjectDetailsPage = ({ project, onGoBack, currentUser, onRequireLogin, onAddComment, API_URL }) => {
    const [upvotes, setUpvotes] = useState(project.upvotes || 0);
    const [isUpvoted, setIsUpvoted] = useState(project.upvoters?.some(upvoter => upvoter._id === currentUser?._id) || false);
    const [localComments, setLocalComments] = useState(project.comments || []);
    const [commentCount, setCommentCount] = useState(project.comments ? project.comments.length : 0);
    const [isUpvoting, setIsUpvoting] = useState(false);

    // Upvote function with backend integration
    const handleUpvote = async () => {
        if (!currentUser) {
            onRequireLogin();
            return;
        }

        if (isUpvoting) return;

        setIsUpvoting(true);
        
        // Optimistic update
        const previousUpvotes = upvotes;
        const previousIsUpvoted = isUpvoted;
        
        if (isUpvoted) {
            setUpvotes(prev => prev - 1);
        } else {
            setUpvotes(prev => prev + 1);
        }
        setIsUpvoted(prev => !prev);

        try {
            // Call backend API to upvote
            const response = await fetch(`${API_URL}/api/posts/${project.id}/upvote`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentUser.token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to upvote');
            }

            const updatedPost = await response.json();
            
            // Update with server data
            setUpvotes(updatedPost.upvotes || upvotes);
            setIsUpvoted(updatedPost.upvoters?.some(upvoter => upvoter._id === currentUser._id) || false);
            
        } catch (error) {
            console.error('Error upvoting:', error);
            // Revert optimistic update on error
            setUpvotes(previousUpvotes);
            setIsUpvoted(previousIsUpvoted);
        } finally {
            setIsUpvoting(false);
        }
    };

    if (!project) {
        return (
            <div className="project-details-container">
                <h1 className="project-name">Project Not Found</h1>
                <button className="back-button" onClick={onGoBack}>
                    <ArrowLeft size={20} /> Back to Showcase
                </button>
            </div>
        );
    }

    const handleVisitWebsite = () => {
        if (project.websiteLink && project.websiteLink.trim()) {
            window.open(project.websiteLink, '_blank');
        }
    };
    
    const handleComment = () => {
        if (!currentUser) {
            onRequireLogin();
            return;
        }
        document.querySelector('.comment-section-wrapper')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleNewCommentPosted = (newComment) => {
        setLocalComments(prev => [newComment, ...prev]);
        setCommentCount(prev => prev + 1);
        if (onAddComment) {
            onAddComment(project.id, newComment.text);
        }
    };

    const bannerSource = project.bannerUrl || project.banner || "https://assets.website-files.com/62c93d9b418a09618b6e6cf1/62d85b19c6e5a4f48348b47e_Hero%20Bg.png";
    const hasWebsiteLink = project.websiteLink && project.websiteLink.trim().length > 0;
    
    // Get the first few upvoters to display next to the count
    const displayedUpvoters = project.upvoters?.slice(0, 5) || [];

    return (
        <div className="project-details-container">
            <button className="back-button" onClick={onGoBack}>
              <ArrowLeft size={20} /> 
            </button>

            <div className="project-header">
              <div className="project-info">
                <img 
                  src={project.logo} 
                  alt={`${project.name} logo`} 
                  className="project-logo" 
                  onError={(e) => e.target.src = "https://placehold.co/60x60/cccccc/000000?text=L"}
                />
                <div className="project-text">
                  <h1 className="project-name">{project.name}</h1>
                  <p className="project-tagline">{project.description}</p>
                </div>
              </div>
              {/* UPVOTE BUTTON */}
              <button 
                className={`project-upvote-btn ${isUpvoted ? 'upvoted' : ''} ${isUpvoting ? 'loading' : ''}`}
                onClick={handleUpvote}
                disabled={isUpvoting}
              >
                <ThumbsUp 
                  size={16} 
                  fill={isUpvoted ? '#ef4444' : 'none'}
                  style={{ marginRight: '8px' }}
                />
                {isUpvoting ? 'Upvoting...' : (isUpvoted ? `Upvoted (${upvotes})` : `Upvote (${upvotes})`)}
              </button>
            </div>

            <div className="project-meta-data">
              <div className="meta-item">
                <span className="meta-date">{project.launchedDate}</span>
                <span className="meta-label">Launched On</span>
              </div>
              <div className="meta-item">
                <span className="meta-count">{commentCount}</span>
                <span className="meta-label">Comments</span>
              </div>
                {/* Conditional rendering based on website link existence */}
                {hasWebsiteLink ? (
                    <button className="meta-link-btn" onClick={handleVisitWebsite}>
                        <ExternalLink size={16} /> Visit Website
                    </button>
                ) : (
                    <div className="meta-item no-link-item">
                        <span className="meta-date" style={{ color: '#dc3545' }}>—</span>
                        <span className="meta-label">No website provided</span>
                    </div>
                )}
            </div>
      
            <div className="section-divider"></div>

            {/* UPVOTER SECTION */}
            <div className="section-upvoters">
                <div className="upvoters-header-row">
                    <h2 className="section-title">{upvotes} Upvoters</h2> 
                    {displayedUpvoters.length > 0 && (
                        <div className="upvoters-list-inline">
                            {displayedUpvoters.map((upvoter, index) => (
                                <img key={index} src={upvoter.avatar} alt="Upvoter" className="upvoter-avatar" />
                            ))}
                            {project.upvoters && project.upvoters.length > displayedUpvoters.length && (
                                <span className="more-upvoters-count">+{project.upvoters.length - displayedUpvoters.length}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
      
            <div className="section-divider"></div>

            <div className="section-description">
              <h2 className="section-title">Description</h2>
              <div className="description-text">
                <p className="concept-label">Concept:</p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{project.fullDescription}</p>
              </div>
            </div>
      
            <div className="section-divider"></div>
      
            <div className="section-features-in">
              <h2 className="section-title">Features in</h2>
              <div className="features-banner">
                <img 
                    src={bannerSource} 
                    alt={`Banner for ${project.name}`} 
                />
              </div>
            </div>

            <div className="section-divider"></div>
            
            <CommentSection 
              initialComments={localComments}
              onNewComment={handleNewCommentPosted}
              currentUser={currentUser}
              onRequireLogin={onRequireLogin}
            />

        </div>
    );
};

export default ProjectDetailsPage;