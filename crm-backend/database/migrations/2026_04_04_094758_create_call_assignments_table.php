<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('call_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('call_queue_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->integer('attempt_number')->default(1);
            $table->string('status')->default('pending'); // pending, ringing, missed, attended, skipped
            $table->timestamp('assigned_at');
            $table->timestamp('responded_at')->nullable();
            $table->timestamp('timeout_at')->nullable();
            $table->text('miss_reason')->nullable(); // no-answer, busy, declined
            $table->timestamps();
        });
    }

    public function down() { Schema::dropIfExists('call_assignments'); }
};