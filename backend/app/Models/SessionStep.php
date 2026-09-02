<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SessionStep extends Model
{
    protected $fillable = ['session_id', 'step_id', 'completed', 'completed_at'];

    protected $casts = [
        'completed' => 'boolean',
        'completed_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(DiagnosticSession::class, 'session_id');
    }

    public function step()
    {
        return $this->belongsTo(TroubleshootingStep::class, 'step_id');
    }
}