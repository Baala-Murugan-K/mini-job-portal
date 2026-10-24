const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required']
  },
  candidateName: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true
  },
  candidateEmail: {
    type: String,
    required: [true, 'Candidate email is required'],
    trim: true,
    lowercase: true
  },
  candidatePhone: {
    type: String,
    default: ''
  },
  resumePath: {
    type: String,
    required: [true, 'Resume path from PHP upload is required']
  },
  resumeFileName: {
    type: String,
    default: ''
  },
  matchPercentage: {
    type: Number,
    default: 0
  },
  matchedSkills: {
    type: [String],
    default: []
  },
  missingSkills: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['applied', 'shortlisted', 'rejected'],
    default: 'applied'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseApplication = mongoose.model('Application', ApplicationSchema);

// In-Memory store for offline/standalone demo mode
let inMemoryApplications = [];

const Application = {
  create: async (data) => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseApplication.create(data);
    }
    const newApp = {
      _id: 'app_' + Date.now(),
      ...data,
      matchPercentage: Number(data.matchPercentage) || 0,
      matchedSkills: data.matchedSkills || [],
      missingSkills: data.missingSkills || [],
      status: data.status || 'applied',
      appliedAt: new Date()
    };
    inMemoryApplications.unshift(newApp);
    return newApp;
  },

  findByJobId: async (jobId) => {
    if (mongoose.connection.readyState === 1) {
      // Order applicants by matchPercentage descending so recruiter sees top matches first
      return await MongooseApplication.find({ jobId }).sort({ matchPercentage: -1 });
    }
    return inMemoryApplications
      .filter(a => a.jobId.toString() === jobId.toString())
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  },

  findById: async (id) => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseApplication.findById(id);
    }
    return inMemoryApplications.find(a => a._id.toString() === id.toString()) || null;
  },

  updateStatus: async (id, status) => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseApplication.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
    }
    const app = inMemoryApplications.find(a => a._id.toString() === id.toString());
    if (app) {
      app.status = status;
      return { ...app };
    }
    return null;
  },

  getAll: async () => {
    if (mongoose.connection.readyState === 1) {
      return await MongooseApplication.find({}).sort({ appliedAt: -1 });
    }
    return [...inMemoryApplications].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
  }
};

module.exports = Application;
