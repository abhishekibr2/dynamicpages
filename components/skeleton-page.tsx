import { Skeleton } from "./ui/skeleton";

export default function SkeletonPage() {
    return (
        <div className="min-h-screen bg-background w-full">
            {/* Header Skeleton */}
            <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="w-full px-6 flex h-14 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-9 w-20" /> {/* Back button */}
                        <Skeleton className="h-7 w-32" /> {/* Title */}
                    </div>
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-9 w-20" /> {/* Cancel button */}
                        <Skeleton className="h-9 w-28" /> {/* Save button */}
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="w-full px-6 py-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Left Column - Form Skeleton */}
                    <div className="space-y-6">
                        <div className="rounded-lg border bg-card p-6 space-y-6">
                            {/* Title Input */}
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-16" /> {/* Label */}
                                <Skeleton className="h-10 w-full" /> {/* Input */}
                            </div>

                            {/* Description Textarea */}
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-24" /> {/* Label */}
                                <Skeleton className="h-[120px] w-full" /> {/* Textarea */}
                            </div>

                            {/* Endpoint and Method */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-20" /> {/* Label */}
                                    <Skeleton className="h-10 w-full" /> {/* Input */}
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-16" /> {/* Label */}
                                    <Skeleton className="h-10 w-full" /> {/* Select */}
                                </div>
                            </div>
                        </div>

                        {/* Output Section Skeleton */}
                        <div className="rounded-lg border p-4">
                            <div className="space-y-2">
                                <div className="flex gap-4 mb-4">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-8 w-24" />
                                </div>
                                <Skeleton className="h-[300px] w-full" />
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Code Editor Skeleton */}
                    <div className="rounded-lg border bg-card">
                        <div className="p-4 border-b flex justify-between items-center">
                            <Skeleton className="h-5 w-24" /> {/* Editor Label */}
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-9 w-24" /> {/* Run Code Button */}
                            </div>
                        </div>
                        <Skeleton className="h-[calc(100vh-16rem)] w-full" /> {/* Editor Area */}
                    </div>
                </div>
            </div>
        </div>
    );
}