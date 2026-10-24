# 💼 Mini Job Portal (with Resume Matching)

[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel&logoColor=white)](https://vercel.com/)
[![Render Deployment](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![React](https://img.shields.io/badge/UI-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Core%20API-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://expressjs.com/)
[![Python](https://img.shields.io/badge/Matcher-Python%20%2B%20Flask-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PHP](https://img.shields.io/badge/Ingestion-PHP-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

A modern, polyglot recruitment platform built on the principle of **Separation of Concerns**. Instead of forcing all workloads into an unnatural monolith, each technology is assigned to its natural engineering strength:

- **React.js**: High-performance Single Page Application (Candidate job discovery, filter pills & Recruiter leaderboard).
- **PHP**: Dedicated, secure file ingestion microservice handling multipart upload validation & MIME checks.
- **Node.js + Express**: Core orchestrator and REST API handling business logic, MongoDB persistence, and microservice coordination.
- **Python (Flask)**: Text extraction engine (`pypdf`) computing deterministic skill-match scores against job requirements.
- **MongoDB Atlas**: Flexible document store natively accommodating `skills[]` arrays and indexed applicant ranking.

---

## 🏛️ System Architecture & Data Flow

```
                     ┌──────────────────────────────────────────────┐
                     │            React Frontend (SPA)              │
                     │                 (Vercel)                     │
                     └──────┬────────────────────────────────┬──────┘
                            │                                │
            1. POST Resume  │                                │ 3. POST Application
           (multipart/form) │                                │    with resumePath
                            ▼                                ▼
       ┌───────────────────────────────┐     ┌───────────────────────────────┐
       │     PHP Ingestion Service     │     │     Node + Express API        │
       │           (Render)            │     │           (Render)            │
       └──────────────┬────────────────┘     └───────┬───────────────┬───────┘
                      │                              │               │
       2. Validates & │ Writes to                    │               │
          returns safe Path                          │               │
                      ▼                              │ 4. POST       │ 6. Query
            ┌───────────────────┐                    │    Path &     │    Ranked
            │   Uploads Folder  │                    │    Skills     │    Applicants
            │   Storage Buffer  │                    ▼               ▼
            └───────────────────┘     ┌────────────────────────┐  ┌─────────────┐
                      ▲               │  Python Match Engine   │  │   MongoDB   │
                      │               │        (Render)        │  │    Atlas    │
                      └───────────────┤ (pypdf Text Extraction)│  │ (Cloud DB)  │
                         5. Reads PDF └────────────────────────┘  └─────────────┘
                            Binary & Scores Keywords
```

---

## 🚀 Deployment Guide (Vercel + Render)

This multi-service project deploys seamlessly across **Vercel** (for CDN-cached Frontend) and **Render** (for Backend Microservices).

### 1. Frontend Deployment on Vercel (React SPA)
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Import your GitHub repository: `Baala-Murugan-K/mini-job-portal`.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables** in Vercel:
   - `VITE_EXPRESS_URL`: `https://your-node-server.onrender.com`
   - `VITE_PHP_URL`: `https://your-php-service.onrender.com`
5. Click **Deploy**!

---

### 2. Backend Services on Render

Create free Web Services on [render.com](https://render.com) from the same repository:

#### A. Node.js + Express API (`server`)
- Click **"New Web Service"** & connect your repository.
- **Root Directory**: `server`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - `PORT`: `5000`
  - `MONGO_URI`: `your_mongodb_atlas_connection_string` *(Securely stored in Render dashboard, never committed to git!)*
  - `PYTHON_SERVICE_URL`: `https://your-python-service.onrender.com/match`

#### B. Python Resume Matcher (`python-service`)
- Click **"New Web Service"** & connect your repository.
- **Root Directory**: `python-service`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`
- **Environment Variables**:
  - `PORT`: `5001`

#### C. PHP Ingestion Service (`php-service`)
- Click **"New Web Service"** & connect your repository.
- **Root Directory**: `php-service`
- **Runtime**: `Native Environment` (or run locally/emulator).

---

## 💻 Local Development Setup

To run all 4 services locally on your machine:

```bash
# 1. Start PHP Service (Port 8000)
cd php-service
.\run.bat           # Auto-detects PHP or launches zero-dependency Node emulator

# 2. Start Python Matcher (Port 5001)
cd python-service
.\run.bat           # Runs Python 3.14 with Flask & PyPDF

# 3. Start Express Core API (Port 5000)
cd server
npm start           # Connects to MongoDB Atlas

# 4. Start React Client (Port 3000)
cd client
npm install && npm run dev
```

> **Pro-Tip:** Double-click **`start_all.bat`** in the root directory to launch all 4 services simultaneously!

---

## 🛡️ The 5-Layer PHP Security Wall (`upload.php`)

File uploads are a sensitive security vector. The PHP microservice implements a strict 5-stage validation wall before accepting any file:

1. **Size Limitation**: Max `5MB` enforced before processing to mitigate Denial-of-Service (DoS) disk exhaustion attacks.
2. **Double-Layer Extension Whitelist**: Strictly matches against `['pdf', 'doc', 'docx', 'txt']`.
3. **Binary Magic Bytes Inspection (`finfo_open`)**: **Never trusts `$_FILES['resume']['type']`**, which can be easily forged by attackers via Postman or proxy tools. Inspects real binary magic bytes on disk.
4. **Cryptographic Unique Filename**: Generates `resume_{timestamp}_{random_hex}.{ext}` via `bin2hex(random_bytes(8))`. Prevents Directory Traversal (`../../`) and file overwrite exploits.
5. **Server-Level Execution Denial (`.htaccess`)**: Disables script execution inside `uploads/` (`php_flag engine off` and `Deny from all` on scripts).

---

## 🐍 Python Keyword Matching Engine (`app.py`)

- **Text Extraction**: Uses `pypdf` to read text streams from digital PDF pages.
- **Scanned PDF Handling**: Detects image-based PDFs without digital text layers (`len(text) < 10`), safely outputting a descriptive warning without breaking the pipeline.
- **Custom Token Regex**: Standard `\b` fails on tech names with symbols. Our engine dynamically selects character-class boundaries:
  ```python
  # Handles C++, C#, .NET, Node.js accurately
  pattern = r"(?:^|[\s,;:(/])" + re.escape(skill.lower()) + r"(?:$|[\s,;:)/])"
  ```
- **Deterministic Math Scoring**:
  $$\text{Match Percentage} = \left(\frac{\text{Matched Required Skills}}{\text{Total Required Skills}}\right) \times 100$$
  *(No unverified AI hallucinations — 100% auditable and fast [<15ms]!)*

---

## 🗄️ MongoDB Schema & Optimization

### Database-Level Ranking
Instead of sorting applicants in React or Node memory ($O(N \log N)$), applicant queries execute at the database index level:
```javascript
// O(log N) indexed retrieval
Application.find({ jobId }).sort({ matchPercentage: -1 });
```

### Schema Overview
```javascript
// Job Schema
{
  title: String,
  company: String,
  location: String,
  salary: String,
  skills: [String],        // Required skills array passed to Python matcher
  createdAt: Date
}

// Application Schema
{
  jobId: ObjectId,         // Ref to Job
  candidateName: String,
  candidateEmail: String,
  resumePath: String,      // Managed by PHP upload service
  resumeFileName: String,
  matchPercentage: Number, // Computed by Python matcher (0 to 100)
  matchedSkills: [String],
  missingSkills: [String],
  status: 'applied' | 'shortlisted' | 'rejected'
}
```

---

## 📡 API Reference

### 1. PHP Ingestion (`http://localhost:8000`)
- `POST /upload.php` — Multipart upload (`resume` field). Returns `{ success: true, data: { relativePath, fileName } }`.
- `POST /feedback.php` — Applicant/Recruiter inquiry handler.

### 2. Node + Express API (`http://localhost:5000`)
- `GET /api/jobs` — Retrieve all active jobs (supports `?search=` and `?skill=`).
- `POST /api/jobs` — Publish a new job opening.
- `POST /api/jobs/seed` — Seed initial sample positions.
- `POST /api/applications` — Submit application (calls Python `/match`, stores score in DB).
- `GET /api/applications/job/:jobId` — Retrieve applicants ranked by match % descending.
- `PATCH /api/applications/:id/status` — Update candidate status (`shortlisted` / `rejected`).

### 3. Python Engine (`http://localhost:5001`)
- `POST /match` — Body: `{ resumePath: "...", requiredSkills: [...] }`. Returns match % and skill breakdown.
- `GET /health` — Service health and PDF engine status.

---

## 👤 Author

**Baala Murugan K**
- GitHub: [@Baala-Murugan-K](https://github.com/Baala-Murugan-K)
- Repository: [mini-job-portal](https://github.com/Baala-Murugan-K/mini-job-portal)
