import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { DownloadIcon, ExternalLinkIcon, FileTextIcon, ReceiptIcon } from 'lucide-react';

interface Invoice {
    id: string;
    date: string;
    total: string;
    status: 'paid' | 'open' | 'draft' | 'uncollectible' | 'void';
    invoice_pdf: string | null;
    hosted_invoice_url: string | null;
}

interface InvoicesPageProps {
    invoices: Invoice[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings' },
    { title: 'Invoices', href: '/settings/invoices' },
];

export default function Invoices({ invoices }: InvoicesPageProps) {
    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusBadge = (status: Invoice['status']) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-500">Paid</Badge>;
            case 'open':
                return <Badge variant="default">Open</Badge>;
            case 'draft':
                return <Badge variant="secondary">Draft</Badge>;
            case 'void':
                return <Badge variant="outline">Void</Badge>;
            case 'uncollectible':
                return <Badge variant="destructive">Uncollectible</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Invoices" />

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading title="Invoices" description="View and download your billing history" />

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <ReceiptIcon className="size-5 text-primary" />
                                <CardTitle>Billing History</CardTitle>
                            </div>
                            <CardDescription>A list of all your invoices and payments</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {invoices.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <FileTextIcon className="mb-4 size-12 text-muted-foreground/50" />
                                    <h3 className="mb-2 text-lg font-medium">No invoices yet</h3>
                                    <p className="mb-4 max-w-sm text-sm text-muted-foreground">
                                        When you subscribe to a paid plan, your invoices will appear here.
                                    </p>
                                    <Button asChild>
                                        <Link href="/pricing">View Plans</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invoices.map((invoice) => (
                                                <TableRow key={invoice.id}>
                                                    <TableCell className="font-medium">
                                                        {formatDate(invoice.date)}
                                                    </TableCell>
                                                    <TableCell>{invoice.total}</TableCell>
                                                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {invoice.invoice_pdf && (
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <a
                                                                        href={invoice.invoice_pdf}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <DownloadIcon className="mr-1 size-4" />
                                                                        PDF
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            {invoice.hosted_invoice_url && (
                                                                <Button variant="ghost" size="sm" asChild>
                                                                    <a
                                                                        href={invoice.hosted_invoice_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        <ExternalLinkIcon className="mr-1 size-4" />
                                                                        View
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Need a custom invoice?</CardTitle>
                            <CardDescription>
                                If you need a custom invoice or have billing questions, please contact our support team.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/contact">Contact Support</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
