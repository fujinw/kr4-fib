'use strict';

// Скрипты подключены с defer и выполняются после разбора HTML в указанном порядке.
Lumo.cart.init();
Lumo.catalog.init();
Lumo.product.init();
Lumo.modal.init();
Lumo.validation.init();

// На телефоне каталог виден сразу, на широком экране фильтры раскрыты.
const filterPanel = document.querySelector('.filter');
if (filterPanel) {
  const wideScreen = window.matchMedia('(min-width: 1024px)');
  const updateFilterPanel = () => { filterPanel.open = wideScreen.matches; };
  wideScreen.addEventListener('change', updateFilterPanel);
  updateFilterPanel();
}
