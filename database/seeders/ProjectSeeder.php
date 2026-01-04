<?php

namespace Database\Seeders;

use App\Enums\ActivityType;
use App\Enums\ProjectRole;
use App\Enums\TaskPriority;
use App\Models\Activity;
use App\Models\Label;
use App\Models\Message;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskComment;
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

    // Sample messages for conversations
    private const MESSAGES = [
        'Hey team! Just pushed the latest updates to the repo.',
        'Great work on the design! I love the new color scheme.',
        'Can someone review my PR? It\'s ready for merge.',
        'The client approved the mockups! 🎉',
        'I\'ll be working on the API integration today.',
        'Don\'t forget we have a standup at 10am.',
        'Has anyone encountered this bug before?',
        'I fixed the navigation issue. Should be good now.',
        'Let me know if you need help with the testing.',
        'The deployment went smoothly. All systems are go!',
        'I updated the documentation with the new endpoints.',
        'Quick question about the database schema...',
        'Who\'s available for a code review session?',
        'The new feature is live! Check it out.',
        'Nice catch on that edge case! 👍',
    ];

    // Sample task comments
    private const COMMENTS = [
        'I\'ll start working on this today.',
        'This might take longer than expected due to complexity.',
        'Done! Ready for review.',
        'Can someone clarify the requirements here?',
        'I found a potential issue - let me investigate.',
        'Updated the approach based on feedback.',
        'This is blocked by the API changes.',
        'Great progress! Keep it up.',
        'I think we should reconsider the design here.',
        'Tested and verified - works as expected.',
        'Added some edge case handling.',
        'Could use some help with this one.',
    ];

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
        $this->addMembers($websiteRedesign, [$alice, $bob], $frank);
        $this->createLabels($websiteRedesign);
        $this->createActivities($websiteRedesign, [$frank, $alice, $bob]);
        $this->createConversationWithMessages($websiteRedesign, [$frank, $alice, $bob]);

        $mobileApp = $this->createProject($frank, [
            'name' => 'Mobile App Development',
            'description' => 'Build iOS and Android app using React Native',
            'color' => self::PRO_COLORS[2],
            'icon' => self::PRO_ICONS[6],
        ]);
        $this->addMembers($mobileApp, [$charlie], $frank);
        $this->createLabels($mobileApp);
        $this->createActivities($mobileApp, [$frank, $charlie]);
        $this->createConversationWithMessages($mobileApp, [$frank, $charlie]);

        $apiProject = $this->createProject($frank, [
            'name' => 'API Integration',
            'description' => 'Integrate third-party APIs and services',
            'color' => self::FREE_COLORS[1],
            'icon' => self::FREE_ICONS[3],
        ]);
        $this->createLabels($apiProject);
        $this->createActivities($apiProject, [$frank]);

        // Grace's Projects (3 projects, 1 with team members)
        $marketing = $this->createProject($grace, [
            'name' => 'Q1 Marketing Campaign',
            'description' => 'Plan and execute quarterly marketing initiatives',
            'color' => self::FREE_COLORS[3],
            'icon' => self::FREE_ICONS[5],
        ]);
        $this->addMembers($marketing, [$diana], $grace);
        $this->createLabels($marketing);
        $this->createActivities($marketing, [$grace, $diana]);
        $this->createConversationWithMessages($marketing, [$grace, $diana]);

        $ecommerce = $this->createProject($grace, [
            'name' => 'E-commerce Platform',
            'description' => 'Develop full-featured online shopping platform',
            'color' => self::PRO_COLORS[1],
            'icon' => self::PRO_ICONS[7],
        ]);
        $this->createLabels($ecommerce);
        $this->createActivities($ecommerce, [$grace]);

        $customerPortal = $this->createProject($grace, [
            'name' => 'Customer Portal',
            'description' => 'Create self-service portal for customers',
            'color' => self::PRO_COLORS[3],
            'icon' => self::PRO_ICONS[2],
        ]);
        $this->createLabels($customerPortal);
        $this->createActivities($customerPortal, [$grace]);

        // Henry's Projects (2 projects, 1 with team members)
        $dashboard = $this->createProject($henry, [
            'name' => 'Dashboard Analytics',
            'description' => 'Build real-time analytics dashboard with charts',
            'color' => self::PRO_COLORS[4],
            'icon' => self::PRO_ICONS[1],
        ]);
        $this->addMembers($dashboard, [$edward], $henry);
        $this->createLabels($dashboard);
        $this->createActivities($dashboard, [$henry, $edward]);
        $this->createConversationWithMessages($dashboard, [$henry, $edward]);

        $cms = $this->createProject($henry, [
            'name' => 'Content Management',
            'description' => 'Develop CMS for marketing team',
            'color' => self::FREE_COLORS[5],
            'icon' => self::PRO_ICONS[9],
        ]);
        $this->createLabels($cms);
        $this->createActivities($cms, [$henry]);

        // ============================================================
        // FREE USER PROJECTS (max 3 projects, no team features)
        // ============================================================

        // Alice's Projects (2/3 - room to test limit)
        $alicePersonal = $this->createProject($alice, [
            'name' => 'Personal Tasks',
            'description' => 'My personal task list',
            'color' => self::FREE_COLORS[5],
            'icon' => self::FREE_ICONS[0],
        ], isFree: true);
        $this->createLabels($alicePersonal, isFree: true);
        $this->createActivities($alicePersonal, [$alice]);

        $aliceSideProject = $this->createProject($alice, [
            'name' => 'Side Project',
            'description' => 'Weekend coding project',
            'color' => self::FREE_COLORS[1],
            'icon' => self::FREE_ICONS[3],
        ], isFree: true);
        $this->createLabels($aliceSideProject, isFree: true);
        $this->createActivities($aliceSideProject, [$alice]);

        // Bob's Projects (2/3)
        $bobHome = $this->createProject($bob, [
            'name' => 'Home Renovation',
            'description' => 'Track home improvement tasks',
            'color' => self::FREE_COLORS[2],
            'icon' => self::FREE_ICONS[1],
        ], isFree: true);
        $this->createLabels($bobHome, isFree: true);
        $this->createActivities($bobHome, [$bob]);

        $bobBookClub = $this->createProject($bob, [
            'name' => 'Book Club',
            'description' => 'Reading list and discussions',
            'color' => self::FREE_COLORS[4],
            'icon' => self::FREE_ICONS[6],
        ], isFree: true);
        $this->createLabels($bobBookClub, isFree: true);
        $this->createActivities($bobBookClub, [$bob]);

        // Charlie's Project (1/3)
        $charlieFitness = $this->createProject($charlie, [
            'name' => 'Fitness Tracker',
            'description' => 'Workout routines and progress',
            'color' => self::FREE_COLORS[2],
            'icon' => self::FREE_ICONS[4],
        ], isFree: true);
        $this->createLabels($charlieFitness, isFree: true);
        $this->createActivities($charlieFitness, [$charlie]);

        // Diana's Project (1/3)
        $dianaTravel = $this->createProject($diana, [
            'name' => 'Travel Planning',
            'description' => 'Trip itineraries and bookings',
            'color' => self::FREE_COLORS[3],
            'icon' => self::FREE_ICONS[7],
        ], isFree: true);
        $this->createLabels($dianaTravel, isFree: true);
        $this->createActivities($dianaTravel, [$diana]);

        // Edward's Projects (2/3)
        $edwardStudy = $this->createProject($edward, [
            'name' => 'Study Notes',
            'description' => 'Course materials and assignments',
            'color' => self::FREE_COLORS[0],
            'icon' => self::FREE_ICONS[2],
        ], isFree: true);
        $this->createLabels($edwardStudy, isFree: true);
        $this->createActivities($edwardStudy, [$edward]);

        $edwardRecipes = $this->createProject($edward, [
            'name' => 'Recipe Collection',
            'description' => 'Favorite recipes to try',
            'color' => self::FREE_COLORS[1],
            'icon' => self::FREE_ICONS[5],
        ], isFree: true);
        $this->createLabels($edwardRecipes, isFree: true);
        $this->createActivities($edwardRecipes, [$edward]);
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

        // Log project creation activity
        Activity::create([
            'user_id' => $owner->id,
            'project_id' => $project->id,
            'subject_type' => Project::class,
            'subject_id' => $project->id,
            'type' => ActivityType::ProjectCreated,
            'description' => 'created the project',
            'properties' => ['project_name' => $project->name],
        ]);

        $this->createLists($project, $owner, $isFree);

        return $project;
    }

    /**
     * Add members to a project and sync conversation.
     */
    private function addMembers(Project $project, array $users, User $owner): void
    {
        foreach ($users as $user) {
            $project->members()->attach($user->id, [
                'role' => ProjectRole::Editor->value,
                'joined_at' => now()->subDays(rand(1, 30)),
            ]);

            // Log member added activity
            Activity::create([
                'user_id' => $owner->id,
                'project_id' => $project->id,
                'subject_type' => User::class,
                'subject_id' => $user->id,
                'type' => ActivityType::MemberAdded,
                'description' => 'added a member',
                'properties' => [
                    'member_id' => $user->id,
                    'member_name' => $user->name,
                ],
            ]);
        }

        // Create/sync conversation for projects with 2+ members
        $project->getOrCreateConversation();
    }

    /**
     * Create labels for a project.
     */
    private function createLabels(Project $project, bool $isFree = false): void
    {
        $labels = [
            ['name' => 'Bug', 'color' => 'red'],
            ['name' => 'Feature', 'color' => 'blue'],
            ['name' => 'Enhancement', 'color' => 'purple'],
            ['name' => 'Documentation', 'color' => 'gray'],
            ['name' => 'Urgent', 'color' => 'yellow'],
            ['name' => 'Help Wanted', 'color' => 'green'],
        ];

        // Add extra labels for Pro projects
        if (! $isFree) {
            $labels = array_merge($labels, [
                ['name' => 'Design', 'color' => 'pink'],
                ['name' => 'Backend', 'color' => 'indigo'],
                ['name' => 'Frontend', 'color' => 'cyan'],
                ['name' => 'Testing', 'color' => 'teal'],
            ]);
        }

        foreach ($labels as $labelData) {
            Label::create([
                'project_id' => $project->id,
                'name' => $labelData['name'],
                'color' => $labelData['color'],
            ]);
        }
    }

    /**
     * Create lists for a project.
     */
    private function createLists(Project $project, User $owner, bool $isFree = false): void
    {
        $listNames = ['To Do', 'In Progress', 'Review', 'Done'];

        foreach ($listNames as $position => $name) {
            $list = TaskList::create([
                'project_id' => $project->id,
                'name' => $name,
                'position' => $position,
                'is_done_list' => $name === 'Done',
            ]);

            // Log list creation (only for first list to reduce noise)
            if ($position === 0) {
                Activity::create([
                    'user_id' => $owner->id,
                    'project_id' => $project->id,
                    'subject_type' => TaskList::class,
                    'subject_id' => $list->id,
                    'type' => ActivityType::ListCreated,
                    'description' => 'created lists',
                    'properties' => ['list_names' => $listNames],
                ]);
            }

            $this->createTasks($project, $list, $position, $owner);
        }
    }

    /**
     * Create sample tasks for a list.
     */
    private function createTasks(Project $project, TaskList $list, int $listPosition, User $owner): void
    {
        $taskCount = match ($listPosition) {
            0 => 4, // To Do: 4 tasks
            1 => 2, // In Progress: 2 tasks
            2 => 1, // Review: 1 task
            3 => 3, // Done: 3 tasks
            default => 2,
        };

        $isCompleted = $listPosition === 3;

        // Get available members for assignment
        $memberIds = $project->members()->pluck('users.id')->toArray();
        $memberIds[] = $project->user_id;

        $factory = Task::factory()
            ->for($project)
            ->for($list, 'list');

        if ($isCompleted) {
            $factory = $factory->completed();
        }

        // Get labels for this project
        $labelIds = $project->labels()->pluck('id')->toArray();

        for ($i = 0; $i < $taskCount; $i++) {
            $task = $factory->create([
                'position' => $i,
                'created_by' => $owner->id,
                'assigned_to' => fake()->optional(0.5)->randomElement($memberIds),
                'priority' => fake()->randomElement(TaskPriority::cases()),
            ]);

            // Randomly attach labels (0-3 labels per task)
            if (! empty($labelIds)) {
                $numLabels = rand(0, min(3, count($labelIds)));
                if ($numLabels > 0) {
                    $selectedLabels = array_rand(array_flip($labelIds), $numLabels);
                    $task->labels()->attach((array) $selectedLabels);
                }
            }

            // Add comments to some tasks (30% chance)
            if (fake()->boolean(30)) {
                $this->createTaskComments($task, $memberIds);
            }
        }
    }

    /**
     * Create comments for a task.
     */
    private function createTaskComments(Task $task, array $userIds): void
    {
        $commentCount = rand(1, 4);

        for ($i = 0; $i < $commentCount; $i++) {
            $comment = TaskComment::create([
                'task_id' => $task->id,
                'user_id' => fake()->randomElement($userIds),
                'content' => fake()->randomElement(self::COMMENTS),
                'is_edited' => fake()->boolean(10),
                'edited_at' => fake()->boolean(10) ? now()->subHours(rand(1, 24)) : null,
                'created_at' => now()->subDays(rand(0, 7))->subHours(rand(0, 23)),
            ]);

            // Add reply (20% chance)
            if (fake()->boolean(20)) {
                TaskComment::create([
                    'task_id' => $task->id,
                    'user_id' => fake()->randomElement($userIds),
                    'parent_id' => $comment->id,
                    'content' => fake()->randomElement([
                        'Thanks for the update!',
                        'I agree, let\'s proceed.',
                        'Got it, I\'ll take a look.',
                        'Good point! 👍',
                        'Let me check and get back to you.',
                    ]),
                    'is_edited' => false,
                    'created_at' => $comment->created_at->addHours(rand(1, 12)),
                ]);
            }
        }
    }

    /**
     * Create activities for a project.
     */
    private function createActivities(Project $project, array $users): void
    {
        $activityTypes = [
            ActivityType::TaskCreated,
            ActivityType::TaskCompleted,
            ActivityType::TaskUpdated,
            ActivityType::TaskMoved,
        ];

        // Create 5-10 random activities for the project
        $activityCount = rand(5, 10);
        $tasks = $project->tasks()->get();

        for ($i = 0; $i < $activityCount && $tasks->isNotEmpty(); $i++) {
            $task = $tasks->random();
            $type = fake()->randomElement($activityTypes);
            $user = fake()->randomElement($users);

            $properties = ['task_title' => $task->title];

            if ($type === ActivityType::TaskMoved) {
                $lists = $project->lists()->get();
                if ($lists->count() >= 2) {
                    $fromList = $lists->random();
                    $toList = $lists->where('id', '!=', $fromList->id)->random();
                    $properties['from_list'] = $fromList->name;
                    $properties['to_list'] = $toList->name;
                }
            }

            Activity::create([
                'user_id' => $user->id,
                'project_id' => $project->id,
                'subject_type' => Task::class,
                'subject_id' => $task->id,
                'type' => $type,
                'description' => $type->label(),
                'properties' => $properties,
                'created_at' => now()->subDays(rand(0, 7))->subHours(rand(0, 23)),
                'updated_at' => now()->subDays(rand(0, 7))->subHours(rand(0, 23)),
            ]);
        }
    }

    /**
     * Create conversation with messages for a project.
     */
    private function createConversationWithMessages(Project $project, array $users): void
    {
        $conversation = $project->conversation;

        if (! $conversation) {
            return;
        }

        // Create 5-15 messages
        $messageCount = rand(5, 15);
        $baseTime = now()->subDays(7);

        for ($i = 0; $i < $messageCount; $i++) {
            $sender = fake()->randomElement($users);
            $createdAt = $baseTime->copy()->addHours($i * rand(2, 8))->addMinutes(rand(0, 59));

            Message::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $sender->id,
                'content' => fake()->randomElement(self::MESSAGES),
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }

        // Update conversation's last_message_at
        $lastMessage = $conversation->messages()->latest()->first();
        if ($lastMessage) {
            $conversation->update(['last_message_at' => $lastMessage->created_at]);
        }

        // Mark some messages as read for participants
        foreach ($users as $user) {
            $participant = $conversation->participantRecords()
                ->where('user_id', $user->id)
                ->first();

            if ($participant && fake()->boolean(70)) {
                $participant->update([
                    'last_read_at' => now()->subHours(rand(0, 24)),
                ]);
            }
        }
    }
}
