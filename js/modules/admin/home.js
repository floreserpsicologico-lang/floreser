import { supabase } from '../../supabaseClient.js';
import * as Utils from '../../utils.js';

/**
 * Carga los datos de la Home (Fila ID=1 de home_content)
 */
export async function load() {
    // Verificamos si existe el formulario antes de llamar a la BD
    if (!document.getElementById('home-form')) return;

    const { data, error } = await supabase
        .from('home_content')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        console.error('Error cargando Home:', error);
        return;
    }

    if (!data) return; // No hay datos aún

    // 1. Rellenar Valores (Cards)
    // Se asume que values_cards es un array de 3 objetos en la BD
    const cards = Array.isArray(data.values_cards) ? data.values_cards : [{}, {}, {}];
    
    // Card 1
    document.getElementById('val1_icon').value = cards[0]?.icon || '';
    document.getElementById('val1_title').value = cards[0]?.title || '';
    document.getElementById('val1_desc').value = cards[0]?.desc || '';

    // Card 2
    document.getElementById('val2_icon').value = cards[1]?.icon || '';
    document.getElementById('val2_title').value = cards[1]?.title || '';
    document.getElementById('val2_desc').value = cards[1]?.desc || '';

    // Card 3
    document.getElementById('val3_icon').value = cards[2]?.icon || '';
    document.getElementById('val3_title').value = cards[2]?.title || '';
    document.getElementById('val3_desc').value = cards[2]?.desc || '';

    // 2. Rellenar About (Sobre Nosotros)
    const about = data.about || {};
    document.getElementById('about_tag').value = about.tag || '';
    document.getElementById('about_title').value = about.title || '';
    document.getElementById('about_text').value = about.text || '';
    document.getElementById('about_image_url').value = about.image_url || '';
    document.getElementById('about_cta_text').value = about.cta_text || '';
    document.getElementById('about_cta_href').value = about.cta_href || '';

    // Los bullets se guardan como array, pero se editan como texto (uno por línea)
    const bullets = Array.isArray(about.bullets) ? about.bullets : [];
    document.getElementById('about_bullets').value = bullets.join('\n');

    // Mostrar preview de imagen si existe
    if (about.image_url) {
        const img = document.getElementById('about_img_preview');
        if (img) {
            img.src = about.image_url;
            img.classList.remove('hidden');
        }
    }
}

/**
 * Configura los eventos (Submit y Upload)
 */
export function setupEvents() {
    // Guardar cambios
    document.getElementById('home-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await save();
    });

    // Subir imagen de About
    Utils.bindUploader({
        fileId: "about_img_file",
        previewId: "about_img_preview",
        btnId: "btn-upload-about",
        inputUrlId: "about_image_url",
        folder: "home"
    });
}

/**
 * Guarda todos los datos en la BD
 */
async function save() {
    const btn = document.querySelector('#home-form button[type="submit"]');
    const oldText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    btn.disabled = true;

    try {
        // Construir Array de Valores
        const values_cards = [
            {
                icon: document.getElementById('val1_icon').value.trim(),
                title: document.getElementById('val1_title').value.trim(),
                desc: document.getElementById('val1_desc').value.trim(),
            },
            {
                icon: document.getElementById('val2_icon').value.trim(),
                title: document.getElementById('val2_title').value.trim(),
                desc: document.getElementById('val2_desc').value.trim(),
            },
            {
                icon: document.getElementById('val3_icon').value.trim(),
                title: document.getElementById('val3_title').value.trim(),
                desc: document.getElementById('val3_desc').value.trim(),
            },
        ];

        // Construir Objeto About
        const bulletsText = document.getElementById('about_bullets').value;
        const bullets = bulletsText.split('\n').map(x => x.trim()).filter(Boolean);

        const about = {
            tag: document.getElementById('about_tag').value.trim(),
            title: document.getElementById('about_title').value.trim(),
            text: document.getElementById('about_text').value.trim(),
            image_url: document.getElementById('about_image_url').value.trim(),
            bullets: bullets,
            cta_text: document.getElementById('about_cta_text').value.trim(),
            cta_href: document.getElementById('about_cta_href').value.trim(),
        };

        // Update en Supabase
        const { error } = await supabase
            .from('home_content')
            .update({ 
                values_cards, 
                about, 
                updated_at: new Date().toISOString() 
            })
            .eq('id', 1);

        if (error) throw error;

        alert('✅ Contenido del Home actualizado correctamente.');

    } catch (error) {
        console.error(error);
        alert('❌ Error al guardar: ' + error.message);
    } finally {
        btn.innerHTML = oldText;
        btn.disabled = false;
    }
}