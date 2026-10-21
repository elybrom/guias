/* G&R TAX-LEGAL CONSULTING — presentation logic (vanilla JS, no build) */
(function(){
  "use strict";
  var $ = function(s,c){return (c||document).querySelector(s)};
  var $$ = function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var body = document.body;
  var slides = $$(".slide");
  var cur = 0;
  var progress = $(".progress i");
  var counter = $(".counter");
  var dotsBox = $(".dots");
  var toastEl = $(".toast");

  /* ---------- Language ---------- */
  var LANGS = ["es","zh","both"];
  function setLang(l, silent){
    if (LANGS.indexOf(l) < 0) l = "both";
    body.classList.remove("l-es","l-zh","l-both");
    body.classList.add("l-"+l);
    document.documentElement.lang = l === "zh" ? "zh-Hans" : "es";
    $$(".lang button").forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.lang === l ? "true" : "false"); });
    try{ localStorage.setItem("gr-lang", l); }catch(e){}
    if (!silent) refreshLightboxCaption();
  }
  var qsLang = (location.search.match(/[?&]lang=(es|zh|both)/) || [])[1];
  var stored = null; try{ stored = localStorage.getItem("gr-lang"); }catch(e){}
  setLang(qsLang || stored || "both", true);
  $$(".lang button").forEach(function(b){ b.addEventListener("click", function(){ setLang(b.dataset.lang); }); });
  function t(es, zh){ var l = body.classList.contains("l-zh") ? "zh" : body.classList.contains("l-es") ? "es" : "both"; return l==="es"?es:l==="zh"?zh:(es+" · "+zh); }

  function toast(msg){ toastEl.textContent = msg; toastEl.classList.add("on"); clearTimeout(toast._t); toast._t = setTimeout(function(){ toastEl.classList.remove("on"); }, 2200); }

  /* ---------- Navigation ---------- */
  slides.forEach(function(s,i){
    var b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-label", (i+1)+" / "+slides.length);
    b.addEventListener("click", function(){ go(i); });
    dotsBox.appendChild(b);
  });
  var dots = $$("button", dotsBox);

  function go(i){
    i = Math.max(0, Math.min(slides.length-1, i));
    cur = i;
    slides.forEach(function(s,k){
      s.classList.toggle("active", k===i);
      s.classList.toggle("before", k<i);
      s.setAttribute("aria-hidden", k===i ? "false" : "true");
      if (k===i) s.scrollTop = 0;
    });
    dots.forEach(function(d,k){ d.classList.toggle("on", k===i); });
    progress.style.width = ((i+1)/slides.length*100)+"%";
    counter.innerHTML = "<b>"+String(i+1).padStart(2,"0")+"</b> / "+String(slides.length).padStart(2,"0");
    $$(".index button").forEach(function(b,k){ b.classList.toggle("on", k===i); });
    try{ history.replaceState(null, "", "#"+(i+1)); }catch(e){}
    var s = slides[i];
    body.classList.toggle("on-light", s.classList.contains("light"));
    if (s.querySelector("[data-map-src]")) loadMap(s);
    document.dispatchEvent(new CustomEvent("slidechange",{detail:{index:i,slide:s}}));
  }
  function next(){ go(cur+1); } function prev(){ go(cur-1); }
  $(".nav-next").addEventListener("click", next);
  $(".nav-prev").addEventListener("click", prev);
  $(".brand").addEventListener("click", function(){ go(0); });
  $$("[data-go]").forEach(function(el){ el.addEventListener("click", function(){ go(parseInt(el.dataset.go,10)-1); }); });

  document.addEventListener("keydown", function(e){
    if (lb.classList.contains("on")){
      if (e.key==="Escape") closeLb(); else if (e.key==="ArrowRight") lbStep(1); else if (e.key==="ArrowLeft") lbStep(-1);
      return;
    }
    if (idx.classList.contains("on")){ if (e.key==="Escape") toggleIndex(false); return; }
    var tag = (e.target.tagName||"").toLowerCase();
    if (tag==="input" || tag==="textarea") return;
    switch(e.key){
      case "ArrowRight": case "PageDown": next(); e.preventDefault(); break;
      case "ArrowLeft": case "PageUp": prev(); e.preventDefault(); break;
      case " ": if (tag!=="button" && tag!=="a"){ e.shiftKey?prev():next(); e.preventDefault(); } break;
      case "Home": go(0); e.preventDefault(); break;
      case "End": go(slides.length-1); e.preventDefault(); break;
      case "m": case "M": toggleIndex(); break;
    }
  });

  /* swipe */
  var sx=0, sy=0, st=0, tracking=false;
  document.addEventListener("touchstart", function(e){
    if (e.touches.length!==1) { tracking=false; return; }
    if (e.target.closest(".timeline, .table-wrap, .map-frame, .index")) { tracking=false; return; }
    tracking=true; sx=e.touches[0].clientX; sy=e.touches[0].clientY; st=Date.now();
  }, {passive:true});
  document.addEventListener("touchend", function(e){
    if (!tracking) return; tracking=false;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)*1.4 && Date.now()-st < 900){
      if (lb.classList.contains("on")) { lbStep(dx<0?1:-1); return; }
      dx<0 ? next() : prev();
    }
  }, {passive:true});

  /* ---------- Index overlay ---------- */
  var idx = $(".index");
  var idxList = $("ol", idx);
  slides.forEach(function(s,i){
    var li = document.createElement("li");
    li.innerHTML = '<button type="button"><span class="n">'+String(i+1).padStart(2,"0")+'</span><span><span class="es">'+s.dataset.es+'</span><span class="zh">'+s.dataset.zh+'</span></span></button>';
    li.firstChild.addEventListener("click", function(){ toggleIndex(false); go(i); });
    idxList.appendChild(li);
  });
  function toggleIndex(force){ var on = typeof force==="boolean" ? force : !idx.classList.contains("on"); idx.classList.toggle("on", on); }
  $(".menu").addEventListener("click", function(){ toggleIndex(); });
  $(".index-close").addEventListener("click", function(){ toggleIndex(false); });

  /* ---------- Expandables (services + FAQ) ---------- */
  $$("[data-toggle]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var box = btn.closest(btn.dataset.toggle);
      var open = !box.classList.contains("open");
      if (box.parentElement.hasAttribute("data-accordion")){
        $$(btn.dataset.toggle+".open", box.parentElement).forEach(function(o){ if(o!==box){ o.classList.remove("open"); $("[data-toggle]",o).setAttribute("aria-expanded","false"); } });
      }
      box.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- Timeline ---------- */
  var steps = $$(".step"), details = $$(".step-detail"), fill = $(".timeline .fill"), curStep = 0;
  function setStep(i){
    curStep = Math.max(0, Math.min(steps.length-1, i));
    steps.forEach(function(s,k){ s.classList.toggle("on", k===curStep); s.classList.toggle("done", k<curStep); s.setAttribute("aria-selected", k===curStep); });
    details.forEach(function(d,k){ d.classList.toggle("on", k===curStep); });
    if (fill) fill.style.width = (84 * curStep/(steps.length-1)) + "%";
    var tl = $(".timeline"); var st = steps[curStep];
    if (tl && tl.scrollWidth > tl.clientWidth) tl.scrollTo({left: st.offsetLeft - tl.clientWidth/2 + st.clientWidth/2, behavior:"smooth"});
  }
  steps.forEach(function(s,k){ s.addEventListener("click", function(){ setStep(k); }); });
  $$("[data-step]").forEach(function(b){ b.addEventListener("click", function(){ setStep(curStep + parseInt(b.dataset.step,10)); }); });
  if (steps.length) setStep(0);
  $$(".checklist li").forEach(function(li){
    li.setAttribute("tabindex","0"); li.setAttribute("role","checkbox"); li.setAttribute("aria-checked","false");
    function tog(){ var on = li.classList.toggle("ok"); li.setAttribute("aria-checked", on); }
    li.addEventListener("click", tog);
    li.addEventListener("keydown", function(e){ if(e.key===" "||e.key==="Enter"){ e.preventDefault(); e.stopPropagation(); tog(); } });
  });

  /* ---------- Pilot ---------- */
  var storeBox = $(".stores");
  if (storeBox){
    var N = parseInt(storeBox.dataset.stores || "13", 10);
    var icon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 9l1.5-5h15L21 9M3 9h18M3 9v1a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0V9M5 13v7h14v-7"/></svg>';
    for (var k=0;k<N;k++){ var d=document.createElement("div"); d.className="store"; d.innerHTML=icon+"<em>"+(k+1)+"</em>"; storeBox.appendChild(d); }
    var stores = $$(".store", storeBox);
    var phases = $$(".phase");
    function setPhase(p){
      phases.forEach(function(ph,k){ ph.classList.toggle("on", k===p); ph.setAttribute("aria-pressed", k===p); });
      stores.forEach(function(s,k){
        s.style.setProperty("--i", k);
        s.classList.toggle("pilot", k<2);
        s.classList.toggle("scaled", p===2 && k>=2);
      });
    }
    phases.forEach(function(ph,k){ ph.addEventListener("click", function(){ setPhase(k); }); });
    setPhase(0);
  }

  /* ---------- Real images: load if file exists, else keep placeholder ---------- */
  $$(".ph-box[data-src]").forEach(function(box){
    var img = new Image();
    img.onload = function(){ img.alt = box.dataset.es || ""; box.insertBefore(img, box.firstChild); box.classList.add("loaded"); box.dataset.loaded = "1";
      var gi = box.closest(".g-item"); if (gi) gi.dataset.loaded = "1"; };
    img.src = box.dataset.src;
  });

  /* ---------- Map (lazy, only when slide opens) ---------- */
  function loadMap(slide){
    var f = slide.querySelector(".sede.on [data-map-src]") || slide.querySelector("[data-map-src]");
    if (!f || f.dataset.loaded) return;
    f.dataset.loaded = "1";
    var ifr = document.createElement("iframe");
    ifr.src = f.dataset.mapSrc; ifr.loading = "lazy"; ifr.referrerPolicy = "no-referrer-when-downgrade";
    ifr.title = "Mapa — G&R TAX-LEGAL CONSULTING"; ifr.allowFullscreen = true;
    f.appendChild(ifr);
  }
  $$("[data-sede-tab]").forEach(function(b){
    b.addEventListener("click", function(){
      var box = b.closest(".sedes"), sl = b.closest(".slide");
      $$("[data-sede-gallery]", sl).forEach(function(g){ g.hidden = g.dataset.sedeGallery !== b.dataset.sedeTab; });
      $$("[data-sede-tab]", box).forEach(function(x){ var on = x===b; x.classList.toggle("on", on); x.setAttribute("aria-selected", on); });
      $$(".sede", box).forEach(function(c){ c.classList.toggle("on", c.dataset.sede === b.dataset.sedeTab); });
      loadMap(box);
    });
  });
  $$("[data-copy]").forEach(function(b){
    b.addEventListener("click", function(){
      var txt = b.dataset.copy;
      var done = function(){ toast(t("Dirección copiada","地址已复制")); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
      function fallback(){ var ta=document.createElement("textarea"); ta.value=txt; ta.style.position="fixed"; ta.style.opacity="0"; document.body.appendChild(ta); ta.select(); try{document.execCommand("copy"); done();}catch(e){} ta.remove(); }
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = $(".lightbox"), lbMedia = $(".lb-media", lb), lbCap = $(".lb-cap", lb), lbCount = $(".lb-count", lb);
  var group = [], gi = 0;
  $$(".g-item").forEach(function(it){
    it.setAttribute("tabindex","0"); it.setAttribute("role","button");
    function open(){
      group = $$('.g-item[data-group="'+it.dataset.group+'"]');
      gi = group.indexOf(it); showLb(); lb.classList.add("on"); $(".lb-close").focus();
    }
    it.addEventListener("click", open);
    it.addEventListener("keydown", function(e){ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); e.stopPropagation(); open(); } });
  });
  function phHTML(it){
    return '<div class="ph-box"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/></svg>'+
      '<span class="tag">'+(it.dataset.ph||"PH")+'</span><span class="t">'+t("Contenido pendiente: ","待补充内容：")+'<br>'+t(it.dataset.es,it.dataset.zh)+'</span>'+
      '<span class="t small">'+(it.dataset.video || it.dataset.src || "")+'</span></div>';
  }
  function showLb(){
    var it = group[gi]; lbMedia.innerHTML = "";
    if (it.dataset.video){
      var v = document.createElement("video");
      v.controls = true; v.playsInline = true; v.preload = "metadata";
      if (it.dataset.src && it.dataset.loaded) v.poster = it.dataset.src;
      v.src = it.dataset.video;
      v.onerror = function(){ lbMedia.innerHTML = phHTML(it); };
      lbMedia.appendChild(v);
    } else if (it.dataset.loaded){
      var im = document.createElement("img"); im.src = it.dataset.src; im.alt = it.dataset.es || ""; lbMedia.appendChild(im);
    } else lbMedia.innerHTML = phHTML(it);
    refreshLightboxCaption();
  }
  function refreshLightboxCaption(){
    if (!group.length) return; var it = group[gi];
    lbCap.textContent = t(it.dataset.es||"", it.dataset.zh||"");
    lbCount.textContent = (gi+1)+" / "+group.length;
  }
  function lbStep(d){ if(!group.length) return; gi = (gi + d + group.length) % group.length; showLb(); }
  function closeLb(){ lb.classList.remove("on"); lbMedia.innerHTML=""; }
  $(".lb-close").addEventListener("click", closeLb);
  $(".lb-prev").addEventListener("click", function(){ lbStep(-1); });
  $(".lb-next").addEventListener("click", function(){ lbStep(1); });
  lb.addEventListener("click", function(e){ if (e.target===lb || e.target===$(".lb-stage",lb)) closeLb(); });

  window.addEventListener("hashchange", function(){ var n = parseInt((location.hash||"").replace("#",""),10); if (!isNaN(n) && n-1 !== cur) go(n-1); });
  /* ---------- Start ---------- */
  var h = parseInt((location.hash||"").replace("#",""),10);
  go(isNaN(h) ? 0 : h-1);
})();
