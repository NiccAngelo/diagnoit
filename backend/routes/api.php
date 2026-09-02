<?php

use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ClassificationController;
use App\Http\Controllers\Api\DiagnosticSessionController;
use Illuminate\Support\Facades\Route;

Route::post('/classify', [ClassificationController::class, 'classify']);
Route::get('/categories', [CategoryController::class, 'index']);

Route::post('/diagnostic-sessions', [DiagnosticSessionController::class, 'store']);
Route::get('/diagnostic-sessions/{session}', [DiagnosticSessionController::class, 'show']);
Route::post('/diagnostic-sessions/{session}/answer', [DiagnosticSessionController::class, 'answer']);