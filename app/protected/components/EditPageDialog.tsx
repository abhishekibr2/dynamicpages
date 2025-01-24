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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Page } from "@/types/Page"
import { updatePage } from "@/utils/supabase/actions/page"
import { useState } from "react"
import Editor from "@monaco-editor/react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface EditPageDialogProps {
    page: Page
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditPageDialog({
    page,
    open,
    onOpenChange,
    onSuccess,
}: EditPageDialogProps) {
    const [formData, setFormData] = useState<Page>(page)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Submitting form with method:', formData.method)
        try {
            const result = await updatePage(page.id as string, formData)
            console.log('Update result:', result)
            toast({
                title: "Success",
                description: "Page updated successfully",
            })
            onSuccess()
        } catch (error) {
            console.error('Update error:', error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update page",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] w-full">
                <DialogHeader>
                    <DialogTitle>Edit Page</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                        {/* Left side - Details */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) =>
                                        setFormData({ ...formData, title: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endpoint">Endpoint</Label>
                                <Input
                                    id="endpoint"
                                    value={formData.endpoint}
                                    onChange={(e) =>
                                        setFormData({ ...formData, endpoint: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="method">Method</Label>
                                <Select value={formData.method} onValueChange={(value) => {
                                    console.log('Method changed to:', value)
                                    setFormData({ ...formData, method: value })
                                }}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">POST</SelectItem>
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
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </div>

                        {/* Right side - Code Editor */}
                        <div className="space-y-2">
                            <Label htmlFor="code">Code</Label>
                            <div className="border rounded-md h-[500px]">
                                <Editor
                                    height="100%"
                                    defaultLanguage="javascript"
                                    theme="vs-dark"
                                    value={formData.code}
                                    onChange={(value) =>
                                        setFormData({ ...formData, code: value || '' })
                                    }
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
