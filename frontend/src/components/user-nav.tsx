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
import { Avatar } from '@/components/ui/avatar'
import { User } from '@/types/auth'
import style from 'styled-jsx/style'
import { LanguageSwitcher } from './language-switcher'

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
        <div className="relative h-8 w-8 cursor-pointer">
          <Avatar src={user?.avatar_url} fallback={userInitial} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>
          <LanguageSwitcher variant='modal' />
        </DropdownMenuLabel>
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