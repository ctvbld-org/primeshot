// Factory function that accepts a supabase client
// This allows both webapp and website to use their own clients
export function createConfigApi(supabase) {
    // Get all style configs
    async function getAllStyleConfigs() {
        const { data, error } = await supabase
            .from('styles')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw error;
        return data;
    }
    // Get a style config by ID
    async function getStyleConfigById(id) {
        const { data, error } = await supabase
            .from('styles')
            .select('*')
            .eq('id', id)
            .limit(1)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // Not found
            throw error;
        }
        return data;
    }
    // New separate table functions
    async function getScenes() {
        const { data, error } = await supabase
            .from('style_scenes')
            .select('*')
            .order('value');
        if (error)
            throw error;
        return data;
    }
    async function getWardrobes() {
        const { data, error } = await supabase
            .from('style_wardrobes')
            .select('*')
            .order('value');
        if (error)
            throw error;
        return data;
    }
    async function getColors() {
        const { data, error } = await supabase
            .from('style_colors')
            .select('*')
            .order('value');
        if (error)
            throw error;
        return data;
    }
    // Get a specific scene by value
    async function getSceneByValue(value) {
        const { data, error } = await supabase
            .from('style_scenes')
            .select('*')
            .eq('value', value)
            .limit(1)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // Not found
            throw error;
        }
        return data;
    }
    // Get a specific scene by id
    async function getSceneById(id) {
        const { data, error } = await supabase
            .from('style_scenes')
            .select('*')
            .eq('id', id)
            .limit(1)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // Not found or multiple
            throw error;
        }
        return data;
    }
    // Get a specific wardrobe by value
    async function getWardrobeByValue(value) {
        const { data, error } = await supabase
            .from('style_wardrobes')
            .select('*')
            .eq('value', value)
            .limit(1)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // Not found
            throw error;
        }
        return data;
    }
    // Get a specific wardrobe by id
    async function getWardrobeById(id) {
        const { data, error } = await supabase
            .from('style_wardrobes')
            .select('*')
            .eq('id', id)
            .limit(1)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // Not found or multiple
            throw error;
        }
        return data;
    }
    // Get a specific color by value
    async function getColorByValue(value) {
        const { data, error } = await supabase
            .from('style_colors')
            .select('*')
            .eq('value', value)
            .limit(1)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // Not found
            throw error;
        }
        return data;
    }
    // Get a specific color by id
    async function getColorById(id) {
        const { data, error } = await supabase
            .from('style_colors')
            .select('*')
            .eq('id', id)
            .limit(1)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null; // Not found or multiple
            throw error;
        }
        return data;
    }
    // Admin-only functions
    async function updateStyleConfig(id, style) {
        const { data, error } = await supabase
            .from('styles')
            .update(style)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    // Admin-only functions for separate tables
    async function updateScene(value, scene) {
        const { data, error } = await supabase
            .from('style_scenes')
            .update(scene)
            .eq('value', value)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async function updateWardrobe(value, wardrobe) {
        const { data, error } = await supabase
            .from('style_wardrobes')
            .update(wardrobe)
            .eq('value', value)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async function updateColor(value, color) {
        const { data, error } = await supabase
            .from('style_colors')
            .update(color)
            .eq('value', value)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    return {
        getAllStyleConfigs,
        getStyleConfigById,
        getScenes,
        getWardrobes,
        getColors,
        getSceneByValue,
        getSceneById,
        getWardrobeByValue,
        getWardrobeById,
        getColorByValue,
        getColorById,
        updateStyleConfig,
        updateScene,
        updateWardrobe,
        updateColor,
    };
}
