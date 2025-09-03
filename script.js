/* ---------- Helpers ---------- */
function normalizePhone(input, defaultCountry = '91') {
  let digits = String(input || '').replace(/\D/g, '');
  if (!digits) return '';
  digits = digits.replace(/^0+/, '');
  if (digits.length === 10) digits = defaultCountry + digits;
  return digits;
}

// Safer loader: returns {} if fetch fails (e.g., some in-app browsers)
async function loadJSON(path) {
  try {
    const res = await fetch(path + '?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('fetch ' + path + ' ' + res.status);
    return await res.json();
  } catch (err) {
    console.warn('loadJSON failed:', path, err);
    return {};
  }
}

function youtubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
    if (u.searchParams.get('v')) return u.searchParams.get('v');
    const parts = u.pathname.split('/');
    const i = parts.indexOf('embed');
    if (i >= 0 && parts[i + 1]) return parts[i + 1];
  } catch (e) {}
  return '';
}

/* ---------- Common (header/footer/CTA) ---------- */
async function hydrateCommon() {
  try {
    const settings = await loadJSON('content/settings.json');
    const biz = settings.business || {};

    const titleEls = document.querySelectorAll('#siteTitle');
    titleEls.forEach(el => { if (biz.name) el.textContent = biz.name; });

    document.querySelectorAll('[data-ig]').forEach(a => biz.instagram && (a.href = biz.instagram));
    document.querySelectorAll('[data-email]').forEach(a => biz.email && (a.href = 'mailto:' + biz.email));

    // WhatsApp buttons (mobile-friendly with fallback for blocked popups)
    document.querySelectorAll('[data-wa]').forEach(btn => {
      const phone = normalizePhone(biz.phone || '');
      if (phone) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const msg = encodeURIComponent('Hi! I’d like to book a makeup appointment.');
          let url = `https://wa.me/${phone}?text=${msg}`;
          const win = window.open(url, '_blank');
          if (!win) {
            // Fallback for in-app browsers (Instagram) / popup blockers
            url = `https://api.whatsapp.com/send?phone=${phone}&text=${msg}`;
            window.location.href = url;
          }
        });
      } else {
        btn.setAttribute('disabled', 'disabled');
      }
    });

    const cityEl = document.getElementById('cityAreas');
    if (cityEl) cityEl.textContent = [biz.city, biz.areas].filter(Boolean).join(' — ');

    const hoursEl = document.getElementById('hours');
    if (hoursEl) hoursEl.textContent = biz.hours || '';

    const heroImg = document.getElementById('heroImg');
    if (heroImg && settings.hero_image) heroImg.src = settings.hero_image;

    const tagline = document.getElementById('tagline');
    if (tagline) tagline.textContent = settings.business?.tagline || '';
  } catch (e) {
    console.log('hydrateCommon failed', e);
  }
}

/* ---------- About (Accolades + Press) ---------- */
async function hydrateAbout() {
  try {
    const acc = await loadJSON('content/accolades.json');
    const list = (acc && acc.items && acc.items.length) ? acc.items : [
      "Bridal Specialist — 250+ happy brides",
      "Editorial & Photoshoot Experience",
      "Cruelty-Free, Skin-first Approach",
      "Premium HD/Waterproof Products"
    ];
    const ul = document.getElementById('accoladesList');
    if (ul) {
      ul.innerHTML = '';
      list.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        li.className = 'py-2';
        ul.appendChild(li);
      });
    }

    const press = await loadJSON('content/press.json');
    const grid = document.getElementById('pressGrid');
    const pressItems = (press && press.items && press.items.length) ? press.items : [
      { image: 'assets/press/sample1.png', alt: 'Press Logo 1', link: '#' },
      { image: 'assets/press/sample2.png', alt: 'Press Logo 2', link: '#' },
      { image: 'assets/press/sample3.png', alt: 'Press Logo 3', link: '#' }
    ];
    if (grid) {
      grid.innerHTML = '';
      pressItems.forEach(p => {
        const a = document.createElement('a');
        a.href = p.link || '#';
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'card-hover flex items-center justify-center bg-white rounded-2xl p-6';
        const img = document.createElement('img');
        img.src = p.image;
        img.alt = p.alt || 'press';
        img.style.maxHeight = '48px';
        img.style.width = 'auto';
        a.appendChild(img);
        grid.appendChild(a);
      });
    }
  } catch (e) {
    console.log('hydrateAbout failed', e);
  }
}

