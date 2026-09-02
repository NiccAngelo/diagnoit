<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DiagnosticSession extends Model
{
    protected $fillable = ['user_id', 'category_id', 'initial_description', 'status', 'resolved_at'];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function causeScores()
    {
        return $this->hasMany(SessionCauseScore::class, 'session_id');
    }

    public function questionsAsked()
    {
        return $this->hasMany(SessionQuestionAsked::class, 'session_id');
    }

    public function steps()
    {
        return $this->hasMany(SessionStep::class, 'session_id');
    }

    public function feedback()
    {
        return $this->hasOne(Feedback::class, 'session_id');
    }
}