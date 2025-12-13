import { Head } from '@inertiajs/react';

import AppearanceTabs from '@/components/appearance-tabs';
import BackgroundSelector from '@/components/background-selector';
import { SettingsCard } from '@/components/settings';
import { type BreadcrumbItem } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit as editAppearance } from '@/routes/appearance';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: editAppearance().url,
    },
];

export default function Appearance() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Appearance settings" />

            <SettingsLayout>
                <SettingsCard
                    title="Appearance settings"
                    description="Update your account's appearance settings"
                >
                    <AppearanceTabs />
                </SettingsCard>

                <SettingsCard
                    title="Background settings"
                    description="Choose a background image for your workspace"
                >
                    <BackgroundSelector />
                </SettingsCard>
            </SettingsLayout>
        </AppLayout>
    );
}
