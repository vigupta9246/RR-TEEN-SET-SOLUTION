(function(){
var rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
// statement: words light up with scroll
var st=document.querySelector('.cn-state p');
if(st){var words=st.textContent.trim().split(/\s+/);st.innerHTML=words.map(function(w){return '<span class="w">'+w+'</span>'}).join(' ');
 var ws=st.querySelectorAll('.w');
 function sp(){var r=st.getBoundingClientRect(),h=innerHeight;var p=(h*0.85-r.top)/(r.height+h*0.35);p=Math.max(0,Math.min(1,p));var n=Math.round(p*ws.length);ws.forEach(function(el,i){el.classList.toggle('on',rm||i<n)})}
 addEventListener('scroll',sp,{passive:true});addEventListener('resize',sp);sp();}
// reveal + count up
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;e.target.classList.add('in');
 e.target.querySelectorAll('[data-n]').forEach(count);io.unobserve(e.target)})},{threshold:.18});
document.querySelectorAll('.cn-rv').forEach(function(el){io.observe(el)});
function count(el){var t=parseFloat(el.dataset.n),d=el.dataset.d|0,s=el.dataset.s||'',t0=null;
 if(rm){el.textContent=t.toFixed(d)+s;return}
 (function f(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/1500,1),e=1-Math.pow(1-p,3);el.textContent=(t*e).toFixed(d)+s;if(p<1)requestAnimationFrame(f)})(performance.now())}
// card tilt (desktop pointer only)
if(matchMedia('(hover:hover)').matches&&!rm)document.querySelectorAll('.cn-card').forEach(function(c){
 c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;c.style.transform='perspective(900px) rotateY('+x*8+'deg) rotateX('+(-y*8)+'deg)'});
 c.addEventListener('pointerleave',function(){c.style.transform=''})});
// estimator
var RT={tin:[150,220],ind:[200,300],wh:[240,340],peb:[250,450]};
var a=document.getElementById('cn-area'),t=document.getElementById('cn-type'),o=document.getElementById('cn-out'),av=document.getElementById('cn-av'),wa=document.getElementById('cn-wa');
function inr(n){return '₹'+Math.round(n).toLocaleString('en-IN')}
function est(){var A=+a.value,r=RT[t.value],lo=A*r[0]*1.18,hi=A*r[1]*1.18;av.textContent=A.toLocaleString('en-IN')+' sq.ft';
 o.innerHTML='<small>Ballpark with 18% GST</small><strong>'+inr(lo)+' to '+inr(hi)+'</strong><small>Final price after a free site visit and written quote.</small>';
 wa.href='https://wa.me/918527258462?text='+encodeURIComponent('Hi, I need a '+t.options[t.selectedIndex].text+' of about '+A+' sq.ft in Delhi NCR. Please share a quote.')}
if(a){a.addEventListener('input',est);t.addEventListener('change',est);est()}
})();
