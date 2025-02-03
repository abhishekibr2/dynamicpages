'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogsViewer } from "../../pre-defined-vars/components/LogsViewer"
import Editor from "@monaco-editor/react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from "lucide-react"
import { PreDefinedVariable } from "@/types/PreDefinedVariable"
import { Log } from "../types"
import { PreDefinedFunction } from "@/types/PreDefinedFunctions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { PreDefinedFunctionDialog } from "../../pre-defined-functions/components/PreDefinedFunctionsDialog"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogContent } from "@/components/ui/dialog"

interface OutputSectionProps {
    activeTab: string
    onTabChange: (value: string) => void
    returnValue: string
    consoleOutput: string
    logs: Log[]
    pageId: string
    onLogsClear: () => void
    onRefresh: () => void
    method: string
    postBody: string
    onPostBodyChange: (value: string | undefined) => void
    preDefinedVariables: PreDefinedVariable[]
    selectedPreDefinedVarId: number | null
    onPreDefinedVarChange: (id: number | null) => void
    onAddNewVar: () => void
    onEditVar: (variable: PreDefinedVariable) => void
    preDefinedFunctions: PreDefinedFunction[]
    onInsertFunction: (functionCode: string) => void
    onEditSuccess?: () => void
    usePreDefinedVarsInProd: boolean
    onTogglePreDefinedVarsInProd: (value: boolean) => void
    in_production_vars: boolean
    queryParams: string
    onQueryParamsChange: (value: string | undefined) => void
}

