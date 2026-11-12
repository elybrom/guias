(function(){
'use strict';
var G=window.GAT;
var TOPICS=G.TOPICS, FLASH=G.FLASH, EXAM=G.EXAM;
function $(s,r){return (r||document).querySelector(s)}
function $$(s,r){return [].slice.call((r||document).querySelectorAll(s))}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zñ0-9 ]/g,' ').replace(/\s+/g,' ').trim()}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}

/* in-view animation */
if('IntersectionObserver' in window){
  var io=new IntersectionObserver(function(ents){
    ents.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('in-view');
        if(fxOn && e.target.querySelector('.prop, .stamp')) pop();
      }
    });
  },{threshold:0.22, rootMargin:'0px 0px -8% 0px'});
  $$('article.tema').forEach(function(el){io.observe(el)});
} else {
  $$('article.tema').forEach(function(el){el.classList.add('in-view')});
}

/* SFX — muted by default */
var fxOn=false, actx=null;
function ctx(){if(!actx){var A=window.AudioContext||window.webkitAudioContext;if(A)actx=new A()}if(actx&&actx.state==='suspended')actx.resume();return actx}
function beep(freq, dur, type, vol, slide){
  if(!fxOn)return;
  var c=ctx(); if(!c)return;
  var o=c.createOscillator(), g=c.createGain();
  o.type=type||'sine'; o.frequency.setValueAtTime(freq,c.currentTime);
  if(slide) o.frequency.exponentialRampToValueAtTime(slide,c.currentTime+dur);
  g.gain.setValueAtTime(vol||0.07,c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001,c.currentTime+dur);
  o.connect(g); g.connect(c.destination);
  o.start(); o.stop(c.currentTime+dur+0.02);
}
function pop(){beep(520,.07,'triangle',0.06,880); setTimeout(function(){beep(880,.05,'sine',0.04)},40)}
function swoosh(){beep(420,.12,'sawtooth',0.03,180)}
var fxBtn=$('#fxToggle');
if(fxBtn){
  try{fxOn=localStorage.getItem('gatitos-fx')==='1'}catch(e){}
  function paintFx(){fxBtn.textContent=fxOn?'SFX on':'SFX off';fxBtn.classList.toggle('on',fxOn)}
  paintFx();
  fxBtn.onclick=function(){fxOn=!fxOn;try{localStorage.setItem('gatitos-fx',fxOn?'1':'0')}catch(e){}paintFx();if(fxOn)pop()};
}

/* sticker tap: bounce + pop */
document.addEventListener('click',function(e){
  var s=e.target.closest('img.sticker'); if(!s)return;
  s.classList.remove('talking'); void s.offsetWidth; s.classList.add('talking');
  pop();
  setTimeout(function(){s.classList.remove('talking')},900);
});

/* verses hide */
document.addEventListener('click',function(e){
  var v=e.target.closest('.verso');if(v)v.classList.toggle('oculto');
});

/* mini quizzes */
document.addEventListener('click',function(e){
  var b=e.target.closest('.quiz button');if(!b)return;
  var box=b.closest('.quiz');var ans=+box.dataset.ans;
  var ok=+b.dataset.a===ans;
  $$('button',box).forEach(function(x){x.classList.remove('on','ok','mal');if(+x.dataset.a===ans)x.classList.add('ok')});
  b.classList.add('on',ok?'ok':'mal');
  box.querySelector('[data-qr]').textContent=ok?'¡Bien! El gatito está contento. ✨':'Casi. Mira la respuesta marcada en verde y vuelve a leer el tema. 🤔';
  if(ok)pop(); else swoosh();
});

