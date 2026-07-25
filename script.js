/* ============================================================
   Trang cá nhân — script.js
   Không phụ thuộc thư viện ngoài.
   ============================================================ */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. Giao diện sáng / tối ---------- */
  var THEME_KEY = 'theme';
  var root = document.documentElement;
  var themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
    }
  }

  var savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch (e) {
    // localStorage bị chặn (chế độ riêng tư) — bỏ qua, dùng mặc định.
  }

  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme);
  } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    applyTheme('light');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        // Không lưu được thì đổi tạm trong phiên này.
      }
    });
  }

  /* ---------- 2. Menu trên màn hình nhỏ ---------- */
  var navToggle = document.getElementById('navToggle');
  var navList = document.getElementById('navList');

  function closeNav() {
    if (!navToggle || !navList) return;
    navList.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Mở menu');
  }

  if (navToggle && navList) {
    navToggle.addEventListener('click', function () {
      var isOpen = navList.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      navToggle.setAttribute('aria-label', isOpen ? 'Đóng menu' : 'Mở menu');
    });

    navList.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeNav();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });

    document.addEventListener('click', function (event) {
      if (!navList.contains(event.target) && !navToggle.contains(event.target)) closeNav();
    });
  }

  /* ---------- 3. Hiệu ứng gõ chữ ở hero ---------- */
  var typedEl = document.getElementById('typed');
  var PHRASES = [
    'Embedded Software Engineer',
    'Firmware Developer',
    'C/C++ Systems Developer',
    'Luôn học thêm thứ mới',
  ];

  if (typedEl) {
    if (prefersReducedMotion) {
      typedEl.textContent = PHRASES[0];
    } else {
      var phraseIndex = 0;
      var charIndex = 0;
      var deleting = false;

      var tick = function () {
        var phrase = PHRASES[phraseIndex];
        charIndex += deleting ? -1 : 1;
        typedEl.textContent = phrase.slice(0, charIndex);

        var delay = deleting ? 45 : 85;

        if (!deleting && charIndex === phrase.length) {
          deleting = true;
          delay = 1800;
        } else if (deleting && charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % PHRASES.length;
          delay = 400;
        }

        setTimeout(tick, delay);
      };

      setTimeout(tick, 700);
    }
  }

  /* ---------- 4. Hiện dần nội dung khi cuộn tới ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) {
      el.classList.add('visible');
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );

    revealEls.forEach(function (el, i) {
      // Các phần tử cạnh nhau hiện lệch nhau một nhịp nhỏ cho đỡ khô.
      el.style.transitionDelay = (i % 6) * 60 + 'ms';
      revealObserver.observe(el);
    });
  }

  /* ---------- 5. Header + thanh tiến trình cuộn ---------- */
  var header = document.getElementById('siteHeader');
  var progress = document.getElementById('scrollProgress');
  var ticking = false;

  function onScrollFrame() {
    var y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('scrolled', y > 12);

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? y / max : 0;
      progress.style.transform = 'scaleX(' + Math.min(ratio, 1) + ')';
    }

    ticking = false;
  }

  window.addEventListener(
    'scroll',
    function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    },
    { passive: true }
  );

  onScrollFrame();

  /* ---------- 6. Đánh dấu mục đang xem trên menu ---------- */
  var sections = document.querySelectorAll('main section[id]');
  var navLinks = document.querySelectorAll('.nav-list a');

  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      navLinks.forEach(function (link) {
        var isActive = link.getAttribute('href') === '#' + id;
        link.classList.toggle('active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'true');
        } else {
          link.removeAttribute('aria-current');
        }
      });
    };

    var sectionObserver = new IntersectionObserver(
      function (entries) {
        // Chọn phần đang chiếm nhiều diện tích nhìn thấy nhất.
        var best = null;
        entries.forEach(function (entry) {
          if (entry.isIntersecting && (!best || entry.intersectionRatio > best.intersectionRatio)) {
            best = entry;
          }
        });
        if (best) setActive(best.target.id);
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: '-80px 0px -40% 0px' }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }

  /* ---------- 7. Năm hiện tại ở footer ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
