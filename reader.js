'use strict';
(() => {
 const el=id=>document.getElementById(id);
 const menu=el('menu'),dialog=el('search'),input=el('query'),box=el('results');
 let index=null,limit=25,sequence=0;
 function toggleMenu(open){el('nav').classList.toggle('open',open);el('backdrop').classList.toggle('visible',open);menu.setAttribute('aria-expanded',String(open));document.body.classList.toggle('lock',open)}
 menu.addEventListener('click',()=>toggleMenu(menu.getAttribute('aria-expanded')!=='true'));
 el('backdrop').addEventListener('click',()=>toggleMenu(false));
 function message(s){const p=document.createElement('p');p.className='muted';p.textContent=s;return p}
 function row(r,terms){const a=document.createElement('a');a.className='searchresult';a.href=r.url;const t=document.createElement('strong');t.textContent=r.title;const s=document.createElement('span');const low=r.body.toLowerCase();let offset=Math.min(...terms.map(q=>low.indexOf(q)).filter(n=>n>=0));if(!Number.isFinite(offset))offset=0;const start=Math.max(0,offset-28);s.textContent=(start?'…':'')+r.body.slice(start,start+170)+(start+170<r.body.length?'…':'');a.append(t,s);return a}
 async function results(){
  const token=++sequence;const terms=input.value.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  if(!terms.length){box.replaceChildren(message('Search for a topic, control, case or stakeholder.'));return}
  try{
   if(!index)index=fetch('search-index.json').then(r=>{if(!r.ok)throw Error('unavailable');return r.json()}).catch(e=>{index=null;throw e});
   const entries=await index;if(token!==sequence)return;
   const matches=entries.map(r=>{const title=r.title.toLowerCase(),body=(title+' '+r.body).toLowerCase();return {r,score:terms.every(q=>body.includes(q))?1+terms.filter(q=>title.includes(q)).length:0}}).filter(x=>x.score).sort((a,b)=>b.score-a.score);
   box.replaceChildren(message(matches.length+(' results')), ...matches.slice(0,limit).map(m=>row(m.r,terms)));
   if(!matches.length)box.append(message('Try STR, redemption or evidence.'));
   if(matches.length>limit){const b=document.createElement('button');b.className='resultmore';b.textContent='More results';b.addEventListener('click',()=>{limit+=25;results()});box.append(b)}
  }catch{box.replaceChildren(message('Search could not load. Try again.'))}
 }
 function search(){if(!dialog.open)dialog.showModal();input.focus();input.select();results()}
 el('find').addEventListener('click',search);el('close').addEventListener('click',()=>dialog.close());input.addEventListener('input',()=>{limit=25;results()});dialog.addEventListener('click',e=>{if(e.target===dialog||e.target.closest('a'))dialog.close()});
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();search()}if(e.key==='Escape')toggleMenu(false)});

 const viewer=el('diagram-viewer');
 if (!viewer || typeof viewer.showModal!=='function') return;
 const preview=document.querySelector('.diagram-canvas');
 const diagram=preview.querySelector('img');
 const frame=viewer.querySelector('.diagram-viewer-frame');
 const image=new Image();
 const out=viewer.querySelector('[data-diagram-zoom="out"]');
 const fit=viewer.querySelector('[data-diagram-zoom="fit"]');
 const zoomIn=viewer.querySelector('[data-diagram-zoom="in"]');
 const percentage=viewer.querySelector('output');
 const scales=[1,1.5,2,3];
 let step=0;
 image.alt=diagram.alt;
 frame.append(image);

 function zoom(next, fromTop=false) {
  const ratio=scales[next]/scales[step];
  const x=(frame.scrollLeft+frame.clientWidth/2)*ratio-frame.clientWidth/2;
  const y=(frame.scrollTop+frame.clientHeight/2)*ratio-frame.clientHeight/2;
  step=next;
  frame.style.setProperty('--diagram-scale',scales[step]);
  percentage.value=Math.round(scales[step]*100)+'%';
  out.disabled=step===0;
  fit.disabled=step===0;
  zoomIn.disabled=step===scales.length-1;
  if(fromTop)frame.scrollTo((frame.scrollWidth-frame.clientWidth)/2,0);
  else frame.scrollTo(x,y);
 }

 preview.addEventListener('click',event=>{
  if(event.defaultPrevented || event.button!==0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)return;
  event.preventDefault();
  image.src=diagram.currentSrc||diagram.src;
  viewer.showModal();
  document.body.classList.add('diagram-expanded');
  zoom(window.matchMedia('(max-width: 760px)').matches?1:0,true);
 });
 viewer.addEventListener('close',()=>{
  document.body.classList.remove('diagram-expanded');
  preview.focus({preventScroll:true});
 });
 out.addEventListener('click',()=>zoom(Math.max(0,step-1)));
 fit.addEventListener('click',()=>zoom(0,true));
 zoomIn.addEventListener('click',()=>zoom(Math.min(scales.length-1,step+1)));
})();
