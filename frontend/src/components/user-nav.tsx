'use client'

import { UserIcon } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User } from '@/types/auth'

interface UserNavProps {
  user: User | null
}

export function UserNav({ user }: UserNavProps) {
  const { signOut } = useAuth()
  const router = useRouter()
  
  const userEmail = user?.email || ''
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : ''
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userEmail}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.id || ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onSelect={() => router.push('/app/dashboard')}
        >
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem 
          onSelect={() => router.push('/app/shoot')}
        >
          Create New Styles
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onSelect={() => signOut()}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 