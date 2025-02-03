import { createClient } from "../client";
import { PreDefinedFunction } from "@/types/PreDefinedFunctions";


export const getPreDefinedFunctions = async (): Promise<PreDefinedFunction[]> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pre_defined_functions').select('*');
    if (error) {
        throw new Error('Failed to fetch pre-defined functions');
    }
    return data;
};


export const getPreDefinedFunction = async (id: string): Promise<PreDefinedFunction | null> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pre_defined_functions').select('*').eq('id', id).single();
    if (error) {

        console.error(error);
        return null;
    }
    return data;
};

export const createPreDefinedFunction = async (preDefinedFunction: PreDefinedFunction): Promise<PreDefinedFunction> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pre_defined_functions').insert({
        function_name: preDefinedFunction.function_name,
        function: preDefinedFunction.function,
    }).select().single();

    if (error) {
        console.error(error);
        throw new Error('Failed to create pre-defined function');
    }
    return data;

};

export const updatePreDefinedFunction = async (id: string, preDefinedFunction: PreDefinedFunction): Promise<PreDefinedFunction> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pre_defined_functions').update({
        function_name: preDefinedFunction.function_name,

        function: preDefinedFunction.function,
    }).eq('id', id).select().single();

    if (error) {
        throw new Error('Failed to update pre-defined function');
    }
    return data;

};

export const deletePreDefinedFunction = async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from('pre_defined_functions').delete().eq('id', id);
    if (error) {

        throw new Error('Failed to delete pre-defined function');
    }

};