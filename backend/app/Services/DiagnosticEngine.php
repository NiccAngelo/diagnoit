<?php

namespace App\Services;

use App\Models\Cause;
use App\Models\DiagnosticSession;
use App\Models\Question;
use App\Models\QuestionCauseLikelihood;
use App\Models\SessionCauseScore;
use App\Models\SessionQuestionAsked;
use Illuminate\Support\Facades\DB;

class DiagnosticEngine
{
    /**
     * Start a new diagnostic session: seed cause scores from base priors.
     */
    public function startSession(DiagnosticSession $session): void
    {
        $causes = Cause::where('category_id', $session->category_id)->get();

        // Normalize base priors so they sum to 1 (in case they don't already)
        $total = $causes->sum('base_prior');

        foreach ($causes as $cause) {
            SessionCauseScore::create([
                'session_id' => $session->id,
                'cause_id' => $cause->id,
                'current_probability' => $total > 0 ? $cause->base_prior / $total : 0,
            ]);
        }
    }

    /**
     * Record an answer and update all cause probabilities via Bayes' rule.
     *
     * posterior(cause) ∝ prior(cause) × P(answer | cause)
     */
    public function answerQuestion(DiagnosticSession $session, Question $question, string $answer): void
    {
        DB::transaction(function () use ($session, $question, $answer) {
            // Log the answer
            SessionQuestionAsked::create([
                'session_id' => $session->id,
                'question_id' => $question->id,
                'answer_given' => $answer,
                'asked_at' => now(),
            ]);

            // Get current scores for this session
            $scores = SessionCauseScore::where('session_id', $session->id)->get()->keyBy('cause_id');

            // Get likelihoods for this question + answer, keyed by cause_id
            $likelihoods = QuestionCauseLikelihood::where('question_id', $question->id)
                ->where('answer_value', $answer)
                ->get()
                ->keyBy('cause_id');

            // Apply Bayes update: unnormalized posterior = prior * likelihood
            $unnormalized = [];
            foreach ($scores as $causeId => $score) {
                $prior = (float) $score->current_probability;
                $likelihood = isset($likelihoods[$causeId])
                    ? (float) $likelihoods[$causeId]->likelihood
                    : 1.0; // no data for this cause/answer → don't shift it

                $unnormalized[$causeId] = $prior * $likelihood;
            }

            $total = array_sum($unnormalized);

            // Renormalize so probabilities sum to 1, then persist
            foreach ($scores as $causeId => $score) {
                $posterior = $total > 0 ? $unnormalized[$causeId] / $total : $score->current_probability;
                $score->update(['current_probability' => round($posterior, 4)]);
            }
        });
    }

    /**
     * Get causes for a session, sorted by current probability descending.
     */
    public function rankedCauses(DiagnosticSession $session)
    {
        return SessionCauseScore::where('session_id', $session->id)
            ->with('cause')
            ->orderByDesc('current_probability')
            ->get();
    }

    /**
     * Pick the next best question to ask — one that hasn't been asked yet
     * in this session, from the session's category.
     *
     * (Simple version for now: first unasked question. We can upgrade this
     * later to pick the question with the highest expected information gain.)
     */
    public function nextQuestion(DiagnosticSession $session): ?Question
    {
        $askedIds = SessionQuestionAsked::where('session_id', $session->id)
            ->pluck('question_id');

        return Question::where('category_id', $session->category_id)
            ->whereNotIn('id', $askedIds)
            ->first();
    }
}