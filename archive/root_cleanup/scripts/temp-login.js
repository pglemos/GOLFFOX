const { chromium } = require('./apps/web/node_modules/@playwright/test');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  console.log('opening home');
  await page.goto('https://golffox.vercel.app',{waitUntil:'domcontentloaded',timeout:60000});
  try {
    console.log('filling login');
    await page.fill('input[name="email"]','teste@transportadora.com');
    await page.fill('input[name="password"]','senha123');
    await page.click('button[type="submit"]');
  } catch (e) {console.log('login step failed', e.message);} 
  await page.waitForTimeout(2000);
  const results=[];
  for (const path of ['/transportadora','/transportadora/mapa','/transportadora/veiculos','/transportadora/motoristas','/transportadora/alertas','/transportadora/custos','/transportadora/relatorios','/transportadora/ajuda']){
    console.log('going', path);
    try{
      await page.goto('https://golffox.vercel.app'+path,{waitUntil:'domcontentloaded',timeout:30000});
      results.push({path,url:page.url(),title:await page.title()});
    }catch(e){
      results.push({path,error:e.message});
    }
    await page.waitForTimeout(500);
  }
  console.log(JSON.stringify(results,null,2));
  await browser.close();
})();
