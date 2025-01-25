'use client'

import { useState, useRef } from "react"
import { Category } from "@/types/Category"
import { CategoryTable } from "../components/CategoryTable"
import { CategoryDialog } from "../components/CategoryDialog"

export default function ProtectedCategory() {
    const [selectedCategory, setSelectedCategory] = useState<Category>()
    const [dialogOpen, setDialogOpen] = useState(false)
    const tableRef = useRef<{ fetchCategories: () => void }>({ fetchCategories: () => {} })

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
        <div className="flex flex-col gap-4">
            <CategoryTable 
                ref={tableRef}
                onEdit={handleEdit} 
                onAddNew={handleAddNew} 
            />
            <CategoryDialog
                category={selectedCategory}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={handleSuccess}
            />
        </div>
    )
}