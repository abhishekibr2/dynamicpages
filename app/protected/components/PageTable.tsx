'use client'

import { Page } from "@/types/Page"
import { Button } from "@/components/ui/button"
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.id}>
              <TableCell>{page.title}</TableCell>
              <TableCell>{page.description}</TableCell>
              <TableCell>{page.endpoint}</TableCell>
              <TableCell>{page.method}</TableCell>
              <TableCell>{new Date(page.created_at).toLocaleDateString()}</TableCell>
              <TableCell>

                <Link href={`/protected/page/${page.id}`}>
                  Edit
                </Link>

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
