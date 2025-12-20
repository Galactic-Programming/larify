import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Bell, Inbox } from 'lucide-react';

interface NotificationEmptyProps {
    filter?: 'all' | 'unread' | 'read';
}

export function NotificationEmpty({ filter = 'all' }: NotificationEmptyProps) {
    const getMessage = () => {
        switch (filter) {
            case 'unread':
                return {
                    title: 'All caught up!',
                    description: "You've read all your notifications. Great job staying on top of things!",
                };
            case 'read':
                return {
                    title: 'No read notifications',
                    description: "You haven't read any notifications yet.",
                };
            default:
                return {
                    title: 'No notifications yet',
                    description: "When something happens in your projects, you'll see it here.",
                };
        }
    };

    const { title, description } = getMessage();

    return (
        <Empty className="min-h-100 border-0">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    {filter === 'unread' ? (
                        <Inbox className="size-6" />
                    ) : (
                        <Bell className="size-6" />
                    )}
                </EmptyMedia>
                <EmptyTitle>{title}</EmptyTitle>
                <EmptyDescription>{description}</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
