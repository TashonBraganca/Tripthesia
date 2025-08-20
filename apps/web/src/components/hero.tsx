"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container px-4 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
          Plan Perfect Trips with{" "}
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI
          </span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Generate complete travel itineraries in seconds with real prices,
          availability, and booking links. Your adventure starts here.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/new">
            <Button size="lg" className="text-lg px-8">
              Plan Your Trip
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="text-lg px-8">
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  );
}