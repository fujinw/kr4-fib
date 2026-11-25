'use strict';

Lumo.product = { init() {
  const root = document.querySelector('[data-product-detail]');
  if (!root) return;
  const id = new URLSearchParams(location.search).get('id') || '1';
  const product = Lumo.findProduct(id);
  if (!product) {
    root.replaceChildren(Lumo.el('h1', '', 'Товар не найден'), Lumo.el('p', '', 'Вернитесь в каталог и выберите другую модель.'));
    document.querySelector('[data-product-extra]')?.remove();
    document.title = 'Товар не найден — LUMO';
    return;
  }
  document.title = `${product.title} — LUMO`;
  document.querySelector('[data-product-crumb]').textContent = product.title;
  const gallery = Lumo.el('div', 'product-gallery');
  gallery.append(Lumo.image(product, 'product-gallery__image'));
  const info = Lumo.el('div', 'product-info');
  info.append(Lumo.el('p', 'eyebrow', `${Lumo.categories[product.category]} светильник`),
    Lumo.el('h1', 'product-info__title', product.title),
    Lumo.el('p', 'product-info__lead', product.description));
  const specs = Lumo.el('dl', 'product-facts');
  const materials = { metal: 'Металл', wood: 'Дерево', glass: 'Стекло' };
  for (const [label, value] of [['Размер', product.size], ['Материал', materials[product.material]], ['Гарантия', '5 лет']]) {
    const row = Lumo.el('div');
    row.append(Lumo.el('dt', '', label), Lumo.el('dd', '', value));
    specs.append(row);
  }
  const buy = Lumo.el('div', 'product-info__buy');
  const add = Lumo.el('button', 'button', product.isAvailable ? 'Добавить в корзину' : 'Нет в наличии');
  add.type = 'button';
  add.dataset.addToCart = product.id;
  add.disabled = !product.isAvailable;
  buy.append(Lumo.el('strong', 'product-info__price', Lumo.money(product.price)), add);
  const back = Lumo.el('a', 'text-link', 'Продолжить выбор в каталоге');
  back.href = 'catalog.html';
  info.append(specs, Lumo.el('p', 'availability', product.isAvailable ? 'В наличии · доступен к заказу' : 'Сообщим о поступлении на консультации'), buy, back);
  root.replaceChildren(gallery, info);
} };
