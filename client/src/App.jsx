import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import JobList from './components/JobList';
import ApplyModal from './components/ApplyModal';
import RecruiterDashboard from './components/RecruiterDashboard';
import ContactModal from './components/ContactModal';

const EXPRESS_BASE_URL = import.meta.env.VITE_EXPRESS_URL || 'http://127.0.0.1:5000';

export default function App() {
  const [activeTab, setActiveTab] = useState('candidate'); // 'candidate' | 'recruiter'
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingJob, setApplyingJob] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${EXPRESS_BASE_URL}/api/jobs`);
      const json = await res.json();
      if (json.success) {
        setJobs(json.data);
      }
    } catch (err) {
      console.warn('Backend offline or unreachable, using default demo jobs.');
    } finally {
      setLoading(false);
    }
  };

  const seedJobs = async () => {
    try {
      const res = await fetch(`${EXPRESS_BASE_URL}/api/jobs/seed`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast('Sample jobs loaded successfully!');
        fetchJobs();
      }
    } catch (err) {
      showToast('Could not seed jobs: Express server offline');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return (
    <div>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenFeedback={() => setShowFeedbackModal(true)}
      />

      <section className="hero">
        <div className="container">
          <h1>Mini Job Portal with Resume Matcher</h1>
          <p>
            Seamless end-to-end recruitment platform combining React, PHP file validation,
            Express REST APIs, Python keyword extraction, and MongoDB.
          </p>

          <div className="architecture-banner">
            <div className="arch-tag">⚛️ React <span>(Candidate & Recruiter UI)</span></div>
            <div className="arch-tag">🐘 PHP <span>(MIME & Secure File Upload)</span></div>
            <div className="arch-tag">🟢 Node + Express <span>(REST API & Flow Control)</span></div>
            <div className="arch-tag">🐍 Python <span>(Resume Text & Skill Match)</span></div>
            <div className="arch-tag">🍃 MongoDB <span>(Jobs & Applicant DB)</span></div>
          </div>
        </div>
      </section>

      <main className="container" style={{ minHeight: '600px', paddingBottom: '60px' }}>
        {activeTab === 'candidate' ? (
          <JobList
            jobs={jobs}
            loading={loading}
            onApply={(job) => setApplyingJob(job)}
            onSeedJobs={seedJobs}
          />
        ) : (
          <RecruiterDashboard
            jobs={jobs}
            onJobCreated={() => {
              showToast('Job opening published!');
              fetchJobs();
            }}
          />
        )}
      </main>

      {/* Apply Modal */}
      {applyingJob && (
        <ApplyModal
          job={applyingJob}
          onClose={() => setApplyingJob(null)}
          onSuccess={() => {
            showToast('Application & Match score recorded!');
            fetchJobs();
          }}
        />
      )}

      {/* Contact / Feedback Modal (PHP Service) */}
      {showFeedbackModal && (
        <ContactModal onClose={() => setShowFeedbackModal(false)} />
      )}

      {/* Alert Toast Notification */}
      {toast && <div className="alert-toast">🔔 {toast}</div>}
    </div>
  );
}
