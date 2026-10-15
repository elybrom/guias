(function(){
var slug=document.documentElement.getAttribute('data-libreta');
var KP='dinamica-progreso-v1';function ld(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}}
if(slug){var pr=ld(KP,{}),r=pr[slug]||{max:0,y:0},tm;
 function track(){var h=document.documentElement.scrollHeight-innerHeight;var pc=h>0?Math.round(scrollY/h*100):0;r.max=Math.max(r.max||0,pc);r.y=scrollY;r.t=Date.now();pr=ld(KP,{});pr[slug]=r;pr._last=slug;try{localStorage.setItem(KP,JSON.stringify(pr))}catch(e){}}
 addEventListener('scroll',function(){clearTimeout(tm);tm=setTimeout(track,400)},{passive:true});
 addEventListener('load',function(){if(location.hash==='#continuar'&&r.y)setTimeout(function(){scrollTo(0,r.y)},300)});}
var LIB={"unidad-iglesia":"Unidad de la iglesia","labor-pastoral":"Labor pastoral","josue-1-8-meditar":"La Palabra que nos guarda","yo-soy-juan":"Los 7 «Yo soy» de Juan","general":"General del curso"};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var box=document.getElementById('apPublicados');if(!box)return;
fetch('../apuntes.json?t='+Date.now()).then(function(r){return r.json()}).then(function(j){var e=(j.apuntes||[]).filter(function(z){return !slug||z.libreta===slug});
 box.innerHTML=e.length?e.map(function(n){return '<div class="it"><small>'+esc(LIB[n.libreta]||n.libreta||'')+(n.fecha?' · '+esc(n.fecha):'')+'</small><b>'+esc(n.titulo||'')+'</b><div>'+esc(n.texto||'').replace(/\n/g,'<br>')+'</div></div>'}).join(''):'<div class="vacio">Todavía no hay apuntes publicados. Escribe en tu libreta y envíalos; aparecerán aquí.</div>'}).catch(function(){box.innerHTML='<div class="vacio">No se pudieron cargar los apuntes publicados.</div>'});
})();
