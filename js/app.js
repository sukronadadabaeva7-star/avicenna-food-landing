(() => {
  'use strict';

  /* ===== Данные каталога (раздел 6 ТЗ) ===== */
  const PRODUCTS = [
    {
      id: 'disc-chernosliv', type: 'disc', img: 'images/disc-chernosliv.png',
      name: 'Фрукт диск с черносливом', eng: 'FRUIT DISC', taste: 'Чернослив',
      desc: 'Спрессованный чернослив с орехами. Лёгкий, насыщенный, с природной сладостью.',
      packCount: 50, packPrice: 1499, unitPrice: 30,
      badges: ['Без сахара', 'Без глютена', 'Веган'], rating: '4.9'
    },
    {
      id: 'disc-yabloko', type: 'disc', img: 'images/disc-yabloko.png',
      name: 'Фрукт диск с яблоком', eng: 'FRUIT DISC', taste: 'Яблоко',
      desc: 'Яблоко и орехи в плотном диске. Свежий фруктовый вкус, удобный формат.',
      packCount: 50, packPrice: 1499, unitPrice: 30,
      badges: ['Без сахара', 'Без глютена', 'Веган'], rating: '4.9'
    },
    {
      id: 'bar-kuraga', type: 'bar', img: 'images/bar-kuraga.png',
      name: 'Фрукт бар с курагой', eng: 'FRUIT BAR', taste: 'Курага',
      desc: 'Курага и орехи в батончике. Солнечный вкус и натуральная энергия — идеально в дорогу.',
      packCount: 30, packPrice: 1349, unitPrice: 45,
      badges: ['Без сахара', 'Без глютена', 'Веган'], rating: '4.9'
    },
    {
      id: 'bar-yabloko', type: 'bar', img: 'images/bar-yabloko.png',
      name: 'Фрукт бар с яблоком', eng: 'FRUIT BAR', taste: 'Яблоко',
      desc: 'Яблочный батончик с орехами. Лёгкий перекус без лишнего.',
      packCount: 30, packPrice: 1349, unitPrice: 45,
      badges: ['Без сахара', 'Без глютена', 'Веган'], rating: '4.9'
    }
  ];

  const fmt = (n) => `${n.toLocaleString('ru-RU')} ₽`;

  /* ===== Уведомления о заказах в Telegram =====
     Токен бота НЕ хранится здесь — заказ отправляется на свой сервер (Cloudflare Worker),
     который уже сам, скрыто от посетителей сайта, пересылает сообщение в Telegram. */
  const ORDER_WORKER_URL = 'https://avicenna-order.sukronadadabaeva7.workers.dev/';
  const DELIVERY_LABELS = {
    cdek: 'СДЭК', post: 'Почта России', wildberries: 'Wildberries', ozon: 'Ozon', courier: 'Курьер'
  };

  function sendTelegramOrder(text) {
    return fetch(ORDER_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  }

  /* ===== Состояние корзины (только в памяти сессии, без localStorage) ===== */
  const cart = new Map(); // id -> qty

  function addToCart(id, qty = 1) {
    cart.set(id, (cart.get(id) || 0) + qty);
    renderCartViews();
    bounceCartIcon();
  }
  function setQty(id, qty) {
    if (qty <= 0) cart.delete(id);
    else cart.set(id, qty);
    renderCartViews();
  }
  function cartTotal() {
    let total = 0, count = 0;
    cart.forEach((qty, id) => {
      const p = PRODUCTS.find(p => p.id === id);
      if (p) { total += p.packPrice * qty; count += qty; }
    });
    return { total, count };
  }
  function bounceCartIcon() {
    const badge = document.getElementById('cart-count');
    badge.classList.remove('is-bouncing');
    requestAnimationFrame(() => badge.classList.add('is-bouncing'));
  }

  /* ===== Рендер каталога ===== */
  function productCardHTML(p) {
    return `
      <article class="product-card" data-type="${p.type}">
        <div class="product-card__photo-wrap">
          <img src="${p.img}" alt="${p.name}" class="photo-placeholder" data-aspect="1/1">
          <div class="product-card__glow"></div>
        </div>
        <ul class="badge-row">${p.badges.map(b => `<li class="badge"><span class="badge__dot"></span>${b}</li>`).join('')}</ul>
        <div class="product-card__top">
          <div>
            <p class="product-card__eng">${p.eng}</p>
            <h3 class="product-card__name">${p.name}</h3>
          </div>
        </div>
        <p class="product-card__desc">${p.desc}</p>
        <p class="product-card__unit">${p.packCount} шт. в упаковке · ${fmt(p.unitPrice)}/шт</p>
        <p class="product-card__price">${fmt(p.packPrice)}</p>
        <div class="product-card__footer">
          <div class="stepper" data-stepper="${p.id}">
            <button type="button" data-action="dec" aria-label="Уменьшить">−</button>
            <span data-qty>1</span>
            <button type="button" data-action="inc" aria-label="Увеличить">+</button>
          </div>
          <button type="button" class="btn btn--primary btn--sm" data-add="${p.id}">В корзину</button>
        </div>
      </article>`;
  }

  function hitCardHTML(p) {
    return `
      <article class="hit-card">
        <img src="${p.img}" alt="${p.name}" class="photo-placeholder" data-aspect="1/1">
        <span class="rating-badge">${p.rating} ★</span>
        <div class="hit-card__top">
          <h3 class="hit-card__name">${p.name}</h3>
        </div>
        <p class="product-card__unit">${fmt(p.unitPrice)}/шт</p>
        <div class="hit-card__footer">
          <span class="hit-card__price">${fmt(p.packPrice)}</span>
          <button type="button" class="btn-plus" data-add="${p.id}" aria-label="Добавить ${p.name} в корзину">+</button>
        </div>
      </article>`;
  }

  function renderCatalog() {
    document.getElementById('hits-grid').innerHTML = PRODUCTS.map(hitCardHTML).join('');
    document.getElementById('catalog-grid').innerHTML = PRODUCTS.map(productCardHTML).join('');
  }

  function renderCartViews() {
    const { total, count } = cartTotal();
    document.getElementById('cart-count').textContent = count;

    const panelList = document.getElementById('cart-panel-list');
    const orderList = document.getElementById('order-cart-list');

    if (cart.size === 0) {
      panelList.innerHTML = '<li class="cart-panel__empty">Корзина пуста</li>';
      orderList.innerHTML = '<li class="cart-panel__empty">Корзина пуста</li>';
    } else {
      const rows = [...cart.entries()].map(([id, qty]) => {
        const p = PRODUCTS.find(p => p.id === id);
        if (!p) return '';
        return `<li><span>${p.name} × ${qty}</span><span>${fmt(p.packPrice * qty)}</span></li>`;
      }).join('');
      panelList.innerHTML = rows;
      orderList.innerHTML = rows;
    }

    document.getElementById('cart-panel-total').textContent = fmt(total);
    document.getElementById('order-cart-total').textContent = fmt(total);
  }

  /* ===== Делегирование кликов по каталогу/хитам ===== */
  function bindCatalogEvents() {
    document.body.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add]');
      if (addBtn) {
        const id = addBtn.dataset.add;
        const card = addBtn.closest('.product-card');
        const qty = card ? Number(card.querySelector('[data-qty]').textContent) : 1;
        addToCart(id, qty);
        return;
      }
      const stepBtn = e.target.closest('.stepper button');
      if (stepBtn) {
        const stepper = stepBtn.closest('.stepper');
        const span = stepper.querySelector('[data-qty]');
        let val = Number(span.textContent);
        val = stepBtn.dataset.action === 'inc' ? val + 1 : Math.max(1, val - 1);
        span.textContent = val;
      }
    });
  }

  /* ===== Фильтр каталога ===== */
  function bindFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        const filter = tab.dataset.filter;
        document.querySelectorAll('#catalog-grid .product-card').forEach(card => {
          card.style.display = (filter === 'all' || card.dataset.type === filter) ? '' : 'none';
        });
      });
    });
  }

  /* ===== Шапка: скролл и бургер ===== */
  function bindHeader() {
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    }, { passive: true });

    const burger = document.getElementById('burger');
    const nav = document.getElementById('primary-nav');
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
  }

  /* ===== Плавающая корзина ===== */
  function bindCartPanel() {
    const panel = document.getElementById('cart-panel');
    const toggle = document.getElementById('cart-toggle');
    const close = document.getElementById('cart-close');
    toggle.addEventListener('click', () => {
      const isHidden = panel.hasAttribute('hidden');
      if (isHidden) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', String(isHidden));
    });
    close.addEventListener('click', () => {
      panel.setAttribute('hidden', '');
      toggle.setAttribute('aria-expanded', 'false');
    });
    document.getElementById('cart-checkout').addEventListener('click', () => {
      panel.setAttribute('hidden', '');
    });
  }

  /* ===== Квиз ===== */
  function bindQuiz() {
    const startBtn = document.getElementById('quiz-start');
    const intro = document.getElementById('quiz-intro');
    const form = document.getElementById('quiz-form');
    const nextBtn = document.getElementById('quiz-next');
    const resultBox = document.getElementById('quiz-result');
    const resultCard = document.getElementById('quiz-result-card');
    const steps = [...form.querySelectorAll('.quiz__step')];
    let stepIndex = 0;

    startBtn.addEventListener('click', () => {
      intro.hidden = true;
      form.hidden = false;
    });

    function showStep(i) {
      steps.forEach((s, idx) => s.hidden = idx !== i);
      nextBtn.textContent = i === steps.length - 1 ? 'Показать результат' : 'Далее';
    }

    nextBtn.addEventListener('click', () => {
      const current = steps[stepIndex];
      const checked = current.querySelector('input:checked');
      if (!checked) { current.reportValidity ? current.querySelector('input').reportValidity() : alert('Выбери вариант'); return; }

      if (stepIndex < steps.length - 1) {
        stepIndex++;
        showStep(stepIndex);
      } else {
        const data = new FormData(form);
        const taste = data.get('taste');
        const format = data.get('format');
        const product = pickQuizProduct(taste, format);
        form.hidden = true;
        resultBox.hidden = false;
        resultCard.innerHTML = productCardHTML(product);
      }
    });

    showStep(0);
  }

  function pickQuizProduct(taste, format) {
    if (format === 'disc') {
      return PRODUCTS.find(p => p.id === (taste === 'chernosliv' ? 'disc-chernosliv' : 'disc-yabloko'));
    }
    return PRODUCTS.find(p => p.id === (taste === 'kuraga' ? 'bar-kuraga' : 'bar-yabloko'));
  }

  /* ===== Форма заказа ===== */
  function bindOrderForm() {
    const form = document.getElementById('order-form');
    const note = document.getElementById('order-note');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const { total, count } = cartTotal();
      if (count === 0) {
        note.textContent = 'Добавьте товары в корзину перед оформлением.';
        note.style.color = 'var(--orange)';
        return;
      }

      const data = new FormData(form);
      const itemsText = [...cart.entries()].map(([id, qty]) => {
        const p = PRODUCTS.find(p => p.id === id);
        return p ? `${p.name} × ${qty} (${fmt(p.packPrice * qty)})` : '';
      }).filter(Boolean).join('\n');

      const message = [
        '🛒 Новый заказ — Avicenna Food',
        `Имя: ${data.get('name')}`,
        `Телефон: ${data.get('phone')}`,
        `Город: ${data.get('city')}`,
        `Доставка: ${DELIVERY_LABELS[data.get('delivery')] || data.get('delivery')}`,
        data.get('comment') ? `Комментарий: ${data.get('comment')}` : '',
        '',
        itemsText,
        '',
        `Итого: ${fmt(total)}`
      ].filter(Boolean).join('\n');

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      note.style.color = '';
      note.textContent = 'Отправляем заказ...';

      sendTelegramOrder(message)
        .then((res) => {
          if (!res.ok) throw new Error('Telegram API error');
          note.textContent = `Спасибо, заказ принят! Товаров: ${count}, на сумму ${fmt(total)}. Мы свяжемся с вами по указанному телефону.`;
          cart.clear();
          renderCartViews();
          form.reset();
        })
        .catch(() => {
          note.style.color = 'var(--orange)';
          note.textContent = 'Не удалось отправить заказ автоматически. Пожалуйста, свяжитесь с нами напрямую.';
        })
        .finally(() => {
          submitBtn.disabled = false;
        });
    });
  }

  /* ===== Scroll reveal ===== */
  function bindReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('is-visible'), i * 60);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    items.forEach(el => observer.observe(el));
  }

  /* ===== Init ===== */
  document.addEventListener('DOMContentLoaded', () => {
    renderCatalog();
    renderCartViews();
    bindCatalogEvents();
    bindFilterTabs();
    bindHeader();
    bindCartPanel();
    bindQuiz();
    bindOrderForm();
    bindReveal();
  });
})();
