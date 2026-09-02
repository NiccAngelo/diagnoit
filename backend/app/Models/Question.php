<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    protected $fillable = ['category_id', 'prompt', 'answer_type', 'explanation_text'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function likelihoods()
    {
        return $this->hasMany(QuestionCauseLikelihood::class);
    }

    public function sessionAnswers()
    {
        return $this->hasMany(SessionQuestionAsked::class);
    }
}