'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getPage, updatePage, deletePage, createPage } from "@/utils/supabase/actions/page"
import Editor from "@monaco-editor/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { use } from "react"
import { ArrowLeft, Play } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command"
import { Check } from "lucide-react"
import { getPreDefinedVariables } from "@/utils/supabase/actions/preDefinedVars"
import { PreDefinedVariableDialog } from "../../components/PreDefinedVariablesDialog"
import { PreDefinedVariable } from "@/types/PreDefinedVariable"
import { useTheme } from "next-themes"
import SkeletonPage from "@/components/skeleton-page"
import { LogsViewer } from "../../components/LogsViewer"

interface PageEditorProps {
    params: Promise<{
        id: string
    }>
}

const pageSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
    description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
    code: z.string().min(1, "Code is required"),
    endpoint: z.string().min(1, "Endpoint is required").startsWith("/", "Endpoint must start with /"),
    method: z.enum(["GET", "POST"], {
        required_error: "Method is required",
        invalid_type_error: "Method must be either GET or POST"
    }),
    created_at: z.string(),
    id: z.string().optional(),
    preDefinedVariables: z.number().nullable(),
    logs: z.array(z.object({
        timestamp: z.string(),
        output: z.string(),
        console: z.string(),
        returnValue: z.string()
    })).default([])
})

type PageFormData = z.infer<typeof pageSchema>

