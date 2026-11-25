'use strict';

Lumo.modal = { init() {
  let opener = null;
  function open(dialog, button) {
    if (!dialog || dialog.open) return;
    opener = button;
    dialog.showModal();
  }
  document.addEventListener('click', event => {
    const consultation = event.target.closest('[data-open-dialog]');
    if (consultation) open(document.getElementById(consultation.dataset.openDialog), consultation);
    const quick = event.target.closest('[data-quick-view]');
    if (quick) {
      const product = Lumo.findProduct(quick.dataset.quickView);
      const dialog = document.querySelector('#product-dialog');
      if (!product || !dialog) return;
      const content = dialog.querySelector('[data-quick-content]');
      const title = Lumo.el('h2', 'modal__title', product.title);
      title.id = 'quick-title';
      const link = Lumo.el('a', 'text-link', 'Все характеристики');
      link.href = `product.html?id=${product.id}`;
      const add = Lumo.el('button', 'button', product.isAvailable ? 'В корзину' : 'Нет в наличии');
      add.type = 'button';
      add.dataset.addToCart = product.id;
      add.disabled = !product.isAvailable;
      content.replaceChildren(title, Lumo.image(product, 'quick-image'),
        Lumo.el('p', '', product.description), Lumo.el('strong', 'quick-price', Lumo.money(product.price)), add, link);
      open(dialog, quick);
    }
    const close = event.target.closest('[data-close-dialog]');
    if (close) close.closest('dialog').close();
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('close', () => {
      if (opener?.isConnected) opener.focus();
      opener = null;
    });
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right ||
          event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });
} };
