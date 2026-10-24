import React, { useState } from 'react';

const PHP_FEEDBACK_URL = (import.meta.env.VITE_PHP_URL || 'http://127.0.0.1:8000') + '/feedback.php';

export default function ContactModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    type: 'applicant_inquiry'
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch(PHP_FEEDBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.success) {
        setStatusMsg({ type: 'success', text: data.message });
        setFormData({ name: '', email: '', message: '', type: 'applicant_inquiry' });
      } else {
        setStatusMsg({ type: 'error', text: data.message });
      }
    } catch (err) {
      setStatusMsg({
        type: 'error',
        text: `Could not connect to PHP feedback service on port 8000. (${err.message})`
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Contact & Feedback</h3>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>
          This form is processed by the PHP backend endpoint (<code>feedback.php</code>) demonstrating form sanitization, email validation, and logging.
        </p>

        {statusMsg && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '14px',
              background: statusMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: statusMsg.type === 'success' ? '#15803d' : '#991b1b'
            }}
          >
            {statusMsg.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Senthil Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Your Email *</label>
            <input
              type="email"
              required
              placeholder="senthil@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Inquiry Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="applicant_inquiry">Job Applicant Query</option>
              <option value="recruiter_feedback">Recruiter Feedback</option>
              <option value="bug_report">System Bug Report</option>
            </select>
          </div>

          <div className="form-group">
            <label>Message *</label>
            <textarea
              rows="4"
              required
              placeholder="Write your message or inquiry..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            ></textarea>
          </div>

          <button type="submit" className="btn-apply" disabled={submitting}>
            {submitting ? 'Sending via PHP...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}
