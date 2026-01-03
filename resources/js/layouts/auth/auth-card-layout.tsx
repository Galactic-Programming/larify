import AppLogoIcon from '@/components/app-logo-icon';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: PropsWithChildren<{
    name?: string;
    title?: string;
    description?: string;
}>) {
    const { name } = usePage<SharedData>().props;

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
                <Link
                    href={home()}
                    className="flex items-center gap-2 self-center font-medium transition-transform hover:scale-105"
                >
                    <div className="flex h-9 w-9 items-center justify-center">
                        <AppLogoIcon className="size-9 fill-current text-black dark:text-white" />
                    </div>
                    <span className="text-lg font-semibold">{name}</span>
                </Link>

                <div className="flex flex-col gap-6">
                    <Card className="rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20">
                        <CardHeader className="px-10 pt-8 pb-0 text-center">
                            <CardTitle className="text-xl">{title}</CardTitle>
                            <CardDescription>{description}</CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 py-8">
                            {children}
                        </CardContent>
                    </Card>
                </div>

                {/* Footer security badge */}
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
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
    );
}
