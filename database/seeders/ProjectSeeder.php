<?php

namespace Database\Seeders;

use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => 'password',
                'email_verified_at' => now(),
            ]
        );

        // Project 1: Website Redesign
        $project1 = Project::create([
            'user_id' => $user->id,
            'name' => 'Website Redesign',
            'description' => 'Redesign company website with modern UI/UX',
            'color' => '#6366f1',
        ]);

        $this->createDefaultLists($project1);

        // Project 2: Mobile App
        $project2 = Project::create([
            'user_id' => $user->id,
            'name' => 'Mobile App Development',
            'description' => 'Build iOS and Android app',
            'color' => '#22c55e',
        ]);

        $this->createDefaultLists($project2);

        // Project 3: Marketing Campaign
        $project3 = Project::create([
            'user_id' => $user->id,
            'name' => 'Q1 Marketing Campaign',
            'description' => null,
            'color' => '#f97316',
        ]);

        $this->createDefaultLists($project3);
    }

    /**
     * Create default lists and sample tasks for a project.
     */
    private function createDefaultLists(Project $project): void
    {
        $listNames = ['To Do', 'In Progress', 'Review', 'Done'];

        foreach ($listNames as $position => $name) {
            $list = TaskList::create([
                'project_id' => $project->id,
                'name' => $name,
                'position' => $position,
                'is_done_list' => $name === 'Done', // Set Done list as the done list
            ]);

            // Add sample tasks to each list
            $this->createSampleTasks($project, $list, $position);
        }
    }

    /**
     * Create sample tasks for a list.
     */
    private function createSampleTasks(Project $project, TaskList $list, int $listPosition): void
    {
        $taskCount = match ($listPosition) {
            0 => 4, // To Do: 4 tasks
            1 => 2, // In Progress: 2 tasks
            2 => 1, // Review: 1 task
            3 => 3, // Done: 3 tasks
            default => 2,
        };

        for ($i = 0; $i < $taskCount; $i++) {
            $isCompleted = $listPosition === 3;

            Task::create([
                'project_id' => $project->id,
                'list_id' => $list->id,
                'title' => fake()->sentence(rand(3, 6)),
                'description' => fake()->optional(0.5)->paragraph(),
                'position' => $i,
                'priority' => fake()->randomElement(TaskPriority::cases()),
                'due_date' => fake()->dateTimeBetween('now', '+30 days'),
                'due_time' => fake()->time('H:i:s'),
                'completed_at' => $isCompleted ? fake()->dateTimeBetween('-1 day', 'now') : null,
            ]);
        }
    }
}
