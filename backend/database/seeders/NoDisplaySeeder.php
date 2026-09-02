<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Category;
use App\Models\Cause;
use App\Models\Question;
use App\Models\QuestionCauseLikelihood;
use App\Models\TroubleshootingStep;
use Illuminate\Database\Seeder;

class NoDisplaySeeder extends Seeder
{
    public function run(): void
    {
        // 1. Category
        $category = Category::firstOrCreate(
            ['slug' => 'pc-hardware'],
            ['name' => 'PC Hardware']
        );

        // 2. Causes with base priors (matches your original example)
        $ram = Cause::create([
            'category_id' => $category->id,
            'name' => 'Faulty RAM',
            'description' => 'RAM module is loose, faulty, or incompatible.',
            'base_prior' => 0.45,
        ]);

        $gpu = Cause::create([
            'category_id' => $category->id,
            'name' => 'GPU Failure',
            'description' => 'Graphics card is faulty, loose, or unpowered.',
            'base_prior' => 0.30,
        ]);

        $cable = Cause::create([
            'category_id' => $category->id,
            'name' => 'Display Cable / Input Issue',
            'description' => 'Cable is loose, damaged, or wrong input is selected on the monitor.',
            'base_prior' => 0.15,
        ]);

        $psu = Cause::create([
            'category_id' => $category->id,
            'name' => 'PSU Failure',
            'description' => 'Power supply unit is not delivering adequate power.',
            'base_prior' => 0.10,
        ]);

        // 3. Questions with per-cause likelihoods
        // Q1: "Do your keyboard lights turn on?"
        $q1 = Question::create([
            'category_id' => $category->id,
            'prompt' => 'Do your keyboard lights turn on?',
            'answer_type' => 'yes_no',
            'explanation_text' => 'Check if your keyboard has any indicator lights (Caps Lock, Num Lock, or RGB lighting) that turn on when the PC is powered.',
        ]);

        // If keyboard lights ARE on, that suggests the board has some power/signal —
        // slightly reduces PSU likelihood, slightly raises GPU/RAM as relatively more likely.
        $this->likelihood($q1, $ram, 'yes', 0.80);
        $this->likelihood($q1, $gpu, 'yes', 0.85);
        $this->likelihood($q1, $cable, 'yes', 0.90);
        $this->likelihood($q1, $psu, 'yes', 0.40);

        $this->likelihood($q1, $ram, 'no', 0.20);
        $this->likelihood($q1, $gpu, 'no', 0.15);
        $this->likelihood($q1, $cable, 'no', 0.10);
        $this->likelihood($q1, $psu, 'no', 0.60);

        // Q2: "Does your motherboard have a VGA/debug LED illuminated?"
        $q2 = Question::create([
            'category_id' => $category->id,
            'prompt' => 'Does your motherboard have a VGA/debug LED illuminated?',
            'answer_type' => 'yes_no',
            'explanation_text' => 'Many motherboards have small labeled LEDs (CPU, DRAM, VGA, BOOT) that light up to indicate which stage of startup is failing. Check near the CPU socket or top-right edge of the board.',
        ]);

        // A lit VGA LED strongly implicates GPU, strongly reduces others.
        $this->likelihood($q2, $ram, 'yes', 0.10);
        $this->likelihood($q2, $gpu, 'yes', 0.85);
        $this->likelihood($q2, $cable, 'yes', 0.05);
        $this->likelihood($q2, $psu, 'yes', 0.15);

        $this->likelihood($q2, $ram, 'no', 0.90);
        $this->likelihood($q2, $gpu, 'no', 0.15);
        $this->likelihood($q2, $cable, 'no', 0.95);
        $this->likelihood($q2, $psu, 'no', 0.85);

        // 4. Articles + troubleshooting steps, one per cause

        $ramArticle = Article::create([
            'cause_id' => $ram->id,
            'title' => 'No Display — Faulty or Loose RAM',
            'symptoms_summary' => 'PC powers on, fans spin, but no display output.',
            'status' => 'published',
        ]);
        $this->steps($ramArticle, [
            'Power off the PC and unplug it from the wall.',
            'Open the case and locate the RAM modules.',
            'Remove each RAM stick and reseat it firmly until the clips click.',
            'If you have multiple sticks, try booting with only one installed at a time.',
            'Power on and check if display returns.',
        ]);

        $gpuArticle = Article::create([
            'cause_id' => $gpu->id,
            'title' => 'No Display — GPU Issue',
            'symptoms_summary' => 'PC powers on, fans spin, but no display output. VGA/debug LED may be lit.',
            'status' => 'published',
        ]);
        $this->steps($gpuArticle, [
            'Power off the PC and unplug it from the wall.',
            'Check that PCIe power cables are firmly connected to the GPU.',
            'Reseat the GPU in its PCIe slot until it clicks in fully.',
            'If you have onboard graphics, try connecting the monitor directly to the motherboard to isolate the GPU.',
            'Power on and check if display returns.',
        ]);

        $cableArticle = Article::create([
            'cause_id' => $cable->id,
            'title' => 'No Display — Cable or Input Issue',
            'symptoms_summary' => 'PC powers on, fans spin, but no display output. Monitor may show "No Signal".',
            'status' => 'published',
        ]);
        $this->steps($cableArticle, [
            'Confirm the monitor is set to the correct input (HDMI/DisplayPort/VGA) matching the connected cable.',
            'Check that the cable is firmly connected at both the monitor and PC ends.',
            'Try a different cable if one is available.',
            'Try a different port on the GPU or motherboard.',
        ]);

        $psuArticle = Article::create([
            'cause_id' => $psu->id,
            'title' => 'No Display — Power Supply Issue',
            'symptoms_summary' => 'PC powers on, fans spin, but no display output. Keyboard lights may not turn on.',
            'status' => 'published',
        ]);
        $this->steps($psuArticle, [
            'Power off and unplug the PC.',
            'Check that the 24-pin motherboard power cable is fully seated.',
            'Check that the 4/8-pin CPU power cable is fully seated.',
            'If you have a spare PSU, swap it in to test.',
            'Power on and check if display returns.',
        ]);
    }

    private function likelihood(Question $question, Cause $cause, string $answer, float $value): void
    {
        QuestionCauseLikelihood::create([
            'question_id' => $question->id,
            'cause_id' => $cause->id,
            'answer_value' => $answer,
            'likelihood' => $value,
        ]);
    }

    private function steps(Article $article, array $instructions): void
    {
        foreach ($instructions as $index => $instruction) {
            TroubleshootingStep::create([
                'article_id' => $article->id,
                'step_order' => $index + 1,
                'instruction' => $instruction,
                'requires_confirmation' => true,
            ]);
        }
    }
}