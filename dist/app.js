(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const opening=$('.opening'), stage=$('.stage'), product=$('.product-stage');
  let slices=[], layerData=[], px=0,py=0,tx=0,ty=0,raf=0;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), ease=t=>t*t*(3-2*t);
  const lerp=(a,b,t)=>a+(b-a)*t;
  const mix=(a,b,t)=>`rgb(${a.map((v,i)=>Math.round(lerp(v,b[i],t))).join(',')})`;
  fetch('assets/layers.json').then(r=>{if(!r.ok)throw Error('Layer data unavailable');return r.json()}).then(data=>{
    layerData=data;
    data.forEach((d,i)=>{const img=new Image();img.src='assets/layers.png';img.alt='';img.className='slice';img.style.clipPath=d.clip;img.style.zIndex=String(8-i);$('.layers').append(img);slices.push(img)});
    schedule();
  }).catch(()=>{const im=new Image();im.src='assets/classic-direction.png';im.alt='Белёвская пастила';im.style.width='80%';im.style.margin='45% auto 0';$('.layers').append(im)});
  function schedule(){if(!raf)raf=requestAnimationFrame(render)}
  function render(){
    raf=0;
    const r=opening.getBoundingClientRect(),vh=innerHeight;
    const progress=reduced?0:clamp(-r.top/(opening.offsetHeight-vh));
    const expand=ease(clamp((progress-.15)/.55));
    const dark=ease(clamp((progress-.12)/.48));
    stage.style.backgroundColor=mix([232,229,214],[37,49,35],dark);
    const type=$('.hero-type');type.style.transform=`translateY(${-progress*150}px) scale(${1+progress*.12})`;type.style.opacity=1-clamp(progress*3.5);
    $('.opening-caption').style.opacity=1-clamp(progress*4);
    const inside=$('.inside-title');inside.style.opacity=ease(clamp((progress-.32)*4));inside.style.transform=`translateY(${(1-expand)*65}px)`;
    $$('.layer-note').forEach((el,i)=>{el.style.opacity=ease(clamp((progress-.48-i*.08)*4));el.style.transform=`translateY(${(1-expand)*35}px)`});
    $('.round-cta').style.opacity=1-clamp(progress*3);
    $('.round-cta').style.pointerEvents=progress>.3?'none':'auto';
    $('.round-cta').tabIndex=progress>.3?-1:0;
    const scale=product.clientWidth/1024;
    px=lerp(px,tx,.07);py=lerp(py,ty,.07);
    $('.product-tilt').style.transform=reduced?'none':`perspective(1300px) rotateY(${px*5}deg) rotateX(${-py*3}deg) scale(${1-expand*.28})`;
    const assembled=[605,678,744,818,891];
    const exploded=[355,555,795,1010,1215];
    slices.forEach((im,i)=>{
      const target=lerp(assembled[i],exploded[i],expand);
      const dy=(target-layerData[i].center)*scale;
      const dx=(i%2?32:-13)*expand+(px*(i+1)*1.5);
      const rotation=([-4,3,-2,4,-3][i])*expand;
      im.style.transform=`translate3d(${dx}px,${dy}px,0) rotate(${rotation}deg)`;
    });
    const shadow=$('.product-shadow');shadow.style.opacity=1-expand*.65;shadow.style.transform=`scale(${1-expand*.25})`;
    $$('.detail-card').forEach((el,i)=>{
      if(reduced)return;
      const rect=el.getBoundingClientRect();
      const next=el.nextElementSibling;
      let p=0;if(next&&next.classList.contains('detail-card'))p=clamp((innerHeight-next.getBoundingClientRect().top)/innerHeight);
      el.style.transform=`scale(${1-p*.055}) rotate(${p*(i%2?2:-2)}deg)`;
      const image=el.querySelector('img');image.style.transform=`scale(1.1) translateY(${clamp((innerHeight/2-rect.top)/innerHeight,-1,1)*-16}px)`;
    });
    if(!reduced&&r.bottom>0&&r.top<vh&&(Math.abs(px-tx)>.002||Math.abs(py-ty)>.002))schedule();
  }
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
  stage.addEventListener('pointermove',e=>{if(reduced||e.pointerType==='touch')return;tx=e.clientX/innerWidth*2-1;ty=e.clientY/innerHeight*2-1;schedule()});
  stage.addEventListener('pointerleave',()=>{tx=ty=0;schedule()});
  const flavours=[
    {title:'Классическая',html:'Яблочная<br><em>классика.</em>',bg:'#d9dda9',ink:'#283a28',image:'assets/classic-direction.png',text:'Яблоко в главной роли.<br>С неё начинается знакомство с пастилой.'},
    {title:'Чёрная смородина',html:'Чёрная<br><em>смородина.</em>',bg:'#582532',ink:'#f3ded0',image:'assets/berry-direction.png',text:'Яблочная основа. Ягодный характер.<br>Для тех, кто любит с кислинкой.'},
    {title:'С вишней',html:'Спелая<br><em>вишня.</em>',bg:'#983e34',ink:'#fff0d5',image:'assets/berry-direction.png',text:'Ещё одна ягодная история.<br>Найдите свой любимый вкус.'}
  ];
  let active=1,animating=false;
  function select(index){
    if(animating||index===active)return;
    active=(index+flavours.length)%flavours.length;const f=flavours[active];
    $('.flavours').style.backgroundColor=f.bg;$('.flavours').style.color=f.ink;
    const info=$('.flavour-info'),photo=$('#flavour-image');
    const update=()=>{$('#flavour-title').innerHTML=f.html;$('#flavour-description').innerHTML=f.text;photo.src=f.image;photo.alt='Концептуальная фотография: '+f.title;photo.style.objectPosition=active===2?'65% 50%':'50% 50%';photo.style.filter=active===2?'hue-rotate(-8deg)':'none';};
    if(reduced)update();else{
      animating=true;
      const out=info.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-20px)'}],{duration:180,easing:'ease-in'});
      out.finished.then(()=>{update();info.animate([{opacity:0,transform:'translateY(28px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,easing:'cubic-bezier(.2,.7,.2,1)'});photo.animate([{clipPath:'inset(0 100% 0 0)',transform:'scale(1.13)'},{clipPath:'inset(0)',transform:'scale(1.045)'}],{duration:680,easing:'cubic-bezier(.2,.7,.2,1)'});animating=false}).catch(()=>{update();animating=false});
    }
    $$('[data-flavour]').forEach((b,i)=>{b.classList.toggle('active',i===active);b.setAttribute('aria-pressed',String(i===active))});
  }
  $$('[data-flavour]').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===active));b.addEventListener('click',()=>select(i))});
  $('.flavour-prev').onclick=()=>select(active-1);$('.flavour-next').onclick=()=>select(active+1);
  $('.flavour-controls').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();select(active+1)}if(e.key==='ArrowLeft'){e.preventDefault();select(active-1)}});
  let swipeX=null;
  $('.flavour-photo').addEventListener('pointerdown',e=>{swipeX=e.clientX});
  $('.flavour-photo').addEventListener('pointerup',e=>{if(swipeX!==null&&Math.abs(e.clientX-swipeX)>45)select(active+(e.clientX<swipeX?1:-1));swipeX=null});
  const dialog=$('.product-dialog'),nav=$('.nav-dialog');let previousFocus=null;
  function openDialog(el){previousFocus=document.activeElement;el.showModal();document.body.style.overflow='hidden'}
  function closeDialog(el){el.close();document.body.style.overflow='';previousFocus?.focus()}
  $$('[data-product]').forEach(b=>b.addEventListener('click',()=>{const f=flavours[active];$('#dialog-image').src=f.image;$('#dialog-title').textContent=f.title;openDialog(dialog)}));
  $('.dialog-close').onclick=()=>closeDialog(dialog);$('.menu-trigger').onclick=()=>openDialog(nav);$('.nav-close').onclick=()=>closeDialog(nav);
  $$('.nav-dialog a').forEach(a=>a.addEventListener('click',()=>closeDialog(nav)));
  [dialog,nav].forEach(el=>{el.addEventListener('cancel',()=>{document.body.style.overflow=''});el.addEventListener('click',e=>{if(e.target===el){const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(el)}})});
  let drawerY=null;
  dialog.addEventListener('pointerdown',e=>{if(e.clientY-dialog.getBoundingClientRect().top<55)drawerY=e.clientY});
  dialog.addEventListener('pointerup',e=>{if(drawerY!==null&&e.clientY-drawerY>80)closeDialog(dialog);drawerY=null});
  if(!reduced&&matchMedia('(pointer:fine)').matches)$$('.magnetic').forEach(el=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.09}px,${(e.clientY-r.top-r.height/2)*.09}px)`});el.addEventListener('pointerleave',()=>{el.style.transition='transform .35s';el.style.transform='';setTimeout(()=>el.style.transition='',400)})});
  schedule();
})();
