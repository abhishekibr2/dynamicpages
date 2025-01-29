import { createClient } from "../client";
import { Toolbox } from "@/types/Toolbox";

export const getToolbox = async (): Promise<Toolbox> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('toolbox').select('*').single();
    if (error) {
        // If no tooltip exists, return empty description
        if (error.code === 'PGRST116') {
            return { description: '' };
        }
        throw new Error('Failed to fetch toolbox');
    }
    return data;
};

export const updateToolbox = async (toolbox: Toolbox): Promise<Toolbox> => {
    const supabase = createClient();
    // Always upsert to the first record
    const { data, error } = await supabase
        .from('toolbox')
        .upsert({ ...toolbox, id: '1' }, { onConflict: 'id' })
        .select()
        .single();
        
    if (error) {
        console.error('Toolbox update error:', error);
        throw new Error('Failed to update toolbox');
    }
    return data;
};