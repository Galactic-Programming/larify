<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('list_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->integer('position')->default(0); // Thứ tự trong list
            $table->enum('priority', ['none', 'low', 'medium', 'high', 'urgent'])->default('none');
            $table->date('due_date')->nullable();
            $table->time('due_time')->nullable(); // Optional: thời gian cụ thể
            $table->timestamp('started_at')->nullable(); // Bắt đầu tính giờ
            $table->timestamp('completed_at')->nullable(); // Hoàn thành
            $table->timestamps();

            $table->index(['list_id', 'position']);
            $table->index(['project_id', 'completed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
