"use client"

import { Button } from "@/components/ui/button"
import { Menu, X, MapPin, User, LogOut } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"

const navigation = [
  { name: "Trips", href: "/trips" },
  { name: "Pricing", href: "/pricing" },
]

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="fixed top-0 w-full z-50 bg-navy-900/80 backdrop-blur-md border-b border-navy-400/20">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <MapPin className="h-8 w-8 text-teal-500 dark:text-teal-400" />
            <span className="text-xl font-bold text-navy-50">Tripthesia</span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-navy-200 hover:text-navy-50"
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
              className="text-sm font-semibold leading-6 text-navy-200 hover:text-teal-400 transition-colors duration-200"
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          {isLoaded && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-navy-800/50 hover:bg-navy-700/50 border border-navy-400/30 hover:border-teal-400/50 rounded-lg transition-all duration-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-teal-400 flex items-center justify-center">
                  <User className="w-4 h-4 text-navy-900" />
                </div>
                <span className="text-sm font-medium text-navy-100">
                  Welcome, {user.firstName || user.fullName?.split(' ')[0] || 'User'}
                </span>
              </button>
              
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-navy-800/90 backdrop-blur-md border border-navy-400/30 rounded-lg shadow-xl z-50"
                  >
                    <div className="py-2">
                      <Link
                        href="/trips"
                        className="block px-4 py-2 text-sm text-navy-200 hover:bg-navy-700/50 hover:text-teal-400 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Trips
                      </Link>
                      <button
                        onClick={() => {
                          signOut({ redirectUrl: '/' });
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-navy-700/50 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Button variant="ghost" className="text-navy-200 hover:text-teal-400 hover:bg-navy-800/50" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button className="bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-navy-900" asChild>
                <Link href="/sign-up">Start Planning</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-10" />
          <div className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-navy-900/95 backdrop-blur-md px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-navy-400/20">
            <div className="flex items-center justify-between">
              <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                <MapPin className="h-8 w-8 text-teal-500 dark:text-teal-400" />
                <span className="text-xl font-bold text-navy-50">Tripthesia</span>
              </Link>
              <button
                type="button"
                className="-m-2.5 rounded-md p-2.5 text-navy-200 hover:text-navy-50"
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
                      className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-navy-100 hover:bg-navy-800/50 hover:text-teal-400 transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                <div className="py-6 space-y-2">
                  {isLoaded && user ? (
                    <>
                      <div className="-mx-3 flex items-center gap-3 px-3 py-2.5 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-500 to-teal-400 flex items-center justify-center">
                          <User className="w-4 h-4 text-navy-900" />
                        </div>
                        <span className="text-base font-semibold text-navy-100">
                          {user.firstName || user.fullName?.split(' ')[0] || 'User'}
                        </span>
                      </div>
                      <Link
                        href="/trips"
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-navy-100 hover:bg-navy-800/50 hover:text-teal-400 transition-colors duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Trips
                      </Link>
                      <button
                        onClick={() => {
                          signOut({ redirectUrl: '/' });
                          setMobileMenuOpen(false);
                        }}
                        className="-mx-3 w-full text-left block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-red-400 hover:bg-navy-800/50 transition-colors duration-200"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/sign-in"
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-navy-100 hover:bg-navy-800/50 hover:text-teal-400 transition-colors duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/sign-up"
                        className="-mx-3 block rounded-lg bg-gradient-to-r from-teal-500 to-teal-400 px-3 py-2.5 text-base font-semibold leading-7 text-navy-900 hover:from-teal-400 hover:to-teal-300 transition-colors duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Start Planning
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}