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
     */
    public function plans()
    {
        $plans = Plan::active()->ordered()->get()->groupBy('interval');

        return Inertia::render('billing/plans', [
            'plans' => [
                'monthly' => $plans->get('month', collect())->values(),
                'yearly' => $plans->get('year', collect())->values(),
            ],
        ]);
    }

    /**
     * Show public pricing page.
     */
    public function pricing()
    {
        $plans = Plan::active()->ordered()->get()->groupBy('interval');

        return Inertia::render('pricing', [
            'plans' => [
                'monthly' => $plans->get('month', collect())->values(),
                'yearly' => $plans->get('year', collect())->values(),
            ],
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
            return [
                'id' => $invoice->id,
                'date' => $invoice->date()->toISOString(),
                'total' => $invoice->total(),
                'status' => $invoice->status,
                'invoice_pdf' => $invoice->invoicePdf(),
                'hosted_invoice_url' => $invoice->hostedInvoiceUrl(),
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
