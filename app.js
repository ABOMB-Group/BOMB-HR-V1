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

  // Add restrained reveal motion across all marketing pages.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motionTargets = document.querySelectorAll([
    ".section-heading",
    ".feature-card",
    ".price-card",
    ".pricing-plan",
    ".resource-card",
    ".scenario-card",
    ".case-card",
    ".channel-card",
    ".addon-card",
    ".path-list a",
    ".faq-grid details",
    ".data-card",
    ".app-capabilities span"
  ].join(","));

  if (!reduceMotion && "IntersectionObserver" in window) {
    root.classList.add("motion-enabled");
    motionTargets.forEach((element, index) => {
      element.classList.add("motion-item");
      element.style.setProperty("--motion-delay", `${(index % 4) * 70}ms`);
    });

    const motionObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("motion-in");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -45px 0px" });

    motionTargets.forEach((element) => motionObserver.observe(element));
  }

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

  // On the homepage, highlight Download APP while that section is in view.
  const appDownloadSection = document.getElementById("app-download");
  const homeNavLink = navLinks?.querySelector('a[href="index.html"]');
  const appNavLink = navLinks?.querySelector('a[href="#app-download"]');
  if (appDownloadSection && homeNavLink && appNavLink) {
    let navFrame = 0;
    const updateHomepageNav = () => {
      navFrame = 0;
      const sectionBox = appDownloadSection.getBoundingClientRect();
      const viewportMarker = window.innerHeight * 0.42;
      const appIsCurrent = sectionBox.top <= viewportMarker && sectionBox.bottom > viewportMarker;
      homeNavLink.classList.toggle("active", !appIsCurrent);
      appNavLink.classList.toggle("active", appIsCurrent);
      appNavLink.setAttribute("aria-current", appIsCurrent ? "page" : "false");
      homeNavLink.setAttribute("aria-current", appIsCurrent ? "false" : "page");
    };
    const requestNavUpdate = () => {
      if (navFrame) return;
      navFrame = window.requestAnimationFrame(updateHomepageNav);
    };
    window.addEventListener("scroll", requestNavUpdate, { passive: true });
    window.addEventListener("resize", requestNavUpdate);
    updateHomepageNav();
  }

  // Make cards that visually behave like links genuinely operable by mouse and keyboard.
  const linkedCards = [
    ...document.querySelectorAll("[data-link]"),
    ...document.querySelectorAll(".resource-card, .scenario-card, .case-card")
  ];
  linkedCards.forEach((card) => {
    const destination = card.dataset.link || card.querySelector("a[href]")?.getAttribute("href");
    if (!destination || card.dataset.cardReady === "true") return;
    card.dataset.cardReady = "true";
    card.classList.add("is-clickable");
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "link");
    const activate = (event) => {
      if (event.target.closest("a,button,input,select,textarea,label")) return;
      window.location.href = destination;
    };
    card.addEventListener("click", activate);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      window.location.href = destination;
    });
  });

  // Homepage feature tiles lead to the matching product overview.
  document.querySelectorAll(".feature-card").forEach((card) => {
    card.classList.add("is-clickable");
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "link");
    const open = () => { window.location.href = "products.html#modules"; };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });

  // Resource search and quick filters.
  const resourceSearch = document.getElementById("resourceSearch");
  const resourceCards = [...document.querySelectorAll(".resource-card")];
  const resourceStatus = document.getElementById("resourceSearchStatus");
  const filterResources = (value) => {
    const query = value.trim().toLocaleLowerCase("zh-Hant");
    let visible = 0;
    resourceCards.forEach((card) => {
      const matches = !query || card.textContent.toLocaleLowerCase("zh-Hant").includes(query);
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    if (resourceStatus) resourceStatus.textContent = query ? `找到 ${visible} 份相關資源` : `共 ${visible} 份資源`;
  };
  resourceSearch?.addEventListener("input", () => filterResources(resourceSearch.value));
  document.querySelectorAll("[data-resource-query]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!resourceSearch) return;
      resourceSearch.value = button.dataset.resourceQuery || "";
      filterResources(resourceSearch.value);
      document.getElementById("resource-library")?.scrollIntoView({ behavior: "smooth" });
    });
  });
  if (resourceSearch) {
    const initialQuery = new URLSearchParams(window.location.search).get("search") || "";
    if (initialQuery) {
      resourceSearch.value = initialQuery;
      filterResources(initialQuery);
    }
  }

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

  const contactForm = document.getElementById("contactForm");
  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const toast = document.getElementById("contactToast");
    toast?.classList.add("show");
    window.setTimeout(() => toast?.classList.remove("show"), 3000);
    contactForm.reset();
  });

  document.querySelectorAll("[data-contact-interest]").forEach((button) => {
    button.addEventListener("click", () => {
      const select = contactForm?.querySelector('select[name="interest"]');
      const interest = button.dataset.contactInterest || "";
      if (select) {
        const directMatch = [...select.options].find((option) => option.textContent.includes(interest));
        if (directMatch) select.value = directMatch.value;
      }
      contactForm?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => contactForm?.querySelector('input[name="company"]')?.focus(), 450);
    });
  });

  document.querySelectorAll(".role-mini.employee button, .combo-phone button").forEach((button) => {
    button.setAttribute("type", "button");
    button.addEventListener("click", () => { window.location.href = "app/"; });
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