/* ---------- Gallery ---------- */
async function hydrateGallery() {
  try {
    const gal = await loadJSON('content/gallery.json');
    const grid = document.getElementById('galleryGrid');
    if (grid) {
      const list = (gal && gal.images) ? gal.images : [];
      grid.innerHTML = '';
      list.forEach(item => {
        const url = (item.image || item).toString();
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'portfolio';
        img.className = 'card-hover';
        grid.appendChild(img);
      });
    }
  } catch (e) {
    console.log('hydrateGallery failed', e);
  }
}

/* ---------- Services ---------- */
async function hydrateServices() {
  try {
    const s = await loadJSON('content/services.json');
    const grid = document.getElementById('servicesGrid');
    if (grid) {
      grid.innerHTML = '';
      (s.items || []).forEach(svc => {
        const card = document.createElement('div');
        card.className = 'card card-hover bg-white';
        card.innerHTML = `
          <div class="text-sm text-fuchsia-600 font-semibold">Signature</div>
          <h3 class="serif text-2xl font-bold mt-2">${svc.name}</h3>
          ${svc.desc ? `<p class='mt-2 text-gray-600'>${svc.desc}</p>` : ''}
          ${svc.price ? `<div class='mt-4 text-3xl font-bold'>${svc.price}</div>` : ''}
        `;
        grid.appendChild(card);
      });
    }
  } catch (e) {
    console.log('hydrateServices failed', e);
  }
}