/* AUDIOBOOK */
var aud=$('#aud');
var playlist=[{id:'00-intro',title:'Bienvenida',src:'audio/00-intro.mp3'}].concat(TOPICS.map(function(t){return {id:t.id,title:t.titulo,src:'audio/'+t.id+'.mp3'}}));
var idx=-1, rate=1, mode='one';
function highlight(id){
  $$('article.tema.playing').forEach(function(el){el.classList.remove('playing')});
  if(!id||id==='00-intro')return;
  var art=$('#t-'+id);
  if(art){art.classList.add('playing','in-view');}
}
function load(i,play){
  if(i<0||i>=playlist.length)return;
  idx=i;var t=playlist[i];
  aud.src=t.src;aud.playbackRate=rate;
  $('#pTitle').textContent=t.title;
  $('#pSub').textContent=(i)+' / '+(playlist.length-1);
  highlight(t.id);
  if('mediaSession' in navigator){
    try{
      navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:'Gatitos · Dinámica de la iglesia',album:'Audiolibro'});
    }catch(e){}
  }
  if(play)aud.play().catch(function(){});
  updatePlay();
}
function updatePlay(){$('#pPlay').textContent=(!aud.paused)?'❚❚':'▶'}
$('#pPlay').onclick=function(){
  if(idx<0){mode='all';load(0,true);return}
  if(aud.paused)aud.play();else aud.pause();
};
$('#pPrev').onclick=function(){if(idx>0)load(idx-1,true)};
$('#pNext').onclick=function(){if(idx<playlist.length-1)load(idx+1,true)};
aud.addEventListener('play',function(){updatePlay()});
aud.addEventListener('pause',function(){updatePlay()});
aud.addEventListener('timeupdate',function(){
  var p=aud.duration?aud.currentTime/aud.duration:0;
  $('#pFill').style.width=(p*100)+'%';
  // reveal remate phrases toward the end
  var art=$('article.tema.playing');
  if(art && p>0.72) art.classList.add('in-view');
});
aud.addEventListener('ended',function(){
  if(mode==='all'&&idx<playlist.length-1)load(idx+1,true);
  else {updatePlay(); highlight(null)}
});
$('#pBar').addEventListener('click',function(e){
  if(!aud.duration)return;
  var r=this.getBoundingClientRect();
  aud.currentTime=((e.clientX-r.left)/r.width)*aud.duration;
});
$$('.vel button[data-vel]').forEach(function(b){
  b.onclick=function(){
    rate=+b.dataset.vel;aud.playbackRate=rate;
    $$('.vel button[data-vel]').forEach(function(x){x.classList.toggle('on',x===b)});
  };
});
$('#btnTodo').onclick=function(){mode='all';load(0,true)};
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-play]');if(!b)return;
  var id=b.dataset.play;
  var i=playlist.findIndex(function(x){return x.id===id});
  if(i>=0){mode='one';load(i,true)}
});
if('mediaSession' in navigator){
  try{
    navigator.mediaSession.setActionHandler('play',function(){aud.play()});
    navigator.mediaSession.setActionHandler('pause',function(){aud.pause()});
    navigator.mediaSession.setActionHandler('previoustrack',function(){if(idx>0)load(idx-1,true)});
    navigator.mediaSession.setActionHandler('nexttrack',function(){if(idx<playlist.length-1)load(idx+1,true)});
  }catch(e){}
}

/* FLASHCARDS */
(function(){
  var box=$('#flashBox');
  box.innerHTML=FLASH.map(function(f,i){
    return '<article class="flash" data-fi="'+i+'"><cite>'+esc(f[0])+'</cite><p data-side="front">Toca para ver el versículo · '+esc(f[2])+'</p></article>';
  }).join('');
  box.addEventListener('click',function(e){
    var c=e.target.closest('.flash');if(!c)return;
    var f=FLASH[+c.dataset.fi];
    var p=c.querySelector('p');
    var front=p.dataset.side==='front';
    if(front){p.dataset.side='back';p.textContent='“'+f[1]+'”'}
    else{p.dataset.side='front';p.textContent='Toca para ver el versículo · '+f[2]}
  });
})();

/* MATCH */
(function(){
  var pairs=FLASH.slice().sort(function(){return Math.random()-0.5}).slice(0,8);
  var sel=null,ok=0;
  function pinta(){
    var L=shuffle(pairs.map(function(p,i){return {k:'r',i:i,t:p[0]}}));
    var R=shuffle(pairs.map(function(p,i){return {k:'p',i:i,t:p[2]}}));
    $('#matchBox').innerHTML=L.map(function(x){return '<button type="button" data-k="r" data-i="'+x.i+'">'+esc(x.t)+'</button>'}).join('')+
      R.map(function(x){return '<button type="button" data-k="p" data-i="'+x.i+'">'+esc(x.t)+'</button>'}).join('');
    ok=0;sel=null;$('#matchRes').textContent='';
  }
  $('#matchBox').addEventListener('click',function(e){
    var b=e.target.closest('button');if(!b||b.classList.contains('ok'))return;
    if(!sel){sel=b;b.classList.add('sel');return}
    if(sel===b){b.classList.remove('sel');sel=null;return}
    if(sel.dataset.k===b.dataset.k){sel.classList.remove('sel');sel=b;b.classList.add('sel');return}
    if(sel.dataset.i===b.dataset.i){
      sel.classList.add('ok');b.classList.add('ok');sel.classList.remove('sel');sel=null;ok++;
      $('#matchRes').textContent=ok+' de '+pairs.length+' parejas';
      if(fxOn)pop();
    } else {sel.classList.remove('sel');sel=null}
  });
  $('#matchX').onclick=pinta;pinta();
})();

