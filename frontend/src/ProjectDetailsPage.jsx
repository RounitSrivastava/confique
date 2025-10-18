import React, { useState } from 'react';
import './Showcase.css';
// Ensure all necessary Lucide icons are imported
import { ArrowLeft, ExternalLink, MessageSquare, ArrowRight } from 'lucide-react'; 

// --- Configuration ---
// Set the initial limit to 1 comment
const INITIAL_VISIBLE_LIMIT = 1;

// Dummy Comments Data 
const DUMMY_COMMENTS = [
  { id: 1, user: 'Aayush Sharma', avatar: 'https://placehold.co/30x30/FFA500/000000?text=AS', text: 'For the first time an event of this scale is being hosted in Cuttack,Bhubaneswar marking a new milestone for the region\'s gaming culture', timestamp: '13/9/2025 at 01:32 pm' },
  { id: 2, user: 'Aayush Sharma', avatar: 'https://placehold.co/30x30/FFA500/000000?text=AS', text: 'really nice initiative', timestamp: '13/9/2025 at 01:33 pm' },
  // Additional dummy comments to ensure the 'More comments' button appears
  { id: 3, user: 'Priya D.', avatar: 'https://placehold.co/30x30/808080/FFFFFF?text=PD', text: 'This is a game-changer! Great analysis of the market need.', timestamp: '17/10/2025 at 02:00 pm' },
  { id: 4, user: 'Rajiv K.', avatar: 'https://placehold.co/30x30/808080/FFFFFF?text=RK', text: 'I love the design concepts you shared in the description.', timestamp: '17/10/2025 at 02:15 pm' },
];

// Comment Section Component
const CommentSection = ({ initialComments = [], onNewComment }) => {
  const [comments, setComments] = useState(DUMMY_COMMENTS);
  const [newCommentText, setNewCommentText] = useState('');
  // State tracks the number of comments currently visible
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_LIMIT);

  const handlePostComment = () => {
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
      user: 'Current User', 
      avatar: 'https://placehold.co/30x30/3498db/FFFFFF?text=U',
      text: newCommentText.trim(),
      timestamp: formattedTime,
    };

    setComments([newComment, ...comments]); 
    
    // If the comment list was collapsed, expand the view by 1 to include the new post.
    if (visibleCount < comments.length) {
        setVisibleCount(prev => prev + 1);
    }
    
    setNewCommentText('');
    onNewComment();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handlePostComment();
    }
  };
  
  const handleLoadMore = () => {
    // Set to show all comments
    setVisibleCount(comments.length);
  };
  
  const handleCollapseComments = () => {
    // Reset to show only the initial limit
    setVisibleCount(INITIAL_VISIBLE_LIMIT);
  };
  
  // Derivations for rendering
  const isExpanded = visibleCount === comments.length && comments.length > INITIAL_VISIBLE_LIMIT;
  const displayedComments = comments.slice(0, visibleCount);
  const commentsToHide = comments.length - visibleCount;
  const showLoadMoreButton = comments.length > INITIAL_VISIBLE_LIMIT && visibleCount < comments.length;

  return (
    <div className="comment-section-wrapper">
      <div className="comment-header-bar">
        {/* BACK ARROW LOGIC: Show if the view is expanded. Clicks collapse the view. */}
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
          placeholder="Add a comment..."
          className="comment-input-field"
          onKeyDown={handleKeyDown}
        />
        <button 
            type="button" 
            className="post-comment-btn-replicate" 
            onClick={handlePostComment} 
            disabled={newCommentText.trim() === ''}
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

        {/* --- Load More Button Logic --- */}
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

// Main Project Details Page Component 
const ProjectDetailsPage = ({ project, onGoBack }) => {
    // --- STATE FOR UPVOTING ---
    const [upvotes, setUpvotes] = useState(project.upvotes);
    const [isUpvoted, setIsUpvoted] = useState(false); // Assume not upvoted initially
    
    const [localComments, setLocalComments] = useState(DUMMY_COMMENTS);
    const [commentCount, setCommentCount] = useState(project.comments + localComments.length);
    
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

    const handleUpvote = () => {
        // Toggle the upvote status and update the count
        if (isUpvoted) {
            setUpvotes(prev => prev - 1);
        } else {
            setUpvotes(prev => prev + 1);
        }
        setIsUpvoted(prev => !prev);
        // In a real application, this would trigger an API call.
    };

    const handleVisitWebsite = () => {
        if (project.websiteLink) {
            window.open(project.websiteLink, '_blank');
        }
    };
    
    // Handler for clicking 'Comment' in the metadata (now unused)
    const handleComment = () => {
        document.querySelector('.comment-section-wrapper')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleNewCommentPosted = () => {
        setCommentCount(prev => prev + 1);
    };

    return (
        <div className="project-details-container">
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
                className={`project-upvote-btn ${isUpvoted ? 'upvoted' : ''}`}
                onClick={handleUpvote}
              >
                {isUpvoted ? `Upvoted` : `Upvote`}
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
              <button className="meta-link-btn" onClick={handleVisitWebsite}>
                <ExternalLink size={16} /> Visit Website
              </button>
            </div>
      
            <div className="section-divider"></div>

            <div className="section-upvoters">
              <h2 className="section-title">{upvotes} Upvoters</h2> 
              <div className="upvoters-list">
                {project.upvoters?.slice(0, 7).map((upvoter, index) => (
                  <img key={index} src={upvoter.avatar} alt="Upvoter" className="upvoter-avatar" />
                ))}
                {project.upvoters && project.upvoters.length > 7 && (
                  <button className="view-more-btn">View more</button>
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
                {/* FIX: Use uploaded banner URL if available, otherwise fall back */}
                <img 
                    src={project.banner || project.bannerUrl || "https://assets.website-files.com/62c93d9b418a09618b6e6cf1/62d85b19c6e5a4f48348b47e_Hero%20Bg.png"} 
                    alt="Features Banner" 
                />
              </div>
            </div>

            <div className="section-divider"></div>
            
            <CommentSection 
              initialComments={localComments}
              onNewComment={handleNewCommentPosted}
            />

        </div>
    );
};

export default ProjectDetailsPage;