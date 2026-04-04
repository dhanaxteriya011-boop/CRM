protected function schedule(Schedule $schedule)
{
    $schedule->command('calls:process-timeouts')->everyMinute();
}