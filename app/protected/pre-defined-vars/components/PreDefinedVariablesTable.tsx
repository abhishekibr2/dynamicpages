'use client'

import { PreDefinedVariable } from "@/types/PreDefinedVariable"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { getPreDefinedVariables, deletePreDefinedVariable } from "@/utils/supabase/actions/preDefinedVars"
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

interface PreDefinedVariableTableProps {
  onEdit: (preDefinedVariable: PreDefinedVariable) => void;
  onAddNew: () => void;
}

export interface PreDefinedVariableTableRef {
  fetchPreDefinedVariables: () => void;
}

const PreDefinedVariableTableComponent = forwardRef<PreDefinedVariableTableRef, PreDefinedVariableTableProps>(
  ({ onEdit, onAddNew }, ref) => {
    const [preDefinedVariables, setPreDefinedVariables] = useState<PreDefinedVariable[]>([])
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [preDefinedVariableToDelete, setPreDefinedVariableToDelete] = useState<string>()
    const { toast } = useToast()

    const fetchPreDefinedVariables = async () => {
      try {
        const data = await getPreDefinedVariables()
        setPreDefinedVariables(data)
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch Pre-defined Codes",
        })
      }
    }

    useImperativeHandle(ref, () => ({
      fetchPreDefinedVariables
    }))

    const handleDeleteClick = (id: string) => {
      setPreDefinedVariableToDelete(id)
      setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
      if (!preDefinedVariableToDelete) return

      try {
        await deletePreDefinedVariable(preDefinedVariableToDelete)
        toast({
          title: "Success",
          description: "Pre-defined Code deleted successfully",
        })
        fetchPreDefinedVariables()
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete Pre-defined Code",
        })
      } finally {
        setDeleteDialogOpen(false)
        setPreDefinedVariableToDelete(undefined)
      }
    }

    useEffect(() => {
      fetchPreDefinedVariables()
    }, [])

    if (preDefinedVariables.length === 0) {
      return <SkeletonTable />
    }

    return (
      <>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Pre-defined Code</h2>
            <Button onClick={onAddNew}>Add New Pre-defined Code</Button>
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
                {preDefinedVariables.map((preDefinedVariable) => (
                  <TableRow key={preDefinedVariable.id}>
                    <TableCell>{preDefinedVariable.title}</TableCell>
                    <TableCell>{preDefinedVariable.vars && preDefinedVariable.vars.length > 0 ? preDefinedVariable.vars.join(', ') : 'No variables'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: preDefinedVariable.color }}
                        />
                        {preDefinedVariable.color}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(preDefinedVariable.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(preDefinedVariable)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(preDefinedVariable.id)}
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
                This action cannot be undone. This will permanently delete the Pre-defined Code.
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

PreDefinedVariableTableComponent.displayName = 'PreDefinedVariableTable'

export const PreDefinedVariableTable = PreDefinedVariableTableComponent 