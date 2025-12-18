"use client"

import { motion } from "framer-motion"
import { slideUp, fadeIn } from "@/lib/motion"

export function Hero() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={slideUp}
        className="text-center"
      >
        <motion.h1
          variants={fadeIn}
          className="text-4xl font-bold tracking-tight xs:text-6xl"
        >
          Welcome to My Portfolio
        </motion.h1>
        <motion.p
          variants={fadeIn}
          className="mt-6 text-lg leading-8 text-muted-foreground xs:text-xl"
        >
          Building beautiful experiences with modern web technologies
        </motion.p>
      </motion.div>
    </section>
  )
}













