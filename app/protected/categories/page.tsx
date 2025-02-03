'use client'

import { useState, useRef } from "react"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { CategoriesTable } from "./components/CategoriesTable"
import { CategoriesDialog } from "./components/CategoriesDialog"
import { Category } from "@/types/Category"

export default function CategoriesPage() {
    const [selectedCategory, setSelectedCategory] = useState<Category>()
    const [dialogOpen, setDialogOpen] = useState(false)
    const tableRef = useRef<{ fetchCategories: () => void }>({ fetchCategories: () => { } })

    const handleEdit = (category: Category) => {
        setSelectedCategory(category)
        setDialogOpen(true)
    }

    const handleAddNew = () => {
        setSelectedCategory(undefined)
        setDialogOpen(true)
    }

    const handleSuccess = () => {
        tableRef.current.fetchCategories()
        setDialogOpen(false)
    }

    return (
        <div className="container mx-auto py-10 space-y-4">
            <div className="flex h-full flex-col">
                <Link href="/protected" className="max-w-fit">
                    <div className="flex items-center gap-2 border rounded-md px-2 py-1 mt-2 bg-muted">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </div>
                </Link>
                <div className="flex-1 min-h-0 w-full bg-card rounded-lg shadow-sm p-4 mt-2">
                    <CategoriesTable
                        ref={tableRef}
                        onEdit={handleEdit}
                        onAddNew={handleAddNew}
                    />
                </div>
                <CategoriesDialog
                    category={selectedCategory}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    )
}
