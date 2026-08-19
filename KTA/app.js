/* ===================================================================
   KTA Spices — app.js
   Shared interactive behaviours across index.html, catalog.html,
   and wholesale.html.
   =================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     1. SCROLL-REVEAL  (IntersectionObserver on [data-reveal])
     Elements start at opacity:0 / translateY(24px) via CSS.
     On entry: add .revealed, which CSS transitions to visible.
     Stagger: data-stagger="N" → delay = N * 80ms
     Trigger once only (unobserve after revealing).
  ------------------------------------------------------------------ */
  const revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var stagger = parseInt(el.dataset.stagger || '0', 10);
        el.style.transitionDelay = (stagger * 80) + 'ms';
        el.classList.add('revealed');
        revealObserver.unobserve(el);
      });
    },
    { threshold: 0.10, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    revealObserver.observe(el);
  });


  /* ------------------------------------------------------------------
     2. MOBILE HAMBURGER NAV
     Toggles .open on .mobile-menu and .hamburger.
     Closes on overlay-click, close-button click, or Escape key.
  ------------------------------------------------------------------ */
  var hamburger = document.querySelector('.hamburger');
  var mobileMenu = document.querySelector('.mobile-menu');
  var mobileClose = document.querySelector('.mobile-menu-close');

  if (hamburger && mobileMenu) {
    var closeMenu = function () {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    if (mobileClose) {
      mobileClose.addEventListener('click', closeMenu);
    }

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
      }
    });

    // Close when a link inside the menu is clicked
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }


  /* ------------------------------------------------------------------
     3. 3D DECK OF CARDS CIRCULAR QUEUE (index.html Premium Selection)
     Interactive 3D Deck of Cards arranged in a circular queue.
     Cursor movement tilts & fans the circular deck dynamically.
  ------------------------------------------------------------------ */
  function init3DCardDeck() {
    var deckWrapper = document.getElementById('deckWrapper');
    var deck = document.getElementById('selectionDeck');
    if (!deckWrapper || !deck) return;

    var cards = Array.from(deck.querySelectorAll('.selection-card'));
    var N = cards.length;
    if (N === 0) return;

    var currentIndex = 0;
    var hoverOffset = 0;

    function renderDeck() {
      cards.forEach(function (card, idx) {
        var diff = idx - currentIndex;

        // Circular queue wrapping math
        while (diff > N / 2) diff -= N;
        while (diff < -N / 2) diff += N;

        var absDiff = Math.abs(diff);

        // 3D Hand Fan Transforms
        var translateX = diff * 60 + (hoverOffset * 15);
        var translateY = diff === 0 ? -25 : absDiff * 15;
        var translateZ = diff === 0 ? 60 : -absDiff * 15;
        var rotateZ = diff * 12 + (hoverOffset * 4);
        var rotateY = diff * -4;
        var scale = diff === 0 ? 1.05 : 1 - (absDiff * 0.04);
        var opacity = 1;
        var zIndex = 100 - absDiff * 10;

        card.style.transform = 'translateX(' + translateX + 'px) translateY(' + translateY + 'px) translateZ(' + translateZ + 'px) rotateY(' + rotateY + 'deg) rotateZ(' + rotateZ + 'deg) scale(' + scale + ')';
        card.style.zIndex = zIndex;
        card.style.opacity = opacity;

        if (diff === 0) {
          card.classList.add('active-deck-card');
        } else {
          card.classList.remove('active-deck-card');
        }
      });
    }

    renderDeck();

    function stepNext() {
      currentIndex = (currentIndex + 1) % N;
      renderDeck();
    }

    function stepPrev() {
      currentIndex = (currentIndex - 1 + N) % N;
      renderDeck();
    }

    var btnRight = document.getElementById('scrollRight');
    var btnLeft = document.getElementById('scrollLeft');

    if (btnRight) {
      btnRight.style.cursor = 'pointer';
      btnRight.addEventListener('click', stepNext);
    }
    if (btnLeft) {
      btnLeft.style.cursor = 'pointer';
      btnLeft.addEventListener('click', stepPrev);
    }

    var startX = 0;
    var isSwipingDeck = false;
    var swipeMoved = false; // Tracks if a drag/swipe occurred to block clicks

    // Direct Card Click: clicking ANY card immediately brings that exact card straight to the front
    cards.forEach(function (card, idx) {
      card.style.cursor = 'pointer';

      card.addEventListener('click', function (e) {
        if (!swipeMoved) {
          currentIndex = idx;
          renderDeck();
        }
      });
    });

    // Cursor movement over wrapper tilts deck + tracks mouse swipe distance
    deckWrapper.addEventListener('mousemove', function (e) {
      var rect = deckWrapper.getBoundingClientRect();
      var mouseX = e.clientX - rect.left;
      hoverOffset = (mouseX / rect.width) * 2 - 1; // [-1, 1]
      requestAnimationFrame(renderDeck);

      if (isSwipingDeck) {
        var diffX = Math.abs(e.clientX - startX);
        if (diffX > 10) swipeMoved = true;
      }
    });

    deckWrapper.addEventListener('mouseleave', function () {
      hoverOffset = 0;
      requestAnimationFrame(renderDeck);
    });

    // Touch & Drag Swipe support (applies anywhere on the deck)
    deckWrapper.addEventListener('mousedown', function (e) {
      isSwipingDeck = true;
      swipeMoved = false;
      startX = e.clientX;
    });

    document.addEventListener('mouseup', function (e) {
      if (!isSwipingDeck) return;
      isSwipingDeck = false;
      var diffX = e.clientX - startX;
      if (diffX < -40) stepNext();
      else if (diffX > 40) stepPrev();

      // Defer resetting swipeMoved to ensure card click event is blocked
      setTimeout(function() { swipeMoved = false; }, 0);
    });

    deckWrapper.addEventListener('touchstart', function (e) {
      if (e.touches.length > 0) {
        startX = e.touches[0].clientX;
        isSwipingDeck = true;
        swipeMoved = false;
      }
    }, { passive: true });

    deckWrapper.addEventListener('touchmove', function (e) {
      if (isSwipingDeck && e.touches.length > 0) {
        var diffX = Math.abs(e.touches[0].clientX - startX);
        if (diffX > 10) swipeMoved = true;
      }
    }, { passive: true });

    deckWrapper.addEventListener('touchend', function (e) {
      if (!isSwipingDeck) return;
      isSwipingDeck = false;
      if (e.changedTouches.length > 0) {
        var diffX = e.changedTouches[0].clientX - startX;
        if (diffX < -40) stepNext();
        else if (diffX > 40) stepPrev();
      }
      setTimeout(function() { swipeMoved = false; }, 0);
    }, { passive: true });
  }

  init3DCardDeck();


  /* ------------------------------------------------------------------
     4. DRAG-TO-SCROLL  (catalog.html carousel tracks)
     Mouse-drag scrolling for .carousel-track elements.
  ------------------------------------------------------------------ */
  document.querySelectorAll('.carousel-track').forEach(function (track) {
    var isDown = false;
    var startX;
    var scrollLeft;

    track.addEventListener('mousedown', function (e) {
      isDown = true;
      track.classList.add('dragging');
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
    });

    track.addEventListener('mouseleave', function () {
      isDown = false;
      track.classList.remove('dragging');
    });

    track.addEventListener('mouseup', function () {
      isDown = false;
      track.classList.remove('dragging');
    });

    track.addEventListener('mousemove', function (e) {
      if (!isDown) return;
      e.preventDefault();
      var x = e.pageX - track.offsetLeft;
      var walk = (x - startX) * 1.5;
      track.scrollLeft = scrollLeft - walk;
    });
  });


  /* ------------------------------------------------------------------
     5. CATALOG SEARCH & CATEGORY FILTERING  (catalog.html)
     Real-time live filtering on search text (product name & origin)
     combined simultaneously with Spices / Dry Fruits filter chips.
     Hides empty section headers when zero products match.
  ------------------------------------------------------------------ */
  var searchInput = document.getElementById('catalogSearch') || document.querySelector('.search-box input');
  var pillBtns = document.querySelectorAll('.pill-btn');
  var categorySections = document.querySelectorAll('section[data-category]');

  if (searchInput || pillBtns.length > 0) {
    var activeCategory = 'all';

    var applyFilters = function () {
      var query = searchInput ? searchInput.value.trim().toLowerCase() : '';

      categorySections.forEach(function (section) {
        var sectionCategory = section.dataset.category || '';
        var isCategoryMatch = (activeCategory === 'all' || sectionCategory === activeCategory);
        var visibleInSection = 0;

        var cards = section.querySelectorAll('.product-card');
        cards.forEach(function (card) {
          var titleEl = card.querySelector('.product-title, h3');
          var originEl = card.querySelector('.product-origin, .origin');

          var titleText = titleEl ? titleEl.textContent.toLowerCase() : '';
          var originText = originEl ? originEl.textContent.toLowerCase() : '';

          var isSearchMatch = (!query || titleText.indexOf(query) !== -1 || originText.indexOf(query) !== -1);

          if (isCategoryMatch && isSearchMatch) {
            card.style.display = '';
            visibleInSection++;
          } else {
            card.style.display = 'none';
          }
        });

        // Hide entire section header + track if zero matching products
        if (isCategoryMatch && visibleInSection > 0) {
          section.style.display = '';
        } else {
          section.style.display = 'none';
        }
      });
    };

    if (searchInput) {
      searchInput.addEventListener('input', applyFilters);
    }

    pillBtns.forEach(function (pill) {
      pill.addEventListener('click', function () {
        pillBtns.forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');

        var label = pill.textContent.trim().toUpperCase();
        if (label.indexOf('SPICE') !== -1) {
          activeCategory = 'spices';
        } else if (label.indexOf('DRY') !== -1 || label.indexOf('FRUIT') !== -1) {
          activeCategory = 'dry-fruits';
        } else {
          activeCategory = 'all';
        }

        applyFilters();
      });
    });
  }


  /* ------------------------------------------------------------------
     6. WHOLESALE PRICING OPTIONS  (wholesale.html price toggle)
     Toggle .active on price option clicks.
  ------------------------------------------------------------------ */
  document.querySelectorAll('.pricing-options').forEach(function (group) {
    group.querySelectorAll('.price-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        group.querySelectorAll('.price-option').forEach(function (o) {
          o.classList.remove('active');
        });
        opt.classList.add('active');
      });
    });
  });

}());
