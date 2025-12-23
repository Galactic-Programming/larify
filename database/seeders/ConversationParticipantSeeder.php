<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ConversationParticipantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // For each conversation, add 2-5 participants
        \App\Models\Conversation::all()->each(function ($conversation) {
            $users = \App\Models\User::inRandomOrder()->limit(fake()->numberBetween(2, 5))->pluck('id');
            foreach ($users as $i => $userId) {
                \App\Models\ConversationParticipant::factory()->create([
                    'conversation_id' => $conversation->id,
                    'user_id' => $userId,
                    'role' => $i === 0 ? 'owner' : 'member',
                    'joined_at' => now()->subDays(fake()->numberBetween(1, 14)),
                ]);
            }
        });
    }
}
