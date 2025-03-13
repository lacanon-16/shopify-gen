if (document.querySelector(".section-sticky-atc")) {
  const showAtcSticky = () => {
    const atcSticky = document.querySelector(".section-sticky-atc");
    const atcButton = document.querySelector(".product__add-to-cart");
    let isButtonScrolled = false;

    const handleScroll = () => {
      const buttonRect = atcButton.getBoundingClientRect();
      const scrollPosition = window.scrollY || window.pageYOffset;

      if (scrollPosition > buttonRect.bottom) {
        isButtonScrolled = true;
        atcSticky.classList.add("sticky-visible");
      } else if (isButtonScrolled && scrollPosition <= buttonRect.bottom) {
        isButtonScrolled = false;
        atcSticky.classList.remove("sticky-visible");
      }
    };

    window.addEventListener("scroll", handleScroll);
  };

  showAtcSticky();
  document.addEventListener("shopify:section:load", showAtcSticky);
  document.addEventListener("shopify:section:unload", showAtcSticky);

  document.addEventListener("DOMContentLoaded", function () {
    const atcSticky = document.querySelector(".section-sticky-atc");
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    const initialHeaderBottom =
      header.getBoundingClientRect().bottom + window.scrollY;

    function handleScroll() {
      const scrollPosition = window.scrollY || window.pageYOffset;
      const footerRect = footer.getBoundingClientRect();
      const footerTopVisible = footerRect.top <= window.innerHeight;
      const atcButtonRect = document
        .querySelector(".product__add-to-cart")
        .getBoundingClientRect();
      const configElement = document.getElementById("sticky-atc-config");
      const enableBarAfterATC =
        configElement.getAttribute("data-show-sticky-before-atc") === "true";

      if (
        scrollPosition > initialHeaderBottom &&
        !footerTopVisible &&
        (enableBarAfterATC || atcButtonRect.bottom < 0)
      ) {
        atcSticky.classList.add("sticky-visible");
      } else {
        atcSticky.classList.remove("sticky-visible");
      }
    }

    window.addEventListener("scroll", handleScroll);
  });

  document.addEventListener("DOMContentLoaded", updateHeaderHeight);
  window.addEventListener("resize", updateHeaderHeight);

  function updateHeaderHeight() {
    const header = document.querySelector(".header");
    if (header) {
      const headerHeight = header.offsetHeight + "px";
      document.documentElement.style.setProperty(
        "--header-height",
        headerHeight
      );
    }
  }
}
