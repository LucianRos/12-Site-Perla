<?php
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/facebook-menu.php';

date_default_timezone_set('Europe/Bucharest');

requireAuth();

$menuData = loadMenuDataForFacebook();
if (!$menuData) {
    jsonResponse(['error' => 'Nu s-a putut citi meniul'], 500);
}

$day = getTodayMenuDay($menuData);
if (!$day) {
    jsonResponse(['error' => 'Nu exista meniu pentru ziua de azi (' . date('d.m.Y') . ')'], 404);
}

jsonResponse([
    'text' => formatMenuFacebookPost($day, $menuData),
    'label' => $day['label'],
]);
