import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import type { Participant } from '@/types/chat';

interface MembersSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    participants: Participant[];
    currentUserId: number;
}

export function MembersSheet({
    open,
    onOpenChange,
    participants,
    currentUserId,
}: MembersSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Project Members</SheetTitle>
                    <SheetDescription>
                        {participants.length} members in this project
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="mt-4 h-[calc(100vh-10rem)]">
                    <div className="space-y-3 pr-4">
                        {participants.map((participant) => (
                            <div
                                key={participant.id}
                                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src={participant.avatar}
                                        alt={participant.name}
                                    />
                                    <AvatarFallback>
                                        {participant.name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium">
                                        {participant.name}
                                        {participant.id === currentUserId && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                (You)
                                            </span>
                                        )}
                                    </p>
                                    {participant.email && (
                                        <p className="truncate text-sm text-muted-foreground">
                                            {participant.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
