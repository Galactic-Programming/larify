<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\CheckoutRequest;
use App\Http\Requests\Billing\SwapPlanRequest;
use App\Models\Plan;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    /**
     * Create a Stripe Checkout session for a subscription.
     */
    public function checkout(CheckoutRequest $request, string $planId)
    {
        $plan = $request->plan();
        $user = $request->user();

        // Create Stripe Checkout Session
        return $user
            ->newSubscription('default', $planId)
            ->checkout([
                'success_url' => route('billing.success').'?session_id={CHECKOUT_SESSION_ID}',
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
     * Redirect to Stripe Customer Portal.
     */
    public function portal(Request $request)
    {
        $user = $request->user();

        // User must have a Stripe customer ID to access the billing portal
        if (! $user->hasStripeId()) {
            // Create as Stripe customer if they have a subscription history
            // Otherwise redirect back with a message
            if (! $user->subscribed('default')) {
                return redirect()->route('billing.index')
                    ->with('error', 'You need an active subscription to manage payment methods.');
            }

            $user->createAsStripeCustomer();
        }

        return $user->redirectToBillingPortal(
            route('billing.index')
        );
    }

    /**
     * Swap to a different plan.
     */
    public function swap(SwapPlanRequest $request, string $planId)
    {
        $plan = $request->plan();
        $user = $request->user();

        if (! $user->subscribed('default')) {
            return redirect()->route('billing.checkout', $planId);
        }

        // Swap the subscription to the new plan
        $user->subscription('default')->swap($planId);

        return redirect()->route('billing.index')
            ->with('success', 'Your subscription has been updated.');
    }
}
