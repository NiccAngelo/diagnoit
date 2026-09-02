<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Category;
use App\Models\Cause;
use App\Models\Question;
use App\Models\QuestionCauseLikelihood;
use App\Models\TroubleshootingStep;
use Illuminate\Database\Seeder;

class WifiProblemsSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Category
        $category = Category::firstOrCreate(
            ['slug' => 'network'],
            ['name' => 'Network']
        );

        // 2. Causes with base priors
        $router = Cause::create([
            'category_id' => $category->id,
            'name' => 'Router / Modem Issue',
            'description' => 'Router or modem is malfunctioning, needs restart, or has lost connection to ISP.',
            'base_prior' => 0.40,
        ]);

        $driver = Cause::create([
            'category_id' => $category->id,
            'name' => 'Outdated Network Driver',
            'description' => 'Wi-Fi adapter driver is outdated, corrupted, or incompatible.',
            'base_prior' => 0.25,
        ]);

        $interference = Cause::create([
            'category_id' => $category->id,
            'name' => 'Signal Interference / Distance',
            'description' => 'Device is too far from router, or interference from walls/other devices.',
            'base_prior' => 0.20,
        ]);

        $isp = Cause::create([
            'category_id' => $category->id,
            'name' => 'ISP Outage',
            'description' => 'Internet service provider is experiencing an outage in the area.',
            'base_prior' => 0.15,
        ]);

        // 3. Questions with per-cause likelihoods

        $q1 = Question::create([
            'category_id' => $category->id,
            'prompt' => 'Do other devices on your network also have no internet?',
            'answer_type' => 'yes_no',
            'explanation_text' => 'Check if a phone, tablet, or another computer on the same Wi-Fi also can\'t connect.',
        ]);

        // If OTHER devices are also affected, that points to router/ISP, not this device's driver.
        $this->likelihood($q1, $router, 'yes', 0.75);
        $this->likelihood($q1, $driver, 'yes', 0.05);
        $this->likelihood($q1, $interference, 'yes', 0.30);
        $this->likelihood($q1, $isp, 'yes', 0.85);

        $this->likelihood($q1, $router, 'no', 0.25);
        $this->likelihood($q1, $driver, 'no', 0.95);
        $this->likelihood($q1, $interference, 'no', 0.70);
        $this->likelihood($q1, $isp, 'no', 0.15);

        $q2 = Question::create([
            'category_id' => $category->id,
            'prompt' => 'Have you restarted your router recently?',
            'answer_type' => 'yes_no',
            'explanation_text' => 'Unplug the router for 10 seconds, plug it back in, and wait 1-2 minutes before checking again.',
        ]);

        // If they've ALREADY restarted and it's still broken, that reduces router-fix-by-restart likelihood
        // and raises driver/interference/ISP relatively.
        $this->likelihood($q2, $router, 'yes', 0.30);
        $this->likelihood($q2, $driver, 'yes', 0.60);
        $this->likelihood($q2, $interference, 'yes', 0.55);
        $this->likelihood($q2, $isp, 'yes', 0.70);

        $this->likelihood($q2, $router, 'no', 0.70);
        $this->likelihood($q2, $driver, 'no', 0.40);
        $this->likelihood($q2, $interference, 'no', 0.45);
        $this->likelihood($q2, $isp, 'no', 0.30);

        // 4. Articles + troubleshooting steps

        $routerArticle = Article::create([
            'cause_id' => $router->id,
            'title' => 'Wi-Fi Down — Router/Modem Issue',
            'symptoms_summary' => 'No internet on any device, other devices also affected.',
            'status' => 'published',
        ]);
        $this->steps($routerArticle, [
            'Unplug your router/modem from power for 10 seconds.',
            'Plug it back in and wait 1-2 minutes for it to fully restart.',
            'Check if the internet light on the router is solid (not blinking or red).',
            'Try connecting a device via Ethernet cable to isolate Wi-Fi vs. full outage.',
            'If still down, contact your ISP to check for outages.',
        ]);

        $driverArticle = Article::create([
            'cause_id' => $driver->id,
            'title' => 'Wi-Fi Down — Driver Issue',
            'symptoms_summary' => 'Only this device has no internet; other devices connect fine.',
            'status' => 'published',
        ]);
        $this->steps($driverArticle, [
            'Open Device Manager and locate your network adapter under "Network adapters".',
            'Right-click the Wi-Fi adapter and select "Update driver".',
            'If that doesn\'t help, right-click and select "Uninstall device", then restart your PC to reinstall it.',
            'Alternatively, download the latest driver directly from your laptop or Wi-Fi card manufacturer\'s website.',
        ]);

        $interferenceArticle = Article::create([
            'cause_id' => $interference->id,
            'title' => 'Wi-Fi Weak or Dropping — Signal Interference',
            'symptoms_summary' => 'Wi-Fi connects but is slow or drops intermittently.',
            'status' => 'published',
        ]);
        $this->steps($interferenceArticle, [
            'Move closer to the router and see if the connection improves.',
            'Check for physical obstructions (walls, metal objects) between your device and the router.',
            'Reduce interference from other electronics (microwaves, cordless phones) near the router.',
            'Try switching your router to the 5GHz band if available, or change the Wi-Fi channel.',
        ]);

        $ispArticle = Article::create([
            'cause_id' => $isp->id,
            'title' => 'Wi-Fi Down — ISP Outage',
            'symptoms_summary' => 'No internet on any device, router restart did not help.',
            'status' => 'published',
        ]);
        $this->steps($ispArticle, [
            'Check your ISP\'s outage map or status page online (using mobile data).',
            'Call your ISP\'s support line to confirm an outage in your area.',
            'Ask for an estimated time of resolution.',
            'If no outage is reported, ask them to run a remote line diagnostic.',
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