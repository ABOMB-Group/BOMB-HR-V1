(() => {
  "use strict";

  const root = document.documentElement;
  const navLinks = document.getElementById("navLinks") || document.querySelector(".main-nav");
  const menuToggle = document.getElementById("menuToggle");
  const themeToggle = document.getElementById("themeToggle") || document.querySelector(".theme-toggle");

  document.querySelectorAll(".reveal").forEach((element) => {
    element.classList.add("visible");
    element.style.opacity = "1";
    element.style.visibility = "visible";
    element.style.transform = "none";
  });

  const savedTheme = localStorage.getItem("bombhr-theme");
  if (savedTheme === "dark" || savedTheme === "light") {
    root.setAttribute("data-theme", savedTheme);
  }

  menuToggle?.addEventListener("click", () => {
    navLinks?.classList.toggle("open");
  });

  themeToggle?.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("bombhr-theme", next);
  });

  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => navLinks?.classList.remove("open"));
  });

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const demoForm = document.getElementById("demoForm");
  demoForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const toast = document.getElementById("toast");
    toast?.classList.add("show");
    window.setTimeout(() => toast?.classList.remove("show"), 2600);
    demoForm.reset();
  });

  document.querySelectorAll("[data-coming-soon]").forEach((button) => {
    button.addEventListener("click", () => {
      const toast = document.getElementById("toast");
      if (!toast) return;
      toast.textContent = `${button.dataset.comingSoon} 版本即將推出，目前可先安裝 Employee Web App。`;
      toast.classList.add("show");
      window.setTimeout(() => toast.classList.remove("show"), 2800);
    });
  });

  document.querySelectorAll("[data-modal-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-modal-open");
      if (!id) return;
      const modal = document.getElementById(id);
      modal?.classList.add("open");
      modal?.setAttribute("aria-hidden", "false");
    });
  });

  document.querySelectorAll("[data-modal-close], .modal-backdrop, .modal-close").forEach((button) => {
    button.addEventListener("click", () => {
      const modal = button.closest(".modal");
      modal?.classList.remove("open");
      modal?.setAttribute("aria-hidden", "true");
    });
  });

  // Pricing billing cycle switch.
  const billingButtons = document.querySelectorAll("[data-billing]");
  const priceBlocks = document.querySelectorAll("[data-plan-price]");
  const billingStatus = document.getElementById("billingStatus");

  function setBillingCycle(cycle) {
    billingButtons.forEach((button) => {
      const selected = button.dataset.billing === cycle;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    priceBlocks.forEach((block) => {
      const value = block.dataset[cycle];
      const amount = block.querySelector("strong");
      const note = block.querySelector("small");
      if (!value || !amount || !note) return;

      block.classList.add("is-changing");
      window.setTimeout(() => {
        amount.textContent = `NT$ ${Number(value).toLocaleString("zh-TW")}`;
        note.textContent =
          cycle === "annual"
            ? `年繳優惠價・${block.dataset.annual === "120" ? "最低 50 位員工起" : "最低 100 位員工起"}`
            : `月繳彈性價・${block.dataset.monthly === "140" ? "最低 50 位員工起" : "最低 100 位員工起"}`;
        block.classList.remove("is-changing");
      }, 150);
    });

    if (billingStatus) {
      billingStatus.textContent =
        cycle === "annual"
          ? "目前顯示年繳優惠價，每月按年約計費。"
          : "目前顯示月繳彈性價，可按月調整使用方案。";
    }

    localStorage.setItem("bombhr-billing-cycle", cycle);
  }

  billingButtons.forEach((button) => {
    button.addEventListener("click", () => setBillingCycle(button.dataset.billing));
  });

  if (billingButtons.length) {
    const savedCycle = localStorage.getItem("bombhr-billing-cycle");
    setBillingCycle(savedCycle === "monthly" ? "monthly" : "annual");
  }

})();
