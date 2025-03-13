if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      if (this.form.querySelector('[name=id]')) this.form.querySelector('[name=id]').disabled = false;
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
      this.submitButton = this.querySelector('[type="submit"]');
      if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

      const sectionId = this.dataset.sectionId;
      const requiredFields = document.querySelectorAll(`.custom__variant-required-${sectionId} input`);
      let formValid = true;
      
      requiredFields.forEach((field) => {
        if (!field.value) {
          formValid = false;
          field.classList.add('field--error');
        } else {
          field.classList.remove('field--error');
        }
      });
    
      if (!formValid) {
        this.handleErrorMessage(window.productForm.error);
        this.submitButton.classList.remove('loading');
        return;
      }

      let protection = false;
      if (this.submitButton.classList.contains('button__drawer--protection')) protection = true;
      if (protection && this.submitButton.classList.contains('active')) return;
      
      this.handleErrorMessage();

      this.submitButton.setAttribute('aria-disabled', true);
      this.submitButton.classList.add('loading');
      if (!protection) this.querySelector('.loading-overlay__spinner').classList.remove('hidden');

      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];

      const upsellProducts = window.productATCUpsells;
      let variantSelected = "";
      if (this.querySelector('.product-variant-id')) variantSelected = this.querySelector('.product-variant-id').value;

      const quantityInput = document.querySelector(`input[name="quantity"][form="${this.form.getAttribute('id')}"]`);
      let quantityValue = "1";
      quantityInput
        ? quantityValue = quantityInput.value
        : quantityValue = "1";
      
      const formData = new FormData(this.form);
      if (this.cart) {
        if (upsellProducts && upsellProducts.length > 0) {
          upsellProducts.forEach(product => {
            if (product.quantityBehavior === "equals") {
              if (product.trigger.includes(variantSelected) && product.quantity === quantityValue) {
                formData.append("items[][id]", product.idToAdd);
                formData.append("items[][quantity]", product.quantityToAdd);
              }
            } else {
              if (product.trigger.includes(variantSelected) && product.quantity <= quantityValue) {
                formData.append("items[][id]", product.idToAdd);
                formData.append("items[][quantity]", product.quantityToAdd);
              }
            }
          });
        }
        
        formData.append('sections', this.cart.getSectionsToRender().map((section) => section.id));
        formData.append('sections_url', window.location.pathname);
        
        this.cart.setActiveElement(document.activeElement);
      }
      config.body = formData;

      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            this.handleErrorMessage(response.description);

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
          
          this.error = false;
          const quickAddModal = this.closest('quick-add-modal');
          if (quickAddModal) {
            document.body.addEventListener('modalClosed', () => {
              setTimeout(() => { this.cart.renderContents(response) });
            }, { once: true });
            quickAddModal.hide(true);
          } else {
            this.cart.renderContents(response);
          }
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          this.submitButton.classList.remove('loading');
          if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
          if (!this.error) {
            this.submitButton.removeAttribute('aria-disabled');
            if (protection) this.submitButton.classList.add('active');
          }
          if (!protection) this.querySelector('.loading-overlay__spinner').classList.add('hidden');
        });
    }

    handleErrorMessage(errorMessage = false) {
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}
