'use strict';

Lumo.catalog = (() => {
  function card(product, headingTag = 'h2') {
    const card = Lumo.el('article', 'product-card');
    card.dataset.productId = product.id;
    if (product.badge) card.append(Lumo.el('span', 'product-card__badge', product.badge));
    const link = Lumo.el('a', 'product-card__image-link');
    link.href = `product.html?id=${product.id}`;
    link.append(Lumo.image(product, 'product-card__image'));
    const meta = Lumo.el('div', 'product-card__meta');
    meta.append(Lumo.el('span', '', Lumo.categories[product.category]), Lumo.el('span', '', product.size));
    const heading = Lumo.el(headingTag, 'product-card__title');
    const title = Lumo.el('a', '', product.title);
    title.href = link.href;
    heading.append(title);
    const status = Lumo.el('p', 'availability', product.isAvailable ? 'В наличии' : 'Нет в наличии');
    if (!product.isAvailable) status.classList.add('availability--out');
    const footer = Lumo.el('div', 'product-card__footer');
    const add = Lumo.el('button', 'button button--small', product.isAvailable ? 'В корзину' : 'Ожидается');
    add.type = 'button';
    add.dataset.addToCart = product.id;
    add.disabled = !product.isAvailable;
    add.setAttribute('aria-label', `${product.isAvailable ? 'Добавить в корзину' : 'Нет в наличии'} ${product.title}`);
    footer.append(Lumo.el('strong', 'product-card__price', Lumo.money(product.price)), add);
    const quick = Lumo.el('button', 'text-link text-link--button product-card__quick', 'Быстрый просмотр');
    quick.type = 'button';
    quick.dataset.quickView = product.id;
    quick.setAttribute('aria-label', `Быстрый просмотр ${product.title}`);
    card.append(link, meta, heading, Lumo.el('p', 'product-card__description', product.description), status, footer, quick);
    return card;
  }

  // Чистая функция: фильтры применяются вместе, исходный массив не меняется.
  function selectProducts(filters) {
    const query = filters.query.trim().toLocaleLowerCase('ru-RU');
    const selected = Lumo.products.filter(product =>
      product.title.toLocaleLowerCase('ru-RU').includes(query) &&
      (!filters.category || product.category === filters.category) &&
      (!filters.material || product.material === filters.material) &&
      (!filters.available || product.isAvailable) &&
      product.price >= filters.min && product.price <= filters.max
    );
    const sorters = {
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      title: (a, b) => a.title.localeCompare(b.title, 'ru')
    };
    return sorters[filters.sort] ? [...selected].sort(sorters[filters.sort]) : selected;
  }

  function init() {
    const popular = document.querySelector('[data-popular-products]');
    if (popular) popular.replaceChildren(...Lumo.products.slice(0, 3).map(product => card(product, 'h3')));
    const grid = document.querySelector('[data-catalog-grid]');
    if (!grid) return;
    const form = document.querySelector('#catalog-filters');
    const search = document.querySelector('#catalog-search');
    const sort = document.querySelector('#catalog-sort');
    const empty = document.querySelector('[data-catalog-empty]');
    const priceMessage = document.querySelector('[data-price-message]');
    function update() {
      const values = new FormData(form);
      const min = values.get('min') === '' ? 0 : Number(values.get('min'));
      const max = values.get('max') === '' ? Infinity : Number(values.get('max'));
      const invalidRange = min > max;
      priceMessage.hidden = !invalidRange;
      const products = invalidRange ? [] : selectProducts({ query: search.value,
        category: values.get('category'), material: values.get('material'), available: values.has('available'),
        min, max, sort: sort.value });
      grid.replaceChildren(...products.map(product => card(product)));
      document.querySelector('[data-catalog-count]').textContent = `Найдено товаров: ${products.length} из ${Lumo.products.length}`;
      empty.hidden = products.length > 0;
      empty.querySelector('p').textContent = search.value.trim()
        ? `По запросу «${search.value.trim()}» с выбранными фильтрами ничего не найдено.`
        : 'Попробуйте другую категорию или увеличьте диапазон цен.';
    }
    function reset() {
      form.reset();
      search.value = '';
      sort.value = 'default';
      update();
    }
    search.addEventListener('input', update);
    sort.addEventListener('change', update);
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    form.addEventListener('submit', event => event.preventDefault());
    document.querySelectorAll('[data-reset-filters]').forEach(button => button.addEventListener('click', reset));
    update();
  }
  return { init, card, selectProducts };
})();
