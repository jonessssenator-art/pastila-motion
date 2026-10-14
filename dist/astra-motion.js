/* Web adaptations of Astra's ScrollZoomReveal and MagneticButton.
   Catalogue source and provenance are retained in ../astra-source/. */
window.AstraMotion = (() => {
  const clamp = v => Math.max(0, Math.min(1, v));
  function zoomReveal(root, frame, heading, caption, reduced) {
    const stage = root.querySelector('.texture-stage');
    return () => {
      const box = root.getBoundingClientRect();
      const p = (typeof reduced === "function" ? reduced() : reduced) ? 1 : clamp(-box.top / Math.max(1, root.offsetHeight - stage.offsetHeight));
      // Astra maps the scroll range to full expansion at 85%.
      const t = clamp(p / .85), w = stage.clientWidth, h = stage.clientHeight;
      const mobile = w <= 600, startW = w * (mobile ? .42 : .18), startH = w * (mobile ? .45 : .24);
      frame.style.width = `${startW + (w - startW) * t}px`;
      frame.style.height = `${startH + (h - startH) * t}px`;
      frame.style.borderRadius = `${45 * (1-t)}% ${45 * (1-t)}% 0 0`;
      heading.style.opacity = 1 - clamp(t / .4);
      frame.querySelector('img').style.transform = `scale(${1.1 + t*.18})`;
      caption.style.opacity = clamp((t-.65)/.3);
      stage.style.setProperty("--caption-opacity", clamp((t-.65)/.3));
      caption.style.transform = `translateY(${(1-clamp((t-.65)/.3))*25}px)`;
      caption.inert = t < .7;
    };
  }
  function magnetic(el, reduced) {
    if (!matchMedia('(pointer:fine)').matches) return;
    const isReduced=()=>typeof reduced==='function'?reduced():reduced;
    let x=0,y=0,vx=0,vy=0,tx=0,ty=0,id=0,last=0;
    const content=el.querySelector('span');
    let stiffness=240,damping=16,mass=.6;
    function tick(time) {
      if(isReduced()){id=0;x=y=vx=vy=tx=ty=0;el.style.transform='';if(content)content.style.transform='';return;}
      const dt=Math.min((time-last)/1000 || 1/60,1/30);last=time;
      vx+=((tx-x)*stiffness-vx*damping)/mass*dt;
      vy+=((ty-y)*stiffness-vy*damping)/mass*dt;
      x+=vx*dt;y+=vy*dt;
      el.style.transform=`translate(${x}px,${y}px)`;
      if(content)content.style.transform=`translate(${x*.18/.35}px,${y*.18/.35}px)`;
      if(Math.abs(tx-x)+Math.abs(ty-y)+Math.abs(vx)+Math.abs(vy)>.05)id=requestAnimationFrame(tick);
      else{id=0;el.style.transform='';if(content)content.style.transform='';}
    }
    const start=()=>{if(!id){last=0;id=requestAnimationFrame(tick)}};
    el.addEventListener('pointermove',e=>{
      if(isReduced()||e.pointerType==='touch')return;
      const r=el.getBoundingClientRect();
      tx=(e.clientX-r.left-r.width/2)*.35;ty=(e.clientY-r.top-r.height/2)*.35;
      stiffness=240;damping=16;mass=.6;start();
    });
    el.addEventListener('pointerleave',()=>{tx=ty=0;stiffness=180;damping=9;mass=.7;start()});
  }
  return {zoomReveal,magnetic};
})();
