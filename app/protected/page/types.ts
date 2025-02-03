import { z } from "zod"

export const pageSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
    description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
    code: z.string().min(1, "Code is required"),
    endpoint: z.string().min(1, "Endpoint is required").startsWith("/", "Endpoint must start with /"),
    method: z.enum(["GET", "POST"], {
        required_error: "Method is required",
        invalid_type_error: "Method must be either GET or POST"
    }),
    created_at: z.string(),
    id: z.string().optional(),
    test_post_body: z.string().nullable(),
    preDefinedVariables: z.number().nullable(),
    logs: z.array(z.object({
        timestamp: z.string(),
        output: z.string(),
        console: z.string(),
        returnValue: z.string(),
        request: z.string(),
        success: z.boolean()
    })).default([]),
    in_production_vars: z.boolean().default(false),
    category: z.number().nullable()
})

export type PageFormData = z.infer<typeof pageSchema>

export interface Log {
    timestamp: string
    output: string
    console: string
    returnValue: string
    request: string
    success: boolean
} 