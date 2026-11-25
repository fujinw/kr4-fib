'use strict';

// Все страницы используют один источник данных. Цена хранится числом в рублях.
window.Lumo = window.Lumo || {};
Lumo.categories = { pendant: 'Подвесной', table: 'Настольный', floor: 'Напольный', wall: 'Настенный' };
Lumo.products = [
  { id: 1, title: 'Aster', category: 'pendant', price: 14900, isAvailable: true, image: 'aster', size: 'Ø 42 см', material: 'metal', badge: 'Хит', description: 'Мягкий направленный свет для обеденной зоны.' },
  { id: 2, title: 'Orbit', category: 'table', price: 9800, isAvailable: true, image: 'orbit', size: '32 см', material: 'metal', badge: 'Новинка', description: 'Поворотный плафон и отражённый вечерний свет.' },
  { id: 3, title: 'Nord', category: 'floor', price: 18400, isAvailable: true, image: 'nord', size: '148 см', material: 'wood', badge: '', description: 'Лаконичный торшер для чтения и спокойных вечеров.' },
  { id: 4, title: 'Mono', category: 'wall', price: 6700, isAvailable: true, image: 'mono', size: '18 см', material: 'metal', badge: 'Выгодная цена', description: 'Компактное бра с мягким отражённым светом.' },
  { id: 5, title: 'Flora', category: 'pendant', price: 16200, isAvailable: true, image: 'flora', size: 'Ø 36 см', material: 'glass', badge: '', description: 'Скульптурный силуэт из полупрозрачного стекла.' },
  { id: 6, title: 'Wave', category: 'pendant', price: 21600, isAvailable: false, image: 'wave', size: '92 см', material: 'metal', badge: 'Скоро в наличии', description: 'Линейный свет над длинным столом или островом.' },
  { id: 7, title: 'Aster Mini', category: 'pendant', price: 10900, isAvailable: true, image: 'aster', size: 'Ø 28 см', material: 'metal', badge: 'Новинка', description: 'Компактная версия Aster для небольшого стола.' },
  { id: 8, title: 'Orbit Plus', category: 'table', price: 12800, isAvailable: true, image: 'orbit', size: '42 см', material: 'metal', badge: '', description: 'Увеличенный Orbit для просторного рабочего места.' },
  { id: 9, title: 'Nord Oak', category: 'floor', price: 22400, isAvailable: false, image: 'nord', size: '160 см', material: 'wood', badge: 'Скоро в наличии', description: 'Высокая версия Nord с опорой из дуба.' },
  { id: 10, title: 'Mono Duo', category: 'wall', price: 8900, isAvailable: true, image: 'mono', size: '24 см', material: 'metal', badge: '', description: 'Настенный светильник для акцентного освещения.' }
];
