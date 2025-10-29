'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Palette, CreditCard, Settings, FolderTree, DollarSign } from 'lucide-react'
import styles from './nav.module.css'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Styles', href: '/styles', icon: Palette },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
  { name: 'Cost', href: '/cost', icon: DollarSign },
  { name: 'Inference', href: '/inference', icon: Settings },
  { name: 'Media', href: '/media', icon: FolderTree },
]

export function Nav() {
  const pathname = usePathname()
  return (
    <nav className={styles.navBar}>
      <div className={styles.navList}>
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={
                isActive
                  ? `${styles.navLink} ${styles.navLinkActive}`
                  : styles.navLink
              }
            >
              <item.icon className={styles.icon} aria-hidden="true" />
              {item.name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
} 