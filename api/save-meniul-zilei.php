<?php
require_once __DIR__ . '/helpers.php';

requireAuth();
$data = readJsonBody();

if (!validateMenuData($data)) {
    jsonResponse(['error' => 'Structura meniului invalida'], 400);
}

$data['updatedAt'] = date('c');
if (empty($data['orderPhone'])) {
    $data['orderPhone'] = '0752540639';
}

$path = dirname(__DIR__) . '/data/meniul-zilei.json';
$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

if ($json === false || file_put_contents($path, $json) === false) {
    jsonResponse(['error' => 'Nu s-a putut salva fisierul'], 500);
}

jsonResponse(['success' => true, 'updatedAt' => $data['updatedAt']]);
