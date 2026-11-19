/* Landing concept: the shed is built as the visitor scrolls. No libraries. */
(function(){
  'use strict';
  var NS='http://www.w3.org/2000/svg';
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $=function(s,r){return (r||document).querySelector(s)};
  var $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
  var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))};
  var NAMES=['Site','Footing and anchor bolts','Columns','Rafters','Purlins and bracing','Sheeting','Handover'];

  /* ── Geometry: five portal frames in oblique view ── */
  var svg=$('#ln-svg');if(!svg)return;
  var F=5,DX=70,DY=-26;
  var base=function(k,x,y){return [x+DX*k,y+DY*k]};
  var BL=[170,500],BR=[530,500],EL=[170,350],ER=[530,350],RG=[350,288];
  var P=function(k,pt){return base(k,pt[0],pt[1])};
  var mix=function(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]};
  var items=[];
  function el(tag,attrs,parent){var e=document.createElementNS(NS,tag);for(var k in attrs)e.setAttribute(k,attrs[k]);(parent||svg).appendChild(e);return e}
  function pt(a){return a[0].toFixed(1)+' '+a[1].toFixed(1)}
  function line(stage,cls,pts,closed){var d='M'+pts.map(pt).join(' L')+(closed?' Z':'');var e=el('path',{d:d,'class':'st '+cls,pathLength:1});items.push({e:e,s:stage,k:'d'});return e}
  function dashed(stage,pts){var e=el('path',{d:'M'+pts.map(pt).join(' L'),'class':'brc'});items.push({e:e,s:stage,k:'o'})}
  function fill(stage,cls,pts){var e=el('path',{d:'M'+pts.map(pt).join(' L')+' Z','class':cls});items.push({e:e,s:stage,k:'o'});return e}
  function rib(stage,a,b){var e=el('path',{d:'M'+pt(a)+' L'+pt(b),'class':'rib'});items.push({e:e,s:stage,k:'o'})}

  /* Stage 0: ground and dimensions (drawn on load) */
  for(var k=0;k<F;k++){line(0,'ground',[P(k,BL),P(k,BR)])}
  line(0,'ground',[P(0,BL),P(F-1,BL)]);line(0,'ground',[P(0,BR),P(F-1,BR)]);
  line(0,'ground',[[60,500],[160,500]]);line(0,'ground',[[540,500],[560,500]]);
  var dimW=el('path',{d:'M170 540 H530 M170 533 V547 M530 533 V547','class':'dim st',pathLength:1});items.push({e:dimW,s:0,k:'d'});
  var dimH=el('path',{d:'M132 350 V500 M125 350 H139 M125 500 H139','class':'dim st',pathLength:1});items.push({e:dimH,s:0,k:'d'});
  var d0=P(0,BR),d1=P(F-1,BR);
  var dimD=el('path',{d:'M'+(d0[0]+34)+' '+(d0[1]+34)+' L'+(d1[0]+34)+' '+(d1[1]+34)+' M'+(d0[0]+34)+' '+(d0[1]+27)+' V'+(d0[1]+41)+' M'+(d1[0]+34)+' '+(d1[1]+27)+' V'+(d1[1]+41),'class':'dim st',pathLength:1});items.push({e:dimD,s:0,k:'d'});
  var tW=el('text',{x:350,y:566,'text-anchor':'middle'},svg);tW.textContent='30 ft';
  var tH=el('text',{x:118,y:432,'text-anchor':'end'},svg);tH.textContent='12 ft';
  var tD=el('text',{x:(d0[0]+d1[0])/2+52,y:(d0[1]+d1[1])/2+38,'text-anchor':'start'},svg);tD.textContent='80 ft';
  var dimTx=[tW,tH,tD];dimTx.forEach(function(t){t.style.opacity=0});

  /* Stage 1: footings and anchor bolts */
  for(var k=0;k<F;k++)[BL,BR].forEach(function(b){
    var p=P(k,b);
    line(1,'foot',[[p[0]-17,p[1]],[p[0]+17,p[1]],[p[0]+17,p[1]+10],[p[0]-17,p[1]+10]],true);
    line(1,'foot',[[p[0]-8,p[1]-14],[p[0]-8,p[1]]]);line(1,'foot',[[p[0]+8,p[1]-14],[p[0]+8,p[1]]]);
  });
  /* Stage 2: columns */
  for(var k=0;k<F;k++){line(2,'col',[P(k,BL),P(k,EL)]);line(2,'col',[P(k,BR),P(k,ER)])}
  /* Stage 3: rafters */
  for(var k=0;k<F;k++)line(3,'raf',[P(k,EL),P(k,RG),P(k,ER)]);
  /* Stage 4: purlins and bracing */
  [0,.2,.4,.6,.8].forEach(function(t){line(4,'pur',[P(0,mix(EL,RG,t)),P(F-1,mix(EL,RG,t))]);line(4,'pur',[P(0,mix(ER,RG,t)),P(F-1,mix(ER,RG,t))])});
  line(4,'pur',[P(0,RG),P(F-1,RG)]);
  dashed(4,[P(F-2,ER),P(F-1,BR)]);dashed(4,[P(F-2,BR),P(F-1,ER)]);
  dashed(4,[P(F-2,EL),P(F-1,RG)]);dashed(4,[P(F-1,EL),P(F-2,RG)]);
  /* Stage 5: sheeting */
  fill(5,'sheet',[P(0,BR),P(0,ER),P(F-1,ER),P(F-1,BR)]);
  fill(5,'sheet',[P(0,EL),P(0,RG),P(F-1,RG),P(F-1,EL)]);
  fill(5,'sheet',[P(0,RG),P(0,ER),P(F-1,ER),P(F-1,RG)]);
  fill(5,'sheet',[P(0,BL),P(0,EL),P(0,RG),P(0,ER),P(0,BR)]);
  var n=16;
  for(var i=1;i<n;i++){var u=i/n;
    rib(5,mix(P(0,BR),P(F-1,BR),u),mix(P(0,ER),P(F-1,ER),u));
    rib(5,mix(P(0,RG),P(F-1,RG),u),mix(P(0,ER),P(F-1,ER),u));
    rib(5,mix(P(0,RG),P(F-1,RG),u),mix(P(0,EL),P(F-1,EL),u));
  }
  for(var j=1;j<12;j++){var x=170+j*30;rib(5,[x,500],[x,x<350?350-(x-170)*62/180:288+(x-350)*62/180]);}
  /* Stage 6: gate */
  var g=el('path',{d:'M262 500 V392 H438 V500 Z','class':'gate'});items.push({e:g,s:6,k:'o'});
  for(var r=0;r<5;r++){var y=404+r*19;var e=el('path',{d:'M266 '+y+' H434','class':'rib'});e.style.stroke='rgba(243,194,91,.5)';items.push({e:e,s:6,k:'o'})}
  var tag=el('path',{d:'M350 288 V246 M350 246 L390 259 L350 272 Z','class':'flag'});items.push({e:tag,s:6,k:'o'});

  /* Title block */
  var tbS=$('#ln-tb-stage'),tbN=$('#ln-tb-n');
  var texts=$$('.ln-t'),rail=$$('.ln-rail button'),as=$('.ln-as');
  var cur=-1;

  function set(q){
    items.forEach(function(it){
      if(it.s===0)return;
      var sp=clamp((q-(it.s-.9))/.8,0,1);
      if(it.k==='d')it.e.style.strokeDashoffset=(1-sp).toFixed(3);else it.e.style.opacity=sp.toFixed(3);
    });
    var idx=clamp(Math.round(q),0,6);
    if(idx!==cur){
      cur=idx;
      texts.forEach(function(t,i){t.classList.toggle('on',i===idx);t.setAttribute('aria-hidden',i===idx?'false':'true')});
      rail.forEach(function(b,i){b.classList.toggle('on',i===idx);if(i===idx)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
      if(tbS)tbS.textContent=NAMES[idx];if(tbN)tbN.textContent=(idx+1)+' / 7';
    }
    rail.forEach(function(b,i){var f=i===0?1:clamp((q-(i-.9))/.8,0,1);b.style.setProperty('--f',(f*100).toFixed(0)+'%')});
  }
  function onScroll(){
    var r=as.getBoundingClientRect(),R=r.height-innerHeight;
    var p=R>0?clamp(-r.top/R,0,1):0;set(p*6);
  }

  if(reduce){
    items.forEach(function(it){if(it.k==='d')it.e.style.strokeDashoffset=0;else it.e.style.opacity=1});
    dimTx.forEach(function(t){t.style.opacity=1});
  }else{
    /* one orchestrated load moment: ground and dimensions draw in */
    var t0=null;
    (function intro(ts){
      if(!t0)t0=ts;var p=clamp((ts-t0)/1500,0,1),e=1-Math.pow(1-p,3);
      items.forEach(function(it){if(it.s===0)it.e.style.strokeDashoffset=(1-e).toFixed(3)});
      dimTx.forEach(function(t){t.style.opacity=clamp((p-.55)/.45,0,1)});
      if(p<1)requestAnimationFrame(intro);
    })(performance.now());
    var tick=false;
    addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(function(){onScroll();tick=false})}},{passive:true});
    addEventListener('resize',onScroll);
    set(0);onScroll();
  }
  rail.forEach(function(b,i){b.addEventListener('click',function(){
    var r=as.getBoundingClientRect(),R=r.height-innerHeight,top=scrollY+r.top;
    scrollTo({top:top+(i/6)*R+2,behavior:reduce?'auto':'smooth'});
  })});

  /* Rate bars appear when seen */
  var rates=$('.ln-rates');
  if(rates){if('IntersectionObserver' in window){new IntersectionObserver(function(es,o){es.forEach(function(e){if(e.isIntersecting){rates.classList.add('in');o.disconnect()}})},{threshold:.3}).observe(rates)}else rates.classList.add('in')}

  /* Estimator (same rates as the quote page) */
  var L=$('#e-len'),W=$('#e-wid'),T=$('#e-type');
  if(L){
    var RT={tin:[150,220],ind:[200,300],wh:[240,340],peb:[250,450]},G=1.18;
    var fm=function(v){return v>=1e7?(v/1e7).toFixed(2)+' Cr':(v/1e5).toFixed(1)+' L'};
    var go=function(){var l=+L.value,w=+W.value,r=RT[T.value],a=l*w;
      $('#e-len-o').textContent=l+' ft';$('#e-wid-o').textContent=w+' ft';
      $('#e-price').textContent='₹'+fm(a*r[0]*G)+' to '+fm(a*r[1]*G);
      $('#e-area').textContent=a.toLocaleString('en-IN')+' sq.ft, including 18% GST'};
    [L,W,T].forEach(function(e){e.addEventListener('input',go);e.addEventListener('change',go)});go();
  }
})();
