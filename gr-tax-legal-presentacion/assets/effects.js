/* Premium effects: parallax, gold dust, tilt, counters, split text, magnetic buttons. Vanilla, GPU-friendly. */
(function(){
  "use strict";
  var root = document.documentElement, $$ = function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))};
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* Intro curtain */
  function ready(){ document.body.classList.add("ready"); }
  if (document.readyState === "complete") setTimeout(ready, 500); else window.addEventListener("load", function(){ setTimeout(ready, 450); });
  setTimeout(ready, 2600); /* never block if fonts/map are slow (e.g. Google blocked in mainland China) */

  /* Split headline text into animated words */
  $$(".split").forEach(function(el){
    $$(".es, .zh", el).forEach(function(part){
      var isZh = part.classList.contains("zh");
      var nodes = Array.prototype.slice.call(part.childNodes), out = document.createDocumentFragment(), n = 0;
      nodes.forEach(function(node){
        if (node.nodeType === 3){
          var tokens = isZh ? node.textContent.match(/\s+|[\u4e00-\u9fff][\u3000-\u303f\uff00-\uffef]?|[\u3000-\u303f\uff00-\uffef]|[^\s\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]+/g) || [] : node.textContent.split(/(\s+)/);
          tokens.forEach(function(tk){
            if (/^\s+$/.test(tk) || !tk) { out.appendChild(document.createTextNode(tk)); return; }
            var w = document.createElement("span"); w.className = "w";
            var i = document.createElement("i"); i.textContent = tk; i.style.transitionDelay = (0.15 + n*0.045) + "s"; n++;
            w.appendChild(i); out.appendChild(w);
          });
        } else if (node.nodeName === "BR") { out.appendChild(node.cloneNode()); }
        else {
          var w2 = document.createElement("span"); w2.className = "w";
          var i2 = document.createElement("i"); i2.appendChild(node.cloneNode(true)); i2.style.transitionDelay = (0.15 + n*0.045) + "s"; n++;
          w2.appendChild(i2); out.appendChild(w2);
        }
      });
      part.innerHTML = ""; part.appendChild(out);
    });
  });

  /* Pointer parallax -> CSS vars (--px/--py in -1..1) */
  var tx=0, ty=0, cx=0, cy=0, raf=null;
  function loop(){
    cx += (tx-cx)*0.08; cy += (ty-cy)*0.08;
    root.style.setProperty("--px", cx.toFixed(3)); root.style.setProperty("--py", cy.toFixed(3));
    if (Math.abs(tx-cx) > .001 || Math.abs(ty-cy) > .001) raf = requestAnimationFrame(loop); else raf = null;
  }
  function kick(){ if (!raf && !reduce) raf = requestAnimationFrame(loop); }
  if (fine){
    window.addEventListener("pointermove", function(e){
      tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; kick();
      root.style.setProperty("--gx", e.clientX+"px"); root.style.setProperty("--gy", e.clientY+"px");
    }, {passive:true});
  }

  /* Slide scroll parallax for the big numeral */
  $$(".slide").forEach(function(s){
    var num = s.querySelector(".bignum");
    if (!num) return;
    s.addEventListener("scroll", function(){ num.style.setProperty("--sy", (s.scrollTop * 0.35) + "px"); }, {passive:true});
  });

  /* Card tilt + spotlight */
  if (fine && !reduce){
    if (fine) $$(".tilt").forEach(function(c){
      c.addEventListener("pointermove", function(e){
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left)/r.width, y = (e.clientY - r.top)/r.height;
        c.style.transform = "perspective(900px) rotateY("+((x-.5)*7)+"deg) rotateX("+((.5-y)*7)+"deg) translateY(-3px)";
        c.style.setProperty("--mx", (x*100)+"%"); c.style.setProperty("--my", (y*100)+"%");
      });
      c.addEventListener("pointerleave", function(){ c.style.transform = ""; });
    });
    /* Magnetic buttons */
    $$(".btn").forEach(function(b){
      b.addEventListener("pointermove", function(e){ var r=b.getBoundingClientRect(); b.style.setProperty("--bx", ((e.clientX-r.left-r.width/2)*.18)+"px"); b.style.setProperty("--by", ((e.clientY-r.top-r.height/2)*.25)+"px"); });
      b.addEventListener("pointerleave", function(){ b.style.setProperty("--bx","0px"); b.style.setProperty("--by","0px"); });
    });
  }
  /* Ripple on press */
  document.addEventListener("pointerdown", function(e){
    var b = e.target.closest(".btn, .phase, .svc .head, .qa > button, .step .bub");
    if (!b) return;
    var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), sp = document.createElement("span");
    sp.className = "ripple"; sp.style.width = sp.style.height = d+"px"; sp.style.left = (e.clientX-r.left-d/2)+"px"; sp.style.top = (e.clientY-r.top-d/2)+"px";
    if (getComputedStyle(b).position === "static") b.style.position = "relative";
    b.style.overflow = "hidden"; b.appendChild(sp); setTimeout(function(){ sp.remove(); }, 700);
  });

  /* Animated counters (only real numbers; placeholders are skipped) */
  function runCounters(slide){
    $$("[data-count]", slide).forEach(function(el){
      var end = parseFloat(el.dataset.count), dur = 1400, t0 = null, suf = el.dataset.suffix || "";
      if (reduce){ el.textContent = end + suf; return; }
      function step(ts){ if(!t0) t0 = ts; var p = Math.min(1,(ts-t0)/dur), e = 1-Math.pow(1-p,4);
        el.textContent = Math.round(end*e) + suf; if (p<1) requestAnimationFrame(step); }
      el.textContent = "0"+suf; requestAnimationFrame(step);
    });
  }
  document.addEventListener("slidechange", function(e){
    runCounters(e.detail.slide);
    var n = $$(".slide").length;
    root.style.setProperty("--shift", (e.detail.index/(n-1)).toFixed(3));
    var a = document.querySelector(".aurora");
    if (a) a.style.filter = "blur(70px) saturate(120%) hue-rotate("+(e.detail.index*-4)+"deg)";
  });
  var first = document.querySelector(".slide.active"); if (first) runCounters(first);

  /* Gold dust canvas (low particle count, pauses when tab hidden) */
  var cv = document.getElementById("dust");
  if (cv && !reduce && innerWidth > 800){
    var ctx = cv.getContext("2d"), W, H, dpr = Math.min(window.devicePixelRatio||1, 2), P = [];
    var COUNT = innerWidth < 720 ? 28 : 60;
    function size(){ W = cv.width = innerWidth*dpr; H = cv.height = innerHeight*dpr; cv.style.width = innerWidth+"px"; cv.style.height = innerHeight+"px"; }
    size(); window.addEventListener("resize", size);
    for (var i=0;i<COUNT;i++) P.push({x:Math.random(),y:Math.random(),r:Math.random()*1.6+.4,s:Math.random()*.00025+.00006,a:Math.random()*Math.PI*2,red:Math.random()<.12});
    var running = true;
    document.addEventListener("visibilitychange", function(){ running = !document.hidden; if (running) requestAnimationFrame(draw); });
    function draw(){
      if (!running) return;
      ctx.clearRect(0,0,W,H);
      var px = parseFloat(root.style.getPropertyValue("--px")||0), py = parseFloat(root.style.getPropertyValue("--py")||0);
      for (var i=0;i<P.length;i++){
        var p = P[i]; p.y -= p.s; p.a += .01; if (p.y < -0.02){ p.y = 1.02; p.x = Math.random(); }
        var x = (p.x + Math.sin(p.a)*.004 - px*.01*p.r) * W, y = (p.y - py*.01*p.r) * H, tw = .45 + Math.sin(p.a*2)*.35;
        ctx.beginPath(); ctx.arc(x, y, p.r*dpr, 0, 6.283);
        ctx.fillStyle = p.red ? "rgba(214,80,66,"+(tw*.7)+")" : "rgba(241,220,164,"+tw+")";
        ctx.shadowBlur = 8*dpr; ctx.shadowColor = p.red ? "rgba(184,50,42,.8)" : "rgba(226,195,122,.9)";
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
})();
