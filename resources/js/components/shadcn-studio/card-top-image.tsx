import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CardTopImageAction {
    label: string;
    onClick?: () => void;
    variant?:
        | 'default'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link'
        | 'destructive';
    href?: string;
}

export interface CardTopImageProps {
    imageSrc: string;
    imageAlt?: string;
    title: string;
    description?: string;
    actions?: CardTopImageAction[];
    className?: string;
    imageClassName?: string;
    children?: React.ReactNode;
}

const CardTopImage = ({
    imageSrc,
    imageAlt = 'Card image',
    title,
    description,
    actions,
    className,
    imageClassName,
    children,
}: CardTopImageProps) => {
    return (
        <Card className={cn('max-w-md pt-0', className)}>
            <CardContent className="px-0">
                <img
                    src={imageSrc}
                    alt={imageAlt}
                    className={cn(
                        'aspect-video h-70 rounded-t-xl object-cover',
                        imageClassName,
                    )}
                />
            </CardContent>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            {children}
            {actions && actions.length > 0 && (
                <CardFooter className="gap-3 max-sm:flex-col max-sm:items-stretch">
                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            variant={
                                action.variant ||
                                (index === 0 ? 'default' : 'outline')
                            }
                            onClick={action.onClick}
                        >
                            {action.label}
                        </Button>
                    ))}
                </CardFooter>
            )}
        </Card>
    );
};

export { CardTopImage };
export default CardTopImage;
