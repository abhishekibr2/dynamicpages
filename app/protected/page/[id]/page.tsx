'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Page } from "@/types/Page"
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
    id: z.string().optional()
})

type PageFormData = z.infer<typeof pageSchema>

export default function PageEditor({ params }: PageEditorProps) {
    const resolvedParams = use(params)
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()
    const router = useRouter()
    const isNewPage = resolvedParams.id === 'new'
    const [output, setOutput] = useState<string>('')
    const [isRunning, setIsRunning] = useState(false)

    const {
        register,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        setValue,
        watch
    } = useForm<PageFormData>({
        resolver: zodResolver(pageSchema),
        defaultValues: {
            title: '',
            description: '',
            code: '',
            endpoint: '',
            method: 'GET',
            created_at: new Date().toISOString()
        }
    })

    useEffect(() => {
        if (!isNewPage) {
            fetchPage()
        } else {
            setIsLoading(false)
        }
    }, [resolvedParams.id])

    const fetchPage = async () => {
        try {
            const data = await getPage(resolvedParams.id)
            // Set form values
            Object.entries(data).forEach(([key, value]) => {
                setValue(key as keyof PageFormData, value as string)
            })
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

    const onSubmit = async (data: PageFormData) => {
        try {
            if (isNewPage) {
                const { id, ...newPageData } = data
                await createPage(newPageData)
                toast({
                    title: "Success",
                    description: "Page created successfully",
                })
            } else {
                // Remove id and created_at from update data
                const { id, created_at, ...updateData } = data
                console.log('Updating page with data:', updateData)
                const result = await updatePage(resolvedParams.id, updateData)
                console.log('Update result:', result)
                toast({
                    title: "Success",
                    description: "Page updated successfully",
                })
            }
            router.push('/protected')
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

        try {
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            })

            const data = await response.json()

            if (data.error) {
                setOutput(data.error)
            } else {
                setOutput(data.output)
            }
        } catch (error) {
            setOutput(`Error: ${error}`)
        } finally {
            setIsRunning(false)
        }
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center">
                    <Button
                        variant="ghost"
                        className="gap-2"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container py-6 space-y-8">
                {/* Title Bar */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight">
                        {isNewPage ? 'Create New Page' : 'Edit Page'}
                    </h1>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/protected')}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        {!isNewPage && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="px-6">Delete</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="sm:max-w-[425px]">
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
                        <Button onClick={handleFormSubmit(onSubmit)} className="px-6">
                            {isNewPage ? 'Create' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left Column - Form */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-sm font-medium">Title</Label>
                                    <Input
                                        id="title"
                                        {...register('title')}
                                        className={cn(
                                            "w-full",
                                            errors.title && "border-destructive focus-visible:ring-destructive"
                                        )}
                                    />
                                    {errors.title && (
                                        <p className="text-sm text-destructive">{errors.title.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                    <Textarea
                                        id="description"
                                        {...register('description')}
                                        className={cn(
                                            "min-h-[100px] resize-none",
                                            errors.description && "border-destructive focus-visible:ring-destructive"
                                        )}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="endpoint" className="text-sm font-medium">Endpoint</Label>
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
                                        <Label htmlFor="method" className="text-sm font-medium">Method</Label>
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
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Code Editor and Output */}
                    <div className="space-y-6">
                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="p-4 border-b flex justify-between items-center">
                                <Label className="text-sm font-medium">Code Editor</Label>
                                <Button
                                    onClick={handleRunCode}
                                    disabled={isRunning}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Play className="h-4 w-4" />
                                    {isRunning ? 'Running...' : 'Run Code'}
                                </Button>
                            </div>
                            <div className={cn(
                                "h-[400px]",
                                errors.code && "border-destructive"
                            )}>
                                <Editor
                                    height="100%"
                                    defaultLanguage="javascript"
                                    theme="vs-dark"
                                    value={watch('code')}
                                    onChange={(value) => setValue('code', value || '')}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        padding: { top: 16, bottom: 16 },
                                    }}
                                />
                            </div>
                            {errors.code && (
                                <p className="text-sm text-destructive p-2">{errors.code.message}</p>
                            )}
                        </div>

                        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="p-4 border-b">
                                <Label className="text-sm font-medium">Output</Label>
                            </div>
                            <div className="p-4 bg-muted/50 font-mono text-sm h-[300px] overflow-auto rounded-b-lg">
                                <pre className="whitespace-pre-wrap">
                                    {output.split('\n').map((line, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "py-0.5",
                                                line.startsWith('>') && "text-destructive bg-destructive/10"
                                            )}
                                        >
                                            {line}
                                        </div>
                                    ))}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
