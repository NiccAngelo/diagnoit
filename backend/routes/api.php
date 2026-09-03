<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ClassificationController;
use App\Http\Controllers\Api\DiagnosticSessionController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/categories', [CategoryController::class, 'index']);

// Protected routes — require a valid Sanctum token
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::post('/classify', [ClassificationController::class, 'classify']);

    Route::post('/diagnostic-sessions', [DiagnosticSessionController::class, 'store']);
    Route::get('/diagnostic-sessions', [DiagnosticSessionController::class, 'index']); // NEW: list user's own sessions
    Route::get('/diagnostic-sessions/{session}', [DiagnosticSessionController::class, 'show']);
    Route::post('/diagnostic-sessions/{session}/answer', [DiagnosticSessionController::class, 'answer']);
});