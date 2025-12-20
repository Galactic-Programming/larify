import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Activity } from 'lucide-react';

export function ActivityEmpty() {
    return (
        <Empty className="min-h-100 border-0">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Activity className="size-6" />
                </EmptyMedia>
                <EmptyTitle>No activity yet</EmptyTitle>
                <EmptyDescription>
                    When you or your team members make changes to projects, tasks, or lists, the activity will appear here.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
