<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cause;
use Illuminate\Http\Request;

class CauseAdminController extends Controller
{
    public function index(Request $request)
    {
        $query = Cause::with('category');

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'base_prior' => 'required|numeric|min:0|max:1',
        ]);

        return response()->json(Cause::create($validated), 201);
    }

    public function show(Cause $cause)
    {
        return $cause->load('category', 'articles.steps', 'likelihoods.question');
    }

    public function update(Request $request, Cause $cause)
    {
        $validated = $request->validate([
            'category_id' => 'sometimes|required|exists:categories,id',
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'base_prior' => 'sometimes|required|numeric|min:0|max:1',
        ]);

        $cause->update($validated);

        return $cause;
    }

    public function destroy(Cause $cause)
    {
        $cause->delete();

        return response()->json(null, 204);
    }
}