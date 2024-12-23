<?php
header('Content-Type: application/json');
$filename = 'posts.json';

// Check if a POST request is made
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $content = trim($_POST['content']);

    if (!empty($content)) {
        // Read existing posts
        $posts = file_exists($filename) ? json_decode(file_get_contents($filename), true) : [];

        // Add the new post
        $posts[] = ['content' => $content, 'timestamp' => time()];

        // Save posts to the file
        file_put_contents($filename, json_encode($posts, JSON_PRETTY_PRINT));

        // Send success response
        echo json_encode(['success' => true]);
    } else {
        // Send failure response
        echo json_encode(['success' => false, 'error' => 'Content cannot be empty']);
    }
    exit;
}

// Handle GET request to fetch posts
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $posts = file_exists($filename) ? json_decode(file_get_contents($filename), true) : [];
    echo json_encode($posts);
    exit;
}

// Default response
echo json_encode(['success' => false, 'error' => 'Invalid request']);
?>
