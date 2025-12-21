<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('stripe_id')->unique();
            $table->string('stripe_product');
            $table->string('name');
            $table->string('description')->nullable();
            $table->integer('price'); // in cents
            $table->string('currency')->default('usd');
            $table->string('interval'); // month, year
            $table->integer('interval_count')->default(1);
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};

