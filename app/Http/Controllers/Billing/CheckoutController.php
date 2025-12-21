<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    /**
     * Create a Stripe Checkout session for a subscription.
     */
    public function checkout(Request $request, string $planId)
    {
        $plan = Plan::findByStripeId($planId);

        if (!$plan) {
            return redirect()->route('billing.plans')
                ->with('error', 'Plan not found.');
        }

        $user = $request->user();

        // If user already has this subscription, redirect to billing
        if ($user->subscribed('default') && $user->subscription('default')->hasPrice($planId)) {
            return redirect()->route('billing.index')
                ->with('info', 'You are already subscribed to this plan.');
        }

        // Create Stripe Checkout Session
        return $user
            ->newSubscription('default', $planId)
            ->checkout([
                'success_url' => route('billing.success') . '?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('billing.cancel'),
            ]);
    }

    /**
     * Handle successful checkout.
     */
    public function success(Request $request)
    {
        return inertia('billing/success', [
            'message' => 'Your subscription has been activated successfully!',
        ]);
    }

    /**
     * Handle cancelled checkout.
     */
    public function cancel()
    {
        return inertia('billing/cancel', [
            'message' => 'Your checkout was cancelled.',
        ]);
    }

    /**
     * Create a checkout session for updating payment method.
     */
    public function updatePaymentMethod(Request $request)
    {
        return $request->user()->redirectToBillingPortal(
            route('billing.index')
        );
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

        if (!$user->subscribed('default')) {
            return redirect()->route('billing.checkout', $planId);
        }

        // Swap the subscription to the new plan
        $user->subscription('default')->swap($planId);

        return redirect()->route('billing.index')
            ->with('success', 'Your subscription has been updated.');
    }
}
