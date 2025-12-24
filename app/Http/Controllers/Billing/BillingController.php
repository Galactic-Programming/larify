<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BillingController extends Controller
{
    /**
     * Show the billing dashboard.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription('default');
        $currentPlan = $subscription ? Plan::findByStripeId($subscription->stripe_price) : null;

        return Inertia::render('billing/index', [
            'subscription' => $subscription ? [
                'stripe_status' => $subscription->stripe_status,
                'stripe_price' => $subscription->stripe_price,
                'trial_ends_at' => $subscription->trial_ends_at?->toISOString(),
                'ends_at' => $subscription->ends_at?->toISOString(),
            ] : null,
            'currentPlan' => $currentPlan,
            'plans' => Plan::active()->ordered()->get(),
            'onGracePeriod' => $subscription?->onGracePeriod() ?? false,
            'isSubscribed' => $user->subscribed('default'),
        ]);
    }

    /**
     * Show available plans/pricing page.
     * Redirects to billing index which shows all plan information.
     */
    public function plans()
    {
        return redirect()->route('billing.index');
    }

    /**
     * Show public pricing page.
     */
    public function pricing(Request $request)
    {
        $plans = Plan::active()->ordered()->get();

        return Inertia::render('pricing', [
            'plans' => $plans,
            'isAuthenticated' => $request->user() !== null,
            'currentSubscription' => $request->user()?->subscription('default')?->stripe_price,
        ]);
    }

    /**
     * Show subscription settings page.
     */
    public function subscription(Request $request)
    {
        $user = $request->user();
        $subscription = $user->subscription('default');
        $currentPlan = $subscription ? Plan::findByStripeId($subscription->stripe_price) : null;

        return Inertia::render('settings/subscription', [
            'subscription' => $subscription ? [
                'stripe_status' => $subscription->stripe_status,
                'stripe_price' => $subscription->stripe_price,
                'trial_ends_at' => $subscription->trial_ends_at?->toISOString(),
                'ends_at' => $subscription->ends_at?->toISOString(),
            ] : null,
            'currentPlan' => $currentPlan,
            'plans' => Plan::active()->ordered()->get(),
            'onGracePeriod' => $subscription?->onGracePeriod() ?? false,
            'isSubscribed' => $user->subscribed('default'),
        ]);
    }

    /**
     * Show invoices page.
     */
    public function invoices(Request $request)
    {
        $user = $request->user();

        $invoices = $user->invoices()->map(function ($invoice) {
            $stripeInvoice = $invoice->asStripeInvoice();

            return [
                'id' => $invoice->id,
                'date' => $invoice->date()->toISOString(),
                'total' => $invoice->total(),
                'status' => $stripeInvoice->status,
                'invoice_pdf' => $stripeInvoice->invoice_pdf,
                'hosted_invoice_url' => $stripeInvoice->hosted_invoice_url,
            ];
        });

        return Inertia::render('settings/invoices', [
            'invoices' => $invoices,
        ]);
    }

    /**
     * Download an invoice.
     */
    public function downloadInvoice(Request $request, string $invoiceId)
    {
        return $request->user()->downloadInvoice($invoiceId);
    }
}
