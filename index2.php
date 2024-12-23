<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$filename = 'posts.json';

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $content = trim($_POST['content'] ?? '');

    if (!empty($content)) {
        // Read or initialize posts
        $posts = file_exists($filename) ? json_decode(file_get_contents($filename), true) : [];

        // Add new post
        $posts[] = ['content' => $content, 'timestamp' => time()];

        // Save back to JSON file
        if (file_put_contents($filename, json_encode($posts, JSON_PRETTY_PRINT))) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to save post']);
        }
    } else {
        echo json_encode(['success' => false, 'error' => 'Content is empty']);
    }
    exit;
}

// Handle GET requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $posts = file_exists($filename) ? json_decode(file_get_contents($filename), true) : [];
    echo json_encode($posts);
    exit;
}

// Default error
echo json_encode(['success' => false, 'error' => 'Invalid request']);
