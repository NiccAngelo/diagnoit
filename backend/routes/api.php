<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ClassificationController;
use App\Http\Controllers\Api\DiagnosticSessionController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\CategoryAdminController;
use App\Http\Controllers\Api\Admin\CauseAdminController;
use App\Http\Controllers\Api\Admin\ArticleAdminController;
use App\Http\Controllers\Api\Admin\TroubleshootingStepAdminController;
// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::apiResource('categories', CategoryAdminController::class);
    Route::apiResource('causes', CauseAdminController::class);
    Route::apiResource('articles', ArticleAdminController::class)->except(['update']);
    Route::patch('articles/{article}', [ArticleAdminController::class, 'update']);
    Route::post('steps', [TroubleshootingStepAdminController::class, 'store']);
    Route::patch('steps/{troubleshootingStep}', [TroubleshootingStepAdminController::class, 'update']);
    Route::delete('steps/{troubleshootingStep}', [TroubleshootingStepAdminController::class, 'destroy']);
});
// Protected routes — require a valid Sanctum token
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/diagnostic-sessions/{session}/feedback', [DiagnosticSessionController::class, 'feedback']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::post('/classify', [ClassificationController::class, 'classify']);

    Route::post('/diagnostic-sessions', [DiagnosticSessionController::class, 'store']);
    Route::get('/diagnostic-sessions', [DiagnosticSessionController::class, 'index']); // NEW: list user's own sessions
    Route::get('/diagnostic-sessions/{session}', [DiagnosticSessionController::class, 'show']);
    Route::post('/diagnostic-sessions/{session}/answer', [DiagnosticSessionController::class, 'answer']);
});