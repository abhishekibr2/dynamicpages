'use client'

import { Page } from "@/types/Page"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState, useEffect } from "react"
import { getPages, getPagesByCategory } from "@/utils/supabase/actions/page"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import moment from "moment"
import SkeletonTable from "@/components/skeleton-table"
import { getCategories } from "@/utils/supabase/actions/categories"
import { Category } from "@/types/Category"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"

export function PageTable() {
  const [pages, setPages] = useState<Page[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  const fetchCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch categories",
      })
    }
  }

  const fetchPages = async (categoryId?: string) => {
    try {
      setLoading(true)
      let data
      if (categoryId && categoryId !== "all") {
        data = await getPagesByCategory(parseInt(categoryId))
      } else {
        data = await getPages()
      }
      setPages(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch pages",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchPages(selectedCategory)
  }, [selectedCategory])

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
  }

  const getSelectedCategoryColor = () => {
    if (selectedCategory === "all") return undefined;
    const category = categories.find(c => c.id?.toString() === selectedCategory);
    return category?.color;
  };

  if (loading) {
    return <SkeletonTable />
  }

  return (
    <div className="rounded-lg border bg-card">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full overflow-auto"
      >
        <Table>
          <TableHeader>
            <TableRow className="border">
              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="... p-2 border"
              >
                Title
              </motion.th>
              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="... p-2 border"

              >
                Description
              </motion.th>
              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="... p-2 border"
              >
                Endpoint
              </motion.th>

              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="... p-2 border"
              >
                Method
              </motion.th>
              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="... p-2 border"
              >
                Category
              </motion.th>

              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="... p-2 border"
              >
                Created At
              </motion.th>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {pages.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{
                    duration: 0.2,
                    delay: 0,
                    ease: "easeOut"
                  }}
                  className="text-center py-4"
                >
                  <TableCell colSpan={6}>No pages found</TableCell>
                </motion.tr>
              ) : (
                pages.map((page, index) => (
                  <motion.tr
                    key={page.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.05,
                      ease: "easeOut"
                    }}
                    className="hover:bg-muted/50 data-[state=selected]:bg-muted cursor-pointer"
                  >
                    <TableCell className="p-2 border">
                      <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                        {page.title}
                      </Link>
                    </TableCell>
                    <TableCell className="p-2 border">
                      <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                        {page.description}
                      </Link>
                    </TableCell>

                    <TableCell className="p-2 border">
                      <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                        {page.endpoint}
                      </Link>


                    </TableCell>
                    <TableCell className="p-2 border">
                      <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                        {page.method}
                      </Link>

                    </TableCell>
                    <TableCell className="p-2 border">
                      <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                        {categories.find(c => c.id === page.category)?.name || '-'}
                      </Link>

                    </TableCell>
                    <TableCell className="p-2 border">
                      <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                        {moment(page.created_at).fromNow()}
                      </Link>

                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </motion.div>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center p-4"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
