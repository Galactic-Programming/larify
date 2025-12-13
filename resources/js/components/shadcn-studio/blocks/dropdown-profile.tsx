import type { ReactNode } from 'react'

import {
    // UserIcon,
    SettingsIcon,
    LogOutIcon
} from 'lucide-react'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useInitials } from '@/hooks/use-initials'
import { useMobileNavigation } from '@/hooks/use-mobile-navigation'
import { logout } from '@/routes'
import { edit } from '@/routes/profile'
import { type User } from '@/types'
import { Link, router } from '@inertiajs/react'

type Props = {
    trigger: ReactNode
    defaultOpen?: boolean
    align?: 'start' | 'center' | 'end'
    user?: User
}

const ProfileDropdown = ({ trigger, defaultOpen, align = 'end', user }: Props) => {
    const getInitials = useInitials()
    const cleanup = useMobileNavigation()

    const handleLogout = () => {
        cleanup()
        router.flushAll()
    }

    return (
        <DropdownMenu defaultOpen={defaultOpen}>
            <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
            <DropdownMenuContent className='w-80' align={align || 'end'}>
                <DropdownMenuLabel className='flex items-center gap-4 px-4 py-2.5 font-normal'>
                    <div className='relative'>
                        <Avatar className='size-10'>
                            <AvatarImage src={user?.avatar} alt={user?.name ?? 'User'} />
                            <AvatarFallback>{getInitials(user?.name ?? '')}</AvatarFallback>
                        </Avatar>
                        <span className='ring-card absolute right-0 bottom-0 block size-2 rounded-full bg-green-600 ring-2' />
                    </div>
                    <div className='flex flex-1 flex-col items-start'>
                        <span className='text-foreground text-lg font-semibold'>{user?.name ?? 'User'}</span>
                        <span className='text-muted-foreground text-base'>{user?.email ?? ''}</span>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    {/* <DropdownMenuItem asChild className='px-4 py-2.5 text-base'>
                        <Link href={edit()} prefetch onClick={cleanup}>
                            <UserIcon className='text-foreground size-5' />
                            <span>My account</span>
                        </Link>
                    </DropdownMenuItem> */}
                    <DropdownMenuItem asChild className='px-4 py-2.5 text-base'>
                        <Link href={edit()} prefetch onClick={cleanup}>
                            <SettingsIcon className='text-foreground size-5' />
                            <span>Settings</span>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild variant='destructive' className='px-4 py-2.5 text-base'>
                    <Link href={logout()} as='button' onClick={handleLogout}>
                        <LogOutIcon className='size-5' />
                        <span>Logout</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default ProfileDropdown
