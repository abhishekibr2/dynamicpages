export type Page = {
    id?: string;
    title: string;
    description: string;
    code: string;
    endpoint: string;
    created_at: string;
    method: string;
    preDefinedVariables: number | null;
    logs: {
        timestamp: string;
        output: string;
        console: string;
        returnValue: string;
    }[];
};