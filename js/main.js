(function(){
  document.documentElement.classList.add('js');
  setTimeout(function(){ document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); }); }, 3000);
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- hero: rotación de fotos --- */
  var slides = document.querySelectorAll('.hero-shot .slide');
  var hdots = document.querySelectorAll('#heroDots button');
  var hi = 0, htimer;
  function showHero(i){
    hi = (i + slides.length) % slides.length;
    slides.forEach(function(s,k){ s.classList.toggle('on', k===hi); });
    hdots.forEach(function(d,k){ d.classList.toggle('on', k===hi); });
  }
  function startHero(){ if(reduce) return; clearInterval(htimer); htimer = setInterval(function(){ showHero(hi+1); }, 4200); }
  hdots.forEach(function(d,k){ d.addEventListener('click', function(){ showHero(k); startHero(); }); });
  startHero();

  /* --- nav: compacta + sección activa + menú mobile --- */
  var topbar = document.getElementById('topbar');
  var links = document.querySelectorAll('.menu a');
  var sections = ['top','services','projects','process','about','contact'].map(function(id){ return document.getElementById(id); });
  function onScroll(){
    var y = window.scrollY || document.documentElement.scrollTop;
    topbar.classList.toggle('small', y > 80);
    document.getElementById('totop').classList.toggle('on', y > 700);
    var current = 'top';
    sections.forEach(function(s){ if(s && s.getBoundingClientRect().top <= 140) current = s.id; });
    links.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === '#'+current); });
  }
  window.addEventListener('scroll', onScroll, {passive:true}); onScroll();

  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer');
  burger.addEventListener('click', function(){ drawer.classList.toggle('open'); });
  drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ drawer.classList.remove('open'); }); });

  /* --- reveal al entrar en pantalla --- */
  if('IntersectionObserver' in window){
    var ro = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); ro.unobserve(e.target); } });
    }, {threshold:.15});
    document.querySelectorAll('.reveal').forEach(function(el){ ro.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
  }

  /* --- las fotos "emergen" hacia arriba al hacer scroll (con escalonado entre vecinas) --- */
  var riseEls = document.querySelectorAll('.svc-card .photo, .proj-card, .about > .photo');
  riseEls.forEach(function(el){ el.classList.add('rise'); });
  if('IntersectionObserver' in window){
    var rio = new IntersectionObserver(function(entries){
      var n = 0;
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        var el = e.target;
        el.style.transitionDelay = (n++ * 0.12) + 's';
        el.classList.add('in-view');
        rio.unobserve(el);
        setTimeout(function(){ el.style.transitionDelay = ''; }, 1600);
      });
    }, {threshold:.12, rootMargin:'0px 0px -6% 0px'});
    riseEls.forEach(function(el){ rio.observe(el); });
  } else {
    riseEls.forEach(function(el){ el.classList.add('in-view'); });
  }

  /* --- Process: línea de tiempo que se dibuja con el scroll y enciende cada paso en orden --- */
  var stepsBox = document.querySelector('.steps4');
  if(stepsBox){
    var stepEls = stepsBox.querySelectorAll('.step');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var tick = false;
    var update = function(){
      tick = false;
      var vh = window.innerHeight, r = stepsBox.getBoundingClientRect();
      var p = reduce ? 1 : Math.max(0, Math.min(1, (vh * 0.85 - r.top) / Math.max(r.height, vh * 0.45)));
      stepsBox.style.setProperty('--p', p.toFixed(3));
      stepsBox.style.setProperty('--pl', Math.min(1, p / 0.79).toFixed(3)); /* la línea llega al último número justo cuando se enciende */
      stepEls.forEach(function(el, i){
        var r2 = el.getBoundingClientRect();
        var on = reduce || (stepsBox.offsetWidth > 1080 ? p >= (i / stepEls.length) + 0.04 : r2.top < vh * 0.82);
        el.classList.toggle('on', on);
      });
    };
    var req = function(){ if(!tick){ tick = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', req, {passive:true});
    window.addEventListener('resize', req);
    update();
  }

  /* --- pestañas de servicios --- */
  var tabs = document.querySelectorAll('#tabs button');
  var panels = document.querySelectorAll('.panel');
  tabs.forEach(function(b){
    b.addEventListener('click', function(){
      var i = b.getAttribute('data-tab');
      tabs.forEach(function(x){ x.classList.remove('on'); });
      b.classList.add('on');
      panels.forEach(function(p){ p.classList.toggle('on', p.getAttribute('data-panel') === i); });
    });
  });

  /* --- contadores --- */
  var statsEl = document.getElementById('stats');
  function runCounters(){
    statsEl.querySelectorAll('b').forEach(function(b){
      var to = parseInt(b.getAttribute('data-to'),10), suf = b.getAttribute('data-suffix') || '';
      if(isNaN(to)) return; // no confirmed number yet — leave the placeholder text as-is
      if(reduce){ b.textContent = to + suf; return; }
      b.textContent = '0' + suf;
      var t0 = null, dur = 1200;
      function step(ts){
        if(!t0) t0 = ts;
        var p = Math.min((ts - t0)/dur, 1);
        b.textContent = Math.round(to * (1 - Math.pow(1-p,3))) + suf;
        if(p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  if('IntersectionObserver' in window){
    var so = new IntersectionObserver(function(e){ if(e[0].isIntersecting){ runCounters(); so.disconnect(); } }, {threshold:.4});
    so.observe(statsEl);
  } else { runCounters(); }

  /* --- carrusel de proyectos: loop infinito real con clones fantasma --- */
  var track = document.getElementById('track');
  var allSlides = track.querySelectorAll('.slide-card');          // incluye los 2 clones (extremos)
  var realCards = track.querySelectorAll('.slide-card:not([data-clone])');
  var dots = document.getElementById('dots');
  var n = realCards.length;               // proyectos reales (4)
  var curReal = 0;                        // indice real activo (0..n-1)
  var animating = false;
  function domPos(domIdx){ return allSlides[domIdx].offsetLeft - track.offsetLeft; }
  function jumpInstant(domIdx){ track.scrollTo({left: domPos(domIdx), behavior:'auto'}); }
  function scrollToDom(domIdx, cb){
    track.scrollTo({left: domPos(domIdx), behavior: reduce ? 'auto' : 'smooth'});
    if(reduce){ cb(); return; }
    setTimeout(cb, 460); // duracion aprox. del scroll smooth
  }
  function updateDots(){
    dots.querySelectorAll('button').forEach(function(d,k){ d.classList.toggle('on', k === curReal); });
  }
  realCards.forEach(function(_, i){
    var b = document.createElement('button');
    b.setAttribute('aria-label','Proyecto ' + (i+1));
    if(i === 0) b.classList.add('on');
    b.addEventListener('click', function(){
      if(animating || i === curReal) return;
      animating = true;
      scrollToDom(i + 1, function(){ curReal = i; updateDots(); animating = false; });
    });
    dots.appendChild(b);
  });
  function step(dir){
    if(animating) return;
    animating = true;
    if(dir === 1){
      if(curReal === n - 1){
        // desliza hacia el clon del primero, y al llegar salta invisible al real 0
        scrollToDom(n + 1, function(){ jumpInstant(1); curReal = 0; updateDots(); animating = false; });
      } else {
        var t = curReal + 1;
        scrollToDom(t + 1, function(){ curReal = t; updateDots(); animating = false; });
      }
    } else {
      if(curReal === 0){
        // desliza hacia el clon del ultimo, y al llegar salta invisible al real n-1
        scrollToDom(0, function(){ jumpInstant(n); curReal = n - 1; updateDots(); animating = false; });
      } else {
        var t2 = curReal - 1;
        scrollToDom(t2 + 1, function(){ curReal = t2; updateDots(); animating = false; });
      }
    }
  }
  var trackTimer;
  function startAutoplay(){ if(reduce) return; clearInterval(trackTimer); trackTimer = setInterval(function(){ step(1); }, 4200); }
  function stopAutoplay(){ clearInterval(trackTimer); }
  document.getElementById('prev').addEventListener('click', function(){ step(-1); startAutoplay(); });
  document.getElementById('next').addEventListener('click', function(){ step(1); startAutoplay(); });
  dots.addEventListener('click', function(){ startAutoplay(); });
  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', startAutoplay);
  track.addEventListener('touchstart', stopAutoplay, {passive:true});
  jumpInstant(1); // arranca posicionado en el proyecto real 0 (oculta el clon del ultimo a la izquierda)
  updateDots();
  startAutoplay();

  /* --- reseñas --- */
  var quotes = document.querySelectorAll('.quote');
  var qdots = document.getElementById('qdots');
  var qi = 0, qtimer;
  quotes.forEach(function(_, i){
    var b = document.createElement('button');
    b.setAttribute('aria-label','Review ' + (i+1));
    if(i === 0) b.classList.add('on');
    b.addEventListener('click', function(){ showQuote(i); startQuotes(); });
    qdots.appendChild(b);
  });
  function showQuote(i){
    qi = (i + quotes.length) % quotes.length;
    quotes.forEach(function(q,k){ q.classList.toggle('on', k===qi); });
    qdots.querySelectorAll('button').forEach(function(d,k){ d.classList.toggle('on', k===qi); });
  }
  function startQuotes(){ if(reduce) return; clearInterval(qtimer); qtimer = setInterval(function(){ showQuote(qi+1); }, 5200); }
  if(quotes.length && qdots) startQuotes(); // reviews section is hidden for now

  /* --- formulario de contacto (Zoho CRM) --- */
  var quoteForm = document.getElementById('form');
  // Al enviarse, el navegador hace POST a Zoho y Zoho devuelve a ?sent=1#contact
  quoteForm.addEventListener('submit', function(){
    var btn = quoteForm.querySelector('button[type="submit"]');
    setTimeout(function(){ if(btn){ btn.disabled = true; btn.textContent = 'Sending…'; } }, 0);
  });
  if(/[?&]sent=1/.test(window.location.search)){
    document.getElementById('formMsg').classList.add('on');
    if(window.history && history.replaceState){ history.replaceState(null, '', window.location.pathname + '#contact'); }
  }

  /* --- barra de progreso de scroll --- */
  var progress = document.getElementById('progress');
  function updateProgress(){
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var y = window.scrollY || document.documentElement.scrollTop;
    if(progress) progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
  }
  window.addEventListener('scroll', updateProgress, {passive:true});
  window.addEventListener('resize', updateProgress);
  updateProgress();

  /* --- volver arriba --- */
  document.getElementById('totop').addEventListener('click', function(){
    window.scrollTo({top:0, behavior: reduce ? 'auto' : 'smooth'});
  });
})();
/* (9/10) Portfolio en celular: la foto "antes" se ve solo mientras se mantiene presionada la tarjeta; al soltar vuelve la foto "después". */
(function(){
  var track = document.getElementById('track'); if(!track) return;
  var timer = null, active = null, sx = 0, sy = 0, lastTouch = 0;
  function clear(){ clearTimeout(timer); timer = null; if(active){ active.classList.remove('pressing'); active = null; } }
  function cardOf(e){ return e.target && e.target.closest ? e.target.closest('.hover-swap') : null; }
  track.addEventListener('touchstart', function(e){
    lastTouch = Date.now();
    var card = cardOf(e); if(!card) return;
    var t = e.touches[0]; sx = t.clientX; sy = t.clientY; clear();
    timer = setTimeout(function(){ card.classList.add('pressing'); active = card; }, 60);
  }, {passive:true});
  track.addEventListener('touchmove', function(e){
    lastTouch = Date.now();
    var t = e.touches[0]; if(Math.abs(t.clientX - sx) > 10 || Math.abs(t.clientY - sy) > 10) clear();
  }, {passive:true});
  ['touchend','touchcancel'].forEach(function(n){ document.addEventListener(n, function(){ lastTouch = Date.now(); clear(); }, {passive:true}); });
  /* mouse (ventana angosta en computadora / modo celular del navegador): se mantiene el clic para ver el antes */
  track.addEventListener('mousedown', function(e){
    if(Date.now() - lastTouch < 800) return;
    var card = cardOf(e); if(!card) return; clear(); card.classList.add('pressing'); active = card;
  });
  ['mouseup','mouseleave'].forEach(function(n){ track.addEventListener(n, function(){ if(Date.now() - lastTouch >= 800) clear(); }); });
  document.addEventListener('mouseup', function(){ if(Date.now() - lastTouch >= 800) clear(); });
  track.addEventListener('contextmenu', function(e){ if(cardOf(e)) e.preventDefault(); });
})();

/* (9/10) Portfolio en celular/tablet: cada foto que queda a la vista muestra el "antes" solo, ~0,8 s después de llegar, y lo mantiene 2 s antes de volver al "después". Reversible: borrar este bloque (y el bloque ".autobefore" de css/style.css). */
(function(){
  var track = document.getElementById('track'); if(!track) return;
  var slides = track.querySelectorAll('.slide-card'); if(!slides.length) return;
  var mq = window.matchMedia('(max-width:900px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cur = null, t1 = null, t2 = null, shown = null;
  function clear(){ clearTimeout(t1); clearTimeout(t2); if(shown){ shown.classList.remove('autobefore'); shown = null; } }
  function keyOf(s){ var p = s.querySelector('.hover-swap'); return p ? p.className.replace(/\b(hover-swap|pressing|autobefore|photo|img)\b/g,'').trim() : ''; }
  function active(){
    var sl = track.scrollLeft, best = 0, bd = 1e9;
    for(var i=0;i<slides.length;i++){ var d = Math.abs((slides[i].offsetLeft - track.offsetLeft) - sl); if(d < bd){ bd = d; best = i; } }
    return {i:best, d:bd};
  }
  function visible(){ var r = track.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; }
  setInterval(function(){
    if(reduce || !mq.matches || document.hidden || !visible()){ clear(); cur = null; return; }
    var a = active(); if(a.d > 4) return;
    var k = keyOf(slides[a.i]); if(k === cur) return;
    cur = k; clear();
    var card = slides[a.i].querySelector('.hover-swap'); if(!card) return;
    t1 = setTimeout(function(){
      if(card.classList.contains('pressing')) return;
      card.classList.add('autobefore'); shown = card;
      t2 = setTimeout(function(){ card.classList.remove('autobefore'); if(shown === card) shown = null; }, 2000);
    }, 800);
  }, 200);
})();
