(() => {
  "use strict";

  const root = document.documentElement;
  const navLinks = document.getElementById("navLinks");
  const menuToggle = document.getElementById("menuToggle");
  const themeToggle = document.getElementById("themeToggle");

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
})();
