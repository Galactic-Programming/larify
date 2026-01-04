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
            [
                'name' => 'Alice Johnson',
                'email' => 'alice@laraflow.test',
                'avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alice',
            ],
            [
                'name' => 'Bob Smith',
                'email' => 'bob@laraflow.test',
                'avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bob',
            ],
            [
                'name' => 'Charlie Brown',
                'email' => 'charlie@laraflow.test',
                'avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=Charlie',
            ],
            [
                'name' => 'Diana Prince',
                'email' => 'diana@laraflow.test',
                'avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=Diana',
            ],
            [
                'name' => 'Edward Chen',
                'email' => 'edward@laraflow.test',
                'avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=Edward',
            ],
        ];

        foreach ($freeUsers as $userData) {
            User::factory()->free()->create($userData);
        }

        // Pro Plan Users (3)
        $proUsers = [
            [
                'name' => 'Frank Miller',
                'email' => 'frank@laraflow.test',
                'avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=Frank',
            ],
            [
                'name' => 'Grace Lee',
                'email' => 'grace@laraflow.test',
                'avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=Grace',
            ],
            [
                'name' => 'Henry Wilson',
                'email' => 'henry@laraflow.test',
                'avatar' => 'https://api.dicebear.com/9.x/avataaars/svg?seed=Henry',
            ],
        ];

        foreach ($proUsers as $userData) {
            User::factory()->pro()->create($userData);
        }
    }
}
