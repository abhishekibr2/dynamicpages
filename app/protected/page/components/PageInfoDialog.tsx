'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { UseFormRegister, FieldErrors } from "react-hook-form"
import { PageFormData } from "../types"

interface PageInfoDialogProps {
    showDialog: boolean
    onOpenChange: (open: boolean) => void
    register: UseFormRegister<PageFormData>
    errors: FieldErrors<PageFormData>
    method: string
    onMethodChange: (value: string) => void
}

export function PageInfoDialog({
    showDialog,
    onOpenChange,
    register,
    errors,
    method,
    onMethodChange
}: PageInfoDialogProps) {
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

                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
} 