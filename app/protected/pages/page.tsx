'use client'

import { ArrowLeftIcon, PlusIcon } from "lucide-react"
import { PageTable } from "../pre-defined-vars/components/PageTable"
import Link from "next/link"
import { motion } from "framer-motion"

export default function PagesPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto py-12 space-y-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/protected"
            className="group px-4 py-2 bg-secondary/80 text-secondary-foreground rounded-lg flex items-center gap-2 hover:bg-secondary transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Code Executor Pages
          </h1>
        </div>
        
        <Link
          href="/protected/page/new"
          className="group px-5 py-2.5 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-primary/25"
        >
          Create New Page 
          <PlusIcon className="w-4 h-4 transition-transform group-hover:rotate-90" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <PageTable />
      </motion.div>
    </motion.div>
  )
} 