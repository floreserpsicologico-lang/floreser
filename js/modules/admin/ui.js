// Variable interna para saber qué input está esperando un icono
let activeIconInputId = null;

// Lista de iconos disponibles (FontAwesome 6 Free)
const ICONS = [
    "fa-solid fa-heart", "fa-solid fa-brain", "fa-solid fa-star", "fa-solid fa-hand-holding-heart",
    "fa-solid fa-user-doctor", "fa-solid fa-users", "fa-solid fa-user-group", "fa-solid fa-comments",
    "fa-solid fa-comment-dots", "fa-solid fa-face-smile", "fa-solid fa-seedling", "fa-solid fa-leaf",
    "fa-solid fa-spa", "fa-solid fa-dove", "fa-solid fa-shield-heart", "fa-solid fa-check",
    "fa-solid fa-check-circle", "fa-solid fa-circle-check", "fa-solid fa-circle-info", "fa-solid fa-book",
    "fa-solid fa-graduation-cap", "fa-solid fa-hands", "fa-solid fa-handshake", "fa-solid fa-clock",
    "fa-solid fa-calendar", "fa-solid fa-location-dot", "fa-solid fa-phone", "fa-solid fa-envelope",
    "fa-solid fa-house", "fa-solid fa-people-arrows", "fa-solid fa-user", "fa-solid fa-user-shield",
    "fa-solid fa-bolt", "fa-solid fa-fire", "fa-brands fa-whatsapp", "fa-brands fa-facebook", 
    "fa-brands fa-instagram", "fa-brands fa-tiktok", "fa-brands fa-youtube"
];

// =======================
// CONTROL DE VISTAS
// =======================

export function showLogin() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
}

export function showDashboard() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');
}

// =======================
// TABS (Pestañas)
// =======================

export function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target'); // 'info', 'slides', etc.

            // 1. Ocultar todos los contenidos
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });

            // 2. Desactivar todos los botones
            tabButtons.forEach(b => {
                b.classList.remove('active', 'bg-white', 'shadow');
                b.classList.add('bg-gray-200', 'text-gray-700'); // Estilo inactivo
            });

            // 3. Mostrar el contenido seleccionado
            const targetContent = document.getElementById(`tab-${targetId}`);
            if (targetContent) {
                targetContent.classList.remove('hidden');
            }

            // 4. Activar el botón clickeado
            btn.classList.add('active', 'bg-white', 'shadow');
            btn.classList.remove('bg-gray-200', 'text-gray-700');
        });
    });
}

// =======================
// ICON PICKER
// =======================

export function initIconPicker() {
    // 1. Renderizar la grilla de iconos al inicio (o al abrir, pero aquí está bien)
    renderIconGrid("");

    // 2. Buscador del modal
    document.getElementById('iconSearch')?.addEventListener('input', (e) => {
        renderIconGrid(e.target.value);
    });

    // 3. Cerrar modal
    document.getElementById('btn-close-icon-picker')?.addEventListener('click', closeIconPicker);

    // 4. Asignar eventos a los botones que abren el picker
    // Buscamos botones con la clase .btn-icon-picker y el atributo data-input
    document.querySelectorAll('.btn-icon-picker').forEach(btn => {
        btn.addEventListener('click', () => {
            const inputId = btn.getAttribute('data-input');
            openIconPicker(inputId);
        });
    });
}

function renderIconGrid(filterText) {
    const grid = document.getElementById('iconGrid');
    if (!grid) return;

    const term = filterText.toLowerCase();
    const filteredIcons = ICONS.filter(icon => icon.includes(term));

    grid.innerHTML = filteredIcons.map(iconClass => `
        <button type="button" 
            class="border border-gray-200 rounded-xl p-3 hover:shadow-md hover:border-purple-500 hover:text-purple-600 transition flex items-center justify-center text-gray-600 text-xl"
            onclick="window.selectIcon('${iconClass}')">
            <i class="${iconClass}"></i>
        </button>
    `).join('');
}

// Función global interna para seleccionar el icono (inyectada en window para el onclick del HTML string arriba)
window.selectIcon = (iconClass) => {
    if (activeIconInputId) {
        const input = document.getElementById(activeIconInputId);
        if (input) {
            input.value = iconClass;
            // Disparar evento 'input' para que si hay una vista previa escuchando, se actualice
            input.dispatchEvent(new Event('input')); 
        }
    }
    closeIconPicker();
};

export function openIconPicker(inputId) {
    activeIconInputId = inputId;
    const modal = document.getElementById('iconPicker');
    const search = document.getElementById('iconSearch');
    
    if (modal) {
        modal.classList.remove('hidden');
        if (search) {
            search.value = '';
            search.focus();
            renderIconGrid(""); // Reiniciar grid
        }
    }
}

export function closeIconPicker() {
    activeIconInputId = null;
    document.getElementById('iconPicker')?.classList.add('hidden');
}