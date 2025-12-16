import { Button } from '@/components/ui/button';
import { getProjectIcon } from '@/pages/projects/lib/project-icons';
import { UserPlus, Users } from 'lucide-react';
import { createElement, memo } from 'react';
import type { ProjectWithMembers } from '../lib/types';

// Memoized project icon component
const ProjectIconDisplay = memo(function ProjectIconDisplay({
    iconName,
    className,
}: {
    iconName: string | null;
    className?: string;
}) {
    const Icon = getProjectIcon(iconName);
    return createElement(Icon, { className });
});

interface MembersHeaderProps {
    project: ProjectWithMembers;
    membersCount: number;
    isOwner: boolean;
    onAddMember: () => void;
}

export function MembersHeader({ project, membersCount, isOwner, onAddMember }: MembersHeaderProps) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Project Info */}
            <div className="flex items-center gap-3">
                <div
                    className="flex size-12 items-center justify-center rounded-xl shadow-sm"
                    style={{ backgroundColor: project.color }}
                >
                    <ProjectIconDisplay iconName={project.icon} className="size-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="size-4" />
                        <span>
                            {membersCount} {membersCount === 1 ? 'member' : 'members'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            {isOwner && (
                <Button onClick={onAddMember} className="gap-2">
                    <UserPlus className="size-4" />
                    Add Member
                </Button>
            )}
        </div>
    );
}
