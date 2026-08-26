<?php
require_once __DIR__ . '/helpers.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$body = readJsonBody();
$password = $body['password'] ?? '';
$env = loadEnvFile(envPath());
$expected = $env['ADMIN_PASSWORD'] ?? '';

if ($expected === '' || !hash_equals($expected, $password)) {
    jsonResponse(['error' => 'Parola incorecta'], 401);
}

$_SESSION['admin'] = true;
jsonResponse(['success' => true]);
