export type Page = {
    id?: string;
    title: string;
    description: string;
    code: string;
    endpoint: string;
    created_at: string;
    method: string;
    test_post_body: string | null;
    preDefinedVariables: number | null;
    logs: {
        timestamp: string;
        output: string;
        console: string;
        returnValue: string;
        request: string;
        success: boolean;
    }[];
    in_production_vars: boolean;
    category?: number;
};