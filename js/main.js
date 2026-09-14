// ============================================================
// Dojo site — interactions & animations
// ============================================================
(function () {
  "use strict";

  // ---- Footer year ----
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Mobile nav toggle ----
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("open");
      navToggle.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("open");
        navToggle.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---- Scroll reveal (block-level, staggered groups, and the enso draw-on) ----
  var revealEls = document.querySelectorAll(".reveal, .reveal-stagger, .enso, .kanji-watermark, .cta-shape");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  // ---- Gallery carousel (pages by sets of 3) ----
  var track = document.getElementById("gallery-track");
  var dotsWrap = document.getElementById("gallery-dots");
  if (track && dotsWrap) {
    var slides = Array.prototype.slice.call(track.children);
    var GROUP_SIZE = 3;
    var numPages = Math.ceil(slides.length / GROUP_SIZE);

    for (var p = 0; p < numPages; p++) {
      (function (pageIndex) {
        var dot = document.createElement("button");
        dot.setAttribute("aria-label", "Aller à la série " + (pageIndex + 1));
        if (pageIndex === 0) dot.classList.add("active");
        dot.addEventListener("click", function () { scrollToPage(pageIndex); });
        dotsWrap.appendChild(dot);
      })(p);
    }
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function scrollToPage(pageIndex) {
      var slideIndex = Math.min(pageIndex * GROUP_SIZE, slides.length - 1);
      var slide = slides[slideIndex];
      if (!slide) return;
      track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }

    function currentSlideIndex() {
      var trackLeft = track.scrollLeft;
      var closest = 0;
      var closestDist = Infinity;
      slides.forEach(function (slide, i) {
        var dist = Math.abs(slide.offsetLeft - track.offsetLeft - trackLeft);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      return closest;
    }

    function currentPage() {
      return Math.min(Math.round(currentSlideIndex() / GROUP_SIZE), numPages - 1);
    }

    function updateActiveDot() {
      var page = currentPage();
      dots.forEach(function (d, i) { d.classList.toggle("active", i === page); });
    }

    var scrollTimer;
    track.addEventListener("scroll", function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateActiveDot, 80);
    });

    var prevBtn = document.querySelector(".gallery-prev");
    var nextBtn = document.querySelector(".gallery-next");
    if (prevBtn) prevBtn.addEventListener("click", function () {
      scrollToPage(Math.max(currentPage() - 1, 0));
      restartAutoplay();
    });
    if (nextBtn) nextBtn.addEventListener("click", function () {
      scrollToPage(Math.min(currentPage() + 1, numPages - 1));
      restartAutoplay();
    });
    dots.forEach(function (dot) {
      dot.addEventListener("click", restartAutoplay);
    });

    // ---- Autoplay: advance one set every 5s, pause on hover/touch/tab-hidden/off-screen ----
    var galleryEl = document.getElementById("gallery");
    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var autoplayTimer = null;
    var autoplayEnabled = !prefersReducedMotion && numPages > 1;
    var galleryVisible = true;

    function advanceAutoplay() {
      var next = currentPage() + 1;
      scrollToPage(next >= numPages ? 0 : next);
    }
    function startAutoplay() {
      if (!autoplayEnabled || autoplayTimer || !galleryVisible) return;
      autoplayTimer = setInterval(advanceAutoplay, 5000);
    }
    function stopAutoplay() {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    if (autoplayEnabled) {
      startAutoplay();
      if (galleryEl) {
        galleryEl.addEventListener("mouseenter", stopAutoplay);
        galleryEl.addEventListener("mouseleave", startAutoplay);
        galleryEl.addEventListener("touchstart", stopAutoplay, { passive: true });
      }
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) stopAutoplay(); else startAutoplay();
      });
      if ("IntersectionObserver" in window && galleryEl) {
        var galleryIO = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            galleryVisible = entry.isIntersecting;
            if (galleryVisible) startAutoplay(); else stopAutoplay();
          });
        }, { threshold: 0.2 });
        galleryIO.observe(galleryEl);
      }
    }
  }

  // ---- Contact form -> Supabase Edge Function -> Resend ----
  var form = document.getElementById("contact-form");
  var statusEl = document.getElementById("cf-status");
  var submitBtn = document.getElementById("cf-submit");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: if filled, silently pretend success (likely a bot)
      var honeypot = form.querySelector('[name="_gotcha"]');
      if (honeypot && honeypot.value) {
        form.reset();
        return;
      }

      var data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        interest: form.interest.value,
        message: form.message.value.trim()
      };

      if (!data.name || !data.email || !data.message) {
        setStatus("Merci de renseigner le nom, l'email et le message.", "err");
        return;
      }

      setStatus("Envoi en cours...", "");
      submitBtn.disabled = true;

      fetch("https://lerdkmzzdqcwxzjfmrpi.supabase.co/functions/v1/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          return res.json();
        })
        .then(function () {
          setStatus("Merci ! Nous avons bien reçu votre message et vous contacterons bientôt.", "ok");
          form.reset();
        })
        .catch(function () {
          setStatus("Nous n'avons pas pu envoyer votre message. Réessayez ou écrivez-nous directement par WhatsApp.", "err");
        })
        .finally(function () {
          submitBtn.disabled = false;
        });
    });
  }

  function setStatus(msg, kind) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className = "form-status" + (kind ? " " + kind : "");
  }
})();
