<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('call_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('call_queue_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete(); // who logged

            // Call details
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->string('outcome'); // answered, voicemail, callback, no-answer, wrong-number
            $table->text('notes')->nullable();
            $table->string('next_action')->nullable(); // follow-up, send-email, close, escalate

            // Follow-up
            $table->boolean('create_followup')->default(false);
            $table->timestamp('followup_at')->nullable();
            $table->string('followup_type')->nullable(); // call, meeting, email

            $table->timestamps();
        });
    }

    public function down() { Schema::dropIfExists('call_logs'); }
};