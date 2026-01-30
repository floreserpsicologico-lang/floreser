import { supabase } from './supabaseClient.js';

let serviceDataGlobal = {};
let locationsData = [];
let activeLocationKey = null;

let heroSlides = [];
let currentHeroSlide = 0;

// --- CARGAR DATOS AL INICIO ---
window.addEventListener('load', async () => {
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
    initScrollSpy();

    await Promise.all([
        loadHomeContent(),
        loadLocations(),
        loadSlides(),
        loadServices(),
        loadTeam(),
        loadTestimonials()
    ]);

    setInterval(nextHeroSlide, 5000);
});

async function loadHomeContent() {
    const { data, error } = await supabase
        .from('home_content')
        .select('*')
        .eq('id', 1)
        .single();

    if (error) {
        console.error('❌ Error loadHomeContent:', error);
        const valuesWrap = document.getElementById('values-cards');
        if (valuesWrap) valuesWrap.innerHTML = '<p class="text-red-500 md:col-span-3 text-center">Error cargando valores.</p>';
        const aboutText = document.getElementById('about-text');
        if (aboutText) aboutText.textContent = 'No se pudo cargar el contenido en este momento.';
        return;
    }

    const cards = Array.isArray(data.values_cards) ? data.values_cards : [];
    renderValues(cards);

    const about = data.about || {};
    renderAbout(about);
}

function renderValues(cards) {
    const wrap = document.getElementById('values-cards');
    if (!wrap) return;

    if (!cards.length) {
        wrap.innerHTML = '<p class="text-gray-500 md:col-span-3 text-center">No hay valores configurados.</p>';
        return;
    }

    wrap.innerHTML = cards.slice(0, 3).map((c) => {
        const icon = c.icon || 'fas fa-star';
        const title = c.title || 'Título';
        const desc = c.desc || '';
        return `
            <div class="p-6 rounded-xl hover:shadow-xl transition duration-300 border border-transparent hover:border-gray-100">
                <div class="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    <i class="${icon}"></i>
                </div>
                <h3 class="text-xl font-bold mb-2">${escapeHtml(title)}</h3>
                <p class="text-gray-500">${escapeHtml(desc)}</p>
            </div>
        `;
    }).join('');
}

function renderAbout(about) {
    const tagEl = document.getElementById('about-tag');
    const titleEl = document.getElementById('about-title');
    const textEl = document.getElementById('about-text');
    const imgEl = document.getElementById('about-image');
    const bulletsEl = document.getElementById('about-bullets');
    const ctaEl = document.getElementById('about-cta');

    if (tagEl) tagEl.textContent = about.tag || 'Sobre Nosotros';
    if (titleEl) titleEl.textContent = about.title || 'Compromiso con tu salud mental';
    if (textEl) textEl.textContent = about.text || '';

    if (imgEl && about.image_url) imgEl.src = about.image_url;

    const bullets = Array.isArray(about.bullets) ? about.bullets : [];
    if (bulletsEl) {
        bulletsEl.innerHTML = bullets.length
            ? bullets.map(b => `
                <li class="flex items-center text-gray-700">
                    <i class="fas fa-check-circle text-brand-600 mr-3 text-xl"></i>
                    <span class="font-bold">${escapeHtml(b)}</span>
                </li>
            `).join('')
            : '<li class="text-gray-500">Sin items configurados.</li>';
    }

    if (ctaEl) {
        ctaEl.textContent = about.cta_text || 'Conocer más';
        ctaEl.href = about.cta_href || '#contacto';
    }
}

