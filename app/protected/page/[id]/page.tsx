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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

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
    const [consoleOutput, setConsoleOutput] = useState<string>('')
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
        setConsoleOutput('Running...')

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
                setConsoleOutput('')
            } else {
                setOutput(data.output)
                setConsoleOutput(data.consoleOutput)
            }
        } catch (error) {
            setOutput(`Error: ${error}`)
            setConsoleOutput('')
        } finally {
            setIsRunning(false)
        }
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    return (
        <div className="min-h-screen bg-background w-full">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="w-full px-6 flex h-14 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <h1 className="text-xl font-semibold">
                            {isNewPage ? 'Create New Page' : 'Edit Page'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/protected">
                            Cancel
                        </Link>
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
                        <Button size="sm" onClick={handleFormSubmit(onSubmit)}>
                            {isNewPage ? 'Create' : 'Save Changes'}
                        </Button>
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

                        {/* Output Sections */}
                        <div className="rounded-lg border">
                            <Tabs defaultValue="execution" className="w-full ">
                                <div className="flex items-center justify-between border-b px-3 py-2">
                                    <TabsList className="h-12 bg-transparent">
                                        <TabsTrigger value="execution" className="">
                                            Execution Output
                                        </TabsTrigger>
                                        <TabsTrigger value="console" className="">
                                            Console Output
                                        </TabsTrigger>
                                    </TabsList>
                                </div>
                                <TabsContent value="execution" className="p-0">
                                    <div className=" font-mono text-sm h-[300px] overflow-auto p-4">
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
                                </TabsContent>
                                <TabsContent value="console" className="p-0">
                                    <div className="bg-muted/50 font-mono text-sm h-[300px] overflow-auto p-4">
                                        <pre className="whitespace-pre-wrap">
                                            {consoleOutput.split('\n').map((line, i) => (
                                                <div key={i} className="py-0.5">
                                                    {line}
                                                </div>
                                            ))}
                                        </pre>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Right Column - Code Editor */}
                    <div className="rounded-lg border bg-card">
                        <div className="p-4 border-b flex justify-between items-center">
                            <Label className="text-sm font-medium">Code Editor</Label>
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleRunCode}
                                    disabled={isRunning}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Play className="h-4 w-4" />
                                    {isRunning ? 'Running...' : 'Run Code'}
                                </Button>
                                {watch('method') === 'GET' && (
                                    <Button
                                        onClick={() => window.open(`/api${watch('endpoint')}`, '_blank')}
                                        disabled={isRunning}
                                        size="sm"
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        Test API
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className={cn(
                            "h-[calc(100vh-16rem)]",
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
                </div>
            </div>
        </div>
    )
}
