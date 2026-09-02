<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SessionCauseScore extends Model
{
    protected $fillable = ['session_id', 'cause_id', 'current_probability'];

    protected $casts = [
        'current_probability' => 'decimal:4',
    ];

    public function session()
    {
        return $this->belongsTo(DiagnosticSession::class, 'session_id');
    }

    public function cause()
    {
        return $this->belongsTo(Cause::class);
    }
}