/* ---------- FAQ ---------- */
async function hydrateFAQ() {
  try {
    const data = await loadJSON('content/faq.json');
    const list = data.items || [];
    const wrap = document.getElementById('faqWrap');
    if (wrap) {
      wrap.innerHTML = '';
      list.forEach(qa => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
          <button class="faq-q flex items-center justify-between w-full text-left font-semibold">
            <span>${qa.q}</span>
            <svg class="w-5 h-5 transition-transform"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="faq-a hidden mt-3 text-gray-600">${qa.a}</div>
        `;
        const btn = card.querySelector('.faq-q');
        const ans = card.querySelector('.faq-a');
        btn.addEventListener('click', () => ans.classList.toggle('hidden'));
        wrap.appendChild(card);
      });
    }
  } catch (e) {
    console.log('hydrateFAQ failed', e);
  }
}

/* ---------- Students ---------- */
async function hydrateStudents() {
  try {
    const data = await loadJSON('content/students.json');
    const grid = document.getElementById('studentsGrid');
    if (grid) {
      grid.innerHTML = '';
      (data.items || []).forEach(st => {
        const card = document.createElement('div');
        card.className = 'student-card card card-hover';
        card.innerHTML = `
          <img src="${st.image}" alt="${st.name}">
          <div class="mt-3 flex items-center justify-between">
            <div>
              <div class="font-semibold">${st.name}</div>
              ${st.cohort ? `<div class="badge mt-1">${st.cohort}</div>` : ''}
            </div>
            ${st.instagram ? `<a href="${st.instagram}" target="_blank" rel="noopener" title="Instagram">
              <svg width="22" height="22" viewBox="0 0 24 24"><path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm0 2h10c1.7 0 3 1.3 3 3v10c0 1.7-1.3 3-3 3H7c-1.7 0-3-1.3-3-3V7c0-1.7 1.3-3 3-3zm5 3a5 5 0 100 10 5 5 0 000-10zm6.5-.9a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2z"/></svg>
            </a>` : ''}
          </div>
          ${st.quote ? `<p class="text-gray-600 mt-3">${st.quote}</p>` : ''}
        `;
        grid.appendChild(card);
      });
    }
  } catch (e) {
    console.log('hydrateStudents failed', e);
  }
}

/* ---------- Tutorials + Tips ---------- */
async function hydrateTutorials() {
  try {
    const data = await loadJSON('content/tutorials.json');
    const tips = await loadJSON('content/tips.json');
    const grid = document.getElementById('tutorialGrid');
    const tipWrap = document.getElementById('tipsWrap');
    const tabs = document.querySelectorAll('.tab[data-cat]');
    let current = 'Eyes';

    function render() {
      if (grid) {
        grid.innerHTML = '';
        const list = (data.items || []).filter(it => it.category === current);
        list.forEach(it => {
          const vid = youtubeId(it.youtube || '');
          const card = document.createElement('div');
          card.className = 'card card-hover';
          card.innerHTML = `
            <img src="${it.thumb || (vid ? ('https://img.youtube.com/vi/' + vid + '/hqdefault.jpg') : '')}" class="tutorial-thumb" alt="${it.title}">
            <div class="mt-3">
              <div class="flex items-center justify-between gap-2">
                <h3 class="font-semibold">${it.title || ''}</h3>
                <div class="text-xs text-gray-500">${it.difficulty || ''} ${it.duration ? ('• ' + it.duration) : ''}</div>
              </div>
              ${it.steps && it.steps.length ? ('<ol class="mt-2 text-sm text-gray-600">' + it.steps.map(s => '<li>• ' + s + '</li>').join('') + '</ol>') : ''}
              ${vid ? ('<a href="https://www.youtube.com/watch?v=' + vid + '" target="_blank" class="mt-3 inline-block underline">Watch on YouTube</a>') : ''}
            </div>
          `;
          grid.appendChild(card);
        });
      }
      if (tipWrap) {
        tipWrap.innerHTML = '';
        (tips.items || []).forEach(t => {
          const c = document.createElement('div');
          c.className = 'card tip-card';
          c.innerHTML = `<div class="font-semibold">${t.title}</div><p class="text-gray-600 mt-1">${t.body}</p>`;
          tipWrap.appendChild(c);
        });
      }
    }

    tabs.forEach(tab => tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      current = tab.dataset.cat;
      render();
    }));

    render();
  } catch (e) {
    console.log('hydrateTutorials failed', e);
  }
}

/* ---------- Products ---------- */
async function hydrateProducts() {
  try {
    const data = await loadJSON('content/products.json');
    const grid = document.getElementById('productsGrid');
    const chipWrap = document.getElementById('productChips');
    if (!data || !grid) return;

    const cats = Array.from(new Set((data.items || []).map(i => i.category))).sort();
    let current = 'All';

    function render() {
      grid.innerHTML = '';
      (data.items || [])
        .filter(p => current === 'All' || p.category === current)
        .forEach(p => {
          const card = document.createElement('div');
          card.className = 'card card-hover';
          card.innerHTML = `
            <img class="product-thumb" src="${p.image || ''}" alt="${p.name || ''}">
            <div class="mt-3">
              <div class="text-sm text-fuchsia-600 font-semibold">${p.category || ''}</div>
              <h3 class="serif text-xl font-bold mt-1">${p.brand || ''} — ${p.name || ''}</h3>
              ${p.notes ? `<p class="text-gray-600 mt-1">${p.notes}</p>` : ''}
              ${p.link ? `<a href="${p.link}" target="_blank" rel="noopener nofollow" class="mt-3 inline-block underline">Buy</a>` : ''}
            </div>
          `;
          grid.appendChild(card);
        });
    }

    if (chipWrap) {
      chipWrap.innerHTML = '';
      const all = document.createElement('button');
      all.className = 'chip active';
      all.textContent = 'All';
      chipWrap.appendChild(all);
      all.addEventListener('click', () => {
        current = 'All';
        [...chipWrap.children].forEach(c => c.classList.remove('active'));
        all.classList.add('active');
        render();
      });
      cats.forEach(cat => {
        const b = document.createElement('button');
        b.className = 'chip';
        b.textContent = cat;
        b.addEventListener('click', () => {
          current = cat;
          [...chipWrap.children].forEach(c => c.classList.remove('active'));
          b.classList.add('active');
          render();
        });
        chipWrap.appendChild(b);
      });
    }

    render();
  } catch (e) {
    console.log('hydrateProducts failed', e);
  }
}

/* ---------- Testimonials ---------- */
async function hydrateTestimonials() {
  try {
    const data = await loadJSON('content/testimonials.json');
    const grid = document.getElementById('testiGrid');
    const title = document.getElementById('testiTitle');
    const sub = document.getElementById('testiSubtitle');

    if (title && data.title) title.textContent = data.title;
    if (sub && data.subtitle) sub.textContent = data.subtitle;

    if (grid) {
      grid.innerHTML = '';
      (data.items || []).forEach(t => {
        const card = document.createElement('div');
        card.className = 'testi-card card card-hover';
        const stars = Number(t.rating || 0);
        const starsHTML = Array.from({ length: 5 })
          .map((_, i) =>
            i < stars
              ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .6l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 16.9 5.8 19.7 7 12.8 2 7.9l6.9-1z"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 16.9 5.8 19.7 7 12.8 2 7.9l6.9-1z"/></svg>'
          )
          .join('');
        card.innerHTML = `
          <div class="flex items-center gap-3">
            <img src="${t.avatar || ''}" alt="${t.name || ''}" style="width:52px;height:52px;border-radius:9999px;object-fit:cover;">
            <div>
              <div class="font-semibold">${t.name || ''}</div>
              <div class="text-xs text-gray-500">${t.role || ''}</div>
            </div>
          </div>
          <div class="mt-3 text-gray-700">${t.quote || ''}</div>
          <div class="mt-3 stars text-fuchsia-600">${starsHTML}</div>
        `;
        grid.appendChild(card);
      });
    }
  } catch (e) {
    console.log('hydrateTestimonials failed', e);
  }
}

/* ---------- Init + Mobile Menu ---------- */
document.addEventListener('DOMContentLoaded', () => {
  hydrateCommon();

  const page = document.body.dataset.page;
  if (page === 'about') hydrateAbout();
  if (page === 'gallery') hydrateGallery();
  if (page === 'faq') hydrateFAQ();
  if (page === 'services') hydrateServices();
  if (page === 'students') hydrateStudents();
  if (page === 'tutorials') hydrateTutorials();
  if (page === 'products') hydrateProducts();
  if (page === 'testimonials') hydrateTestimonials();

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu toggle (matches header; adds backdrop; injects links if missing)
  (function () {
    const panel = document.getElementById('mobileMenu');
    const openBtn = document.getElementById('mobileBtn');
    const closeBtn = document.getElementById('mobileClose') || (panel ? panel.querySelector('[aria-label="Close menu"]') : null);
    let backdrop = document.getElementById('mobileBackdrop');

    if (!panel || !openBtn) return; // header not mounted

    // Ensure panel is a true overlay above everything
    Object.assign(panel.style, {
      position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
      background: '#fff', overflow: 'auto', zIndex: '2147483647'
    });

    // Create a backdrop if the HTML doesn't include one
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'mobileBackdrop';
      Object.assign(backdrop.style, {
        display: 'none', position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
        background: 'rgba(0,0,0,.30)', zIndex: '2147483646'
      });
      const header = panel.closest('header') || document.body;
      header.insertBefore(backdrop, panel);
    }

    // Fallback: inject nav links if missing
    function ensureLinks() {
      let nav = panel.querySelector('nav') || panel.querySelector('#mobileNav');
      if (!nav) {
        nav = document.createElement('nav');
        nav.id = 'mobileNav';
        nav.style.cssText = 'padding:16px 24px;font-size:18px;line-height:1.4;';
        panel.appendChild(nav);
      }
      if (nav.querySelectorAll('a').length >= 5) return; // seems fine

      nav.innerHTML = '';
      const links = [
        ['index.html', 'About'],
        ['services.html', 'Services'],
        ['gallery.html', 'Gallery'],
        ['student-work.html', 'Student Work'],
        ['tutorials.html', 'Tutorials'],
        ['products.html', 'Products'],
        ['client-love.html', 'Client Love'],
        ['faq.html', 'FAQ'],
        ['contact.html', 'Contact / Book'],
      ];

      links.forEach(([href, label]) => {
        const a = document.createElement('a');
        a.href = href;
        a.style.cssText = 'display:block;padding:12px 0;border-bottom:1px solid #eee;color:#111;text-decoration:none;';
        if (label === 'Contact / Book') {
          a.style.borderBottom = '0';
          const pill = document.createElement('span');
          pill.textContent = 'Book';
          pill.style.cssText = 'display:inline-block;width:100%;text-align:center;padding:12px 16px;border-radius:12px;color:#fff;background:linear-gradient(90deg,var(--brand),var(--accent));margin-top:8px;';
          a.appendChild(pill);
        } else {
          a.textContent = label;
        }
        nav.appendChild(a);
      });
    }

    function openMenu() {
      ensureLinks();
      panel.classList.remove('hidden');
      panel.style.display = 'block';
      backdrop.style.display = 'block';
      document.documentElement.classList.add('overflow-hidden');
      document.body.classList.add('overflow-hidden');
    }

    function closeMenu() {
      panel.style.display = 'none';
      panel.classList.add('hidden');
      backdrop.style.display = 'none';
      document.documentElement.classList.remove('overflow-hidden');
      document.body.classList.remove('overflow-hidden');
    }

    openBtn.addEventListener('click', openMenu);
    closeBtn && closeBtn.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
  })();
});
