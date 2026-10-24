# 💼 Mini Job Portal (with Resume Matching)

[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?logo=node.js&logoColor=white)](https://expressjs.com/)
[![Python](https://img.shields.io/badge/Matcher-Python%203.11%20%2B%20Flask-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![PHP](https://img.shields.io/badge/Ingestion-PHP%208.2-777BB4?logo=php&logoColor=white)](https://www.php.net/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

A modern, polyglot recruitment platform demonstrating true **Separation of Concerns**. Instead of forcing all workloads into an unnatural monolith, each technology is assigned to its natural engineering advantage:

- **React.js**: High-performance Single Page Application (Candidate job discovery & Recruiter leaderboard).
- **PHP**: Dedicated, secure file ingestion microservice handling multipart upload validation & MIME checks.
- **Node.js + Express**: Core orchestrator and REST API handling business logic, MongoDB persistence, and microservice coordination.
- **Python (Flask)**: Text extraction engine (`pypdf`) computing deterministic skill-match scores against job requirements.
- **MongoDB Atlas**: Flexible document store natively accommodating `skills[]` arrays and indexed applicant ranking.

---

## 🏛️ System Architecture & Data Flow

```
                     ┌──────────────────────────────────────────────┐
                     │            React Frontend (SPA)              │
                     │          http://localhost:3000               │
                     └──────┬────────────────────────────────┬──────┘
                            │                                │
            1. POST Resume  │                                │ 3. POST Application
           (multipart/form) │                                │    with resumePath
                            ▼                                ▼
       ┌───────────────────────────────┐     ┌───────────────────────────────┐
       │     PHP Ingestion Service     │     │     Node + Express API        │
       │     http://localhost:8000     │     │     http://localhost:5000     │
       └──────────────┬────────────────┘     └───────┬───────────────┬───────┘
                      │                              │               │
       2. Validates & │ Writes to                    │               │
          returns safe Path                          │               │
                      ▼                              │ 4. POST       │ 6. Query
            ┌───────────────────┐                    │    Path &     │    Ranked
            │   Shared Upload   │                    │    Skills     │    Applicants
            │   Volume Storage  │                    ▼               ▼
            └───────────────────┘     ┌────────────────────────┐  ┌─────────────┐
                      ▲               │  Python Match Engine   │  │   MongoDB   │
                      │               │ http://localhost:5001  │  │    Atlas    │
                      └───────────────┤ (pypdf Text Extraction)│  │  (Cluster0) │
                         5. Reads PDF └────────────────────────┘  └─────────────┘
                            Binary & Scores Keywords
```

---

## 🐳 Primary Deployment: Method B (Docker Compose)

Deploy the entire 4-service ecosystem with a single command! All microservices, environment variables, network routing, and shared upload volumes are pre-configured in [`docker-compose.yml`](docker-compose.yml).

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1-Command Startup
```bash
# 1. Clone the repository
git clone https://github.com/Baala-Murugan-K/mini-job-portal.git
cd mini-job-portal

# 2. Build and launch all 4 containers in detached mode
docker compose up --build -d
```

### 🌐 Accessing Services

| Service | Container Name | Local URL | Role |
|---|---|---|---|
| **React SPA** | `jobportal-client` | **http://localhost:3000** | Candidate portal & Recruiter dashboard |
| **Express Core API** | `jobportal-server` | **http://localhost:5000** | REST API (`/api/jobs`, `/api/applications`) |
| **Python Matcher** | `jobportal-python` | **http://localhost:5001** | Microservice (`/match`, `/health`) |
| **PHP Upload Engine** | `jobportal-php` | **http://localhost:8000** | Upload validator (`/upload.php`, `/feedback.php`) |

To stop the containers:
```bash
docker compose down
```

---

## 💻 Alternative: Running Locally (Without Docker)

If you prefer running services directly on Windows / Linux terminals:

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

> **Pro-Tip:** You can also simply double-click **`start_all.bat`** in the root directory to spawn all 4 terminal processes simultaneously!

---

## 🛡️ The 5-Layer PHP Security Wall (`upload.php`)

File uploads are a notorious security vector. The PHP microservice implements a strict 5-stage validation wall before accepting any file:

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

## 🎯 Interview Cheat Sheet & Architecture Defense

Review before your technical or system design interviews:

- 📄 **Compiled PDF Revision Guide**: [Mini_Job_Portal_Interview_Overview.pdf](Mini_Job_Portal_Interview_Overview.pdf) *(361 KB)*
- 🌐 **Interactive HTML Guide**: [Interview_Overview.html](Interview_Overview.html)

### Key Discussion Points:
1. **Why not connect PHP to MongoDB?**
   *Connecting PHP to MongoDB introduces custom PECL driver overhead and tight coupling. By keeping PHP stateless as an ingestion microservice, Express coordinates all database operations cleanly.*
2. **Why deterministic matching instead of ML/LLM?**
   *Simple keyword scoring is instantaneous, mathematically verifiable, free from LLM hallucinations, and requires zero expensive GPU infrastructure.*
3. **What is `move_uploaded_file()`?**
   *Unlike `copy()` or `rename()`, `move_uploaded_file()` calls `is_uploaded_file()` to ensure the file originated from an authentic HTTP POST, preventing Local File Inclusion (LFI) attacks.*

---

## 👤 Author

**Baala Murugan K**
- GitHub: [@Baala-Murugan-K](https://github.com/Baala-Murugan-K)
- Repository: [mini-job-portal](https://github.com/Baala-Murugan-K/mini-job-portal)
