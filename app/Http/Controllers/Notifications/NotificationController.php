<?php

namespace App\Http\Controllers\Notifications;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display the notifications page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->latest()
            ->paginate(20);

        return Inertia::render('notifications/index', [
            'notifications' => NotificationResource::collection($notifications),
            'unreadCount' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Get notifications for API/AJAX requests.
     */
    public function list(Request $request): JsonResponse
    {
        $user = $request->user();
        $filter = $request->query('filter', 'all'); // all, unread, read

        $query = $user->notifications()->latest();

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        } elseif ($filter === 'read') {
            $query->whereNotNull('read_at');
        }

        $notifications = $query->paginate(20);

        return response()->json([
            'notifications' => NotificationResource::collection($notifications),
            'unread_count' => $user->unreadNotifications()->count(),
            'pagination' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, DatabaseNotification $notification): JsonResponse
    {
        // Ensure the notification belongs to the authenticated user
        if ($notification->notifiable_id !== $request->user()->id) {
            abort(403);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'unread_count' => 0,
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, DatabaseNotification $notification): JsonResponse
    {
        // Ensure the notification belongs to the authenticated user
        if ($notification->notifiable_id !== $request->user()->id) {
            abort(403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'unread_count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Delete all read notifications.
     */
    public function destroyRead(Request $request): JsonResponse
    {
        $request->user()
            ->notifications()
            ->whereNotNull('read_at')
            ->delete();

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Get unread notification count (for badge).
     */
    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }
}
