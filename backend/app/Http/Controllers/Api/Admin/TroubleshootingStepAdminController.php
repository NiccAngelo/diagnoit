<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\TroubleshootingStep;
use Illuminate\Http\Request;

class TroubleshootingStepAdminController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'article_id' => 'required|exists:articles,id',
            'instruction' => 'required|string',
            'media_url' => 'nullable|string',
            'requires_confirmation' => 'boolean',
        ]);

        $nextOrder = TroubleshootingStep::where('article_id', $validated['article_id'])->max('step_order') + 1;

        $step = TroubleshootingStep::create([
            ...$validated,
            'step_order' => $nextOrder,
            'requires_confirmation' => $validated['requires_confirmation'] ?? true,
        ]);

        return response()->json($step, 201);
    }

    public function update(Request $request, TroubleshootingStep $troubleshootingStep)
    {
        $validated = $request->validate([
            'instruction' => 'sometimes|required|string',
            'step_order' => 'sometimes|required|integer|min:1',
            'media_url' => 'nullable|string',
            'requires_confirmation' => 'sometimes|boolean',
        ]);

        $troubleshootingStep->update($validated);

        return $troubleshootingStep;
    }

    public function destroy(TroubleshootingStep $troubleshootingStep)
    {
        $troubleshootingStep->delete();

        return response()->json(null, 204);
    }
}