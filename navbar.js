// navbar.js — работает на любых страницах
document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById("navbar");
  const logoSvg = document.getElementById("logoSvg");

  const desktopLinks = document.getElementById("desktopLinks");
  const mobileLinks = document.getElementById("mobileLinks");

  const burgerBtn = document.getElementById("burgerBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  const closeBtn = document.getElementById("closeBtn");

  // если на странице нет навбара — просто выходим
  if (!navbar) return;

  // ===== меню ссылок (межстраничное) =====
  const navLinks = [
    { name: "Главная", href: "index.html#home" },
    { name: "О Нас", href: "index.html#about" },
    { name: "Каталог", href: "catalog.html" },
    { name: "Контакт", href: "index.html#contact" },
  ];

  function setMenuOpen(open) {
    if (!mobileMenu) return;
    mobileMenu.classList.toggle("open", open);
    mobileMenu.setAttribute("aria-hidden", String(!open));
  }

  function createLink({ name, href }, isMobile = false) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = name;

    if (!isMobile) {
      a.className = "nav-link";
      const underline = document.createElement("div");
      underline.className = "underline";
      a.appendChild(underline);
    } else {
      a.addEventListener("click", () => setMenuOpen(false));
    }

    return a;
  }

  // вставляем ссылки в desktop (перед кнопкой)
  if (desktopLinks) {
    const newLaunchBtn = desktopLinks.querySelector("button");
    navLinks.forEach(l => desktopLinks.insertBefore(createLink(l, false), newLaunchBtn));
  }

  // mobile ссылки
  if (mobileLinks) {
    mobileLinks.innerHTML = "";
    navLinks.forEach(l => mobileLinks.appendChild(createLink(l, true)));
  }

  // ===== анимация шапки при скролле =====
  function handleScroll() {
    const scrolled = window.scrollY > 10;
    navbar.classList.toggle("is-scrolled", scrolled);
    if (logoSvg) logoSvg.classList.toggle("is-scrolled", scrolled);
  }
  window.addEventListener("scroll", handleScroll, { passive: true });
  handleScroll();

  // ===== открытие/закрытие моб.меню =====
  if (burgerBtn) {
    burgerBtn.addEventListener("click", () => setMenuOpen(!mobileMenu?.classList.contains("open")));
    burgerBtn.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setMenuOpen(!mobileMenu?.classList.contains("open"));
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", () => setMenuOpen(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenuOpen(false); });
});
