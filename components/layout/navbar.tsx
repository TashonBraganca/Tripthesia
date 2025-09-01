"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, MapPin } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const navigation = [
  { name: "Trips", href: "/trips" },
  { name: "Pricing", href: "/pricing" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md border-b border-gray-200/20 dark:border-navy-400/20">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <MapPin className="h-8 w-8 text-teal-500 dark:text-teal-400" />
            <span className="text-xl font-bold text-navy-900 dark:text-navy-50">Tripthesia</span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700 dark:text-gray-300"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-semibold leading-6 text-navy-700 dark:text-navy-200 hover:text-teal-500 dark:hover:text-teal-400 transition-colors duration-200"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">Start Planning</Link>
          </Button>
        </div>
      </nav>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-10" />
          <div className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white dark:bg-navy-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-navy-400/20 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <MapPin className="h-8 w-8 text-teal-500 dark:text-teal-400" />
                <span className="text-xl font-bold text-navy-900 dark:text-navy-50">Tripthesia</span>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-gray-700 dark:text-gray-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-navy-900 dark:text-navy-100 hover:bg-navy-50 dark:hover:bg-navy-800/50 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6 space-y-2">
                  <Link
                    href="/sign-in"
                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-navy-900 dark:text-navy-100 hover:bg-navy-50 dark:hover:bg-navy-800/50 transition-colors duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/sign-up"
                    className="-mx-3 block rounded-lg bg-teal-500 px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-teal-600 transition-colors duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Start Planning
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}