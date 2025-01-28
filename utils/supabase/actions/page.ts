import { Page } from "@/types/Page";
import { createClient } from "../client";

export const getPage = async (pageId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pages').select('*').eq('id', pageId).single();
    if (error) {
        throw new Error('Failed to fetch page');
    }
    return data;
};

export const getPages = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pages').select('*').order('created_at', { ascending: false });
    if (error) {
        throw new Error('Failed to fetch pages');
    }
    return data;
};

export const getPageByEndpoint = async (endpoint: string, method: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('endpoint', "/" + endpoint)
        .eq('method', method.toUpperCase())
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows returned
            return null;
        }
        throw new Error('Failed to fetch page by endpoint');
    }
    return data;
};

export const createPage = async (page: Omit<Page, 'id'>) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pages').insert(page).select();
    if (error) {
        console.error(error);
        throw new Error('Failed to create page');
    }
    return data;
};

export const updatePage = async (pageId: string, page: Partial<Page>) => {
    try {
        const supabase = createClient();
        const { id, ...updateData } = page; // Remove id from update data
        const { data, error } = await supabase.from('pages').update(updateData).eq('id', pageId).select();
        if (error) {
            console.error(error);
            throw new Error('Failed to update page');
        }
        return data;
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const deletePage = async (pageId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pages').delete().eq('id', pageId);
    if (error) {
        throw new Error('Failed to delete page');
    }
    return data;
};

export const addLog = async (pageId: string, log: {
    timestamp: string;
    output: string;
    console: string;
    returnValue: string;
    request: string;
    success: boolean;
}) => {
    const supabase = createClient();
    
    // First get existing logs
    const { data: existingData, error: fetchError } = await supabase
        .from('pages')
        .select('logs')
        .eq('id', pageId)
        .single();
    
    if (fetchError) {
        throw new Error('Failed to fetch existing logs');
    }

    // Combine existing logs with new log
    const updatedLogs = [...(existingData?.logs || []), log];

    // Update the page with new logs
    const { data, error } = await supabase
        .from('pages')
        .update({ logs: updatedLogs })
        .eq('id', pageId)
        .select();

    if (error) {
        throw new Error('Failed to add log to page');
    }
    return data;
};

export const getLogs = async (pageId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('pages')
        .select('logs')
        .eq('id', pageId)
        .single();
        
    if (error) {
        throw new Error('Failed to fetch logs');
    }
    return data.logs as {
        timestamp: string;
        output: string;
        console: string;
        returnValue: string;
        request: string;
        success: boolean;
    }[];
};

export const clearLogs = async (pageId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('pages')
        .update({ logs: [] })
        .eq('id', pageId)
        .select();
        
    if (error) {
        throw new Error('Failed to clear logs');
    }
    return data;
};