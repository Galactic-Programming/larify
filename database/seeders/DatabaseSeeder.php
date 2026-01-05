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
        $this->call([
            AIUserSeeder::class, // Must run first - creates system AI user
            PlanSeeder::class,
            UserSeeder::class,
            ProjectSeeder::class,
        ]);
    }
}
