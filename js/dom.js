'use strict';

// Текст из данных и форм никогда не интерпретируется как HTML.
Lumo.el = function (tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.classList.add(...className.split(' '));
  element.textContent = text;
  return element;
};
Lumo.money = value => new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0
}).format(value);
Lumo.findProduct = id => Lumo.products.find(product => product.id === Number(id));
Lumo.image = function (product, className = '') {
  const image = Lumo.el('img', className);
  image.src = `images/lamp-${product.image}.svg`;
  image.alt = `${Lumo.categories[product.category]} светильник ${product.title}`;
  image.width = 600;
  image.height = 600;
  image.loading = 'lazy';
  return image;
};
Lumo.notify = function (text) {
  const message = document.querySelector('[data-notification]');
  if (!message) return;
  message.textContent = text;
  message.hidden = false;
  clearTimeout(Lumo.notificationTimer);
  Lumo.notificationTimer = setTimeout(() => { message.hidden = true; }, 4500);
};
