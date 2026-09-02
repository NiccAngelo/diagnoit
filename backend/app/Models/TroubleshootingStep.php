<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TroubleshootingStep extends Model
{
    protected $fillable = ['article_id', 'step_order', 'instruction', 'media_url', 'requires_confirmation'];

    protected $casts = [
        'requires_confirmation' => 'boolean',
    ];

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function sessionSteps()
    {
        return $this->hasMany(SessionStep::class, 'step_id');
    }
}