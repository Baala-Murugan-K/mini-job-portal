<?php
/**
 * Contact & Feedback Form Handler - PHP Microservice
 * 
 * Flow:
 * 1. Accepts POST request with applicant or recruiter feedback/contact info
 * 2. Validates email format, sanitizes inputs
 * 3. Logs feedback to a JSON file or simulates notification
 * 4. Returns JSON response
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed"]);
    exit;
}

// Read raw JSON or POST data
$inputData = json_decode(file_get_contents("php://input"), true);
if (!$inputData) {
    $inputData = $_POST;
}

$name = isset($inputData['name']) ? trim(strip_tags($inputData['name'])) : '';
$email = isset($inputData['email']) ? filter_var(trim($inputData['email']), FILTER_SANITIZE_EMAIL) : '';
$message = isset($inputData['message']) ? trim(strip_tags($inputData['message'])) : '';
$type = isset($inputData['type']) ? trim(strip_tags($inputData['type'])) : 'feedback';

// Validation
if (empty($name) || empty($email) || empty($message)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "All fields (name, email, message) are required."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(["success" => false, "message" => "Invalid email address format."]);
    exit;
}

// Log feedback into a local JSON store
$feedbackFile = __DIR__ . DIRECTORY_SEPARATOR . 'feedback.json';
$currentFeedbacks = file_exists($feedbackFile) ? json_decode(file_get_contents($feedbackFile), true) : [];
if (!is_array($currentFeedbacks)) {
    $currentFeedbacks = [];
}

$newFeedback = [
    "id" => uniqid("fb_"),
    "name" => $name,
    "email" => $email,
    "message" => $message,
    "type" => $type,
    "createdAt" => date('Y-m-d H:i:s')
];

$currentFeedbacks[] = $newFeedback;
file_put_contents($feedbackFile, json_encode($currentFeedbacks, JSON_PRETTY_PRINT));

http_response_code(200);
echo json_encode([
    "success" => true,
    "message" => "Thank you! Your feedback has been received.",
    "feedback" => $newFeedback
]);
