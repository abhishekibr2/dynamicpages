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
    preDefinedVariables: z.number().nullable()
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
            preDefinedVariables: null
        }
    })
    const [userCode, setUserCode] = useState<string>('')

    // Track unsaved changes including code editor
    useEffect(() => {
        const currentCode = watch('code')
        const hasCodeChanges = currentCode !== initialCode
        setHasUnsavedChanges(isDirty || hasCodeChanges)
    }, [isDirty, watch('code'), initialCode])

    // Add keyboard shortcut handler
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            const currentTime = Date.now()
            const newLastKey = e.key.toLowerCase()

            if (newLastKey === 's') {
                const timeDiff = currentTime - lastKeyPressTime
                if (lastKeyPress === 's' && timeDiff <= 500) {
                    handleNavigation('back')
                    setLastKeyPress('')
                    setLastKeyPressTime(0)
                } else {
                    setLastKeyPress('s')
                    setLastKeyPressTime(currentTime)
                }
            } else {
                setLastKeyPress('')
                setLastKeyPressTime(0)
            }
        }

        window.addEventListener('keypress', handleKeyPress)
        return () => window.removeEventListener('keypress', handleKeyPress)
    }, [lastKeyPress, lastKeyPressTime])

    // Effect to fetch and update selected predefined variable's code
    useEffect(() => {
        const fetchSelectedVarCode = async () => {
            const selectedVarId = watch('preDefinedVariables')
            if (selectedVarId !== null) {
                const selectedVar = preDefinedVariables.find(v => Number(v.id) === selectedVarId)
                if (selectedVar && selectedVar.vars) {
                    const varsCode = selectedVar.vars.join('\n')
                    setSelectedVarCode(varsCode)
                    
                    // Get the current code without any previous predefined vars
                    const currentCode = userCode
                    const previousVarsCode = selectedVarCode
                    let cleanCode = currentCode
                    if (previousVarsCode) {
                        cleanCode = currentCode.replace(previousVarsCode, '').trim()
                        // Remove extra newlines at the start
                        cleanCode = cleanCode.replace(/^\n+/, '')
                    }
                    
                    // Add the new vars at the top
                    const newCode = varsCode + (cleanCode ? '\n\n' + cleanCode : '')
                    setUserCode(newCode)
                    setValue('code', newCode, { shouldDirty: true })
                }
            } else {
                // If no variables selected, remove the previous vars
                const previousVarsCode = selectedVarCode
                if (previousVarsCode && userCode.includes(previousVarsCode)) {
                    const cleanCode = userCode.replace(previousVarsCode, '').trim()
                    setUserCode(cleanCode)
                    setValue('code', cleanCode, { shouldDirty: true })
                }
                setSelectedVarCode('')
            }
        }
        fetchSelectedVarCode()
    }, [watch('preDefinedVariables')])

    const handleCodeChange = (value: string | undefined) => {
        const newValue = value || ''
        setUserCode(newValue)
        setValue('code', newValue, { shouldDirty: true })
    }

    // Function to get the full code
    const getFullCode = () => {
        return userCode
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
            // First set the existing code
            const existingCode = data.code || ''
            setUserCode(existingCode)
            setValue('code', existingCode)
            
            // Set form values
            Object.entries(data).forEach(([key, value]) => {
                if (key === 'preDefinedVariables') {
                    setValue(key, value ? Number(value) : null)
                    // If there are predefined variables, add them at the top
                    if (value) {
                        const selectedVar = preDefinedVariables.find(v => Number(v.id) === Number(value))
                        if (selectedVar && selectedVar.vars) {
                            const varsCode = selectedVar.vars.join('\n')
                            setSelectedVarCode(varsCode)
                            // Only add vars if they're not already present
                            if (!existingCode.includes(varsCode)) {
                                const newCode = varsCode + (existingCode ? '\n\n' + existingCode : '')
                                setUserCode(newCode)
                                setValue('code', newCode)
                            }
                        }
                    }
                } else if (key !== 'code') { // Skip code as we handled it above
                    setValue(key as keyof PageFormData, value as string)
                }
            })
            setInitialCode(data.code || '')
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
            if (isNewPage) {
                const { id, ...newPageData } = data
                const result = await createPage({
                    ...newPageData,
                    preDefinedVariables: newPageData.preDefinedVariables ? Number(newPageData.preDefinedVariables) : null
                })
                const newPageId = result[0].id
                router.replace(`/protected/page/${newPageId}`)
                setInitialCode(data.code)
                reset(data)
                setHasUnsavedChanges(false)
                toast({
                    title: "Success",
                    description: "Page created successfully",
                })
            } else {
                const { id, created_at, ...updateData } = data
                await updatePage(resolvedParams.id, {
                    ...updateData,
                    preDefinedVariables: updateData.preDefinedVariables ? Number(updateData.preDefinedVariables) : null
                })
                setInitialCode(data.code)
                reset(data)
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
        const code = watch('code')
        if (!code) return

        setIsRunning(true)
        setOutput('Running...')
        setConsoleOutput('Running...')
        setReturnValue('Running...')

        try {
            // First save the changes
            const formData = {
                title: watch('title'),
                description: watch('description'),
                code: watch('code'),
                endpoint: watch('endpoint'),
                method: watch('method'),
                created_at: watch('created_at'),
                preDefinedVariables: watch('preDefinedVariables')
            }

            if (!isNewPage) {
                await updatePage(resolvedParams.id, formData)
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
                        code,
                        data: parsedBody
                    })
                } catch (e) {
                    setOutput('Error: Invalid JSON in request body')
                    setConsoleOutput('')
                    setReturnValue('')
                    setIsRunning(false)
                    return
                }
            }

            const response = await fetch(`/api${watch('endpoint')}`, requestConfig)
            const data = await response.json()

            if (data.error) {
                const errorMessage = data.error
                const lineNumber = data.lineNumber
                setOutput(lineNumber ? `Error at line ${lineNumber}: ${errorMessage}` : errorMessage)
                setConsoleOutput(errorMessage || '')
                setReturnValue('')
            } else {
                setOutput(data.output !== undefined ? JSON.stringify(data.output, null, 2) : 'No return value')
                setConsoleOutput(data.logs || '')
                setReturnValue(data.output !== undefined ? JSON.stringify(data.output, null, 2) : 'No return value')
            }
        } catch (error) {
            setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
            setConsoleOutput('')
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
            <div className="w-full px-6 py-6">
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
                        </div>
                    </div>

                    {/* Right Column - Tabs with Code Editor, Return Value, and Console Output */}
                    <div className="rounded-lg border bg-card">
                        <Tabs defaultValue="code" className="w-full">
                            <div className="flex items-center justify-between border-b px-3 py-2">
                                <TabsList className="h-12 bg-transparent">
                                    <TabsTrigger value="code" className="">
                                        Code Editor
                                    </TabsTrigger>
                                    <TabsTrigger value="return" className="">
                                        Return Value
                                    </TabsTrigger>
                                    <TabsTrigger value="console" className="">
                                        Console Output
                                    </TabsTrigger>
                                </TabsList>
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

                            <TabsContent value="code" className="p-0">
                                <div className={cn(
                                    "h-[calc(100vh-16rem)]",
                                    errors.code && "border-destructive"
                                )}>
                                    <Editor
                                        height="100%"
                                        defaultLanguage="javascript"
                                        theme={`vs-${theme}`}
                                        value={getFullCode()}
                                        onChange={handleCodeChange}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            lineNumbers: 'on',
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            padding: { top: 16, bottom: 16 },
                                        }}
                                        onValidate={handleEditorValidation}
                                    />
                                </div>
                                {errors.code && (
                                    <p className="text-sm p-2">{errors.code.message}</p>
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
                            </TabsContent>

                            <TabsContent value="return" className="p-0">
                                <div className="font-mono text-sm h-[calc(100vh-16rem)] overflow-auto p-4">
                                    <pre className="whitespace-pre-wrap">
                                        {returnValue}
                                    </pre>
                                </div>
                            </TabsContent>

                            <TabsContent value="console" className="p-0">
                                <div className="bg-muted/50 font-mono text-sm h-[calc(100vh-16rem)] overflow-auto p-4">
                                    <pre className="whitespace-pre-wrap">
                                        {consoleOutput}
                                    </pre>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
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

