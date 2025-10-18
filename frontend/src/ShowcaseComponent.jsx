import React, { useState, useEffect } from 'react';
import './Showcase.css';
import { ChevronDown, Search, X, Image as ImageIcon, ThumbsUp } from 'lucide-react';
import ProjectDetailsPage from './ProjectDetailsPage'; 

// IMPORT YOUR BANNER IMAGE HERE
import StartupBanner from './assets/Screenshot 2025-10-17 233807.png'; 

// === AddIdeaModal Component (Unchanged from previous revision) ===
const AddIdeaModal = ({ isOpen, onClose, onSubmit, activeMonth }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    websiteLink: '',
    launchedDate: new Date().toISOString().substring(0, 10), 
    logoUrl: '',
    bannerUrl: '',
    fullDescription: '', 
  });

  const [validationError, setValidationError] = useState('');

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

    if (!formData.logoUrl) {
      setValidationError('Please upload an Idea Logo. It is mandatory.');
      return;
    }
    if (!formData.bannerUrl) {
      setValidationError('Please upload a Banner Image. It is mandatory.');
      return;
    }

    onSubmit({
      ...formData,
      month: activeMonth,
    });
    onClose();
    
    setFormData({
      title: '',
      description: '',
      websiteLink: '',
      launchedDate: new Date().toISOString().substring(0, 10),
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
              rows="3"
              required
            ></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Full Description (for details page)</label>
            <textarea
              name="fullDescription"
              value={formData.fullDescription}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Provide a detailed explanation of your idea, concept, and target market."
              rows="5"
              required
            ></textarea>
          </div>
          <div className="form-group-flex">
              <div className="form-group flex-half"> 
                <label className="form-label">Launched On Date</label>
                <input
                    type="date"
                    name="launchedDate"
                    value={formData.launchedDate}
                    onChange={handleChange}
                    className="form-input"
                />
              </div>
              
              <div className="form-group flex-half">
                <label className="form-label">Website Link</label>
                <input
                    type="url"
                    name="websiteLink"
                    value={formData.websiteLink}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="https://www.your-idea.com"
                />
              </div>
          </div>
          
          {validationError && (
            <div className="validation-error-message">
              ⚠️ {validationError}
            </div>
          )}

          <div className="form-group-flex">
            <div className="form-group">
              <label className="form-label">Idea Logo * (Required)</label>
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
              <label className="form-label">Banner Image * (Required)</label>
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
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Submit Idea</button>
          </div>
        </form>
      </div>
    </div>
  );
};
// End of AddIdeaModal

// === StartupCard Component (Modified for "Coming Soon") ===
const StartupCard = ({ idea, onSelectIdea }) => {
    // 💡 NEW LOGIC: Check if the launchedDate is in the future
    const isComingSoon = idea.launchedDate && (new Date(idea.launchedDate) > new Date().setHours(0, 0, 0, 0));

  return (
    <div className="startup-card" onClick={() => onSelectIdea(idea)}>
      <div className="card-content">
        <img src={idea.logo} alt={`${idea.name} logo`} className="card-logo" />
        <div className="card-details">
          <h3 className="card-title">{idea.name}</h3>
          <p className="card-description">{idea.description}</p>
            {/* 💡 NEW ELEMENT: Display "Coming Soon" badge */}
            {isComingSoon && (
                <span className="coming-soon-badge">🚀 Coming Soon</span>
            )}
        </div>
      </div>
      <div className="card-upvote">
        <ThumbsUp size={20} className="upvote-icon" />
        <span className="upvote-count">{idea.upvotes}</span>
      </div>
    </div>
  );
};

