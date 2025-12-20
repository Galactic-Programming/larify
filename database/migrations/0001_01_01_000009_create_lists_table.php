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
        Schema::create('lists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->integer('position')->default(0); // Thứ tự hiển thị cột
            $table->boolean('is_done_list')->default(false); // Mark as Done list for auto-move
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'position']);
            $table->index(['project_id', 'is_done_list']);
            $table->index('deleted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lists');
    }
};
