class StickyHeader extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.header = document.querySelector(".section-header");
    this.headerIsAlwaysSticky =
      this.getAttribute("data-sticky-type") === "always" ||
      this.getAttribute("data-sticky-type") === "reduce-logo-size";
    this.headerBounds = {};
    this.initializeHeaderPosition();
    this.logo = document.querySelector(".header__heading-logo");
    this.headerContent = document.querySelector(".header");
    this.setHeaderHeight();

    window
      .matchMedia("(max-width: 990px)")
      .addEventListener("change", this.setHeaderHeight.bind(this));

    if (this.headerIsAlwaysSticky) {
      this.header.classList.add("shopify-section-header-sticky");
    }

    this.currentScrollTop = 0;
    this.preventReveal = false;
    this.predictiveSearch = this.querySelector("predictive-search");

    this.onScrollHandler = this.onScroll.bind(this);
    this.hideHeaderOnScrollUp = () => (this.preventReveal = true);

    this.addEventListener("preventHeaderReveal", this.hideHeaderOnScrollUp);
    window.addEventListener("scroll", this.onScrollHandler, false);

    this.createObserver();
  }

  initializeHeaderPosition() {
    const announcementHeight = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--announcement-height");
    if (announcementHeight) {
      this.header.style.top = announcementHeight;
    } else {
      console.error("Announcement height not set or invalid.");
    }
  }

  setHeaderHeight() {
    document.documentElement.style.setProperty(
      "--header-height",
      `${this.header.offsetHeight}px`
    );
  }

  updateHeaderHeight() {
    if (this.headerContent) {
      const headerHeight = this.headerContent.offsetHeight + "px";
      document.documentElement.style.setProperty(
        "--header-height",
        headerHeight
      );
    }
  }

  disconnectedCallback() {
    this.removeEventListener("preventHeaderReveal", this.hideHeaderOnScrollUp);
    window.removeEventListener("scroll", this.onScrollHandler);
  }

  createObserver() {
    let observer = new IntersectionObserver((entries, observer) => {
      this.headerBounds = entries[0].intersectionRect;
      observer.disconnect();
    });

    observer.observe(this.header);
  }

  onScroll() {
    document.body.classList.add("header-sticky");
    
    const scrollTop = document.documentElement.scrollTop;

    if (this.predictiveSearch && this.predictiveSearch.isOpen) return;

    if (
      scrollTop > this.currentScrollTop &&
      scrollTop > this.headerBounds.bottom
    ) {
      /* Scroll down */
      this.header.classList.add("scrolled-past-header");
      if (this.preventHide) return;
      requestAnimationFrame(this.hide.bind(this));
    } else if (
      scrollTop < this.currentScrollTop &&
      scrollTop > this.headerBounds.bottom
    ) {
      /* Scroll up */
      this.header.classList.add("scrolled-past-header");
      if (!this.preventReveal) {
        requestAnimationFrame(this.reveal.bind(this));
      } else {
        window.clearTimeout(this.isScrolling);
        this.isScrolling = setTimeout(() => {
          this.preventReveal = false;
        }, 66);
        requestAnimationFrame(this.hide.bind(this));
      }
    } else if (scrollTop <= this.headerBounds.top) {
      this.header.classList.remove("scrolled-past-header");
      requestAnimationFrame(this.reset.bind(this));
    }

    this.currentScrollTop = scrollTop;
  }

  hide() {
    if (this.getAttribute("data-sticky-type") === "reduce-logo-size") {
      this.logo.classList.add("header__logo--small");
      this.headerContent.classList.add("header__padding--small");
      this.updateHeaderHeight();
    }
    if (this.headerIsAlwaysSticky) return;
    this.header.classList.add(
      "shopify-section-header-hidden",
      "shopify-section-header-sticky"
    );
    document.body.classList.add("header-hidden", "header-sticky");
    this.closeMenuDisclosure();
    this.closeSearchModal();
    this.header.style.top = "";
  }

  reveal() {
    if (this.getAttribute("data-sticky-type") === "reduce-logo-size") {
      this.logo.classList.add("header__logo--small");
      this.headerContent.classList.add("header__padding--small");
      this.updateHeaderHeight();
    }
    this.header.classList.add("shopify-section-header-sticky", "animate");
    this.header.classList.remove("shopify-section-header-hidden");
    document.body.classList.remove("header-hidden");
    const announcementHeight = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--announcement-height");
    this.header.style.top = announcementHeight;
  }

  reset() {
    if (this.getAttribute("data-sticky-type") === "reduce-logo-size") {
      this.logo.classList.remove("header__logo--small");
      this.headerContent.classList.remove("header__padding--small");
    }
    this.header.classList.remove(
      "shopify-section-header-hidden",
      "shopify-section-header-sticky",
      "animate"
    );
    document.body.classList.remove("header-hidden", "header-sticky");
    const announcementHeight = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--announcement-height");
    this.header.style.top = announcementHeight;
    this.updateHeaderHeight();
    setTimeout(() => { this.updateHeaderHeight(); }, 250)
  }

  closeMenuDisclosure() {
    this.disclosures =
      this.disclosures || this.header.querySelectorAll("header-menu");
    this.disclosures.forEach((disclosure) => disclosure.close());
  }

  closeSearchModal() {
    this.searchModal =
      this.searchModal || this.header.querySelector("details-modal");
    if (this.searchModal) this.searchModal.close(false);
  }
}

customElements.define("sticky-header", StickyHeader);
