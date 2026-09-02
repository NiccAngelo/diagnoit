<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuestionCauseLikelihood extends Model
{
    protected $fillable = ['question_id', 'cause_id', 'answer_value', 'likelihood'];

    protected $casts = [
        'likelihood' => 'decimal:4',
    ];

    public function question()
    {
        return $this->belongsTo(Question::class);
    }

    public function cause()
    {
        return $this->belongsTo(Cause::class);
    }
}