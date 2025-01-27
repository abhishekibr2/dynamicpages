import { Skeleton } from "./ui/skeleton";

export default function SkeletonTable() {
    return (
        <div className="rounded-md border">
            <div className="w-full">
                {/* Table Header */}
                <div className="bg-muted/100 border-b">
                    <div className="grid grid-cols-5 gap-4 p-4">
                        <Skeleton className="h-4 w-16" /> {/* Title */}
                        <Skeleton className="h-4 w-24" /> {/* Description */}
                        <Skeleton className="h-4 w-20" /> {/* Endpoint */}
                        <Skeleton className="h-4 w-16" /> {/* Method */}
                        <Skeleton className="h-4 w-24" /> {/* Created At */}
                    </div>
                </div>

                {/* Table Body */}
                <div className="space-y-2">
                    {/* Generate 5 skeleton rows */}
                    {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="grid grid-cols-5 gap-4 p-4 hover:bg-muted">
                            <Skeleton className="h-4 w-32" /> {/* Title */}
                            <Skeleton className="h-4 w-48" /> {/* Description */}
                            <Skeleton className="h-4 w-28" /> {/* Endpoint */}
                            <Skeleton className="h-4 w-16" /> {/* Method */}
                            <Skeleton className="h-4 w-24" /> {/* Created At */}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}