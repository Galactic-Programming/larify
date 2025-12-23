import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface GridListPerson {
    id: string;
    name: string;
    subtitle?: string;
    imageUrl?: string;
    href?: string;
}

export interface GridListLinkProps {
    /** List of people/items to display */
    items: GridListPerson[];
    /** Number of columns on small screens */
    columns?: 1 | 2 | 3 | 4;
    /** Callback when an item is clicked */
    onItemClick?: (item: GridListPerson) => void;
    /** Custom class name */
    className?: string;
    /** Custom class name for cards */
    cardClassName?: string;
    /** Whether to show as links */
    asLinks?: boolean;
}

const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

export default function GridListLink({
    items,
    columns = 2,
    onItemClick,
    className,
    cardClassName,
    asLinks = true,
}: GridListLinkProps) {
    const handleClick = (item: GridListPerson, e: React.MouseEvent) => {
        if (onItemClick) {
            e.preventDefault();
            onItemClick(item);
        }
    };

    return (
        <div className={cn('flex items-center justify-center p-8', className)}>
            <div className={cn('grid gap-4', columnClasses[columns])}>
                {items.map((person) => (
                    <Card
                        key={person.id}
                        className={cn(
                            'relative border py-0 transition-all duration-100 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:border-muted-foreground hover:shadow-sm',
                            cardClassName,
                        )}
                    >
                        <CardContent className="flex items-center space-x-4 p-4">
                            <Avatar className="h-10 w-10">
                                <AvatarImage
                                    src={person.imageUrl}
                                    alt={person.name}
                                />
                                <AvatarFallback>
                                    {person.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                {asLinks ? (
                                    <a
                                        href={person.href ?? '#'}
                                        className="focus:outline-none"
                                        onClick={(e) => handleClick(person, e)}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-0"
                                        />
                                        <p className="text-sm font-medium text-foreground">
                                            {person.name}
                                        </p>
                                        {person.subtitle && (
                                            <p className="truncate text-sm text-muted-foreground">
                                                {person.subtitle}
                                            </p>
                                        )}
                                    </a>
                                ) : (
                                    <div
                                        className="cursor-pointer"
                                        onClick={(e) => handleClick(person, e)}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="absolute inset-0"
                                        />
                                        <p className="text-sm font-medium text-foreground">
                                            {person.name}
                                        </p>
                                        {person.subtitle && (
                                            <p className="truncate text-sm text-muted-foreground">
                                                {person.subtitle}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
