<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;

class ArticleAdminController extends Controller
{
    public function index(Request $request)
    {
        $query = Article::with('steps')->withCount('steps');

        if ($request->has('cause_id')) {
            $query->where('cause_id', $request->cause_id);
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'cause_id' => 'required|exists:causes,id',
            'title' => 'required|string|max:255',
            'symptoms_summary' => 'nullable|string',
            'status' => 'required|in:draft,published',
        ]);

        return response()->json(Article::create($validated), 201);
    }

    public function show(Article $article)
    {
        return $article->load('steps', 'cause');
    }

    public function update(Request $request, Article $article)
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'symptoms_summary' => 'nullable|string',
            'status' => 'sometimes|required|in:draft,published',
        ]);

        $article->update($validated);

        return $article;
    }

    public function destroy(Article $article)
    {
        $article->delete();

        return response()->json(null, 204);
    }
}