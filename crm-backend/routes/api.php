<?php
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    AuthController, UserController, ContactController,
    LeadController, DealController, ActivityController,
    NoteController, EmailController, DashboardController,
    FileController, InvoiceController, TeamController,
    SearchController, NotificationController,CallController
};

// Auth
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Search
    Route::get('/search', [SearchController::class, 'global']);

    // Users
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::get('/roles', [UserController::class, 'roles']);
    Route::get('/users/{user}/activity', [UserController::class, 'activityLog']);

    // Contacts
    Route::get('/contacts', [ContactController::class, 'index']);
    Route::post('/contacts', [ContactController::class, 'store']);
    Route::get('/contacts/{contact}', [ContactController::class, 'show']);
    Route::put('/contacts/{contact}', [ContactController::class, 'update']);
    Route::delete('/contacts/{contact}', [ContactController::class, 'destroy']);
    Route::post('/contacts/import', [ContactController::class, 'import']);
    Route::get('/contacts/export', [ContactController::class, 'export']);

    // Leads
    Route::get('/leads', [LeadController::class, 'index']);
    Route::post('/leads', [LeadController::class, 'store']);
    Route::get('/leads/{lead}', [LeadController::class, 'show']);
    Route::put('/leads/{lead}', [LeadController::class, 'update']);
    Route::delete('/leads/{lead}', [LeadController::class, 'destroy']);
    Route::post('/leads/{lead}/convert', [LeadController::class, 'convert']);

    // Deals
    Route::get('/deals', [DealController::class, 'index']);
    Route::post('/deals', [DealController::class, 'store']);
    Route::get('/deals/pipeline', [DealController::class, 'pipeline']);
    Route::get('/deals/{deal}', [DealController::class, 'show']);
    Route::put('/deals/{deal}', [DealController::class, 'update']);
    Route::delete('/deals/{deal}', [DealController::class, 'destroy']);

    // Activities
    Route::get('/activities', [ActivityController::class, 'index']);
    Route::post('/activities', [ActivityController::class, 'store']);
    Route::put('/activities/{activity}', [ActivityController::class, 'update']);
    Route::delete('/activities/{activity}', [ActivityController::class, 'destroy']);
    Route::get('/activities/upcoming', [ActivityController::class, 'upcoming']);

    // Notes
    Route::post('/notes', [NoteController::class, 'store']);
    Route::put('/notes/{note}', [NoteController::class, 'update']);
    Route::delete('/notes/{note}', [NoteController::class, 'destroy']);

    // Emails
    Route::get('/email-templates', [EmailController::class, 'templates']);
    Route::post('/email-templates', [EmailController::class, 'createTemplate']);
    Route::put('/email-templates/{template}', [EmailController::class, 'updateTemplate']);
    Route::delete('/email-templates/{template}', [EmailController::class, 'deleteTemplate']);
    Route::post('/emails/send', [EmailController::class, 'send']);
    Route::get('/emails/sent', [EmailController::class, 'sentList']);
    Route::get('/emails/track/{id}', [EmailController::class, 'trackOpen']);

    // Files
    Route::post('/files/upload', [FileController::class, 'upload']);
    Route::delete('/files/{file}', [FileController::class, 'destroy']);

    // Invoices
    Route::get('/invoices', [InvoiceController::class, 'index']);
    Route::post('/invoices', [InvoiceController::class, 'store']);
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'update']);
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy']);

    // Teams
    Route::get('/teams', [TeamController::class, 'index']);
    Route::post('/teams', [TeamController::class, 'store']);
    Route::put('/teams/{team}', [TeamController::class, 'update']);
    Route::delete('/teams/{team}', [TeamController::class, 'destroy']);

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);
});

Route::middleware('auth:sanctum')->prefix('calls')->group(function () {
    Route::get('/', [CallController::class, 'index']);
    Route::get('/my', [CallController::class, 'myCalls']);
    Route::get('/stats', [CallController::class, 'stats']);
    Route::post('/', [CallController::class, 'store']);
    Route::get('/{callQueue}', [CallController::class, 'show']);
    Route::post('/{callQueue}/attend', [CallController::class, 'attend']);
    Route::post('/{callQueue}/decline', [CallController::class, 'decline']);
    Route::post('/{callQueue}/complete', [CallController::class, 'complete']);
    Route::post('/{callQueue}/reassign', [CallController::class, 'reassign']);
    Route::post('/{callQueue}/escalate', [CallController::class, 'escalate']);
    Route::get('/{callQueue}/history', [CallController::class, 'history']);
});

Route::middleware('auth:sanctum')->prefix('routing-rules')->group(function () {
    Route::get('/', [CallController::class, 'getRoutingRules']);
    Route::post('/', [CallController::class, 'saveRoutingRule']);
});