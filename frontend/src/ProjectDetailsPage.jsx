import React, { useState, useEffect } from 'react';
import './Showcase.css';
import { ArrowLeft, ExternalLink, MessageSquare, ArrowRight, ThumbsUp } from 'lucide-react';

// --- Configuration ---
const INITIAL_VISIBLE_LIMIT = 1;
const placeholderAvatar = 'https://placehold.co/40x40/cccccc/000000?text=A';

// Utility to safely extract avatar URL
const extractAvatarUrl = (avatar) => {
    if (!avatar) return placeholderAvatar;
    if (typeof avatar === 'string' && avatar.startsWith('http')) return avatar;
    if (avatar && typeof avatar === 'object' && avatar.url) return avatar.url;
    return placeholderAvatar;
};

// Comment Section Component (Updated with authentication)
const CommentSection = ({ initialComments = [], onNewComment, currentUser, onRequireLogin }) => {
    // Ensure initialComments is always an array
    const safeInitialComments = Array.isArray(initialComments) ? initialComments : [];
    
    // Sort comments by timestamp/id (most recent first) for display
    const sortedComments = [...safeInitialComments].sort((a, b) => {
        // Use ID (timestamp) for local sorting if proper timestamp isn't available
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return timeB - timeA;
    });

    const [comments, setComments] = useState(sortedComments);
    const [newCommentText, setNewCommentText] = useState('');
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_LIMIT);

    // Sync comments from parent prop changes
    useEffect(() => {
        const safeComments = Array.isArray(initialComments) ? initialComments : [];
        const sortedSafeComments = [...safeComments].sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeB - timeA;
        });
        setComments(sortedSafeComments);
    }, [initialComments]);


    const handlePostComment = () => {
        if (!currentUser) {
            onRequireLogin();
            return;
        }

        const text = newCommentText.trim();
        if (text === '') return;

        // Optimistic UI update for immediate feedback
        const now = new Date();
        const newComment = {
            // Use a temporary unique ID for optimistic rendering
            id: Date.now(), 
            user: currentUser.name,
            avatar: extractAvatarUrl(currentUser.avatar),
            text: text,
            timestamp: now.toISOString(), // Use ISO string for consistency
        };

        setComments([newComment, ...comments]);
        
        if (visibleCount < comments.length) {
            setVisibleCount(prev => prev + 1);
        }
        
        setNewCommentText('');
        
        // Call the parent handler to post to the actual API
        onNewComment(text);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
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
    
    const formatTimestamp = (isoString) => {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "Unknown Date";

        const localDate = date.toLocaleDateString('en-US', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        }).replace(/\//g, '/');
        
        const localTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });

        return `${localDate} at ${localTime}`;
    }

    return (
    <div className="comment-section-wrapper">
      <div className="comment-header-bar">
        <ArrowLeft 
            size={24} 
            className={`back-arrow-icon ${isExpanded ? 'visible' : 'hidden'}`} 
            onClick={handleCollapseComments} 
        />
        <h2 className="section-title comment-title-header">Comments ({comments.length})</h2>
      </div>

      <div className="comment-input-container-replicate">
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder={currentUser ? "Add a comment..." : "Please log in to comment"}
          className="comment-input-field"
          onKeyDown={handleKeyDown}
          disabled={!currentUser}
          rows={1}
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
          <div key={comment.id || comment._id} className="comment-item-replicate">
            <img 
                src={extractAvatarUrl(comment.avatar || comment.authorAvatar)} 
                alt={comment.user || comment.author} 
                className="comment-avatar-replicate" 
                onError={(e) => e.target.src = placeholderAvatar}
            />
            <div className="comment-content-wrapper-replicate">
              <div className="comment-user-header-replicate">
                <span className="comment-user-replicate">{comment.user || comment.author}</span>
                <span className="comment-timestamp-replicate">{formatTimestamp(comment.timestamp)}</span>
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
const ProjectDetailsPage = ({ project, onGoBack, currentUser, onRequireLogin, onAddComment, API_URL, onUpvote, likedIdeas }) => {
    // Initialize state from props. Use project.likes for upvotes.
    const [upvotes, setUpvotes] = useState(project.upvotes || project.likes || 0);
    // Determine initial upvoted state using the likedIdeas Set passed from parent
    const [isUpvoted, setIsUpvoted] = useState(likedIdeas.has(project.id));
    
    // FIXED: Ensure comments is always an array, never a number
    const [localComments, setLocalComments] = useState(
        Array.isArray(project.comments) ? project.comments : []
    );
    
    // FIXED: Ensure commentCount is calculated safely
    const [commentCount, setCommentCount] = useState(
        Array.isArray(project.comments) ? project.comments.length : 0
    );
    
    const [isUpvoting, setIsUpvoting] = useState(false);

    // Sync upvotes and liked status if project prop changes
    useEffect(() => {
        setUpvotes(project.upvotes || project.likes || 0);
        setIsUpvoted(likedIdeas.has(project.id));
        
        // FIXED: Always ensure comments is an array
        const safeComments = Array.isArray(project.comments) ? project.comments : [];
        setLocalComments(safeComments);
        setCommentCount(safeComments.length);
    }, [project, likedIdeas]);

    // Upvote function using the handler passed from parent (ShowcaseComponent)
    const handleUpvote = async () => {
        if (!currentUser) {
            onRequireLogin();
            return;
        }

        if (isUpvoting) return;

        setIsUpvoting(true);
        
        try {
            // Call parent's upvote handler, which handles API call and global state update
            await onUpvote(project.id); 
            
            // Wait for parent component's state to update, then sync local state
            // NOTE: The delay here is to ensure the parent's optimistic update has time to run
            // A more robust solution involves passing the new upvote count/status from the parent.
            // For now, we manually adjust, as the parent will trigger a re-render soon.
            
            // Manual optimistic sync:
            setUpvotes(prev => isUpvoted ? prev - 1 : prev + 1);
            setIsUpvoted(prev => !prev);
            
        } catch (error) {
            console.error('Upvote error:', error);
            // Parent handles the rollback, we just stop loading
        } finally {
            setIsUpvoting(false);
        }
    };

    // Comment function uses the handler passed from parent
    const handleNewCommentPosted = async (commentText) => {
        if (!currentUser) {
            onRequireLogin();
            return;
        }

        try {
            // Call parent's handler to post comment to the server
            await onAddComment(project.id, commentText);
            
            // The parent (ShowcaseComponent) will refetch ideas and update the project prop,
            // which in turn updates localComments via the useEffect sync.
            
        } catch(error) {
            console.error('Failed to post comment via parent handler:', error);
            // Optionally show a local error message here
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
            // Ensure URL starts with http/https
            const url = project.websiteLink.startsWith('http') ? project.websiteLink : `https://${project.websiteLink}`;
            window.open(url, '_blank');
        }
    };
    
    const hasWebsiteLink = project.websiteLink && project.websiteLink.trim().length > 0;
    
    // Get the first few upvoters to display next to the count
    // NOTE: Upvoters structure in the project object needs to be an array of user objects { _id, avatar, name }
    const displayedUpvoters = (project.upvoters || []).slice(0, 5);
    const bannerSource = project.bannerUrl || project.banner || "https://assets.website-files.com/62c93d9b418a09618b6e6cf1/62d85b19c6e5a4f48348b47e_Hero%20Bg.png";


    return (
        <div className="project-details-container">
            {/* Back Button */}
            <button className="back-button" onClick={onGoBack}>
              <ArrowLeft size={20} /> Back to Showcase
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
                {isUpvoting ? 'Loading...' : (isUpvoted ? `Upvoted (${upvotes})` : `Upvote (${upvotes})`)}
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
                                <img 
                                    key={index} 
                                    src={extractAvatarUrl(upvoter.avatar)} 
                                    alt="Upvoter" 
                                    className="upvoter-avatar" 
                                    onError={(e) => e.target.src = placeholderAvatar}
                                />
                            ))}
                            {(project.upvoters && project.upvoters.length) > displayedUpvoters.length && (
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
                <p style={{ whiteSpace: 'pre-wrap' }}>{project.fullDescription || project.description}</p>
              </div>
            </div>
      
            <div className="section-divider"></div>
      
            <div className="section-features-in">
              <h2 className="section-title">Features in</h2>
              <div className="features-banner">
                <img 
                    src={bannerSource} 
                    alt={`Banner for ${project.name}`} 
                    onError={(e) => e.target.src = "https://placehold.co/800x450/cccccc/000000?text=Banner+Image"}
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