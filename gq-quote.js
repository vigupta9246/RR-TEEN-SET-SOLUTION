(function(){
  var area=document.getElementById('f-area'),rng=document.getElementById('f-range'),svc=document.getElementById('f-service');
  if(!area)return;
  var LO=150,HI=220,GST=.18;
  function inr(n){return '₹'+Math.round(n).toLocaleString('en-IN');}
  function upd(){
    var n=parseFloat(area.value);
    var box=document.getElementById('q-est');
    if(!n||n<50){box.classList.add('off');return;}
    box.classList.remove('off');
    document.getElementById('q-l1').textContent=n.toLocaleString('en-IN')+' sq.ft × ₹150–220';
    document.getElementById('q-tot').textContent=inr(n*LO*(1+GST))+' – '+inr(n*HI*(1+GST));
    rng.value=Math.min(Math.max(n,rng.min),rng.max);
    var pct=(rng.value-rng.min)/(rng.max-rng.min)*100;
    rng.style.setProperty('--p',pct+'%');
    [].forEach.call(document.querySelectorAll('.gq2-chips button'),function(b){b.classList.toggle('on',+b.dataset.a===n);});
  }
  area.addEventListener('input',upd);
  rng.addEventListener('input',function(){area.value=rng.value;upd();});
  [].forEach.call(document.querySelectorAll('.gq2-chips button'),function(b){b.addEventListener('click',function(){area.value=b.dataset.a;upd();});});
  [].forEach.call(document.querySelectorAll('.gq2-tiles button'),function(b){b.addEventListener('click',function(){
    [].forEach.call(document.querySelectorAll('.gq2-tiles button'),function(x){x.classList.remove('on');x.setAttribute('aria-checked','false');});
    b.classList.add('on');b.setAttribute('aria-checked','true');svc.value=b.dataset.v;
  });});
  upd();
})();
