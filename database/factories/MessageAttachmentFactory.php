<?php

namespace Database\Factories;

use App\Models\Message;
use App\Models\MessageAttachment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MessageAttachment>
 */
class MessageAttachmentFactory extends Factory
{
    protected $model = MessageAttachment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $mimeTypes = [
            'image/jpeg' => ['jpg', 'jpeg'],
            'image/png' => ['png'],
            'image/gif' => ['gif'],
            'image/webp' => ['webp'],
            'application/pdf' => ['pdf'],
            'text/plain' => ['txt'],
            'application/msword' => ['doc'],
        ];

        $mimeType = fake()->randomElement(array_keys($mimeTypes));
        $extension = fake()->randomElement($mimeTypes[$mimeType]);
        $filename = fake()->word().'.'.$extension;

        return [
            'message_id' => Message::factory(),
            'disk' => 'public',
            'path' => 'attachments/'.fake()->uuid().'.'.$extension,
            'original_name' => $filename,
            'mime_type' => $mimeType,
            'size' => fake()->numberBetween(1024, 10485760), // 1KB - 10MB
        ];
    }

    /**
     * Indicate that the attachment is an image.
     */
    public function image(): static
    {
        $imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $mimeType = fake()->randomElement($imageTypes);
        $extension = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
        };

        return $this->state(fn (array $attributes) => [
            'mime_type' => $mimeType,
            'path' => 'attachments/'.fake()->uuid().'.'.$extension,
            'original_name' => fake()->word().'.'.$extension,
        ]);
    }

    /**
     * Indicate that the attachment is a PDF.
     */
    public function pdf(): static
    {
        return $this->state(fn (array $attributes) => [
            'mime_type' => 'application/pdf',
            'path' => 'attachments/'.fake()->uuid().'.pdf',
            'original_name' => fake()->word().'.pdf',
        ]);
    }

    /**
     * Indicate that the attachment is a document.
     */
    public function document(): static
    {
        return $this->state(fn (array $attributes) => [
            'mime_type' => 'application/msword',
            'path' => 'attachments/'.fake()->uuid().'.doc',
            'original_name' => fake()->word().'.doc',
        ]);
    }
}
