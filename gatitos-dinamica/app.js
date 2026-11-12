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
function pop(){if(window.__quiet)return;beep(520,.07,'triangle',0.06,880); setTimeout(function(){beep(880,.05,'sine',0.04)},40)}
function swoosh(){if(window.__quiet)return;beep(420,.12,'sawtooth',0.03,180)}
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

/* AUDIOBOOK + MODO DORMIR */
var aud=$('#aud');
var studyList=[{id:'00-intro',title:'Bienvenida',src:'audio/00-intro.mp3'}].concat(TOPICS.map(function(t){return {id:t.id,title:t.titulo,src:'audio/'+t.id+'.mp3'}}));
var sleepList=[{id:'dormir-todo',title:'Modo para dormir',src:'audio/dormir-todo.mp3'}];
var sleepTopics=[{id:'intro',title:'Introducción',src:'audio/dormir/intro.mp3'}].concat(TOPICS.map(function(t){return {id:'d-'+t.id,title:t.titulo,src:'audio/dormir/'+t.id+'.mp3'}}));
var playlist=studyList;
var idx=-1, rate=1, mode='one', kind='study', loopOn=false;
window.__quiet=false;
function slugRef(ref){
  return String(ref||'').toLowerCase().replace(/[–—]/g,'-')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function verseSrc(ref){return 'audio/dormir/verso-'+slugRef(ref)+'.mp3'}
function setNight(on){
  window.__quiet=!!on;
  var pl=$('#player');
  if(pl)pl.classList.toggle('night', !!on);
  var sc=$('#sleepCtrls');
  if(sc)sc.hidden=!on;
}
function highlight(id){
  $$('article.tema.playing').forEach(function(el){el.classList.remove('playing')});
  $$('.sleep-topics button.on').forEach(function(el){el.classList.remove('on')});
  $$('.flash-play.on').forEach(function(el){el.classList.remove('on');el.setAttribute('aria-pressed','false')});
  if(!id||id==='00-intro'||id==='dormir-todo'||id==='intro')return;
  var tid=id.indexOf('d-')===0?id.slice(2):id;
  var art=$('#t-'+tid);
  if(art){art.classList.add('playing','in-view');}
  var tb=$('.sleep-topics button[data-sid="'+id+'"]');
  if(tb)tb.classList.add('on');
}
function metaAlbum(){
  if(kind==='sleep')return {artist:'Modo para dormir',album:'Apuntes y Palabra'};
  if(kind==='verse')return {artist:'Modo para dormir',album:'Versículo'};
  return {artist:'Gatitos · Dinámica de la iglesia',album:'Audiolibro'};
}
function load(i,play){
  if(i<0||i>=playlist.length)return;
  idx=i;var t=playlist[i];
  aud.volume=1;
  aud.src=t.src;aud.playbackRate=rate;
  $('#pTitle').textContent=t.title;
  $('#pSub').textContent=kind==='sleep'||kind==='verse'? (loopOn?'Se repite · ':'')+(kind==='verse'?'Versículo':'Modo para dormir') : ((i)+' / '+(playlist.length-1));
  var sn=$('#sleepNow');
  if(sn)sn.textContent='Ahora: '+t.title;
  highlight(t.id);
  if('mediaSession' in navigator){
    try{navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:metaAlbum().artist,album:metaAlbum().album});}catch(e){}
  }
  if(play)aud.play().catch(function(){});
  updatePlay();
}
function useKind(k, list, i, play, md){
  kind=k; playlist=list; mode=md||'all';
  setNight(k==='sleep'||k==='verse');
  if((k==='sleep'||k==='verse') && rate>1) setRate(1);
  load(i,play);
}
function setRate(r){
  rate=r; if(aud)aud.playbackRate=rate;
  $$('.vel button[data-vel]').forEach(function(x){x.classList.toggle('on', +x.dataset.vel===r)});
  $$('#sleepVel button').forEach(function(x){x.classList.toggle('on', +x.dataset.svel===r)});
}
function updatePlay(){$('#pPlay').textContent=(!aud.paused)?'❚❚':'▶'}
$('#pPlay').onclick=function(){
  if(idx<0){useKind('study',studyList,0,true,'all');return}
  if(aud.paused)aud.play();else aud.pause();
};
$('#pPrev').onclick=function(){if(idx>0)load(idx-1,true); else if(loopOn)load(playlist.length-1,true)};
$('#pNext').onclick=function(){if(idx<playlist.length-1)load(idx+1,true); else if(loopOn)load(0,true)};
aud.addEventListener('play',function(){updatePlay()});
aud.addEventListener('pause',function(){updatePlay()});
aud.addEventListener('timeupdate',function(){
  var p=aud.duration?aud.currentTime/aud.duration:0;
  $('#pFill').style.width=(p*100)+'%';
  var art=$('article.tema.playing');
  if(art && p>0.72) art.classList.add('in-view');
  paintSleepLeft();
});
aud.addEventListener('ended',function(){
  if((kind==='sleep'||kind==='verse') && loopOn){
    load(idx<playlist.length-1?idx+1:0, true);
    return;
  }
  if(mode==='all'&&idx<playlist.length-1){load(idx+1,true);return;}
  updatePlay(); highlight(null);
});
$('#pBar').addEventListener('click',function(e){
  if(!aud.duration)return;
  var r=this.getBoundingClientRect();
  aud.currentTime=((e.clientX-r.left)/r.width)*aud.duration;
});
$$('.vel button[data-vel]').forEach(function(b){
  b.onclick=function(){setRate(+b.dataset.vel)};
});
$$('#sleepVel button').forEach(function(b){
  b.onclick=function(){setRate(+b.dataset.svel)};
});
$('#btnTodo').onclick=function(){useKind('study',studyList,0,true,'all')};
document.addEventListener('click',function(e){
  var b=e.target.closest('[data-play]');if(!b)return;
  var id=b.dataset.play;
  var i=studyList.findIndex(function(x){return x.id===id});
  if(i>=0)useKind('study',studyList,i,true,'one');
});
if('mediaSession' in navigator){
  try{
    navigator.mediaSession.setActionHandler('play',function(){aud.play()});
    navigator.mediaSession.setActionHandler('pause',function(){aud.pause()});
    navigator.mediaSession.setActionHandler('previoustrack',function(){if(idx>0)load(idx-1,true); else if(loopOn)load(playlist.length-1,true)});
    navigator.mediaSession.setActionHandler('nexttrack',function(){if(idx<playlist.length-1)load(idx+1,true); else if(loopOn)load(0,true)});
  }catch(e){}
}

