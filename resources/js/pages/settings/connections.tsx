import AlertError from '@/components/alert-error';
import { GitHubIcon, GoogleIcon } from '@/components/logo-cloud';
import { SettingsCard } from '@/components/settings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { cardVariants, listItemVariants, staggerContainer } from '@/lib/motion';
import {
    type BreadcrumbItem,
    type SocialConnections,
    type SocialProvider,
} from '@/types';
import { Form, Head, usePage } from '@inertiajs/react';
import { Link2, Link2Off } from 'lucide-react';
import { motion } from 'motion/react';
import { type ReactNode } from 'react';

// =============================================================================
// Types
// =============================================================================

type ConnectionsProps = {
    connections: SocialConnections;
    status?: string;
};

interface ConnectionItemProps {
    name: string;
    description: string;
    icon: ReactNode;
    isConnected: boolean;
    linkUrl: string;
    unlinkAction: string;
}

// =============================================================================
// Components
// =============================================================================

function ConnectionItem({
    name,
    description,
    icon,
    isConnected,
    linkUrl,
    unlinkAction,
}: ConnectionItemProps) {
    return (
        <motion.div
            variants={listItemVariants}
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
        >
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:size-12">
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="font-medium">{name}</h4>
                        <Badge
                            variant={isConnected ? 'default' : 'secondary'}
                            className="text-xs"
                        >
                            {isConnected ? 'Connected' : 'Not connected'}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                        {description}
                    </p>
                </div>
            </div>
            <div className="shrink-0">
                {isConnected ? (
                    <Form
                        action={unlinkAction}
                        method="delete"
                        options={{ preserveScroll: true }}
                    >
                        {({ processing }) => (
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={processing}
                                className="w-full sm:w-auto"
                            >
                                <Link2Off className="mr-2 size-4" />
                                Disconnect
                            </Button>
                        )}
                    </Form>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="w-full sm:w-auto"
                    >
                        <a href={linkUrl}>
                            <Link2 className="mr-2 size-4" />
                            Connect
                        </a>
                    </Button>
                )}
            </div>
        </motion.div>
    );
}

// =============================================================================
// Main Component
// =============================================================================

export default function Connections({ connections, status }: ConnectionsProps) {
    const linkUrl = (provider: SocialProvider) =>
        `/auth/${provider}/redirect` as const;
    const unlinkAction = (provider: SocialProvider) =>
        `/settings/connections/${provider}` as const;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Connections',
            href: '/settings/connections',
        },
    ];

    const { props } = usePage<{
        errors?: { oauth?: string; provider?: string };
    }>();
    const errors = props.errors;

    // Collect all error messages
    const errorMessages: string[] = [];
    if (errors?.oauth) errorMessages.push(errors.oauth);
    if (errors?.provider) errorMessages.push(errors.provider);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Social Connections" />
            <SettingsLayout>
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-6"
                >
                    <motion.div variants={cardVariants}>
                        <SettingsCard
                            title="Social Connections"
                            description="Connect your accounts to enable single sign-on and easier access to your account."
                        >
                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                animate="show"
                                className="space-y-4"
                            >
                                {/* Success Status */}
                                {status && (
                                    <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                                        <svg
                                            className="size-4"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        {status}
                                    </div>
                                )}

                                {/* Error Messages */}
                                {errorMessages.length > 0 && (
                                    <AlertError errors={errorMessages} />
                                )}

                                {/* Google Connection */}
                                <ConnectionItem
                                    name="Google"
                                    description="Sign in with your Google account"
                                    icon={<GoogleIcon />}
                                    isConnected={connections.google}
                                    linkUrl={linkUrl('google')}
                                    unlinkAction={unlinkAction('google')}
                                />

                                {/* GitHub Connection */}
                                <ConnectionItem
                                    name="GitHub"
                                    description="Sign in with your GitHub account"
                                    icon={<GitHubIcon />}
                                    isConnected={connections.github}
                                    linkUrl={linkUrl('github')}
                                    unlinkAction={unlinkAction('github')}
                                />
                            </motion.div>
                        </SettingsCard>
                    </motion.div>
                </motion.div>
            </SettingsLayout>
        </AppLayout>
    );
}
