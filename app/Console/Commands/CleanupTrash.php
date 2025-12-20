<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\SoftDeletes;

class CleanupTrash extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'trash:cleanup 
                            {--days= : Override the retention period in days}
                            {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete items that have been in trash longer than the retention period';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = $this->option('days') ?? config('trash.retention_days', 7);
        $dryRun = $this->option('dry-run');
        $cutoffDate = now()->subDays($days);

        $this->info("Cleaning up items deleted before {$cutoffDate->toDateTimeString()}");

        if ($dryRun) {
            $this->warn('DRY RUN - No items will actually be deleted');
        }

        $totalDeleted = 0;

        foreach (config('trash.models', []) as $modelClass) {
            if (! class_exists($modelClass)) {
                $this->warn("Model class {$modelClass} does not exist, skipping...");

                continue;
            }

            // Check if model uses SoftDeletes
            if (! in_array(SoftDeletes::class, class_uses_recursive($modelClass))) {
                $this->warn("Model {$modelClass} does not use SoftDeletes, skipping...");

                continue;
            }

            $modelName = class_basename($modelClass);
            $query = $modelClass::onlyTrashed()
                ->where('deleted_at', '<', $cutoffDate);

            $count = $query->count();

            if ($count === 0) {
                $this->line("  {$modelName}: No items to delete");

                continue;
            }

            if ($dryRun) {
                $this->info("  {$modelName}: Would delete {$count} items");
            } else {
                // Force delete in chunks to avoid memory issues
                $deleted = 0;
                $query->chunkById(100, function ($items) use (&$deleted) {
                    foreach ($items as $item) {
                        $item->forceDelete();
                        $deleted++;
                    }
                });

                $this->info("  {$modelName}: Deleted {$deleted} items");
                $totalDeleted += $deleted;
            }
        }

        $this->newLine();

        if ($dryRun) {
            $this->info('Dry run complete. Run without --dry-run to actually delete items.');
        } else {
            $this->info("Cleanup complete. Total items permanently deleted: {$totalDeleted}");
        }

        return Command::SUCCESS;
    }
}
