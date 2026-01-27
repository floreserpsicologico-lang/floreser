import { supabase } from '../../supabaseClient.js';
import * as Utils from '../../utils.js';

let testData = [];

export async function load() {
    const container = document.getElementById('testimonials-list');
    if (!container) return;
    container.innerHTML = '<p class="text-gray-400 text-sm">Cargando...</p>';
    
    const { data, error } = await supabase.from('testimonials').select('*').order('id');
    if (error) return container.innerHTML = '<p class="text-red-500">Error.</p>';
    
    testData = data || [];
    render();
}

function render() {
    const container = document.getElementById('testimonials-list');
    if (!testData.length) return container.innerHTML = '<p class="text-gray-500 py-4 text-center">No hay testimonios.</p>';

    container.innerHTML = testData.map(t => {
        // Intento básico de extraer ID de Google Drive para mostrarlo (opcional)
        const driveId = t.video_url.match(/\/d\/([^\/]+)/)?.[1] || 'Link Externo';
        
        return `
        <div class="border border-gray-200 p-4 rounded-lg flex justify-between items-center bg-gray-50 hover:shadow-md transition">
            <div class="flex-1 overflow-hidden">
                <p class="font-bold text-gray-800">${Utils.escapeHtml(t.name)}</p>
                <a href="${t.video_url}" target="_blank" class="text-xs text-blue-600 hover:underline truncate block">
                    <i class="fas fa-video mr-1"></i> ${driveId}
                </a>
            </div>
            <div class="flex gap-2">
                <button onclick="window.editTestimonial(${t.id})" class="text-blue-500 hover:text-blue-700 p-2"><i class="fas fa-pen"></i></button>
                <button onclick="window.deleteTestimonial(${t.id})" class="text-red-500 hover:text-red-700 p-2"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}

export function setupEvents() {
    document.getElementById('add-test-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await save();
    });
    document.getElementById('btn-cancel-test')?.addEventListener('click', cancelEdit);
}

function cancelEdit() {
    document.getElementById('add-test-form').reset();
    document.getElementById('test_id_edit').value = '';
    document.getElementById('test-form-title').innerHTML = '<i class="fas fa-video mr-2"></i>Añadir Testimonio';
    document.getElementById('btn-cancel-test').classList.add('hidden');
}

async function save() {
    const id = document.getElementById('test_id_edit').value;
    const dataObj = {
        name: document.getElementById('new_test_name').value.trim(),
        video_url: document.getElementById('new_test_video').value.trim()
    };

    let error;
    if (id) {
        const res = await supabase.from('testimonials').update(dataObj).eq('id', id);
        error = res.error;
    } else {
        const res = await supabase.from('testimonials').insert([dataObj]);
        error = res.error;
    }

    if (error) alert('❌ Error: ' + error.message);
    else {
        cancelEdit();
        load();
        alert('✅ Guardado.');
    }
}

export function edit(id) {
    const t = testData.find(x => x.id === id);
    if (!t) return;
    document.getElementById('test_id_edit').value = t.id;
    document.getElementById('new_test_name').value = t.name;
    document.getElementById('new_test_video').value = t.video_url;

    document.getElementById('test-form-title').innerText = 'Editar Testimonio';
    document.getElementById('btn-cancel-test').classList.remove('hidden');
    document.getElementById('add-test-form').scrollIntoView({ behavior: 'smooth' });
}

export async function remove(id) {
    if (confirm('¿Eliminar testimonio?')) {
        const { error } = await supabase.from('testimonials').delete().eq('id', id);
        if (!error) load();
    }
}