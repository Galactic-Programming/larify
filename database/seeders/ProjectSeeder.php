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
    // Free plan colors (first 6 from PRESET_COLORS)
    private const FREE_COLORS = ['#6366f1', '#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'];

    // Pro plan colors (additional 6)
    private const PRO_COLORS = ['#14b8a6', '#06b6d4', '#ec4899', '#f59e0b', '#84cc16', '#64748b'];

    // Free plan icons (first 8)
    private const FREE_ICONS = ['folder-kanban', 'folder', 'briefcase', 'code', 'rocket', 'target', 'lightbulb', 'users'];

    // Pro plan icons (additional 12)
    private const PRO_ICONS = ['globe', 'layers', 'layout', 'package', 'database', 'server', 'smartphone', 'shopping-cart', 'pen-tool', 'file-text', 'book-open', 'message-square'];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get Pro user for projects (Pro can invite members)
        $proUser = User::where('email', 'pro@example.com')->first();

        // Get Free user
        $freeUser = User::where('email', 'free@example.com')->first();

        // Project 1: Website Redesign (owned by Pro user)
        $project1 = Project::create([
            'user_id' => $proUser->id,
            'name' => 'Website Redesign',
            'description' => 'Redesign company website with modern UI/UX',
            'color' => self::PRO_COLORS[0], // Teal - Pro color
            'icon' => self::PRO_ICONS[0], // Globe - Pro icon
        ]);

        $this->createDefaultLists($project1);

        // Project 2: Mobile App (owned by Pro user)
        $project2 = Project::create([
            'user_id' => $proUser->id,
            'name' => 'Mobile App Development',
            'description' => 'Build iOS and Android app',
            'color' => self::PRO_COLORS[2], // Pink - Pro color
            'icon' => self::PRO_ICONS[6], // Smartphone - Pro icon
        ]);

        $this->createDefaultLists($project2);

        // Project 3: Marketing Campaign (owned by Pro user)
        $project3 = Project::create([
            'user_id' => $proUser->id,
            'name' => 'Q1 Marketing Campaign',
            'description' => null,
            'color' => self::FREE_COLORS[3], // Orange
            'icon' => self::FREE_ICONS[5], // Target
        ]);

        $this->createDefaultLists($project3);

        // ============================================================
        // Free user projects - respects Free plan limits:
        // - Max 3 projects
        // - Max 5 lists per project
        // - Only Free colors/icons
        // ============================================================

        // Project 4: Personal Tasks (owned by Free user)
        $project4 = Project::create([
            'user_id' => $freeUser->id,
            'name' => 'Personal Tasks',
            'description' => 'My personal task list',
            'color' => self::FREE_COLORS[5], // Purple - Free color
            'icon' => self::FREE_ICONS[0], // Folder Kanban - Free icon
        ]);

        $this->createFreePlanLists($project4); // Only 4 lists (within Free limit of 5)

        // Project 5: Side Project (owned by Free user - 2nd project)
        $project5 = Project::create([
            'user_id' => $freeUser->id,
            'name' => 'Side Project',
            'description' => 'Weekend coding project',
            'color' => self::FREE_COLORS[1], // Blue - Free color
            'icon' => self::FREE_ICONS[3], // Code - Free icon
        ]);

        $this->createFreePlanLists($project5);

        // Free user has 2 projects, leaving room for 1 more to test the limit
    }

    /**
     * Create default lists and sample tasks for a project (Pro users - no limit).
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
     * Create lists for Free plan users (max 5 lists).
     */
    private function createFreePlanLists(Project $project): void
    {
        // Free plan: max 5 lists, seeding 4 to leave room for testing
        $listNames = ['To Do', 'In Progress', 'Review', 'Done'];

        foreach ($listNames as $position => $name) {
            $list = TaskList::create([
                'project_id' => $project->id,
                'name' => $name,
                'position' => $position,
                'is_done_list' => $name === 'Done',
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
