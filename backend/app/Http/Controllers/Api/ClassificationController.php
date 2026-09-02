<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ClassificationController extends Controller
{
    public function classify(Request $request)
    {
        $validated = $request->validate([
            'description' => 'required|string',
        ]);

        $categories = Category::select('id', 'name')->get();

        $categoryList = $categories->map(fn ($c) => "{$c->id}: {$c->name}")->implode("\n");

        $prompt = <<<PROMPT
You are classifying an IT support problem into one category.

Categories:
{$categoryList}

Problem description: "{$validated['description']}"

Respond with ONLY a JSON object, no other text, no markdown formatting, in this exact shape:
{"category_id": <id>, "confidence": <0.0 to 1.0>}

If the description doesn't clearly match any category, pick the closest one and use a lower confidence.
PROMPT;

        try {
            $response = Http::timeout(15)->post(
               'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=' . config('services.gemini.key'),
                [
                    'contents' => [
                        ['parts' => [['text' => $prompt]]],
                    ],
                ]
            );

            if (!$response->successful()) {
                Log::error('Gemini API error', ['body' => $response->body()]);
                return $this->fallback($categories);
            }

            $text = $response->json('candidates.0.content.parts.0.text');

            // Strip any markdown code fences if the model added them anyway
            $text = trim(preg_replace('/```json|```/', '', $text));

            $parsed = json_decode($text, true);

            if (!isset($parsed['category_id']) || !$categories->firstWhere('id', $parsed['category_id'])) {
                return $this->fallback($categories);
            }

            return response()->json([
                'category_id' => $parsed['category_id'],
                'confidence' => $parsed['confidence'] ?? 0.5,
                'category_name' => $categories->firstWhere('id', $parsed['category_id'])->name,
            ]);
        } catch (\Exception $e) {
            Log::error('Classification failed', ['error' => $e->getMessage()]);
            return $this->fallback($categories);
        }
    }

    /**
     * If AI classification fails for any reason, fall back to the first
     * category rather than blocking the user entirely.
     */
    private function fallback($categories)
    {
        $first = $categories->first();

        return response()->json([
            'category_id' => $first?->id,
            'confidence' => 0.0,
            'category_name' => $first?->name,
            'fallback' => true,
        ]);
    }
}