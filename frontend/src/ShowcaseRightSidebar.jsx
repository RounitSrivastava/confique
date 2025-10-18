import React from 'react';
import { TrendingUp, Eye, Star } from 'lucide-react'; 

// Helper function to map the idea object from ShowcaseComponent's format
const mapIdeaToShowcaseItem = (idea) => ({
    // Use 'id' for key and tracking. New ideas use Date.now() as a string.
    id: idea.id, 
    title: idea.name,         // Maps idea.name (title) to item.title
    likes: idea.upvotes,      // Maps idea.upvotes to item.likes
    // Calculate a numerical timestamp for sorting 'Recently Added'.
    // Checks if ID is a long string (new post) or uses launchedDate (dummy data).
    timestamp: idea.id.length > 5 ? Number(idea.id) : new Date(idea.launchedDate).getTime(),
    author: idea.creator ? idea.creator.name : 'Unknown', 
    category: idea.month, 
    fullIdea: idea, // Keep the full original object for the click handler
});

const ShowcaseRightSidebar = ({ showcaseItems = [], onOpenShowcaseItem }) => {

    // 1. MAP the incoming raw ideas to the standardized structure
    const mappedItems = showcaseItems.map(mapIdeaToShowcaseItem);

    // 2. Trending Projects: Sort by 'likes' (upvotes)
    const trendingItems = [...mappedItems]
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .slice(0, 3);

    // 3. Recently Added: Sort by the numerical 'timestamp' (most recent first)
    const recentItems = [...mappedItems]
        .sort((a, b) => b.timestamp - a.timestamp) 
        .slice(0, 3);

    // Handler to pass the full original idea back to the parent for the details view
    const handleItemClick = (mappedItem) => {
        onOpenShowcaseItem(mappedItem.fullIdea);
    }

    return (
        <>
            <div className="sidebar-widget">
                <div className="widget-header">
                    <h3 className="widget-title">
                        <TrendingUp size={16} />
                        Trending Projects
                    </h3>
                </div>
                <div className="widget-content">
                    {trendingItems.length > 0 ? (
                        <div className="widget-list">
                            {trendingItems.map(item => (
                                <div
                                    key={item.id} 
                                    className="sidebar-showcase-item clickable"
                                    onClick={() => handleItemClick(item)}
                                >
                                    <h4 className="sidebar-showcase-title">{item.title}</h4>
                                    <div className="sidebar-showcase-stats">
                                        <span className="showcase-stat">
                                            <Star size={12} />
                                            {item.likes || 0} likes
                                        </span>
                                        <span className="showcase-category-small">{item.category}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-items-message">
                            <p>No trending projects yet</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="sidebar-widget">
                <div className="widget-header">
                    <h3 className="widget-title">
                        <Eye size={16} />
                        Recently Added
                    </h3>
                </div>
                <div className="widget-content">
                    {recentItems.length > 0 ? (
                        <div className="widget-list">
                            {recentItems.map(item => (
                                <div
                                    key={item.id} 
                                    className="sidebar-showcase-item clickable"
                                    onClick={() => handleItemClick(item)}
                                >
                                    <h4 className="sidebar-showcase-title">{item.title}</h4>
                                    <div className="sidebar-showcase-meta">
                                        <span className="showcase-author-small">{item.author}</span>
                                        <span className="showcase-date">
                                            {new Date(item.timestamp).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-items-message">
                            <p>No recent projects</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default ShowcaseRightSidebar;