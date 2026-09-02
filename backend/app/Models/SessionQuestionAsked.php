<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SessionQuestionAsked extends Model
{
    protected $fillable = ['session_id', 'question_id', 'answer_given', 'asked_at'];

    protected $casts = [
        'asked_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(DiagnosticSession::class, 'session_id');
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }
}