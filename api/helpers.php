<?php

function loadEnvFile($path) {
    $vars = [];
    if (!file_exists($path)) {
        return $vars;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || (isset($line[0]) && $line[0] === '#')) {
            continue;
        }
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $vars[trim($parts[0])] = trim($parts[1]);
        }
    }
    return $vars;
}

function envPath() {
    return dirname(__DIR__) . '/config.env';
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function requireAuth() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    if (empty($_SESSION['admin'])) {
        jsonResponse(['error' => 'Neautentificat'], 401);
    }
}

function readJsonBody() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        jsonResponse(['error' => 'JSON invalid'], 400);
    }
    return $data;
}

function validateMenuData($data) {
    if (!isset($data['days']) || !is_array($data['days']) || count($data['days']) === 0) {
        return false;
    }
    foreach ($data['days'] as $day) {
        if (empty($day['id']) || empty($day['label']) || !isset($day['categories']) || !is_array($day['categories'])) {
            return false;
        }
        foreach ($day['categories'] as $cat) {
            if (!isset($cat['title']) || !isset($cat['items']) || !is_array($cat['items'])) {
                return false;
            }
            foreach ($cat['items'] as $item) {
                if (!isset($item['name']) || !is_string($item['name'])) {
                    return false;
                }
            }
        }
    }
    if (isset($data['productCatalog']) && !is_array($data['productCatalog'])) {
        return false;
    }
    if (isset($data['productCatalog'])) {
        foreach ($data['productCatalog'] as $product) {
            if (!isset($product['name']) || !is_string($product['name'])) {
                return false;
            }
        }
    }
    return true;
}
