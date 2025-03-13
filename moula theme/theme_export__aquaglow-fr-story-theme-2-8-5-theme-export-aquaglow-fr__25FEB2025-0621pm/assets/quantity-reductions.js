if (!customElements.get("quantity-reductions")) {
	customElements.define(
		"quantity-reductions",
		class QuantityReductions extends HTMLElement {
			constructor() {
				super();

				this.sectionId = this.dataset.sectionId;
				this.allReductions = this.querySelectorAll(".product-reductions__item");
				this.inputQuantity = this.querySelector("#quantityReductions");
				this.priceContainers = document.querySelectorAll(
					`#ProductInfo-${this.sectionId} .product__price`
				);

				this.allReductions.forEach((reduction) => {
					reduction.addEventListener("click", (e) =>
						this.handleClickOnEl(e, reduction)
					);
				});
			}

			handleClickOnEl(event, elClicked) {
				const parentContainer = event.target.closest(
					".product-reductions__item"
				);

				if (parentContainer) {
					if (this.priceContainers)
						this.priceContainers.forEach((priceContainer) =>
							this.updatePrice(priceContainer, parentContainer)
						);

					this.inputQuantity.value = parentContainer.dataset.quantity;
					this.allReductions.forEach((item) => item.classList.remove("active"));
					parentContainer.classList.add("active");
				}
			}

			updatePrice(priceContainer, parentContainer) {
				const comparePrice = priceContainer.querySelector(
					".price__sale span s"
				);
				const salePrice = priceContainer.querySelector(".price-item--sale");
				const saleTag = priceContainer.querySelector(".product__sale-badge");
				const regularPrice = priceContainer.querySelector(
					".price__regular .price-item"
				);

				let saleTagTextContent;
				if (saleTag) saleTagTextContent = saleTag.textContent;

				if (comparePrice && salePrice) {
					comparePrice.textContent = parentContainer.dataset.comparePrice;
					salePrice.textContent = parentContainer.dataset.salePrice;
					parentContainer.dataset.saleTag === ""
						? (saleTag.textContent = saleTagTextContent)
						: (saleTag.textContent = parentContainer.dataset.saleTag);
				} else {
					regularPrice.textContent = parentContainer.dataset.salePrice;
				}
			}
		}
	);
}
