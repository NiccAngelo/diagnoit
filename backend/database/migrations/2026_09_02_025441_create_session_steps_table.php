<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('session_id')->constrained('diagnostic_sessions')->cascadeOnDelete();
            $table->foreignId('step_id')->constrained('troubleshooting_steps')->cascadeOnDelete();
            $table->boolean('completed')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_steps');
    }
};