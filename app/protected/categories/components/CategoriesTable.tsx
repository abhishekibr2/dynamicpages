'use client'

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Category } from "@/types/Category"
import { PlusIcon, Pencil, Trash2 } from "lucide-react"
import { forwardRef, useEffect, useImperativeHandle, useState } from "react"
import { getCategories, deleteCategory } from "@/utils/supabase/actions/categories"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CategoriesTableProps {
    onEdit: (category: Category) => void
    onAddNew: () => void
}

export const CategoriesTable = forwardRef<
    { fetchCategories: () => void },
    CategoriesTableProps
>(({ onEdit, onAddNew }, ref) => {
    const [categories, setCategories] = useState<Category[]>([])
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

    const fetchCategories = async () => {
        try {
            const data = await getCategories()
            setCategories(data)
        } catch (error) {
            console.error('Error fetching categories:', error)
        }
    }

    useImperativeHandle(ref, () => ({
        fetchCategories
    }))

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleDelete = async (category: Category) => {
        setCategoryToDelete(category)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (categoryToDelete) {
            try {
                await deleteCategory(categoryToDelete.id?.toString() || '')
                await fetchCategories()
            } catch (error) {
                console.error('Error deleting category:', error)
            }
        }
        setDeleteDialogOpen(false)
        setCategoryToDelete(null)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Categories</h2>
                <Button onClick={onAddNew} variant="outline">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add New
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.map((category) => (
                        <TableRow key={category.id}>
                            <TableCell>{category.name}</TableCell>
                            <TableCell>{category.description}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div 
                                        className="w-6 h-6 rounded border" 
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span>{category.color}</span>
                                </div>
                            </TableCell>
                            <TableCell className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onEdit(category)}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(category)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {categories.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center">
                                No categories found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the
                            category.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
})

CategoriesTable.displayName = 'CategoriesTable'
