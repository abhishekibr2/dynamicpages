'use client'

import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings2, Code2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import Link from "next/link"

interface PageHeaderProps {
    title: string
    hasUnsavedChanges: boolean
    isNewPage: boolean
    onNavigate: (type: 'back' | 'cancel') => void
    onShowPageInfo: () => void
    onShowGeneratedCode: () => void
    onDelete: () => void
    onSave: () => void
    showUnsavedAlert: boolean
    setShowUnsavedAlert: (show: boolean) => void
    handleNavigationConfirm: (shouldSave: boolean) => Promise<void>
}

export function PageHeader({
    title,
    hasUnsavedChanges,
    isNewPage,
    onNavigate,
    onShowPageInfo,
    onShowGeneratedCode,
    onDelete,
    onSave,
    showUnsavedAlert,
    setShowUnsavedAlert,
    handleNavigationConfirm
}: PageHeaderProps) {
    return (
        <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full px-6 flex h-14 items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/protected">
                        <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-muted">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </div>
                    </Link>
                    <h1 className="text-xl font-semibold">
                        {title || (isNewPage ? 'Create New Page' : 'Edit Page')}
                        {hasUnsavedChanges && <span className="ml-2 text-sm text-muted-foreground">(Unsaved changes)</span>}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    {!isNewPage && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onShowGeneratedCode}
                            className="gap-2"
                        >
                            <Code2 className="h-4 w-4" />
                            View Code
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onShowPageInfo}
                    >
                        <Settings2 className="h-4 w-4 mr-2" />
                        Page Settings
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('cancel')}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={onSave}
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
                                        onClick={onDelete}
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

            {/* Unsaved Changes Alert Dialog */}
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
        </div>
    )
} 