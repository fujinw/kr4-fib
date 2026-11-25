const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function setup(saved = null, blocked = false) {
  let stored = saved;
  const warnings = [];
  const context = vm.createContext({ console, Intl, URLSearchParams, setTimeout, clearTimeout,
    CustomEvent: class { constructor(type) { this.type = type; } },
    localStorage: {
      getItem() { if (blocked) throw Error('Storage blocked'); return stored; },
      setItem(key, value) { if (blocked) throw Error('Storage blocked'); stored = value; }
    },
    document: { querySelector() { return null; }, querySelectorAll() { return []; }, addEventListener() {}, dispatchEvent() {} }
  });
  context.window = context;
  for (const file of ['data', 'dom', 'cart', 'catalog', 'validation']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', `${file}.js`), 'utf8'), context);
  }
  context.Lumo.notify = message => warnings.push(message);
  context.Lumo.cart.init();
  return { app: context.Lumo, stored: () => stored, warnings };
}
const filters = overrides => ({ query: '', category: '', material: '', available: false,
  min: 0, max: Infinity, sort: 'default', ...overrides });

test('10 товаров с одинаковыми свойствами, уникальными id и числовой ценой', () => {
  const { app } = setup();
  assert.equal(app.products.length, 10);
  assert.equal(new Set(app.products.map(p => p.id)).size, 10);
  for (const p of app.products) {
    assert.deepEqual(Object.keys(p), Object.keys(app.products[0]));
    assert.equal(typeof p.price, 'number');
    assert.equal(typeof p.isAvailable, 'boolean');
    assert(app.categories[p.category]);
    assert(fs.existsSync(path.join(__dirname, '..', 'images', `lamp-${p.image}.svg`)));
  }
});
test('поиск удаляет пробелы по краям и не зависит от регистра', () => {
  const { app } = setup();
  assert.equal(app.catalog.selectProducts(filters({query: ' ASTER '})).length, 2);
  assert.equal(app.catalog.selectProducts(filters({query: 'несуществующий'})).length, 0);
});
test('поиск, категория, материал, наличие и цены применяются вместе', () => {
  const { app } = setup();
  const found = app.catalog.selectProducts(filters({query:'fl',category:'pendant',material:'glass',available:true,min:15000,max:17000}));
  assert.equal(found.length, 1);
  assert.equal(found[0].id, 5);
});
test('сортировка цен и названий сохраняет исходный порядок товаров', () => {
  const { app } = setup();
  const before = app.products.map(p=>p.id).join(',');
  assert.equal(app.catalog.selectProducts(filters({sort:'price-asc'}))[0].id, 4);
  assert.equal(app.catalog.selectProducts(filters({sort:'price-desc'}))[0].id, 9);
  assert.equal(app.catalog.selectProducts(filters({sort:'title'}))[0].title, 'Aster');
  assert.equal(app.products.map(p=>p.id).join(','), before);
});
test('корзина складывает одинаковые товары и сохраняет только id и количество', () => {
  const { app, stored } = setup();
  app.cart.add(1); app.cart.add(1); app.cart.add(2);
  assert.equal(app.cart.lines()[0].quantity, 2);
  assert.equal(app.cart.totals().subtotal, 39600);
  const saved = JSON.parse(stored());
  assert.deepEqual(saved.items, [{id:1,quantity:2},{id:2,quantity:1}]);
});
test('нельзя добавить отсутствующий товар или неизвестный id', () => {
  const { app } = setup(); app.cart.add(6); app.cart.add(999);
  assert.equal(app.cart.lines().length, 0);
});
test('восстановление не доверяет данным хранилища', () => {
  const { app } = setup(JSON.stringify({items:[null,{id:1,quantity:2},{id:1,quantity:9},
    {id:2,quantity:-1},{id:3,quantity:1.5},{id:4,quantity:100},{id:6,quantity:1},{id:999,quantity:1}],promo:'<script>'}));
  assert.equal(app.cart.lines().length, 1);
  assert.equal(app.cart.lines()[0].quantity, 2);
  assert.equal(app.cart.totals().discount, 0);
});
test('повреждённый JSON и запрет localStorage не ломают корзину', () => {
  assert.equal(setup('{broken').app.cart.lines().length, 0);
  const { app, warnings } = setup(null,true); app.cart.add(2);
  assert.equal(app.cart.totals().total,9800);
  assert(warnings.some(s=>s.includes('не разрешает')));
});
test('лимит количества защищает от чрезмерного добавления', () => {
  const { app } = setup(); for(let i=0;i<105;i++) app.cart.add(1);
  assert.equal(app.cart.lines()[0].quantity,99);
});
test('скидка и доставка рассчитываются на согласованную сумму', () => {
  const { app } = setup(JSON.stringify({items:[{id:1,quantity:1}],promo:'LUMO10'}));
  assert.equal(app.cart.totals('courier').discount,1490);
  assert.equal(app.cart.totals('courier').total,13910);
  assert.equal(app.cart.totals('pickup').total,13410);
  assert.equal(app.cart.totals('transport').total,14610);
  app.cart.add(2);
  assert.equal(app.cart.totals('courier').shipping,0);
  assert.equal(app.cart.totals('courier').total,22230);
  app.cart.clear();
  assert.equal(app.cart.totals('transport').total,0);
});
test('валидация email и российского телефона отклоняет неверные значения', () => {
  const { app } = setup();
  assert(app.validation.emailValid('student@example.ru'));
  for(const s of ['', 'broken','a@b','a b@example.ru']) assert(!app.validation.emailValid(s));
  for(const s of ['+7 (999) 123-45-67','89991234567']) assert(app.validation.phoneValid(s));
  for(const s of ['+7 12','+19991234567','abc89991234567','899912345678']) assert(!app.validation.phoneValid(s));
});
test('обязательные поля, согласие и адрес проверяются отдельно', () => {
  const { app } = setup();
  const field = {value:'',type:'text',required:true,maxLength:80};
  assert(app.validation.errorFor(field));
  assert(app.validation.errorFor({...field,value:'Я',autocomplete:'name'}));
  assert(app.validation.errorFor({...field,type:'checkbox',checked:false}));
  assert(app.validation.errorFor({...field,id:'order-address',value:'дом'}));
  assert.equal(app.validation.errorFor({...field,value:'Казань, ул. Учебная, 1',id:'order-address'}),'');
});
