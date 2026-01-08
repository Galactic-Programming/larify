<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ProductionSeeder extends Seeder
{
    /**
     * Seed essential data for production.
     *
     * This seeder only includes system-critical data that doesn't
     * require Faker or create test users/projects.
     */
    public function run(): void
    {
        $this->call([
            AIUserSeeder::class, // System AI user
            PlanSeeder::class,   // Subscription plans
        ]);
    }
}
