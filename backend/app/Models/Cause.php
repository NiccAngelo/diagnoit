<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cause extends Model
{
    protected $fillable = ['category_id', 'name', 'description', 'base_prior'];

    protected $casts = [
        'base_prior' => 'decimal:4',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }

    public function likelihoods()
    {
        return $this->hasMany(QuestionCauseLikelihood::class);
    }

    public function sessionScores()
    {
        return $this->hasMany(SessionCauseScore::class);
    }
}