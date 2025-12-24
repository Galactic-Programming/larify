<?php

namespace Database\Factories;

use App\Enums\TaskPriority;
use App\Models\Project;
use App\Models\Task;
use App\Models\TaskList;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    protected $model = Task::class;

    // Realistic task titles organized by category
    private const TASK_TITLES = [
        // Development tasks
        'Set up development environment',
        'Create database schema',
        'Implement user authentication',
        'Build REST API endpoints',
        'Write unit tests',
        'Set up CI/CD pipeline',
        'Implement responsive navigation',
        'Add form validation',
        'Optimize database queries',
        'Fix login page bug',
        'Refactor user service',
        'Add error handling',
        'Implement file upload feature',
        'Create admin dashboard',
        'Add search functionality',
        // Design tasks
        'Design homepage mockup',
        'Create wireframes',
        'Design mobile layouts',
        'Update color palette',
        'Create icon set',
        'Design email templates',
        'Review UI/UX flow',
        // Marketing tasks
        'Write blog post',
        'Create social media content',
        'Design marketing banner',
        'Plan email campaign',
        'Analyze competitor websites',
        'Update landing page copy',
        'Schedule newsletter',
        // General tasks
        'Review project requirements',
        'Update documentation',
        'Prepare presentation slides',
        'Schedule team meeting',
        'Review pull request',
        'Test new features',
        'Deploy to staging',
        'Backup database',
        'Update dependencies',
        'Code review session',
    ];

    // Realistic task descriptions
    private const TASK_DESCRIPTIONS = [
        'Configure local environment with Docker and necessary services',
        'Design and implement database tables with proper relationships',
        'Implement OAuth with Google and GitHub providers',
        'Create CRUD operations for main resources',
        'Achieve minimum 80% code coverage',
        'Set up GitHub Actions for automated testing and deployment',
        'Build mobile-first navigation with hamburger menu',
        'Add client-side and server-side validation rules',
        'Identify and fix N+1 query issues',
        'Debug and resolve authentication flow issues',
        'Extract common logic into reusable service class',
        'Implement proper exception handling and logging',
        'Support multiple file types with size validation',
        'Build dashboard with analytics and user management',
        'Implement full-text search with filters',
        'Create modern, responsive design with Figma',
        'Design user flow diagrams for main features',
        'Ensure optimal experience on all screen sizes',
        'Review and update brand color guidelines',
        'Design consistent icon set for UI elements',
        'Create responsive email templates for notifications',
        'Conduct usability review and gather feedback',
        'Write SEO-optimized content for the blog',
        'Plan and schedule posts for the week',
        'Create eye-catching visuals for campaigns',
        'Design automated email sequence',
        'Research and document competitor features',
        'Improve conversion rate with better copy',
        'Prepare and send weekly newsletter',
        'Document all features and acceptance criteria',
        'Update API documentation and examples',
        'Create slides for stakeholder presentation',
        'Organize weekly sync with the team',
        'Review code changes and provide feedback',
        'Perform QA testing on new functionality',
        'Deploy latest changes to staging environment',
        'Create database backup before migration',
        'Update npm and composer packages',
        'Conduct team code review session',
        null, // Some tasks don't have descriptions
        null,
        null,
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'list_id' => TaskList::factory(),
            'created_by' => null, // Will be set by the controller or test
            'title' => fake()->randomElement(self::TASK_TITLES),
            'description' => fake()->optional(0.6)->randomElement(array_filter(self::TASK_DESCRIPTIONS)),
            'position' => fake()->numberBetween(0, 100),
            'priority' => fake()->randomElement(TaskPriority::cases()),
            'due_date' => fake()->dateTimeBetween('now', '+30 days'),
            'due_time' => $this->generateBusinessHourTime(),
            'completed_at' => null,
        ];
    }

    /**
     * Generate a realistic business hour time.
     */
    private function generateBusinessHourTime(): string
    {
        $hours = [9, 10, 11, 12, 14, 15, 16, 17, 18];
        $minutes = [0, 15, 30, 45];

        return sprintf(
            '%02d:%02d:00',
            $hours[array_rand($hours)],
            $minutes[array_rand($minutes)]
        );
    }

    /**
     * Indicate that the task is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'completed_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ]);
    }

    /**
     * Indicate that the task has high priority.
     */
    public function highPriority(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => TaskPriority::High,
        ]);
    }

    /**
     * Indicate that the task is urgent.
     */
    public function urgent(): static
    {
        return $this->state(fn (array $attributes) => [
            'priority' => TaskPriority::Urgent,
            'due_date' => fake()->dateTimeBetween('now', '+3 days'),
        ]);
    }
}
