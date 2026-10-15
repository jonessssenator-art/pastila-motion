(() => {
'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const motionQuery=matchMedia('(prefers-reduced-motion:reduce)');
let reduced=motionQuery.matches;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)), smooth=t=>t*t*(3-2*t), lerp=(a,b,t)=>a+(b-a)*t;
const opening=$('.opening'),stage=$('.stage'),product=$('.product-stage');
const hero=$('.hero-copy'),inside=$('.inside-copy'),bottom=$('.opening-bottom'),notes=$$('.layer-note');
let slices=[],data=[],frame=0,px=0,py=0,tx=0,ty=0;
const zoom=AstraMotion.zoomReveal($('.texture'),$('.texture-frame'),$('.texture-heading'),$('.texture-caption'),()=>reduced);
function schedule(){if(!frame)frame=requestAnimationFrame(render)}
function render(){
 frame=0;
 const r=opening.getBoundingClientRect(), p=reduced?0:clamp(-r.top/Math.max(1,opening.offsetHeight-stage.offsetHeight));
 const expand=smooth(clamp((p-.18)/.58)),fade=clamp(p/.25);
 hero.style.opacity=1-fade;hero.style.transform=`translateY(${-fade*45}px)`;hero.inert=fade>.92;
 bottom.style.opacity=1-fade;bottom.inert=fade>.92;
 const show=smooth(clamp((p-.36)/.25));inside.style.opacity=show;inside.style.transform=`translateY(${(1-show)*30}px)`;inside.inert=show<.9;
 notes.forEach((el,i)=>el.style.opacity=smooth(clamp((p-.6-i*.06)/.2)));
 stage.style.backgroundColor=`rgb(${[87,43,48].map((v,i)=>Math.round(lerp(v,[58,47,34][i],expand))).join(',')})`;
 const scale=product.clientWidth/1024;
 px=lerp(px,tx,.08);py=lerp(py,ty,.08);
 $('.product-tilt').style.transform=reduced?'none':`perspective(1500px) rotateY(${px*3}deg) rotateX(${-py*2}deg) scale(${1-expand*.22})`;
 const assembled=[570,678,780,885,986],exploded=[330,560,800,1030,1260];
 slices.forEach((im,i)=>{
   const dy=(lerp(assembled[i],exploded[i],expand)-data[i].center)*scale;
   im.style.transform=`translate3d(${(i%2?22:-12)*expand}px,${dy}px,0) rotate(${[-3,2,-1,3,-2][i]*expand}deg)`;
 });
 $('.product-shadow').style.opacity=.4-expand*.3;
 zoom();
 if(!reduced&&r.top<innerHeight&&r.bottom>0&&(Math.abs(px-tx)>.002||Math.abs(py-ty)>.002))schedule();
}
fetch('assets/layers.json').then(r=>{if(!r.ok)throw Error('Layer data');return r.json()}).then(d=>{
 data=d;d.forEach((layer,i)=>{const im=new Image();im.src='assets/layers.png';im.alt='';im.className='slice';im.style.clipPath=layer.clip;im.style.zIndex=String(8-i);$('.layers').append(im);slices.push(im)});schedule();
}).catch(()=>{const im=new Image();im.src='assets/classic-direction.png';im.alt='';im.style.cssText='position:absolute;width:65%;left:18%;top:35%;border-radius:50%';$('.layers').append(im)});
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
stage.addEventListener('pointermove',e=>{if(reduced||e.pointerType==='touch')return;tx=e.clientX/innerWidth*2-1;ty=e.clientY/innerHeight*2-1;schedule()});
stage.addEventListener('pointerleave',()=>{tx=ty=0;schedule()});
const flavours=[
 {title:'Яблочная классика',html:'Яблочная<br><em>классика.</em>',bg:'#ece5d4',ink:'#483324',image:'assets/classic-direction.png',text:'Яблоко в главной роли.<br>С неё начинается знакомство с пастилой.'},
 {title:'Чёрная смородина',html:'Чёрная<br><em>смородина.</em>',bg:'#572b30',ink:'#f2eadb',image:'assets/berry-direction.png',text:'Яблочные слои и ягодная прослойка.<br>Рассмотрите её на срезе.'}
];
let active=0,transition=0,animations=[];
flavours.forEach(f=>{const im=new Image();im.src=f.image});
function select(index){
 const next=(index+flavours.length)%flavours.length;if(next===active)return;
 active=next;const f=flavours[active],token=++transition;
 animations.forEach(a=>a.cancel());animations=[];
 $('.flavours').style.backgroundColor=f.bg;$('.flavours').style.color=f.ink;
 const copy=$('.flavour-copy'),photo=$('#flavour-image');
 const update=()=>{$('#flavour-title').innerHTML=f.html;$('#flavour-description').innerHTML=f.text;photo.src=f.image;photo.alt='Концептуальное изображение: '+f.title};
 $$('[data-flavour]').forEach((b,i)=>{b.classList.toggle('active',i===active);b.setAttribute('aria-pressed',String(i===active))});
 if(reduced){update();return;}
 const out=copy.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(-18px)'}],{duration:160,easing:'ease-in'});animations.push(out);
 out.finished.then(()=>{
  if(token!==transition)return;update();
  animations.push(copy.animate([{opacity:0,transform:'translateX(28px)'},{opacity:1,transform:'translateX(0)'}],{duration:600,easing:'cubic-bezier(.4,0,.2,1)'}));
  animations.push(photo.animate([{clipPath:'inset(0 100% 0 0)',transform:'scale(1.12)'},{clipPath:'inset(0)',transform:'scale(1.04)'}],{duration:800,easing:'cubic-bezier(.4,0,.2,1)'}));
 }).catch(()=>{});
}
$$('[data-flavour]').forEach((b,i)=>b.addEventListener('click',()=>select(i)));
$('.flavour-prev').onclick=()=>select(active-1);$('.flavour-next').onclick=$('.photo-next').onclick=()=>select(active+1);
$('.flavour-tabs').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();select(active+(e.key==='ArrowRight'?1:-1));$$('[data-flavour]')[active].focus()}});
let swipe=null;const photo=$('.flavour-photo');
photo.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;swipe={x:e.clientX,y:e.clientY};photo.setPointerCapture(e.pointerId)});
photo.addEventListener('pointerup',e=>{if(swipe){const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))select(active+(dx<0?1:-1));}swipe=null});
photo.addEventListener('pointercancel',()=>swipe=null);
const dialog=$('.product-dialog'),nav=$('.nav-dialog');
const focusReturns=new WeakMap();
function open(el){focusReturns.set(el,document.activeElement);el.showModal();document.body.style.overflow='hidden'}
function close(el){el.close()}
[dialog,nav].forEach(el=>{
 el.addEventListener('close',()=>{document.body.style.overflow='';focusReturns.get(el)?.focus()});
 el.addEventListener('click',e=>{if(e.target!==el)return;const r=el.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close(el)});
});
$$('[data-product]').forEach(b=>b.addEventListener('click',()=>{const f=flavours[active];$('#dialog-title').textContent=f.title;$('#dialog-image').src=f.image;open(dialog)}));
$('.dialog-close').onclick=()=>close(dialog);$('.menu-trigger').onclick=()=>open(nav);$('.nav-close').onclick=()=>close(nav);
$$('.nav-dialog a').forEach(a=>a.addEventListener('click',()=>close(nav)));
$$('.magnetic').forEach(el=>AstraMotion.magnetic(el,()=>reduced));
motionQuery.addEventListener('change',e=>{
 reduced=e.matches;tx=ty=px=py=0;animations.forEach(a=>a.cancel());transition++;
 const f=flavours[active];$('#flavour-title').innerHTML=f.html;$('#flavour-description').innerHTML=f.text;$('#flavour-image').src=f.image;$('#flavour-image').alt='Концептуальное изображение: '+f.title;
 schedule();
});
schedule();
})();
