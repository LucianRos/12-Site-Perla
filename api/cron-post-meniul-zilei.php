<?php
/**
 * Postare automata meniul zilei pe Facebook — zilnic la 9:00.
 *
 * cPanel Cron:
 * 0 9 * * * /usr/bin/curl -s "https://perla-restaurant.ro/api/cron-post-meniul-zilei.php?key=CRON_SECRET" > /dev/null 2>&1
 */

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/facebook-menu.php';

date_default_timezone_set('Europe/Bucharest');

$env = loadEnvFile(envPath());
$expectedKey = trim($env['CRON_SECRET'] ?? '');
$providedKey = trim($_GET['key'] ?? $_SERVER['HTTP_X_CRON_KEY'] ?? '');
$isCli = PHP_SAPI === 'cli';
$force = !$isCli && isset($_GET['force']) && $_GET['force'] === '1';

if (!$isCli) {
    header('Content-Type: application/json; charset=utf-8');
}

if ($expectedKey === '') {
    echo json_encode(['ok' => false, 'error' => 'CRON_SECRET lipseste din config.env'], JSON_UNESCAPED_UNICODE);
    exit(1);
}

if (!$isCli && !hash_equals($expectedKey, $providedKey)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Cheie cron invalida'], JSON_UNESCAPED_UNICODE);
    exit(1);
}

$result = runDailyFacebookMenuPost($force);
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
exit($result['ok'] ? 0 : 1);
