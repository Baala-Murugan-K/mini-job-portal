import React, { useState } from 'react';

const FILTER_PILLS = ['All', 'React', 'Node', 'Python', 'MongoDB', 'JavaScript', 'Docker'];

export default function JobList({ jobs, onApply, loading, onSeedJobs }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter =
      selectedFilter === 'All' ||
      job.skills?.some((s) => s.toLowerCase() === selectedFilter.toLowerCase());

    const term = searchTerm.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(term) ||
      job.company.toLowerCase().includes(term) ||
      job.skills?.some((s) => s.toLowerCase().includes(term));

    return matchesFilter && matchesSearch;
  });

  return (
    <div>
      <div className="search-box-wrap">
        <input
          type="text"
          className="search-input"
          placeholder="Search jobs by title, company, or tech stack (e.g. React, Node, Python)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="filter-tags">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill}
            className={`skill-pill ${selectedFilter === pill ? 'active' : ''}`}
            onClick={() => setSelectedFilter(pill)}
          >
            {pill}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading latest opportunities...
        </p>
      ) : filteredJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <p style={{ color: '#64748b', marginBottom: '14px' }}>No jobs match your criteria.</p>
          <button className="tab-btn active" onClick={onSeedJobs}>
            🔄 Load Sample Jobs
          </button>
        </div>
      ) : (
        <div className="job-grid">
          {filteredJobs.map((job) => (
            <div key={job._id} className="job-card">
              <div>
                <div className="job-company">{job.company}</div>
                <h3 className="job-title">{job.title}</h3>
                <div className="job-meta">
                  <span>📍 {job.location}</span>
                  <span>💰 {job.salary}</span>
                </div>
                <p className="job-desc">{job.description}</p>
                <div className="job-skills">
                  {job.skills?.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="btn-apply"
                onClick={() => onApply(job)}
              >
                Apply for this Position →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