export function OutputSection({
    activeTab,
    onTabChange,
    returnValue,
    consoleOutput,
    logs,
    pageId,
    onLogsClear,
    onRefresh,
    method,
    postBody,
    onPostBodyChange,
    preDefinedVariables,
    selectedPreDefinedVarId,
    onPreDefinedVarChange,
    onAddNewVar,
    onEditVar,
    preDefinedFunctions,
    onInsertFunction,
    onEditSuccess,
    usePreDefinedVarsInProd,
    in_production_vars,
    onTogglePreDefinedVarsInProd,
    queryParams,
    onQueryParamsChange,
}: OutputSectionProps) {
    const { theme } = useTheme()
    const [showFunctionDialog, setShowFunctionDialog] = useState(false)
    const [selectedFunction, setSelectedFunction] = useState<PreDefinedFunction | undefined>(undefined)
    const [showProdWarning, setShowProdWarning] = useState(false)
    const [pendingCheckboxValue, setPendingCheckboxValue] = useState(false)
    
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
                <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-none flex items-center justify-between border-b px-3 py-2">
                        <TabsList className="h-12 bg-transparent">
                            <TabsTrigger value="return">
                                Output
                            </TabsTrigger>
                            <TabsTrigger value="logs">
                                Logs
                            </TabsTrigger>
                            <TabsTrigger value="variables">
                                Pre-defined Code
                            </TabsTrigger>
                            {method === 'POST' ? (
                                <TabsTrigger value="request">
                                    Request Body ( Testing )
                                </TabsTrigger>
                            ) : (
                                <TabsTrigger value="request">
                                    Query Params ( Testing )
                                </TabsTrigger>
                            )}
                            <TabsTrigger value="functions">
                                Pre-defined Functions
                            </TabsTrigger>
                        </TabsList>

                    </div>


                    <div className="flex-1 overflow-hidden min-h-0">
                        <TabsContent value="return" className="h-full m-0">
                            <div className="h-full flex flex-col min-h-0">
                                <div className="h-[60%] min-h-0 border-b flex flex-col">
                                    <div className="p-4 flex-1 flex flex-col min-h-0">
                                        <h3 className="flex-none font-semibold mb-2">Return Value</h3>
                                        <div className="flex-1 overflow-y-auto min-h-0 rounded bg-background">
                                            <pre className="whitespace-pre-wrap p-2">
                                                {returnValue}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[40%] min-h-0 flex flex-col">
                                    <div className="p-4 flex-1 flex flex-col min-h-0 bg-muted/50">
                                        <h3 className="flex-none font-semibold mb-2">Console Output</h3>
                                        <div className="flex-1 overflow-y-auto min-h-0 rounded bg-background/50">
                                            <pre className="whitespace-pre-wrap p-2">
                                                {consoleOutput}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="logs" className="h-full m-0">
                            <div className="h-full p-4">
                                <LogsViewer
                                    logs={logs}
                                    pageId={pageId}
                                    onLogsCleared={onLogsClear}
                                    onRefresh={onRefresh}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="variables" className="h-full m-0">
                            <div className="h-full p-4">
                                <div className="space-y-4 h-full flex flex-col">
                                    <div className="flex-none flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <Label className="text-lg font-semibold">Pre-defined Code</Label>
                                            <div className="flex items-center gap-2">
                                                <Checkbox 
                                                    id="useInProd"
                                                    checked={in_production_vars}
                                                    onCheckedChange={handlePreDefinedVarsToggle}
                                                />
                                                <Label htmlFor="useInProd" className="text-sm">
                                                    Use in Production
                                                </Label>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={onAddNewVar}
                                        >
                                            Add New Variable
                                        </Button>
                                    </div>
                                    <Command className="border rounded-md flex-1 overflow-auto">
                                        <CommandInput placeholder="Search Pre-defined Codes..." />
                                        <CommandList>
                                            <CommandEmpty>No results found.</CommandEmpty>
                                            <CommandGroup>
                                                {preDefinedVariables.map((variable) => (
                                                    <CommandItem
                                                        key={variable.id}
                                                        onSelect={() => {
                                                            const newValue = selectedPreDefinedVarId === Number(variable.id) 
                                                                ? null 
                                                                : Number(variable.id)
                                                            onPreDefinedVarChange(newValue)
                                                        }}
                                                        className="flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: variable.color }}
                                                        />
                                                        <span>{variable.title}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="ml-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                onEditVar(variable)
                                                            }}
                                                        >
                                                            Edit
                                                        </Button>
                                                        {selectedPreDefinedVarId === Number(variable.id) && (
                                                            <Check className="ml-auto h-4 w-4" />
                                                        )}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </div>
                            </div>
                        </TabsContent>

                        {method === 'POST' ? (
                            <TabsContent value="request" className="p-4 m-0 h-full">
                                <div className="space-y-4 h-full flex flex-col">
                                    <div className="relative flex-1">
                                        <Label className="mb-2 block">Request Body (JSON)</Label>
                                        <div className="h-[calc(100%-2rem)] relative">
                                            <Editor
                                                height="100%"
                                                defaultLanguage="json"
                                                theme={`vs-${theme}`}
                                                value={postBody}
                                                onChange={(value) => {
                                                    if (value !== undefined) {
                                                        onPostBodyChange(value)
                                                    }
                                                }}
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
                                                    formatOnPaste: true,
                                                    formatOnType: true
                                                }}
                                            />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="absolute bottom-2 right-2 z-10"
                                                onClick={() => {
                                                    try {
                                                        const formatted = JSON.stringify(JSON.parse(postBody), null, 2)
                                                        onPostBodyChange(formatted)
                                                    } catch (error) {
                                                        // Handle error
                                                    }
                                                }}
                                            >
                                                Format JSON
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        ) : (
                            <TabsContent value="request" className="p-4 m-0 h-full">
                                <div className="space-y-4 h-full flex flex-col">
                                    <div className="relative flex-1">
                                        <div className="flex items-center justify-between">

                                        <Label className="mb-2 block">Query Parameters (JSON)</Label>
                                        <Dialog>
                                            <DialogTrigger>
                                                    Help
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Help</DialogTitle>
                                                    <DialogDescription>
                                                        <div className="space-y-2">
                                                            The query parameters are the parameters that will be sent to the server.
                                                            You can use the query parameters to test the API.
                                                            Only JSON is supported.
                                                            You can see the query inside the log as well.
                                                            <br />
                                                            <br />
                                                            Please note that the server will automaitically convert the JSON into query.
                                                        </div>
                                                        </DialogDescription>
                                                </DialogHeader>
                                            </DialogContent>
                                        </Dialog>
                                        </div>
                                        <div className="h-[calc(50%-2rem)] relative">
                                            <Editor
                                                value={queryParams}
                                                onChange={(value) => {
                                                    if (value !== undefined) {
                                                        onQueryParamsChange(value)
                                                    }
                                                }}
                                                className="w-full h-full"
                                                theme={`vs-${theme}`}
                                                options={{
                                                    minimap: { enabled: false },
                                                    fontSize: 14,
                                                    lineNumbers: 'on',
                                                    scrollBeyondLastLine: false,
                                                }}
                                                language="json"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        )}

                        <TabsContent value="functions" className="p-4 m-0 h-full">
                            <div className="space-y-4 h-full flex flex-col">
                                <div className="flex-none flex items-center justify-between">
                                    <Label className="text-lg font-semibold">Pre-defined Functions</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedFunction(undefined)
                                            setShowFunctionDialog(true)
                                        }}
                                    >
                                        Add New Function
                                    </Button>
                                </div>
                                <ScrollArea className="flex-1">
                                    <div className="space-y-4">
                                        {preDefinedFunctions.map((func) => (
                                            <Card key={func.id}>
                                                <CardHeader className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="text-base">{func.function_name}</CardTitle>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setSelectedFunction(func)
                                                                    setShowFunctionDialog(true)
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => onInsertFunction(func.function)}
                                                            >
                                                                Insert
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 pt-0">
                                                    <div className="bg-muted rounded-md p-2">
                                                        <pre className="text-sm whitespace-pre-wrap">
                                                            {func.function}
                                                        </pre>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            <PreDefinedFunctionDialog
                                open={showFunctionDialog}
                                onOpenChange={setShowFunctionDialog}
                                preDefinedFunction={selectedFunction}
                                onSuccess={() => {
                                    if (onEditSuccess) {
                                        onEditSuccess()
                                    }
                                    setShowFunctionDialog(false)
                                }}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            <AlertDialog open={showProdWarning} onOpenChange={setShowProdWarning}>
                <AlertDialogContent className="sm:max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-xl">
                            <span>⚠️ Production Mode Alert</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base space-y-2">
                            <div className="flex items-center gap-2">
                                <span>🔒</span>
                                <span>You're about to use predefined variables in production mode.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span>⚡</span>
                                <span>This means:</span>
                            </div>
                            <ul className="list-disc pl-8 space-y-1">
                                <li>Variables will be directly embedded in your code</li>
                                <li>Sensitive data could potentially be exposed</li>
                                <li>Code maintenance might become more challenging</li>
                            </ul>
                            <div className="pt-2 font-medium">Are you sure you want to continue?</div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel 
                            onClick={() => setPendingCheckboxValue(false)}
                            className="flex items-center gap-2"
                        >
                            <span>↩️</span> Go Back
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                onTogglePreDefinedVarsInProd(pendingCheckboxValue)
                                setShowProdWarning(false)
                            }}
                            className="flex items-center gap-2"
                        >
                            <span>✅</span> Yes, Proceed
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
} 