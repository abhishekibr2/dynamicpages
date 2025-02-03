'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { PreDefinedFunction } from "@/types/PreDefinedFunctions"

import Link from "next/link"
import { PreDefinedFunctionTable } from "./components/PreDefinedFunctionssTable"
import { PreDefinedFunctionDialog } from "./components/PreDefinedFunctionsDialog"
import { PlusIcon } from "lucide-react"

export default function PreDefinedFunctionsPage() {
    const [selectedPreDefinedFunction, setSelectedPreDefinedFunction] = useState<PreDefinedFunction>()
    const [dialogOpen, setDialogOpen] = useState(false)
    const tableRef = useRef<{ fetchPreDefinedFunctions: () => void }>({ fetchPreDefinedFunctions: () => { } })
    const router = useRouter()
    const [lastKeyPress, setLastKeyPress] = useState<string>('')

    const [lastKeyPressTime, setLastKeyPressTime] = useState<number>(0)
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState<'back' | 'cancel' | null>(null)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    const handleEdit = (preDefinedFunction: PreDefinedFunction) => {
        setSelectedPreDefinedFunction(preDefinedFunction)
        setDialogOpen(true)
    }


    const handleAddNew = () => {
        setSelectedPreDefinedFunction(undefined)
        setDialogOpen(true)
    }


    const handleSuccess = () => {
        tableRef.current.fetchPreDefinedFunctions()
        setDialogOpen(false)
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

    return (
        <div className="container mx-auto py-10 space-y-4">
            <div className="flex h-full flex-col">
                <Link href="/protected" className="max-w-fit">
                    <div className="flex items-center gap-2 border rounded-md px-2 py-1 mt-2 bg-muted">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </div>
                </Link>
                <div className="flex-1 min-h-0 w-full bg-card rounded-lg shadow-sm p-4 mt-2">
                    <PreDefinedFunctionTable
                        ref={tableRef}
                        onEdit={handleEdit}
                        onAddNew={handleAddNew}
                    />
                </div>
                <PreDefinedFunctionDialog
                    preDefinedFunction={selectedPreDefinedFunction}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSuccess={handleSuccess}
                />
            </div>
        </div>
    )
}