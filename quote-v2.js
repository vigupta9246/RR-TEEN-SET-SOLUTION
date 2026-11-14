(function(){
  var d=document.getElementById('q-date');
  if(d) d.textContent=new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});
  var a=document.getElementById('f-area'),box=document.getElementById('q-est');
  if(!a||!box)return;
  var LO=150,HI=220,GST=.18;
  function inr(n){return '₹'+Math.round(n).toLocaleString('en-IN');}
  function upd(){
    var n=parseFloat(a.value);
    if(!n||n<50){box.hidden=true;return;}
    var b1=n*LO,b2=n*HI;
    function r(a,b){return inr(a)+' \u2013 '+inr(b);}
    document.getElementById('q-l1').textContent=n.toLocaleString('en-IN')+' sq.ft \u00d7 \u20b9150\u2013220';
    document.getElementById('q-base').textContent=r(b1,b2);
    document.getElementById('q-gst').textContent=r(b1*GST,b2*GST);
    document.getElementById('q-tot').textContent=r(b1*(1+GST),b2*(1+GST));
    box.hidden=false;
  }
  a.addEventListener('input',upd);
})();
