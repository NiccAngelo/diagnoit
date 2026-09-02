<?php

use App\Http\Controllers\Api\DiagnosticSessionController;
use Illuminate\Support\Facades\Route;

Route::post('/diagnostic-sessions', [DiagnosticSessionController::class, 'store']);
Route::get('/diagnostic-sessions/{session}', [DiagnosticSessionController::class, 'show']);
Route::post('/diagnostic-sessions/{session}/answer', [DiagnosticSessionController::class, 'answer']);