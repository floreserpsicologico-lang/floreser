// js/utils.js
import { supabase } from './supabaseClient.js';

// --- Formateo de fechas ---
export function fmtDate(isoString) {
    if (!isoString) return '';
    try {
        const d = new Date(isoString);
        return d.toLocaleString('es-PE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (e) {
        return isoString;
    }
}

// --- Seguridad XSS (Evitar inyección de HTML) ---
export function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- Subida de Imágenes ---
// folder: 'slides', 'services', 'team', etc.
export async function uploadImage(file, bucket = 'images', folder = 'admin') {
    if (!file) throw new Error("No se ha seleccionado ningún archivo.");

    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

    const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) throw error;

    // Obtener URL pública
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return data.publicUrl;
}

// --- Helper para conectar input file con preview y botón ---
export function bindUploader({ fileId, previewId, btnId, inputUrlId, folder }) {
    const fileInput = document.getElementById(fileId);
    const previewImg = document.getElementById(previewId);
    const uploadBtn = document.getElementById(btnId);
    const urlInput = document.getElementById(inputUrlId);

    if (!fileInput || !uploadBtn) return; // Si no existen en el DOM actual, salimos

    // 1. Mostrar preview al seleccionar archivo
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && previewImg) {
            previewImg.src = URL.createObjectURL(file);
            previewImg.classList.remove('hidden');
        }
    });

    // 2. Subir al hacer click en el botón
    uploadBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return alert("⚠️ Selecciona una imagen primero.");

        const originalText = uploadBtn.innerHTML;
        try {
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
            uploadBtn.disabled = true;

            const publicUrl = await uploadImage(file, 'images', folder);
            
            if (urlInput) {
                urlInput.value = publicUrl;
                // Disparamos evento input para que si hay listeners (vista previa en vivo) se actualicen
                urlInput.dispatchEvent(new Event('input')); 
            }

            alert("✅ Imagen subida correctamente.");
        } catch (error) {
            console.error(error);
            alert("❌ Error al subir imagen: " + error.message);
        } finally {
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;
        }
    });
}