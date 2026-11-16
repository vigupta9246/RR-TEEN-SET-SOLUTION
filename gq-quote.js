(function(){
  var svg=document.getElementById('gq-svg'); if(!svg)return;
  var L=document.getElementById('f-len'),W=document.getElementById('f-wid'),H=document.getElementById('f-hgt'),
      area=document.getElementById('f-area'),svc=document.getElementById('f-service'),form=document.getElementById('enquiry-form');
  var RATES={tin:[150,220],ind:[200,300],wh:[240,340],peb:[250,450]},GST=.18,kind='tin',NS='http://www.w3.org/2000/svg';
  function inr(n){return '₹'+Math.round(n).toLocaleString('en-IN');}
  function num(el,min,max,def){var v=parseFloat(el.value);if(!v||v<min)v=v>0?min:def;return Math.min(v,max);}
  function e(t,a,txt){var n=document.createElementNS(NS,t);for(var k in a)n.setAttribute(k,a[k]);if(txt!=null)n.textContent=txt;return n;}
  var FS=function(){return (svg.getBoundingClientRect().width||640)<520?24:14;};var INK='#1f2933',DIM='#c92a2a',GAL='#9aa5b1';
  function tick(g,x,y){g.appendChild(e('line',{x1:x-5,y1:y+5,x2:x+5,y2:y-5,stroke:DIM,'stroke-width':1.6}));}
  function draw(l,w,h){
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    var rise=kind==='tin'?w*.1:Math.min(w*.14,h*.9), Ht=h+rise;
    var s=Math.min(500/w,190/Ht), gy=296, ox=(640-w*s)/2+14, W_=w*s, hs=h*s;
    var g=e('g',{fill:'none',stroke:INK,'stroke-width':2,'stroke-linejoin':'round'}); svg.appendChild(g);
    // ground
    g.appendChild(e('line',{x1:ox-60,y1:gy,x2:ox+W_+60,y2:gy,'stroke-width':2.5}));
    for(var i=ox-60;i<ox+W_+60;i+=12)g.appendChild(e('line',{x1:i,y1:gy,x2:i-8,y2:gy+9,stroke:GAL,'stroke-width':1.2}));
    var yl=gy-hs, yr=kind==='tin'?gy-(h+rise)*s:yl, yr_=yr, ridge=gy-Ht*s;
    // intermediate columns
    var cols=[0,1];
    if(kind!=='peb'&&w>=40){var n=Math.min(3,Math.floor(w/28));for(var j=1;j<=n;j++)cols.push(j/(n+1));}
    cols.sort();
    cols.forEach(function(f){
      var x=ox+f*W_, top=kind==='tin'?yl+(yr-yl)*f:(f<=.5?yl+(ridge-yl)*(f/.5):ridge+(yl-ridge)*((f-.5)/.5));
      if(kind==='peb'&&(f===0||f===1)){
        g.appendChild(e('polygon',{points:[x-5,gy,x+5,gy,x+(f?7:7),top,x-7,top].join(' '),fill:'#d9dee3'}));
      } else g.appendChild(e('line',{x1:x,y1:gy,x2:x,y2:top,'stroke-width':kind==='tin'?3:3.5}));
    });
    // roof
    var pts=kind==='tin'?[[ox-8,yl+3],[ox+W_+8,yr-1]]:[[ox-8,yl+4],[ox+W_/2,ridge],[ox+W_+8,yl+4]];
    var d='M'+pts.map(function(p){return p[0]+' '+p[1];}).join(' L');
    g.appendChild(e('path',{d:d,'stroke-width':4}));
    var d2='M'+pts.map(function(p){return p[0]+' '+(p[1]+5);}).join(' L');
    g.appendChild(e('path',{d:d2,'stroke-width':1,stroke:GAL}));
    // corrugation ticks on roof
    for(var k=0;k<=24;k++){
      var f=k/24,px,py;
      if(kind==='tin'){px=pts[0][0]+(pts[1][0]-pts[0][0])*f;py=pts[0][1]+(pts[1][1]-pts[0][1])*f;}
      else{ if(f<=.5){var t=f/.5;px=pts[0][0]+(pts[1][0]-pts[0][0])*t;py=pts[0][1]+(pts[1][1]-pts[0][1])*t;}
            else{var t2=(f-.5)/.5;px=pts[1][0]+(pts[2][0]-pts[1][0])*t2;py=pts[1][1]+(pts[2][1]-pts[1][1])*t2;} }
      g.appendChild(e('line',{x1:px,y1:py-4,x2:px,y2:py,stroke:INK,'stroke-width':1}));
    }
    // framing under roof
    if(kind==='ind'||kind==='wh'){
      var ya=yl+4; g.appendChild(e('line',{x1:ox,y1:ya+14,x2:ox+W_,y2:ya+14,'stroke-width':1.5}));
      var seg=Math.max(4,Math.round(w/7)*2);
      var zz='M'+ox+' '+(ya+14);
      for(var q=1;q<=seg;q++){var fx=q/seg,x=ox+fx*W_;var topy=ya+(ridge-ya)*(1-Math.abs(fx*2-1))*1;zz+=' L'+x+' '+((q%2)?(ya+14-(ya+14-(ridge+8))*(1-Math.abs(fx*2-1))):(ya+14));}
      g.appendChild(e('path',{d:zz,'stroke-width':1,stroke:'#52606d'}));
    }
    if(kind==='peb'){ [[ox,yl],[ox+W_,yl]].forEach(function(p,ix){
        g.appendChild(e('polygon',{points:[p[0],p[1]+4,p[0]+(ix?-1:1)*W_*.14,ridge+ (yl-ridge)*.72,p[0],Math.min(p[1]+30,gy)].join(' '),fill:'#d9dee3','stroke-width':1.5}));});
    }
    if(kind==='wh'){var dw=Math.min(W_*.3,70);g.appendChild(e('rect',{x:ox+W_/2-dw/2,y:gy-Math.min(hs*.75,60),width:dw,height:Math.min(hs*.75,60),fill:'#fff','stroke-width':1.5}));
      for(var r=1;r<6;r++)g.appendChild(e('line',{x1:ox+W_/2-dw/2,y1:gy-Math.min(hs*.75,60)+r*Math.min(hs*.75,60)/6,x2:ox+W_/2+dw/2,y2:gy-Math.min(hs*.75,60)+r*Math.min(hs*.75,60)/6,stroke:GAL,'stroke-width':1}));}
    // dimensions
    var dg=e('g',{stroke:DIM,'stroke-width':1.3,fill:DIM,'font-family':'IBM Plex Mono, monospace','font-size':FS(),'font-weight':600}); svg.appendChild(dg);
    var by=gy+30;
    dg.appendChild(e('line',{x1:ox,y1:by,x2:ox+W_,y2:by})); dg.appendChild(e('line',{x1:ox,y1:gy+6,x2:ox,y2:by+8})); dg.appendChild(e('line',{x1:ox+W_,y1:gy+6,x2:ox+W_,y2:by+8}));
    tick(dg,ox,by);tick(dg,ox+W_,by);
    var tw=e('text',{x:ox+W_/2,y:by-6,'text-anchor':'middle',stroke:'none'},Math.round(w)+' ft width'); dg.appendChild(tw);
    var hx=ox-34;
    dg.appendChild(e('line',{x1:hx,y1:gy,x2:hx,y2:yl})); dg.appendChild(e('line',{x1:hx-8,y1:gy,x2:ox-4,y2:gy})); dg.appendChild(e('line',{x1:hx-8,y1:yl,x2:ox-4,y2:yl}));
    tick(dg,hx,gy);tick(dg,hx,yl);
    var th=e('text',{x:hx-7,y:(gy+yl)/2,'text-anchor':'middle',stroke:'none',transform:'rotate(-90 '+(hx-7)+' '+((gy+yl)/2)+')'},(hs<90?Math.round(h)+' ft':Math.round(h)+' ft eave')); dg.appendChild(th);
    // plan inset
    var pw=Math.min(150,70*l/w), ph=pw*w/l; if(ph>70){ph=70;pw=ph*l/w;}
    var px0=16,py0=18;
    var pg=e('g',{stroke:INK,fill:'none','stroke-width':1.6}); svg.appendChild(pg);
    pg.appendChild(e('rect',{x:px0,y:py0,width:pw,height:ph,fill:'#fff'}));
    var nc=Math.max(2,Math.min(8,Math.round(l/20)+1));
    for(var a=0;a<nc;a++){var cx=px0+a*pw/(nc-1);[py0,py0+ph].forEach(function(cy){pg.appendChild(e('rect',{x:cx-2.5,y:cy-2.5,width:5,height:5,fill:INK}));});}
    var pd=e('g',{fill:DIM,'font-family':'IBM Plex Mono, monospace','font-size':FS()*.85,'font-weight':600}); svg.appendChild(pd);
    pd.appendChild(e('text',{x:px0,y:py0+ph+FS()*1.1},'Plan  '+Math.round(l)+' × '+Math.round(w)+' ft'));
  }
  function note(L,W,H){var el=document.getElementById('gq-clamp');if(!el)return;var o=[];[[L,'length',500],[W,'width',150],[H,'height',45]].forEach(function(x){if(parseFloat(x[0].value)>x[2])o.push(x[1]+' (max '+x[2]+' ft)');});el.textContent=o.length?'Online estimate covers up to 500 \u00d7 150 \u00d7 45 ft. For a larger '+o.join(' and ')+', call us on +91 85272 58462.':'';}
  var lead=null;
  var names={tin:'Tin shed',ind:'Industrial shed',wh:'Prefab warehouse',peb:'PEB structure'};
  function upd(){
    var l=num(L,10,500,40),w=num(W,10,150,30),h=num(H,8,45,12),a=l*w,LO=RATES[kind][0],HI=RATES[kind][1];
    note(L,W,H);
    area.value=Math.round(a);
    document.getElementById('t-type').textContent=names[kind];
    document.getElementById('t-size').textContent=Math.round(l)+' × '+Math.round(w)+' × '+Math.round(h)+' ft';
    document.getElementById('t-area').textContent=Math.round(a).toLocaleString('en-IN')+' sq.ft';
    document.getElementById('q-l1').textContent=Math.round(a).toLocaleString('en-IN')+' sq.ft × ₹'+LO+'–'+HI+' + 18% GST';
    document.getElementById('q-tot').textContent=inr(a*LO*(1+GST))+' – '+inr(a*HI*(1+GST));
    var bt=document.getElementById('bar-tot'); if(bt)bt.textContent=inr(a*LO*(1+GST))+' \u2013 '+inr(a*HI*(1+GST));
    draw(l,w,h);
  }
  [L,W,H].forEach(function(el){el.addEventListener('input',upd);el.addEventListener('blur',function(){el.value=num(el,+el.min,+el.max,+el.defaultValue);upd();});});
  [].forEach.call(document.querySelectorAll('.gq3-step button'),function(b){b.addEventListener('click',function(){var t=document.getElementById(b.dataset.t);t.value=Math.min(+t.max,Math.max(+t.min,(parseFloat(t.value)||+t.defaultValue)+(+b.dataset.s)));upd();});});
  [].forEach.call(document.querySelectorAll('.gq3-presets button'),function(b){b.addEventListener('click',function(){L.value=b.dataset.l;W.value=b.dataset.w;upd();});});
  [].forEach.call(document.querySelectorAll('.gq3-type input'),function(r){r.addEventListener('change',function(){
    [].forEach.call(document.querySelectorAll('.gq3-type label'),function(x){x.classList.remove('on');});
    r.parentNode.classList.add('on');svc.value=r.value;kind=r.dataset.k;upd();});});
  // add the drawn dimensions to the message for this submit only; the customer's own text is restored right after
  form.addEventListener('submit',function(){
    var m=form.querySelector('[name="message"]'); if(!m)return;
    var orig=m.value;
    lead={name:(form.querySelector('[name="name"]').value||'').trim(),svc:svc.value,l:Math.round(num(L,10,500,40)),w:Math.round(num(W,10,150,30)),h:Math.round(num(H,8,45,12)),city:(form.querySelector('[name="city"]').value||'').trim()};
    var tag='Size: '+Math.round(num(L,10,500,40))+' x '+Math.round(num(W,10,150,30))+' x '+Math.round(num(H,8,45,12))+' ft (L x W x eave height)';
    m.value=tag+(orig.trim()?'\n'+orig.trim():'');
    setTimeout(function(){m.value=orig;},0);
  });
  var lastNarrow=null,rq=0;window.addEventListener('resize',function(){var n=(svg.getBoundingClientRect().width||640)<520;if(n===lastNarrow)return;lastNarrow=n;cancelAnimationFrame(rq);rq=requestAnimationFrame(upd);});
  var bar=document.getElementById('gq-bar'),ok=document.getElementById('form-success'),er=document.getElementById('form-error');
  function watch(el,fn){if(!el||!window.MutationObserver)return;new MutationObserver(fn).observe(el,{attributes:true,attributeFilter:['style']});}
  watch(ok,function(){if(ok.style.display!=='none'){if(bar)bar.style.display='none';ok.setAttribute('tabindex','-1');ok.focus({preventScroll:true});openWa();}});
  function openWa(){
    var d=document.getElementById('gq-wa');if(!d||!lead||typeof d.showModal!=='function'||d.open)return;
    var t='Hello R.R Teen Set Solution, I just sent an enquiry on your website.\n'+(lead.name?'Name: '+lead.name+'\n':'')+'Structure: '+lead.svc+'\nSize: '+lead.l+' x '+lead.w+' x '+lead.h+' ft (L x W x eave height)\n'+(lead.city?'City: '+lead.city+'\n':'')+'I will send photos of the site here.';
    document.getElementById('gq-wa-prev').textContent=t;
    document.getElementById('gq-wa-go').href='https://api.whatsapp.com/send?phone=918527258462&text='+encodeURIComponent(t);
    try{d.showModal();}catch(e){}
  }
  (function(){var d=document.getElementById('gq-wa');if(!d)return;
    d.addEventListener('click',function(e){if(e.target===d)d.close();});
    document.getElementById('gq-wa-go').addEventListener('click',function(){setTimeout(function(){d.close();},300);});})();
  watch(er,function(){if(er.style.display!=='none'&&er.scrollIntoView)er.scrollIntoView({behavior:'smooth',block:'center'});});
  // the bar is only useful while the form's own submit button is off screen; hide it while typing or when the button is visible,
  // and never re-show it in the middle of a tap on the button
  if(bar){
    var typing=false,btnVisible=false,t=0;
    function sync(){bar.classList.toggle('away',typing||btnVisible);}
    form.addEventListener('focusin',function(e){var x=e.target;if(x.tagName==='TEXTAREA'||(x.tagName==='INPUT'&&/^(text|tel|number)$/.test(x.type))){typing=true;sync();}});
    form.addEventListener('focusout',function(){clearTimeout(t);t=setTimeout(function(){if(!form.contains(document.activeElement)||!/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)){typing=false;sync();}},400);});
    if(window.IntersectionObserver){new IntersectionObserver(function(en){btnVisible=en[0].isIntersecting;sync();},{threshold:.6}).observe(document.getElementById('submit-btn'));}
  }
  // restore state if the browser restored a checked radio (back navigation, reload)
  var chk=document.querySelector('.gq3-type input:checked');
  if(chk){kind=chk.dataset.k;svc.value=chk.value;[].forEach.call(document.querySelectorAll('.gq3-type label'),function(x){x.classList.toggle('on',x.contains(chk));});}
  upd();
})();
