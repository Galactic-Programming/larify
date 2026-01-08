<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Activities table stores all actions/events within projects.
     * This is used for the Activity Feed - showing what happened in projects.
     *
     * Example activities:
     * - "John created task 'Design homepage'"
     * - "Mary completed task 'Fix login bug'"
     * - "Admin added Bob to project"
     * - "Project 'Mobile App' was archived"
     */
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();

            // Who performed the action (can be null for system actions)
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Which project this activity belongs to (for filtering by project)
            $table->foreignId('project_id')->nullable()->constrained()->cascadeOnDelete();

            // The subject of the activity (polymorphic: Task, Project, TaskList, User, etc.)
            $table->nullableMorphs('subject'); // subject_type + subject_id

            // Activity type (e.g., 'task.created', 'task.completed', 'member.added', 'project.archived')
            $table->string('type');

            // Human-readable description (optional, can be generated from type)
            $table->string('description')->nullable();

            // Additional data as JSON (old values, new values, metadata, etc.)
            $table->json('properties')->nullable();

            $table->timestamps();

            // Indexes for common queries
            $table->index('type');
            $table->index(['project_id', 'created_at']); // Project activity feed (chronological)
            $table->index(['user_id', 'created_at']); // User's activity history
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
