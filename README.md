# Mini Job Portal with Resume Matching 🚀

A full-stack, micro-architecture job recruitment platform demonstrating clean separation of concerns across **React.js**, **Node + Express**, **MongoDB**, **PHP**, and **Python**.

---

## 🏗️ Architecture & Tech Stack Roles

| Tech | Port | Role | Why it fits |
|---|---|---|---|
| **React.js** | `3000` | Candidate View & Recruiter Dashboard | Dynamic SPA UI: search/filter, job application modal, recruiter applicant ranking |
| **Node.js + Express** | `5000` | Core REST API & Orchestrator | Handles Jobs CRUD, Applications logic, calls Python matcher, manages MongoDB |
| **MongoDB** | `27017` | Database | Document store for flexible job schemas, `skills` array, and applicant records |
| **PHP** | `8000` | `upload.php` & `feedback.php` | Native, rock-solid file upload handling (`$_FILES`, MIME validation, size limits, safe file naming) |
| **Python** | `5001` | Microservice (`/match`) | Text extraction from PDF (`pypdf`) and keyword scoring: `(matched / required) * 100` |

---

## 🔄 End-to-End Execution Flow

```
[Candidate] 
    │
    ▼ (1. Fills form & selects resume)
[React Frontend]
    │
    ├─────────► (2. POST multipart/form-data) ──► [PHP upload.php]
    │                                                    │ (Validates MIME, size, ext)
    │                                                    │ (Saves to uploads/)
    │◄──────── (3. Returns relative filePath & status) ──┘
    │
    ├─────────► (4. POST application + filePath) ──► [Express REST API]
    │                                                        │
    │                                                        ├──────► (5. POST resumePath & skills) ──► [Python /match]
    │                                                        │                                               │ (Extracts text with pypdf)
    │                                                        │                                               │ (Calculates match %)
    │                                                        │◄───── (6. Returns match score & skills) ──────┘
    │                                                        │
    │                                                        ▼
    │                                               [MongoDB Database] (Saves application)
    ▼
[Recruiter Dashboard]
    │
    ▼ (7. Fetches applicants sorted by matchPercentage DESC)
[Ranked Applicant Cards (Green/Yellow/Red match badges, matched vs missing skills, resume download)]
```

---

## 🚀 How to Run Locally

Run each service in a separate terminal window:

### 1. PHP Upload Service (Port 8000)
```bash
cd php-service
php -S 127.0.0.1:8000
```
> *Test file upload directly in browser at:* `http://127.0.0.1:8000/test_upload.html`

### 2. Python Matching Service (Port 5001)
```bash
cd python-service
pip install -r requirements.txt
python app.py
```
> *Health check:* `http://127.0.0.1:5001/health`

### 3. Node + Express Core Server (Port 5000)
```bash
cd server
npm install
npm start
```
> *Runs on `http://127.0.0.1:5000` (Has automatic in-memory fallback if MongoDB daemon isn't running!)*

### 4. React Frontend (Port 3000)
```bash
cd client
npm install
npm run dev
```
> *Open browser at:* `http://localhost:3000`

---

## 🔒 Security Best Practices Implemented (PHP Upload)

Interviewers frequently probe file upload security. Here is how `upload.php` handles it:

1. **Size Limitation**: Max `5MB` validated before processing to prevent Denial-of-Service (DoS) disk exhaustion.
2. **Double-Layer Extension Whitelist**:
   - Checks `pathinfo($filename, PATHINFO_EXTENSION)` against `['pdf', 'doc', 'docx', 'txt']`.
3. **Content MIME Type Inspection (`finfo_open`)**:
   - **Never trust** client-sent `$_FILES['resume']['type']` (which can be spoofed using Burp Suite or cURL).
   - Reads the magic bytes of the temporary file directly via `finfo_file(FILEINFO_MIME_TYPE, $tmp_path)`.
4. **Cryptographically Secure Filename Generation**:
   - Avoids Path Traversal (`../../`) and name collisions.
   - Filename format: `resume_{timestamp}_{random_hex}.{ext}` via `bin2hex(random_bytes(8))`.
5. **Execution Prevention (`.htaccess`)**:
   - `uploads/.htaccess` disables PHP script execution (`php_flag engine off` and `Deny from all` on scripts). Even if a malicious `.php` file somehow gets uploaded, it cannot execute on the server.

---

## ⚠️ Trade-Offs & Edge Cases

1. **No MongoDB driver in PHP**:
   - Decoupled by design! Connecting PHP to MongoDB requires custom extensions (`ext-mongodb`) and Composer dependencies. PHP acts purely as a stateless upload microservice; Express handles DB persistence.
2. **PDF Text Extraction Limitation**:
   - Uses `pypdf` / `PyPDF2` to read text streams from digital PDFs.
   - **Limitation**: Scanned PDFs (flat images) do not contain digital text characters. Without an OCR engine (e.g., Tesseract OCR, which is computationally expensive), scanned PDFs will return empty text. This is handled gracefully with a diagnostic warning.
3. **Keyword Matching vs "AI/ML"**:
   - Uses whole-word regex matching `(matched_skills / required_skills) * 100`.
   - Avoid buzzwords: It is a deterministic keyword matching engine, not a deep learning model. Being honest about this in interviews demonstrates professional maturity!

---

## 🎯 Interview Q&A Cheatsheet (Tanglish & English)

### Q1: "Why did you use PHP for file upload instead of doing it in Node with Multer?"
> **Answer**:
> *"PHP-la file upload handling is a native, battle-tested core feature. `$_FILES` and `move_uploaded_file()` handle multipart streams out of the box without extra middleware overhead. In our micro-architecture, PHP acts as a dedicated, sandboxed file ingestion microservice with independent MIME inspection (`finfo`) and size limits, keeping our Node/Express event loop clean from large stream buffers."*

### Q2: "What is `move_uploaded_file()` and why not use `rename()` or `copy()`?"
> **Answer**:
> *"`move_uploaded_file()` specifically verifies that the file was indeed uploaded via HTTP POST (`is_uploaded_file()`). If an attacker tricks the script into passing an arbitrary system file path like `/etc/passwd` to `copy()` or `rename()`, it could lead to Arbitrary File Read or Overwrite. `move_uploaded_file()` prevents this exploit."*

### Q3: "How does the Python keyword matcher handle tech terms like C++, C#, and Node.js?"
> **Answer**:
> *"Standard regex word boundaries `\b` fail on special characters like `+`, `#`, or `.`. Our Python matcher detects special characters and dynamically switches to custom regex patterns `(?:^|[\s,;:(/])<keyword>(?:$|[\s,;:)/])` so 'C++' or '.NET' match accurately without false positives."*

### Q4: "Why sort applicants on the database query level rather than in React?"
> **Answer**:
> *"In Express, we query MongoDB with `.sort({ matchPercentage: -1 })`. Doing this at the database level leverages indexing and reduces memory overhead on the client, ensuring the recruiter immediately sees the most qualified candidates first regardless of applicant volume."*
