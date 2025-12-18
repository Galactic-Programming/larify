import AppLayout from '@/layouts/app-layout';
import { index as projectsIndex } from '@/routes/projects';
import { index as membersIndex } from '@/routes/projects/members';
import { type BreadcrumbItem, type User as AuthUser } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { MembersHeader } from './components/members-header';
import { MembersList } from './components/members-list';
import { MembersEmptyState } from './components/members-empty-state';
import { AddMemberDialog } from './components/add-member-dialog';
import { UpdateRoleDialog } from './components/update-role-dialog';
import { RemoveMemberDialog } from './components/remove-member-dialog';
import type { Member, ProjectWithMembers } from './lib/types';

interface Props {
    project: ProjectWithMembers;
}

export default function MembersIndex({ project }: Props) {
    const { auth } = usePage<{ auth: { user: AuthUser } }>().props;
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [removingMember, setRemovingMember] = useState<Member | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Projects', href: projectsIndex().url },
        { title: project.name, href: `/projects/${project.id}/lists` },
        { title: 'Members', href: membersIndex(project).url },
    ];

    // Check if current user is the owner (can manage members)
    const isOwner = auth.user.id === project.user_id;

    // Combine owner and members into a single list for display
    const allMembers: Member[] = [
        // Owner first
        {
            id: project.user.id,
            name: project.user.name,
            email: project.user.email,
            avatar: project.user.avatar,
            role: 'owner',
            joined_at: project.created_at,
            is_owner: true,
        },
        // Then other members
        ...project.members.filter(m => m.id !== project.user_id),
    ];

    const handleEditMember = (member: Member) => {
        if (!member.is_owner) {
            setEditingMember(member);
        }
    };

    const handleRemoveMember = (member: Member) => {
        if (!member.is_owner) {
            setRemovingMember(member);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.name} - Members`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <MembersHeader
                    project={project}
                    membersCount={allMembers.length}
                    isOwner={isOwner}
                    onAddMember={() => setAddMemberOpen(true)}
                />

                {allMembers.length === 1 && !isOwner ? (
                    <MembersEmptyState isOwner={false} />
                ) : (
                    <MembersList
                        members={allMembers}
                        isOwner={isOwner}
                        onEditMember={handleEditMember}
                        onRemoveMember={handleRemoveMember}
                    />
                )}
            </div>

            {/* Add Member Dialog */}
            <AddMemberDialog
                project={project}
                open={addMemberOpen}
                onOpenChange={setAddMemberOpen}
            />

            {/* Update Role Dialog */}
            {editingMember && (
                <UpdateRoleDialog
                    project={project}
                    member={editingMember}
                    open={!!editingMember}
                    onOpenChange={(open: boolean) => !open && setEditingMember(null)}
                />
            )}

            {/* Remove Member Dialog */}
            {removingMember && (
                <RemoveMemberDialog
                    project={project}
                    member={removingMember}
                    open={!!removingMember}
                    onOpenChange={(open: boolean) => !open && setRemovingMember(null)}
                />
            )}
        </AppLayout>
    );
}
