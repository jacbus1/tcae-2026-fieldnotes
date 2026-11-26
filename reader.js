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
})();
