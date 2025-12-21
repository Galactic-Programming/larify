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

        return Inertia::render('billing/index', [
            'subscription' => $subscription ? [
                'id' => $subscription->id,
                'stripe_id' => $subscription->stripe_id,
                'stripe_status' => $subscription->stripe_status,
                'stripe_price' => $subscription->stripe_price,
                'quantity' => $subscription->quantity,
                'trial_ends_at' => $subscription->trial_ends_at?->toISOString(),
                'ends_at' => $subscription->ends_at?->toISOString(),
                'on_trial' => $subscription->onTrial(),
                'cancelled' => $subscription->cancelled(),
                'on_grace_period' => $subscription->onGracePeriod(),
                'active' => $subscription->active(),
                'plan' => Plan::findByStripeId($subscription->stripe_price),
            ] : null,
            'on_trial' => $user->onTrial(),
            'subscribed' => $user->subscribed('default'),
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
     * Show invoices page.
     */
    public function invoices(Request $request)
    {
        $invoices = $request->user()->invoices()->map(function ($invoice) {
            return [
                'id' => $invoice->id,
                'date' => $invoice->date()->toFormattedDateString(),
                'total' => $invoice->total(),
                'status' => $invoice->status,
                'invoice_pdf' => $invoice->invoice_pdf,
            ];
        });

        return Inertia::render('billing/invoices', [
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
