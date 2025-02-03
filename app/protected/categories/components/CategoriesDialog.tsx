'use client'

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Category } from "@/types/Category"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createCategory, updateCategory } from "@/utils/supabase/actions/categories"
import { useEffect } from "react"

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    color: z.string().min(1, "Color is required").regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format"),
})

interface CategoriesDialogProps {
    category?: Category
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function CategoriesDialog({
    category,
    open,
    onOpenChange,
    onSuccess,
}: CategoriesDialogProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            color: "#000000",
        },
    })

    useEffect(() => {
        if (open) {
            form.reset({
                name: category?.name || "",
                description: category?.description || "",
                color: category?.color || "#000000",
            })
        }
    }, [open, category, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            if (category) {
                await updateCategory({ 
                    ...values, 
                    id: category.id, 
                    created_at: category.created_at, 
                    description: values.description || '' 
                })
            } else {
                await createCategory(values as Category)
            }
            onSuccess()
            form.reset()
        } catch (error) {
            console.error('Error saving category:', error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {category ? "Edit Category" : "Create New Category"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Category name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Category description"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="color"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Color</FormLabel>
                                    <div className="flex gap-2 items-center">
                                        <FormControl>
                                            <Input placeholder="#000000" {...field} />
                                        </FormControl>
                                        <input
                                            type="color"
                                            value={field.value}
                                            onChange={(e) => field.onChange(e.target.value)}
                                            className="w-10 h-10 rounded cursor-pointer"
                                        />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">
                                {category ? "Update" : "Create"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
