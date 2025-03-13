const getFormattedAmount = (amount) => {
  return new Intl.NumberFormat(document.body.dataset.shopLocale, {
    style: "currency",
    currency: document.body.dataset.shopCurrency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
};

if (!customElements.get("bundle-form")) {
  customElements.define(
    "bundle-form",
    class BundleForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector("form");
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector("cart-notification") ||
          document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector("cart-drawer"))
          this.submitButton.setAttribute("aria-haspopup", "dialog");

        this.querySelectorAll(".select__select").forEach((select) => {
          select.addEventListener("change", (event) =>
            this.changeVariant(select, event)
          );
        });

        this.querySelectorAll(".bundle__meta--checked input").forEach(
          (input) => {
            input.addEventListener("change", () => this.changeChecked(input));
          }
        );
      }

      updatePrice(el, price, compareAtPrice) {
        el.dataset.price = price;
        el.dataset.compareAtPrice = compareAtPrice;
        
        if (el.querySelector(".price--compare del")) {
          el.querySelector(".price--compare del").textContent =
            getFormattedAmount(compareAtPrice);
        }
        
        el.querySelector(".price--regular").textContent =
          getFormattedAmount(price);

        this.updateTotalPrice();
      }

      updateTotalPrice() {
        let compareAtPrice = 0;
        let price = 0;
        const allProducts = this.querySelectorAll(".bundle__product.checked").forEach((product) => {
          const productCompareAtPrice = +product.dataset.compareAtPrice >= +product.dataset.price ? +product.dataset.compareAtPrice : +product.dataset.price;
          compareAtPrice += productCompareAtPrice;
          price += +product.dataset.price;
        });

        const savings = compareAtPrice > price;

        if (this.querySelector(".bundle__compare-at-price del")) {
          this.querySelector(".bundle__compare-at-price del").style.display = "inline-block";
          
          savings
            ? this.querySelector(".bundle__compare-at-price del").textContent = getFormattedAmount(compareAtPrice)
            : this.querySelector(".bundle__compare-at-price del").style.display = "none";
        }
        
        this.querySelector(".bundle__price--regular").textContent =
          getFormattedAmount(price);
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;

        let protection = false;
        if (this.submitButton.classList.contains("button__drawer--protection"))
          protection = true;
        if (protection && this.submitButton.classList.contains("active"))
          return;

        this.handleErrorMessage();

        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        if (!protection)
          this.querySelector(".loading-overlay__spinner").classList.remove(
            "hidden"
          );

        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];

        const formData = new FormData();

        this.querySelectorAll(".bundle__product.checked").forEach((product) => {
          formData.append("items[][id]", product.id);
          formData.append("items[][quantity]", 1);
        });

        if (this.cart) {
          formData.append(
            "sections",
            this.cart.getSectionsToRender().map((section) => section.id)
          );
          formData.append("sections_url", window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }

        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.handleErrorMessage(response.description);
              const soldOutMessage =
                this.submitButton.querySelector(".sold-out-message");
              if (!soldOutMessage) return;
              this.submitButton.setAttribute("aria-disabled", true);
              this.submitButton.querySelector("span").classList.add("hidden");
              soldOutMessage.classList.remove("hidden");
              this.error = true;
              return;
            } else if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            this.error = false;
            this.cart.renderContents(response);
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove("loading");
            if (this.cart && this.cart.classList.contains("is-empty"))
              this.cart.classList.remove("is-empty");
            if (!this.error) {
              this.submitButton.removeAttribute("aria-disabled");
              if (protection) this.submitButton.classList.add("active");
            }
            if (!protection)
              this.querySelector(".loading-overlay__spinner").classList.add(
                "hidden"
              );
          });
      }

      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            ".product-form__error-message"
          );

        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      changeVariant(select, event) {
        const selectElement = event.target;
        const selectedOption =
          selectElement.options[selectElement.selectedIndex];

        const parent = this.querySelector(
          `.bundle__product--${select.dataset.productId}`
        );
        parent.id = select.value;
        this.updatePrice(
          parent,
          selectedOption.dataset.price,
          selectedOption.dataset.compareAtPrice
        );
      }

      changeChecked(input) {
        const parent = this.querySelector(
          `.bundle__product--${input.dataset.productId}`
        );
        parent.classList.toggle("checked");
        this.updateTotalPrice();
      }
    }
  );
}
