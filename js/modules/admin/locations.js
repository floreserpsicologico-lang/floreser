import { supabase } from '../../supabaseClient.js';
import * as Utils from '../../utils.js';

let locationsData = [];


export async function load() {
    const container = document.getElementById('locations-list');
    if (!container) return;

    container.innerHTML = '<p class="text-gray-400 text-sm">Cargando sedes...</p>';

    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error('Error locations:', error);
        container.innerHTML = '<p class="text-red-500">Error cargando sedes.</p>';
        return;
    }

    locationsData = data || [];
    render();
}


function render() {
    const container = document.getElementById('locations-list');
    
    if (!locationsData.length) {
        container.innerHTML = '<p class="text-gray-500 py-8">No hay sedes registradas.</p>';
        return;
    }

    container.innerHTML = locationsData.map(loc => `
        <div class="border border-gray-200 p-5 rounded-xl bg-white hover:shadow-lg transition">
            <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <h4 class="font-bold text-gray-800 text-lg">${Utils.escapeHtml(loc.ciudad)}</h4>
                        <span class="text-xs px-2 py-1 rounded-full ${loc.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}">
                            ${loc.active ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                    
                    <p class="text-xs text-gray-400 mt-1">Key: ${loc.key}</p>
                    
                    ${loc.whatsapp ? `<p class="text-sm text-gray-600 mt-2"><i class="fab fa-whatsapp mr-2 text-green-600 w-4 text-center"></i>${Utils.escapeHtml(loc.whatsapp)}</p>` : ''}
                    
                    ${loc.email ? `<p class="text-sm text-gray-600 mt-1"><i class="fas fa-envelope mr-2 text-blue-600 w-4 text-center"></i>${Utils.escapeHtml(loc.email)}</p>` : ''}

                    ${loc.horario ? `<p class="text-sm text-gray-600 mt-1"><i class="far fa-clock mr-2 text-purple-600 w-4 text-center"></i>${Utils.escapeHtml(loc.horario)}</p>` : ''}
                </div>

                <div class="flex flex-col gap-2">
                    <button onclick="window.editLocation(${loc.id})" class="text-gray-400 hover:text-blue-600 transition" title="Editar">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button onclick="window.deleteLocation(${loc.id})" class="text-gray-400 hover:text-red-600 transition" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Configura los eventos del formulario y botones
 */
export function setupEvents() {
    // Abrir Modal
    document.getElementById('btn-open-location-modal')?.addEventListener('click', () => {
        openModal();
    });

    // Cerrar Modal (X y Botón Cancelar)
    document.getElementById('btn-close-location-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-location-modal')?.addEventListener('click', closeModal);

    // Submit Formulario
    document.getElementById('location-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await save();
    });
}

// --- LÓGICA INTERNA DEL FORMULARIO ---

function openModal(id = null) {
    const form = document.getElementById('location-form');
    form.reset();
    document.getElementById('location_id').value = '';
    document.getElementById('modal-location').classList.remove('hidden');
    
    // Si es nuevo
    if (!id) {
        document.getElementById('location-modal-title').innerText = 'Nueva Sede';
        document.getElementById('location_key').disabled = false;
        document.getElementById('location_active').checked = true;
    } 
    // Si es edición (rellenamos datos)
    else {
        const loc = locationsData.find(x => x.id === id);
        if (!loc) return;

        document.getElementById('location-modal-title').innerText = 'Editar Sede';
        document.getElementById('location_id').value = loc.id;
        document.getElementById('location_key').value = loc.key;
        document.getElementById('location_key').disabled = true; // Key no se edita
        document.getElementById('location_ciudad').value = loc.ciudad;
        document.getElementById('location_whatsapp').value = loc.whatsapp || '';
        document.getElementById('location_email').value = loc.email || '';
        document.getElementById('location_horario').value = loc.horario || '';
        document.getElementById('location_address_html').value = loc.address_html || '';
        document.getElementById('location_map_iframe').value = loc.map_iframe || '';
        document.getElementById('location_active').checked = loc.active;
    }
}

function closeModal() {
    document.getElementById('modal-location').classList.add('hidden');
}

async function save() {
    const id = document.getElementById('location_id').value;
    const key = document.getElementById('location_key').value.trim().toLowerCase();
    
    // Validación básica
    if (!/^[a-z0-9-]+$/.test(key)) {
        return alert('⚠️ El key solo debe tener minúsculas, números y guiones.');
    }

    const dataObj = {
        key,
        ciudad: document.getElementById('location_ciudad').value.trim(),
        whatsapp: document.getElementById('location_whatsapp').value.trim() || null,
        email: document.getElementById('location_email').value.trim() || null,
        horario: document.getElementById('location_horario').value.trim() || null,
        address_html: document.getElementById('location_address_html').value.trim() || null,
        map_iframe: document.getElementById('location_map_iframe').value.trim() || null,
        active: document.getElementById('location_active').checked,
        updated_at: new Date().toISOString()
    };

    let error;
    if (id) {
        const res = await supabase.from('locations').update(dataObj).eq('id', id);
        error = res.error;
    } else {
        const res = await supabase.from('locations').insert([dataObj]);
        error = res.error;
    }

    if (error) {
        alert('❌ Error al guardar: ' + error.message);
    } else {
        closeModal();
        load(); // Recargar lista
        alert('✅ Sede guardada correctamente');
    }
}

// --- FUNCIONES PÚBLICAS (para window) ---

export function edit(id) {
    openModal(id);
}

export async function remove(id) {
    if (!confirm('¿Estás seguro de eliminar esta sede?')) return;
    
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) alert('❌ Error: ' + error.message);
    else load();
}