function escapeHtml(str) {
    return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function normalizeWsp(numRaw) {
    const digits = String(numRaw || '').replace(/\D/g, '');
    if (digits.startsWith('51') && digits.length > 9) return digits.slice(2);
    return digits;
}

async function loadLocations() {
    const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: true });

    if (error) {
        console.error('❌ Error cargando sedes:', error);
        document.getElementById('location-buttons').innerHTML =
            '<p class="text-red-500">Error cargando sedes.</p>';
        return;
    }

    locationsData = data || [];
    if (!locationsData.length) {
        document.getElementById('location-buttons').innerHTML =
            '<p class="text-gray-500">No hay sedes configuradas.</p>';
        return;
    }

    const buttons = document.getElementById('location-buttons');
    buttons.innerHTML = '';

    locationsData.forEach((loc) => {
        const btn = document.createElement('button');
        btn.id = `btn-${loc.key}`;
        btn.className = 'px-8 py-3 rounded-full font-bold transition duration-300 border';
        btn.textContent = `Sede ${loc.ciudad || loc.key}`;
        btn.onclick = () => setLocation(loc.key);
        buttons.appendChild(btn);
    });

    const selectSede = document.getElementById('sede');
    if (selectSede) {
        selectSede.innerHTML = '';
        locationsData.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc.key;
            opt.textContent = `Sede ${loc.ciudad || loc.key}`;
            selectSede.appendChild(opt);
        });

        selectSede.addEventListener('change', (e) => setLocation(e.target.value));
    }

    setLocation(locationsData[0].key);
}

window.setLocation = (key) => {
    const loc = locationsData.find(x => x.key === key);
    if (!loc) return;

    activeLocationKey = key;

    locationsData.forEach(l => {
        const btn = document.getElementById(`btn-${l.key}`);
        if (!btn) return;

        const isActive = l.key === key;
        btn.classList.remove('bg-brand-600', 'text-white', 'shadow-lg', 'border-transparent');
        btn.classList.remove('bg-white', 'text-gray-600', 'border-gray-300');

        if (isActive) btn.classList.add('bg-brand-600', 'text-white', 'shadow-lg', 'border-transparent');
        else btn.classList.add('bg-white', 'text-gray-600', 'border-gray-300');
    });

    const sedeNombre = loc.ciudad || loc.key;
    const txtSede = document.getElementById('nombre-sede-texto');
    if (txtSede) txtSede.textContent = sedeNombre;

    document.getElementById('location-title').textContent = `Sede ${sedeNombre}`;
    document.getElementById('location-address').innerHTML =
        loc.address_html || '<span class="text-gray-400">Sin dirección</span>';

    document.getElementById('location-phone-text').textContent =
        loc.whatsapp || 'Sin WhatsApp';

    const wspLink = document.getElementById('location-wsp-link');
    const wsp = normalizeWsp(loc.whatsapp);
    if (wspLink) wspLink.href = wsp ? `https://wa.me/51${wsp}` : '#';

    const horarioDisplay = document.getElementById('horario-display');
    if (horarioDisplay) horarioDisplay.innerHTML = loc.horario || 'Consulta nuestros horarios por WhatsApp';

    const emailEl = document.getElementById('email-contact');
    if (emailEl) emailEl.textContent = loc.email || 'Sin email';

    const map = document.getElementById('map-container');
    if (map) {
        if (loc.map_iframe) {
            // Crear un contenedor temporal para parsear el iframe
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = loc.map_iframe;
            const iframe = tempDiv.querySelector('iframe');
            
            if (iframe) {
                // Aplicar las características del mapa como en la configuración
                iframe.setAttribute('width', '100%');
                iframe.setAttribute('height', '100%');
                iframe.setAttribute('frameborder', '0');
                iframe.setAttribute('scrolling', 'no');
                iframe.setAttribute('marginheight', '0');
                iframe.setAttribute('marginwidth', '0');
                iframe.setAttribute('class', 'absolute inset-0');
                iframe.setAttribute('loading', 'lazy');
                
                // Si no tiene title, agregar uno genérico
                if (!iframe.getAttribute('title')) {
                    iframe.setAttribute('title', `Ubicación ${sedeNombre}`);
                }
                
                map.innerHTML = tempDiv.innerHTML;
            } else {
                map.innerHTML = loc.map_iframe;
            }
        } else {
            map.innerHTML = '<p class="text-gray-500">Sede sin mapa configurado.</p>';
        }
    }

    const selectSede = document.getElementById('sede');
    if (selectSede) selectSede.value = key;
};

