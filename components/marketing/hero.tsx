"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { fadeInUp, fadeIn, staggerContainer, buttonHover } from "@/lib/motion-variants"

export function Hero() {
  return (
    <motion.div 
      className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20 dark:from-indigo-900/20"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="mx-auto max-w-7xl pb-24 pt-10 sm:pb-32 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:py-40">
        <motion.div 
          className="px-6 lg:px-0 lg:pt-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <div className="mx-auto max-w-2xl">
            <div className="max-w-lg">
              <motion.h1 
                className="mt-10 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl"
                variants={fadeInUp}
              >
                Plan Your Perfect Trip with AI
              </motion.h1>
              <motion.p 
                className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300"
                variants={fadeInUp}
              >
                Get personalized travel itineraries in seconds. Real prices, 
                availability, and booking links all in one place.
              </motion.p>
              <motion.div 
                className="mt-10 flex items-center gap-x-6"
                variants={fadeInUp}
              >
                <motion.div variants={buttonHover} whileHover="hover" whileTap="tap">
                  <Button asChild size="lg">
                    <Link href="/new">
                      Start Planning
                    </Link>
                  </Button>
                </motion.div>
                <motion.div variants={buttonHover} whileHover="hover" whileTap="tap">
                  <Button variant="outline" asChild size="lg">
                    <Link href="/trips">
                      View Examples
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
        <motion.div 
          className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
        >
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <motion.div 
              className="rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <motion.img
                src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2830&q=80"
                alt="Trip Planning Dashboard"
                width={2432}
                height={1442}
                className="w-[76rem] rounded-md shadow-2xl ring-1 ring-gray-900/10"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}