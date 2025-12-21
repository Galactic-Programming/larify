<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This is Laravel's standard notifications table for database notifications.
     * Used for personal notifications to users (task assigned, invited to project, etc.)
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type'); // Notification class name (e.g., App\Notifications\TaskAssigned)
            $table->morphs('notifiable'); // notifiable_type + notifiable_id (usually User)
            $table->json('data'); // JSON payload with notification details
            $table->timestamp('read_at')->nullable(); // null = unread
            $table->timestamps();

            // Index for faster queries on unread notifications
            $table->index(['notifiable_type', 'notifiable_id', 'read_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
