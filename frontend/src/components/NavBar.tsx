// components/Navbar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export const Navbar = () => {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Главная' },
    { href: '/booking', label: 'Бронирование' },
    { href: '/contacts', label: 'Контакты' },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-xl font-bold text-gray-800">Теннис Клуб</div>
        <div className="flex space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-gray-600 hover:text-black transition-colors',
                pathname === item.href && 'font-semibold text-black'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
