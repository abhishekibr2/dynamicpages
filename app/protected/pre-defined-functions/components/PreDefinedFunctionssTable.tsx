'use client'


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,

  TableRow,
} from "@/components/ui/table"
import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
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
import SkeletonTable from "@/components/skeleton-table"
import { PreDefinedFunction } from "@/types/PreDefinedFunctions"
import { deletePreDefinedFunction, getPreDefinedFunctions } from "@/utils/supabase/actions/preDefinedFunctions"

interface PreDefinedFunctionTableProps {
  onEdit: (preDefinedFunction: PreDefinedFunction) => void;
  onAddNew: () => void;
}



export interface PreDefinedFunctionTableRef {
  fetchPreDefinedFunctions: () => void;
}


const PreDefinedFunctionTableComponent = forwardRef<PreDefinedFunctionTableRef, PreDefinedFunctionTableProps>(
  ({ onEdit, onAddNew }, ref) => {
    const [preDefinedFunctions, setPreDefinedFunctions] = useState<PreDefinedFunction[]>([])
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [preDefinedFunctionToDelete, setPreDefinedFunctionToDelete] = useState<string>()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)


    const fetchPreDefinedFunctions = async () => {
      try {
        const data = await getPreDefinedFunctions()
        setPreDefinedFunctions(data)
        setLoading(false)

      } catch (error) {
        toast({
          variant: "destructive",

          title: "Error",
          description: "Failed to fetch pre-defined functions",
        })
      }
    }


    useImperativeHandle(ref, () => ({
      fetchPreDefinedFunctions
    }))


    const handleDeleteClick = (id: string) => {
      setPreDefinedFunctionToDelete(id)
      setDeleteDialogOpen(true)
    }


    const handleDeleteConfirm = async () => {
      if (!preDefinedFunctionToDelete) return


      try {
        await deletePreDefinedFunction(preDefinedFunctionToDelete)
        toast({
          title: "Success",
          description: "Pre-defined function deleted successfully",

        })
        fetchPreDefinedFunctions()
      } catch (error) {
        toast({
          variant: "destructive",

          title: "Error",
          description: "Failed to delete pre-defined function",
        })

      } finally {
        setDeleteDialogOpen(false)
        setPreDefinedFunctionToDelete(undefined)
      }
    }


    useEffect(() => {
      fetchPreDefinedFunctions()
    }, [])


    if (loading) {
      return <SkeletonTable />
    }


    return (
      <>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Pre-defined Functions</h2>
            <Button onClick={onAddNew}>Add New Pre-defined Function</Button>
          </div>
          <div className="rounded-md border">
            <Table>

              <TableHeader className="bg-muted/100">
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Function</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>

              </TableHeader>
              <TableBody>
                {preDefinedFunctions.length === 0 ? ( 
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No pre-defined functions found</TableCell>
                  </TableRow>
                ) : (
                  preDefinedFunctions.map((preDefinedFunction) => (
                    <TableRow key={preDefinedFunction.id}>
                      <TableCell>{preDefinedFunction.function_name}</TableCell>

                    <TableCell>{preDefinedFunction.function}</TableCell>
                    <TableCell>{new Date(preDefinedFunction.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(preDefinedFunction)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(preDefinedFunction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                      </div>
                    </TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </div>
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the pre-defined function.
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

PreDefinedFunctionTableComponent.displayName = 'PreDefinedFunctionTable'


export const PreDefinedFunctionTable = PreDefinedFunctionTableComponent 