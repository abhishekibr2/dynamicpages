'use client'

import { Button } from "@/components/ui/button"
import { PageTable } from "./components/PageTable"
import { useRouter } from "next/navigation"

export default function ProtectedPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-10 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Code Executor Pages</h1>
        <Button onClick={() => router.push('/protected/page/new')}>
          Create New Page
        </Button>
      </div>
      <PageTable />
    </div>
  )
}
