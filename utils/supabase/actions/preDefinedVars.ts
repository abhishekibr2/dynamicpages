import { createClient } from "../client";
import { availableColors } from "@/utils/colors";
import { PreDefinedVariable } from "@/types/PreDefinedVariable";

export const getPreDefinedVariables = async (): Promise<PreDefinedVariable[]> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pre_defined_variables').select('*');
    if (error) {
        throw new Error('Failed to fetch Pre-defined Codes');
    }
    return data;
};

export const getPreDefinedVariable = async (id: string): Promise<PreDefinedVariable | null> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pre_defined_variables').select('*').eq('id', id).single();
    if (error) {
        console.error(error);
        return null;
    }
    return data;
};

export const createPreDefinedVariable = async (preDefinedVariable: PreDefinedVariable): Promise<PreDefinedVariable> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pre_defined_variables').insert({
        title: preDefinedVariable.title,
        vars: preDefinedVariable.vars,
        color: preDefinedVariable.color,
    }).select().single();
    if (error) {
        console.error(error);
        throw new Error('Failed to create Pre-defined Code');
    }
    return data;
};

export const updatePreDefinedVariable = async (id: string, preDefinedVariable: PreDefinedVariable): Promise<PreDefinedVariable> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('pre_defined_variables').update({
        title: preDefinedVariable.title,
        vars: preDefinedVariable.vars,
        color: preDefinedVariable.color,
    }).eq('id', id).select().single();
    if (error) {
        throw new Error('Failed to update Pre-defined Code');
    }
    return data;
};

export const deletePreDefinedVariable = async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from('pre_defined_variables').delete().eq('id', id);
    if (error) {
        throw new Error('Failed to delete Pre-defined Code');
    }
};