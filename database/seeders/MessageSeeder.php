<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MessageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // For each conversation, create 10-30 messages from its participants
        \App\Models\Conversation::all()->each(function ($conversation) {
            $participantIds = $conversation->participants()->pluck('users.id');
            $count = fake()->numberBetween(10, 30);
            for ($i = 0; $i < $count; $i++) {
                \App\Models\Message::factory()->create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $participantIds->random(),
                    'created_at' => now()->subMinutes(fake()->numberBetween(0, 10000)),
                ]);
            }
        });
    }
}
