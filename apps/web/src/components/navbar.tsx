"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { isSignedIn } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-md bg-primary"></div>
            <span className="text-xl font-bold">Tripthesia</span>
          </Link>
        </div>

        <nav className="flex items-center space-x-6">
          {isSignedIn ? (
            <>
              <Link
                href="/new"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  "text-muted-foreground"
                )}
              >
                Plan Trip
              </Link>
              <Link
                href="/saved"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  "text-muted-foreground"
                )}
              >
                My Trips
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/sign-up">
                <Button>Get Started</Button>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}