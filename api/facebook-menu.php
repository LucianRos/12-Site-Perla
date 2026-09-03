<?php

function facebookMenuEnv() {
    static $env = null;
    if ($env === null) {
        require_once __DIR__ . '/helpers.php';
        $env = loadEnvFile(envPath());
    }
    return $env;
}

function facebookMenuDataPath() {
    return dirname(__DIR__) . '/data/meniul-zilei.json';
}

function facebookPostStatePath() {
    return dirname(__DIR__) . '/data/facebook-last-post.json';
}

function parseMenuDayDate($label) {
    if (!preg_match('/(\d{1,2})\.(\d{1,2})\.(\d{4})/', $label, $m)) {
        return null;
    }
    return sprintf('%04d-%02d-%02d', (int) $m[3], (int) $m[2], (int) $m[1]);
}

function getTodayMenuDay(array $menuData) {
    $today = date('Y-m-d');
    foreach ($menuData['days'] as $day) {
        if (parseMenuDayDate($day['label'] ?? '') === $today) {
            return $day;
        }
    }
    return null;
}

function loadMenuDataForFacebook() {
    $path = facebookMenuDataPath();
    if (!file_exists($path)) {
        return null;
    }
    $data = json_decode(file_get_contents($path), true);
    return is_array($data) ? $data : null;
}

function facebookCategoryEmoji($title) {
    $t = mb_strtolower($title, 'UTF-8');
    if (strpos($t, 'italian') !== false) {
        return '🍝';
    }
    if (strpos($t, 'fitness') !== false) {
        return '🥗';
    }
    if (strpos($t, 'salata') !== false) {
        return '🥬';
    }
    if (strpos($t, 'desert') !== false) {
        return '🍰';
    }
    return '🥣';
}

function formatMenuFacebookPost(array $day, array $menuData) {
    $env = facebookMenuEnv();
    $siteUrl = rtrim($env['SITE_URL'] ?? 'https://perla-restaurant.ro', '/');
    $phone = $menuData['orderPhone'] ?? '0752540639';
    $digits = preg_replace('/\D/', '', $phone);
    $phoneFormatted = strlen($digits) === 10
        ? substr($digits, 0, 4) . ' ' . substr($digits, 4, 3) . ' ' . substr($digits, 7)
        : $phone;

    $separator = '━━━━━━━━━━━━━━━━';
    $lines = [];
    $lines[] = '🍽️ MENIUL ZILEI';
    $lines[] = '📅 ' . ($day['label'] ?? '');
    $lines[] = $separator;
    $lines[] = '';

    foreach ($day['categories'] as $cat) {
        $items = array_filter($cat['items'] ?? [], function ($item) {
            return trim($item['name'] ?? '') !== '';
        });
        if (!$items) {
            continue;
        }
        $lines[] = facebookCategoryEmoji($cat['title'] ?? '') . ' ' . $cat['title'];
        foreach ($items as $item) {
            $line = '   • ' . $item['name'];
            if (isset($item['price']) && $item['price'] !== null && $item['price'] !== '') {
                $line .= ' — ' . $item['price'] . ' lei';
            }
            $lines[] = $line;
        }
        $lines[] = '';
    }

    $lines[] = $separator;
    $lines[] = '📞 Comenzi: ' . $phoneFormatted;
    $lines[] = '🔗 ' . $siteUrl . '/meniul-zilei/';

    return trim(implode("\n", $lines));
}

function wasMenuPostedToday($dayLabel) {
    $path = facebookPostStatePath();
    if (!file_exists($path)) {
        return false;
    }
    $state = json_decode(file_get_contents($path), true);
    if (!is_array($state)) {
        return false;
    }
    return ($state['date'] ?? '') === date('Y-m-d') && ($state['label'] ?? '') === $dayLabel;
}

function markMenuPostedToday($dayLabel, $postId = null) {
    $state = [
        'date' => date('Y-m-d'),
        'label' => $dayLabel,
        'postedAt' => date('c'),
        'postId' => $postId,
    ];
    file_put_contents(facebookPostStatePath(), json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function postToFacebookPage($message) {
    $env = facebookMenuEnv();
    $pageId = trim($env['FACEBOOK_PAGE_ID'] ?? '');
    $token = trim($env['FACEBOOK_PAGE_TOKEN'] ?? '');

    if ($pageId === '' || $token === '') {
        return ['ok' => false, 'error' => 'FACEBOOK_PAGE_ID sau FACEBOOK_PAGE_TOKEN lipsesc din config.env'];
    }

    if (!function_exists('curl_init')) {
        return ['ok' => false, 'error' => 'Extensia PHP curl nu este disponibila pe server'];
    }

    $url = 'https://graph.facebook.com/v21.0/' . rawurlencode($pageId) . '/feed';
    $payload = http_build_query([
        'message' => $message,
        'access_token' => $token,
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);
    $response = curl_exec($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return ['ok' => false, 'error' => 'Eroare curl: ' . $curlError];
    }

    $data = json_decode($response, true);
    if ($httpCode >= 200 && $httpCode < 300 && !empty($data['id'])) {
        return ['ok' => true, 'postId' => $data['id']];
    }

    $error = $data['error']['message'] ?? ('HTTP ' . $httpCode);
    return ['ok' => false, 'error' => $error];
}

function runDailyFacebookMenuPost($force = false) {
    date_default_timezone_set('Europe/Bucharest');

    $menuData = loadMenuDataForFacebook();
    if (!$menuData) {
        return ['ok' => false, 'skipped' => true, 'reason' => 'Nu s-a putut citi meniul-zilei.json'];
    }

    $day = getTodayMenuDay($menuData);
    if (!$day) {
        return ['ok' => true, 'skipped' => true, 'reason' => 'Nu exista meniu pentru ziua de azi (' . date('d.m.Y') . ')'];
    }

    $label = $day['label'];
    if (!$force && wasMenuPostedToday($label)) {
        return ['ok' => true, 'skipped' => true, 'reason' => 'Meniul pentru ' . $label . ' a fost deja postat azi'];
    }

    $message = formatMenuFacebookPost($day, $menuData);
    $result = postToFacebookPage($message);
    if (!$result['ok']) {
        return $result;
    }

    markMenuPostedToday($label, $result['postId'] ?? null);
    return [
        'ok' => true,
        'posted' => true,
        'label' => $label,
        'postId' => $result['postId'] ?? null,
        'message' => $message,
    ];
}
