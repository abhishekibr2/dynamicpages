'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Editor from "@monaco-editor/react"
import { Settings2, ExternalLink, Play } from "lucide-react"
import { useTheme } from "next-themes"
import { Toolbox } from "@/types/Toolbox"
import { MovingBorderButton } from "@/components/ui/moving-border"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface CodeEditorSectionProps {
    code: string
    onCodeChange: (value: string | undefined) => void
    selectedVarCode: string
    selectedVarName?: string
    method: string
    endpoint: string
    isRunning: boolean
    onRun: () => void
    editorErrors: string[]
    toolbox: Toolbox
    onToolboxUpdate: (description: string) => Promise<void>
    onShowPostEndpoint: () => void
    usePreDefinedVarsInProd: boolean
    onTogglePreDefinedVarsInProd: (value: boolean) => void
}

export function CodeEditorSection({
    code,
    onCodeChange,
    selectedVarCode,
    selectedVarName,
    method,
    endpoint,
    isRunning,
    onRun,
    editorErrors,
    toolbox,
    onToolboxUpdate,
    onShowPostEndpoint,
    usePreDefinedVarsInProd,
    onTogglePreDefinedVarsInProd,
}: CodeEditorSectionProps) {
    const { theme } = useTheme()
    const [showToolboxDialog, setShowToolboxDialog] = useState(false)
    const [localToolboxDescription, setLocalToolboxDescription] = useState(toolbox.description)
    const [showProdWarning, setShowProdWarning] = useState(false)
    const [pendingCheckboxValue, setPendingCheckboxValue] = useState(false)

    // Update local state when prop changes
    useEffect(() => {
        setLocalToolboxDescription(toolbox.description)
    }, [toolbox.description])

    const handlePreDefinedVarsToggle = (checked: boolean) => {
        if (checked) {
            setShowProdWarning(true)
            setPendingCheckboxValue(checked)
        } else {
            onTogglePreDefinedVarsInProd(false)
        }
    }

    return (
        <div className="w-1/2 p-6">
            <div className="rounded-lg border bg-card h-full flex flex-col">
                <div className="flex-none flex items-center justify-between border-b px-3 py-2">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Code Editor</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowToolboxDialog(true)}
                        >
                            <Settings2 className="h-4 w-4 mr-2" />
                            Toolbox
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        {method === 'GET' ? (
                            <Button
                                onClick={() => window.open(`/api${endpoint}`, '_blank')}
                                size="sm"
                                variant="outline"
                                className="gap-2"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Open in Browser
                            </Button>
                        ) : (
                            <Button
                                onClick={onShowPostEndpoint}
                                size="sm"
                                variant="outline"
                                className="gap-2"
                            >
                                <ExternalLink className="h-4 w-4" />
                                Endpoint Options
                            </Button>
                        )}
                        <button className="inline-flex h-9 animate-shimmer items-center justify-center rounded-md border border-slate-800 dark:border-slate-700 bg-[linear-gradient(110deg,#f5f5f5,45%,#ffffff,55%,#f5f5f5)] dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] px-6 font-medium text-slate-900 dark:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-700 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 gap-2 whitespace-nowrap"
                            onClick={onRun}


                            disabled={isRunning}
                        >
                            <Play className="h-4 w-4" />
                            {isRunning ? 'Running...' : 'Run Code (Ctrl+R)'}
                        </button>
                    </div>
                </div>
                <div className="flex-1 flex flex-col min-h-0">
                    {selectedVarCode && (
                        <div className="flex-none border-b">
                            <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="variables" className="border-none">
                                    <AccordionTrigger className={cn(
                                        "px-4 py-2 hover:no-underline",
                                        "data-[state=open]:bg-muted/50"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">
                                                Pre-defined Code {selectedVarName && `(${selectedVarName})`}
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="bg-muted/50">
                                        <div className="px-4 pb-2">
                                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {selectedVarCode}
                                            </pre>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </div>
                    )}
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            defaultLanguage="javascript"
                            theme={`vs-${theme}`}
                            value={code}
                            onChange={onCodeChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                wordWrap: 'on',
                                scrollbar: {
                                    alwaysConsumeMouseWheel: false,
                                },
                                cursorStyle: 'line',
                                renderWhitespace: 'none',
                                fixedOverflowWidgets: true,
                                autoClosingBrackets: 'always',
                                autoClosingQuotes: 'always',
                                autoSurround: 'never'
                            }}
                        />
                    </div>
                </div>
                {/* Error Display Section */}
                <div className="flex-none border-t">
                    {editorErrors.length > 0 && (
                        <div className="p-2 bg-destructive/20">
                            <div className="text-sm space-y-1">
                                <p className="font-medium">Validation Errors:</p>
                                {editorErrors.map((error, index) => (
                                    <p key={index}>{error}</p>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <AlertDialog open={showProdWarning} onOpenChange={setShowProdWarning}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Warning: Production Use</AlertDialogTitle>
                            <AlertDialogDescription>
                                Using predefined variables in production means they will be directly included in the code. 
                                This could expose sensitive data or make your code less maintainable. Are you sure you want to proceed?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setPendingCheckboxValue(false)}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={() => {
                                onTogglePreDefinedVarsInProd(pendingCheckboxValue)
                                setShowProdWarning(false)
                            }}>
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            {/* Toolbox Dialog */}
            <Dialog open={showToolboxDialog} onOpenChange={setShowToolboxDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Toolbox</DialogTitle>
                        <DialogDescription>
                            Edit the toolbox description below. Changes will be saved when you click Update.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="h-[400px] border rounded-md overflow-hidden">
                            <Editor
                                height="100%"
                                defaultLanguage="javascript"
                                theme={`vs-${theme}`}
                                value={localToolboxDescription}
                                onChange={(value) => setLocalToolboxDescription(value || '')}
                                options={{
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
                                onClick={() => {
                                    onToolboxUpdate(localToolboxDescription)
                                    setShowToolboxDialog(false)
                                }}
                                size="sm"
                            >
                                Update Description
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
} 