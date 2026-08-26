<?php
require_once __DIR__ . '/helpers.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

jsonResponse(['authenticated' => !empty($_SESSION['admin'])]);
