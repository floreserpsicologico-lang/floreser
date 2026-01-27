import { supabase } from '../../supabaseClient.js';

/**
 * Verifica si existe una sesión activa al cargar la página.
 */
export async function checkSession() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        return session;
    } catch (error) {
        console.error('Error verificando sesión:', error);
        return null;
    }
}

/**
 * Inicia sesión con email y contraseña.
 * Si es exitoso, recarga la página para iniciar el dashboard limpio.
 */
export async function login(email, password) {
    const msgElement = document.getElementById('login-msg');
    if (msgElement) msgElement.innerText = "Autenticando...";

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        if (msgElement) {
            msgElement.innerText = "Error: " + (error.message === "Invalid login credentials" ? "Credenciales incorrectas" : error.message);
            msgElement.className = "text-red-500 text-sm mt-3 text-center";
        }
        return false;
    }

    // Login exitoso: Recargamos para que admin.js detecte la sesión desde cero
    window.location.reload();
    return true;
}

/**
 * Cierra la sesión y recarga.
 */
export async function logout() {
    await supabase.auth.signOut();
    window.location.reload();
}