<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('call_queues', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('caller_name')->nullable();
            $table->string('caller_phone')->nullable();
            $table->foreignId('contact_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained()->nullOnDelete();

            // Routing
            $table->foreignId('team_id')->nullable()->constrained()->nullOnDelete();
            $table->string('routing_type')->default('round-robin'); // round-robin, priority, first-available
            $table->integer('current_attempt')->default(0);
            $table->integer('max_attempts')->default(3); // attempts before escalation
            $table->integer('timeout_minutes')->default(5);

            // Current assignment
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('timeout_at')->nullable(); // when auto-reassign fires

            // Status
            $table->string('status')->default('pending');
            // pending → assigned → ringing → attended → completed / missed / escalated

            $table->foreignId('attended_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('attended_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            // Escalation
            $table->foreignId('escalated_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('escalated_at')->nullable();
            $table->text('escalation_reason')->nullable();

            // Priority
            $table->integer('priority')->default(0); // 0=normal, 1=high, 2=urgent

            $table->text('notes')->nullable();
            $table->string('source')->default('manual'); // manual, inbound, api
            $table->timestamps();
        });
    }

    public function down() { Schema::dropIfExists('call_queues'); }
};