async function loadSlides() {
    const { data } = await supabase.from('hero_slides').select('*').order('id');
    if (data && data.length > 0) {
        heroSlides = data;
        updateCarousel();

        const dotsContainer = document.getElementById('hero-dots');
        dotsContainer.innerHTML = '';
        heroSlides.forEach((_, idx) => {
            const btn = document.createElement('button');
            btn.className = `w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 cursor-pointer shadow-sm ${idx === 0 ? 'bg-brand-600' : 'bg-gray-300'}`;
            btn.onclick = () => setSlide(idx);
            btn.id = `dot-${idx}`;
            dotsContainer.appendChild(btn);
        });
    }
}

async function loadServices() {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('id');
    if (error) {
        console.error('❌ Error loadServices:', error);
        return;
    }

    const grid = document.getElementById('services-grid');
    const select = document.getElementById('servicio-select');

    if (data && data.length > 0) {
        grid.innerHTML = '';
        select.innerHTML = '<option>Consulta General</option>';

        data.forEach(service => {
            serviceDataGlobal[service.key] = service;

            const opt = document.createElement('option');
            opt.value = service.title;
            opt.textContent = service.title;
            select.appendChild(opt);

            const colorMap = {
                purple: 'bg-purple-100 text-purple-600 border-purple-200',
                emerald: 'border-emerald-500 text-emerald-600 bg-emerald-200',
                blue: 'bg-blue-100 text-blue-600 border-blue-200',
                green: 'bg-green-100 text-green-600 border-green-200',
                pink: 'bg-pink-100 text-pink-600 border-pink-200',
                orange: 'bg-orange-100 text-orange-600 border-orange-200',
                teal: 'bg-teal-100 text-teal-600 border-teal-200',
                indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
                rose: 'bg-rose-100 text-rose-600 border-rose-200'
            };

            const theme = colorMap[service.color] || colorMap.purple;
            const [bgClass, textClass] = theme.split(' ');

            const card = `
                <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl transition duration-300 group flex flex-col items-start relative overflow-hidden">
                    <div class="w-14 h-14 ${bgClass} ${textClass} rounded-lg flex items-center justify-center mb-6 transition">
                        <i class="${service.icon} text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-gray-900">${service.title}</h3>
                    <p class="text-gray-500 mb-4 flex-grow">${service.short_desc}</p>
                    <button onclick="window.openModal('${service.key}')" class="text-brand-600 font-bold hover:underline cursor-pointer">
                        Saber más <i class="fas fa-arrow-right ml-1 text-sm"></i>
                    </button>
                </div>
            `;
            grid.innerHTML += card;
        });
    }
}

async function loadTeam() {
    const { data, error } = await supabase
        .from('team')
        .select('*')
        .eq('active', true)
        .order('id');

    if (error) {
        console.error('❌ Error loadTeam:', error);
        return;
    }

    const slider = document.getElementById('team-slider');

    if (data && data.length > 0) {
        slider.innerHTML = '';
        data.forEach(member => {
            const borderMap = {
                blue: 'border-blue-600 text-blue-600 bg-blue-200',
                emerald: 'border-emerald-500 text-emerald-600 bg-emerald-200',
                green: 'border-green-600 text-green-600 bg-green-200',
                purple: 'border-purple-500 text-purple-600 bg-purple-200',
                pink: 'border-pink-500 text-pink-600 bg-pink-200',
                orange: 'border-orange-500 text-orange-600 bg-orange-200',
                teal: 'border-teal-500 text-teal-600 bg-teal-200',
                indigo: 'border-indigo-500 text-indigo-600 bg-indigo-200',
                rose: 'border-rose-500 text-rose-600 bg-rose-200'
            };
            const theme = borderMap[member.color] || 'border-gray-500 text-gray-600 bg-gray-200';
            const [borderColor, textColor] = theme.split(' ');

            const card = `
                <div class="flex-none w-[85%] md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] bg-white p-8 rounded-lg shadow-lg border-t-4 ${borderColor} hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 snap-center">
                    <div class="flex items-start justify-between mb-4">
                        <div>
                            <h3 class="text-2xl font-serif font-bold text-gray-900">${member.name}</h3>
                            <span class="${textColor} font-bold text-xs uppercase tracking-wider block mt-1">${member.role}</span>
                        </div>
                        <i class="fas fa-user-md ${textColor.replace('600','200')} text-3xl"></i>
                    </div>
                    <hr class="border-gray-100 my-4">
                    <p class="text-gray-600 leading-relaxed mb-6">${member.description}</p>
                    ${member.cmp ? `<div class="flex items-center text-sm text-gray-400"><i class="fas fa-id-card mr-2"></i> ${member.cmp}</div>` : ''}
                </div>
            `;
            slider.innerHTML += card;
        });
    }
}

