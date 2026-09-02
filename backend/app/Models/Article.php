<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = ['cause_id', 'title', 'symptoms_summary', 'status'];

    public function cause()
    {
        return $this->belongsTo(Cause::class);
    }

    public function steps()
    {
        return $this->hasMany(TroubleshootingStep::class, 'article_id')->orderBy('step_order');
    }
}