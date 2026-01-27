import { supabase } from '../../supabaseClient.js';
import * as Utils from '../../utils.js';

let servicesData = [];
let faqCounter = 0;

/**
 * Carga y renderiza servicios
 */
export async function load() {
    const container = document.getElementById('services-list');
    if (!container) return;
    
    container.innerHTML = '<p class="text-gray-400 text-sm">Cargando servicios...</p>';

    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error(error);
        return container.innerHTML = '<p class="text-red-500">Error cargando servicios.</p>';
    }

    servicesData = data || [];
    render();
}

function render() {
    const container = document.getElementById('services-list');
    if (!servicesData.length) {
        container.innerHTML = '<p class="text-gray-500 py-8">No hay servicios registrados.</p>';
        return;
    }

    // Mapa de colores para Tailwind (debe coincidir con admin.html select)
    const colorMap = {
        purple: 'bg-purple-100 text-purple-700',
        blue: 'bg-blue-100 text-blue-700',
        green: 'bg-green-100 text-green-700',
        pink: 'bg-pink-100 text-pink-700',
        orange: 'bg-orange-100 text-orange-700',
        teal: 'bg-teal-100 text-teal-700',
        indigo: 'bg-indigo-100 text-indigo-700',
        rose: 'bg-rose-100 text-rose-700'
    };

    container.innerHTML = servicesData.map(svc => {
        const colorClass = colorMap[svc.color] || colorMap.purple;
        return `
        <div class="border border-gray-200 p-5 rounded-xl bg-white hover:shadow-lg transition flex items-start gap-4">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0 ${colorClass}">
                <i class="${svc.icon || 'fas fa-heart'}"></i>
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-2">
                    <h4 class="font-bold text-gray-800">${Utils.escapeHtml(svc.title)}</h4>
                    <span class="text-xs px-2 py-1 rounded-full ${svc.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}">
                        ${svc.active ? 'Activo' : 'Inactivo'}
                    </span>
                </div>
                <p class="text-xs text-gray-400 mt-1">Key: ${svc.key}</p>
                <p class="text-sm text-gray-500 line-clamp-2 mt-1">${Utils.escapeHtml(svc.short_desc)}</p>
            </div>
            <div class="flex flex-col gap-2">
                <button onclick="window.toggleServiceActive(${svc.id})" class="text-gray-400 hover:text-emerald-600 transition" title="Activar/Desactivar">
                    <i class="fas ${svc.active ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
                </button>
                <button onclick="window.editService(${svc.id})" class="text-gray-400 hover:text-blue-600 transition" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button onclick="window.deleteService(${svc.id})" class="text-gray-400 hover:text-red-600 transition" title="Eliminar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    }).join('');
}

/**
 * Event Listeners
 */
export function setupEvents() {
    // Modal controls
    document.getElementById('btn-open-service-modal')?.addEventListener('click', () => openModal());
    document.getElementById('btn-close-service-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-cancel-service-modal')?.addEventListener('click', closeModal);
    
    // Add FAQ row
    document.getElementById('btn-add-faq')?.addEventListener('click', () => addFaqRow());

    // Submit
    document.getElementById('service-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await save();
    });

    // Uploader (Usa Utils)
    Utils.bindUploader({
        fileId: "service_img_file",
        previewId: "service_img_preview",
        btnId: "btn-upload-service",
        inputUrlId: "service_image",
        folder: "services"
    });

    // Live Preview Listeners
    const inputs = ['service_title', 'service_desc', 'service_icon', 'service_color', 'service_hook', 'service_benefits', 'service_cta', 'service_image'];
    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updatePreview);
    });
}

// --- FORM LOGIC ---

function openModal(id = null) {
    const form = document.getElementById('service-form');
    form.reset();
    document.getElementById('service_id').value = '';
    document.getElementById('faqs-container').innerHTML = '';
    faqCounter = 0;
    document.getElementById('modal-service').classList.remove('hidden');

    if (!id) {
        document.getElementById('modal-title').innerText = 'Nuevo Servicio';
        document.getElementById('service_key').disabled = false;
        document.getElementById('service_active').checked = true;
    } else {
        const svc = servicesData.find(x => x.id === id);
        if (!svc) return;

        document.getElementById('modal-title').innerText = 'Editar Servicio';
        document.getElementById('service_id').value = svc.id;
        document.getElementById('service_key').value = svc.key;
        document.getElementById('service_key').disabled = true; // Key no editable
        document.getElementById('service_title').value = svc.title;
        document.getElementById('service_desc').value = svc.short_desc || '';
        document.getElementById('service_color').value = svc.color || 'purple';
        document.getElementById('service_icon').value = svc.icon || '';
        document.getElementById('service_hook').value = svc.hook || '';
        document.getElementById('service_cta').value = svc.cta || '';
        document.getElementById('service_image').value = svc.image_url || '';
        document.getElementById('service_active').checked = svc.active;

        // Arrays
        if (svc.benefits && Array.isArray(svc.benefits)) {
            document.getElementById('service_benefits').value = svc.benefits.join('\n');
        }
        if (svc.faqs && Array.isArray(svc.faqs)) {
            svc.faqs.forEach(f => addFaqRow(f.q, f.a));
        }
    }
    updatePreview();
}

function closeModal() {
    document.getElementById('modal-service').classList.add('hidden');
}

function addFaqRow(q = '', a = '') {
    const container = document.getElementById('faqs-container');
    const div = document.createElement('div');
    div.className = 'bg-white p-3 border rounded-lg relative group';
    div.innerHTML = `
        <button type="button" onclick="this.parentElement.remove(); document.getElementById('service_title').dispatchEvent(new Event('input'));" 
            class="absolute top-2 right-2 text-gray-400 hover:text-red-500">
            <i class="fas fa-trash"></i>
        </button>
        <input type="text" class="faq-q w-full border-b mb-2 pb-1 text-sm font-semibold outline-none" placeholder="Pregunta" value="${Utils.escapeHtml(q)}">
        <textarea class="faq-a w-full text-sm text-gray-600 outline-none resize-none" rows="2" placeholder="Respuesta">${a}</textarea>
    `;
    container.appendChild(div);
    
    // Listeners para preview en los nuevos inputs
    div.querySelectorAll('input, textarea').forEach(el => {
        el.addEventListener('input', updatePreview);
    });
    updatePreview(); // Actualizar preview al agregar
}

// --- PREVIEW LOGIC ---

function updatePreview() {
    // Get values
    const title = document.getElementById('service_title').value || 'Título';
    const desc = document.getElementById('service_desc').value || 'Descripción...';
    const hook = document.getElementById('service_hook').value || 'Hook...';
    const cta = document.getElementById('service_cta').value || 'Botón';
    const icon = document.getElementById('service_icon').value || 'fas fa-heart';
    const color = document.getElementById('service_color').value || 'purple';
    const imgUrl = document.getElementById('service_image').value;
    
    // Update text
    document.getElementById('preview_title').innerText = title;
    document.getElementById('preview_desc').innerText = desc;
    document.getElementById('preview_hook').innerText = hook;
    document.getElementById('preview_cta').innerText = cta;
    
    // Update Icon & Color
    const iconEl = document.getElementById('preview_icon');
    iconEl.className = icon;
    
    const wrapper = document.getElementById('preview_icon_wrapper');
    const btn = document.getElementById('preview_cta');
    
    // Simple color logic for preview
    wrapper.className = `w-16 h-16 rounded-xl flex items-center justify-center text-2xl bg-${color}-100 text-${color}-600`;
    btn.className = `w-full bg-${color}-600 text-white py-2 rounded-lg font-semibold`;

    // Benefits List
    const benTxt = document.getElementById('service_benefits').value;
    const benList = document.getElementById('preview_benefits');
    benList.innerHTML = benTxt.split('\n').filter(x => x.trim()).map(b => 
        `<li class="flex gap-2"><i class="fas fa-check-circle text-green-500 mt-1"></i><span>${Utils.escapeHtml(b)}</span></li>`
    ).join('');

    // FAQs List
    const faqList = document.getElementById('preview_faqs');
    const faqEls = document.querySelectorAll('#faqs-container > div');
    faqList.innerHTML = Array.from(faqEls).map(el => {
        const q = el.querySelector('.faq-q').value;
        const a = el.querySelector('.faq-a').value;
        return `<div class="bg-gray-50 p-2 rounded"><p class="font-bold text-xs">${q}</p><p class="text-xs text-gray-500">${a}</p></div>`;
    }).join('');

    // Image
    const prevImg = document.getElementById('preview_image');
    if (imgUrl) {
        prevImg.src = imgUrl;
        prevImg.classList.remove('hidden');
    } else {
        prevImg.classList.add('hidden');
    }
}

// --- SAVE LOGIC ---

async function save() {
    const id = document.getElementById('service_id').value;
    const key = document.getElementById('service_key').value.trim().toLowerCase();

    // Collect FAQs
    const faqs = [];
    document.querySelectorAll('#faqs-container > div').forEach(div => {
        const q = div.querySelector('.faq-q').value.trim();
        const a = div.querySelector('.faq-a').value.trim();
        if (q && a) faqs.push({ q, a });
    });

    // Collect Benefits
    const benefits = document.getElementById('service_benefits').value.split('\n').map(x => x.trim()).filter(Boolean);

    const dataObj = {
        key,
        title: document.getElementById('service_title').value.trim(),
        short_desc: document.getElementById('service_desc').value.trim(),
        icon: document.getElementById('service_icon').value.trim(),
        color: document.getElementById('service_color').value,
        hook: document.getElementById('service_hook').value.trim(),
        cta: document.getElementById('service_cta').value.trim(),
        image_url: document.getElementById('service_image').value.trim(),
        active: document.getElementById('service_active').checked,
        benefits,
        faqs,
        updated_at: new Date().toISOString()
    };

    let error;
    if (id) {
        const res = await supabase.from('services').update(dataObj).eq('id', id);
        error = res.error;
    } else {
        const res = await supabase.from('services').insert([dataObj]);
        error = res.error;
    }

    if (error) {
        alert('❌ Error: ' + error.message);
    } else {
        closeModal();
        load();
        alert('✅ Servicio guardado.');
    }
}

// --- PUBLIC ---

export function edit(id) { openModal(id); }

export async function remove(id) {
    if (confirm('¿Eliminar servicio?')) {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (!error) load();
        else alert(error.message);
    }
}

export async function toggleActive(id) {
    const svc = servicesData.find(x => x.id === id);
    if (!svc) return;

    const { error } = await supabase.from('services').update({ active: !svc.active }).eq('id', id);
    if (!error) load();
}