import { Head, router } from '@inertiajs/react';
import { FileTextIcon, ShieldCheckIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AuthLayout from '@/layouts/auth-layout';

interface ConditionProps {
    type?: 'terms' | 'privacy';
}

export default function Condition({ type = 'terms' }: ConditionProps) {
    const isTerms = type === 'terms';

    const handleTabChange = (value: string) => {
        router.visit(`/${value}`, { preserveScroll: true });
    };

    return (
        <AuthLayout
            title={isTerms ? 'Terms of Service' : 'Privacy Policy'}
            description={isTerms ? 'Please read our terms carefully' : 'How we handle your data'}
        >
            <Head title={isTerms ? 'Terms of Service' : 'Privacy Policy'} />

            <div className="flex flex-col gap-5">
                {/* Tabs Navigation */}
                <Tabs value={type} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="terms" className="gap-2">
                            <FileTextIcon className="size-4" />
                            Terms
                        </TabsTrigger>
                        <TabsTrigger value="privacy" className="gap-2">
                            <ShieldCheckIcon className="size-4" />
                            Privacy
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="terms" className="mt-4">
                        <ScrollArea className="h-80 rounded-lg border bg-muted/30 p-4">
                            <div className="space-y-6 pr-4">
                                <Section
                                    number={1}
                                    title="Acceptance of Terms"
                                    content="By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service."
                                />
                                <Section
                                    number={2}
                                    title="Use License"
                                    content="Permission is granted to temporarily use this service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title."
                                />
                                <Section
                                    number={3}
                                    title="User Responsibilities"
                                    content="You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account."
                                />
                                <Section
                                    number={4}
                                    title="Disclaimer"
                                    content="The materials on this service are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including implied warranties."
                                />
                                <Section
                                    number={5}
                                    title="Limitations"
                                    content="In no event shall we or our suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the materials on this service."
                                />
                                <Section
                                    number={6}
                                    title="Revisions"
                                    content="We may revise these terms of service at any time without notice. By using this service you are agreeing to be bound by the then current version of these terms of service."
                                />
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="privacy" className="mt-4">
                        <ScrollArea className="h-80 rounded-lg border bg-muted/30 p-4">
                            <div className="space-y-6 pr-4">
                                <Section
                                    number={1}
                                    title="Information We Collect"
                                    content="We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support. This may include your name, email address, and other contact details."
                                />
                                <Section
                                    number={2}
                                    title="How We Use Your Information"
                                    content="We use the information we collect to provide, maintain, and improve our services, process transactions, send you technical notices, and respond to your comments and questions."
                                />
                                <Section
                                    number={3}
                                    title="Information Sharing"
                                    content="We do not share your personal information with third parties except as described in this privacy policy or with your explicit consent. We may share information with service providers who assist us in operating our platform."
                                />
                                <Section
                                    number={4}
                                    title="Data Security"
                                    content="We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction using industry-standard security measures."
                                />
                                <Section
                                    number={5}
                                    title="Cookies & Tracking"
                                    content="We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent."
                                />
                                <Section
                                    number={6}
                                    title="Your Rights"
                                    content="You may access, update, or delete your account information at any time by logging into your account settings. You also have the right to request a copy of your data or ask us to delete it entirely."
                                />
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                {/* Summary Highlights */}
                <div className="rounded-lg border border-dashed bg-muted/20 p-4">
                    <h4 className="mb-3 text-sm font-medium text-foreground">Key Points</h4>
                    <ul className="space-y-2">
                        {isTerms ? (
                            <>
                                <Highlight text="You must be 18+ to use this service" />
                                <Highlight text="You're responsible for your account security" />
                                <Highlight text="We may update terms with notice" />
                            </>
                        ) : (
                            <>
                                <Highlight text="We never sell your personal data" />
                                <Highlight text="You can delete your data anytime" />
                                <Highlight text="We use encryption to protect your info" />
                            </>
                        )}
                    </ul>
                </div>

                <Separator />

                {/* Back to Register */}
                <Button variant="outline" asChild className="w-full">
                    <TextLink href="/register" className="no-underline gap-2">
                        <ArrowLeftIcon className="size-4" />
                        Back to Register
                    </TextLink>
                </Button>
            </div>
        </AuthLayout>
    );
}

function Section({ number, title, content }: { number: number; title: string; content: string }) {
    return (
        <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {number}
                </span>
                {title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground pl-8">
                {content}
            </p>
        </div>
    );
}

function Highlight({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircleIcon className="size-4 shrink-0 text-green-500" />
            {text}
        </li>
    );
}
