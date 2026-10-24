import React from 'react';

export default function Navbar({ activeTab, setActiveTab, onOpenFeedback }) {
  return (
    <header className="navbar">
      <div className="container nav-container">
        <div className="brand">
          <span>💼 WorkFlow Portal</span>
          <span className="brand-badge">Resume Match AI</span>
        </div>

        <nav className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'candidate' ? 'active' : ''}`}
            onClick={() => setActiveTab('candidate')}
          >
            🔍 Candidate View
          </button>
          <button
            className={`tab-btn ${activeTab === 'recruiter' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruiter')}
          >
            🏢 Recruiter Dashboard
          </button>
          <button
            className="feedback-btn"
            onClick={onOpenFeedback}
            title="PHP Feedback Handler"
          >
            💬 Contact / Feedback
          </button>
        </nav>
      </div>
    </header>
  );
}
