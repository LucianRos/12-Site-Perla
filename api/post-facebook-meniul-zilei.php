<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/facebook-menu.php';

date_default_timezone_set('Europe/Bucharest');

requireAuth();

$force = isset($_GET['force']) && $_GET['force'] === '1';
$result = runDailyFacebookMenuPost($force);

if (!$result['ok'] && empty($result['skipped'])) {
    jsonResponse($result, 500);
}

jsonResponse($result);
