'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { PreDefinedVariable } from "@/types/PreDefinedVariable"
import { PreDefinedVariableTable } from "../components/PreDefinedVariablesTable"
import { PreDefinedVariableDialog } from "../components/PreDefinedVariablesDialog"
import Link from "next/link"

export default function ProtectedPreDefinedVariable() {
    const [selectedPreDefinedVariable, setSelectedPreDefinedVariable] = useState<PreDefinedVariable>()
    const [dialogOpen, setDialogOpen] = useState(false)
    const tableRef = useRef<{ fetchPreDefinedVariables: () => void }>({ fetchPreDefinedVariables: () => { } })
    const router = useRouter()
    const [lastKeyPress, setLastKeyPress] = useState<string>('')
    const [lastKeyPressTime, setLastKeyPressTime] = useState<number>(0)
    const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState<'back' | 'cancel' | null>(null)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

    const handleEdit = (preDefinedVariable: PreDefinedVariable) => {
        setSelectedPreDefinedVariable(preDefinedVariable)
        setDialogOpen(true)
    }

    const handleAddNew = () => {
        setSelectedPreDefinedVariable(undefined)
        setDialogOpen(true)
    }

    const handleSuccess = () => {
        tableRef.current.fetchPreDefinedVariables()
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
        <div className="flex h-full w-[60%] flex-col">
            <Link href="/protected" className="max-w-fit">
                <div className="flex items-center gap-2 border rounded-md px-2 py-1 mt-2 bg-muted">
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </div>
            </Link>
            <div className="flex-1 min-h-0 w-full bg-card rounded-lg shadow-sm p-4 mt-2">
                <PreDefinedVariableTable
                    ref={tableRef}
                    onEdit={handleEdit}
                    onAddNew={handleAddNew}
                />
            </div>
            <PreDefinedVariableDialog
                preDefinedVariable={selectedPreDefinedVariable}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={handleSuccess}
            />
        </div>
    )
}