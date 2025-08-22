// components/Navbar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMayakUser } from './UserInitializer'

export const Navbar = () => {
  const pathname = usePathname()
  const mayakUser = useMayakUser();
  const navItems = [
    { href: '/', label: 'Бронировать' },
    { href: '/booking', label: 'Мои брони' },
  ]
  if (mayakUser?.role.toLowerCase() === 'админ'){
    navItems.push({
      href: '/admin', label: 'ЛК'
    })
  }
  return (
    <nav className="bg-white shadow-sm border-b ">
      <div className=" px-4 py-4 flex justify-between items-start">
        <div className="flex  ">
          {navItems.map((item, inx) => (
            <div key={inx} className={cn('skew-x-12 border-1 border-blue-600 bg-sky-200 rounded-sm', pathname === item.href && 'font-semibold border-2 border-green-600 bg-amber-600'
            )}>
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-4 py-2  -skew-x-12 text-gray-900 block',
                  pathname === item.href && 'font-semibold '
                )}
              >
                {item.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}
