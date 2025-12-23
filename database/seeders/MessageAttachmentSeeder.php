<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MessageAttachmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Randomly attach files to some messages
        \App\Models\Message::inRandomOrder()->limit(20)->get()->each(function ($message) {
            if (fake()->boolean(30)) {
                \App\Models\MessageAttachment::factory()->create([
                    'message_id' => $message->id,
                ]);
            }
        });
    }
}
