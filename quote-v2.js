(function(){
  var d=document.getElementById('q-date');
  if(d) d.textContent=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  var a=document.getElementById('f-area'),box=document.getElementById('q-est');
  if(!a||!box)return;
  var RATE=180,GST=.18;
  function inr(n){return '₹'+Math.round(n).toLocaleString('en-IN');}
  function upd(){
    var n=parseFloat(a.value);
    if(!n||n<50){box.hidden=true;return;}
    var base=n*RATE,g=base*GST;
    document.getElementById('q-l1').textContent=n.toLocaleString('en-IN')+' sq.ft × ₹180';
    document.getElementById('q-base').textContent=inr(base);
    document.getElementById('q-gst').textContent=inr(g);
    document.getElementById('q-tot').textContent=inr(base+g);
    box.hidden=false;
  }
  a.addEventListener('input',upd);
})();
