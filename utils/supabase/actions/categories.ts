import { createClient } from "@/utils/supabase/client";
import { Category } from "@/types/Category";
const supabase = createClient();

export const getCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {

        throw error;
    }
    return data;
}

export const createCategory = async (category: Category) => {
    const { data, error } = await supabase.from('categories').insert(category);
    if (error) {
        throw error;
    }
    return data;
}

export const updateCategory = async (category: Category) => {
    const { data, error } = await supabase.from('categories').update(category).eq('id', category.id);
    if (error) {
        throw error;
    }
    return data;
}

export const deleteCategory = async (id: string) => {
    const { data, error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
        throw error;
    }
    return data;
}

export const getCategoryById = async (id: string) => {
    const { data, error } = await supabase.from('categories').select('*').eq('id', id);
    if (error) {
        throw error;
    }
    return data;
}

export const getCategoryByName = async (name: string) => {
    const { data, error } = await supabase.from('categories').select('*').eq('name', name);
    if (error) {
        throw error;
    }
    return data;
}