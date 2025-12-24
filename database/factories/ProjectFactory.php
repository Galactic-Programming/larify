<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Project>
 */
class ProjectFactory extends Factory
{
    protected $model = Project::class;

    // Realistic project names
    private const PROJECT_NAMES = [
        'Website Redesign',
        'Mobile App Development',
        'Q1 Marketing Campaign',
        'E-commerce Platform',
        'Customer Portal',
        'API Integration',
        'Dashboard Analytics',
        'Content Management System',
        'Inventory Management',
        'HR Management System',
        'Social Media App',
        'Payment Gateway Integration',
        'Data Migration Project',
        'Security Audit',
        'Performance Optimization',
    ];

    // Realistic project descriptions
    private const PROJECT_DESCRIPTIONS = [
        'Redesign with modern UI/UX and improved user experience',
        'Build cross-platform mobile application for iOS and Android',
        'Plan and execute quarterly marketing initiatives',
        'Develop full-featured online shopping platform',
        'Create self-service portal for customers',
        'Integrate third-party APIs and services',
        'Build real-time analytics dashboard with charts and reports',
        'Develop content management system for marketing team',
        'Track inventory levels and automate reordering',
        'Streamline HR processes and employee management',
        'Create social networking features and engagement tools',
        'Implement secure payment processing system',
        'Migrate legacy data to new platform',
        'Conduct security assessment and implement fixes',
        'Improve application speed and reduce load times',
    ];

    private const COLORS = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
        '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#06b6d4',
    ];

    private const ICONS = [
        'folder-kanban', 'folder', 'briefcase', 'code', 'rocket',
        'target', 'lightbulb', 'users', 'globe', 'layers',
        'package', 'database', 'smartphone', 'shopping-cart',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->randomElement(self::PROJECT_NAMES),
            'description' => fake()->optional(0.7)->randomElement(self::PROJECT_DESCRIPTIONS),
            'color' => fake()->randomElement(self::COLORS),
            'icon' => fake()->randomElement(self::ICONS),
            'is_archived' => false,
        ];
    }

    /**
     * Indicate that the project is archived.
     */
    public function archived(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_archived' => true,
        ]);
    }
}
