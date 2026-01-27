import * as Auth from './modules/admin/auth.js';
import * as UI from './modules/admin/ui.js';
import * as Locations from './modules/admin/locations.js';
import * as Services from './modules/admin/services.js';
import * as Slides from './modules/admin/slides.js';
import * as Team from './modules/admin/team.js';
import * as Testimonials from './modules/admin/testimonials.js';
import * as Home from './modules/admin/home.js';
import * as Leads from './modules/admin/leads.js';

// ==========================================
// 1. INICIALIZACIÓN (Entry Point)
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Admin Panel Iniciando...');

    // Verificar Sesión
    const session = await Auth.checkSession();
    
    if (session) {
        UI.showDashboard();
        initModules(); // Cargar listeners y datos
    } else {
        UI.showLogin();
    }

    // Listener del Formulario Login
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        await Auth.login(email, password);
    });

    // Listener Logout
    document.getElementById('btn-logout')?.addEventListener('click', Auth.logout);
});

// ==========================================
// 2. CARGA DE DATOS Y EVENTOS
// ==========================================
async function initModules() {
    // A. Configurar Tabs (Navegación)
    UI.initTabs();

    // B. Configurar Icon Picker Global
    UI.initIconPicker();

    // C. Inicializar Módulos Específicos
    // Cada módulo se encarga de sus propios botones y carga de datos
    
    // --- LOCATIONS ---
    await Locations.load(); 
    Locations.setupEvents(); // Asigna eventos a "Nueva Sede", "Guardar", etc.

    // --- SLIDES ---
    // (Cargamos perezosamente o al inicio, aquí cargamos todo para simplificar)
    await Slides.load();
    Slides.setupEvents();

    // --- SERVICES ---
    await Services.load();
    Services.setupEvents();

    // --- TEAM ---
    await Team.load();
    Team.setupEvents();

    // --- TESTIMONIALS ---
    await Testimonials.load();
    Testimonials.setupEvents();

    // --- HOME CONTENT ---
    await Home.load();
    Home.setupEvents();

    // --- LEADS ---
    // Leads suele tener muchos datos, a veces conviene cargarlo solo al hacer click en el tab,
    // pero para mantenerlo simple, cargamos la primera página aquí.
    await Leads.load();
    Leads.setupEvents();

    console.log('✅ Todos los módulos cargados.');
}

// ==========================================
// 3. EXPOSICIÓN GLOBAL (Para HTML dinámico)
// ==========================================
// Como generamos HTML con strings (innerHTML = `... onclick="editItem(1)" ...`),
// necesitamos que ciertas funciones sean accesibles desde el objeto `window`.

window.refreshAll = initModules; // Utilidad para depurar

// Exponemos las funciones de edición/eliminación de cada módulo
window.editLocation = Locations.edit;
window.deleteLocation = Locations.remove;

window.editService = Services.edit;
window.deleteService = Services.remove;
window.toggleServiceActive = Services.toggleActive;

window.editSlide = Slides.edit;
window.deleteSlide = Slides.remove;

window.editTeam = Team.edit;
window.deleteTeam = Team.remove;
window.toggleTeamActive = Team.toggleActive;

window.editTestimonial = Testimonials.edit;
window.deleteTestimonial = Testimonials.remove;

window.updateLeadStatus = Leads.updateStatus;

// Helpers de UI globales
window.openIconPicker = UI.openIconPicker;
window.closeIconPicker = UI.closeIconPicker;