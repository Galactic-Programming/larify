<?php

namespace Database\Seeders;

use App\Enums\UserPlan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AIUserSeeder extends Seeder
{
    /**
     * The reserved email for the AI assistant user.
     */
    public const AI_EMAIL = 'ai@laraflow.app';

    /**
     * Seed the AI assistant user.
     *
     * This creates a special system user that represents the AI assistant.
     * The AI user is used as the sender for AI-generated messages in conversations.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => self::AI_EMAIL],
            [
                'name' => 'Laraflow AI',
                'email' => self::AI_EMAIL,
                'avatar' => null, // Will use a special AI avatar in frontend
                'password' => Hash::make(bin2hex(random_bytes(32))), // Random unguessable password
                'email_verified_at' => now(),
                'plan' => UserPlan::Pro, // AI has Pro features
            ]
        );
    }
}
