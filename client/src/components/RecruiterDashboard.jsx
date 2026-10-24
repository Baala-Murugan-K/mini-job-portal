import React, { useState, useEffect } from 'react';

const EXPRESS_BASE_URL = import.meta.env.VITE_EXPRESS_URL || 'http://127.0.0.1:5000';

export default function RecruiterDashboard({ jobs, onJobCreated }) {
  const [selectedJob, setSelectedJob] = useState(jobs[0] || null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    skills: '',
    description: ''
  });
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState('');

  // When jobs prop updates, ensure selectedJob is set
  useEffect(() => {
    if (!selectedJob && jobs.length > 0) {
      setSelectedJob(jobs[0]);
    }
  }, [jobs]);

  // Fetch applicants whenever selectedJob changes
  useEffect(() => {
    if (selectedJob && selectedJob._id) {
      fetchApplicants(selectedJob._id);
    }
  }, [selectedJob]);

  const fetchApplicants = async (jobId) => {
    setLoadingApplicants(true);
    try {
      const res = await fetch(`${EXPRESS_BASE_URL}/api/applications/job/${jobId}`);
      const json = await res.json();
      if (json.success) {
        setApplicants(json.data);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setPosting(true);
    setPostMsg('');

    try {
      const res = await fetch(`${EXPRESS_BASE_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      });
      const data = await res.json();

      if (data.success) {
        setPostMsg('✅ Job posted successfully!');
        setNewJob({
          title: '',
          company: '',
          location: '',
          salary: '',
          skills: '',
          description: ''
        });
        if (onJobCreated) onJobCreated();
      } else {
        setPostMsg(`⚠️ ${data.message}`);
      }
    } catch (err) {
      setPostMsg(`⚠️ Failed to connect to server: ${err.message}`);
    } finally {
      setPosting(false);
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      const res = await fetch(`${EXPRESS_BASE_URL}/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        setApplicants((prev) =>
          prev.map((a) => (a._id === appId ? { ...a, status: newStatus } : a))
        );
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="recruiter-container">
      <div className="recruiter-grid">
        {/* Left Column: Post Job Form & Job Selector */}
        <div>
          <div className="panel" style={{ marginBottom: '20px' }}>
            <h3 className="panel-title">Post a New Job</h3>
            {postMsg && (
              <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>{postMsg}</div>
            )}
            <form onSubmit={handleCreateJob}>
              <div className="form-group">
                <label>Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backend Node.js Developer"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zoho Corp"
                  value={newJob.company}
                  onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chennai, Tamil Nadu (Remote)"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Salary Range</label>
                <input
                  type="text"
                  placeholder="e.g. ₹8,00,000 - ₹12,00,000 / yr"
                  value={newJob.salary}
                  onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Required Skills (comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, Node, Express, MongoDB, Python"
                  value={newJob.skills}
                  onChange={(e) => setNewJob({ ...newJob, skills: e.target.value })}
                />
                <div className="form-hint">
                  Used by Python matcher to compute resume match %.
                </div>
              </div>

              <div className="form-group">
                <label>Job Description</label>
                <textarea
                  rows="3"
                  placeholder="Brief role expectations..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn-apply"
                disabled={posting}
                style={{ marginTop: '6px' }}
              >
                {posting ? 'Publishing...' : '+ Publish Job Opening'}
              </button>
            </form>
          </div>

          <div className="panel">
            <h4 className="panel-title">Active Job Openings ({jobs.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {jobs.map((j) => (
                <div
                  key={j._id}
                  onClick={() => setSelectedJob(j)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedJob?._id === j._id ? '#eff6ff' : '#f8fafc',
                    border:
                      selectedJob?._id === j._id
                        ? '1px solid #bfdbfe'
                        : '1px solid #e2e8f0',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{j.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{j.company}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Applicants Ranked by Match % */}
        <div>
          <div className="panel">
            <div className="panel-title">
              <div>
                <span>Applicants Ranked by Match Score</span>
                {selectedJob && (
                  <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '400', marginTop: '2px' }}>
                    Viewing candidates for: <strong>{selectedJob.title}</strong>
                  </p>
                )}
              </div>
              <button
                onClick={() => selectedJob && fetchApplicants(selectedJob._id)}
                className="tab-btn"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                🔄 Refresh
              </button>
            </div>

            {loadingApplicants ? (
              <p style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                Loading applicants...
              </p>
            ) : applicants.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                <p>No applicants yet for this position.</p>
                <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                  Switch to Candidate View to submit an application with a sample resume!
                </p>
              </div>
            ) : (
              <div>
                {applicants.map((app) => (
                  <div key={app._id} className="applicant-card">
                    <div className="applicant-header">
                      <div>
                        <strong style={{ fontSize: '1.05rem', color: '#0f172a' }}>
                          {app.candidateName}
                        </strong>
                        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                          ✉️ {app.candidateEmail} {app.candidatePhone ? `| 📞 ${app.candidatePhone}` : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className={`score-badge ${
                            app.matchPercentage >= 70
                              ? 'score-high'
                              : app.matchPercentage >= 40
                              ? 'score-mid'
                              : 'score-low'
                          }`}
                        >
                          {app.matchPercentage}% Match
                        </span>

                        <span className={`status-badge status-${app.status}`}>
                          {app.status}
                        </span>
                      </div>
                    </div>

                    <div className="skills-breakdown">
                      {app.matchedSkills?.length > 0 && (
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{ color: '#166534', fontWeight: '600' }}>Matched: </span>
                          {app.matchedSkills.map((sk, i) => (
                            <span key={i} className="matched-pill">✓ {sk}</span>
                          ))}
                        </div>
                      )}

                      {app.missingSkills?.length > 0 && (
                        <div>
                          <span style={{ color: '#991b1b', fontWeight: '600' }}>Missing: </span>
                          {app.missingSkills.map((sk, i) => (
                            <span key={i} className="missing-pill">✗ {sk}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        📄 Resume: <strong>{app.resumeFileName}</strong>{' '}
                        <a
                          href={`${EXPRESS_BASE_URL}/uploads/${app.resumeFileName}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#2563eb', marginLeft: '6px', textDecoration: 'none', fontWeight: '600' }}
                        >
                          View File ↗
                        </a>
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleStatusChange(app._id, 'shortlisted')}
                          style={{
                            padding: '4px 10px',
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #bbf7d0',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: '600'
                          }}
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleStatusChange(app._id, 'rejected')}
                          style={{
                            padding: '4px 10px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: '600'
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
