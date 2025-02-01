'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, Copy } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface PostEndpointDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    endpoint: string
    title: string
    postBody: string
}

export function PostEndpointDialog({
    open,
    onOpenChange,
    endpoint,
    title,
    postBody
}: PostEndpointDialogProps) {
    const { toast } = useToast()
    const [url, setUrl] = useState<string>(`${window.location.origin}/api${endpoint}`)
    const getEndpointUrl = () => {
        const baseUrl = `${window.location.origin}/api${endpoint}`
        return baseUrl
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>POST Endpoint Options</DialogTitle>
                    <DialogDescription>
                        Choose how you want to interact with this POST endpoint
                    </DialogDescription>
                    <DialogDescription>
                        API Endpoint : {url}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <Button
                        onClick={() => {
                            const url = getEndpointUrl()
                            try {
                                // Parse and re-stringify to ensure valid JSON
                                const parsedBody = JSON.parse(postBody)
                                const formattedBody = JSON.stringify({ data: parsedBody })

                                // Create Postman collection data
                                const postmanData = {
                                    info: {
                                        name: title || 'API Request',
                                        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
                                    },
                                    item: [{
                                        name: title || 'API Request',
                                        request: {
                                            method: 'POST',
                                            header: [
                                                {
                                                    key: 'Content-Type',
                                                    value: 'application/json'
                                                }
                                            ],
                                            url: {
                                                raw: url,
                                                protocol: window.location.protocol.replace(':', ''),
                                                host: window.location.host.split('.'),
                                                path: url.replace(/^https?:\/\/[^\/]+/, '').split('/')
                                            },
                                            body: {
                                                mode: 'raw',
                                                raw: formattedBody,
                                                options: {
                                                    raw: {
                                                        language: 'json'
                                                    }
                                                }
                                            }
                                        }
                                    }]
                                }

                                // Create Postman URL with the correct format
                                const postmanUrl = `https://go.postman.co/import?input=${encodeURIComponent(JSON.stringify(postmanData))}`
                                window.open(postmanUrl, '_blank')
                                onOpenChange(false)
                            } catch (error) {
                                toast({
                                    variant: "destructive",
                                    title: "Invalid JSON",
                                    description: "Please enter valid JSON in the request body",
                                })
                            }
                        }}
                        className="gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Test in Postman
                    </Button>

                    <Button
                        onClick={() => {
                            const url = getEndpointUrl()
                            navigator.clipboard.writeText(url)
                            toast({
                                title: "Success",
                                description: "API URL copied to clipboard",
                            })
                            onOpenChange(false)
                        }}
                        variant="outline"
                        className="gap-2"
                    >
                        <Copy className="h-4 w-4" />
                        Copy API URL
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
} 