<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_cause_likelihoods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cause_id')->constrained()->cascadeOnDelete();
            $table->string('answer_value'); // e.g. "yes", "no", or an option key
            $table->decimal('likelihood', 5, 4); // P(answer | cause)
            $table->timestamps();

            $table->unique(['question_id', 'cause_id', 'answer_value'], 'qcl_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_cause_likelihoods');
    }
};