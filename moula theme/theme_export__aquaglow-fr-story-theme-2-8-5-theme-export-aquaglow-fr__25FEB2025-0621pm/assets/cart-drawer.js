class CartDrawer extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('keyup', evt => evt.code === 'Escape' && this.close());
    this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
    this.setHeaderCartIconAccessibility();

    const goToCheckoutReducedBtns = document.querySelectorAll('.cartDiscountCodeButton');
    if (goToCheckoutReducedBtns) {
      goToCheckoutReducedBtns.forEach(goToCheckoutReducedBtn => {
        goToCheckoutReducedBtn.addEventListener('click', () => {
          this.handlePromoCode(goToCheckoutReducedBtn);
        });
      });
    }
  }

  handlePromoCode(el) {
    const theDiscount = document.getElementById(el.dataset.input).value;
    const toRedirect = `/checkout?discount=${theDiscount}`;
    window.location.href = toRedirect;
  }

  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector('#cart-icon-bubble');
    if (!cartLink) return;

    cartLink.setAttribute('role', 'button');
    cartLink.setAttribute('aria-haspopup', 'dialog');
    cartLink.addEventListener('click', event => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener('keydown', event => {
      if (event.code.toUpperCase() === 'SPACE') {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }

  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
    this.classList.add('animate', 'active');

    this.launchTimer();
    this.launchTrustSlider();
    this.launchUpsellSlider();

    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        if (cart.item_count === 0) {
          this.hideAllModules();
          if (localStorage.getItem('storyThemeDrawerTimer')) localStorage.removeItem('storyThemeDrawerTimer');
        }

        const shippingBars = document.querySelectorAll('.drawer__module--free_shipping');
        if (shippingBars) {
          shippingBars.forEach(shippingBar => {
            const before = shippingBar.querySelector('.free-shipping__left-amount');
            const after = shippingBar.querySelector('.free-shipping__success');
            const amount = shippingBar.querySelector('.free-shipping__amount');
            const drag = shippingBar.querySelector('.free-shipping__drag');
            const current = cart.total_price / 100;
            const target = shippingBar.dataset.target;
            const formattedAmount = new Intl.NumberFormat(document.body.dataset.shopLocale, {
              style: 'currency',
              currency: document.body.dataset.shopCurrency,
            }).format(target - current);

            if (target - current > 0) {
              amount.textContent = formattedAmount;
              before.classList.remove('hidden');
              after.classList.add('hidden');
              drag.style.width = `${(current * 100) / target}%`;
            } else {
              after.classList.remove('hidden');
              before.classList.add('hidden');
              drag.style.width = '100%';
            }
          });
        }
      });

    function updateCartTotals() {
      // Effectuer une requête AJAX pour obtenir les informations du panier
      fetch('/cart.js')
        .then(function (response) {
          return response.json();
        })
        .then(function (cartData) {
          let totalCompareAtPrice = 0;
          let totalSavings = 0;
          let indexItems = 1;

          cartData.items.forEach(function (item) {
            const varID = item.variant_id; // needed to find right variant from ajax results
            let itemCompareAtPrice = 0;

            const xhr = new XMLHttpRequest();
            xhr.open('GET', '/products/' + item.handle + '.js', false);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function () {
              if (xhr.readyState === 4 && xhr.status === 200) {
                const product = JSON.parse(xhr.responseText);
                product.variants.forEach(function (variant) {
                  if (variant.id == varID && variant.compare_at_price !== 0) {
                    itemCompareAtPrice = variant.compare_at_price;
                    return false;
                  }
                });
              }
            };
            xhr.send();

            const itemPrice = item.original_line_price / item.quantity; //price of item
            const totalDiscounts = cartData.total_discount;
            let itemTotalCompareAtPrice = '';
            const priceDrawerItemContainer = document.querySelector(`.priceWrapper${indexItems}`);
            const linePriceDrawerItemContainer = document.querySelector(`.linePriceWrapper${indexItems}`);
            indexItems++;

            const itemCompareAtPriceFormatted = new Intl.NumberFormat(document.body.dataset.shopLocale, {
              style: 'currency',
              currency: document.body.dataset.shopCurrency,
            }).format(itemCompareAtPrice / 100);
            const itemPriceFormatted = new Intl.NumberFormat(document.body.dataset.shopLocale, {
              style: 'currency',
              currency: document.body.dataset.shopCurrency,
            }).format(itemPrice / 100);
            const lineItemCompareAtPriceFormatted = new Intl.NumberFormat(document.body.dataset.shopLocale, {
              style: 'currency',
              currency: document.body.dataset.shopCurrency,
            }).format((itemCompareAtPrice * item.quantity) / 100);
            const lineItemPriceFormatted = new Intl.NumberFormat(document.body.dataset.shopLocale, {
              style: 'currency',
              currency: document.body.dataset.shopCurrency,
            }).format((itemPrice * item.quantity) / 100);

            const itemOnSaleHTML = `
              <div class="cart-item__discounted-prices">
                <span class="visually-hidden">${priceDrawerItemContainer.dataset.salePrice}</span>
                <s class="cart-item__old-price product-option">${itemCompareAtPriceFormatted}</s>
                <span class="visually-hidden">${priceDrawerItemContainer.dataset.regularPrice}</span>
                <strong class="cart-item__final-price product-option">${itemPriceFormatted}</strong>
              </div>
            `;
            const itemRegularHTML = `<div class="product-option">${itemPriceFormatted}</div>`;

            const lineItemOnSaleHTML = `
              <div class="cart-item__discounted-prices">
                <span class="visually-hidden">${priceDrawerItemContainer.dataset.salePrice}</span>
                <s class="cart-item__old-price product-option">${lineItemCompareAtPriceFormatted}</s>
                <span class="visually-hidden">${priceDrawerItemContainer.dataset.regularPrice}</span>
                <strong class="cart-item__final-price product-option">${lineItemPriceFormatted}</strong>
              </div>
            `;
            const lineItemRegularHTML = `<span class="product-option">${lineItemPriceFormatted}</span>`;

            if (itemCompareAtPrice == null || itemCompareAtPrice < 1) {
              totalCompareAtPrice += itemPrice + item.line_level_total_discount;
              totalSavings += item.line_level_total_discount;
              itemCompareAtPrice = 0;
              if (item.original_price <= item.final_price) {
                priceDrawerItemContainer.innerHTML = itemRegularHTML;
                linePriceDrawerItemContainer.innerHTML = lineItemRegularHTML;
              }
            } else {
              if (itemCompareAtPrice > itemPrice) {
                itemTotalCompareAtPrice = item.quantity * itemCompareAtPrice;
                totalCompareAtPrice += itemTotalCompareAtPrice + item.line_level_total_discount;
                totalSavings += itemTotalCompareAtPrice - item.original_line_price + item.line_level_total_discount;
                if (item.original_price <= item.final_price) {
                  priceDrawerItemContainer.innerHTML = itemOnSaleHTML;
                  linePriceDrawerItemContainer.innerHTML = lineItemOnSaleHTML;
                }
              } else {
                totalCompareAtPrice += itemPrice + item.line_level_total_discount;
                if (item.original_price <= item.final_price) {
                  priceDrawerItemContainer.innerHTML = itemRegularHTML;
                  linePriceDrawerItemContainer.innerHTML = lineItemRegularHTML;
                }
              }
            }
          });

          const formattedSubtotalAmount = new Intl.NumberFormat(document.body.dataset.shopLocale, {
            style: 'currency',
            currency: document.body.dataset.shopCurrency,
          }).format((cartData.total_price + totalSavings) / 100);

          const formattedSavingsAmount = new Intl.NumberFormat(document.body.dataset.shopLocale, {
            style: 'currency',
            currency: document.body.dataset.shopCurrency,
          }).format(totalSavings / 100);

          const formattedTotalAmount = new Intl.NumberFormat(document.body.dataset.shopLocale, {
            style: 'currency',
            currency: document.body.dataset.shopCurrency,
          }).format(cartData.total_price / 100);

          const subTotalEl = document.querySelector('.drawer__subtotal--amount');
          const savingsEl = document.querySelector('.drawer__savings--amount');
          const totalEl = document.querySelector('.drawer__total--amount');

          if (subTotalEl) {
            if (totalSavings > 0) {
              subTotalEl.textContent = formattedSubtotalAmount;
              document.querySelector('.totals.subtotal').style.display = 'flex';
            } else {
              document.querySelector('.totals.subtotal').style.display = 'none';
              document.querySelector('.totals.subtotal + *').style.marginTop = '0';
            }
          }

          if (savingsEl) {
            if (totalSavings > 0) {
              savingsEl.textContent = '-' + formattedSavingsAmount;
              document.querySelector('.totals.savings').style.display = 'flex';
            } else {
              document.querySelector('.totals.savings').style.display = 'none';
              document.querySelector('.totals.savings + *').style.marginTop = '0';
            }
          }

          if (totalEl) totalEl.textContent = formattedTotalAmount;
        });
    }

    // Appeler la fonction de mise à jour lors du chargement initial de la page
    updateCartTotals();

    this.addEventListener(
      'transitionend',
      () => {
        const containerToTrapFocusOn = this.classList.contains('is-empty')
          ? this.querySelector('.drawer__inner-empty')
          : document.getElementById('CartDrawer');
        const focusElement = this.querySelector('.drawer__inner') || this.querySelector('.drawer__close');
        trapFocus(containerToTrapFocusOn, focusElement);
      },
      { once: true }
    );

    document.body.classList.add('overflow-hidden');
    document.documentElement.classList.add('overflow-hidden');
  }

  hideAllModules() {
    document.querySelectorAll('.drawer__module').forEach(module => (module.style.display = 'none'));
  }

  launchTrustSlider() {
    if (document.querySelector('#drawer-trust__swiper')) {
      const trustDrawerCartSlider = new Swiper('#drawer-trust__swiper', {
        autoplay: { delay: 1000 },
        loop: true,
        navigation: {
          nextEl: '.button-next-drawer-trust__swiper',
          prevEl: '.button-prev-drawer-trust__swiper',
        },
      });
    }
  }

  launchUpsellSlider() {
    if (document.querySelector('#drawer-upsell__swiper')) {
      const upsellDrawerCartSlider = new Swiper('#drawer-upsell__swiper', {
        slidesPerView: 1.2,
        spaceBetween: 10,
        autoHeight: true,
      });
    }
  }

  launchTimer() {
    if (document.querySelector('.drawer__module--timer')) {
      const timer = document.querySelector('.drawer__module--timer-time');
      const timerDrawerModule = document.querySelector('.drawer__module--timer');
      let time;

      if (localStorage.getItem('storyThemeDrawerTimer')) {
        time = localStorage.getItem('storyThemeDrawerTimer');
      } else {
        time = timerDrawerModule.dataset.duration * 60;
        localStorage.setItem('storyThemeDrawerTimer', time);
      }

      const tick = () => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (time > 0) {
          localStorage.setItem('storyThemeDrawerTimer', time--);
        } else {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/cart/clear.js', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
              localStorage.removeItem('storyThemeDrawerTimer');
              window.location.reload();
            }
          };
          xhr.send();
        }
      };

      tick();
      setInterval(() => {
        tick();
      }, 1000);
    }
  }

  close() {
    this.classList.remove('active');
    removeTrapFocus(this.activeElement);
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
  }

  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute('role', 'button');
    cartDrawerNote.setAttribute('aria-expanded', 'false');

    if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
      cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
    }

    cartDrawerNote.addEventListener('click', event => {
      event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
    });

    cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
  }

  renderContents(parsedState) {
    this.querySelector('.drawer__inner').classList.contains('is-empty') &&
      this.querySelector('.drawer__inner').classList.remove('is-empty');
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach(section => {
      const sectionElement = section.selector
        ? document.querySelector(section.selector)
        : document.getElementById(section.id);

      if (!sectionElement) return;
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });

    setTimeout(() => {
      this.querySelector('#CartDrawer-Overlay').addEventListener('click', this.close.bind(this));
      this.open();
    });
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-drawer',
        selector: '#CartDrawer',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionDOM(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-drawer', CartDrawer);

class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: 'CartDrawer',
        section: 'cart-drawer',
        selector: '.drawer__inner',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
    ];
  }
}

customElements.define('cart-drawer-items', CartDrawerItems);
