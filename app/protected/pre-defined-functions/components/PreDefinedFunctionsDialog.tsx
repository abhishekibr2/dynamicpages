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
import { PreDefinedFunction } from "@/types/PreDefinedFunctions"
import { createPreDefinedFunction, updatePreDefinedFunction } from "@/utils/supabase/actions/preDefinedFunctions"
import { useState, useEffect } from "react"


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"

interface PreDefinedFunctionDialogProps {
    preDefinedFunction?: PreDefinedFunction
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}


export function PreDefinedFunctionDialog({
    preDefinedFunction,
    open,
    onOpenChange,
    onSuccess,
}: PreDefinedFunctionDialogProps) {

    const [formData, setFormData] = useState<Partial<PreDefinedFunction>>({
        function_name: '',
        function: '',
    })

    const { toast } = useToast()
    const { theme } = useTheme()

    useEffect(() => {
        if (preDefinedFunction) {
            setFormData({
                function_name: preDefinedFunction.function_name,
                function: preDefinedFunction.function,

            })

        } else {
            setFormData({
                function_name: '',
                function: '',
            })

        }
    }, [preDefinedFunction])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            if (preDefinedFunction) {
                await updatePreDefinedFunction(preDefinedFunction.id, formData as PreDefinedFunction)
                toast({
                    title: "Success",
                    description: "Pre-defined function updated successfully",

                })
            } else {
                await createPreDefinedFunction(formData as PreDefinedFunction)
                toast({
                    title: "Success",
                    description: "Pre-defined function created successfully",
                })
            }

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: preDefinedFunction ? "Failed to update pre-defined function" : "Failed to create pre-defined function",
            })
        }
    }


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{preDefinedFunction ? 'Edit Pre-defined Function' : 'Create Pre-defined Function'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">

                        <Label htmlFor="function_name">Function Name</Label>
                        <Input
                            id="function_name"
                            value={formData.function_name}

                            onChange={(e) =>
                                setFormData({ ...formData, function_name: e.target.value })
                            }

                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="function">Function</Label>
                        <div className="border rounded-md">
                            <Editor
                                height="200px"
                                defaultLanguage="javascript"
                                theme={`vs-${theme}`}

                                value={formData.function}
                                onChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        function: value ? value : ''
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
                    <div className="flex justify-end space-x-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">
                            {preDefinedFunction ? 'Update' : 'Create'}
                        </Button>
                    </div>
                </form>

            </DialogContent>
        </Dialog>
    )
} 