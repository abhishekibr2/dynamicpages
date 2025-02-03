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
import { PreDefinedVariable } from "@/types/PreDefinedVariable"
import { createPreDefinedVariable, updatePreDefinedVariable } from "@/utils/supabase/actions/preDefinedVars"
import { useState, useEffect } from "react"
import { availableColors } from "@/utils/colors"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"

interface PreDefinedVariableDialogProps {
    preDefinedVariable?: PreDefinedVariable
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function PreDefinedVariableDialog({
    preDefinedVariable,
    open,
    onOpenChange,
    onSuccess,
}: PreDefinedVariableDialogProps) {
    const [formData, setFormData] = useState<Partial<PreDefinedVariable>>({
        title: '',
        vars: [] as string[],
        color: availableColors[0],
    })
    const { toast } = useToast()
    const { theme } = useTheme()

    useEffect(() => {
        if (preDefinedVariable) {
            setFormData({
                title: preDefinedVariable.title,
                vars: preDefinedVariable.vars,
                color: preDefinedVariable.color,
            })
        } else {
            setFormData({
                title: '',
                vars: [] as string[],
                color: availableColors[0],
            })
        }
    }, [preDefinedVariable])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (preDefinedVariable) {
                await updatePreDefinedVariable(preDefinedVariable.id, formData as PreDefinedVariable)
                toast({
                    title: "Success",
                    description: "Pre-defined variable updated successfully",
                })
            } else {
                await createPreDefinedVariable(formData as PreDefinedVariable)
                toast({
                    title: "Success",
                    description: "Pre-defined variable created successfully",
                })
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: preDefinedVariable ? "Failed to update pre-defined variable" : "Failed to create pre-defined variable",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{preDefinedVariable ? 'Edit Pre-defined Variable' : 'Create Pre-defined Variable'}</DialogTitle>
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
                        <Label htmlFor="vars">Variables (one per line)</Label>
                        <div className="border rounded-md">
                            <Editor
                                height="200px"
                                defaultLanguage="javascript"
                                theme={`vs-${theme}`}
                                value={Array.isArray(formData.vars) ? formData.vars.join('\n') : ''}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        vars: value ? value.split('\n').filter(v => v.trim() !== '') : []
                                    })
                                }
                                options={{
                                    minimap: { enabled: false },
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on',
                                    wrappingStrategy: 'advanced',
                                    fontSize: 14,
                                }}
                            />
                        </div>
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
                            {preDefinedVariable ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
} 