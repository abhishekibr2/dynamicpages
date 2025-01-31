"use client"
import { TextHoverEffect } from "@/components/ui/text-hover-effect"
import { useEffect, useState } from "react"

export default function TestPage() {
    // const [permission, setPermission] = useState(false)

    // useEffect(() => {
    //     //ask user to enter a code
    //     const code = prompt('Enter a code')
    //     if (code === '1234') {
    //         setPermission(true)
    //         console.log('Code is correct')
    //     } else {
    //         alert('Code is incorrect')
    //     }
    // }, [])
    // if (!permission) {
    //     return <div>You do not have permission to access this page</div>
    // }
    // else {
    return (
        <div className="flex justify-center items-center h-screen">
            {/* pnly start render if permission is true */}
            <TextHoverEffect text="GROK" />
        </div>
    )
    // }
}