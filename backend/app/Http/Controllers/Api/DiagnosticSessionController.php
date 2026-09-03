<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiagnosticSession;
use App\Models\Question;
use App\Services\DiagnosticEngine;
use Illuminate\Http\Request;

class DiagnosticSessionController extends Controller
{
    public function __construct(protected DiagnosticEngine $engine)
    {
    }

    /**
     * Start a new diagnostic session.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'initial_description' => 'required|string',
        ]);

    $session = DiagnosticSession::create([
        'user_id' => $request->user()->id, 
        'category_id' => $validated['category_id'],
        'initial_description' => $validated['initial_description'],
        'status' => 'active',
    ]);
        $this->engine->startSession($session);

        return $this->sessionState($session);
    }
    /**
 * List the authenticated user's diagnostic sessions.
 */
    public function index(Request $request)
    {
        $sessions = DiagnosticSession::where('user_id', $request->user()->id)
            ->with('category')
            ->latest()
            ->get();

        return response()->json($sessions->map(fn ($session) => [
            'id' => $session->id,
            'category' => $session->category->name,
            'initial_description' => $session->initial_description,
            'status' => $session->status,
            'created_at' => $session->created_at,
        ]));
    }

    /**
     * Get the current state of a session: ranked causes + next question.
     */
    public function show(DiagnosticSession $session)
    {
        return $this->sessionState($session);
    }

    /**
     * Submit an answer to the current question.
     */
    public function answer(Request $request, DiagnosticSession $session)
    {
        $validated = $request->validate([
            'question_id' => 'required|exists:questions,id',
            'answer' => 'required|string',
        ]);

        $question = Question::findOrFail($validated['question_id']);

        $this->engine->answerQuestion($session, $question, $validated['answer']);

        return $this->sessionState($session);
    }

    /**
     * Shared response shape: session info, ranked causes, next question, top article+steps.
     */
    private function sessionState(DiagnosticSession $session)
    {
        $rankedCauses = $this->engine->rankedCauses($session);
        $nextQuestion = $this->engine->nextQuestion($session);

        $topCause = $rankedCauses->first()?->cause;
        $topArticle = $topCause?->articles()->where('status', 'published')->with('steps')->first();

        return response()->json([
            'session' => [
                'id' => $session->id,
                'status' => $session->status,
                'initial_description' => $session->initial_description,
            ],
            'ranked_causes' => $rankedCauses->map(fn ($score) => [
                'cause_id' => $score->cause_id,
                'name' => $score->cause->name,
                'probability' => (float) $score->current_probability,
            ]),
            'next_question' => $nextQuestion ? [
                'id' => $nextQuestion->id,
                'prompt' => $nextQuestion->prompt,
                'answer_type' => $nextQuestion->answer_type,
                'explanation_text' => $nextQuestion->explanation_text,
            ] : null,
            'recommended_article' => $topArticle ? [
                'id' => $topArticle->id,
                'title' => $topArticle->title,
                'steps' => $topArticle->steps->map(fn ($step) => [
                    'id' => $step->id,
                    'order' => $step->step_order,
                    'instruction' => $step->instruction,
                ]),
            ] : null,
        ]);
    }
}