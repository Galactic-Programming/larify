import { cva, type VariantProps } from 'class-variance-authority'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const statusIndicatorVariants = cva('border-background absolute rounded-full border-2', {
    variants: {
        status: {
            online: 'bg-green-500',
            offline: 'bg-gray-400',
            busy: 'bg-destructive',
            away: 'bg-amber-500',
        },
        size: {
            sm: 'size-2 -right-0 -bottom-0',
            md: 'size-3 -right-0.5 -bottom-0.5',
            lg: 'size-4 -right-1 -bottom-1',
        },
    },
    defaultVariants: {
        status: 'online',
        size: 'md',
    },
})

const avatarSizeVariants = cva('', {
    variants: {
        size: {
            sm: 'size-8',
            md: 'size-10',
            lg: 'size-14',
        },
    },
    defaultVariants: {
        size: 'md',
    },
})

export type AvatarStatusType = 'online' | 'offline' | 'busy' | 'away'

export interface AvatarStatusProps extends VariantProps<typeof statusIndicatorVariants> {
    src?: string
    alt?: string
    fallback?: string
    status?: AvatarStatusType
    showStatus?: boolean
    className?: string
}

const statusLabels: Record<AvatarStatusType, string> = {
    online: 'Online',
    offline: 'Offline',
    busy: 'Busy',
    away: 'Away',
}

const AvatarStatus = ({
    src,
    alt = 'User avatar',
    fallback = 'U',
    status = 'online',
    size = 'md',
    showStatus = true,
    className,
}: AvatarStatusProps) => {
    return (
        <div className={cn('relative w-fit', className)}>
            <Avatar className={avatarSizeVariants({ size })}>
                <AvatarImage src={src} alt={alt} />
                <AvatarFallback className="text-xs">{fallback}</AvatarFallback>
            </Avatar>
            {showStatus && (
                <span className={statusIndicatorVariants({ status, size })}>
                    <span className="sr-only">{statusLabels[status]}</span>
                </span>
            )}
        </div>
    )
}

export { AvatarStatus, statusIndicatorVariants, avatarSizeVariants }
export default AvatarStatus
