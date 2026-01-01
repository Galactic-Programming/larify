<?php

use App\Enums\UserPlan;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get(route('dashboard'))->assertOk();
});

test('dashboard returns correct stats structure', function () {
    $user = User::factory()->create(['plan' => UserPlan::Pro]);
    $project = Project::factory()->for($user)->create();

    $this->actingAs($user);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('stats', fn (Assert $stats) => $stats
                ->has('my_tasks_count')
                ->has('overdue_count')
                ->has('due_today_count')
                ->has('high_priority_count')
                ->has('projects_count')
                ->has('archived_projects_count')
                ->has('avg_progress')
                ->has('total_project_tasks')
                ->has('completed_project_tasks')
                ->has('completed_this_week')
                ->has('completed_last_week')
                ->has('week_change')
            )
            ->has('myTasks', fn (Assert $tasks) => $tasks
                ->has('overdue')
                ->has('today')
                ->has('later')
            )
            ->has('upcomingDeadlines')
            ->has('recentActivities')
            ->has('recentProjects')
        );
});

test('dashboard shows user assigned tasks', function () {
    $user = User::factory()->create(['plan' => UserPlan::Pro]);
    $project = Project::factory()->for($user)->create();
    $list = $project->lists()->create(['name' => 'To Do']);

    // Task assigned to user
    Task::factory()
        ->for($project)
        ->for($list, 'list')
        ->for($user, 'assignee')
        ->create(['title' => 'My assigned task']);

    // Task not assigned to user
    $otherUser = User::factory()->create();
    Task::factory()
        ->for($project)
        ->for($list, 'list')
        ->for($otherUser, 'assignee')
        ->create(['title' => 'Someone else task']);

    $this->actingAs($user);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.my_tasks_count', 1)
        );
});

test('dashboard shows overdue tasks count', function () {
    $user = User::factory()->create(['plan' => UserPlan::Pro]);
    $project = Project::factory()->for($user)->create();
    $list = $project->lists()->create(['name' => 'To Do']);

    // Overdue task
    Task::factory()
        ->for($project)
        ->for($list, 'list')
        ->for($user, 'assignee')
        ->create([
            'due_date' => now()->subDay(),
            'due_time' => '09:00:00',
        ]);

    // Future task
    Task::factory()
        ->for($project)
        ->for($list, 'list')
        ->for($user, 'assignee')
        ->create([
            'due_date' => now()->addWeek(),
            'due_time' => '12:00:00',
        ]);

    $this->actingAs($user);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.overdue_count', 1)
        );
});

test('dashboard shows recent projects with progress', function () {
    $user = User::factory()->create(['plan' => UserPlan::Pro]);
    $project = Project::factory()->for($user)->create(['name' => 'Test Project']);
    $list = $project->lists()->create(['name' => 'To Do']);

    // Create 3 tasks, 1 completed
    Task::factory()
        ->for($project)
        ->for($list, 'list')
        ->count(2)
        ->create();

    Task::factory()
        ->for($project)
        ->for($list, 'list')
        ->completed()
        ->create();

    $this->actingAs($user);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('recentProjects', 1, fn (Assert $proj) => $proj
                ->where('name', 'Test Project')
                ->where('total_tasks', 3)
                ->where('completed_tasks', 1)
                ->where('progress', 33)
                ->etc()
            )
        );
});

test('dashboard completed this week stats are correct', function () {
    $user = User::factory()->create(['plan' => UserPlan::Pro]);
    $project = Project::factory()->for($user)->create();
    $list = $project->lists()->create(['name' => 'To Do']);

    // Completed this week
    Task::factory()
        ->for($project)
        ->for($list, 'list')
        ->for($user, 'assignee')
        ->count(3)
        ->create(['completed_at' => now()]);

    // Completed last week
    Task::factory()
        ->for($project)
        ->for($list, 'list')
        ->for($user, 'assignee')
        ->count(2)
        ->create(['completed_at' => now()->subWeek()]);

    $this->actingAs($user);

    $this->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.completed_this_week', 3)
            ->where('stats.completed_last_week', 2)
            ->where('stats.week_change', 50) // (3-2)/2 * 100 = 50%
        );
});