// === DUMMY_IDEAS Data (Unchanged - Note: Dates are in the past to show launched) ===
const DUMMY_IDEAS = [
    // ... (Dummy Ideas are the same, they mostly have past dates)
  {
    id: '1',
    logo: 'https://placehold.co/40x40/0A73D3/FFFFFF?text=JA',
    name: 'JanArogya: The End-to-End Primary Health Platform.',
    description: 'Complete Primary Care. Brought to Your D ...',
    upvotes: 13,
    month: 'October \'25',
    websiteLink: 'https://www.janarogya.com',
    launchedDate: '2025-09-15', // Using YYYY-MM-DD format for consistency
    comments: 5,
    creator: { name: 'Priya Sharma', role: 'Founder', avatar: 'https://placehold.co/40x40/3498db/FFFFFF?text=PS' },
    upvoters: [{ avatar: 'https://placehold.co/20x20/2ecc71/FFFFFF?text=U1' }, { avatar: 'https://placehold.co/20x20/e74c3c/FFFFFF?text=U2' }, { avatar: 'https://placehold.co/20x20/f39c12/FFFFFF?text=U3' }],
    fullDescription: "JanArogya aims to revolutionize primary healthcare in rural and semi-urban India through a full-stack digital platform. We connect patients with verified doctors for tele-consultations, deliver medicines, and manage follow-up care, all through a simple mobile app. Our mission is to make quality healthcare accessible and affordable to the last mile.",
  },
  {
    id: '2',
    logo: 'https://placehold.co/40x40/28A745/FFFFFF?text=FV',
    name: 'FreshVan',
    description: 'Vegetable Subscription Business Model',
    upvotes: 21,
    month: 'October \'25',
    websiteLink: 'https://www.freshvan.in',
    launchedDate: '2025-10-01',
    comments: 12,
    creator: { name: 'Rajiv Mehra', role: 'Co-Founder', avatar: 'https://placehold.co/40x40/27ae60/FFFFFF?text=RM' },
    upvoters: [{ avatar: 'https://placehold.co/20x20/9b59b6/FFFFFF?text=V1' }, { avatar: 'https://placehold.co/20x20/34495e/FFFFFF?text=V2' }, { avatar: 'https://placehold.co/20x20/1abc9c/FFFFFF?text=V3' }, { avatar: 'https://placehold.co/20x20/f1c40f/FFFFFF?text=V4' }, { avatar: 'https://placehold.co/20x20/d35400/FFFFFF?text=V5' }],
    fullDescription: "FreshVan delivers farm-fresh, organically grown vegetables directly to your doorstep via a weekly subscription model. We cut out the middleman, ensuring fairer prices for farmers and fresher produce for consumers. Our app allows customers to customize their weekly basket and pause deliveries easily.",
  },
    // **EXAMPLE OF A COMING SOON IDEA (Date in the future)**
    {
        id: '99',
        logo: 'https://placehold.co/40x40/000000/FFFFFF?text=FS',
        name: 'FutureStream: AI Video Generation',
        description: 'Generate high-quality videos from text prompts.',
        upvotes: 42,
        month: 'October \'25',
        websiteLink: 'https://www.futurestream.ai',
        launchedDate: '2025-11-20', // This date is in the future
        comments: 20,
        creator: { name: 'Alex Lee', role: 'Innovator', avatar: 'https://placehold.co/40x40/8e44ad/FFFFFF?text=AL' },
        upvoters: [],
        fullDescription: "FutureStream harnesses cutting-edge generative AI to let users create professional video content instantly from a simple text description. Say goodbye to complex editing software and lengthy production times.",
    },
    // ... (rest of the dummy ideas)
    {
    id: '3',
    logo: 'https://placehold.co/40x40/DC3545/FFFFFF?text=MDW',
    name: 'My DawaiWala (MDW)',
    description: 'India\'s Health First Full-Stack Healthcare Platform',
    upvotes: 20,
    month: 'September \'25',
    websiteLink: 'https://www.mydawaiwala.com',
    launchedDate: '2025-09-10',
    comments: 8,
    creator: { name: 'Amit Singh', role: 'CEO', avatar: 'https://placehold.co/40x40/e67e22/FFFFFF?text=AS' },
    upvoters: [{ avatar: 'https://placehold.co/20x20/7f8c8d/FFFFFF?text=W1' }, { avatar: 'https://placehold.co/20x20/c0392b/FFFFFF?text=W2' }],
    fullDescription: "My DawaiWala (MDW) is an integrated platform for prescription management, medicine delivery, and lab tests. We aim to be the most trusted healthcare partner by leveraging AI to ensure prescription accuracy and providing 24/7 customer support for all health needs.",
  },
  {
    id: '4',
    logo: 'https://placehold.co/40x40/6C757D/FFFFFF?text=ATB',
    name: 'AIR TRASH BIN',
    description: 'Air-powered plastic collection system fo ....',
    upvotes: 21,
    month: 'October \'25',
    websiteLink: 'https://www.airtrashbin.org',
    launchedDate: '2025-10-20',
    comments: 15,
    creator: { name: 'Deepika Rao', role: 'Engineer', avatar: 'https://placehold.co/40x40/95a5a6/FFFFFF?text=DR' },
    upvoters: [{ avatar: 'https://placehold.co/20x20/bdc3c7/FFFFFF?text=X1' }, { avatar: 'https://placehold.co/20x20/2c3e50/FFFFFF?text=X2' }, { avatar: 'https://placehold.co/20x20/f39c12/FFFFFF?text=X3' }, { avatar: 'https://placehold.co/20x20/16a085/FFFFFF?text=X4' }],
    fullDescription: "The AIR TRASH BIN is a patented, underground, air-powered system designed for the efficient collection and sorting of plastic waste in smart cities. It reduces manual labor, improves sanitation, and uses IoT sensors to optimize collection routes, leading to a cleaner urban environment.",
  },
];

