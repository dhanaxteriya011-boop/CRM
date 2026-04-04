<?php
namespace App\Console\Commands;

use App\Models\CallQueue;
use App\Services\CallRoutingService;
use Illuminate\Console\Command;

class ProcessCallTimeouts extends Command
{
    protected $signature = 'calls:process-timeouts';
    protected $description = 'Auto-reassign calls that have timed out';

    public function handle(CallRoutingService $router)
    {
        $timedOut = CallQueue::where('status', 'assigned')
            ->where('timeout_at', '<=', now())
            ->get();

        foreach ($timedOut as $call) {
            $this->info("Processing timeout for call #{$call->id}: {$call->title}");
            $router->handleTimeout($call);
        }

        $this->info("Processed {$timedOut->count()} timed-out calls.");
    }
}