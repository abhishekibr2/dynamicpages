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
import { Button } from "@/components/ui/button"
import React from "react"

export function PageTable() {
  const [pages, setPages] = useState<Page[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()
  const router = useRouter()

  // Calculate pagination values
  const totalPages = Math.ceil(pages.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = pages.slice(startIndex, endIndex)

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  if (loading) {
    return <SkeletonTable />
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full overflow-hidden"
      >
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground/90">Pages</h2>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger 
                className="w-[200px] shadow-sm"
                style={{
                  backgroundColor: getSelectedCategoryColor(),
                  color: getSelectedCategoryColor() ? 'white' : undefined
                }}
              >
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id?.toString() || ''} 
                    className="flex items-center"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50"
              >
                Title
              </motion.th>
              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50"
              >
                Description
              </motion.th>
              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50"
              >
                Endpoint
              </motion.th>
              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50"
              >
                Method
              </motion.th>
              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50"
              >
                Category
              </motion.th>
              <motion.th
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground bg-muted/50"
              >
                Created At
              </motion.th>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait" initial={false}>
              {currentItems.length === 0 ? (
                <motion.tr
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.3,
                    ease: "easeInOut"
                  }}
                  className="text-center"
                >
                  <TableCell colSpan={6} className="h-24 text-muted-foreground">No pages found</TableCell>
                </motion.tr>
              ) : (
                currentItems.map((page, index) => (
                  <motion.tr
                    key={page.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: {
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: "easeOut"
                      }
                    }}
                    exit={{ 
                      opacity: 0,
                      y: 20,
                      transition: {
                        duration: 0.2,
                        delay: (currentItems.length - index - 1) * 0.05,
                        ease: "easeIn"
                      }
                    }}
                    className="group hover:bg-muted/50 data-[state=selected]:bg-muted transition-colors"
                  >
                    <TableCell className="p-0">
                      <Link 
                        href={`/protected/page/${page.id}`} 
                        className="block px-4 py-3 text-sm font-medium"
                      >
                        {page.title}
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link 
                        href={`/protected/page/${page.id}`} 
                        className="block px-4 py-3 text-sm text-muted-foreground"
                      >
                        {page.description}
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link 
                        href={`/protected/page/${page.id}`} 
                        className="block px-4 py-3 text-sm font-mono text-muted-foreground"
                      >
                        {page.endpoint}
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link 
                        href={`/protected/page/${page.id}`} 
                        className="block px-4 py-3"
                      >
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium
                          ${page.method === 'GET' ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' :
                          page.method === 'POST' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20' :
                          page.method === 'PUT' ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20' :
                          page.method === 'DELETE' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20' :
                          'bg-gray-50 text-gray-700 ring-1 ring-inset ring-gray-600/20'}`}
                        >
                          {page.method}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link 
                        href={`/protected/page/${page.id}`} 
                        className="block px-4 py-3"
                      >
                        {categories.find(c => c.id === page.category)?.name ? (
                          <span className="inline-flex items-center gap-1.5">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: categories.find(c => c.id === page.category)?.color }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {categories.find(c => c.id === page.category)?.name}
                            </span>
                          </span>
                        ) : '-'}
                      </Link>
                    </TableCell>
                    <TableCell className="p-0">
                      <Link 
                        href={`/protected/page/${page.id}`} 
                        className="block px-4 py-3 text-sm text-muted-foreground"
                      >
                        {moment(page.created_at).fromNow()}
                      </Link>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
        
        {pages.length > 0 && (
          <motion.div 
            className="flex items-center justify-center space-x-2 py-6 border-t bg-muted/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show current page, first page, last page, and pages around current
                  const nearCurrent = Math.abs(page - currentPage) <= 1
                  const isFirstOrLast = page === 1 || page === totalPages
                  return nearCurrent || isFirstOrLast
                })
                .map((page, i, arr) => (
                  <React.Fragment key={page}>
                    {i > 0 && arr[i - 1] !== page - 1 && (
                      <span className="text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              Last
            </Button>
          </motion.div>
        )}
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
