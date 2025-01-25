'use client'

import { Category } from "@/types/Category"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { getCategories, deleteCategory } from "@/utils/supabase/actions/category"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
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

interface CategoryTableProps {
  onEdit: (category: Category) => void;
  onAddNew: () => void;
}

export interface CategoryTableRef {
  fetchCategories: () => void;
}

const CategoryTableComponent = forwardRef<CategoryTableRef, CategoryTableProps>(
  ({ onEdit, onAddNew }, ref) => {
    const [categories, setCategories] = useState<Category[]>([])
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<string>()
    const { toast } = useToast()

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

    useImperativeHandle(ref, () => ({
      fetchCategories
    }))

    const handleDeleteClick = (id: string) => {
      setCategoryToDelete(id)
      setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
      if (!categoryToDelete) return

      try {
        await deleteCategory(categoryToDelete)
        toast({
          title: "Success",
          description: "Category deleted successfully",
        })
        fetchCategories()
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete category",
        })
      } finally {
        setDeleteDialogOpen(false)
        setCategoryToDelete(undefined)
      }
    }

    useEffect(() => {
      fetchCategories()
    }, [])

    return (
      <>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Categories</h2>
            <Button onClick={onAddNew}>Add New Category</Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/100">
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.title}</TableCell>
                    <TableCell>{category.vars}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        {category.color}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(category.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the category.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }
)

CategoryTableComponent.displayName = 'CategoryTable'

export const CategoryTable = CategoryTableComponent 