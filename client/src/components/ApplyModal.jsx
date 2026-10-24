import React, { useState } from 'react';

const PHP_UPLOAD_URL = 'http://127.0.0.1:8000/upload.php';
const EXPRESS_API_URL = 'http://127.0.0.1:5000/api/applications';

export default function ApplyModal({ job, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [file, setFile] = useState(null);
  const [step, setStep] = useState('idle'); // 'idle' | 'uploading_php' | 'matching_express' | 'done' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [resultData, setResultData] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Client-side quick check
    if (selected.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please select a smaller resume.');
      e.target.value = null;
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a resume file (PDF, DOC, DOCX, or TXT).');
      return;
    }

    setErrorMessage('');
    setStep('uploading_php');

    try {
      // ----------------------------------------------------
      // STEP 1: Upload resume to PHP Microservice (upload.php)
      // ----------------------------------------------------
      const uploadFormData = new FormData();
      uploadFormData.append('resume', file);

      let uploadRes;
      let uploadJson;

      try {
        uploadRes = await fetch(PHP_UPLOAD_URL, {
          method: 'POST',
          body: uploadFormData
        });
        uploadJson = await uploadRes.json();
      } catch (phpErr) {
        throw new Error(
          `PHP upload service is offline on port 8000. Start it with 'php -S 127.0.0.1:8000' in php-service directory. (${phpErr.message})`
        );
      }

      if (!uploadRes.ok || !uploadJson.success) {
        throw new Error(uploadJson.message || 'PHP file upload validation failed.');
      }

      const uploadedPath = uploadJson.data.relativePath;
      const uploadedFileName = uploadJson.data.fileName;

      // ----------------------------------------------------
      // STEP 2: Submit Application to Express Core Backend
      // (Express triggers Python /match for skill extraction & scoring)
      // ----------------------------------------------------
      setStep('matching_express');

      const appPayload = {
        jobId: job._id,
        candidateName: formData.name,
        candidateEmail: formData.email,
        candidatePhone: formData.phone,
        resumePath: uploadedPath,
        resumeFileName: uploadedFileName
      };

      const expressRes = await fetch(EXPRESS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appPayload)
      });

      const expressJson = await expressRes.json();

      if (!expressRes.ok || !expressJson.success) {
        throw new Error(expressJson.message || 'Failed to submit application to Express API.');
      }

      setResultData(expressJson);
      setStep('done');
      if (onSuccess) onSuccess();
    } catch (err) {
      setStep('error');
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Apply for Position</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
              {job.title} at <strong style={{ color: '#1e293b' }}>{job.company}</strong>
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            &times;
          </button>
        </div>

        {step === 'done' ? (
          <div>
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎉</div>
              <h4 style={{ fontSize: '1.2rem', color: '#15803d', fontWeight: '700' }}>
                Application Submitted!
              </h4>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Your resume was processed by the PHP upload validator and scored by the Python matching engine.
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', margin: '14px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Resume Match Score:</span>
                <span
                  className={`score-badge ${
                    resultData?.data?.matchPercentage >= 70
                      ? 'score-high'
                      : resultData?.data?.matchPercentage >= 40
                      ? 'score-mid'
                      : 'score-low'
                  }`}
                  style={{ fontSize: '1rem' }}
                >
                  {resultData?.data?.matchPercentage}% Match
                </span>
              </div>

              {resultData?.data?.matchedSkills?.length > 0 && (
                <div style={{ marginBottom: '8px', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#166534' }}>Matched Skills: </strong>
                  {resultData.data.matchedSkills.map((s, i) => (
                    <span key={i} className="matched-pill">✓ {s}</span>
                  ))}
                </div>
              )}

              {resultData?.data?.missingSkills?.length > 0 && (
                <div style={{ fontSize: '0.85rem' }}>
                  <strong style={{ color: '#991b1b' }}>Missing Skills: </strong>
                  {resultData.data.missingSkills.map((s, i) => (
                    <span key={i} className="missing-pill">✗ {s}</span>
                  ))}
                </div>
              )}
            </div>

            <button className="btn-apply" onClick={onClose} style={{ marginTop: '10px' }}>
              Back to Job Portal
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Karthik Selvam"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                required
                placeholder="karthik@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Upload Resume (PDF, DOC, DOCX, TXT) *</label>
              <input
                type="file"
                required
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
              />
              <div className="form-hint">
                🔒 Handled by PHP with MIME type check, extension whitelist, and size limit (Max 5MB).
              </div>
            </div>

            {/* Microservice Architecture Stepper */}
            <div className="flow-tracker">
              <div className={`flow-step ${step === 'uploading_php' ? 'active' : step === 'matching_express' || step === 'done' ? 'done' : ''}`}>
                <span>{step === 'uploading_php' ? '⏳' : step === 'matching_express' || step === 'done' ? '✅' : '⚪'}</span>
                <span>1. Upload & validate file via PHP <code>upload.php</code></span>
              </div>
              <div className={`flow-step ${step === 'matching_express' ? 'active' : step === 'done' ? 'done' : ''}`}>
                <span>{step === 'matching_express' ? '⏳' : step === 'done' ? '✅' : '⚪'}</span>
                <span>2. Express calls Python <code>/match</code> for keyword scoring & saves to DB</span>
              </div>
            </div>

            {errorMessage && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '14px' }}>
                ⚠️ {errorMessage}
              </div>
            )}

            <button
              type="submit"
              className="btn-apply"
              disabled={step === 'uploading_php' || step === 'matching_express'}
            >
              {step === 'uploading_php'
                ? 'Validating & Uploading via PHP...'
                : step === 'matching_express'
                ? 'Scoring Resume via Python Engine...'
                : 'Submit Application →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
