import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import * as LucideIcons from 'lucide-react';
import { ArrowLeft, Users } from 'lucide-react';

// Dynamic icon component for project icons
function ProjectIcon({
    iconName,
    className,
    style,
}: {
    iconName: string;
    className?: string;
    style?: React.CSSProperties;
}) {
    const Icon =
        (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[
        iconName
        ] ?? LucideIcons.FolderKanban;
    return <Icon className={className} style={style} />;
}

interface ConversationHeaderProps {
    name: string;
    icon?: string | null;
    color?: string | null;
    participantsCount: number;
    onShowMembers: () => void;
}

export function ConversationHeader({
    name,
    icon,
    color,
    participantsCount,
    onShowMembers,
}: ConversationHeaderProps) {
    return (
        <div className="border-b p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="md:hidden"
                    >
                        <Link href="/conversations">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>

                    {/* Project icon with color */}
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{
                            backgroundColor: color ? `${color}20` : undefined,
                        }}
                    >
                        <ProjectIcon
                            iconName={icon || 'FolderKanban'}
                            className="h-5 w-5"
                            style={{ color: color ?? undefined }}
                        />
                    </div>

                    <div>
                        <h2 className="font-semibold">{name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {participantsCount} members
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onShowMembers}
                                >
                                    <Users className="h-5 w-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>View members</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
}