/* sleep timer + loop */
var sleepMins=0, sleepUntil=0, sleepT=null, fadeT=null;
function armSleep(mins){
  sleepMins=+mins||0;
  clearTimeout(sleepT); clearInterval(fadeT);
  aud.volume=1;
  sleepUntil=sleepMins? Date.now()+sleepMins*60*1000 : 0;
  if(sleepMins){
    var wait=Math.max(0, sleepMins*60*1000-15000);
    sleepT=setTimeout(startFade, wait);
  }
  paintTimer();
}
function startFade(){
  var start=Date.now(), dur=15000;
  fadeT=setInterval(function(){
    var t=(Date.now()-start)/dur;
    if(t>=1){
      clearInterval(fadeT); aud.volume=0; aud.pause(); aud.volume=1;
      updatePlay(); armSleep(0);
      var sn=$('#sleepNow'); if(sn)sn.textContent='El temporizador terminó. Descansa.';
      return;
    }
    aud.volume=Math.max(0, 1-t);
  }, 250);
}
function paintTimer(){
  $$('#sleepTimers button, #sleepCtrls button[data-sleep]').forEach(function(b){
    b.classList.toggle('on', +b.dataset.sleep===sleepMins);
  });
  paintSleepLeft();
}
function paintSleepLeft(){
  var el=$('#pSleepLeft');
  if(!el)return;
  if(!sleepUntil){el.textContent='';return;}
  var s=Math.max(0, Math.round((sleepUntil-Date.now())/1000));
  el.textContent=Math.floor(s/60)+':'+(s%60<10?'0':'')+(s%60);
}
function setLoop(on){
  loopOn=!!on;
  var a=$('#sleepLoop'), b=$('#pLoop');
  if(a){a.textContent=loopOn?'↻ Repetir: sí':'↻ Repetir: no';a.classList.toggle('on',loopOn)}
  if(b)b.classList.toggle('on',loopOn);
}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-sleep]'); if(!t)return;
  armSleep(+t.dataset.sleep);
});
var sl=$('#sleepLoop'); if(sl) sl.onclick=function(){setLoop(!loopOn)};
var plp=$('#pLoop'); if(plp) plp.onclick=function(){setLoop(!loopOn)};
var bd=$('#btnDormirTodo');
if(bd) bd.onclick=function(){useKind('sleep',sleepList,0,true,'all')};

(function(){
  var box=$('#sleepTopics');
  if(!box)return;
  box.innerHTML=sleepTopics.map(function(t){
    return '<button type="button" data-sid="'+t.id+'">'+esc(t.title)+'</button>';
  }).join('');
  box.addEventListener('click',function(e){
    var b=e.target.closest('button[data-sid]'); if(!b)return;
    var i=sleepTopics.findIndex(function(x){return x.id===b.dataset.sid});
    if(i>=0) useKind('sleep', sleepTopics, i, true, 'all');
  });
})();

/* FLASHCARDS */
(function(){
  var box=$('#flashBox');
  box.innerHTML=FLASH.map(function(f,i){
    var slug=slugRef(f[0]);
    return '<article class="flash" data-fi="'+i+'"><div class="flash-top"><cite>'+esc(f[0])+'</cite><button type="button" class="flash-play" data-verse="'+esc(f[0])+'" aria-label="Escuchar '+esc(f[0])+'" title="Escuchar el versículo, despacio">▶</button></div><p data-side="front">Toca para ver el versículo · '+esc(f[2])+'</p></article>';
  }).join('');
  box.addEventListener('click',function(e){
    var play=e.target.closest('.flash-play');
    if(play){
      e.stopPropagation();
      var ref=play.dataset.verse;
      useKind('verse', [{id:'v-'+slugRef(ref), title:ref, src:verseSrc(ref)}], 0, true, 'one');
      play.classList.add('on'); play.setAttribute('aria-pressed','true');
      return;
    }
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
