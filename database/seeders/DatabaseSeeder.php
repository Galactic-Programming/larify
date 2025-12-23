<?php

namespace Database\Seeders;

use App\Enums\UserPlan;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Free plan test user
        User::firstOrCreate(
            ['email' => 'free@example.com'],
            [
                'name' => 'Test Free',
                'password' => 'password',
                'email_verified_at' => now(),
                'plan' => UserPlan::Free,
            ]
        );

        // Create Pro plan test user
        User::firstOrCreate(
            ['email' => 'pro@example.com'],
            [
                'name' => 'Test Pro',
                'password' => 'password',
                'email_verified_at' => now(),
                'plan' => UserPlan::Pro,
            ]
        );

        $this->call([
            PlanSeeder::class,
            ProjectSeeder::class,
            // Chat seeders
            ConversationSeeder::class,
            ConversationParticipantSeeder::class,
            MessageSeeder::class,
            MessageAttachmentSeeder::class,
        ]);
    }
}
