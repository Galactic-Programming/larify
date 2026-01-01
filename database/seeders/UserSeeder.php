<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Seed test users for development.
     *
     * Creates 5 Free plan users and 3 Pro plan users.
     * All users have password: "password"
     */
    public function run(): void
    {
        // Free Plan Users (5)
        $freeUsers = [
            ['name' => 'Alice Johnson', 'email' => 'alice@laraflow.test'],
            ['name' => 'Bob Smith', 'email' => 'bob@laraflow.test'],
            ['name' => 'Charlie Brown', 'email' => 'charlie@laraflow.test'],
            ['name' => 'Diana Prince', 'email' => 'diana@laraflow.test'],
            ['name' => 'Edward Chen', 'email' => 'edward@laraflow.test'],
        ];

        foreach ($freeUsers as $userData) {
            User::factory()->free()->create($userData);
        }

        // Pro Plan Users (3)
        $proUsers = [
            ['name' => 'Frank Miller', 'email' => 'frank@laraflow.test'],
            ['name' => 'Grace Lee', 'email' => 'grace@laraflow.test'],
            ['name' => 'Henry Wilson', 'email' => 'henry@laraflow.test'],
        ];

        foreach ($proUsers as $userData) {
            User::factory()->pro()->create($userData);
        }
    }
}
