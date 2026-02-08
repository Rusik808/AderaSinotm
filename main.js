const isCatalogPage = location.pathname.endsWith("catalog.html");

// ======= ONE-PAGE NAV =======
const navLinks = isCatalogPage
  ? [
      { name: 'Главная', href: 'index.html#home' },
      { name: 'О Нас', href: 'index.html#about' },
      { name: 'Каталог', href: 'catalog.html' },
      { name: 'Контакт', href: 'index.html#contact' },
    ]
  : [
      { name: 'Главная', hash: '#home' },
      { name: 'О Нас', hash: '#about' },
      { name: 'Каталог', href: 'catalog.html' }, // ✅ переход на страницу
      { name: 'Контакт', hash: '#contact' },
    ];
const navbar = document.getElementById('navbar');
const logoSvg = document.getElementById('logoSvg');

const desktopLinks = document.getElementById('desktopLinks');
const mobileLinks = document.getElementById('mobileLinks');

const burgerBtn = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeBtn = document.getElementById('closeBtn');

function setMenuOpen(open){
  mobileMenu.classList.toggle('open', open);
  mobileMenu.setAttribute('aria-hidden', String(!open));
}

function getHeaderOffset(){
  // если navbar fixed/sticky — учитываем высоту, иначе 0
  const styles = window.getComputedStyle(navbar);
  const pos = styles.position;
  if (pos === 'fixed' || pos === 'sticky') return navbar.offsetHeight;
  return 0;
}

function scrollToSection(hash){
  const target = document.querySelector(hash);
  if (!target) return;

  const offset = getHeaderOffset();
  const top = target.getBoundingClientRect().top + window.pageYOffset - offset - 10;

  window.scrollTo({ top, behavior: 'smooth' });
}

function createLink(link, isMobile=false){
  const a = document.createElement('a');
  a.textContent = link.name;

  // ✅ обычная ссылка (catalog.html или index.html#about)
  if (link.href) {
    a.href = link.href;

    if(!isMobile){
      a.className = 'nav-link';
      const underline = document.createElement('div');
      underline.className = 'underline';
      a.appendChild(underline);
    } else {
      a.addEventListener('click', () => setMenuOpen(false));
    }

    return a; // ❗ не ставим preventDefault
  }

  // ✅ якорь внутри текущей страницы (только на index)
  a.href = link.hash;

  if(!isMobile){
    a.className = 'nav-link';
    const underline = document.createElement('div');
    underline.className = 'underline';
    a.appendChild(underline);
  } else {
    a.addEventListener('click', () => setMenuOpen(false));
  }

  a.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToSection(link.hash);
    history.replaceState(null, '', link.hash);
  });

  return a;
}




// Desktop links (вставляем перед кнопкой New Launch)
const newLaunchBtn = desktopLinks.querySelector('button');
navLinks.forEach(l => desktopLinks.insertBefore(createLink(l,false), newLaunchBtn));

// Mobile links
mobileLinks.innerHTML = '';
navLinks.forEach(l => mobileLinks.appendChild(createLink(l,true)));

// Scroll по странице (эффект шапки)
function handleScroll(){
  const scrolled = window.scrollY > 10;
  navbar.classList.toggle('is-scrolled', scrolled);
  logoSvg.classList.toggle('is-scrolled', scrolled);
}
window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

// Mobile menu open/close
burgerBtn.addEventListener('click', () => setMenuOpen(!mobileMenu.classList.contains('open')));
burgerBtn.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    setMenuOpen(!mobileMenu.classList.contains('open'));
  }
});
closeBtn.addEventListener('click', () => setMenuOpen(false));
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') setMenuOpen(false); });

// если зашли по ссылке с #contact — проскроллить
window.addEventListener('load', () => {
  if (location.hash && document.querySelector(location.hash)) {
    scrollToSection(location.hash);
  }
});



const el = document.getElementById("changingTitle");

if (el) {
  const words = [
    "Горнодобывающая",
    "Погрузчики",
    "Автокраны",
    "Дорожные катки",
    "Экскаваторы"
  ];

  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const typeSpeed = 60;     // скорость печати (мс)
  const deleteSpeed = 35;   // скорость удаления
  const holdAfterType = 1200; // пауза после печати
  const holdAfterDelete = 300; // пауза после удаления

  function tick() {
    const word = words[wordIndex];

    if (!isDeleting) {
      // печатаем
      charIndex++;
      el.textContent = word.slice(0, charIndex);

      if (charIndex === word.length) {
        // допечатали — ждём, потом начинаем стирать
        setTimeout(() => {
          isDeleting = true;
          tick();
        }, holdAfterType);
        return;
      }

      setTimeout(tick, typeSpeed);
    } else {
      // стираем
      charIndex--;
      el.textContent = word.slice(0, Math.max(0, charIndex));

      if (charIndex === 0) {
        // стёрли — следующий word
        isDeleting = false;
        wordIndex = (wordIndex + 1) % words.length;

        setTimeout(tick, holdAfterDelete);
        return;
      }

      setTimeout(tick, deleteSpeed);
    }
  }

  // старт
  tick();
}

document.addEventListener("DOMContentLoaded", function() {
  const root = document.getElementById("heroCats");
  if (!root) return;

  const track = root.querySelector(".heroCats__track");
  if (!track) return;

  // Клонируем содержимое для бесконечного эффекта
  const clone = track.innerHTML;
  track.insertAdjacentHTML('beforeend', clone);

  // Обработка клика (пауза) для мобилок
  let isPaused = false;
  
  root.addEventListener("click", (e) => {
    // Если нажали на ссылку (или картинку внутри ссылки), не ставим на паузу, а идем по ссылке
    if (e.target.closest("a")) return;

    isPaused = !isPaused;
    track.style.animationPlayState = isPaused ? "paused" : "running";
  });
});

