import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    const { name, quote } = usePage<SharedData>().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                {/* Enhanced background with gradient */}
                <div className="absolute inset-0 bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-900" />

                {/* Subtle grid pattern */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                        backgroundSize: '64px 64px',
                    }}
                />

                {/* Subtle glow */}
                <div className="absolute -top-1/4 -left-1/4 h-1/2 w-1/2 rounded-full bg-primary/10 blur-3xl" />

                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-lg font-medium transition-opacity hover:opacity-80"
                >
                    <AppLogoIcon className="mr-2 size-8 fill-current text-white" />
                    {name}
                </Link>
                {quote && (
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-lg leading-relaxed">
                                &ldquo;{quote.message}&rdquo;
                            </p>
                            <footer className="text-sm text-zinc-400">
                                {quote.author}
                            </footer>
                        </blockquote>
                    </div>
                )}
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-87.5 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center gap-2 transition-transform hover:scale-105 lg:hidden"
                    >
                        <AppLogoIcon className="h-10 fill-current text-black dark:text-white sm:h-12" />
                        <span className="text-lg font-semibold">{name}</span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}

                    {/* Footer security badge */}
                    <p className="flex items-center justify-center gap-1.5 pt-4 text-xs text-muted-foreground sm:justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 16 16"
                            fill="currentColor"
                            className="size-3.5"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Zm-1 2.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Secured with SSL encryption
                    </p>
                </div>
            </div>
        </div>
    );
}