// === ShowcaseComponent (Main Component - logic updated for launchedDate) ===
const ShowcaseComponent = () => {
  const [activeMonth, setActiveMonth] = useState('October \'25');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddIdeaModalOpen, setIsAddIdeaModalOpen] = useState(false);
  const [ideas, setIdeas] = useState(DUMMY_IDEAS);

  // --- Date/Time Closure Logic ---
  // Set the deadline to October 31, 2025, 23:59:59 (local time)
  const SUBMISSION_DEADLINE = new Date('2025-10-31T23:59:59').getTime();
  
  const checkSubmissionStatus = () => {
    const now = new Date().getTime();
    return now < SUBMISSION_DEADLINE;
  };

  // Initial state checks the deadline immediately
  const [isPostingEnabled, setIsPostingEnabled] = useState(checkSubmissionStatus());

  // UseEffect to continuously check the time (every minute)
  useEffect(() => {
    if (!isPostingEnabled) {
      return; 
    }

    const intervalId = setInterval(() => {
      if (!checkSubmissionStatus()) {
        setIsPostingEnabled(false);
        clearInterval(intervalId); // Stop checking once closed
      }
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, [isPostingEnabled]);
  // -------------------------------


  // --- Details View State ---
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isDetailsView, setIsDetailsView] = useState(false);
  // --------------------------
 
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

  const handleAddIdeaSubmit = (ideaData) => {
    const newIdea = {
        ...ideaData,
        id: Date.now().toString(),
        name: ideaData.title, 
        upvotes: 0,
        logo: ideaData.logoUrl,
        banner: ideaData.bannerUrl, 
        month: activeMonth,
        launchedDate: ideaData.launchedDate, // Now correctly passed from modal
        comments: 0,
        creator: { name: 'You', role: 'Creator', avatar: 'https://placehold.co/40x40/3498db/FFFFFF?text=U' },
        upvoters: [],
    };
    setIdeas(prevIdeas => [newIdea, ...prevIdeas]);
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
            onClick={() => isPostingEnabled && setIsAddIdeaModalOpen(true)}
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
      {/* END BANNER CODE */}

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
        {filteredIdeas.length > 0 ? (
          filteredIdeas.map(idea => (
            <StartupCard key={idea.id} idea={idea} onSelectIdea={handleSelectIdea} />
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
      />
    </div>
  );
};

export default ShowcaseComponent;