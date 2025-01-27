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
import { getPages } from "@/utils/supabase/actions/page"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import moment from "moment"
import SkeletonTable from "@/components/skeleton-table"

export function PageTable() {
  const [pages, setPages] = useState<Page[]>([])
  const { toast } = useToast()
  const router = useRouter()

  const fetchPages = async () => {
    try {
      const data = await getPages()
      setPages(data)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch pages",
      })
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])


  if (pages.length === 0) {
    return <SkeletonTable />
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-muted/100">
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.id} className="cursor-pointer hover:bg-muted hover:rounded-md">
              <TableCell className="p-0">
                <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                  {page.title}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                  {page.description}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                  {page.endpoint}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                  {page.method}
                </Link>
              </TableCell>
              <TableCell className="p-0">
                <Link href={`/protected/page/${page.id}`} className="block px-4 py-2">
                  {moment(page.created_at).fromNow()}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
