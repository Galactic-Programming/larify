<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * Cancel the user's subscription.
     */
    public function cancel(Request $request)
    {
        $subscription = $request->user()->subscription('default');

        if (!$subscription) {
            return back()->with('error', 'No active subscription found.');
        }

        // Cancel at end of billing period (grace period)
        $subscription->cancel();

        return back()->with('success', 'Your subscription has been cancelled. You will have access until the end of your billing period.');
    }

    /**
     * Cancel the subscription immediately.
     */
    public function cancelNow(Request $request)
    {
        $subscription = $request->user()->subscription('default');

        if (!$subscription) {
            return back()->with('error', 'No active subscription found.');
        }

        try {
            $subscription->cancelNow();

            return redirect()->route('billing.index')
                ->with('success', 'Your subscription has been cancelled immediately.');
        } catch (\Exception $e) {
            return redirect()->route('error.general')
                ->with('error', 'Failed to cancel subscription: ' . $e->getMessage());
        }
    }

    /**
     * Resume a cancelled subscription.
     */
    public function resume(Request $request)
    {
        $subscription = $request->user()->subscription('default');

        if (!$subscription) {
            return back()->with('error', 'No subscription found.');
        }

        if (!$subscription->onGracePeriod()) {
            return back()->with('error', 'This subscription cannot be resumed.');
        }

        $subscription->resume();

        return back()->with('success', 'Your subscription has been resumed.');
    }

    /**
     * Swap to a different plan.
     */
    public function swap(Request $request, string $planId)
    {
        $plan = Plan::findByStripeId($planId);

        if (!$plan) {
            return back()->with('error', 'Plan not found.');
        }

        $user = $request->user();
        $subscription = $user->subscription('default');

        if (!$subscription) {
            // No subscription, redirect to checkout
            return redirect()->route('billing.checkout', $planId);
        }

        try {
            // Swap the subscription
            $subscription->swap($planId);

            return back()->with('success', 'Your subscription has been updated to ' . $plan->name . '.');
        } catch (\Exception $e) {
            return redirect()->route('error.general')
                ->with('error', 'Failed to update subscription: ' . $e->getMessage());
        }
    }

    /**
     * Update quantity for metered billing.
     */
    public function updateQuantity(Request $request)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $subscription = $request->user()->subscription('default');

        if (!$subscription) {
            return back()->with('error', 'No active subscription found.');
        }

        $subscription->updateQuantity($request->input('quantity'));

        return back()->with('success', 'Subscription quantity updated.');
    }

    /**
     * Get subscription status via API.
     */
    public function status(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription('default');

        if (!$subscription) {
            return response()->json([
                'subscribed' => false,
                'subscription' => null,
            ]);
        }

        return response()->json([
            'subscribed' => true,
            'subscription' => [
                'id' => $subscription->id,
                'stripe_status' => $subscription->stripe_status,
                'stripe_price' => $subscription->stripe_price,
                'on_trial' => $subscription->onTrial(),
                'cancelled' => $subscription->cancelled(),
                'on_grace_period' => $subscription->onGracePeriod(),
                'ends_at' => $subscription->ends_at?->toISOString(),
                'plan' => Plan::findByStripeId($subscription->stripe_price),
            ],
        ]);
    }
}
