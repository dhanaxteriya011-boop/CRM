<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('activities', function (Blueprint $table) {
            $table->id();

            $table->string('type'); // call, meeting, email
            $table->string('title');
            $table->text('description')->nullable();

            $table->dateTime('due_at')->nullable();
            $table->boolean('completed')->default(false);

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Polymorphic relation
            $table->morphs('related');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};