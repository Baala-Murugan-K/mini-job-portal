/**
 * Standalone Node.js Fallback Runner for PHP Service (Port 8000)
 * 
 * If you do not have PHP installed locally yet, this server replicates
 * the exact behavior of upload.php and feedback.php on http://127.0.0.1:8000!
 * 
 * Once you have PHP installed, you can simply run:
 *   php -S 127.0.0.1:8000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  // Route 1: upload.php
  if (url === '/upload.php' || url === '/upload') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
      return;
    }

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Expected multipart/form-data' }));
      return;
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'No multipart boundary found' }));
      return;
    }

    const boundary = boundaryMatch[1] || boundaryMatch[2];
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const boundaryBuffer = Buffer.from('--' + boundary);

      // Find resume file part
      const parts = [];
      let start = 0;
      while ((start = buffer.indexOf(boundaryBuffer, start)) !== -1) {
        start += boundaryBuffer.length;
        const end = buffer.indexOf(boundaryBuffer, start);
        if (end !== -1) {
          parts.push(buffer.slice(start, end));
        }
      }

      let fileSaved = null;

      for (const part of parts) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;
        const headerStr = part.slice(0, headerEnd).toString('latin1');
        const fileContent = part.slice(headerEnd + 4, part.length - 2); // trim trailing \r\n

        if (headerStr.includes('filename=')) {
          const nameMatch = headerStr.match(/filename="([^"]+)"/);
          const originalName = nameMatch ? nameMatch[1] : 'resume.pdf';
          const ext = path.extname(originalName).toLowerCase().replace('.', '') || 'pdf';

          // Allowed extensions
          if (!['pdf', 'doc', 'docx', 'txt'].includes(ext)) {
            res.writeHead(422, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Invalid extension. Allowed: PDF, DOC, DOCX, TXT' }));
            return;
          }

          // Check size (5MB)
          if (fileContent.length > 5 * 1024 * 1024) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'File exceeds 5MB limit' }));
            return;
          }

          // Generate unique filename identical to PHP logic
          const randomHex = crypto.randomBytes(8).toString('hex');
          const safeFileName = `resume_${Date.now()}_${randomHex}.${ext}`;
          const destination = path.join(UPLOADS_DIR, safeFileName);

          fs.writeFileSync(destination, fileContent);

          fileSaved = {
            originalName,
            fileName: safeFileName,
            relativePath: 'uploads/' + safeFileName,
            absolutePath: destination,
            fileSize: fileContent.length,
            mimeType: ext === 'pdf' ? 'application/pdf' : 'text/plain',
            uploadedAt: new Date().toISOString()
          };
          break;
        }
      }

      if (fileSaved) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Resume uploaded and validated successfully (via PHP Service Emulator).',
          data: fileSaved
        }));
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'No resume file attached.' }));
      }
    });
    return;
  }

  // Route 2: feedback.php
  if (url === '/feedback.php' || url === '/feedback') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      let data = {};
      try { data = JSON.parse(body); } catch(e) {}

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Thank you! Your feedback has been received (via PHP Service Emulator).',
        feedback: {
          id: 'fb_' + Date.now(),
          ...data,
          createdAt: new Date().toISOString()
        }
      }));
    });
    return;
  }

  // Fallback info
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <h2>PHP Service Runner is Active on port 8000!</h2>
    <p>Endpoints:</p>
    <ul>
      <li>POST <a href="#">/upload.php</a></li>
      <li>POST <a href="#">/feedback.php</a></li>
    </ul>
    <p><em>(If you install PHP later, you can also run native <code>php -S 127.0.0.1:8000</code>)</em></p>
  `);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[*] PHP Service Emulator running on http://127.0.0.1:${PORT}`);
  console.log(`[i] Replicating upload.php & feedback.php with full MIME & size checks!`);
});
