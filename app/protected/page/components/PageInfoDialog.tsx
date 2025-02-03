'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { UseFormRegister, FieldErrors } from "react-hook-form"
import { PageFormData } from "../types"
import { useEffect, useState } from "react"
import { Category } from "@/types/Category"
import { getCategories } from "@/utils/supabase/actions/categories"

interface PageInfoDialogProps {
    showDialog: boolean
    onOpenChange: (open: boolean) => void
    register: UseFormRegister<PageFormData>
    errors: FieldErrors<PageFormData>
    method: string
    onMethodChange: (value: string) => void
    category?: number
    onCategoryChange: (value: number | null) => void
}

export function PageInfoDialog({
    showDialog,
    onOpenChange,
    register,
    errors,
    method,
    onMethodChange,
    category,
    onCategoryChange
}: PageInfoDialogProps) {
    const [categories, setCategories] = useState<Category[]>([])

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await getCategories()
                setCategories(data)
            } catch (error) {
                console.error('Error fetching categories:', error)
            }
        }
        fetchCategories()
    }, [])

    return (
        <Dialog open={showDialog} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Page Information</DialogTitle>
                    <DialogDescription>
                        Edit the basic information for this page.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            {...register('title')}
                            className={cn(
                                errors.title && "border-destructive focus-visible:ring-destructive"
                            )}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            className={cn(
                                "min-h-[120px] resize-none",
                                errors.description && "border-destructive focus-visible:ring-destructive"
                            )}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">{errors.description.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="endpoint">Endpoint</Label>
                            <Input
                                id="endpoint"
                                {...register('endpoint')}
                                className={cn(
                                    errors.endpoint && "border-destructive focus-visible:ring-destructive"
                                )}
                            />
                            {errors.endpoint && (
                                <p className="text-sm text-destructive">{errors.endpoint.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="method">Method</Label>
                            <Select
                                value={method}
                                onValueChange={onMethodChange}
                            >
                                <SelectTrigger className={cn(
                                    errors.method && "border-destructive focus-visible:ring-destructive"
                                )}>
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GET">GET</SelectItem>
                                    <SelectItem value="POST">POST</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.method && (
                                <p className="text-sm text-destructive">{errors.method.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={category?.toString() || "none"}
                                onValueChange={(value) => {
                                    const categoryId = value === "none" ? null : parseInt(value, 10)
                                    onCategoryChange(categoryId)
                                }}
                            >
                                <SelectTrigger className={cn(
                                    errors.category && "border-destructive focus-visible:ring-destructive"
                                )}>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Category</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id?.toString() || '0'}>
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-3 h-3 rounded-full" 
                                                    style={{ backgroundColor: cat.color }}
                                                />
                                                {cat.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-sm text-destructive">{errors.category.message}</p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
} 