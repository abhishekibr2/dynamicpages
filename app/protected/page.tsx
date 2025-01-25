'use client'

import { PageTable } from "./components/PageTable"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ProtectedPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-10 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Code Executor Pages</h1>
        <div className="flex gap-2">
          <Link href="/protected/page/new" className="bg-primary hover:bg-primary/90 text-background px-4 py-2 rounded-md">
            Create New Page
          </Link>
          <Link href="/protected/category" className="bg-primary hover:bg-primary/90 text-background px-4 py-2 rounded-md">
            Categories
          </Link>
        </div>
      </div>
      <PageTable />
    </div>
  )
}
