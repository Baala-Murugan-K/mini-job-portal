"""
Python Resume Matching Microservice
Extracts text from uploaded resumes (PDF, TXT, DOCX) and computes
keyword matching score against required job skills.

Match Formula: (matched_skills / required_skills) * 100
Limitation: Scanned PDFs (pure images) without an OCR layer will yield empty text.
"""

import os
import re
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS

# Attempt to import pypdf or PyPDF2 for PDF text extraction
PDF_EXTRACTOR = None
try:
    import pypdf
    PDF_EXTRACTOR = "pypdf"
except ImportError:
    try:
        import PyPDF2
        PDF_EXTRACTOR = "PyPDF2"
    except ImportError:
        PDF_EXTRACTOR = None

app = Flask(__name__)
CORS(app)


def extract_text_from_pdf(file_path):
    """
    Extracts text from a digital PDF file using pypdf or PyPDF2.
    Note: Returns empty string for scanned (image-only) PDFs.
    """
    text = ""
    if not os.path.exists(file_path):
        return None, f"File not found: {file_path}"

    if PDF_EXTRACTOR == "pypdf":
        try:
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + " "
            return text.strip(), None
        except Exception as e:
            return None, f"pypdf extraction error: {str(e)}"

    elif PDF_EXTRACTOR == "PyPDF2":
        try:
            reader = PyPDF2.PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + " "
            return text.strip(), None
        except Exception as e:
            return None, f"PyPDF2 extraction error: {str(e)}"
    else:
        # Fallback naive binary scan for readable ASCII if PDF library is not installed
        try:
            with open(file_path, "rb") as f:
                content = f.read().decode("latin-1", errors="ignore")
                # Filter printable chunks
                chunks = re.findall(r"[A-Za-z0-9#+.\s]{3,}", content)
                return " ".join(chunks), None
        except Exception as e:
            return None, f"Binary fallback error: {str(e)}"


def extract_text(file_path):
    """
    Extracts text based on file extension.
    """
    if not file_path or not os.path.exists(file_path):
        return None, "File does not exist on disk"

    ext = os.path.splitext(file_path)[1].lower()

    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".txt", ".text"]:
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read(), None
        except Exception as e:
            return None, f"Error reading text file: {str(e)}"
    elif ext in [".doc", ".docx"]:
        # Simple extraction for docx XML or binary
        try:
            with open(file_path, "rb") as f:
                content = f.read().decode("latin-1", errors="ignore")
                chunks = re.findall(r"[A-Za-z0-9#+.\s]{3,}", content)
                return " ".join(chunks), None
        except Exception as e:
            return None, f"Error extracting DOC/DOCX: {str(e)}"
    else:
        return None, f"Unsupported file extension: {ext}"


def match_skills(resume_text, required_skills):
    """
    Keyword matching logic:
    Checks if each required skill exists as a whole word or phrase in resume text.
    Handles tricky keywords like 'C++', 'C#', '.NET' safely.
    """
    if not required_skills or len(required_skills) == 0:
        return {
            "matchPercentage": 100.0,
            "matchedSkills": [],
            "missingSkills": [],
            "totalRequired": 0,
            "matchedCount": 0
        }

    text_lower = " " + resume_text.lower() + " "
    matched = []
    missing = []

    for skill in required_skills:
        skill_str = str(skill).strip()
        if not skill_str:
            continue

        skill_lower = skill_str.lower()

        # Handle special characters in tech names (C++, C#, .NET, Node.js)
        if any(char in skill_lower for char in ["+", "#", ".", "-"]):
            pattern = r"(?:^|[\s,;:(/])" + re.escape(skill_lower) + r"(?:$|[\s,;:)/])"
        else:
            pattern = r"\b" + re.escape(skill_lower) + r"\b"

        if re.search(pattern, text_lower):
            matched.append(skill_str)
        else:
            missing.append(skill_str)

    total = len(required_skills)
    matched_count = len(matched)
    percentage = round((matched_count / total) * 100, 1) if total > 0 else 0.0

    return {
        "matchPercentage": percentage,
        "matchedSkills": matched,
        "missingSkills": missing,
        "totalRequired": total,
        "matchedCount": matched_count
    }


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "online",
        "service": "Python Resume Matching Service",
        "pdfExtractor": PDF_EXTRACTOR or "built-in-fallback"
    })


@app.route("/match", methods=["POST"])
def match_resume():
    """
    Expected JSON Body:
    {
        "resumePath": "C:/path/to/uploads/resume_123.pdf",
        "requiredSkills": ["React", "Node", "MongoDB", "Docker"]
    }
    OR
    {
        "resumeText": "5 years experience in React, Node, and MongoDB...",
        "requiredSkills": ["React", "Node"]
    }
    """
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"success": False, "message": "Invalid JSON payload"}), 400

    required_skills = data.get("requiredSkills", [])
    if isinstance(required_skills, str):
        # Allow comma-separated strings
        required_skills = [s.strip() for s in required_skills.split(",") if s.strip()]

    resume_text = data.get("resumeText", "")
    resume_path = data.get("resumePath", "")
    is_scanned = False
    warning = None

    if not resume_text and resume_path:
        # Extract from file
        extracted, err = extract_text(resume_path)
        if err:
            return jsonify({
                "success": False,
                "message": f"Could not read resume file: {err}",
                "resumePath": resume_path
            }), 400
        resume_text = extracted

        # Check for scanned PDF edge case
        if len(resume_text.strip()) < 10:
            is_scanned = True
            warning = "Scanned PDF detected or resume has no extractable digital text. OCR (Tesseract) is required for scanned images."

    if not resume_text:
        return jsonify({
            "success": False,
            "message": "No resume text could be found or extracted.",
            "isScannedPdf": is_scanned,
            "warning": warning
        }), 422

    result = match_skills(resume_text, required_skills)
    result["success"] = True
    result["isScannedPdf"] = is_scanned
    if warning:
        result["warning"] = warning

    # Return preview of extracted text (first 250 chars) for recruiter verification
    result["textPreview"] = resume_text[:250].strip() + ("..." if len(resume_text) > 250 else "")

    return jsonify(result), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"[*] Python Resume Matcher running on http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=True)
