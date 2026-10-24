const express = require('express');
const router = express.Router();
const Job = require('../models/Job');

// GET /api/jobs - List all jobs with optional search
router.get('/', async (req, res) => {
  try {
    const { search, skill } = req.query;
    let jobs = await Job.find({ search });

    if (skill) {
      const s = skill.toLowerCase();
      jobs = jobs.filter(j => j.skills.some(sk => sk.toLowerCase().includes(s)));
    }

    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/jobs/:id - Single job details
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/jobs - Recruiter posts a new job
router.post('/', async (req, res) => {
  try {
    const { title, company, location, salary, description, skills } = req.body;

    if (!title || !company || !location || !skills) {
      return res.status(400).json({
        success: false,
        message: 'Title, company, location, and skills are required.'
      });
    }

    const skillsArray = Array.isArray(skills)
      ? skills
      : skills.split(',').map(s => s.trim()).filter(Boolean);

    const newJob = await Job.create({
      title,
      company,
      location,
      salary: salary || 'Competitive',
      description: description || '',
      skills: skillsArray
    });

    res.status(201).json({
      success: true,
      message: 'Job posted successfully!',
      data: newJob
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/jobs/seed - Reset / populate sample jobs
router.post('/seed', async (req, res) => {
  try {
    const sampleJobs = [
      {
        title: 'Full Stack MERN Developer',
        company: 'NextGen Solutions',
        location: 'Chennai, Tamil Nadu (Hybrid)',
        salary: '₹6,00,000 - ₹10,00,000 / yr',
        description: 'Looking for a full stack developer skilled in React, Node.js, Express, and MongoDB. Experience in building scalable REST APIs.',
        skills: ['React', 'Node', 'Express', 'MongoDB', 'JavaScript']
      },
      {
        title: 'Python Backend & Data Engineer',
        company: 'Apex Data Labs',
        location: 'Bangalore, Karnataka (Remote)',
        salary: '₹8,00,000 - ₹14,00,000 / yr',
        description: 'Seeking Python engineers to build high-throughput data processing microservices, text parsers, and Flask APIs.',
        skills: ['Python', 'Flask', 'Docker', 'REST API', 'SQL']
      },
      {
        title: 'Frontend React Developer',
        company: 'PixelCraft Studios',
        location: 'Coimbatore, Tamil Nadu (Onsite)',
        salary: '₹4,50,000 - ₹7,50,000 / yr',
        description: 'Modern frontend engineer needed for responsive dashboard creation, state management, and seamless backend integration.',
        skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind']
      }
    ];

    const seeded = await Job.seed(sampleJobs);
    res.json({ success: true, message: 'Database seeded with sample jobs', count: seeded.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
