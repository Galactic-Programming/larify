<?php

namespace Database\Seeders;

use App\Enums\ProjectRole;
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
        // Get users by email
        $alice = User::where('email', 'alice@laraflow.test')->first();
        $bob = User::where('email', 'bob@laraflow.test')->first();
        $charlie = User::where('email', 'charlie@laraflow.test')->first();
        $diana = User::where('email', 'diana@laraflow.test')->first();
        $edward = User::where('email', 'edward@laraflow.test')->first();

        $frank = User::where('email', 'frank@laraflow.test')->first();
        $grace = User::where('email', 'grace@laraflow.test')->first();
        $henry = User::where('email', 'henry@laraflow.test')->first();

        // ============================================================
        // PRO USER PROJECTS (unlimited projects, can invite members)
        // ============================================================

        // Frank's Projects (3 projects, 2 with team members)
        $websiteRedesign = $this->createProject($frank, [
            'name' => 'Website Redesign',
            'description' => 'Redesign company website with modern UI/UX',
            'color' => self::PRO_COLORS[0],
            'icon' => self::PRO_ICONS[0],
        ]);
        $this->addMembers($websiteRedesign, [$alice, $bob]);

        $mobileApp = $this->createProject($frank, [
            'name' => 'Mobile App Development',
            'description' => 'Build iOS and Android app using React Native',
            'color' => self::PRO_COLORS[2],
            'icon' => self::PRO_ICONS[6],
        ]);
        $this->addMembers($mobileApp, [$charlie]);

        $this->createProject($frank, [
            'name' => 'API Integration',
            'description' => 'Integrate third-party APIs and services',
            'color' => self::FREE_COLORS[1],
            'icon' => self::FREE_ICONS[3],
        ]);

        // Grace's Projects (3 projects, 1 with team members)
        $marketing = $this->createProject($grace, [
            'name' => 'Q1 Marketing Campaign',
            'description' => 'Plan and execute quarterly marketing initiatives',
            'color' => self::FREE_COLORS[3],
            'icon' => self::FREE_ICONS[5],
        ]);
        $this->addMembers($marketing, [$diana]);

        $this->createProject($grace, [
            'name' => 'E-commerce Platform',
            'description' => 'Develop full-featured online shopping platform',
            'color' => self::PRO_COLORS[1],
            'icon' => self::PRO_ICONS[7],
        ]);

        $this->createProject($grace, [
            'name' => 'Customer Portal',
            'description' => 'Create self-service portal for customers',
            'color' => self::PRO_COLORS[3],
            'icon' => self::PRO_ICONS[2],
        ]);

        // Henry's Projects (2 projects, 1 with team members)
        $dashboard = $this->createProject($henry, [
            'name' => 'Dashboard Analytics',
            'description' => 'Build real-time analytics dashboard with charts',
            'color' => self::PRO_COLORS[4],
            'icon' => self::PRO_ICONS[1],
        ]);
        $this->addMembers($dashboard, [$edward]);

        $this->createProject($henry, [
            'name' => 'Content Management',
            'description' => 'Develop CMS for marketing team',
            'color' => self::FREE_COLORS[5],
            'icon' => self::PRO_ICONS[9],
        ]);

        // ============================================================
        // FREE USER PROJECTS (max 3 projects, no team features)
        // ============================================================

        // Alice's Projects (2/3 - room to test limit)
        $this->createProject($alice, [
            'name' => 'Personal Tasks',
            'description' => 'My personal task list',
            'color' => self::FREE_COLORS[5],
            'icon' => self::FREE_ICONS[0],
        ], isFree: true);

        $this->createProject($alice, [
            'name' => 'Side Project',
            'description' => 'Weekend coding project',
            'color' => self::FREE_COLORS[1],
            'icon' => self::FREE_ICONS[3],
        ], isFree: true);

        // Bob's Projects (2/3)
        $this->createProject($bob, [
            'name' => 'Home Renovation',
            'description' => 'Track home improvement tasks',
            'color' => self::FREE_COLORS[2],
            'icon' => self::FREE_ICONS[1],
        ], isFree: true);

        $this->createProject($bob, [
            'name' => 'Book Club',
            'description' => 'Reading list and discussions',
            'color' => self::FREE_COLORS[4],
            'icon' => self::FREE_ICONS[6],
        ], isFree: true);

        // Charlie's Project (1/3)
        $this->createProject($charlie, [
            'name' => 'Fitness Tracker',
            'description' => 'Workout routines and progress',
            'color' => self::FREE_COLORS[2],
            'icon' => self::FREE_ICONS[4],
        ], isFree: true);

        // Diana's Project (1/3)
        $this->createProject($diana, [
            'name' => 'Travel Planning',
            'description' => 'Trip itineraries and bookings',
            'color' => self::FREE_COLORS[3],
            'icon' => self::FREE_ICONS[7],
        ], isFree: true);

        // Edward's Projects (2/3)
        $this->createProject($edward, [
            'name' => 'Study Notes',
            'description' => 'Course materials and assignments',
            'color' => self::FREE_COLORS[0],
            'icon' => self::FREE_ICONS[2],
        ], isFree: true);

        $this->createProject($edward, [
            'name' => 'Recipe Collection',
            'description' => 'Favorite recipes to try',
            'color' => self::FREE_COLORS[1],
            'icon' => self::FREE_ICONS[5],
        ], isFree: true);
    }

    /**
     * Create a project with default lists and tasks.
     */
    private function createProject(User $owner, array $data, bool $isFree = false): Project
    {
        $project = Project::create([
            'user_id' => $owner->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'color' => $data['color'],
            'icon' => $data['icon'],
        ]);

        $this->createLists($project, $isFree);

        return $project;
    }

    /**
     * Add members to a project and sync conversation.
     */
    private function addMembers(Project $project, array $users): void
    {
        foreach ($users as $user) {
            $project->members()->attach($user->id, [
                'role' => ProjectRole::Editor->value,
                'joined_at' => now(),
            ]);
        }

        // Create/sync conversation for projects with 2+ members
        $project->getOrCreateConversation();
    }

    /**
     * Create lists for a project.
     */
    private function createLists(Project $project, bool $isFree = false): void
    {
        $listNames = ['To Do', 'In Progress', 'Review', 'Done'];

        foreach ($listNames as $position => $name) {
            $list = TaskList::create([
                'project_id' => $project->id,
                'name' => $name,
                'position' => $position,
                'is_done_list' => $name === 'Done',
            ]);

            $this->createTasks($project, $list, $position);
        }
    }

    /**
     * Create sample tasks for a list.
     */
    private function createTasks(Project $project, TaskList $list, int $listPosition): void
    {
        $taskCount = match ($listPosition) {
            0 => 4, // To Do: 4 tasks
            1 => 2, // In Progress: 2 tasks
            2 => 1, // Review: 1 task
            3 => 3, // Done: 3 tasks
            default => 2,
        };

        $isCompleted = $listPosition === 3;

        $factory = Task::factory()
            ->for($project)
            ->for($list, 'list');

        if ($isCompleted) {
            $factory = $factory->completed();
        }

        for ($i = 0; $i < $taskCount; $i++) {
            $factory->create(['position' => $i]);
        }
    }
}
