/* =========================================================
   A T Elevator — site interactions (vanilla JS, no dependencies)
   ========================================================= */
(function () {
  "use strict";

  // WhatsApp number that receives enquiries (Aman Tiwari, Venture Head). Country code, no "+".
  var WHATSAPP_NUMBER = "918795002145";
  /* Every enquiry is also emailed here via FormSubmit (free, no backend). The first
     submission sends an activation mail to this inbox — click "Activate Form" once. */
  var ENQUIRY_EMAIL = "amantiwariies@gmail.com";

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isDesktop = function () { return window.innerWidth > 960; };

  /* ---------- Elevator details (from the A T Elevator brochure) ---------- */
  var ELEVATORS = {
    passenger: {
      name: "Passenger Elevator", tag: "Residential · Commercial", img: "assets/images/passenger-elevator.jpg",
      desc: "Our core range for everyday vertical transport. Available in a range of capacities with automatic doors, cabin finishes and safety features to suit the building.",
      uses: ["Apartments and residential towers", "Offices and commercial buildings", "Hospitals, hotels and institutions"]
    },
    glass: {
      name: "Passenger Glass Elevator", tag: "Showrooms · Malls", img: "assets/images/glass-elevator.jpg",
      desc: "A glass-panelled cabin that keeps spaces open and bright, turning the lift into a feature of the building's design.",
      uses: ["Shopping malls and showrooms", "Atriums and lobbies", "Premium commercial spaces"]
    },
    capsule: {
      name: "Capsule Elevator", tag: "Statement Design", img: "assets/images/capsule-elevator.jpg",
      desc: "A rounded, architectural cabin with panoramic glazing, designed to be a centrepiece wherever it is installed.",
      uses: ["Hotels and landmark buildings", "Commercial atriums", "Luxury residences"]
    },
    home: {
      name: "Home Elevator", tag: "Private Homes", img: "assets/images/home-elevator.jpg",
      desc: "Elevator solutions for small spaces within private houses, with the same trusted quality and performance as our commercial lifts.",
      uses: ["Independent houses and villas", "Duplex and multi-level homes", "Homes with elderly family members"]
    },
    hydraulic: {
      name: "Hydraulic Platform Elevator", tag: "Goods · Industrial", img: "assets/images/hydraulic-elevator.jpg",
      desc: "A sturdy platform lift for moving goods and materials between floors.",
      uses: ["Warehouses and godowns", "Factories and workshops", "Shops and commercial storage"]
    },
    cantilever: {
      name: "Cantilever Elevator System", tag: "Space-Saving", img: "assets/images/cantilever-elevator.jpg",
      desc: "A side-mounted elevator arrangement suited to shafts and buildings where a conventional layout does not fit.",
      uses: ["Existing buildings with limited shaft space", "Retrofits and modernisation projects", "Compact commercial sites"]
    },
    parking: {
      name: "Parking Elevator", tag: "Car Stack", img: "assets/images/parking-elevator.jpg",
      desc: "Car stack / parking elevator that lets you park more vehicles in the same footprint.",
      uses: ["Residential area parking", "Commercial building parking", "Office parking"]
    }
  };

  document.documentElement.classList.remove("no-js");

  /* ---------- Toast + loading helpers ---------- */
  var toast = $("#toast");
  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 4500);
  }
  function setLoading(el, on) {
    el.classList.toggle("is-loading", on);
    if (on) el.setAttribute("aria-busy", "true"); else el.removeAttribute("aria-busy");
  }

  /* ---------- Navbar state, scroll progress, back-to-top ---------- */
  var navbar = $("#navbar");
  var progress = $("#scrollProgress");
  var backToTop = $("#backToTop");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    navbar.classList.toggle("scrolled", y > 16);
    progress.style.transform = "scaleX(" + (max > 0 ? Math.min(y / max, 1) : 0) + ")";
    backToTop.classList.toggle("show", y > 600);
    updateActive();
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- Mobile menu ---------- */
  var navToggle = $("#navToggle");
  var navLinks = $("#navLinks");
  var navBackdrop = $("#navBackdrop");

  function setMenu(open) {
    navLinks.classList.toggle("open", open);
    navBackdrop.classList.toggle("show", open);
    navbar.classList.toggle("menu-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("no-scroll", open);
  }
  navToggle.addEventListener("click", function () { setMenu(!navLinks.classList.contains("open")); });
  navBackdrop.addEventListener("click", function () { setMenu(false); });
  $$("a", navLinks).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
  window.addEventListener("resize", function () { if (isDesktop()) setMenu(false); });

  /* ---------- Mega menu (desktop): hover opens via CSS; button toggles for click/keyboard ---------- */
  var megaItem = $("#megaItem");
  var megaToggle = $("#megaToggle");
  function setMega(open) {
    megaItem.classList.toggle("open", open);
    megaToggle.setAttribute("aria-expanded", String(open));
  }
  megaToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    megaItem.classList.remove("suppress");
    setMega(!megaItem.classList.contains("open"));
  });
  megaItem.addEventListener("mouseenter", function () { megaToggle.setAttribute("aria-expanded", "true"); });
  megaItem.addEventListener("mouseleave", function () {
    megaItem.classList.remove("suppress");
    if (!megaItem.classList.contains("open")) megaToggle.setAttribute("aria-expanded", "false");
  });
  // picking an item closes the panel even though the pointer is still over it
  $$("#megaPanel a").forEach(function (a) {
    a.addEventListener("click", function () { setMega(false); megaItem.classList.add("suppress"); a.blur(); });
  });
  document.addEventListener("click", function (e) { if (!megaItem.contains(e.target)) setMega(false); });
  megaItem.addEventListener("focusout", function (e) { if (!megaItem.contains(e.relatedTarget)) setMega(false); });

  /* ---------- Smooth scrolling for in-page links (offset handled by CSS scroll-padding) ---------- */
  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute("href");
    var target = id.length > 1 ? document.querySelector(id) : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", id);
  });

  /* ---------- Active nav highlighting ---------- */
  // Sections without their own nav item map to the closest one.
  var NAV_MAP = { home: "home", about: "about", services: "services", elevators: "elevators", doors: "elevators", technology: "elevators", safety: "safety", amc: "services", why: "contact", brochure: "contact", contact: "contact" };
  var navItems = $$(".nav-link");
  var sections = $$("main section[id]");
  function updateActive() {
    var line = window.innerHeight * 0.35;
    var current = sections[0].id;
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= line) current = s.id; });
    var key = NAV_MAP[current] || current;
    navItems.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + key); });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    reveals.forEach(function (el) {
      var idx = $$(":scope > .reveal", el.parentElement).indexOf(el);
      if (idx > 0) el.style.setProperty("--d", Math.min(idx * 0.05, 0.3) + "s");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Hero: floor display and shaft car move together ---------- */
  var floorNum = $("#floorNum");
  var copDir = $("#copDir");
  var shaftCar = $("#shaftCar");
  if (floorNum && !reduceMotion) {
    var floor = 0, dir = 1;
    setInterval(function () {
      floor += dir;
      if (floor >= 7 || floor <= 0) dir *= -1;
      floorNum.textContent = floor === 0 ? "G" : "0" + floor;
      shaftCar.style.setProperty("--f", floor);
      copDir.classList.toggle("down", dir < 0);
    }, 1600);
  }

  /* ---------- Services explorer (ARIA tabs) ---------- */
  var tabs = $$(".svc-tab");
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { selectTab(tab); });
    tab.addEventListener("keydown", function (e) {
      var next = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (next) { e.preventDefault(); selectTab(tabs[(i + next + tabs.length) % tabs.length], true); }
      if (e.key === "Home") { e.preventDefault(); selectTab(tabs[0], true); }
      if (e.key === "End") { e.preventDefault(); selectTab(tabs[tabs.length - 1], true); }
    });
  });
  // footer service links open the matching tab
  $$("[data-service]").forEach(function (a) {
    a.addEventListener("click", function () { selectTab($("#tab-" + a.dataset.service)); });
  });

  /* ---------- Elevator details modal ---------- */
  var modal = $("#elevatorModal");
  var lastFocus = null;
  var currentElevator = null;

  function openModal(key) {
    var d = ELEVATORS[key];
    if (!d) return;
    currentElevator = d;
    // modal photo frame copies the card's frame (background colour / full-bleed photo)
    var frame = $('.elevator-card[data-elevator="' + key + '"] .ec-media');
    var modalMedia = $(".modal-media", modal);
    modalMedia.style.cssText = frame ? frame.style.cssText : "";
    modalMedia.classList.toggle("is-photo", !!frame && frame.classList.contains("is-photo"));
    $("#modalImg").src = d.img;
    $("#modalImg").alt = d.name;
    $("#modalTag").textContent = d.tag;
    $("#modalTitle").textContent = d.name;
    $("#modalDesc").textContent = d.desc;
    $("#modalUses").innerHTML = d.uses.map(function (u) { return "<li>" + u + "</li>"; }).join("");
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("no-scroll");
    $(".modal-close", modal).focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$(".elevator-card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      openModal(card.dataset.elevator);
    });
  });
  // footer + mega-menu links open the matching elevator after scrolling
  $$("[data-open-elevator]").forEach(function (a) {
    a.addEventListener("click", function () {
      var key = a.dataset.openElevator;
      setTimeout(function () { openModal(key); }, reduceMotion ? 0 : 650);
    });
  });
  $$("[data-close]", modal).forEach(function (el) { el.addEventListener("click", closeModal); });
  $("#modalEnquire").addEventListener("click", function () {
    if (currentElevator) $("#fType").value = currentElevator.name;
    closeModal();
  });

  /* ---------- Door viewer + lightbox ---------- */
  var doorOpts = $$(".door-opt");
  var stageImg = $("#doorStageImg");
  var doorIndex = 0;
  function showStage(i) {
    doorIndex = i;
    var opt = doorOpts[i];
    doorOpts.forEach(function (o) { var on = o === opt; o.classList.toggle("is-active", on); o.setAttribute("aria-pressed", String(on)); });
    stageImg.src = opt.dataset.img;
    stageImg.alt = opt.dataset.type + " " + opt.dataset.name;
    $("#doorStageType").textContent = opt.dataset.type;
    $("#doorStageName").textContent = opt.dataset.name;
    // restart the fade so each change reads as a new image
    stageImg.style.animation = "none"; void stageImg.offsetWidth; stageImg.style.animation = "";
  }
  doorOpts.forEach(function (opt, i) { opt.addEventListener("click", function () { showStage(i); }); });

  var lightbox = $("#lightbox");
  var lbImg = $("#lbImg");
  var lbCap = $("#lbCap");
  function showLightbox(i) {
    doorIndex = (i + doorOpts.length) % doorOpts.length;
    var opt = doorOpts[doorIndex];
    lbImg.src = opt.dataset.img;
    lbImg.alt = opt.dataset.type + " " + opt.dataset.name;
    lbCap.innerHTML = opt.dataset.type + " " + opt.dataset.name + "<small>" + (doorIndex + 1) + " / " + doorOpts.length + "</small>";
    showStage(doorIndex);
  }
  function openLightbox() {
    lastFocus = document.activeElement;
    showLightbox(doorIndex);
    lightbox.hidden = false;
    document.body.classList.add("no-scroll");
    $(".lb-close", lightbox).focus();
  }
  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("#doorStage").addEventListener("click", openLightbox);
  $("#lbPrev").addEventListener("click", function () { showLightbox(doorIndex - 1); });
  $("#lbNext").addEventListener("click", function () { showLightbox(doorIndex + 1); });
  $("[data-lb-close]", lightbox).addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", function (e) { if (e.target === lightbox) closeLightbox(); });
  var touchX = null;
  lightbox.addEventListener("touchstart", function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener("touchend", function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) showLightbox(doorIndex + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Keyboard: Esc closes overlays, arrows move the lightbox ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (!modal.hidden) closeModal();
      else if (!lightbox.hidden) closeLightbox();
      else if (navLinks.classList.contains("open")) setMenu(false);
      else if (megaItem.classList.contains("open")) { setMega(false); megaToggle.focus(); }
    }
    if (!lightbox.hidden) {
      if (e.key === "ArrowRight") showLightbox(doorIndex + 1);
      if (e.key === "ArrowLeft") showLightbox(doorIndex - 1);
    }
  });

  /* ---------- Shaft size table toggle ---------- */
  var specToggle = $("#specToggle");
  var specPanel = $("#specPanel");
  function openSpec(open) {
    specToggle.setAttribute("aria-expanded", String(open));
    specPanel.hidden = !open;
  }
  specToggle.addEventListener("click", function () { openSpec(specToggle.getAttribute("aria-expanded") !== "true"); });

  /* ---------- Prefill enquiry message from CTAs ---------- */
  $$("[data-prefill-message]").forEach(function (a) {
    a.addEventListener("click", function () {
      $("#fMsg").value = a.dataset.prefillMessage;
      if (/AMC/.test(a.dataset.prefillMessage)) $("#fType").value = "AMC / Service for existing lift";
    });
  });

  /* ---------- Brochure download ---------- */
  // The single-file preview embeds the PDF as base64 (window.ATE_BROCHURE_B64); decode it once, on first click.
  var brochureBlob = null;
  function embeddedBrochure() {
    if (!brochureBlob && window.ATE_BROCHURE_B64) {
      var bin = atob(window.ATE_BROCHURE_B64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      brochureBlob = new Blob([bytes], { type: "application/pdf" });
    }
    return brochureBlob;
  }

  $$(".js-brochure").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var blob = embeddedBrochure();
      var inClaudeViewer = window.claude && typeof window.claude.use === "function";
      if (!inClaudeViewer) {
        // Normal browser: the <a download> does the work (pointed at the embedded copy in the preview file).
        if (blob && a.href.indexOf("blob:") !== 0) a.href = URL.createObjectURL(blob);
        showToast("Brochure download started.");
        return;
      }
      // Inside a claude.ai shared preview, plain downloads are blocked; ask the viewer through the downloads capability.
      e.preventDefault();
      setLoading(a, true);
      window.claude.use("downloads").then(function (dl) {
        if (!dl) { showToast("Download isn't available in this preview. Message us on WhatsApp and we'll send the brochure."); return; }
        var data = blob ? Promise.resolve(blob) : fetch(a.getAttribute("href")).then(function (r) { return r.blob(); });
        return data.then(function (d) { return dl.save({ filename: "A-T-Elevator-Brochure.pdf", data: d }); })
          .then(function () { showToast("Brochure saved."); });
      }).catch(function (err) {
        if (err && err.code === "declined") return;
        showToast("The brochure couldn't be downloaded. Please try again.");
      }).then(function () { setLoading(a, false); });
    });
  });

  /* ---------- Enquiry form: validation + WhatsApp ---------- */
  var form = $("#enquiryForm");
  var success = $("#formSuccess");
  var submitBtn = $("#submitBtn");

  var RULES = {
    name: function (v) { return v.length < 2 ? "Please enter your full name." : ""; },
    phone: function (v) {
      var digits = v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
      return /^[6-9]\d{9}$/.test(digits) ? "" : "Enter a valid 10-digit Indian mobile number.";
    },
    email: function (v) { return v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "Enter a valid email address." : ""; },
    city: function (v) { return v.length < 2 ? "Please enter your city." : ""; },
    building: function (v) { return v ? "" : "Please select a building type."; },
    type: function (v) { return v ? "" : "Please select an elevator type."; },
    floors: function (v) { var n = Number(v); return v !== "" && Number.isInteger(n) && n >= 1 && n <= 100 ? "" : "Enter number of floors (1–100)."; },
    message: function (v) { return v.length > 1000 ? "Please keep the message under 1000 characters." : ""; }
  };

  function validateField(el) {
    var rule = RULES[el.name];
    if (!rule) return true;
    var msg = rule(el.value.trim());
    var field = el.closest(".field");
    var err = $(".error", field);
    field.classList.toggle("invalid", !!msg);
    err.textContent = msg;
    el.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg) el.setAttribute("aria-describedby", err.id); else el.removeAttribute("aria-describedby");
    return !msg;
  }

  $$("input, select, textarea", form).forEach(function (el) {
    el.addEventListener("blur", function () { if (el.value) validateField(el); });
    el.addEventListener("input", function () { if (el.closest(".field").classList.contains("invalid")) validateField(el); });
    el.addEventListener("change", function () { if (el.closest(".field").classList.contains("invalid")) validateField(el); });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var fields = $$("input, select, textarea", form);
    var firstBad = null;
    fields.forEach(function (el) { if (!validateField(el) && !firstBad) firstBad = el; });
    if (firstBad) { firstBad.focus(); return; }

    var d = {};
    fields.forEach(function (el) { d[el.name] = el.value.trim(); });

    var text = [
      "*New enquiry — A T Elevator website*",
      "",
      "Name: " + d.name,
      "Phone: " + d.phone,
      d.email ? "Email: " + d.email : null,
      "City: " + d.city,
      "Building type: " + d.building,
      "Elevator type: " + d.type,
      "Floors: " + d.floors,
      d.message ? "Message: " + d.message : null
    ].filter(function (l) { return l !== null; }).join("\n");

    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);

    // Email the full enquiry. Fire-and-forget so window.open below stays inside the click (popup blockers).
    fetch("https://formsubmit.co/ajax/" + ENQUIRY_EMAIL, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: "New enquiry — " + d.name + " (" + d.city + ")",
        _template: "table",
        _captcha: "false",
        _replyto: d.email || undefined,
        "Name": d.name,
        "Phone": d.phone,
        "Email": d.email || "—",
        "City": d.city,
        "Building type": d.building,
        "Elevator type": d.type,
        "Floors": d.floors,
        "Message": d.message || "—",
        "Submitted at": new Date().toLocaleString("en-IN"),
        "Page": location.href
      })
    }).catch(function () { /* WhatsApp below still delivers the enquiry */ });

    setLoading(submitBtn, true);
    $(".btn-label", submitBtn).textContent = "Opening WhatsApp…";
    var win = window.open(url, "_blank");
    if (win) win.opener = null;
    success.hidden = false;
    success.innerHTML = win
      ? "Thank you! Your enquiry has been emailed to our team. WhatsApp has also opened — press <strong>Send</strong> there for a faster reply."
      : 'Thank you! Your enquiry has been emailed to our team. <a href="' + url + '" target="_blank" rel="noopener">Also send it on WhatsApp</a> for a faster reply.';
    form.reset();
    $$(".field", form).forEach(function (f) { f.classList.remove("invalid"); });
    setTimeout(function () {
      setLoading(submitBtn, false);
      $(".btn-label", submitBtn).textContent = "Request a Callback";
    }, 1200);
  });

  /* ---------- Init ---------- */
  $("#year").textContent = new Date().getFullYear();
  onScroll();
})();
