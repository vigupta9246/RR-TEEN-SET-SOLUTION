(function(){
var rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;e.target.classList.add('in');
 e.target.querySelectorAll('[data-n]').forEach(count);io.unobserve(e.target)})},{threshold:.15});
document.querySelectorAll('.pm-rv,.pm-stats').forEach(function(el){io.observe(el)});
function count(el){var t=parseFloat(el.dataset.n),d=el.dataset.d|0,t0=null;if(rm){el.textContent=t.toFixed(d);return}
 (function f(ts){if(!t0)t0=ts;var p=Math.min((ts-t0)/1400,1),e=1-Math.pow(1-p,3);el.textContent=(t*e).toFixed(d);if(p<1)requestAnimationFrame(f)})(performance.now())}
var lb=document.getElementById('pm-lb'),lbi=lb&&lb.querySelector('img');
document.querySelectorAll('.pm-bento figure').forEach(function(f){f.addEventListener('click',function(){var im=f.querySelector('img');lbi.src=im.dataset.full||im.src;lbi.alt=im.alt;lb.classList.add('on')})});
if(lb){lb.addEventListener('click',function(){lb.classList.remove('on')});addEventListener('keydown',function(e){if(e.key==='Escape')lb.classList.remove('on')})}
})();
