/* Simulacro · Dinámica de la iglesia */
(function(){
'use strict';
var DATA = window.EXAM;
var KEY='examen-dinamica-v1';
function ld(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
function sv(o){var s=ld();for(var k in o)s[k]=o[k];try{localStorage.setItem(KEY,JSON.stringify(s))}catch(e){}}
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zñ0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function pick(a,n){return shuffle(a).slice(0,n)}
function showBest(){var b=ld().best;var el=$('#bestBox');if(!el)return;el.textContent=b!=null?'Tu mejor puntaje: '+b+'/10':'Aún no hay un simulacro calificado.'}

/* MAPA */
(function(){
  var box=$('#mapaList');if(!box)return;
  box.innerHTML=DATA.temas.map(function(t){
    return '<a class="tema" href="'+esc(t.href)+'"><small>'+esc(t.k)+'</small><h3>'+esc(t.h)+'</h3><p>'+esc(t.idea)+'</p><div class="refs">'+(t.refs.split(' · ').map(function(r){return '<span>'+esc(r)+'</span>'}).join(''))+'</div><p class="nota">'+esc(t.tag)+'</p></a>';
  }).join('');
})();

/* VERSÍCULOS */
(function(){
  var box=$('#vgrid'), fil='todos', oculta=false;
  var LAB={todos:'Todos',unidad:'Unidad',pastoral:'Labor pastoral',palabra:'La Palabra',obispo:'El obispo',madurez:'Madurez'};
  function pinta(){
    var L=DATA.versos.filter(function(v){return fil==='todos'||v.t===fil});
    box.innerHTML=L.map(function(v,i){
      return '<article class="vc" data-i="'+i+'"><cite>'+esc(v.ref)+' · '+esc(LAB[v.t]||v.t)+'</cite><p class="txt">“'+esc(v.txt)+'”</p><p class="idea">'+esc(v.idea)+' <a href="'+esc(v.href)+'">Abrir la libreta</a></p></article>';
    }).join('');
    $('#vcount').textContent=L.length+' versículos';
    box.closest('#versiculos').classList.toggle('oculta',oculta);
  }
  $('#filtros').innerHTML=Object.keys(LAB).map(function(k){return '<button type="button" data-f="'+k+'" class="'+(k==='todos'?'on':'')+'">'+LAB[k]+'</button>'}).join('');
  $('#filtros').addEventListener('click',function(e){var b=e.target.closest('[data-f]');if(!b)return;fil=b.dataset.f;$$('#filtros button').forEach(function(x){x.classList.toggle('on',x===b)});pinta()});
  $('#btnOcultar').addEventListener('click',function(){oculta=!oculta;this.classList.toggle('on',oculta);this.textContent=oculta?'Mostrar texto':'Ocultar texto (memorizar)';pinta()});
  box.addEventListener('click',function(e){var c=e.target.closest('.vc');if(c&&oculta)c.classList.toggle('ver')});
  pinta();
})();

/* PLAN */
(function(){
  var done=ld().plan||{};
  function pinta(){
    $('#planList').innerHTML=DATA.plan.map(function(p,i){
      return '<label class="'+(done[i]?'on':'')+'"><input type="checkbox" data-pl="'+i+'" '+(done[i]?'checked':'')+'><div><b>'+esc(p.t)+' · '+esc(p.h)+'</b><small>'+esc(p.x)+'</small> <a href="'+esc(p.href)+'">Ir →</a></div></label>';
    }).join('');
    var n=DATA.plan.filter(function(_,i){return done[i]}).length;
    $('#planRes').textContent=n+' de '+DATA.plan.length+' bloques listos';
  }
  $('#planList').addEventListener('change',function(e){var k=e.target.dataset.pl;if(k==null)return;done=ld().plan||{};done[+k]=e.target.checked;sv({plan:done});pinta()});
  pinta();
})();

/* SIMULACRO */
var state=null, timer=null, left=0;
function buildExam(){
  var A=pick(DATA.A,15).map(function(q){return {k:'A',q:q}});
  var B=pick(DATA.B,15).map(function(q){return {k:'B',q:q,ops:shuffle(q.ops.map(function(o,i){return {o:o,ok:i===q.ans}}))}});
  var C=pick(DATA.C,10).map(function(q){return {k:'C',q:q,ops:shuffle(q.ops.map(function(o,i){return {o:o,ok:i===q.ans}}))}});
  var D=pick(DATA.D,15).map(function(q){return {k:'D',q:q,ops:shuffle(q.ops.map(function(o,i){return {o:o,ok:i===q.ans}}))}});
  var E=DATA.E.map(function(q){return {k:'E',q:q}});
  return {items:A.concat(B,C,D,E), answers:{}, graded:false, started:Date.now()};
}
function tit(it,i){
  var n={A:'A · Completa el versículo',B:'B · ¿Qué cita es?',C:'C · Relaciona con la enseñanza',D:'D · Conceptos de clase',E:'E · Pregunta abierta'}[it.k];
  return '<div class="k">'+n+' · '+(i+1)+'</div>';
}
function renderQ(it,i,graded){
  var h=tit(it,i), q=it.q, ans=state.answers[i], cls=graded&&it.k!=='E'?(it._ok?' ok':' mal'):'';
  if(it.k==='A'){
    h+='<h3><span class="ref">'+esc(q.ref)+'</span></h3><p>“'+esc(q.pre)+'<b>________</b>'+esc(q.post)+'”</p>';
    h+='<input type="text" data-i="'+i+'" autocomplete="off" placeholder="Escribe la palabra que falta" value="'+esc(ans||'')+'" '+(graded?'disabled':'')+'>';
  } else if(it.k==='B'){
    h+='<h3>“'+esc(q.txt)+'”</h3><div class="ops">'+it.ops.map(function(o,j){return '<button type="button" class="op'+(ans===o.o?' on':'')+(graded&&o.ok?' ok':'')+'" data-i="'+i+'" data-v="'+esc(o.o)+'">'+esc(o.o)+'</button>'}).join('')+'</div>';
  } else if(it.k==='C'){
    h+='<h3>¿Qué enseñanza ligó el maestro a <span class="ref">'+esc(q.ref)+'</span>?</h3><div class="ops">'+it.ops.map(function(o){return '<button type="button" class="op'+(ans===o.o?' on':'')+'" data-i="'+i+'" data-v="'+esc(o.o)+'">'+esc(o.o)+'</button>'}).join('')+'</div>';
  } else if(it.k==='D'){
    h+='<h3>'+esc(q.q)+'</h3><div class="ops">'+it.ops.map(function(o){return '<button type="button" class="op'+(ans===o.o?' on':'')+'" data-i="'+i+'" data-v="'+esc(o.o)+'">'+esc(o.o)+'</button>'}).join('')+'</div>';
  } else {
    h+='<h3>'+esc(q.q)+'</h3><textarea data-i="'+i+'" rows="4" placeholder="Escribe tu respuesta…">'+esc(ans||'')+'</textarea>';
    h+='<details class="modelo"><summary>Ver respuesta modelo</summary><p>'+esc(q.mod)+'</p><p><a href="'+esc(q.href)+'">Abrir la libreta</a></p></details>';
  }
  if(graded&&it.k!=='E'){
    var exp='';
    if(it.k==='A') exp=(it._ok?'Correcto. ':'La palabra era «'+q.blank+'». ')+'<a href="'+(hrefOf(q.ref))+'">Ver en la libreta</a>';
    if(it.k==='B'){var good=q.ops[q.ans];exp=(it._ok?'Correcto. ':'Era '+good+'. ')+'<a href="'+esc(q.href)+'">Ver en la libreta</a>';}
    if(it.k==='C') exp=(it._ok?'Correcto. ':'')+esc(q.exp)+' <a href="'+esc(q.href)+'">Ver en la libreta</a>';
    if(it.k==='D') exp=(it._ok?'Correcto. ':'')+esc(q.exp)+' <a href="'+esc(q.href)+'">Ver en la libreta</a>';
    h+='<div class="exp">'+exp+'</div>';
  }
  return '<article class="q'+cls+(it.k==='E'?' abierta':'')+'" id="q'+i+'">'+h+'</article>';
}
function hrefOf(ref){
  var v=DATA.versos.find(function(x){return x.ref===ref||x.ref.indexOf(ref)===0});
  return v?v.href:'../dinamica-de-la-iglesia/';
}
function pintaExam(){
  var box=$('#examBox');
  var g=state&&state.graded;
  if(!state){box.innerHTML='<p class="lead">Pulsa «Empezar simulacro». Son 15 + 15 + 10 + 15 preguntas calificables (sobre 10) y 5 abiertas con respuesta modelo. Cada intento baraja el banco.</p>';return}
  var html='';
  var last='';
  state.items.forEach(function(it,i){
    if(it.k!==last){var titulos={A:'A · Completa el versículo (palabra faltante)',B:'B · ¿Qué cita es?',C:'C · Relaciona el versículo con su enseñanza',D:'D · Conceptos de clase',E:'E · Preguntas abiertas (no entran en la nota automática)'};html+='<h3 class="sec" style="margin:22px 0 8px;font-family:var(--serif)">'+titulos[it.k]+'</h3>';last=it.k}
    html+=renderQ(it,i,g);
  });
  box.innerHTML=html;
  var n=$$('#examBox .q input, #examBox .q textarea, #examBox .q .op.on').length; // rough
  updateProg();
}
function updateProg(){
  if(!state)return;
  var tot=state.items.filter(function(it){return it.k!=='E'}).length;
  var done=0;
  state.items.forEach(function(it,i){if(it.k==='E')return;if(state.answers[i])done++});
  $('#examProg i').style.width=(done/tot*100)+'%';
  $('#examMeta').textContent=done+' de '+tot+' respondidas (más 5 abiertas)';
}
function grade(){
  if(!state)return;
  var ok=0,tot=0;
  state.items.forEach(function(it,i){
    if(it.k==='E')return;
    tot++;
    var a=state.answers[i]||'';
    var good=false;
    if(it.k==='A'){
      var n=norm(a), oks=it.q.ok.concat([it.q.blank]).map(norm), words=n.split(' ').filter(Boolean);
      good=oks.indexOf(n)>=0||oks.some(function(x){return words.indexOf(x)>=0});
    } else {
      var chosen=a;
      good=it.ops.some(function(o){return o.ok&&o.o===chosen});
    }
    it._ok=good;if(good)ok++;
  });
  var nota=Math.round((ok/tot)*100)/10; // 1 decimal over 10
  // wait: ok/tot * 10, one decimal: Math.round(ok/tot*100)/10 yes.
  state.graded=true;state.nota=nota;state.ok=ok;state.tot=tot;
  var prev=ld().best;if(prev==null||nota>prev)sv({best:nota});
  pintaExam();
  var msg=nota>=9?'Excelente: ya tienes pies y cabeza. Repasa solo los fallos.':nota>=7?'Vas bien. Afirma los versículos que fallaste esta noche.':nota>=5?'Hay base, pero te faltan versículos. Vuelve a la hoja y repite el simulacro.':'No te desanimes. Empieza por el mapa y los 16 versículos imprescindibles, y vuelve a intentarlo.';
  $('#resultado').hidden=false;
  $('#resultado').innerHTML='<div class="n">'+nota.toString().replace('.',',')+'</div><p><b>'+ok+' de '+tot+' correctas</b> · sobre 10</p><p>'+msg+'</p><p class="best" style="color:#D3C7AD">Mejor puntaje en este dispositivo: '+(ld().best)+'/10</p>';
  showBest();
  $('#resultado').scrollIntoView({behavior:'smooth',block:'center'});
  stopTimer();
}
function start(withTime){
  state=buildExam();
  $('#resultado').hidden=true;$('#resultado').innerHTML='';
  $('#btnCalificar').disabled=false;
  pintaExam();
  if(withTime){left=45*60;startTimer()}else{stopTimer();$('#clock').textContent='Sin tiempo';}
  location.hash='#simulacro';
}
function startTimer(){
  stopTimer();
  function tick(){var m=Math.floor(left/60),s=left%60;$('#clock').textContent=m+':'+('0'+s).slice(-2);if(left<=0){stopTimer();if(state&&!state.graded)grade();return}left--}
  tick();timer=setInterval(tick,1000);
}
function stopTimer(){if(timer){clearInterval(timer);timer=null}}
$('#btnEmpezar').onclick=function(){start(false)};
$('#btnCronometro').onclick=function(){start(true)};
$('#btnNuevo').onclick=function(){start(!!timer||($('#clock').textContent||'').indexOf(':')>=0)};
$('#btnCalificar').onclick=function(){if(!state)return;if(!confirm('¿Calificar ahora? Podrás ver cada error con su explicación.'))return;grade()};
$('#examBox').addEventListener('input',function(e){var i=e.target.dataset.i;if(i==null||!state||state.graded)return;state.answers[+i]=e.target.value;updateProg()});
$('#examBox').addEventListener('click',function(e){var b=e.target.closest('.op');if(!b||!state||state.graded)return;var i=+b.dataset.i;state.answers[i]=b.dataset.v;$$('#q'+i+' .op').forEach(function(x){x.classList.toggle('on',x===b)});updateProg()});
$('#btnImprimir').onclick=function(){$$('#versiculos').forEach(function(){});document.documentElement.classList.remove('oculta');window.print()};
showBest();
pintaExam();

// sticky tab highlight
var ids=['mapa','versiculos','simulacro','plan'];
function hl(){var y=scrollY+80;ids.forEach(function(id){var el=document.getElementById(id);var a=document.querySelector('.tabs a[href="#'+id+'"]');if(!el||!a)return;var top=el.offsetTop,bot=top+el.offsetHeight;a.classList.toggle('on',y>=top&&y<bot)})}
addEventListener('scroll',hl,{passive:true});hl();
})();
