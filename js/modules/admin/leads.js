import { supabase } from '../../supabaseClient.js';
import * as Utils from '../../utils.js';

let leadsData = [];
let searchTimer = null; // Para el debounce del buscador

/**
 * Carga leads aplicando filtros
 */
export async function load() {
    const tbody = document.getElementById('leads-tbody');
    if (!tbody) return;

    // Filtros del DOM
    const estado = document.getElementById('leads-filter-estado')?.value || '';
    const sede = document.getElementById('leads-filter-sede')?.value || '';
    const search = (document.getElementById('leads-search')?.value || '').trim();

    tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-gray-500">Cargando leads...</td></tr>';

    // Construcción de Query
    let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200); // Límite de seguridad

    if (estado) query = query.eq('estado', estado);
    if (sede) query = query.eq('sede_key', sede);

    if (search) {
        // Búsqueda en múltiples columnas
        const s = search.replace(/%/g, ''); // Sanitizar
        query = query.or(`nombre.ilike.%${s}%,telefono.ilike.%${s}%,servicio.ilike.%${s}%,sede_key.ilike.%${s}%`);
    }

    const { data, error } = await query;

    if (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    leadsData = data || [];
    render();
}

/**
 * Renderiza la tabla HTML
 */
function render() {
    const tbody = document.getElementById('leads-tbody');
    
    if (!leadsData.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-gray-400">No se encontraron resultados.</td></tr>';
        return;
    }

    tbody.innerHTML = leadsData.map(l => {
        // Color del badge según estado
        const badgeColor = 
            l.estado === 'nuevo' ? 'bg-yellow-100 text-yellow-800' :
            l.estado === 'contactado' ? 'bg-blue-100 text-blue-800' :
            l.estado === 'cerrado' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-700';

        return `
        <tr class="border-b hover:bg-gray-50 transition align-top">
            <td class="p-3 whitespace-nowrap text-xs text-gray-500">${Utils.fmtDate(l.created_at)}</td>
            <td class="p-3 font-semibold text-gray-800">${Utils.escapeHtml(l.nombre)}</td>
            <td class="p-3 text-sm">${Utils.escapeHtml(l.telefono)}</td>
            <td class="p-3 text-sm">${Utils.escapeHtml(l.servicio)}</td>
            <td class="p-3 text-sm uppercase text-gray-500">${Utils.escapeHtml(l.sede_key)}</td>
            <td class="p-3 text-sm max-w-[250px] truncate" title="${Utils.escapeHtml(l.mensaje)}">${Utils.escapeHtml(l.mensaje)}</td>
            <td class="p-3 text-sm">${Utils.escapeHtml(l.whatsapp || '-')}</td>
            <td class="p-3">
                <select 
                    onchange="window.updateLeadStatus('${l.id}', this.value)"
                    class="text-xs border rounded px-2 py-1 cursor-pointer outline-none font-semibold ${badgeColor}">
                    <option value="nuevo" ${l.estado === 'nuevo' ? 'selected' : ''}>Nuevo</option>
                    <option value="contactado" ${l.estado === 'contactado' ? 'selected' : ''}>Contactado</option>
                    <option value="cerrado" ${l.estado === 'cerrado' ? 'selected' : ''}>Cerrado</option>
                </select>
            </td>
        </tr>`;
    }).join('');
}

/**
 * Configura los eventos de filtro y descarga
 */
export function setupEvents() {
    // Filtros
    document.getElementById('leads-filter-estado')?.addEventListener('change', load);
    document.getElementById('leads-filter-sede')?.addEventListener('change', load);
    document.getElementById('btn-refresh-leads')?.addEventListener('click', load);

    // Búsqueda con Debounce (espera 300ms antes de buscar)
    document.getElementById('leads-search')?.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(load, 300);
    });

    // Exportar Excel
    document.getElementById('btn-download-leads')?.addEventListener('click', exportToXlsx);
}

/**
 * Actualiza el estado de un Lead
 */
export async function updateStatus(id, newStatus) {
    // Optimismo UI: No recargamos toda la tabla, confiamos en que funcionará.
    // Si falla, alertamos.
    const { error } = await supabase
        .from('leads')
        .update({ estado: newStatus })
        .eq('id', id);

    if (error) {
        alert('❌ Error actualizando estado: ' + error.message);
        load(); // Revertir cambios visuales recargando
    } else {
        // Actualizar visualmente el color del select (opcional, pero mejora UX)
        // Como estamos usando "onchange" inline, el valor ya cambió, solo falta el color.
        // Lo más simple es recargar suavemente para asegurar consistencia
        // load(); 
    }
}

/**
 * Exporta los datos visibles a Excel (usando la librería XLSX cargada en el HTML)
 */
function exportToXlsx() {
    if (!leadsData || !leadsData.length) {
        return alert('⚠️ No hay datos para exportar con los filtros actuales.');
    }

    // 1. Preparar Headers
    const header = ['Fecha', 'Nombre', 'Teléfono', 'Servicio', 'Sede', 'Mensaje', 'WhatsApp', 'Estado'];

    // 2. Preparar Datos
    const data = [
        header,
        ...leadsData.map(l => [
            Utils.fmtDate(l.created_at),
            l.nombre,
            l.telefono,
            l.servicio,
            l.sede_key,
            l.mensaje,
            l.whatsapp,
            l.estado
        ])
    ];

    // 3. Crear Workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);

    // 4. Ajustar ancho de columnas
    ws['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 20 },
        { wch: 10 }, { wch: 40 }, { wch: 15 }, { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Leads FloreSer");

    // 5. Descargar
    const dateStr = new Date().toISOString().slice(0,10);
    XLSX.writeFile(wb, `Leads_FloreSer_${dateStr}.xlsx`);
}