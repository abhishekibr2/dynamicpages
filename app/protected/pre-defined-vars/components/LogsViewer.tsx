import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Trash2, RefreshCcw, ChevronRight } from "lucide-react"
import { clearLogs } from "@/utils/supabase/actions/page"
import { useToast } from "@/hooks/use-toast"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface Log {
    timestamp: string;
    output: string;
    console: string;
    returnValue: string;
    request: string;
    success: boolean;
}

interface LogsViewerProps {
    logs: Log[];
    pageId: string;
    onLogsCleared: () => void;
    onRefresh: () => void;
}

export function LogsViewer({ logs, pageId, onLogsCleared, onRefresh }: LogsViewerProps) {
    const { toast } = useToast()
    const [selectedLog, setSelectedLog] = useState<Log | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const formatJSON = (data: any): string => {
        try {
            // If data is already a string, try to parse it first
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            return JSON.stringify(parsed, null, 2);
        } catch (error) {
            // If parsing fails, return the original data as is
            return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        }
    }

    const handleClearLogs = async () => {
        try {
            await clearLogs(pageId)
            onLogsCleared()
            toast({
                title: "Success",
                description: "Logs cleared successfully",
            })
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to clear logs",
            })
        }
    }

    const handleRefresh = async () => {
        setIsRefreshing(true)
        try {
            await onRefresh()
        } finally {
            setIsRefreshing(false)
        }
    }

    const formatDate = (timestamp: string) => {
        return new Date(timestamp).toLocaleString()
    }

    const LogsSkeleton = () => (
        <TableRow>
            <TableCell>
                <Skeleton className="h-4 w-[160px]" />
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-[60px]" />
                </div>
            </TableCell>
            <TableCell className="text-right">
                <Skeleton className="h-8 w-8 ml-auto" />
            </TableCell>
        </TableRow>
    )

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 py-4">
                <h2 className="text-xl font-semibold tracking-tight">Execution History</h2>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="gap-2 hover:shadow-sm transition-all"
                    >
                        <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleClearLogs}
                        disabled={isRefreshing}
                        className="gap-2 hover:shadow-sm transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear Logs
                    </Button>
                </div>
            </div>

            <ScrollArea className="h-[calc(100%-4rem)] rounded-lg border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[180px] font-semibold">Timestamp</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="w-[100px] font-semibold text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isRefreshing ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <LogsSkeleton key={index} />
                            ))
                        ) : logs.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="h-[200px] text-center text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <p>No logs available</p>
                                        <p className="text-sm text-muted-foreground">
                                            Execute your code to see the results here
                                        </p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.slice().reverse().map((log, index) => (
                                <TableRow
                                    key={index}
                                    className="hover:bg-muted/50 cursor-pointer"
                                    onClick={() => setSelectedLog(log)}
                                >
                                    <TableCell className="font-mono text-sm">
                                        {formatDate(log.timestamp)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-destructive'}`} />
                                            <span className="text-sm">
                                                {log.success ? 'Success' : 'Failed'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedLog(log)
                                            }}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>

            <Dialog open={selectedLog !== null} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Log Details - {selectedLog && formatDate(selectedLog.timestamp)}</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-medium mb-2">Request</h3>
                                <div className="rounded-md bg-muted/50 p-4">
                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                        {formatJSON(selectedLog.request)}
                                    </pre>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium mb-2">Output</h3>
                                <div className="rounded-md bg-muted/50 p-4">
                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                        {formatJSON(selectedLog.output)}
                                    </pre>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium mb-2">Console Output</h3>
                                <div className="rounded-md bg-muted/50 p-4">
                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                        {formatJSON(selectedLog.console)}
                                    </pre>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium mb-2">Return Value</h3>
                                <div className="rounded-md bg-muted/50 p-4">
                                    <pre className="text-sm whitespace-pre-wrap font-mono">
                                        {formatJSON(selectedLog.returnValue)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
} 