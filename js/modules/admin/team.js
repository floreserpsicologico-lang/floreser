import { supabase } from '../../supabaseClient.js';
import * as Utils from '../../utils.js';

let teamData = [];

export async function load() {
    const container = document.getElementById('team-list');
    if (!container) return;

    container.innerHTML = '<p class="text-gray-400 text-sm">Cargando equipo...</p>';
    const { data, error } = await supabase.from('team').select('*').order('id');

    if (error) return container.innerHTML = '<p class="text-red-500">Error.</p>';
    
    teamData = data || [];
    render();
}


function render() {
    const container = document.getElementById('team-list');
    if (!teamData.length) return container.innerHTML = '<p class="text-gray-500 py-4 text-center">No hay miembros.</p>';

    const colorMap = {
        blue: 'bg-blue-50 border-blue-200',
        emerald: 'bg-emerald-50 border-emerald-200',
        green: 'bg-green-50 border-green-200',
        red: 'bg-red-50 border-red-200',
        yellow: 'bg-yellow-50 border-yellow-200',
        purple: 'bg-purple-50 border-purple-200',
        pink: 'bg-pink-50 border-pink-200',
        indigo: 'bg-indigo-50 border-indigo-200',
        gray: 'bg-gray-50 border-gray-200'
    };

    container.innerHTML = teamData.map(member => {
        // 2. Busca la clase completa. Si no existe el color, usa gris por defecto.
        const colorKey = member.color || 'gray';
        const bgClass = colorMap[colorKey] || colorMap['gray']; 
        
        return `
        <div class="border p-4 rounded-lg flex justify-between items-start ${bgClass} hover:shadow-md transition">
            <div class="flex-1">
                <div class="flex items-center gap-2">
                    <p class="font-bold text-gray-800">${Utils.escapeHtml(member.name)}</p>
                    ${!member.active ? '<span class="text-xs bg-red-100 text-red-600 px-2 rounded">Inactivo</span>' : ''}
                </div>
                <p class="text-sm text-gray-600 font-medium">${Utils.escapeHtml(member.role)}</p>
                ${member.cmp ? `<p class="text-xs text-gray-500 mt-1">CMP/CPsP: ${Utils.escapeHtml(member.cmp)}</p>` : ''}
            </div>
            <div class="flex flex-col gap-1">
                <button onclick="window.editTeam(${member.id})" class="text-blue-500 hover:text-blue-700 p-2"><i class="fas fa-pen"></i></button>
                <button onclick="window.toggleTeamActive(${member.id})" class="text-gray-500 hover:text-gray-700 p-2" title="Activar/Desactivar"><i class="fas fa-power-off"></i></button>
                <button onclick="window.deleteTeam(${member.id})" class="text-red-500 hover:text-red-700 p-2"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}

export function setupEvents() {
    document.getElementById('add-team-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await save();
    });
    document.getElementById('btn-cancel-team')?.addEventListener('click', cancelEdit);
}

function cancelEdit() {
    document.getElementById('add-team-form').reset();
    document.getElementById('team_id_edit').value = '';
    document.getElementById('team_active').checked = true;
    document.getElementById('team-form-title').innerHTML = '<i class="fas fa-user-plus mr-2"></i>Añadir Miembro';
    document.getElementById('btn-cancel-team').classList.add('hidden');
}

async function save() {
    const id = document.getElementById('team_id_edit').value;
    const dataObj = {
        name: document.getElementById('new_team_name').value.trim(),
        role: document.getElementById('new_team_role').value.trim(),
        cmp: document.getElementById('new_team_cmp').value.trim(),
        color: document.getElementById('new_team_color').value.trim(),
        description: document.getElementById('new_team_desc').value.trim(),
        active: document.getElementById('team_active').checked,
        updated_at: new Date().toISOString()
    };

    let error;
    if (id) {
        const res = await supabase.from('team').update(dataObj).eq('id', id);
        error = res.error;
    } else {
        const res = await supabase.from('team').insert([dataObj]);
        error = res.error;
    }

    if (error) alert('❌ Error: ' + error.message);
    else {
        cancelEdit();
        load();
        alert('✅ Miembro guardado.');
    }
}

// --- PÚBLICAS ---

export function edit(id) {
    const m = teamData.find(x => x.id === id);
    if (!m) return;
    document.getElementById('team_id_edit').value = m.id;
    document.getElementById('new_team_name').value = m.name;
    document.getElementById('new_team_role').value = m.role;
    document.getElementById('new_team_cmp').value = m.cmp || '';
    document.getElementById('new_team_color').value = m.color || '';
    document.getElementById('new_team_desc').value = m.description || '';
    document.getElementById('team_active').checked = m.active;

    document.getElementById('team-form-title').innerText = 'Editar Miembro';
    document.getElementById('btn-cancel-team').classList.remove('hidden');
    document.getElementById('add-team-form').scrollIntoView({ behavior: 'smooth' });
}

export async function remove(id) {
    if (confirm('¿Eliminar miembro del equipo?')) {
        const { error } = await supabase.from('team').delete().eq('id', id);
        if (!error) load();
    }
}

export async function toggleActive(id) {
    const m = teamData.find(x => x.id === id);
    if (!m) return;
    await supabase.from('team').update({ active: !m.active }).eq('id', id);
    load();
}