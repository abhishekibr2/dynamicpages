'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"

interface GeneratedCodeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    code: string
}

export function GeneratedCodeDialog({
    open,
    onOpenChange,
    code
}: GeneratedCodeDialogProps) {
    const { toast } = useToast()
    const { theme } = useTheme()

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(code)
            toast({
                title: "Success",
                description: "Code copied to clipboard",
            })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to copy code to clipboard",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Use In Flowise</DialogTitle>
                    <DialogDescription>
                        You can copy paste the code below in flowise tool to call this endpoint.
                    </DialogDescription>


                </DialogHeader>
                <div className="space-y-4">
                    <div className="h-[500px] border rounded-md overflow-hidden relative">
                        <Editor
                            height="100%"
                            defaultLanguage="javascript"
                            theme={`vs-${theme}`}
                            value={code}
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                wordWrap: 'on',
                                scrollbar: {
                                    alwaysConsumeMouseWheel: false,
                                }
                            }}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button 
                            onClick={handleCopyCode}
                            size="sm"
                            className="gap-2"
                        >
                            <Copy className="h-4 w-4" />
                            Copy Code
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
} 