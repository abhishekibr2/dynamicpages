'use client'

import { useToast } from "@/hooks/use-toast"
import { getPage, updatePage, deletePage, createPage } from "@/utils/supabase/actions/page"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { use } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getPreDefinedVariables } from "@/utils/supabase/actions/preDefinedVars"
import { PreDefinedVariableDialog } from "../../components/PreDefinedVariablesDialog"
import { PreDefinedVariable } from "@/types/PreDefinedVariable"
import { getToolbox, updateToolbox } from "@/utils/supabase/actions/toolTip"
import { Toolbox } from "@/types/Toolbox"
import SkeletonPage from "@/components/skeleton-page"
import { pageSchema, PageFormData } from "../types"
import { PageHeader } from "../components/PageHeader"
import { PageInfoDialog } from "../components/PageInfoDialog"
import { CodeEditorSection } from "../components/CodeEditorSection"
import { OutputSection } from "../components/OutputSection"
import { PostEndpointDialog } from "../components/PostEndpointDialog"
import { GeneratedCodeDialog } from "../components/GeneratedCodeDialog"

interface PageEditorProps {
    params: Promise<{
        id: string
    }>
}

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
    const [activeTab, setActiveTab] = useState('return')
    const [postBody, setPostBody] = useState<string>('{\n  \n}')
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState<'back' | 'cancel' | null>(null)
    const [initialCode, setInitialCode] = useState<string>('')
    const [editorErrors, setEditorErrors] = useState<string[]>([])
    const [preDefinedVariables, setPreDefinedVariables] = useState<PreDefinedVariable[]>([])
    const [showPreDefinedVarDialog, setShowPreDefinedVarDialog] = useState(false)
    const [selectedPreDefinedVar, setSelectedPreDefinedVar] = useState<PreDefinedVariable | undefined>(undefined)
    const [selectedVarCode, setSelectedVarCode] = useState<string>('')
    const [toolbox, setToolbox] = useState<Toolbox>({ description: '' })
    const [showPageInfoDialog, setShowPageInfoDialog] = useState(false)
    const [showPostEndpointDialog, setShowPostEndpointDialog] = useState(false)
    const [showGeneratedCodeDialog, setShowGeneratedCodeDialog] = useState(false)
    const [userCode, setUserCode] = useState<string>('')
    const [actualCode, setActualCode] = useState<string>('')
    const [initialFormState, setInitialFormState] = useState<PageFormData | null>(null)


    const {
        register,
        handleSubmit: handleFormSubmit,
        formState: { errors },
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
            test_post_body: null,
            logs: []
        }
    })

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
            test_post_body: watch('method') === 'POST' ? postBody : null,
            created_at: watch('created_at'),
            logs: (watch('logs') || []).map(log => ({
                ...log,
                request: log.request || JSON.stringify({}),
                success: log.success || false
            }))
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
                test_post_body: null,
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

            // Set post body if it exists and method is POST
            if (data.method === 'POST' && data.test_post_body) {
                setPostBody(data.test_post_body)
            }

            // Set form values and track initial state
            const initialState = {
                title: data.title || '',
                description: data.description || '',
                code: existingCode,
                endpoint: data.endpoint || '',
                method: data.method || 'GET',
                created_at: data.created_at || new Date().toISOString(),
                preDefinedVariables: data.preDefinedVariables ? Number(data.preDefinedVariables) : null,
                test_post_body: data.test_post_body,
                logs: (data.logs || []).map((log: any) => ({
                    ...log,
                    request: log.request || JSON.stringify({}),
                    success: log.success || false
                }))
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

    const onSubmit = async (data: PageFormData) => {
        try {
            // Use actual code without predefined variables for saving
            const codeToSave = actualCode

            if (isNewPage) {
                const { id, ...newPageData } = data
                const result = await createPage({
                    ...newPageData,
                    code: codeToSave,
                    preDefinedVariables: newPageData.preDefinedVariables ? Number(newPageData.preDefinedVariables) : null,
                    test_post_body: watch('method') === 'POST' ? postBody : null,
                    logs: (newPageData.logs || []).map(log => ({
                        ...log,
                        request: log.request || JSON.stringify({}),
                        success: log.success || false
                    })),
                })
                const newPageId = result[0].id
                router.replace(`/protected/page/${newPageId}`)

                // Update initial state after successful save
                const savedState = {
                    ...newPageData,
                    code: codeToSave,
                    preDefinedVariables: newPageData.preDefinedVariables ? Number(newPageData.preDefinedVariables) : null,
                    test_post_body: watch('method') === 'POST' ? postBody : null,
                    logs: (newPageData.logs || []).map(log => ({
                        ...log,
                        request: log.request || JSON.stringify({}),
                        success: log.success || false
                    }))
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
                    test_post_body: watch('method') === 'POST' ? postBody : null,
                    logs: (watch('logs') || []).map(log => ({
                        ...log,
                        request: log.request || JSON.stringify({}),
                        success: log.success || false
                    }))
                })

                // Update initial state after successful save
                const savedState = {
                    ...updateData,
                    code: codeToSave,
                    created_at: created_at,
                    preDefinedVariables: updateData.preDefinedVariables ? Number(updateData.preDefinedVariables) : null,
                    test_post_body: watch('method') === 'POST' ? postBody : null,
                    logs: (watch('logs') || []).map(log => ({
                        ...log,
                        request: log.request || JSON.stringify({}),
                        success: log.success || false
                    }))
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
        const codeToRun = getFullCodeForRunning()
        if (!codeToRun) return

        setIsRunning(true)
        setOutput('Running...')
        setConsoleOutput('Running...')
        setReturnValue('Running...')
        setActiveTab('return') // Switch to output tab

        const currentFormData = {
            title: watch('title'),
            description: watch('description'),
            code: actualCode, // Use actual code without predefined vars for saving
            endpoint: watch('endpoint'),
            method: watch('method'),
            created_at: watch('created_at'),
            preDefinedVariables: watch('preDefinedVariables'),
            logs: (watch('logs') || []).map(log => ({
                ...log,
                request: log.request || JSON.stringify({}),
                success: log.success || false
            }))
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
                    requestConfig.body = JSON.stringify(parsedBody)
                } catch (e) {
                    const errorOutput = 'Error: Invalid JSON in request body'
                    setOutput(errorOutput)
                    setConsoleOutput(JSON.stringify(consoleOutput, null, 2))
                    setReturnValue('')
                    setIsRunning(false)
                    return
                }
            }

            const response = await fetch(`/api${watch('endpoint')}?preDefinedVariables=${watch('preDefinedVariables')}&logs=true`, requestConfig)
            const data = await response.json()

            let outputText = ''
            let consoleText = ''
            let returnValueText = ''

            if (data.status === "error") {
                const errorMessage = data.message
                const lineNumber = data.data?.lineNumber
                outputText = lineNumber ? `Error at line ${lineNumber}: ${errorMessage}` : errorMessage
                consoleText = data.data?.logs || ''
                returnValueText = ''
            } else {
                outputText = data.data.output !== undefined ? JSON.stringify(data.data.output, null, 2) : 'No return value'
                consoleText = data.data.logs || ''
                returnValueText = data.data.output !== undefined ? JSON.stringify(data.data.output, null, 2) : 'No return value'
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

    const handleToolboxUpdate = async (description: string) => {
        try {
            const updatedToolbox = await updateToolbox({ description })
            setToolbox(updatedToolbox)
            toast({
                title: "Success",
                description: "Toolbox description updated successfully",
            })
        } catch (error) {
            console.error('Error updating toolbox:', error)
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update toolbox description",
            })
        }
    }

    useEffect(() => {
        const fetchToolbox = async () => {
            try {
                const toolboxData = await getToolbox()
                setToolbox(toolboxData)
            } catch (error) {
                console.error('Error fetching toolbox:', error)
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to fetch toolbox description",
                })
            }
        }
        fetchToolbox()
    }, [])

    const getGeneratedCode = () => {
        const method = watch('method')
        const endpoint = watch('endpoint')
        const code = `const fetch = require('node-fetch');

const query_data = $array_of_fields;  //return query_data;
const jsonObject = JSON.parse(query_data); //return query_json;
if (!Array.isArray(jsonObject.data)) {
    jsonObject = convertToDataIndex(jsonObject); //return r; 
}
// New array to add
const rankingFor = ["linkedin.com", "ibrinfotech.com", "vocal.com"];
// Add the new array to the JSON object
jsonObject["ranking_for"] = rankingFor;

${method === 'POST' ? 'const raw = JSON.stringify(jsonObject);' : ''}
const url = 'https://dynamicpages.vercel.app/api${endpoint}';
const options = {
    method: '${method}',
    headers: {
        'Content-Type': 'application/json'
    },
    ${method === 'POST' ? 'body: raw,' : ''}
};
try {
    const response = await fetch(url, options);
    const text = await response.text();
    const json = JSON.parse(text);
    return json.output; // Return only the "output" field
} catch (error) {
    console.error(error);
    return '';
}

function convertToDataIndex(inputArray) {
    return { data: inputArray };
}`
        return code
    }

    if (isLoading) {
        return <SkeletonPage />
    }

    return (
        <div className="bg-background w-full">
            <PageHeader
                title={watch('title')}
                hasUnsavedChanges={hasUnsavedChanges}
                isNewPage={isNewPage}
                onNavigate={handleNavigation}
                onShowPageInfo={() => setShowPageInfoDialog(true)}
                onShowGeneratedCode={() => setShowGeneratedCodeDialog(true)}
                onDelete={handleDelete}
                onSave={handleFormSubmit(onSubmit)}
                showUnsavedAlert={showUnsavedAlert}
                setShowUnsavedAlert={setShowUnsavedAlert}
                handleNavigationConfirm={handleNavigationConfirm}
            />

            <PageInfoDialog
                showDialog={showPageInfoDialog}
                onOpenChange={setShowPageInfoDialog}
                register={register}
                errors={errors}
                method={watch('method')}
                onMethodChange={(value) => setValue('method', value as 'GET' | 'POST')}
            />

            <GeneratedCodeDialog
                open={showGeneratedCodeDialog}
                onOpenChange={setShowGeneratedCodeDialog}
                code={getGeneratedCode()}
            />

            <div className="w-full h-[calc(100vh-3.5rem)] flex">
                <CodeEditorSection
                    code={userCode}
                    onCodeChange={handleCodeChange}
                    selectedVarCode={selectedVarCode}
                    method={watch('method')}
                    endpoint={watch('endpoint')}
                    isRunning={isRunning}
                    onRun={handleRunCode}
                    editorErrors={editorErrors}
                    toolbox={toolbox}
                    onToolboxUpdate={handleToolboxUpdate}
                    onShowPostEndpoint={() => setShowPostEndpointDialog(true)}
                />

                <OutputSection
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    returnValue={returnValue}
                    consoleOutput={consoleOutput}
                    logs={watch('logs') || []}
                    pageId={resolvedParams.id}
                    onLogsClear={() => setValue('logs', [], { shouldDirty: true })}
                    onRefresh={fetchPage}
                    method={watch('method')}
                    postBody={postBody}
                    onPostBodyChange={(value) => setPostBody(value || '')}
                    preDefinedVariables={preDefinedVariables}
                    selectedPreDefinedVarId={watch('preDefinedVariables')}
                    onPreDefinedVarChange={(id) => setValue('preDefinedVariables', id)}
                    onAddNewVar={() => {
                        setSelectedPreDefinedVar(undefined)
                        setShowPreDefinedVarDialog(true)
                    }}
                    onEditVar={(variable) => {
                        setSelectedPreDefinedVar({
                            ...variable,
                            vars: variable.vars || '',
                            created_at: variable.created_at || new Date().toISOString()
                        })
                        setShowPreDefinedVarDialog(true)
                    }}
                />
            </div>

            <PreDefinedVariableDialog
                open={showPreDefinedVarDialog}
                onOpenChange={setShowPreDefinedVarDialog}
                preDefinedVariable={selectedPreDefinedVar}
                onSuccess={async () => {
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
                }}
            />

            <PostEndpointDialog
                open={showPostEndpointDialog}
                onOpenChange={setShowPostEndpointDialog}
                endpoint={watch('endpoint')}
                title={watch('title')}
                postBody={postBody}
            />
        </div>
    )
}