/* EXAM */
var st=null;
function startEx(){
  st={items:shuffle(EXAM),ans:{},graded:false};
  $('#exRes').hidden=true;$('#exCalif').disabled=false;
  var h='';
  st.items.forEach(function(q,i){
    h+='<article class="q" id="eq'+i+'">';
    if(q[0]==='A'){
      h+='<h4>A · Completa · '+esc(q[1])+'</h4><p>“'+esc(q[2])+'”</p><input type="text" data-ei="'+i+'" placeholder="La palabra que falta" style="width:100%;padding:8px 10px;border-radius:10px;border:1.5px solid #D3C7AD;font:500 1rem Montserrat,sans-serif">';
    } else if(q[0]==='B'){
      h+='<h4>B · ¿Qué cita es?</h4><p>“'+esc(q[1])+'”</p><div class="ops">'+q[2].map(function(o){return '<button type="button" class="op" data-ei="'+i+'" data-v="'+esc(o)+'">'+esc(o)+'</button>'}).join('')+'</div>';
    } else {
      h+='<h4>'+(q[0]==='C'?'C · Relaciona':'D · Concepto')+'</h4><p>'+esc(q[1])+'</p><div class="ops">'+q[2].map(function(o){return '<button type="button" class="op" data-ei="'+i+'" data-v="'+esc(o)+'">'+esc(o)+'</button>'}).join('')+'</div>';
    }
    h+='<div class="exp"></div></article>';
  });
  $('#exBox').innerHTML=h;
}
function gradeEx(){
  if(!st)return;
  var ok=0;
  st.items.forEach(function(q,i){
    var a=st.ans[i]||'', good=false, exp='';
    if(q[0]==='A'){
      var n=norm(a), oks=(q[4]||[q[3]]).map(norm);
      good=oks.indexOf(n)>=0||n.split(' ').indexOf(norm(q[3]))>=0;
      exp=good?'Correcto.':'Era «'+q[3]+'».';
    } else if(q[0]==='B'){
      good=a===q[2][q[3]];exp=good?'Correcto.':'Era '+q[2][q[3]]+'.';
    } else {
      good=a===q[2][q[3]];exp=good?'Correcto.':'Era: '+q[2][q[3]]+'.';
    }
    var el=$('#eq'+i);
    el.classList.add(good?'bien':'mal');
    el.querySelector('.exp').textContent=exp;
    var inp=el.querySelector('input');if(inp)inp.disabled=true;
    if(good)ok++;
  });
  st.graded=true;
  var n=Math.round(ok/st.items.length*100)/10;
  var best=0;try{best=Math.max(n,+(JSON.parse(localStorage.getItem('gatitos-dinamica-v1')||'{}').best||0))}catch(e){best=n}
  try{localStorage.setItem('gatitos-dinamica-v1',JSON.stringify({best:best}))}catch(e){}
  var box=$('#exRes');box.hidden=false;
  box.innerHTML='<div class="n">'+String(n).replace('.',',')+'</div><p><b>'+ok+' de '+st.items.length+' correctas</b> · sobre 10</p><p>Mejor en este teléfono: '+best+'/10</p>';
  box.scrollIntoView({behavior:'smooth',block:'center'});
}
$('#exStart').onclick=startEx;$('#exNuevo').onclick=startEx;
$('#exCalif').onclick=function(){if(st&&confirm('¿Calificar ahora?'))gradeEx()};
$('#exBox').addEventListener('input',function(e){if(!st||st.graded)return;var i=e.target.dataset.ei;if(i!=null)st.ans[+i]=e.target.value});
$('#exBox').addEventListener('click',function(e){
  var b=e.target.closest('.op');if(!b||!st||st.graded)return;
  var i=+b.dataset.ei;st.ans[i]=b.dataset.v;
  $$('#eq'+i+' .op').forEach(function(x){x.classList.toggle('on',x===b)});
});

/* notes */
(function(){
  var k='gatitos-notas-v1';
  try{$('#misNotas').value=localStorage.getItem(k)||''}catch(e){}
  $('#misNotas').addEventListener('input',function(){try{localStorage.setItem(k,this.value)}catch(e){}});
})();
})();
