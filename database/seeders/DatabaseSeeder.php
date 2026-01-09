<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // In production, only seed essential system data
        if (app()->environment('production')) {
            $this->call([
                AIUserSeeder::class, // System AI user
                PlanSeeder::class,   // Subscription plans
            ]);
        } else {
            // In local/development, seed everything including test data
            $this->call([
                AIUserSeeder::class, // Must run first - creates system AI user
                PlanSeeder::class,
                UserSeeder::class,
                ProjectSeeder::class,
            ]);
        }
    }
}
