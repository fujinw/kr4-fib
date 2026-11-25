'use strict';

Lumo.cart = (() => {
  const storageKey = 'lumo-kr4-cart-v1';
  let items = [];
  let promo = '';

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || !Array.isArray(saved.items)) return;
      const seen = new Set();
      items = saved.items.filter(item => {
        if (!item || typeof item !== 'object') return false;
        const product = Lumo.findProduct(item.id);
        if (!product || !product.isAvailable || seen.has(product.id) ||
            !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return false;
        seen.add(product.id);
        return true;
      }).map(item => ({ id: Number(item.id), quantity: item.quantity }));
      promo = saved.promo === 'LUMO10' ? 'LUMO10' : '';
    } catch {
      // При повреждённых данных или запрете localStorage магазин работает в памяти.
      items = [];
      promo = '';
    }
  }

  function lines() {
    return items.map(item => ({ ...item, product: Lumo.findProduct(item.id) }));
  }

  function totals(delivery = 'pickup') {
    const subtotal = lines().reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = promo === 'LUMO10' ? Math.round(subtotal * 0.1) : 0;
    const shipping = !subtotal || delivery === 'pickup' ? 0
      : delivery === 'transport' ? 1200 : subtotal - discount >= 15000 ? 0 : 500;
    return { subtotal, discount, shipping, total: subtotal - discount + shipping };
  }

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ items, promo })); }
    catch { Lumo.notify('Изменения сохранены на этой странице. Браузер не разрешает постоянное хранение.'); }
    document.dispatchEvent(new CustomEvent('cart:change'));
  }

  function add(id) {
    const product = Lumo.findProduct(id);
    if (!product || !product.isAvailable) return;
    const item = items.find(row => row.id === product.id);
    if (item && item.quantity >= 99) { Lumo.notify('В корзине может быть до 99 штук одной модели.'); return; }
    if (item) item.quantity += 1;
    else items.push({ id: product.id, quantity: 1 });
    save();
    Lumo.notify(`${product.title} добавлен в корзину.`);
  }

  function quantity(id, delta) {
    const item = items.find(row => row.id === Number(id));
    if (!item) return;
    item.quantity = Math.min(99, item.quantity + delta);
    items = items.filter(row => row.quantity > 0);
    save();
  }

  function render() {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('[data-cart-count]').forEach(el => { el.textContent = count; });
    const list = document.querySelector('[data-cart-items]');
    if (list) {
      list.replaceChildren();
      document.querySelector('[data-cart-empty]').hidden = count > 0;
      document.querySelector('[data-cart-filled]').hidden = count === 0;
      lines().forEach(item => {
        const row = Lumo.el('article', 'cart-row');
        row.dataset.id = item.id;
        row.append(Lumo.image(item.product, 'cart-row__image'));
        const info = Lumo.el('div', 'cart-row__info');
        const title = Lumo.el('a', 'text-link', item.product.title);
        title.href = `product.html?id=${item.id}`;
        info.append(title, Lumo.el('p', '', `${Lumo.money(item.product.price)} за штуку`));
        const controls = Lumo.el('div', 'quantity-control');
        for (const [action, label, text] of [
          ['decrease', 'Уменьшить количество', '−'], ['increase', 'Увеличить количество', '+']
        ]) {
          const button = Lumo.el('button', 'quantity-control__button', text);
          button.type = 'button';
          button.dataset.cartAction = action;
          button.setAttribute('aria-label', `${label} ${item.product.title}`);
          button.disabled = action === 'increase' && item.quantity >= 99;
          controls.append(button);
          if (action === 'decrease') controls.append(Lumo.el('span', '', String(item.quantity)));
        }
        const remove = Lumo.el('button', 'text-link text-link--button', 'Удалить');
        remove.type = 'button';
        remove.dataset.cartAction = 'remove';
        remove.setAttribute('aria-label', `Удалить ${item.product.title}`);
        row.append(info, controls, Lumo.el('strong', '', Lumo.money(item.product.price * item.quantity)), remove);
        list.append(row);
      });
    }
    const summary = document.querySelector('[data-order-items]');
    if (summary) {
      summary.replaceChildren();
      if (!count) summary.append(Lumo.el('p', '', 'Корзина пуста. Добавьте светильник из каталога.'));
      lines().forEach(item => summary.append(Lumo.el('p', 'summary-line',
        `${item.product.title} × ${item.quantity} — ${Lumo.money(item.product.price * item.quantity)}`)));
    }
    const delivery = document.querySelector('input[name="delivery"]:checked')?.value || 'pickup';
    const amounts = totals(delivery);
    for (const [key, value] of Object.entries(amounts)) {
      document.querySelectorAll(`[data-total="${key}"]`).forEach(el => { el.textContent = Lumo.money(value); });
    }
    const promoStatus = document.querySelector('[data-promo-status]');
    if (promoStatus) promoStatus.textContent = promo ? 'Промокод LUMO10 применён: скидка 10%.' : 'Промокод не применён.';
  }

  function init() {
    restore();
    document.addEventListener('cart:change', render);
    document.addEventListener('click', event => {
      const addButton = event.target.closest('[data-add-to-cart]');
      if (addButton) add(addButton.dataset.addToCart);
      const action = event.target.closest('[data-cart-action]');
      if (action) {
        const id = Number(action.closest('[data-id]').dataset.id);
        const actionName = action.dataset.cartAction;
        // После перерисовки возвращаем фокус на соответствующую кнопку.
        if (actionName === 'remove') { items = items.filter(item => item.id !== id); save(); }
        else quantity(id, actionName === 'increase' ? 1 : -1);
        const next = document.querySelector(`[data-id="${id}"] [data-cart-action="${actionName}"]`)
          || document.querySelector('[data-cart-items] button') || document.querySelector('[data-cart-empty] a');
        next?.focus();
        Lumo.notify('Корзина обновлена.');
      }
    });
    document.querySelector('[data-promo-form]')?.addEventListener('submit', event => {
      event.preventDefault();
      const input = event.currentTarget.querySelector('input');
      if (input.value.trim().toUpperCase() !== 'LUMO10') {
        input.setAttribute('aria-invalid', 'true');
        document.querySelector('[data-promo-status]').textContent = 'Такого промокода нет. Попробуйте LUMO10.';
        return;
      }
      input.removeAttribute('aria-invalid');
      promo = 'LUMO10';
      save();
    });
    document.querySelector('[data-remove-promo]')?.addEventListener('click', () => {
      promo = '';
      const input = document.querySelector('#promo-code');
      input.value = '';
      input.removeAttribute('aria-invalid');
      save();
    });
    render();
  }

  return { init, add, lines, totals, render, clear() { items = []; promo = ''; save(); } };
})();
