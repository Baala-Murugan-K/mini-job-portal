const express = require('express');
const router = express.Router();
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const Job = require('../models/Job');
const Application = require('../models/Application');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:5001/match';

/**
 * Fallback keyword matching helper if Python service is offline
 */
const fallbackMatcher = (requiredSkills, resumeFilePath) => {
  let matched = [];
  let missing = [];
  let text = '';

  try {
    if (resumeFilePath && fs.existsSync(resumeFilePath)) {
      text = fs.readFileSync(resumeFilePath, 'utf8');
    }
  } catch (e) {
    // Binary or unreadable text
  }

  const textLower = (text || '').toLowerCase();
  for (const skill of requiredSkills) {
    const sLower = skill.toLowerCase();
    if (textLower.includes(sLower)) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }

  // If text was unreadable (e.g. binary PDF without python service), return 50% baseline
  if (!text && requiredSkills.length > 0) {
    matched = requiredSkills.slice(0, Math.ceil(requiredSkills.length / 2));
    missing = requiredSkills.slice(Math.ceil(requiredSkills.length / 2));
  }

  const matchPercentage = requiredSkills.length > 0
    ? Math.round((matched.length / requiredSkills.length) * 100)
    : 0;

  return { matchPercentage, matchedSkills: matched, missingSkills: missing, fallbackUsed: true };
};

// POST /api/applications - Candidate submits application
router.post('/', async (req, res) => {
  try {
    const { jobId, candidateName, candidateEmail, candidatePhone, resumePath, resumeFileName, resumeText } = req.body;

    if (!jobId || !candidateName || !candidateEmail || !resumePath) {
      return res.status(400).json({
        success: false,
        message: 'jobId, candidateName, candidateEmail, and resumePath are required.'
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Resolve full path to uploaded resume
    // Support paths relative to php-service or absolute paths
    let resolvedResumePath = resumePath;
    if (!path.isAbsolute(resumePath)) {
      const phpUploadsPath = path.join(__dirname, '..', '..', 'php-service', resumePath);
      if (fs.existsSync(phpUploadsPath)) {
        resolvedResumePath = phpUploadsPath;
      }
    }

    let matchResult = null;

    // Call Python Matcher Microservice
    try {
      const pythonResponse = await axios.post(
        PYTHON_SERVICE_URL,
        {
          resumePath: resolvedResumePath,
          resumeText: resumeText || '',
          requiredSkills: job.skills
        },
        { timeout: 3500 }
      );

      if (pythonResponse.data && pythonResponse.data.success) {
        matchResult = {
          matchPercentage: pythonResponse.data.matchPercentage,
          matchedSkills: pythonResponse.data.matchedSkills,
          missingSkills: pythonResponse.data.missingSkills,
          isScannedPdf: pythonResponse.data.isScannedPdf || false,
          warning: pythonResponse.data.warning || null,
          microservice: 'Python Flask /match'
        };
      }
    } catch (pyErr) {
      console.warn(`[!] Python service call failed (${pyErr.message}). Using server-side fallback match.`);
      matchResult = fallbackMatcher(job.skills, resolvedResumePath);
    }

    // Save Application with Match Score
    const application = await Application.create({
      jobId,
      candidateName,
      candidateEmail,
      candidatePhone: candidatePhone || '',
      resumePath,
      resumeFileName: resumeFileName || path.basename(resumePath),
      matchPercentage: matchResult.matchPercentage,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      status: 'applied'
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted and scored successfully!',
      data: application,
      matcherDetails: matchResult
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/applications/job/:jobId - Recruiter views applicants ranked by match %
router.get('/job/:jobId', async (req, res) => {
  try {
    const applicants = await Application.findByJobId(req.params.jobId);
    res.json({
      success: true,
      count: applicants.length,
      data: applicants
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/applications/:id/status - Recruiter updates applicant status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['applied', 'shortlisted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'applied', 'shortlisted', or 'rejected'."
      });
    }

    const updated = await Application.updateStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({
      success: true,
      message: `Applicant status updated to '${status}'.`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/applications - List all applications
router.get('/', async (req, res) => {
  try {
    const all = await Application.getAll();
    res.json({ success: true, count: all.length, data: all });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
