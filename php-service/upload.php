<?php
/**
 * Resume Upload Handler - PHP Microservice
 * 
 * Flow:
 * 1. Accepts multipart/form-data POST request from React frontend
 * 2. Validates upload presence, file size, extension, and real MIME type
 * 3. Sanitizes and generates a cryptographically random unique filename
 * 4. Moves the uploaded file to the 'uploads/' directory using move_uploaded_file()
 * 5. Returns JSON response containing relative and absolute paths for Express API
 */

// Enable CORS for local development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ensure request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method Not Allowed. Only POST is accepted."
    ]);
    exit;
}

// 1. Check if file was provided
if (!isset($_FILES['resume']) || $_FILES['resume']['error'] !== UPLOAD_ERR_OK) {
    $errorCode = isset($_FILES['resume']) ? $_FILES['resume']['error'] : UPLOAD_ERR_NO_FILE;
    $errorMessage = "No file uploaded or upload error occurred.";

    switch ($errorCode) {
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            $errorMessage = "File size exceeds server limit.";
            break;
        case UPLOAD_ERR_PARTIAL:
            $errorMessage = "File was only partially uploaded.";
            break;
        case UPLOAD_ERR_NO_FILE:
            $errorMessage = "No file was attached in request (key 'resume').";
            break;
        case UPLOAD_ERR_NO_TMP_DIR:
            $errorMessage = "Missing a temporary folder on server.";
            break;
        case UPLOAD_ERR_CANT_WRITE:
            $errorMessage = "Failed to write file to disk.";
            break;
    }

    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $errorMessage,
        "error_code" => $errorCode
    ]);
    exit;
}

$file = $_FILES['resume'];
$originalName = basename($file['name']);
$tmpPath = $file['tmp_name'];
$fileSize = $file['size'];

// 2. Validate File Size (Limit: 5 MB)
$maxSizeBytes = 5 * 1024 * 1024; // 5MB
if ($fileSize > $maxSizeBytes) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "File exceeds maximum allowed size of 5MB."
    ]);
    exit;
}

// 3. Validate File Extension (Whitelist approach)
$allowedExtensions = ['pdf', 'doc', 'docx', 'txt'];
$extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

if (!in_array($extension, $allowedExtensions)) {
    http_response_code(422);
    echo json_encode([
        "success" => false,
        "message" => "Invalid file extension. Only PDF, DOC, DOCX, or TXT resumes are accepted."
    ]);
    exit;
}

// 4. Validate MIME Type by inspecting file content (Never trust client-provided $_FILES['resume']['type'])
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $tmpPath);
finfo_close($finfo);

$allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
];

if (!in_array($mimeType, $allowedMimeTypes)) {
    http_response_code(422);
    echo json_encode([
        "success" => false,
        "message" => "Invalid MIME type detected: " . htmlspecialchars($mimeType) . ". File content does not match allowed types."
    ]);
    exit;
}

// 5. Ensure Upload Directory Exists
$uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to create uploads directory on server."
        ]);
        exit;
    }
}

// 6. Generate a Cryptographically Secure Unique Filename
// Avoids directory traversal (../../) and accidental file overwrites
$randomString = bin2hex(random_bytes(8));
$safeFileName = 'resume_' . time() . '_' . $randomString . '.' . $extension;
$destinationPath = $uploadDir . DIRECTORY_SEPARATOR . $safeFileName;

// 7. Move file from temporary directory to target directory
if (move_uploaded_file($tmpPath, $destinationPath)) {
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Resume uploaded and validated successfully.",
        "data" => [
            "originalName" => $originalName,
            "fileName"     => $safeFileName,
            "relativePath" => "uploads/" . $safeFileName,
            "absolutePath" => realpath($destinationPath),
            "fileSize"     => $fileSize,
            "mimeType"     => $mimeType,
            "uploadedAt"   => date('Y-m-d H:i:s')
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: Unable to move uploaded file to destination directory."
    ]);
}
