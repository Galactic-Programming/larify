<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MessageAttachment>
 */
class MessageAttachmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'message_id' => fn () => \App\Models\Message::factory(),
            'disk' => 'public',
            'path' => fake()->filePath(),
            'original_name' => fake()->word() . '.' . fake()->fileExtension(),
            'mime_type' => fake()->mimeType(),
            'size' => fake()->numberBetween(1024, 5 * 1024 * 1024),
        ];
    }
}
