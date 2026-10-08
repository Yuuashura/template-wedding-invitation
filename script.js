/* Hani & Andi — wedding invitation
   Opening sequence, music, countdown, gallery, RSVP, wishes, gift, nav. */
(function ($) {
  'use strict';

  var EVENT_DATE = new Date('2026-09-19T13:30:00+07:00'); // Akad Nikah, 13.30 WIB
  var KEY_RSVP = 'haniandi.rsvp';
  var KEY_WISHES = 'haniandi.wishes';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $body = $('body');
  var audio = document.getElementById('bgMusic');
  var $music = $('.js-music');
  var guest = (new URLSearchParams(location.search).get('to') || '').trim().slice(0, 60);

  /* ---------- helpers ---------- */
  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }

  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode: keep in memory only */ }
  }

  function toast(message) {
    $('.js-toast-text').text(message);
    $('.js-toast').toast('show');
  }

  function ripple(e) {
    var $btn = $(e.currentTarget);
    var keyboard = !e.originalEvent || e.originalEvent.detail === 0;
    var off = $btn.offset();
    $('<span class="ripple" aria-hidden="true"></span>')
      .css({
        left: keyboard ? $btn.outerWidth() / 2 : e.pageX - off.left,
        top: keyboard ? $btn.outerHeight() / 2 : e.pageY - off.top
      })
      .appendTo($btn)
      .on('animationend', function () { $(this).remove(); });
  }

  // Simulated network latency so loading states are visible; swap for a real request when a backend exists.
  function fakeRequest(fn) { setTimeout(fn, reducedMotion ? 0 : 650); }

  /* ---------- opening: preloader -> envelope -> hero ---------- */
  function initOpening() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    if (guest) $('.js-guest').text(guest);
    $('#siteHeader, #main').attr('inert', '');

    var $imgs = $('img').not('[loading="lazy"]');
    var done = 0;
    var $bar = $('.js-progress');
    function step() { $bar.css('width', Math.max(6, Math.round(++done / $imgs.length * 100)) + '%'); }
    $imgs.each(function () {
      if (this.complete) step();
      else $(this).one('load error', step);
    });

    var minDelay = new Promise(function (r) { setTimeout(r, reducedMotion ? 200 : 1800); });
    var loaded = new Promise(function (r) {
      if (document.readyState === 'complete') r();
      else $(window).one('load', r);
    });
    var safety = new Promise(function (r) { setTimeout(r, 6000); });
    Promise.race([Promise.all([minDelay, loaded]), safety]).then(showCover);

    $('.js-open').on('click', openInvitation);
  }

  function showCover() {
    $('.js-progress').css('width', '100%');
    $('#cover').prop('hidden', false);
    setTimeout(function () { $body.removeClass('is-loading').addClass('is-cover'); }, 250);
  }

  function openInvitation(e) {
    if (!$body.hasClass('is-cover') || $body.hasClass('is-open')) return;
    if ($(e.currentTarget).hasClass('btn-pill')) ripple(e);
    var $cover = $('#cover').addClass('is-opening'); // seal breaks -> flap opens -> card rises -> fade
    playMusic(); // must run inside the click for autoplay policies
    setTimeout(function () {
      $body.addClass('is-open');
      $('#siteHeader, #main').removeAttr('inert');
    }, reducedMotion ? 0 : 1500);
    setTimeout(function () {
      $body.removeClass('is-cover');
      $cover.remove();
      $('#heroTitle').attr('tabindex', '-1')[0].focus({ preventScroll: true });
      AOS.init({ once: true, duration: 900, easing: 'ease-out-cubic', offset: 80, disable: reducedMotion });
    }, reducedMotion ? 50 : 2450);
  }

  /* ---------- music ---------- */
  function setMusicState(playing) {
    $music.toggleClass('is-playing', playing)
      .attr({ 'aria-pressed': String(playing), 'aria-label': playing ? 'Jeda musik' : 'Putar musik' });
  }

  function playMusic() {
    var p = audio.play();
    if (!p) return;
    p.then(function () { $music.prop('hidden', false); })
      .catch(function (err) {
        // Autoplay blocked: offer the button. Missing/unsupported file: hide it.
        $music.prop('hidden', err.name !== 'NotAllowedError');
      });
  }

  function initMusic() {
    $(audio).on('play', function () { setMusicState(true); })
      .on('pause', function () { setMusicState(false); });
    $music.on('click', function () {
      if (audio.paused) playMusic(); else audio.pause();
    });
    var resume = false;
    $(document).on('visibilitychange', function () {
      if (document.hidden) { resume = !audio.paused; audio.pause(); } else if (resume) playMusic();
    });
  }

  /* ---------- countdown ---------- */
  function initCountdown() {
    var $parts = { days: $('.js-days'), hours: $('.js-hours'), minutes: $('.js-minutes'), seconds: $('.js-seconds') };
    // ?demo counts down from the figures in the design (22d 15h 12m 33s) so the flip can be reviewed after the real date.
    var target = new URLSearchParams(location.search).has('demo')
      ? Date.now() + ((22 * 24 + 15) * 3600 + 12 * 60 + 33) * 1000
      : EVENT_DATE.getTime();
    var timer;
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    function render() {
      var diff = Math.max(0, target - Date.now());
      var values = {
        days: Math.floor(diff / 864e5),
        hours: Math.floor(diff / 36e5) % 24,
        minutes: Math.floor(diff / 6e4) % 60,
        seconds: Math.floor(diff / 1e3) % 60
      };
      $.each(values, function (key, value) {
        var $el = $parts[key];
        var text = pad(value);
        if ($el.text() === text) return;
        $el.text(text).removeClass('tick');
        void $el[0].offsetWidth; // restart the flip animation
        $el.addClass('tick');
      });
      if (!diff) {
        clearInterval(timer);
        $('.js-countdown-done').prop('hidden', false);
      }
    }
    timer = setInterval(render, 1000);
    render();
  }

  /* ---------- gallery ---------- */
  function initGallery() {
    var swiper = new Swiper('.gallery-swiper', {
      slidesPerView: 1.15,
      rewind: true,
      speed: 900,
      parallax: true,
      grabCursor: true,
      autoplay: { delay: 3500, pauseOnMouseEnter: true, disableOnInteraction: false },
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: { prevSlideMessage: 'Foto sebelumnya', nextSlideMessage: 'Foto berikutnya', paginationBulletMessage: 'Ke foto {{index}}' },
      navigation: { prevEl: '.js-gallery-prev', nextEl: '.js-gallery-next' },
      pagination: { el: '.gallery-pagination', clickable: true },
      breakpoints: { 576: { slidesPerView: 2 }, 992: { slidesPerView: 3 } }
    });
    var $toggle = $('.js-gallery-toggle');

    function setAutoplay(run) {
      if (run) swiper.autoplay.start(); else swiper.autoplay.stop();
      $toggle.attr({ 'aria-pressed': String(!run), 'aria-label': run ? 'Jeda slideshow' : 'Putar slideshow' })
        .find('use').attr('href', run ? '#i-pause' : '#i-play');
    }

    if (reducedMotion) setAutoplay(false);
    $toggle.on('click', function () { setAutoplay(!swiper.autoplay.running); });
    $('.gallery-swiper').on('focusin', '.swiper-slide a', function () { setAutoplay(false); });

    // Fancybox defaults make leaving hard: a click on the photo zooms (desktop) or only toggles the
    // controls (touch), and the toolbar with the close button hides after 3s. Make every tap close.
    var closeOnTap = { clickContent: 'close', clickSlide: 'close', clickOutside: 'close', dblclickContent: 'zoom', idleTime: false };
    $('[data-fancybox="gallery"]').fancybox($.extend({
      loop: true,
      animationEffect: 'zoom-in-out',
      transitionEffect: 'slide',
      buttons: ['zoom', 'slideShow', 'fullScreen', 'thumbs', 'close'],
      mobile: closeOnTap,
      lang: 'id',
      i18n: { id: { CLOSE: 'Tutup', NEXT: 'Berikutnya', PREV: 'Sebelumnya', ZOOM: 'Perbesar', PLAY_START: 'Putar slideshow', PLAY_STOP: 'Jeda slideshow', FULL_SCREEN: 'Layar penuh', THUMBS: 'Thumbnail', ERROR: 'Gambar gagal dimuat.' } },
      beforeShow: function () { setAutoplay(false); }
    }, closeOnTap));
  }

  /* ---------- shared form validation ---------- */
  function setError($field, message) {
    $field.toggleClass('is-invalid', !!message).attr('aria-invalid', message ? 'true' : null);
    $('#' + $field.attr('aria-describedby')).text(message);
    return !message;
  }

  /* ---------- RSVP ---------- */
  function initRsvp() {
    var $form = $('.js-rsvp-form');
    var $name = $('#rsvpName');
    var $steps = $('.js-rsvp-steps');
    var $summary = $('.js-rsvp-summary');
    var pax = { paxAkad: 2, paxResepsi: 2 };
    var EVENT_LABEL = { akad: 'Akad Nikah', resepsi: 'Resepsi', keduanya: 'Akad & Resepsi' };
    if (!guest) {
      $('.js-guest-text').prop('hidden', true);
      $('.js-guest-field').prop('hidden', false);
    }

    function val(name) { return $form.find('input[name="' + name + '"]:checked').val(); }

    function syncPills() {
      $form.find('.btn-pill--choice').each(function () {
        $(this).toggleClass('active', $(this).find('input').prop('checked'));
      });
    }

    function renderPax() {
      $('.js-pax').each(function () {
        var $line = $(this);
        var n = pax[$line.data('key')];
        var off = $line.hasClass('is-off');
        $line.find('.stepper-val').text(n);
        $line.find('[data-step="-1"]').prop('disabled', off || n <= 1);
        $line.find('[data-step="1"]').prop('disabled', off || n >= 5);
      });
    }

    function sync(animate) {
      var attend = val('attend') === 'hadir';
      var event = val('event');
      var $extra = $('.js-attend-only').stop(true, true);
      if (animate) $extra[attend ? 'slideDown' : 'slideUp'](350); else $extra.toggle(attend);
      $('.js-pax[data-key="paxAkad"]').toggleClass('is-off', event === 'resepsi');
      $('.js-pax[data-key="paxResepsi"]').toggleClass('is-off', event === 'akad');
      renderPax();
    }

    function showSummary(data) {
      var counts = [data.paxAkad ? 'Akad ' + data.paxAkad : '', data.paxResepsi ? 'Resepsi ' + data.paxResepsi : ''].filter(Boolean);
      $('.js-summary-name').text(data.name);
      $('.js-summary-detail').text(data.attend === 'hadir'
        ? 'Hadir · ' + EVENT_LABEL[data.event] + ' · ' + counts.join(' / ') + ' orang'
        : 'Berhalangan hadir. Terima kasih atas doa restunya.');
      $steps.prop('hidden', true);
      $summary.prop('hidden', false);
    }

    var saved = load(KEY_RSVP);
    if (saved) {
      $form.find('input[name="attend"][value="' + saved.attend + '"]').prop('checked', true);
      if (saved.event) $form.find('input[name="event"][value="' + saved.event + '"]').prop('checked', true);
      if (saved.paxAkad) pax.paxAkad = saved.paxAkad;
      if (saved.paxResepsi) pax.paxResepsi = saved.paxResepsi;
      if (!guest) $name.val(saved.name);
      showSummary(saved);
    }
    syncPills();
    sync(false);

    $form.on('change', 'input[type="radio"]', function () { syncPills(); sync(true); });
    $form.on('click', '.stepper-btn', function () {
      var key = $(this).closest('.js-pax').data('key');
      pax[key] = Math.min(5, Math.max(1, pax[key] + Number($(this).data('step'))));
      renderPax();
    });
    $name.on('input', function () { if ($name.hasClass('is-invalid')) setError($name, ''); });
    $('.js-rsvp-edit').on('click', function () {
      $summary.prop('hidden', true);
      $steps.prop('hidden', false);
      $steps.find('input[name="attend"]:checked').trigger('focus');
    });

    $form.on('submit', function (e) {
      e.preventDefault();
      var name = guest || $.trim($name.val());
      if (!setError($name, name ? '' : 'Mohon isi nama Anda.')) { $name.trigger('focus'); return; }

      var attend = val('attend') === 'hadir';
      var event = val('event');
      var data = {
        name: name,
        attend: attend ? 'hadir' : 'tidak',
        event: attend ? event : null,
        paxAkad: attend && event !== 'resepsi' ? pax.paxAkad : 0,
        paxResepsi: attend && event !== 'akad' ? pax.paxResepsi : 0,
        at: Date.now()
      };
      var $btn = $form.find('.btn-rsvp-send').prop('disabled', true);
      var $label = $btn.find('span').text('Mengirim…');
      fakeRequest(function () {
        save(KEY_RSVP, data);
        $btn.prop('disabled', false);
        $label.text('Kirim Konfirmasi');
        showSummary(data);
        $summary.find('.js-rsvp-edit').trigger('focus');
        toast(attend ? 'Terima kasih, kehadiran Anda telah kami catat.' : 'Terima kasih atas konfirmasi dan doa restunya.');
      });
    });
  }

  /* ---------- wishes ---------- */
  function initWishes() {
    var $form = $('.js-wish-form');
    var $name = $('#wishName');
    var $text = $('#wishText');
    var $preview = $('.js-media-preview');
    var $drop = $('.js-dropzone');
    var rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });
    var pending = []; // media for the wish being written (session only)
    var wishes = load(KEY_WISHES) || [
      { name: 'Connectied', msg: 'Wishing you all of the love and happiness!', at: Date.parse('2026-08-01T10:00:00+07:00') }
    ];

    if (guest) $name.val(guest);

    function timeAgo(at) {
      var sec = Math.round((at - Date.now()) / 1000);
      var abs = Math.abs(sec);
      if (abs < 60) return 'baru saja';
      if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute');
      if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
      if (abs < 86400 * 7) return rtf.format(Math.round(sec / 86400), 'day');
      return new Date(at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function mediaEl(m) {
      return /^video\//.test(m.type)
        ? $('<video muted playsinline preload="metadata"></video>').attr('src', m.url)
        : $('<img alt="">').attr('src', m.url);
    }

    function item(w, isNew) {
      var $li = $('<li class="wish-item"></li>').toggleClass('is-new', !!isNew);
      $('<p class="wish-name"></p>').append(
        $('<span></span>').text(w.name),
        $('<time class="wish-time"></time>').attr('datetime', new Date(w.at).toISOString()).text(timeAgo(w.at))
      ).appendTo($li);
      $('<p class="wish-msg"></p>').text(w.msg).appendTo($li);
      if (w.media && w.media.length) $('<div class="wish-media"></div>').append(w.media.map(mediaEl)).appendTo($li);
      return $li;
    }

    function render(highlightFirst) {
      $('.js-wish-list').empty().append(wishes.slice(0, 3).map(function (w, i) { return item(w, highlightFirst && i === 0); }));
      $('.js-wish-all').empty().append(wishes.map(function (w) { return item(w); }));
      $('.js-wish-count').text('(' + wishes.length + ')');
    }

    function renderPreview() {
      $preview.empty().append(pending.map(function (m) { return $('<div class="media-thumb"></div>').append(mediaEl(m)); }));
      $('.js-dropzone-text').text(pending.length ? pending.length + ' file siap diunggah' : 'Drop files here to upload');
    }

    function addFiles(files) {
      var error = '';
      $.each(files, function (_, f) {
        if (pending.length >= 4) { error = 'Maksimal 4 file per ucapan.'; return false; }
        if (!/^(image|video)\//.test(f.type)) { error = 'Hanya foto atau video yang dapat diunggah.'; return; }
        if (f.size > 10 * 1024 * 1024) { error = 'Ukuran maksimal 10MB per file.'; return; }
        pending.push({ type: f.type, url: URL.createObjectURL(f) });
      });
      $('#mediaError').text(error);
      renderPreview();
    }

    $drop.on('dragenter dragover', function (e) { e.preventDefault(); $drop.addClass('is-drag'); })
      .on('dragleave drop', function (e) { e.preventDefault(); $drop.removeClass('is-drag'); })
      .on('drop', function (e) { addFiles(e.originalEvent.dataTransfer.files); });
    $('#wishMedia').on('change', function () { addFiles(this.files); this.value = ''; });

    $form.on('input', '.field', function () {
      if ($(this).hasClass('is-invalid')) setError($(this), '');
    });

    $form.on('submit', function (e) {
      e.preventDefault();
      var name = $.trim($name.val());
      var msg = $.trim($text.val());
      var okName = setError($name, name ? '' : 'Mohon isi nama Anda.');
      var okMsg = setError($text, msg.length >= 3 ? '' : 'Tulis ucapan minimal 3 karakter.');
      if (!okName || !okMsg) { $form.find('.is-invalid').first().trigger('focus'); return; }

      var $btn = $form.find('.btn-send').addClass('is-loading').prop('disabled', true);
      fakeRequest(function () {
        wishes.unshift({ name: name, msg: msg, at: Date.now(), media: pending });
        // Media are object URLs: shown this session only, not persisted.
        save(KEY_WISHES, wishes.map(function (w) { return { name: w.name, msg: w.msg, at: w.at }; }));
        pending = [];
        $text.val('');
        renderPreview();
        render(true);
        $btn.removeClass('is-loading').prop('disabled', false);
        toast('Terima kasih! Ucapan Anda telah terkirim.');
      });
    });

    render(false);
  }

  /* ---------- gift ---------- */
  function legacyCopy(text) {
    return new Promise(function (resolve, reject) {
      var $ta = $('<textarea readonly></textarea>').val(text).css({ position: 'fixed', opacity: 0 }).appendTo('body');
      $ta[0].select();
      var ok = document.execCommand('copy');
      $ta.remove();
      if (ok) resolve(); else reject();
    });
  }

  function copyText(text) {
    if (!navigator.clipboard || !window.isSecureContext) return legacyCopy(text);
    return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
  }

  function initGift() {
    $('.js-copy').on('click', function (e) {
      var $btn = $(this);
      ripple(e);
      copyText($btn.attr('data-copy')).then(function () {
        $btn.addClass('is-copied').find('span').text('Tersalin!');
        $btn.find('use').attr('href', '#i-check');
        toast('Nomor rekening berhasil disalin.');
        clearTimeout($btn.data('timer'));
        $btn.data('timer', setTimeout(function () {
          $btn.removeClass('is-copied').find('span').text('Salin Nomor');
          $btn.find('use').attr('href', '#i-copy');
        }, 2200));
      }, function () { toast('Gagal menyalin, silakan salin manual.'); });
    });
  }

  /* ---------- motion: parallax, scroll progress, gold particles ---------- */
  function initMotion() {
    var bar = document.querySelector('.js-scroll-progress');
    var layers = reducedMotion ? [] : $('[data-depth]').map(function () {
      var $el = $(this);
      return {
        el: this,
        depth: Number($el.attr('data-depth')),
        mouse: Number($el.attr('data-mouse')) || 0,
        hero: $el.closest('.hero').length > 0,
        ref: $el.closest('section, footer')[0]
      };
    }).get();
    var mx = 0, my = 0, cx = 0, cy = 0, ticking = false;

    function request() {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }

    function frame() {
      ticking = false;
      var sy = window.scrollY;
      var vh = window.innerHeight;
      var max = document.documentElement.scrollHeight - vh;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, sy / max) : 0) + ')';
      cx += (mx - cx) * 0.08;
      cy += (my - cy) * 0.08;
      // read all section rects first, then write, to avoid layout thrash
      var rects = layers.map(function (l) { return l.hero ? null : l.ref.getBoundingClientRect(); });
      layers.forEach(function (l, i) {
        var x = 0, y;
        if (l.hero) {
          if (sy > vh * 1.5) return;
          x = cx * l.mouse;
          y = sy * l.depth + cy * l.mouse;
        } else {
          var r = rects[i];
          if (r.bottom < -vh || r.top > vh * 2) return;
          x = cx * l.mouse;
          y = (r.top + r.height / 2 - vh / 2) * -l.depth + cy * l.mouse;
        }
        l.el.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';
      });
      if (Math.abs(mx - cx) > 0.002 || Math.abs(my - cy) > 0.002) request();
    }

    $(window).on('scroll resize', request);
    if (layers.length && window.matchMedia('(pointer: fine)').matches) {
      $(document)
        .on('pointermove', function (e) {
          mx = e.clientX / window.innerWidth * 2 - 1;
          my = e.clientY / window.innerHeight * 2 - 1;
          request();
        })
        .on('mouseleave', function () { mx = my = 0; request(); });
    }
    request();
    if (!reducedMotion) $('.js-sparkle').each(function () { sparkle(this); });
  }

  function sparkle(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = 0, h = 0, raf = 0, visible = false, parts = [];
    var PETALS = ['#F2A66B', '#F7C98B', '#F7E19F'];
    var petalChance = Number(canvas.getAttribute('data-petals')) || 0.2;
    var dust = document.createElement('canvas'); // pre-rendered glow sprite
    dust.width = dust.height = 32;
    var dctx = dust.getContext('2d');
    var glow = dctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    glow.addColorStop(0, 'rgba(255, 244, 205, 1)');
    glow.addColorStop(0.4, 'rgba(247, 225, 159, .6)');
    glow.addColorStop(1, 'rgba(247, 225, 159, 0)');
    dctx.fillStyle = glow;
    dctx.fillRect(0, 0, 32, 32);

    function spawn(p, anywhere) {
      p.petal = Math.random() < petalChance;
      p.x = Math.random() * w;
      p.y = anywhere ? Math.random() * h : -12;
      p.size = p.petal ? 4 + Math.random() * 4 : 3 + Math.random() * 6;
      p.vy = p.petal ? 0.35 + Math.random() * 0.45 : 0.12 + Math.random() * 0.3;
      p.vx = (Math.random() - 0.5) * 0.25;
      p.rot = Math.random() * Math.PI * 2;
      p.vr = (Math.random() - 0.5) * 0.03;
      p.phase = Math.random() * Math.PI * 2;
      p.color = PETALS[(Math.random() * PETALS.length) | 0];
      return p;
    }

    function resize() {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts.forEach(function (p) { spawn(p, true); });
    }

    function draw() {
      if (!canvas.isConnected) return; // cover canvas is removed after opening
      if (canvas.clientWidth !== w || canvas.clientHeight !== h) resize();
      ctx.clearRect(0, 0, w, h);
      parts.forEach(function (p) {
        p.phase += 0.02;
        p.rot += p.vr;
        p.x += p.vx + Math.sin(p.phase) * 0.3;
        p.y += p.vy;
        if (p.y > h + 12 || p.x < -20 || p.x > w + 20) spawn(p, false);
        if (p.petal) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = 0.75;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          ctx.globalAlpha = 0.35 + 0.5 * Math.abs(Math.sin(p.phase * 1.5));
          ctx.drawImage(dust, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        }
      });
      ctx.globalAlpha = 1;
      raf = visible && !document.hidden ? requestAnimationFrame(draw) : 0;
    }

    function start() {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw);
    }

    for (var i = 0; i < 44; i++) parts.push({});
    resize();
    new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; start(); }).observe(canvas);
    $(document).on('visibilitychange', start);
  }

  /* ---------- nav ---------- */
  function initNav() {
    var $header = $('#siteHeader');
    var $nav = $('.js-navbar');
    var $menu = $('#navMenu');
    var $links = $menu.find('.nav-link');
    var $ink = $menu.find('.nav-ink');
    var $toggle = $('.js-menu-toggle');
    var desktop = window.matchMedia('(min-width: 1200px)');
    var lastY = window.scrollY, ticking = false;

    // Sliding indicator: a thin line with a diamond under the text of the active (or hovered) link.
    function moveInk($link) {
      if (!desktop.matches) return;
      if (!$link || !$link.length) $link = $links.filter('.active').first();
      if (!$link.length) $link = $links.first();
      var el = $link[0];
      var cs = window.getComputedStyle(el);
      var padL = parseFloat(cs.paddingLeft);
      var textW = el.offsetWidth - padL - parseFloat(cs.paddingRight) - (parseFloat(cs.letterSpacing) || 0);
      $ink.css({ '--ink-x': (el.offsetLeft + padL) + 'px', '--ink-w': textW + 'px' });
      $links.removeClass('is-inked');
      $link.addClass('is-inked');
    }

    function onScroll() {
      ticking = false;
      var y = window.scrollY;
      var floating = y > 40;
      $nav.toggleClass('is-floating', floating);
      // Smart hide: tuck away while reading downwards, come back on any upward scroll.
      // Desktop keeps the bar on screen; phones/tablets tuck it away while scrolling down.
      var keep = desktop.matches || reducedMotion || $body.hasClass('is-menu-open') || $nav[0].matches(':focus-within');
      if (keep || y < window.innerHeight || y < lastY - 4) $header.removeClass('is-hidden');
      else if (y > lastY + 4) $header.addClass('is-hidden');
      lastY = y;
    }

    function setMenu(open) {
      if (open) {
        var r = $toggle[0].getBoundingClientRect();
        $menu.css({ '--mx': (r.left + r.width / 2) + 'px', '--my': (r.top + r.height / 2) + 'px' });
      }
      $header.removeClass('is-hidden');
      $body.toggleClass('is-menu-open', open);
      $toggle.attr({ 'aria-expanded': String(open), 'aria-label': open ? 'Tutup menu' : 'Buka menu' });
      $('#main').attr('inert', open ? '' : null);
      if (open) setTimeout(function () { $links.first().trigger('focus'); }, 250);
    }

    $(window).on('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    });
    $(window).on('resize', function () { moveInk(); if (desktop.matches) setMenu(false); });
    $(window).on('activate.bs.scrollspy', function () { moveInk(); });
    $nav.on('focusin', function () { $header.removeClass('is-hidden'); });
    $links.on('mouseenter focus', function () { moveInk($(this)); });
    $menu.on('mouseleave focusout', function () { moveInk(); });
    $links.on('click', function () { if ($body.hasClass('is-menu-open')) setMenu(false); });
    $toggle.on('click', function () { setMenu(!$body.hasClass('is-menu-open')); });
    $(document).on('keydown', function (e) {
      if (e.key === 'Escape' && $body.hasClass('is-menu-open')) { setMenu(false); $toggle.trigger('focus'); }
    });

    $body.scrollspy({ target: '#mainNav', offset: 100 });
    moveInk();
    if (document.fonts) document.fonts.ready.then(function () { moveInk(); });
  }

  $(function () {
    initOpening();
    initMusic();
    initCountdown();
    initGallery();
    initRsvp();
    initWishes();
    initGift();
    initNav();
    initMotion();
    $('.btn-pill').not('.js-open, .js-copy, .btn-pill--choice').on('click', ripple);
  });
})(jQuery);
