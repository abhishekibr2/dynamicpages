'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Category } from "@/types/Category"
import { createCategory, updateCategory } from "@/utils/supabase/actions/category"
import { useState, useEffect } from "react"
import { availableColors } from "@/utils/colors"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CategoryDialogProps {
    category?: Category
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CategoryDialog({
    category,
    open,
    onOpenChange,
    onSuccess,
}: CategoryDialogProps) {
    const [formData, setFormData] = useState<Partial<Category>>({
        title: '',
        vars: '',
        color: availableColors[0],
    })
    const { toast } = useToast()

    useEffect(() => {
        if (category) {
            setFormData({
                title: category.title,
                vars: category.vars,
                color: category.color,
            })
        } else {
            setFormData({
                title: '',
                vars: '',
                color: availableColors[0],
            })
        }
    }, [category])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (category) {
                await updateCategory(category.id, formData as Category)
                toast({
                    title: "Success",
                    description: "Category updated successfully",
                })
            } else {
                await createCategory(formData as Category)
                toast({
                    title: "Success",
                    description: "Category created successfully",
                })
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: category ? "Failed to update category" : "Failed to create category",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vars">Variables (comma separated)</Label>
                        <Input
                            id="vars"
                            value={formData.vars}
                            onChange={(e) =>
                                setFormData({ ...formData, vars: e.target.value })
                            }
                            placeholder="var1,var2,var3"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="color">Color</Label>
                        <Select 
                            value={formData.color} 
                            onValueChange={(value) => setFormData({ ...formData, color: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a color" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableColors.map((color) => (
                                    <SelectItem key={color} value={color}>
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-4 h-4 rounded-full" 
                                                style={{ backgroundColor: color }}
                                            />
                                            {color}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            {category ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
} 