<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $fillable = ['name', 'slug'];

    public function causes()
    {
        return $this->hasMany(Cause::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class);
    }

    public function diagnosticSessions()
    {
        return $this->hasMany(DiagnosticSession::class);
    }
}