export default function PageEditor({ params }: PageEditorProps) {
    const resolvedParams = use(params)
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()
    const router = useRouter()
    const isNewPage = resolvedParams.id === 'new'
    const [output, setOutput] = useState<string>('')
    const [consoleOutput, setConsoleOutput] = useState<string>('')
    const [returnValue, setReturnValue] = useState<string>('')
    const [isRunning, setIsRunning] = useState(false)
    const [postBody, setPostBody] = useState<string>('{\n  \n}')
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState<'back' | 'cancel' | null>(null)
    const [initialCode, setInitialCode] = useState<string>('')
    const [lastKeyPress, setLastKeyPress] = useState<string>('')
    const [lastKeyPressTime, setLastKeyPressTime] = useState<number>(0)
    const [editorErrors, setEditorErrors] = useState<string[]>([])
    const [preDefinedVariables, setPreDefinedVariables] = useState<PreDefinedVariable[]>([])
    const [showPreDefinedVarDialog, setShowPreDefinedVarDialog] = useState(false)
    const [selectedPreDefinedVar, setSelectedPreDefinedVar] = useState<PreDefinedVariable | undefined>(undefined)
    const [selectedVarCode, setSelectedVarCode] = useState<string>('')
    const { theme } = useTheme()
    const {
        register,
        handleSubmit: handleFormSubmit,
        formState: { errors, isDirty },
        setValue,
        watch,
        reset
    } = useForm<PageFormData>({
        resolver: zodResolver(pageSchema),
        defaultValues: {
            title: '',
            description: '',
            code: '',
            endpoint: '',
            method: 'GET',
            created_at: new Date().toISOString(),
            preDefinedVariables: null,
            logs: []
        }
    })
    const [userCode, setUserCode] = useState<string>('')
    const [actualCode, setActualCode] = useState<string>('')
    const [initialFormState, setInitialFormState] = useState<PageFormData | null>(null)

    // Track unsaved changes including code editor
    useEffect(() => {
        if (!initialFormState) return;

        const currentFormState = {
            title: watch('title'),
            description: watch('description'),
            endpoint: watch('endpoint'),
            method: watch('method'),
            code: actualCode,
            preDefinedVariables: watch('preDefinedVariables'),
            created_at: watch('created_at'),
            logs: watch('logs') || []
        } as const;

        const isValidKey = (key: string): key is keyof typeof currentFormState => {
            return key in currentFormState;
        };

        const hasChanges = Object.keys(currentFormState).some(key => {
            if (!isValidKey(key)) return false;
            if (key === 'logs') return false; // Don't consider logs for unsaved changes
            if (key === 'preDefinedVariables') {
                const current = currentFormState.preDefinedVariables;
                const initial = initialFormState.preDefinedVariables;
                return (current === null && initial !== null) ||
                       (current !== null && initial === null) ||
                       (current !== initial);
            }
            return JSON.stringify(currentFormState[key]) !== 
                   JSON.stringify(initialFormState[key]);
        });

        setHasUnsavedChanges(hasChanges);
    }, [watch('title'), watch('description'), watch('endpoint'), watch('method'), actualCode, watch('preDefinedVariables'), initialFormState]);

    // Add keyboard shortcut handler
    // useEffect(() => {
    //     const handleKeyPress = (e: KeyboardEvent) => {
    //         const currentTime = Date.now()
    //         const newLastKey = e.key.toLowerCase()

    //         if (newLastKey === 's') {
    //             const timeDiff = currentTime - lastKeyPressTime
    //             if (lastKeyPress === 's' && timeDiff <= 500) {
    //                 handleNavigation('back')
    //                 setLastKeyPress('')
    //                 setLastKeyPressTime(0)
    //             } else {
    //                 setLastKeyPress('s')
    //                 setLastKeyPressTime(currentTime)
    //             }
    //         } else {
    //             setLastKeyPress('')
    //             setLastKeyPressTime(0)
    //         }
    //     }

    //     window.addEventListener('keypress', handleKeyPress)
    //     return () => window.removeEventListener('keypress', handleKeyPress)
    // }, [lastKeyPress, lastKeyPressTime])

    // Effect to fetch and update selected predefined variable's code
    useEffect(() => {
        const fetchSelectedVarCode = async () => {
            const selectedVarId = watch('preDefinedVariables')
            if (selectedVarId !== null) {
                const selectedVar = preDefinedVariables.find(v => Number(v.id) === selectedVarId)
                if (selectedVar && selectedVar.vars) {
                    const varsCode = selectedVar.vars.join('\n')
                    setSelectedVarCode(varsCode)
                } else {
                    setSelectedVarCode('')
                }
            } else {
                setSelectedVarCode('')
            }
        }
        fetchSelectedVarCode()
    }, [watch('preDefinedVariables')])

    const handleCodeChange = (value: string | undefined) => {
        const newValue = value || ''
        setUserCode(newValue)
        setActualCode(newValue)
        setValue('code', newValue, { shouldDirty: true })
    }

    // Function to get the full code for running
    const getFullCodeForRunning = () => {
        return selectedVarCode ? `${selectedVarCode}\n\n${actualCode}` : actualCode
    }

    // Function to get the actual code for saving
    const getActualCodeForSaving = () => {
        return actualCode
    }

    const handleNavigation = (type: 'back' | 'cancel') => {
        if (hasUnsavedChanges) {
            setShowUnsavedAlert(true)
            setPendingNavigation(type)
        } else {
            if (type === 'back') {
                router.back()
            } else {
                router.push('/protected')
            }
        }
    }

    const handleNavigationConfirm = async (shouldSave: boolean) => {
        if (shouldSave) {
            await handleFormSubmit(onSubmit)()
        }
        setShowUnsavedAlert(false)
        if (pendingNavigation === 'back') {
            router.back()
        } else {
            router.push('/protected')
        }
    }

    useEffect(() => {
        if (!isNewPage) {
            fetchPage()
        } else {
            setIsLoading(false)
            setInitialCode('')
            setUserCode('')
            setActualCode('')
            // Set initial form state for new page
            setInitialFormState({
                title: '',
                description: '',
                code: '',
                endpoint: '',
                method: 'GET',
                created_at: new Date().toISOString(),
                preDefinedVariables: null,
                logs: []
            });
        }
    }, [resolvedParams.id])

    useEffect(() => {
        const fetchPreDefinedVars = async () => {
            try {
                const vars = await getPreDefinedVariables()
                setPreDefinedVariables(vars)
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to fetch pre-defined variables",
                })
            }
        }
        fetchPreDefinedVars()
    }, [])

    const fetchPage = async () => {
        try {
            const data = await getPage(resolvedParams.id)
            // Set the actual code without predefined variables
            const existingCode = data.code || ''
            setActualCode(existingCode)
            setUserCode(existingCode)
            setValue('code', existingCode)
            
            // Set form values and track initial state
            const initialState = {
                title: data.title || '',
                description: data.description || '',
                code: existingCode,
                endpoint: data.endpoint || '',
                method: data.method || 'GET',
                created_at: data.created_at || new Date().toISOString(),
                preDefinedVariables: data.preDefinedVariables ? Number(data.preDefinedVariables) : null,
                logs: data.logs || []
            };
            
            // Set all form values
            Object.entries(initialState).forEach(([key, value]) => {
                if (key === 'preDefinedVariables') {
                    setValue(key, value ? Number(value) : null)
                    // If there are predefined variables, add them at the top
                    if (value) {
                        const selectedVar = preDefinedVariables.find(v => Number(v.id) === Number(value))
                        if (selectedVar && selectedVar.vars) {
                            const varsCode = selectedVar.vars.join('\n')
                            setSelectedVarCode(varsCode)
                            const newCode = varsCode + '\n\n' + existingCode
                            setUserCode(newCode)
                        }
                    }
                } else {
                    setValue(key as keyof PageFormData, value)
                }
            });

            setInitialFormState(initialState);
            setInitialCode(existingCode)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to fetch page",
            })
            router.push('/protected')
        } finally {
            setIsLoading(false)
        }
    }

    // Add an effect to handle initial loading of predefined variables
    useEffect(() => {
        if (preDefinedVariables.length > 0 && !isNewPage) {
            const selectedVarId = watch('preDefinedVariables')
            if (selectedVarId !== null) {
                const selectedVar = preDefinedVariables.find(v => Number(v.id) === selectedVarId)
                if (selectedVar && selectedVar.vars) {
                    const varsCode = selectedVar.vars.join('\n')
                    setSelectedVarCode(varsCode)
                    const currentCode = watch('code')
                    if (!currentCode.includes(varsCode)) {
                        const newCode = varsCode + (currentCode ? '\n\n' + currentCode : '')
                        setUserCode(newCode)
                        setValue('code', newCode, { shouldDirty: true })
                    }
                }
            }
        }
    }, [preDefinedVariables])

    const onSubmit = async (data: PageFormData) => {
        try {
            // Use actual code without predefined variables for saving
            const codeToSave = getActualCodeForSaving()
            
            if (isNewPage) {
                const { id, ...newPageData } = data
                const result = await createPage({
                    ...newPageData,
                    code: codeToSave,
                    preDefinedVariables: newPageData.preDefinedVariables ? Number(newPageData.preDefinedVariables) : null,
                    logs: []
                })
                const newPageId = result[0].id
                router.replace(`/protected/page/${newPageId}`)
                
                // Update initial state after successful save
                const savedState = {
                    ...newPageData,
                    code: codeToSave,
                    preDefinedVariables: newPageData.preDefinedVariables ? Number(newPageData.preDefinedVariables) : null,
                    logs: []
                };
                setInitialFormState(savedState);
                setInitialCode(codeToSave)
                setHasUnsavedChanges(false)
                
                toast({
                    title: "Success",
                    description: "Page created successfully",
                })
            } else {
                const { id, created_at, ...updateData } = data
                await updatePage(resolvedParams.id, {
                    ...updateData,
                    code: codeToSave,
                    preDefinedVariables: updateData.preDefinedVariables ? Number(updateData.preDefinedVariables) : null,
                    logs: watch('logs') || []
                })
                
                // Update initial state after successful save
                const savedState = {
                    ...updateData,
                    code: codeToSave,
                    created_at: created_at,
                    preDefinedVariables: updateData.preDefinedVariables ? Number(updateData.preDefinedVariables) : null,
                    logs: watch('logs') || []
                };
                setInitialFormState(savedState);
                setInitialCode(codeToSave)
                setHasUnsavedChanges(false)
                
                toast({
                    title: "Success",
                    description: "Page updated successfully",
                })
            }
        } catch (error) {
            console.error('Update error:', error)
            toast({
                variant: "destructive",
                title: "Error",
                description: `Failed to ${isNewPage ? 'create' : 'update'} page. ${error instanceof Error ? error.message : ''}`,
            })
        }
    }

    const handleDelete = async () => {
        try {
            await deletePage(resolvedParams.id)
            toast({
                title: "Success",
                description: "Page deleted successfully",
            })
            router.push('/protected')
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete page",
            })
        }
    }

    const handleRunCode = async () => {
        const codeToRun = getFullCodeForRunning() // Use combined code for running
        if (!codeToRun) return

        setIsRunning(true)
        setOutput('Running...')
        setConsoleOutput('Running...')
        setReturnValue('Running...')

        const currentFormData = {
            title: watch('title'),
            description: watch('description'),
            code: getActualCodeForSaving(), // Use actual code without predefined vars for saving
            endpoint: watch('endpoint'),
            method: watch('method'),
            created_at: watch('created_at'),
            preDefinedVariables: watch('preDefinedVariables'),
            logs: watch('logs') || []
        }

        try {
            // First save the changes if not a new page
            if (!isNewPage) {
                await updatePage(resolvedParams.id, currentFormData)
            }

            // Then run the code
            const method = watch('method')
            const requestConfig: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                }
            }

            // Only add body for POST requests
            if (method === 'POST') {
                try {
                    const parsedBody = JSON.parse(postBody)
                    requestConfig.body = JSON.stringify({
                        data: parsedBody
                    })
                } catch (e) {
                    const errorOutput = 'Error: Invalid JSON in request body'
                    setOutput(errorOutput)
                    setConsoleOutput(JSON.stringify(consoleOutput, null, 2))
                    setReturnValue('')
                    setIsRunning(false)
                    return
                }
            }

            const response = await fetch(`/api${watch('endpoint')}?preDefinedVariables=${watch('preDefinedVariables')}`, requestConfig)
            const data = await response.json()

            let outputText = ''
            let consoleText = ''
            let returnValueText = ''

            if (data.error) {
                const errorMessage = data.error
                const lineNumber = data.lineNumber
                outputText = lineNumber ? `Error at line ${lineNumber}: ${errorMessage}` : errorMessage
                consoleText = errorMessage || ''
                returnValueText = ''
            } else {
                outputText = data.output !== undefined ? JSON.stringify(data.output, null, 2) : 'No return value'
                consoleText = data.logs || ''
                returnValueText = data.output !== undefined ? JSON.stringify(data.output, null, 2) : 'No return value'
            }

            setOutput(outputText)
            setConsoleOutput(consoleText)
            setReturnValue(returnValueText)

            // Refresh the page to get updated logs
            if (!isNewPage) {
                fetchPage()
            }

        } catch (error) {
            const errorOutput = `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
            setOutput(errorOutput)
            setConsoleOutput(JSON.stringify(consoleOutput, null, 2))
            setReturnValue('')
        } finally {
            setIsRunning(false)
        }
    }

    const handleEditorValidation = (markers: any[]) => {
        const errors = markers
            .filter(marker => marker.severity === 8) // Error severity
            .map(marker => `Line ${marker.startLineNumber}: ${marker.message}`);
        setEditorErrors(errors);
    };

    const handlePreDefinedVarSuccess = async () => {
        // Refresh the predefined variables list
        try {
            const vars = await getPreDefinedVariables()
            setPreDefinedVariables(vars)
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to refresh pre-defined variables",
            })
        }
    }

    if (isLoading) {
        return <SkeletonPage />
    }

    return (
        <div className="min-h-screen bg-background w-full">
            <AlertDialog open={showUnsavedAlert} onOpenChange={setShowUnsavedAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                        <AlertDialogDescription>
                            You have unsaved changes. Would you like to save before leaving?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowUnsavedAlert(false)}>
                            Continue Editing
                        </AlertDialogCancel>
                        <Button
                            variant="outline"
                            onClick={() => handleNavigationConfirm(false)}
                        >
                            Discard Changes
                        </Button>
                        <Button
                            onClick={() => handleNavigationConfirm(true)}
                        >
                            Save & Leave
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Header */}
            <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="w-full px-6 flex h-14 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleNavigation('back')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-xl font-semibold">
                            {isNewPage ? 'Create New Page' : 'Edit Page'}
                            {hasUnsavedChanges && <span className="ml-2 text-sm text-muted-foreground">(Unsaved changes)</span>}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigation('cancel')}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleFormSubmit(onSubmit)}
                            variant="default"
                        >
                            {isNewPage ? 'Create' : 'Save Changes'}
                        </Button>
                        {!isNewPage && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Page?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete the
                                            page and remove all its data from the server.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleDelete}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full px-6 py-6 space-y-6">
                {/* Form and Code Editor Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Left Column - Form */}
                    <div className="space-y-6">
                        <div className="rounded-lg border bg-card">
                            <div className="p-6 space-y-6">
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
                                        {watch('method') === 'POST' && (
                                            <p className="text-sm text-muted-foreground">You can access body variables using data and a dot notation. <br />
                                                <br />
                                                Example: <br />
                                                <br />
                                                data.name <br />
                                                data.age <br />
                                            </p>
                                        )}
                                        <Select
                                            value={watch('method')}
                                            onValueChange={(value) => setValue('method', value as 'GET' | 'POST')}
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
                                    {watch('method') === 'POST' && (
                                        <div className="flex-1 max-w-[300px]">
                                            <Textarea
                                                value={postBody}
                                                onChange={(e) => setPostBody(e.target.value)}
                                                placeholder="Enter JSON request body"
                                                className="h-[200px] font-mono text-sm"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Code Editor */}
                    <div>
                        <div className="rounded-lg border bg-card h-[60vh]">
                            <div className="flex items-center justify-between border-b px-3 py-2">
                                <h3 className="font-semibold">Code Editor</h3>
                                <Button
                                    onClick={handleRunCode}
                                    disabled={isRunning}
                                    size="sm"
                                    variant="default"
                                    className="gap-2"
                                >
                                    <Play className="h-4 w-4" />
                                    {isRunning ? 'Running...' : 'Run Code'}
                                </Button>
                            </div>
                            <div className={cn(
                                "h-[calc(60vh-8rem)]",
                                errors.code && "border-destructive"
                            )}>
                                {selectedVarCode && (
                                    <div className="p-2 bg-muted/50 border-b">
                                        <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {selectedVarCode}
                                        </pre>
                                    </div>
                                )}
                                <Editor
                                    height="100%"
                                    defaultLanguage="javascript"
                                    theme={`vs-${theme}`}
                                    value={userCode}
                                    onChange={handleCodeChange}
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
                                    onValidate={handleEditorValidation}
                                    keepCurrentModel={true}
                                />
                            </div>
                            {errors.code && (
                                <p className="text-sm text-destructive p-2 border-t border-destructive/50">{errors.code.message}</p>
                            )}
                            {editorErrors.length > 0 && (
                                <div className="p-2 border border-destructive rounded-b-lg bg-destructive/10">
                                    <div className="text-sm p-2 space-y-1">
                                        <p className="font-medium">Validation Errors:</p>
                                        {editorErrors.map((error, index) => (
                                            <p key={index}>{error}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {output && output.includes('Error:') && (
                                <p className="text-sm p-2">{output}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Full Width Tabs Section */}
                <div className="rounded-lg border bg-card h-[1000px]">
                    <Tabs defaultValue="return" className="w-full h-full">
                        <div className="flex items-center justify-between border-b px-3 py-2">
                            <TabsList className="h-12 bg-transparent">
                                <TabsTrigger value="return" className="">
                                    Return Value
                                </TabsTrigger>
                                <TabsTrigger value="console" className="">
                                    Console Output
                                </TabsTrigger>
                                <TabsTrigger value="logs" className="">
                                    Logs
                                </TabsTrigger>
                                <TabsTrigger value="variables" className="">
                                    Pre-defined Variables
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="return" className="p-0 ">
                            <div className="font-mono text-sm  overflow-auto p-4">
                                <pre className="whitespace-pre-wrap">
                                    {returnValue}
                                </pre>
                            </div>
                        </TabsContent>

                        <TabsContent value="console" className="p-0">
                            <div className="bg-muted/50 font-mono text-sm  overflow-auto p-4">
                                <pre className="whitespace-pre-wrap">
                                    {consoleOutput}
                                </pre>
                            </div>
                        </TabsContent>

                        <TabsContent value="logs" className="p-4">
                            <div className="h-full">
                                <LogsViewer 
                                    logs={watch('logs') || []} 
                                    pageId={resolvedParams.id}
                                    onLogsCleared={() => {
                                        setValue('logs', [], { shouldDirty: true })
                                        fetchPage()
                                    }}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="variables" className="p-4">
                            <div className="h-[calc(40vh-8rem)] overflow-auto">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="usePreDefinedVars"
                                                checked={watch('preDefinedVariables') !== null}
                                                onCheckedChange={(checked) => {
                                                    if (!checked) {
                                                        setValue('preDefinedVariables', null, { shouldDirty: true });
                                                    } else if (preDefinedVariables.length > 0) {
                                                        setValue('preDefinedVariables', Number(preDefinedVariables[0].id), { shouldDirty: true });
                                                    }
                                                }}
                                            />
                                            <Label htmlFor="usePreDefinedVars">Use Pre-defined Variables</Label>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedPreDefinedVar(undefined)
                                                setShowPreDefinedVarDialog(true)
                                            }}
                                        >
                                            Add New Variable
                                        </Button>
                                    </div>
                                    {watch('preDefinedVariables') !== null && (
                                        <Command className="border rounded-md">
                                            <CommandInput placeholder="Search pre-defined variables..." />
                                            <CommandList>
                                                <CommandEmpty>No results found.</CommandEmpty>
                                                <CommandGroup>
                                                    {preDefinedVariables.map((variable) => (
                                                        <CommandItem
                                                            key={variable.id}
                                                            onSelect={() => {
                                                                setValue('preDefinedVariables', Number(variable.id), { shouldDirty: true });
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
                                                                    e.stopPropagation();
                                                                    setSelectedPreDefinedVar({
                                                                        ...variable,
                                                                        vars: variable.vars || '',
                                                                        created_at: variable.created_at || new Date().toISOString()
                                                                    });
                                                                    setShowPreDefinedVarDialog(true);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                            {watch('preDefinedVariables') === Number(variable.id) && (
                                                                <Check className="ml-auto h-4 w-4" />
                                                            )}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <PreDefinedVariableDialog
                open={showPreDefinedVarDialog}
                onOpenChange={setShowPreDefinedVarDialog}
                preDefinedVariable={selectedPreDefinedVar}
                onSuccess={handlePreDefinedVarSuccess}
            />
        </div>
    )
}

