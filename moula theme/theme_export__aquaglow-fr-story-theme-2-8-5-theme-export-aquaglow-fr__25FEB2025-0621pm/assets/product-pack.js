if (document.querySelectorAll('component-pack').length === 0) {
  document.querySelectorAll('.pack__wrapper .pack').forEach(pack => {
    pack.addEventListener('click', function () {
      resetSelectedPack();
      pack.classList.add('pack__selected');
      document.querySelector('input[name=quantity].quantity__input').value = pack.dataset.quantity;
    });
  });

  function resetSelectedPack() {
    document.querySelectorAll('.pack__wrapper .pack').forEach(pack => {
      pack.classList.remove('pack__selected');
    });
  }
}

/**
 * @param {string} element
 * @returns {boolean}
 */
function isStringNullish(element) {
  return element === null || element === undefined || element === '';
}

if (!customElements.get('product-pack')) {
  class ProductPack extends HTMLElement {
    constructor() {
      super();

      this.packStyle = this.dataset.style;
      this.sectionId = this.dataset.sectionId;
      this.packs = this.querySelectorAll('.pack__wrapper component-pack');
      this.addToCartButton = this.querySelector('#product-pack-submit');
      this.form = this.querySelector('form');
      this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      this.submitButton = this.querySelector('[type="submit"]');
      this.priceContainers = document.querySelectorAll(`#ProductInfo-${this.sectionId} .product__price`);

      if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
      document.body.classList.add('packPresentOnPage');
    }

    connectedCallback() {
      this.listenEvents();
    }

    listenEvents() {
      this.onPackSelection();
      let array = [];

      document.addEventListener('component-pack:array-initialized', event => {
        array = event.detail.array;
      });

      this.form.addEventListener('submit', event => {
        this.addToCart(event, array);
      });
    }

    resetSelectedPack() {
      document.querySelectorAll('.pack__wrapper .pack').forEach(pack => {
        pack.classList.remove('pack__selected');
      });
    }

    onPackSelection() {
      this.packs.forEach(pack => {
        pack.addEventListener('click', () => {
          this.updatePrice(pack);
          this.resetSelectedPack();
          pack.classList.add('pack__selected');
          pack.onPackSelection();
          if (this.packStyle === 'stack') this.updateSelectsDisplay(pack);
        });
      });
    }

    updateSelectsDisplay(pack) {
      const selects = document.querySelectorAll('.pack__stack--selects');
      const selectsActive = document.querySelectorAll(`.${pack.dataset.stack}`);
      selects.forEach(select => select.classList.remove('stack-active'));
      selectsActive.forEach(select => select.classList.add('stack-active'));
    }

    updatePrice(pack) {
      this.priceContainers.forEach(priceContainer => {
        const comparePrice = priceContainer.querySelector('.price__sale span s');
        const salePrice = priceContainer.querySelector('.price-item--sale');
        const regularPrice = priceContainer.querySelector('.price-item');

        if (comparePrice && salePrice) {
          comparePrice.innerHTML = pack.dataset.comparePrice;
          salePrice.innerHTML = pack.dataset.regularPrice;
        } else {
          regularPrice.innerHTML = pack.dataset.regularPrice;
        }
      });
    }

    addToCart(event, array) {
      event.preventDefault();
      let items = this.filterItems(array);

      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('loading');
      this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const formData = new FormData(this.form);
      if (this.cart) {
        formData.append(
          'sections',
          this.cart.getSectionsToRender().map(section => section.id)
        );
        formData.append('sections_url', window.location.pathname);
        this.cart.setActiveElement(document.activeElement);
      }
      config.body = formData;

      for (let i = 0; i < items.length; i++) {
        config.body.set(`items[${i}][id]`, items[i].id);
        config.body.set(`items[${i}][quantity]`, items[i].quantity);
      }

      const upsellProducts = window.productATCUpsells;
      const idList = items.map(item => item.id.toString());

      const quantityInput = document.querySelector('component-pack.pack__selected');
      let quantityValue = '1';
      quantityInput ? (quantityValue = quantityInput.dataset.quantity) : (quantityValue = '1');

      let upsellProductsIndex = 0;
      if (upsellProducts && upsellProducts.length > 0) {
        upsellProducts.forEach(product => {
          const triggerArray = product.trigger.split(',');
          const hasMatchingTrigger = triggerArray.some(trigger => idList.includes(trigger.trim()));

          if (product.quantityBehavior === 'equals') {
            if (hasMatchingTrigger && product.quantity === quantityValue) {
              config.body.append(`items[${upsellProductsIndex + items.length}][id]`, product.idToAdd);
              config.body.append(`items[${upsellProductsIndex + items.length}][quantity]`, product.quantityToAdd);
              upsellProductsIndex += 1;
            }
          } else {
            if (hasMatchingTrigger && product.quantity <= quantityValue) {
              config.body.append(`items[${upsellProductsIndex + items.length}][id]`, product.idToAdd);
              config.body.append(`items[${upsellProductsIndex + items.length}][quantity]`, product.quantityToAdd);
              upsellProductsIndex += 1;
            }
          }
        });
      }

      if (items.length === 0) {
        config.body.set(`items[product_id][id]`, parseInt(this.dataset.productId));

        if (document.querySelectorAll('component-pack').length === 0) {
          config.body.set(
            `items[product_id][quantity]`,
            parseInt(document.querySelector('input[name=quantity].quantity__input').value)
          );
        } else {
          config.body.set(
            `items[product_id][quantity]`,
            parseInt(this.querySelector('component-pack.pack__selected').dataset.quantity)
          );
        }
      }

      fetch(`${routes.cart_add_url}`, config)
        .then(response => response.json())
        .then(response => {
          if (response.status) {
            const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
            if (!soldOutMessage) return;

            this.submitButton.setAttribute('aria-disabled', true);
            this.submitButton.querySelector('span').classList.add('hidden');
            soldOutMessage.classList.remove('hidden');
            this.error = true;
            return;
          } else if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }

          this.cart.renderContents(response);
        })
        .catch(e => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          if (!this.error) this.submitButton.removeAttribute('aria-disabled');
          this.querySelector('.loading-overlay__spinner').classList.add('hidden');
        });
    }

    /**
     * @param {Array} array
     * @returns Array
     */
    filterItems(array) {
      const countMap = array.reduce((acc, item) => {
        if (item.id != null) {
          acc[item.id] = (acc[item.id] || 0) + 1;
        }
        return acc;
      }, {});

      return Object.keys(countMap).map(key => ({
        id: Number(key),
        quantity: countMap[key],
      }));
    }
  }
  customElements.define('product-pack', ProductPack);
}

