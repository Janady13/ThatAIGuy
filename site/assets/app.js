(function(){
  // capture UTM on first visit
  try {
    const u = new URL(window.location.href);
    const utm = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].reduce((o,k)=>{ if(u.searchParams.get(k)) o[k]=u.searchParams.get(k); return o; },{});
    if(Object.keys(utm).length && !sessionStorage.getItem('utm_applied')){
      fetch('https://api.thataiguy.org/mkt/event?type=utm', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({utm, href: location.href, ref: document.referrer})});
      sessionStorage.setItem('utm_applied','1');
    }
  } catch(e){}
  // global handler for donate clicks
  function wire(el){
    el.addEventListener('click', function(e){
      if(el.matches('.btn, #donate_fab')){
        fetch('https://api.thataiguy.org/mkt/event?type=donate_click', {method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({href: location.href, ref: document.referrer})});
      }
    });
  }
  document.querySelectorAll('.btn,#donate_fab').forEach(wire);
  // wire dynamically inserted elements
  document.addEventListener('htmx:afterSettle', ()=> {
    document.querySelectorAll('.btn,#donate_fab').forEach(btn=>{
      if(!btn.dataset._wired){ wire(btn); btn.dataset._wired='1'; }
    })
  });
})();
