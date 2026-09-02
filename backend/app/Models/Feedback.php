<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    protected $fillable = ['session_id', 'rating', 'comment'];

    public function session()
    {
        return $this->belongsTo(DiagnosticSession::class, 'session_id');
    }
}