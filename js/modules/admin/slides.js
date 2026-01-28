import { supabase } from '../../supabaseClient.js';
import * as Utils from '../../utils.js';

let slidesData = [];

export async function load() {
    const container = document.getElementById('slides-list');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm">Cargando slides...</p>';

    const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error(error);
        return container.innerHTML = '<p class="text-red-500">Error al cargar slides.</p>';
    }

    slidesData = data || [];
    render();
}

function render() {
    const container = document.getElementById('slides-list');
    if (!slidesData.length) {
        container.innerHTML = '<p class="text-gray-500 py-4 text-center">No hay slides en el carrusel.</p>';
        return;
    }

    container.innerHTML = slidesData.map(slide => `
        <div class="border border-gray-200 p-4 rounded-lg flex gap-4 items-center bg-white hover:shadow-md transition">
            <img src="${slide.image_url}" class="w-24 h-16 object-cover rounded bg-gray-100 border" onerror="this.src='https://via.placeholder.com/150?text=No+Img'">
            <div class="flex-1 min-w-0">
                <p class="font-bold text-purple-700 text-xs uppercase tracking-wider">${Utils.escapeHtml(slide.subtitle)}</p>
                <p class="font-bold text-gray-800 text-sm truncate">${Utils.escapeHtml(slide.title)}</p>
                <p class="text-xs text-gray-500 truncate">${Utils.escapeHtml(slide.description)}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.editSlide(${slide.id})" class="text-blue-500 hover:text-blue-700 p-2"><i class="fas fa-pen"></i></button>
                <button onclick="window.deleteSlide(${slide.id})" class="text-red-500 hover:text-red-700 p-2"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

export function setupEvents() {
    // Uploader
    Utils.bindUploader({
        fileId: "new_img_file",
        previewId: "new_img_preview",
        btnId: "btn-upload-slide",
        inputUrlId: "new_img",
        folder: "slides"
    });

    // Formulario
    document.getElementById('add-slide-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await save();
    });

    // Cancelar
    document.getElementById('btn-cancel-slide')?.addEventListener('click', cancelEdit);
}

// --- LÓGICA INTERNA ---

function cancelEdit() {
    const form = document.getElementById('add-slide-form');
    form.reset();
    document.getElementById('slide_id_edit').value = '';
    
    // Resetear preview de imagen
    const imgPreview = document.getElementById('new_img_preview');
    imgPreview.src = '';
    imgPreview.classList.add('hidden');
    
    document.getElementById('slide-form-title').innerHTML = '<i class="fas fa-plus-circle mr-2"></i>Añadir Nuevo Slide';
    document.getElementById('btn-cancel-slide').classList.add('hidden');
}

async function save() {
    const id = document.getElementById('slide_id_edit').value;
    
    // ✅ CAMBIO: Construir el título con dos líneas
    const line1 = document.getElementById('new_title_line1').value.trim();
    const line2 = document.getElementById('new_title_line2').value.trim();
    
    const dataObj = {
        subtitle: document.getElementById('new_subtitle').value.trim(),
        title: `${line1} <br><span class='text-brand-600'>${line2}</span>`, // ✅ HTML generado automáticamente
        description: document.getElementById('new_desc').value.trim(),
        image_url: document.getElementById('new_img').value.trim()
    };

    let error;
    if (id) {
        const res = await supabase.from('hero_slides').update(dataObj).eq('id', id);
        error = res.error;
    } else {
        const res = await supabase.from('hero_slides').insert([dataObj]);
        error = res.error;
    }

    if (error) {
        alert('❌ Error: ' + error.message);
    } else {
        cancelEdit();
        load();
        alert('✅ Slide guardado.');
    }
}

// --- PÚBLICAS ---

export function edit(id) {
    const slide = slidesData.find(s => s.id === id);
    if (!slide) return;

    document.getElementById('slide_id_edit').value = slide.id;
    document.getElementById('new_subtitle').value = slide.subtitle;
    
    // ✅ CAMBIO: Separar el título en dos campos
    const titleParts = slide.title.split('<br>');
    document.getElementById('new_title_line1').value = titleParts[0].trim();
    
    const line2Match = slide.title.match(/<span[^>]*>(.*?)<\/span>/);
    document.getElementById('new_title_line2').value = line2Match ? line2Match[1].trim() : '';
    
    document.getElementById('new_desc').value = slide.description;
    document.getElementById('new_img').value = slide.image_url;

    // Mostrar preview
    if (slide.image_url) {
        const imgPreview = document.getElementById('new_img_preview');
        imgPreview.src = slide.image_url;
        imgPreview.classList.remove('hidden');
    }

    document.getElementById('slide-form-title').innerHTML = '<i class="fas fa-pen mr-2"></i>Editar Slide';
    document.getElementById('btn-cancel-slide').classList.remove('hidden');
    
    // Scroll hacia el formulario
    document.getElementById('add-slide-form').scrollIntoView({ behavior: 'smooth' });
}

export async function remove(id) {
    if (confirm('¿Eliminar slide del carrusel?')) {
        const { error } = await supabase.from('hero_slides').delete().eq('id', id);
        if (!error) load();
    }
}