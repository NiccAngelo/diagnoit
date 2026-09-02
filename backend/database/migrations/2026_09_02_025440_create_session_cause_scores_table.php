<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_cause_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('diagnostic_sessions')->cascadeOnDelete();
            $table->foreignId('cause_id')->constrained()->cascadeOnDelete();
            $table->decimal('current_probability', 5, 4);
            $table->timestamps();

            $table->unique(['session_id', 'cause_id'], 'scs_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_cause_scores');
    }
};