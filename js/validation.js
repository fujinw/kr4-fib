'use strict';

Lumo.validation = (() => {
  function emailValid(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value); }
  function phoneValid(value) {
    if (!/^[+\d\s()\-]+$/u.test(value)) return false;
    const digits = value.replace(/\D/g, '');
    return /^[78]\d{10}$/.test(digits);
  }

  function errorFor(field) {
    const value = field.value.trim();
    if (field.type === 'checkbox') return field.required && !field.checked ? 'Нужно ваше согласие.' : '';
    if (field.required && !value) return 'Заполните это поле.';
    if (!value) return '';
    if (field.autocomplete === 'name' && value.length < 2) return 'Введите не менее двух символов.';
    if (field.type === 'email' && !emailValid(value)) return 'Введите e-mail, например name@example.ru.';
    if (field.type === 'tel' && !phoneValid(value)) return 'Введите 11 цифр с 7 или 8, например +7 999 123-45-67.';
    if (field.maxLength > 0 && value.length > field.maxLength) return `Допустимо до ${field.maxLength} символов.`;
    if (field.id === 'order-address' && field.required && value.length < 8) return 'Укажите город, улицу и дом.';
    return '';
  }

  function init() {
    document.querySelectorAll('[data-validate-form]').forEach(form => {
      const fields = [...form.querySelectorAll('input:not([type="radio"]), select, textarea')];
      const result = form.querySelector('[data-form-result]');
      let submitted = false;
      let sending = false;
      fields.forEach(field => {
        const error = Lumo.el('span', 'field-error');
        error.id = `${field.id}-error`;
        error.hidden = true;
        field.setAttribute('aria-describedby', error.id);
        if (field.type === 'checkbox') {
          // Подпись остаётся рядом с флажком, ошибка находится под всей подписью.
          field.closest('label').after(error);
        } else {
          const wrapper = Lumo.el('div', 'field-with-error');
          field.parentNode.insertBefore(wrapper, field);
          wrapper.append(field, error);
        }
      });
      function validateField(field) {
        const message = errorFor(field);
        const error = document.getElementById(`${field.id}-error`);
        error.textContent = message;
        error.hidden = !message;
        field.classList.toggle('is-invalid', Boolean(message));
        field.setAttribute('aria-invalid', String(Boolean(message)));
        return !message;
      }
      function deliveryChanged() {
        const address = form.querySelector('#order-address');
        if (!address) return;
        const pickup = form.querySelector('input[name="delivery"]:checked').value === 'pickup';
        address.required = !pickup;
        address.disabled = pickup;
        form.querySelector('[data-address-label]').textContent = pickup ? 'Адрес не нужен при самовывозе' : 'Адрес доставки *';
        if (submitted) validateField(address);
        Lumo.cart.render();
      }
      function hideResult() { result.hidden = true; result.textContent = ''; }
      form.addEventListener('input', event => {
        if (submitted && fields.includes(event.target)) validateField(event.target);
        if (!sending) hideResult();
      });
      form.addEventListener('change', event => {
        if (event.target.name === 'delivery') deliveryChanged();
        if (submitted && fields.includes(event.target)) validateField(event.target);
        if (!sending) hideResult();
      });
      form.addEventListener('submit', event => {
        event.preventDefault();
        if (sending) return;
        submitted = true;
        const validity = fields.map(validateField);
        const emptyCart = form.dataset.validateForm === 'order' && !Lumo.cart.lines().length;
        result.hidden = false;
        result.classList.remove('form-message--success');
        if (validity.includes(false) || emptyCart) {
          result.textContent = emptyCart ? 'Проверьте обязательные поля и добавьте товары из каталога.' : 'Проверьте выделенные поля.';
          fields.find(field => field.getAttribute('aria-invalid') === 'true')?.focus();
          return;
        }
        const name = fields.find(field => field.autocomplete === 'name').value.trim();
        const total = form.dataset.validateForm === 'order'
          ? Lumo.cart.totals(form.querySelector('input[name="delivery"]:checked').value).total : null;
        const button = form.querySelector('button[type="submit"]');
        const oldText = button.textContent;
        sending = true;
        button.disabled = true;
        form.inert = true;
        form.setAttribute('aria-busy', 'true');
        button.textContent = 'Подготавливаем…';
        result.textContent = 'Подготавливаем заявку…';
        // Имитация ожидания сервера. Данные формы не уходят в сеть и не сохраняются.
        setTimeout(() => {
          form.inert = false;
          form.removeAttribute('aria-busy');
          form.reset();
          fields.forEach(field => {
            field.removeAttribute('aria-invalid');
            field.classList.remove('is-invalid');
            document.getElementById(`${field.id}-error`).hidden = true;
          });
          submitted = false;
          sending = false;
          button.disabled = false;
          button.textContent = oldText;
          if (total !== null) Lumo.cart.clear();
          deliveryChanged();
          result.textContent = total !== null
            ? `${name}, заявка подготовлена. Сумма: ${Lumo.money(total)}. Это учебная демонстрация: заказ не отправлен, оплата не требуется. Корзина очищена.`
            : `${name}, обращение подготовлено. Это учебная демонстрация: сообщение не отправлено.`;
          result.classList.add('form-message--success');
          result.hidden = false;
          result.focus();
        }, 650);
      });
      deliveryChanged();
    });
  }
  return { init, emailValid, phoneValid, errorFor };
})();
