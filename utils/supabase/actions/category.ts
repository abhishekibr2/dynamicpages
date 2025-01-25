import { createClient } from "../client";
import { Category } from "@/types/Category";
import { availableColors } from "@/utils/colors";

export const getCategories = async (): Promise<Category[]> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
        throw new Error('Failed to fetch categories');
    }
    return data;
};

export const getCategory = async (id: string): Promise<Category> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
    if (error) {
        throw new Error('Failed to fetch category');
    }
    return data;
};

export const createCategory = async (category: Category): Promise<Category> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('categories').insert({
        title: category.title,
        vars: category.vars,
        color: availableColors[Math.floor(Math.random() * availableColors.length)],
    }).select().single();
    if (error) {
        console.error(error);
        throw new Error('Failed to create category');
    }
    return data;
};

export const updateCategory = async (id: string, category: Category): Promise<Category> => {
    const supabase = createClient();
    const { data, error } = await supabase.from('categories').update(category).eq('id', id).select().single();
    if (error) {
        throw new Error('Failed to update category');
    }
    return data;
};

export const deleteCategory = async (id: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
        throw new Error('Failed to delete category');
    }
};