async function loadTestimonials() {
    const { data } = await supabase.from('testimonials').select('*').order('id');
    const grid = document.getElementById('testimonials-grid');

    if (data && data.length > 0) {
        grid.innerHTML = '';
        data.forEach((test, idx) => {
            const colors = ['bg-brand-500', 'bg-pink-500', 'bg-purple-500', 'bg-blue-500'];
            const color = colors[idx % colors.length];
            const initial = test.name.charAt(0).toUpperCase();

            let videoSrc = test.video_url;
            if (videoSrc.includes('view') && !videoSrc.includes('preview')) {
                videoSrc = videoSrc.replace('/view', '/preview');
            }

            const card = `
                <div class="flex flex-col w-full max-w-[300px] shadow-2xl rounded-2xl overflow-hidden transform transition duration-300 hover:scale-105 border border-gray-200 bg-white">
                    <div class="drive-iframe-container bg-black">
                        <iframe src="${videoSrc}" allow="autoplay" allowfullscreen></iframe>
                    </div>
                    <div class="p-4 bg-white">
                        <div class="flex text-yellow-400 text-xs mb-2">
                            <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
                        </div>
                        <div class="flex items-center">
                            <div class="w-8 h-8 rounded-full ${color} flex items-center justify-center text-white font-bold text-xs mr-2">
                                ${initial}
                            </div>
                            <div>
                                <h4 class="font-bold text-sm text-gray-900 leading-tight">${test.name}</h4>
                                <span class="text-[10px] text-gray-500 uppercase tracking-wide">Familia FloreSer</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            grid.innerHTML += card;
        });
    }
}

window.setSlide = (index) => {
    currentHeroSlide = index;
    updateCarousel();
};

window.nextHeroSlide = () => {
    if (heroSlides.length > 0) {
        currentHeroSlide = (currentHeroSlide + 1) % heroSlides.length;
        updateCarousel();
    }
};

function updateCarousel() {
    if (heroSlides.length === 0) return;
    const slide = heroSlides[currentHeroSlide];

    const content = document.getElementById('hero-content');
    content.style.opacity = '0';
    content.style.transform = 'translateY(10px)';

    setTimeout(() => {
        document.getElementById('hero-bg').style.backgroundImage = `url('${slide.image_url}')`;
        document.getElementById('hero-subtitle').textContent = slide.subtitle;
        document.getElementById('hero-title').innerHTML = slide.title;
        document.getElementById('hero-desc').textContent = slide.description;

        document.querySelectorAll('[id^="dot-"]').forEach((dot, idx) => {
            if (idx === currentHeroSlide) {
                dot.classList.remove('bg-gray-300');
                dot.classList.add('bg-brand-600');
            } else {
                dot.classList.remove('bg-brand-600');
                dot.classList.add('bg-gray-300');
            }
        });

        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
    }, 500);
}

window.openModal = (key) => {
    const data = serviceDataGlobal[key];
    if (!data) return;

    const modal = document.getElementById('serviceModal');
    const backdrop = document.getElementById('modalBackdrop');
    const card = document.getElementById('modalCard');
    
    // RESETEAR CLASES DE ANIMACIÓN ANTES DE ABRIR
    backdrop.classList.remove('modal-backdrop-enter', 'modal-backdrop-leave');
    card.classList.remove('modal-card-enter', 'modal-card-leave');
    
    // Actualizar contenido
    document.getElementById('modalTitle').textContent = data.title;
    const imgEl = document.getElementById('modalImage');
    imgEl.src = data.image_url || 'img/default.jpg';
    document.getElementById('modalHook').textContent = data.hook || '';

    const benefitsList = document.getElementById('modalBenefits');
    benefitsList.innerHTML = '';
    (data.benefits || []).forEach(b => {
        const li = document.createElement('li');
        li.textContent = b;
        benefitsList.appendChild(li);
    });

    const faqContainer = document.getElementById('modalFaq');
    faqContainer.innerHTML = '';
    (data.faqs || []).forEach(f => {
        const div = document.createElement('div');
        div.innerHTML = `<p class="font-bold text-xs text-brand-700 uppercase mb-1">${f.q}</p><p class="text-sm text-gray-600 leading-relaxed">${f.a}</p>`;
        faqContainer.appendChild(div);
    });

    document.getElementById('modalCtaBtn').innerHTML = `${data.cta || 'Agendar Cita'} <i class="fas fa-arrow-right ml-2"></i>`;

    // Mostrar el modal
    modal.classList.remove('hidden');
    
    // RESETEAR SCROLL DESPUÉS DE MOSTRAR (importante para que funcione)
    requestAnimationFrame(() => {
        modal.scrollTop = 0;
        
        // Aplicar animaciones de entrada
        backdrop.classList.add('modal-backdrop-enter');
        card.classList.add('modal-card-enter');
    });
};

window.closeServiceModal = () => {
    const modal = document.getElementById('serviceModal');
    const backdrop = document.getElementById('modalBackdrop');
    const card = document.getElementById('modalCard');

    backdrop.classList.remove('modal-backdrop-enter');
    card.classList.remove('modal-card-enter');
    backdrop.classList.add('modal-backdrop-leave');
    card.classList.add('modal-card-leave');

    setTimeout(() => {
        modal.classList.add('hidden');
        backdrop.classList.remove('modal-backdrop-leave');
        card.classList.remove('modal-card-leave');
    }, 300);
};

window.toggleMobileMenu = () => {
    document.getElementById('mobile-menu').classList.toggle('hidden');
};

window.scrollTeam = (direction) => {
    const container = document.getElementById('team-slider');
    const scrollAmount = 300;
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
};

window.handleSubmit = async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const servicio = document.getElementById('servicio-select').value;
    const sedeKey = document.getElementById('sede').value;
    const mensaje = document.getElementById('mensaje').value.trim();
    const telefono = document.getElementById('telefono').value.trim();

    const loc = locationsData.find(x => x.key === sedeKey) || locationsData.find(x => x.key === activeLocationKey);
    const num = normalizeWsp(loc?.whatsapp || '');

    if (!num) {
        alert('⚠️ Esta sede no tiene WhatsApp configurado.');
        return;
    }

    try {
        const { error } = await supabase.from('leads').insert([{
            nombre,
            telefono: telefono || null,
            servicio: servicio || null,
            sede_key: sedeKey || null,
            mensaje: mensaje || null,
            whatsapp: loc?.whatsapp || null,
            estado: 'nuevo',
            origen: 'web'
        }]);

        if (error) {
            console.error('❌ Error insert lead:', error);
        }
    } catch (err) {
        console.error('❌ Exception insert lead:', err);
    }

    const sedeNombre = loc?.ciudad ? `Sede ${loc.ciudad}` : `Sede ${sedeKey}`;

    let text = `Hola, mi nombre es *${nombre}*.\nEstoy interesado en *${servicio}* en *${sedeNombre}*.\n`;
    if (telefono) text += `Mi número es: ${telefono}.\n`;
    if (mensaje) text += `Mensaje: ${mensaje}`;

    window.open(`https://wa.me/51${num}?text=${encodeURIComponent(text)}`, '_blank');
};


window.goToContact = () => {
    window.closeServiceModal();
    document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
};

window.initScrollSpy = () => {
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-link");
    window.addEventListener('scroll', () => {
        let current = "";
        const scrollPosition = window.scrollY + 150;
        sections.forEach(section => {
            if (section.offsetTop <= scrollPosition && (section.offsetTop + section.offsetHeight) > scrollPosition) {
                current = section.getAttribute("id");
            }
        });
        navLinks.forEach(link => {
            link.classList.remove("active", "border-[#702F8A]", "text-[#702F8A]");
            link.classList.add("border-transparent", "text-gray-600");
            if (link.getAttribute("href").includes(current) && current !== "") {
                link.classList.add("active", "border-[#702F8A]", "text-[#702F8A]");
                link.classList.remove("border-transparent", "text-gray-600");
            }
        });
    });
};