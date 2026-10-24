const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  salary: {
    type: String,
    default: 'Competitive'
  },
  description: {
    type: String,
    default: ''
  },
  skills: {
    type: [String],
    required: [true, 'Skills array is required'],
    validate: [val => val.length > 0, 'At least one skill must be provided']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseJob = mongoose.model('Job', JobSchema);

// In-Memory store for offline/standalone demo mode
let inMemoryJobs = [
  {
    _id: 'job_1',
    title: 'Full Stack MERN Developer',
    company: 'NextGen Solutions',
    location: 'Chennai, Tamil Nadu (Hybrid)',
    salary: '₹6,00,000 - ₹10,00,000 / yr',
    description: 'Looking for a full stack developer skilled in React, Node.js, Express, and MongoDB. Experience in building scalable REST APIs.',
    skills: ['React', 'Node', 'Express', 'MongoDB', 'JavaScript'],
    createdAt: new Date()
  },
  {
    _id: 'job_2',
    title: 'Python Backend & Data Engineer',
    company: 'Apex Data Labs',
    location: 'Bangalore, Karnataka (Remote)',
    salary: '₹8,00,000 - ₹14,00,000 / yr',
    description: 'Seeking Python engineers to build high-throughput data processing microservices, text parsers, and Flask APIs.',
    skills: ['Python', 'Flask', 'Docker', 'REST API', 'SQL'],
    createdAt: new Date()
  },
  {
    _id: 'job_3',
    title: 'Frontend React Developer',
    company: 'PixelCraft Studios',
    location: 'Coimbatore, Tamil Nadu (Onsite)',
    salary: '₹4,50,000 - ₹7,50,000 / yr',
    description: 'Modern frontend engineer needed for responsive dashboard creation, state management, and seamless backend integration.',
    skills: ['React', 'JavaScript', 'HTML5', 'CSS3', 'Tailwind'],
    createdAt: new Date()
  }
];

// Unified Repository Interface
const Job = {
  find: async (query = {}) => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseJob.find(query).sort({ createdAt: -1 });
    }
    let results = [...inMemoryJobs];
    if (query.search) {
      const q = query.search.toLowerCase();
      results = results.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.skills.some(s => s.toLowerCase().includes(q))
      );
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  findById: async (id) => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseJob.findById(id);
    }
    return inMemoryJobs.find(j => j._id.toString() === id.toString()) || null;
  },

  create: async (jobData) => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseJob.create(jobData);
    }
    const newJob = {
      _id: 'job_' + Date.now(),
      ...jobData,
      skills: Array.isArray(jobData.skills)
        ? jobData.skills
        : jobData.skills.split(',').map(s => s.trim()).filter(Boolean),
      createdAt: new Date()
    };
    inMemoryJobs.unshift(newJob);
    return newJob;
  },

  seed: async (sampleList) => {
    if (mongoose.connection.readyState === 1) {
      await MongooseJob.deleteMany({});
      return await MongooseJob.insertMany(sampleList);
    }
    inMemoryJobs = sampleList.map((j, i) => ({
      _id: 'job_' + (i + 1),
      ...j,
      createdAt: new Date()
    }));
    return inMemoryJobs;
  }
};

module.exports = Job;
