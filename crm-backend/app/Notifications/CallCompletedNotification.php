<?php
namespace App\Notifications;

use App\Models\{CallQueue, CallLog};
use Illuminate\Notifications\Notification;

class CallCompletedNotification extends Notification
{
    public function __construct(public CallQueue $call, public CallLog $log) {}
    public function via($notifiable) { return ['database']; }
    public function toArray($notifiable)
    {
        $duration = $this->log->duration_seconds ? gmdate('i:s', $this->log->duration_seconds) : 'N/A';
        return [
            'type'     => 'call_completed',
            'call_id'  => $this->call->id,
            'title'    => "✅ Call completed: {$this->call->title}",
            'message'  => "By: {$this->call->attendedBy?->name}. Duration: {$duration}. Outcome: {$this->log->outcome}",
            'url'      => "/calls/{$this->call->id}",
        ];
    }
}