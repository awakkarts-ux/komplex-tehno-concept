const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results={pages:[],interactions:[],failures:[],errors:[],library:[]};
function check(ok,detail){if(!ok)results.failures.push(detail);}
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});fs.mkdirSync(path.join(process.env.AUDIT_OUTPUT || process.cwd(),'shots-final'),{recursive:true});
for(const [width,touch] of [[390,true],[768,true],[1024,true],[1366,true],[1024,false],[1200,false],[1440,false],[1920,false]]){
 const page=await browser.newPage({viewport:{width,height:1000},hasTouch:touch,reducedMotion:'reduce'});page.on('pageerror',e=>results.errors.push({width,message:e.message}));
 for(const file of ['index','servis','obsledovanie','ustanovka','proektirovanie','remont','uslugi','obekty','kontakty']){
  await page.goto('http://127.0.0.1:8765/'+file+'.html');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(150);
  await page.addStyleTag({content:'.preloader{display:none!important}html{overflow:auto!important}'});
  const measure=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,sc:[...document.querySelectorAll('.hvs__sc,.uzel__sc')].filter(e=>e.clientWidth).map(e=>({class:e.className,w:e.clientWidth,scroll:e.scrollWidth})),season:[...document.querySelectorAll('[data-season] svg text')].map(t=>({text:t.textContent,size:parseFloat(getComputedStyle(t).fontSize)*Math.abs(t.getScreenCTM().a)})),ap:[...document.querySelectorAll('.ap-ind,.ap-ind__pipe')].map(x=>({class:x.className,w:x.clientWidth,scroll:x.scrollWidth}))}));
  results.pages.push({file,width,touch,...measure});check(measure.overflow<=1,{file,width,touch,issue:'page overflow',value:measure.overflow});
  if(file==='index'&&width<1920)check(measure.ap.every(x=>x.scroll<=x.w+1),{file,width,issue:'indicator overflow',value:measure.ap});
  if(file==='servis'&&width<1920)check(measure.season.every(x=>x.size>=11.95),{file,width,touch,issue:'season text below 12',value:measure.season.filter(x=>x.size<11.95)});
  if(touch){
   const segments=page.locator('[data-hvs-seg] button');const states=await segments.count();
   for(let state=0;state<Math.max(1,states);state++){
    if(states)await segments.nth(state).evaluate(e=>e.click());
    const stages=page.locator('[data-hvs]:visible,[data-uzel]:visible');
    for(let s=0;s<await stages.count();s++){
     const stage=stages.nth(s);const count=await stage.locator('.dot').count();let passed=0;const heights=[];
     for(let i=0;i<count;i++){
      const dot=stage.locator('.dot').nth(i);await dot.evaluate(e=>e.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));
      await page.mouse.move(0,0);const bb=await dot.boundingBox();if(!bb)continue;
      await page.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);
      const val=await stage.evaluate((el,i)=>{const root=el.closest('[data-s]')||el.closest('.hvs')||el.closest('.uzel');const info=root.querySelector('[data-hvs-info],[data-uzel-info]');const hit=el.querySelectorAll('.hit')[i];return {expected:+hit.dataset.k+1,actual:parseInt(info.querySelector('.hvs__cnt,.uzel__cnt').textContent),height:info.getBoundingClientRect().height};},i);
      heights.push(val.height);if(val.expected===val.actual)passed++;else check(false,{file,width,state,stage:s,dot:i,issue:'tap target mismatch',...val});
     }
     check(Math.max(...heights)-Math.min(...heights)<=1,{file,width,state,stage:s,issue:'card height jump',heights});
     results.interactions.push({file,width,state,stage:s,dots:count,passed,heightRange:[Math.min(...heights),Math.max(...heights)]});
     // Cycle arrow controls and check the selected dot is within the scroll viewport.
     const nav=await stage.evaluate(el=>{const root=el.closest('[data-s]')||el.closest('.hvs')||el.closest('.uzel');return root.querySelectorAll('[data-hvs-step="1"],[data-uzel-step="1"]').length;});
     if(nav)for(let i=0;i<9;i++){const v=await stage.evaluate(el=>{const root=el.closest('[data-s]')||el.closest('.hvs')||el.closest('.uzel');root.querySelector('[data-hvs-step="1"],[data-uzel-step="1"]').click();const sc=el.querySelector('.hvs__sc,.uzel__sc'),dot=el.querySelector('.dot.off');if(!sc||!dot||sc.scrollWidth<=sc.clientWidth+2)return true;const r=dot.getBoundingClientRect(),c=sc.getBoundingClientRect();return r.left>=c.left-1&&r.right<=c.right+1;});check(v,{file,width,state,stage:s,issue:'selected dot outside scrollport'});}
    }
   }
   if(file==='servis'){
    const heights=[];for(let m=0;m<12;m++){await page.locator('[data-season] .mo').nth(m).evaluate(e=>{e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});});const b=await page.locator('[data-season] .mo .tl').nth(m).boundingBox();await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);const v=await page.locator('[data-season-info]').evaluate(e=>({h:e.getBoundingClientRect().height,m:parseInt(e.querySelector('.hvs__cnt').textContent)}));heights.push(v.h);check(v.m===m+1,{file,width,issue:'season tap',m,v});}check(Math.max(...heights)-Math.min(...heights)<=1,{file,width,issue:'season height jump',heights});results.interactions.push({file,width,seasonHeight:heights});
   }
  }
  if((width===1920||width===390)&&['index','servis','obsledovanie','ustanovka'].includes(file)){
   // Reset selection to initial state before comparison snapshots.
   await page.reload();await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'.preloader{display:none!important}html{overflow:auto!important}header,[class*=toc],[class*=sticky]{visibility:hidden!important}'});await page.mouse.move(0,0);
   for(const [sel,name] of (file==='index'?[['#uzel','uzel'],['.ap-ind','indicator'],['.hero-a','hero'],['.stgg','steps']]:file==='servis'?[['.hvs--season','season'],['.hvs--err','err']]:file==='obsledovanie'?[['[data-hvs]','itp']]:[['#scheme','montage']]))if(await page.locator(sel).count())await page.locator(sel).first().screenshot({path:path.join(process.env.AUDIT_OUTPUT || process.cwd(),'shots-final',`${file}-${name}-${width}.png`)});
  }
 }
 await page.close();console.log('Pages done',width,touch);
}
await browser.close();fs.writeFileSync(path.join(process.env.AUDIT_OUTPUT || process.cwd(),'audit-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({pages:results.pages.length,interactions:results.interactions.length,failures:results.failures,errors:results.errors},null,2));})();