if (!customElements.get('component-pack')) {
  class ComponentPack extends HTMLElement {
    constructor() {
      super();
      (this.template = this.closest('product-pack').querySelector('template#product-pack-variants').content),
        (this.options = Array.from(this.template.querySelectorAll('option'))),
        (this.selectedVariants = []);
      this.trueButtonText = document.querySelector('product-pack [name="add"] .addbtntext').innerHTML;
    }

    connectedCallback() {
      this.listenEvents(), this.initializeSelectedVariants(), this.onPackSelection();
    }

    listenEvents() {
      this.onOptionSelection();
    }

    initializeSelectedVariants() {
      if (this.querySelectorAll('.pack__select--container').length === 0) return;

      this.querySelectorAll('.pack__select--container').forEach((container, index) => {
        let _selectedVariant = this.options.filter(variant => {
          return variant.dataset.option.includes(container.querySelector('select').selectedOptions[0].value);
        });

        this.selectedVariants.push({
          index: index,
          id: parseInt(_selectedVariant[0].dataset.id),
          available: _selectedVariant[0].dataset.available === 'true',
        });
      });

      this.classList.contains('pack__selected') ? this.dispatchSelectedVariants() : null;
    }

    onPackSelection() {
      if (this.classList.contains('pack__selected')) {
        this.toggleSelectedVariantsAvailability();
        this.dispatchSelectedVariants();
      }
    }

    toggleSelectedVariantsAvailability() {
      if (this.selectedVariants.some(variant => variant.available === false)) {
        this.toggleAddButton(true, window.variantStrings.soldOut, false);
      } else {
        this.toggleAddButton(false, '', false);
      }
    }

    onOptionSelection() {
      this.querySelectorAll('.pack__select--container').forEach((container, index) => {
        this.findOptions(container, index);
      });
    }

    dispatchSelectedVariants() {
      document.dispatchEvent(
        new CustomEvent('component-pack:array-initialized', {
          detail: {
            array: this.selectedVariants,
          },
        })
      );
    }

    findOptions(container, index) {
      container.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', () => {
          this.onOptionChanged(container, index);

          if (!this.classList.contains('pack__selected')) return;
          this.dispatchSelectedVariants();
        });
      });
    }

    onOptionChanged(container, index) {
      let currentVariantOptions = [];

      container.querySelectorAll('select').forEach(select => {
        currentVariantOptions.push(select.selectedOptions[0].value);
      });

      let _selectedVariant = this.options.filter(variant => {
        return currentVariantOptions.every(optionValue => variant.dataset.option.includes(optionValue));
      });

      this.selectedVariant = _selectedVariant[0];

      let foundIndex = this.selectedVariants.findIndex(variant => variant.index === index);

      if (foundIndex !== -1) {
        this.selectedVariants[foundIndex] = {
          index: index,
          id: parseInt(this.selectedVariant.dataset.id),
          available: this.selectedVariant.dataset.available === 'true',
        };
      } else {
        this.selectedVariants.push({
          index: index,
          id: parseInt(this.selectedVariant.dataset.id),
          available: this.selectedVariant.dataset.available === 'true',
        });
      }

      if (!this.selectedVariant) {
        console.error('Aucune variante ne correspond aux options sélectionnées.');
        return;
      }

      this.toggleSelectedVariantsAvailability();
    }

    toggleAddButton(disable = true, text, modifyClass = true) {
      const productPack = this.closest('product-pack');
      const addButton = productPack.querySelector('[name="add"]');
      const addButtonText = productPack.querySelector('[name="add"] .addbtntext');
      if (!addButton) return;

      if (disable) {
        addButton.setAttribute('disabled', 'disabled');
        if (text) addButtonText.textContent = text;
      } else {
        addButton.removeAttribute('disabled');
        addButtonText.innerHTML = this.trueButtonText;
      }

      if (!modifyClass) return;
    }
  }
  customElements.define('component-pack', ComponentPack);
}

/**
 * une suite de pseudos tests pour les packs
 * @test {product-pack} au chargement de la page, sélectionner le pack par défaut et mettre à jour la quantité
 * @test {product-pack} au changement de pack, selection du pack sélectionné et mise à jour de la quantité
 * @test {product-pack} au changement de pack, selection du pack sélectionné et mise à jour de l'input id
 * @test {component-pack} au changement d'option, mise à jour de la variante sélectionnée et de l'input id
 * @test {component-pack} si la variante sélectionnée est indisponible, désactiver le bouton ajouter au panier
 * @test {component-pack} si la variante sélectionnée est disponible, activer le bouton ajouter au panier
 * @test {component-pack} si la variante sélectionnée est indisponible, afficher le message de stock épuisé
 * @test {component-pack} si la variante sélectionnée est disponible, afficher le texte par défaut du bouton ajouter au panier
 * @test {component-pack} si la variante sélectionnée est indisponible, ajouter l'attribut disabled au bouton ajouter au panier
 * @test {component-pack} si la variante sélectionnée est disponible, supprimer l'attribut disabled au bouton ajouter au panier
 */
