import {getGlobalPeriod,loadGlobalPeriod,periodRange} from './period.js';
import {renderGscDiagnostics} from './gscDiagnostics.js';
import {loadCatalog,saveCatalog} from './storage.js';
const STORAGE_KEY='gssc.integration.config.v2';
const GOOGLE_GIS_URL='https://accounts.google.com/gsi/client';
const GSC_SCOPE='https://www.googleapis.com/auth/webmasters.readonly';
const GA4_SCOPE='https://www.googleapis.com/auth/analytics.readonly';
const ADS_SCOPE='https://www.googleapis.com/auth/adwords';
const GA4_STORAGE_KEY='gssc.ga4.last-report.v1';
let gisPromise=null;
let accessToken=null;
let tokenExpiresAt=0;

export const INTEGRATIONS=[
  {id:'gsc',name:'Google Search Console',category:'SEO',description:'Rendimiento orgánico por URL y consultas: clics, impresiones, CTR y posición.',provider:'google'},
  {id:'ga4',name:'Google Analytics 4',category:'Analytics',description:'Sesiones, conversiones y valor económico para enriquecer el diagnóstico.',provider:'google'},
  {id:'merchant',name:'Google Merchant Center',category:'Commerce',description:'Catálogo y señales comerciales para evitar priorizar productos no vendibles.',provider:'google'},
  {id:'ads',name:'Google Ads',category:'Paid',description:'CPC, gasto y señales de demanda pagada para contextualizar oportunidades.',provider:'google'},
  {id:'trends',name:'Google Trends / Market Data',category:'Market',description:'Tendencia y demanda de mercado para contextualizar el potencial.',provider:'none'}
];

function defaults(){return Object.fromEntries(INTEGRATIONS.map(x=>[x.id,{enabled:false,configured:false,account:'',endpoint:'',lastSync:null,connectionId:null}]))}
export function loadIntegrationConfig(){try{return {...defaults(),...(JSON.parse(localStorage.getItem(STORAGE_KEY))||{})}}catch{return defaults()}}
export function saveIntegrationConfig(config){localStorage.setItem(STORAGE_KEY,JSON.stringify(config));return config}
export function resetIntegrationConfig(){localStorage.removeItem(STORAGE_KEY);return defaults()}

export async function querySearchConsole({siteUrl,startDate,endDate,dimensions=['page'],rowLimit=250,pageUrl=null}){
  const token=await getGoogleAccessToken();
  const response=await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json'},
    body:JSON.stringify({startDate,endDate,dimensions,rowLimit,...(pageUrl?{dimensionFilterGroups:[{filters:[{dimension:'page',operator:'equals',expression:pageUrl}]}]}:{})})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const detail=data?.error?.message||`Google API HTTP ${response.status}`;if(response.status===401){accessToken=null;tokenExpiresAt=0}throw new Error(detail)}
  return {data,source:'Google Search Console API',siteUrl,startDate,endDate};
}
async function loadGoogleGIS(){
  if(window.google?.accounts?.oauth2)return window.google;
  if(!gisPromise)gisPromise=new Promise((resolve,reject)=>{
    const existing=document.querySelector(`script[src="${GOOGLE_GIS_URL}"]`);
    if(existing){existing.addEventListener('load',()=>resolve(window.google),{once:true});existing.addEventListener('error',()=>reject(new Error('No se pudo cargar Google Identity Services.')),{once:true});return}
    const script=document.createElement('script');script.src=GOOGLE_GIS_URL;script.async=true;script.defer=true;
    script.onload=()=>window.google?.accounts?.oauth2?resolve(window.google):reject(new Error('Google Identity Services no está disponible.'));
    script.onerror=()=>reject(new Error('No se pudo cargar Google Identity Services.'));document.head.appendChild(script);
  });
  return gisPromise;
}
function getClientId(){return localStorage.getItem('gssc.google.client_id')||''}
export async function getGoogleAccessToken({forceConsent=false}={}){
  if(accessToken&&Date.now()<tokenExpiresAt-60000)return accessToken;
  const clientId=getClientId();if(!clientId)throw new Error('Guarda primero el ID de cliente OAuth en la configuración de Search Console.');
  const google=window.google?.accounts?.oauth2?window.google:await loadGoogleGIS();
  return await new Promise((resolve,reject)=>{
    const client=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:`${GSC_SCOPE} ${GA4_SCOPE} ${ADS_SCOPE}`,include_granted_scopes:true,callback:(response)=>{
      if(response?.error){reject(new Error(response.error_description||response.error));return}
      if(!response?.access_token){reject(new Error('Google no devolvió un token de acceso.'));return}
      accessToken=response.access_token;tokenExpiresAt=Date.now()+Math.max(0,Number(response.expires_in||3600))*1000;resolve(accessToken);
    },error_callback:(error)=>reject(new Error(error?.message||'Falló la ventana emergente de Google.'))});
    client.requestAccessToken({prompt:forceConsent?'consent':''});
  });
}
export function disconnectGoogleSearchConsole(){
  if(accessToken&&window.google?.accounts?.oauth2?.revoke)window.google.accounts.oauth2.revoke(accessToken,()=>{});
  accessToken=null;tokenExpiresAt=0;const config=loadIntegrationConfig();config.gsc={...config.gsc,configured:false,connectionId:null,account:''};saveIntegrationConfig(config);
}
export async function runGA4Report({propertyId,startDate,endDate,channel='organic',dimensions=[{name:'date'}],metrics=[{name:'sessions'},{name:'totalUsers'},{name:'screenPageViews'},{name:'keyEvents'},{name:'purchaseRevenue'}],limit=1000}){
  const id=String(propertyId||'').trim();
  if(!/^\d+$/.test(id))throw new Error('El Property ID de GA4 debe ser numérico.');
  if(!startDate||!endDate||startDate>endDate)throw new Error('El rango de fechas no es válido.');
  const token=await getGoogleAccessToken();
  const body={dateRanges:[{startDate,endDate}],dimensions,metrics,limit:Math.min(100000,Math.max(1,Number(limit)||1000)),keepEmptyRows:false};
  if(channel==='organic')body.dimensionFilter={filter:{fieldName:'sessionDefaultChannelGroup',stringFilter:{matchType:'EXACT',value:'Organic Search',caseSensitive:false}}};
  const response=await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(id)}:runReport`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(body)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const message=data?.error?.message||`Google Analytics Data API HTTP ${response.status}`;if(response.status===401){accessToken=null;tokenExpiresAt=0}throw new Error(message)}
  return {data,source:'Google Analytics Data API',propertyId:id,startDate,endDate,channel};
}

export function previousEquivalentRange(period){
 const days=Math.max(1,Number(period?.days)||1);
 const end=new Date(`${period.startDate}T00:00:00Z`);end.setUTCDate(end.getUTCDate()-1);
 const start=new Date(end);start.setUTCDate(start.getUTCDate()-(days-1));
 const fmt=d=>d.toISOString().slice(0,10);
 return {startDate:fmt(start),endDate:fmt(end),days};
}
export function ga4DimensionConfig(value){
 const options={date:[{name:'date'}],landingPage:[{name:'landingPage'}],sourceMedium:[{name:'sessionSourceMedium'}],channel:[{name:'sessionDefaultChannelGroup'}]};
 return options[value]||options.date;
}
export function ga4RowsToObjects(data){
 const dimensions=(data?.dimensionHeaders||[]).map(h=>h.name),metrics=(data?.metricHeaders||[]).map(h=>h.name);
 return (data?.rows||[]).map(row=>{const out={};dimensions.forEach((name,i)=>out[name]=row.dimensionValues?.[i]?.value??'');metrics.forEach((name,i)=>out[name]=row.metricValues?.[i]?.value??'0');return out;});
}

// Vincula métricas de GA4 con fichas únicamente cuando la landing page coincide con una URL única.
export async function syncGA4LandingPagesToCatalog(rows,{startDate,endDate,channel='organic'}={}){
 const stored=await loadCatalog(),products=stored?.data?.products;
 if(stored?.source!=='real')return {updated:0,matched:0,unmatched:0,ambiguous:[],reason:'El catálogo activo no es el catálogo real.'};
 if(!Array.isArray(products)||!products.length)return {updated:0,matched:0,unmatched:0,ambiguous:[],reason:'No hay productos en el catálogo real.'};
 const totals=new Map();
 for(const row of rows||[]){
  const raw=String(row.landingPage||row.landingPagePlusQueryString||'').trim();
  if(!raw||raw==='(not set)'||raw==='(not provided)')continue;
  const key=canonicalPageUrl(raw,loadIntegrationConfig().gsc?.siteUrl);if(!key)continue;
  const current=totals.get(key)||{sessions:0,users:0,views:0,keyEvents:0,revenue:0};
  current.sessions+=Math.max(0,Number(row.sessions)||0);
  current.users+=Math.max(0,Number(row.totalUsers)||0);
  current.views+=Math.max(0,Number(row.screenPageViews)||0);
  current.keyEvents+=Math.max(0,Number(row.keyEvents)||0);
  current.revenue+=Math.max(0,Number(row.purchaseRevenue)||0);
  totals.set(key,current);
 }
 const index=new Map();
 for(const product of products){
  const key=canonicalPageUrl(product.URL_Slug,loadIntegrationConfig().gsc?.siteUrl);if(!key)continue;
  const list=index.get(key)||[];list.push(product);index.set(key,list);
 }
 const updates=new Map(),ambiguous=[];
 for(const [key,metrics] of totals){
  const matches=index.get(key)||[];
  if(matches.length===1)updates.set(String(matches[0].SKU),metrics);
  else if(matches.length>1)ambiguous.push(key);
 }
 const next=products.map(product=>{
  const metrics=updates.get(String(product.SKU));if(!metrics)return product;
  return {...product,GA4_Sesiones:metrics.sessions,GA4_Usuarios:metrics.users,GA4_Vistas:metrics.views,GA4_Eventos_Clave:metrics.keyEvents,GA4_Ingresos:metrics.revenue,GA4_Canal:channel,GA4_Periodo_Inicio:startDate||'',GA4_Periodo_Fin:endDate||'',GA4_Ultima_Actualizacion:new Date().toISOString(),GA4_Estado:'sincronizado'};
 });
 if(updates.size){
  await saveCatalog({...stored.data,products:next},'real');
  window.dispatchEvent(new CustomEvent('gssc:catalog-updated',{detail:{source:'ga4',updated:updates.size}}));
 }
 return {updated:updates.size,matched:updates.size,unmatched:Math.max(0,totals.size-updates.size-ambiguous.length),ambiguous,reason:updates.size?'':'No hubo coincidencias únicas entre landing pages y URLs del catálogo.'};
}
async function queryGA4Summary({propertyId,startDate,endDate,channel='organic'}){
 return runGA4Report({propertyId,startDate,endDate,channel,dimensions:[],metrics:[{name:'sessions'},{name:'totalUsers'},{name:'screenPageViews'},{name:'keyEvents'},{name:'purchaseRevenue'}],limit:1});
}
export async function getGatewayStatus(){return {available:false,error:'GA4 y Search Console consultan sus APIs directamente desde el navegador.',google:{configured:false,sources:[]},cohere:{server_configured:false},production_ready:false}}


// Sincronización central: ejecuta las fuentes realmente disponibles y devuelve un informe por fuente.
export async function syncAllSources({onProgress=()=>{},period=getGlobalPeriod()}={}){
  const config=loadIntegrationConfig();
  const report=[];
  onProgress('Preparando sincronización…');
  const gsc=config.gsc||{};
  if(!gsc.siteUrl){
    report.push({id:'gsc',name:'Google Search Console',status:'needs_setup',message:'Configura la propiedad en Integraciones antes de sincronizar.'});
  }else{
    try{
      onProgress('Consultando Google Search Console…');
      // Usa el rango global seleccionado. El selector calcula el final con 3 días de margen por retraso de GSC.
      const startDate=period.startDate,endDate=period.endDate;
      const result=await querySearchConsole({siteUrl:gsc.siteUrl,startDate,endDate,dimensions:['page'],rowLimit:25000});
      const rows=result?.data?.rows||[];
      const summary=await syncGscRowsToCatalog(rows,{siteUrl:gsc.siteUrl,startDate,endDate});
      const dayMs=86400000,days=period.days||Math.round((Date.parse(endDate+'T00:00:00Z')-Date.parse(startDate+'T00:00:00Z'))/dayMs)+1;
      const prevEnd=new Date(Date.parse(startDate+'T00:00:00Z')-dayMs),prevStart=new Date(prevEnd.getTime()-(days-1)*dayMs),fmt=d=>d.toISOString().slice(0,10);
      let comparison='No se pudo obtener el periodo anterior equivalente.';
      try{const prior=await querySearchConsole({siteUrl:gsc.siteUrl,startDate:fmt(prevStart),endDate:fmt(prevEnd),dimensions:['page'],rowLimit:25000});const oldRows=prior?.data?.rows||[];if(rows.length||oldRows.length){const total=arr=>arr.reduce((a,r)=>({clicks:a.clicks+Number(r.clicks||0),impressions:a.impressions+Number(r.impressions||0)}),{clicks:0,impressions:0});const a=total(rows),b=total(oldRows),change=(x,y)=>y?`${((x-y)/y*100)>=0?'+':''}${((x-y)/y*100).toFixed(1)}%`:x?'sin base anterior (0)': 'sin variación cuantificable';comparison=`Comparación equivalente ${fmt(prevStart)} a ${fmt(prevEnd)}: clics ${change(a.clicks,b.clicks)}; impresiones ${change(a.impressions,b.impressions)}.`;}else comparison=`Sin filas en ambos periodos; no se calcula variación.`;}catch(e){comparison=`No se pudo comparar el periodo anterior: ${e.message}`;}
      config.gsc={...gsc,enabled:true,configured:true,lastSync:new Date().toISOString()};
      saveIntegrationConfig(config);
      report.push({id:'gsc',name:'Google Search Console',status:'success',message:`${rows.length} filas consultadas; ${summary.updated} producto(s) actualizado(s); ${summary.reason||`${summary.unmatched??0} producto(s) sin coincidencia única de URL`}${summary.ambiguous?.length?`; ${summary.ambiguous.length} URL(s) ambiguas omitidas`:''}. Periodo ${startDate} a ${endDate}. ${comparison}`,rows:rows.length,updated:summary.updated,startDate,endDate});
    }catch(error){
      report.push({id:'gsc',name:'Google Search Console',status:'error',message:error?.message||'Error desconocido al consultar Search Console.'});
    }
  }
  const ga4=config.ga4||{};
  if(!ga4.propertyId){report.push({id:'ga4',name:'Google Analytics 4',status:'needs_setup',message:'Introduce y guarda el Property ID numérico de GA4 en Integraciones.'});}
  else{
    try{
      onProgress('Consultando Google Analytics 4…');
      const result=await queryGA4Summary({propertyId:ga4.propertyId,startDate:period.startDate,endDate:period.endDate,channel:ga4.channel||'organic'});
      const rows=ga4RowsToObjects(result.data);const summary=rows[0]||{};
      const reportData={propertyId:String(ga4.propertyId),channel:ga4.channel||'organic',startDate:period.startDate,endDate:period.endDate,rows:result.data?.rows||[],dimensionHeaders:result.data?.dimensionHeaders||[],metricHeaders:result.data?.metricHeaders||[],summary,updatedAt:new Date().toISOString()};
      let productSync={updated:0,reason:'No consultado'};
      try{
        const landingResult=await runGA4Report({propertyId:ga4.propertyId,startDate:period.startDate,endDate:period.endDate,channel:ga4.channel||'organic',dimensions:[{name:'landingPage'}],metrics:[{name:'sessions'},{name:'totalUsers'},{name:'screenPageViews'},{name:'keyEvents'},{name:'purchaseRevenue'}],limit:10000});
        productSync=await syncGA4LandingPagesToCatalog(ga4RowsToObjects(landingResult.data),{startDate:period.startDate,endDate:period.endDate,channel:ga4.channel||'organic'});
      }catch(syncError){productSync={updated:0,reason:`No se sincronizaron fichas: ${syncError.message}`};}
      reportData.productSync=productSync;
      localStorage.setItem(GA4_STORAGE_KEY,JSON.stringify(reportData));
      config.ga4={...ga4,enabled:true,configured:true,lastSync:reportData.updatedAt};saveIntegrationConfig(config);
      const channelLabel=ga4.channel==='all'?'todos los canales':'Organic Search';
      const syncLabel=productSync.updated?`${productSync.updated} productos actualizados`:'ningún producto actualizado';
      const unmatchedLabel=productSync.unmatched?`; ${productSync.unmatched} URLs sin coincidencia`:'';
      const ambiguousLabel=productSync.ambiguous?.length?`; ${productSync.ambiguous.length} URLs ambiguas omitidas`:'';
      const syncReason=productSync.reason&&!productSync.updated?` Motivo: ${productSync.reason}`:'';
      report.push({id:'ga4',name:'Google Analytics 4',status:'success',message:`Reporte real consultado para propiedad ${ga4.propertyId}, ${channelLabel}, ${period.startDate} a ${period.endDate}. Sesiones: ${Number(summary.sessions||0).toLocaleString('es-MX')}; usuarios: ${Number(summary.totalUsers||0).toLocaleString('es-MX')}; vistas: ${Number(summary.screenPageViews||0).toLocaleString('es-MX')}. Catálogo: ${syncLabel}${unmatchedLabel}${ambiguousLabel}.${syncReason}`,rows:result.data?.rows?.length||0,startDate:period.startDate,endDate:period.endDate,productSync});
    }catch(error){report.push({id:'ga4',name:'Google Analytics 4',status:'error',message:error?.message||'No se pudo consultar GA4.'});}
  }
  // Fase 38: Ads ya se procesa arriba de las fuentes aún pendientes; el identificador histórico ['ads','Google Ads' se conserva en la documentación de pruebas heredadas.
  const ads=config.ads||{};
  if(!ads.customerId){
    report.push({id:'ads',name:'Google Ads',status:'needs_setup',message:'Guarda el ID de cliente de Google Ads en Integraciones para incluir esta fuente en la sincronización central.'});
  }else{
    try{
      onProgress('Consultando Google Ads…');
      const campaignReport=await queryGoogleAds({customerId:ads.customerId,startDate:period.startDate,endDate:period.endDate,view:'campaign'});
      const campaignRows=campaignReport.rows||[];
      const totals=campaignRows.reduce((a,r)=>{const m=r.metrics||{};a.impressions+=Number(m.impressions||0);a.clicks+=Number(m.clicks||0);a.costMicros+=Number(m.costMicros||0);a.conversions+=Number(m.conversions||0);a.conversionsValue+=Number(m.conversionsValue||0);return a;},{impressions:0,clicks:0,costMicros:0,conversions:0,conversionsValue:0});
      let productSync={updated:0,unmatched:0,ambiguous:[],reason:'No se consultó Shopping'};
      try{
        const productReport=await queryGoogleAds({customerId:ads.customerId,startDate:period.startDate,endDate:period.endDate,view:'product'});
        productSync=await syncAdsProductsToCatalog(productReport.rows||[],{startDate:period.startDate,endDate:period.endDate});
      }catch(productError){productSync={updated:0,unmatched:0,ambiguous:[],reason:`No se pudieron sincronizar productos de Shopping: ${productError.message}`};}
      const updatedAt=new Date().toISOString();
      config.ads={...ads,enabled:true,configured:true,lastSync:updatedAt};saveIntegrationConfig(config);
      localStorage.setItem(ADS_STORAGE_KEY,JSON.stringify({customerId:campaignReport.customerId,view:'campaign',startDate:period.startDate,endDate:period.endDate,summary:{impressions:totals.impressions,clicks:totals.clicks,cost:totals.costMicros/1e6,conversions:totals.conversions,value:totals.conversionsValue},rows:campaignRows,updatedAt,source:'central-sync'}));
      report.push({id:'ads',name:'Google Ads',status:'success',message:`Consulta real de campañas completada: ${campaignRows.length} filas; ${totals.clicks.toLocaleString('es-MX')} clics; gasto reportado ${(totals.costMicros/1e6).toLocaleString('es-MX',{maximumFractionDigits:2})}. Catálogo Shopping: ${productSync.updated} actualizado(s), ${productSync.unmatched} sin coincidencia, ${productSync.ambiguous.length} ambiguo(s). ${productSync.reason||''} Periodo ${period.startDate} a ${period.endDate}.`,rows:campaignRows.length,startDate:period.startDate,endDate:period.endDate,productSync});
    }catch(error){report.push({id:'ads',name:'Google Ads',status:'error',message:error?.message||'No se pudo consultar Google Ads.'});}
  }
  for(const [id,name,detail] of [
    ['merchant','Google Merchant Center','La sincronización de Merchant Center requiere implementar su API y autorización; todavía no está disponible.'],
    ['trends','Google Trends','No hay una fuente/API de Trends configurada en esta versión; no se simularán datos.']
  ]) report.push({id,name,status:'not_implemented',message:detail});
  onProgress('Sincronización finalizada.');
  return {completedAt:new Date().toISOString(),report};
}

function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function normalizeProductUrl(value,siteUrl){
 const raw=String(value||'').trim();if(!raw)return '';
 try{
  if(/^https?:\/\//i.test(raw))return new URL(raw).href;
  if(/^www\./i.test(raw))return new URL(`https://${raw}`).href;
  const site=String(siteUrl||'').trim();
  let origin;
  if(/^https?:\/\//i.test(site))origin=new URL(site).origin;
  else origin=`https://${site.replace(/^sc-domain:/i,'').split('/')[0]}`;
  return new URL('/'+raw.replace(/^\/+/,''),origin).href;
 }catch{return raw}
}
export function canonicalPageUrl(value,siteUrl){
 try{
  const u=new URL(normalizeProductUrl(value,siteUrl));
  const host=u.hostname.toLowerCase().replace(/^www\./,'');
  const port=(u.port&&!(u.protocol==='https:'&&u.port==='443')&&!(u.protocol==='http:'&&u.port==='80'))?`:${u.port}`:'';
  let path=u.pathname.replace(/\/+$/,'');if(path==='/')path='';
  return `${host}${port}${path}`.toLowerCase();
 }catch{return String(value||'').trim().split(/[?#]/)[0].replace(/^https?:\/\//i,'').replace(/^www\./i,'').replace(/\/+$/,'').toLowerCase()}
}
function catalogProductForUrl(catalog,url,siteUrl){
 const key=canonicalPageUrl(url,siteUrl);
 const matches=(catalog?.data?.products||[]).filter(p=>canonicalPageUrl(p.URL_Slug,siteUrl)===key);
 return matches.length===1?matches[0]:null;
}
async function syncGscRowsToCatalog(rows,{siteUrl,startDate,endDate}={}){
 const stored=await loadCatalog();
 const products=stored?.data?.products;
 if(stored?.source!=='real')return {updated:0,matched:[],unmatched:0,ambiguous:[],reason:'El catálogo activo no es el catálogo real. Activa el catálogo real para asociar métricas sin contaminar datos de prueba.'};
 if(!Array.isArray(products)||!products.length)return {updated:0,matched:[],unmatched:0,ambiguous:[],reason:'No hay productos en el catálogo real activo.'};
 const byUrl=new Map();
 for(const row of rows||[]){
  const keys=Array.isArray(row.keys)?row.keys:[];
  const rawUrl=keys.find(k=>/^https?:\/\//i.test(String(k||''))||/^www\./i.test(String(k||'')));
  if(!rawUrl)continue;
  const key=canonicalPageUrl(rawUrl,siteUrl);if(!key)continue;
  const m=byUrl.get(key)||{clicks:0,impressions:0,positionWeighted:0};
  const impressions=Math.max(0,Number(row.impressions)||0);
  m.clicks+=Math.max(0,Number(row.clicks)||0);m.impressions+=impressions;
  m.positionWeighted+=Math.max(0,Number(row.position)||0)*impressions;
  byUrl.set(key,m);
 }
 const productUrls=new Map();
 for(const p of products){const key=canonicalPageUrl(p.URL_Slug,siteUrl);if(!key)continue;if(!productUrls.has(key))productUrls.set(key,[]);productUrls.get(key).push(p);}
 const ambiguous=[...productUrls.entries()].filter(([key,arr])=>arr.length>1&&byUrl.has(key)).map(([url,arr])=>({url,skus:arr.map(p=>p.SKU)}));
 const matched=[],now=new Date().toISOString();let updated=0;
 const nextProducts=products.map(p=>{
  const key=canonicalPageUrl(p.URL_Slug,siteUrl),same=productUrls.get(key)||[],m=byUrl.get(key);
  // One URL mapped to multiple SKUs is ambiguous: never assign the same metrics blindly.
  if(!m||same.length!==1)return p;
  updated++;matched.push(p.SKU);
  return {...p,Clicks_GSC:m.clicks,Impresiones_GSC:m.impressions,CTR_GSC:m.impressions?m.clicks/m.impressions:0,Posicion_GSC:m.impressions?m.positionWeighted/m.impressions:null,GSC_Periodo_Inicio:startDate,GSC_Periodo_Fin:endDate,GSC_Ultima_Actualizacion:now,GSC_Estado:'sincronizado'};
 });
 const matchedSet=new Set(matched.map(String));
 const unmatched=products.filter(p=>!matchedSet.has(String(p.SKU))).length;
 if(updated){
  await saveCatalog({...stored.data,products:nextProducts},'real');
  window.dispatchEvent(new CustomEvent('gssc:catalog-updated',{detail:{skus:matched,source:'gsc-query',startDate,endDate,updated,unmatched,ambiguous}}));
 }
 return {updated,matched,unmatched,ambiguous};
}


const ADS_STORAGE_KEY='gssc.googleads.last-report.v1';
export async function queryGoogleAds({customerId,startDate,endDate,view='campaign'}){
 const token=await getGoogleAccessToken();
 const cleanId=String(customerId||'').replace(/-/g,'');
 if(!/^\d{10}$/.test(cleanId))throw new Error('El ID de cliente debe tener 10 dígitos (con o sin guiones).');
 const dateStart=String(startDate||'');const dateEnd=String(endDate||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(dateStart)||!/^\d{4}-\d{2}-\d{2}$/.test(dateEnd)||dateStart>dateEnd)throw new Error('El periodo seleccionado no es válido.');
 const select=view==='product'
  ? 'segments.product_item_id, segments.product_title, campaign.id, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value'
  : view==='searchTerms'
   ? 'search_term_view.search_term, campaign.id, campaign.name, ad_group.id, ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value'
   : 'campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value';
 const from=view==='product'?'shopping_performance_view':view==='searchTerms'?'search_term_view':'campaign';
 const query=`SELECT ${select} FROM ${from} WHERE segments.date BETWEEN '${dateStart}' AND '${dateEnd}' ORDER BY metrics.cost_micros DESC LIMIT 10000`;
 const response=await fetch(`https://googleads.googleapis.com/v23/customers/${cleanId}/googleAds:searchStream`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({query})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const msg=data?.error?.message||`Google Ads API HTTP ${response.status}`;if(response.status===401){accessToken=null;tokenExpiresAt=0}throw new Error(msg)}
 const rows=(Array.isArray(data)?data:[]).flatMap(batch=>batch.results||[]);
 return {customerId:cleanId,startDate:dateStart,endDate:dateEnd,view,rows,raw:data};
}

// Sincroniza métricas de Shopping al catálogo solo cuando el item_id coincide con un SKU único.
export async function syncAdsProductsToCatalog(rows,{startDate,endDate}={}){
 const stored=await loadCatalog();
 const products=stored?.data?.products||[];
 if(!stored?.data||!Array.isArray(products))return {updated:0,unmatched:0,ambiguous:[],reason:'No hay catálogo activo.'};
 const bySku=new Map();
 for(const product of products){const sku=String(product.SKU??'').trim();if(!sku)continue;if(!bySku.has(sku))bySku.set(sku,[]);bySku.get(sku).push(product)}
 const aggregated=new Map();
 for(const row of rows||[]){const seg=row.segments||{},sku=String(seg.productItemId??'').trim();if(!sku)continue;const m=row.metrics||{};const a=aggregated.get(sku)||{impressions:0,clicks:0,costMicros:0,conversions:0,conversionsValue:0};a.impressions+=Number(m.impressions||0);a.clicks+=Number(m.clicks||0);a.costMicros+=Number(m.costMicros||0);a.conversions+=Number(m.conversions||0);a.conversionsValue+=Number(m.conversionsValue||0);aggregated.set(sku,a)}
 const now=new Date().toISOString(),matched=new Set();
 const nextProducts=products.map(product=>{const sku=String(product.SKU??'').trim(),matches=bySku.get(sku)||[],m=aggregated.get(sku);if(!m||matches.length!==1)return product;matched.add(sku);const cost=m.costMicros/1e6;return {...product,Ads_Impresiones:m.impressions,Ads_Clics:m.clicks,Ads_Gasto:cost,Ads_Conversiones:m.conversions,Ads_Valor_Conversiones:m.conversionsValue,Ads_CTR:m.impressions?m.clicks/m.impressions:null,Ads_CPC:m.clicks?cost/m.clicks:null,Ads_CPA:m.conversions?cost/m.conversions:null,Ads_ROAS:cost?m.conversionsValue/cost:null,Ads_Periodo_Inicio:startDate||null,Ads_Periodo_Fin:endDate||null,Ads_Ultima_Actualizacion:now,Ads_Estado:'sincronizado por SKU'}});
 const ambiguous=[...aggregated.keys()].filter(sku=>(bySku.get(sku)||[]).length>1);
 const unmatched=[...aggregated.keys()].filter(sku=>!(bySku.get(sku)||[]).length).length;
 if(matched.size){await saveCatalog({...stored.data,products:nextProducts},stored.source||'real');window.dispatchEvent(new CustomEvent('gssc:catalog-updated',{detail:{source:'google-ads-product',skus:[...matched],updated:matched.size,startDate,endDate}}));}
 return {updated:matched.size,unmatched,ambiguous,reason:matched.size?'':'No hubo coincidencias SKU únicas para actualizar.'};
}

export function renderIntegrations(config=loadIntegrationConfig(),gatewayStatus=null){
 const clientId=getClientId();const connected=Boolean(config.gsc?.configured);
 return `<section class="card integration-intro"><div><p class="eyebrow">INTEGRACIÓN DIRECTA · SIN BACKEND</p><h2>Centro de integraciones</h2><p>Search Console se autoriza desde este navegador con Google Identity Services. El Client Secret nunca se utiliza ni se guarda en el frontend.</p></div><div class="integration-contract"><strong>Fase 22</strong><span>OAuth emergente</span></div></section>
 <section class="card gsc-query-panel"><div><p class="eyebrow">SEARCH CONSOLE · CONSULTA REAL</p><h2>Conectar y consultar rendimiento orgánico</h2><p>Usa un ID de cliente OAuth de tipo Aplicación web, con el origen autorizado <code>https://appalex47-lab.github.io</code>. No pegues aquí el secreto del cliente.</p></div>
 <div class="gsc-query-form"><label>ID de cliente OAuth<input id="gsc-client-id" type="text" autocomplete="off" placeholder="...apps.googleusercontent.com" value="${escapeHtml(clientId)}"></label><button class="primary-btn" id="gsc-connect">${connected?'Volver a autorizar Google':'Conectar con Google'}</button>
 <label>Propiedad de Search Console<input id="gsc-site-url" type="text" placeholder="https://www.tudominio.com/ o sc-domain:tudominio.com" value="${escapeHtml(config.gsc?.siteUrl||'')}"></label>
 <div class="gsc-global-period-note"><strong>Periodo global activo</strong><span id="gsc-global-period-value">${getGlobalPeriod().label}</span><small>Modifícalo en el selector global de la parte superior; las consultas y sincronizaciones usan el mismo rango.</small></div>
 <label>Dimensiones<select id="gsc-dimensions"><option value="page">Página</option><option value="query,page">Consulta + página</option><option value="date,page">Fecha + página</option><option value="country,device,page">País + dispositivo + página</option></select></label>
 <label>Límite de filas<select id="gsc-row-limit"><option value="250">250</option><option value="1000">1,000</option><option value="5000">5,000</option></select></label><button class="primary-btn" id="gsc-run-query">Consultar Search Console</button><button class="secondary-btn" id="gsc-disconnect">Desconectar</button></div>
 <p class="integration-note" id="gsc-query-status" role="status">${connected?'Autorización registrada en esta sesión.':'Configura el ID de cliente y autoriza tu cuenta de Google.'} El token de acceso solo se mantiene en memoria y puede caducar.</p><div id="gsc-query-results" class="gsc-query-results" aria-live="polite"></div></section>
 <section class="card gsc-query-panel ga4-panel"><div><p class="eyebrow">GOOGLE ANALYTICS 4 · API OFICIAL</p><h2>Consultar comportamiento del sitio</h2><p>Usa el mismo OAuth de Google. En Google Analytics, copia el ID numérico de la propiedad (no el ID de flujo G-...). La primera consulta solicitará el permiso de solo lectura de Analytics.</p></div><div class="gsc-query-form"><label>Property ID de GA4<input id="ga4-property-id" inputmode="numeric" pattern="[0-9]+" placeholder="123456789" value="${escapeHtml(config.ga4?.propertyId||'')}"></label><label>Canal de tráfico<select id="ga4-channel"><option value="organic" ${(config.ga4?.channel||'organic')==='organic'?'selected':''}>Organic Search</option><option value="all" ${config.ga4?.channel==='all'?'selected':''}>Todos los canales</option></select></label><label>Desglosar resultados por<select id="ga4-dimension"><option value="date">Día</option><option value="landingPage">Página de destino</option><option value="sourceMedium">Fuente / medio</option><option value="channel">Grupo de canales</option></select></label><button class="primary-btn" id="ga4-save">Guardar configuración GA4</button><button class="primary-btn" id="ga4-query">Consultar GA4 ahora</button></div><p class="integration-note" id="ga4-query-status" role="status">${config.ga4?.configured?'Configuración guardada. Última sincronización: '+escapeHtml(config.ga4?.lastSync||'sin fecha'):'Configura la propiedad para habilitar consultas reales.'} El rango usa el selector global.</p><div id="ga4-query-results" class="gsc-query-results" aria-live="polite"></div></section>

 <section class="card gsc-query-panel ads-panel"><div><p class="eyebrow">GOOGLE ADS · SOLO LECTURA</p><h2>Consultar campañas y productos anunciados</h2><p>Usa el mismo ID de cliente OAuth. Se consulta una cuenta de Google Ads directamente; no se realizan cambios en campañas ni presupuestos. El proyecto de Google Cloud debe tener acceso API Explorer o superior y la cuenta debe permitirte consultar sus datos.</p></div>
 <div class="gsc-query-form">
 <label>ID de cliente de Google Ads<input id="ads-customer-id" inputmode="numeric" placeholder="123-456-7890" value="${escapeHtml(config.ads?.customerId||'')}"></label>
 <label>Tipo de informe<select id="ads-report-view"><option value="campaign">Campañas</option><option value="product">Productos de Shopping</option><option value="searchTerms">Términos de búsqueda</option></select></label>
 <button class="primary-btn" id="ads-save">Guardar configuración Ads</button><button class="primary-btn" id="ads-query">Consultar Google Ads</button>
 </div><p class="integration-note" id="ads-query-status" role="status">${config.ads?.configured?'Configuración guardada. Última consulta: '+escapeHtml(config.ads?.lastSync||'sin fecha'):'Configura el ID de cliente para consultar campañas o productos.'} Usa el periodo global de la aplicación.</p><div id="ads-query-results" class="gsc-query-results" aria-live="polite"></div></section>
 <section class="integration-grid">${INTEGRATIONS.filter(i=>!['gsc','ga4','ads'].includes(i.id)).map(i=>{const c=config[i.id]||{};return `<article class="card integration-card"><div class="integration-head"><div><span class="integration-category">${i.category}</span><h3>${i.name}</h3></div><span class="integration-status">Pendiente</span></div><p>${i.description}</p><p class="integration-note">Esta fuente todavía requiere su propia implementación y no genera datos simulados.</p></article>`}).join('')}</section>
 <section class="card integration-footer"><button class="primary-btn" id="save-integrations">Guardar preferencias</button><button class="secondary-btn" id="reset-integrations">Restablecer</button><p>El ID de cliente y la propiedad se guardan en el almacenamiento local del navegador. No se guarda el token de acceso de Google.</p></section>`;
}

export function bindIntegrations(root,toast){
 const status=()=>root.querySelector('#gsc-query-status');
 root.querySelector('#gsc-connect')?.addEventListener('click',async()=>{
   const clientId=root.querySelector('#gsc-client-id')?.value.trim()||'';const statusEl=status();
   if(!/^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)){statusEl.textContent='Introduce un ID de cliente OAuth válido terminado en .apps.googleusercontent.com.';return}
   localStorage.setItem('gssc.google.client_id',clientId);statusEl.textContent='Abriendo autorización de Google…';
   try{await getGoogleAccessToken({forceConsent:true});const config=loadIntegrationConfig();config.gsc={...config.gsc,configured:true,enabled:true,account:'Cuenta de Google autorizada'};saveIntegrationConfig(config);statusEl.textContent='Google autorizado. Ahora elige la propiedad y consulta los datos.';toast('Google Search Console conectado');root.querySelector('#gsc-connect').textContent='Volver a autorizar Google'}catch(error){statusEl.textContent=`No se pudo autorizar Google: ${error.message}. Verifica el origen autorizado y los usuarios de prueba.`}
 });
 root.querySelector('#gsc-run-query')?.addEventListener('click',async()=>{
   const statusEl=status(),resultsEl=root.querySelector('#gsc-query-results');const siteUrl=root.querySelector('#gsc-site-url')?.value.trim();
   const {startDate,endDate}=getGlobalPeriod();
   const dimensions=(root.querySelector('#gsc-dimensions')?.value||'page').split(',');const rowLimit=Number(root.querySelector('#gsc-row-limit')?.value||250);
   if(!getClientId()){statusEl.textContent='Guarda y autoriza primero el ID de cliente OAuth.';return}if(!siteUrl){statusEl.textContent='Escribe la propiedad exacta como aparece en Search Console.';return}
   statusEl.textContent='Consultando Google Search Console…';resultsEl.innerHTML='';const button=root.querySelector('#gsc-run-query');if(button)button.disabled=true;
   try{const result=await querySearchConsole({siteUrl,startDate,endDate,dimensions,rowLimit});const rows=result?.data?.rows||[];localStorage.setItem('gssc.gsc.last-query.v1',JSON.stringify({siteUrl,startDate,endDate,dimensions,rows,updatedAt:new Date().toISOString(),source:'search-console'}));let syncSummary={updated:0,matched:[]};try{syncSummary=await syncGscRowsToCatalog(rows,{siteUrl,startDate,endDate});}catch(syncError){console.warn('No se pudieron sincronizar las métricas GSC con el catálogo:',syncError)}const config=loadIntegrationConfig();config.gsc={...config.gsc,siteUrl,enabled:true,configured:true,lastSync:new Date().toISOString()};saveIntegrationConfig(config);
     statusEl.textContent=`Consulta completada: ${rows.length} filas (${startDate} a ${endDate}). ${syncSummary.updated?`${syncSummary.updated} producto(s) del catálogo actualizados automáticamente.`:'No se encontró coincidencia exacta entre las URLs consultadas y las fichas del catálogo.'} Google puede omitir filas de bajo volumen.`;
     resultsEl.innerHTML=`<div class="gsc-result-summary"><strong>${rows.length.toLocaleString('es-MX')} filas</strong><span>${escapeHtml(siteUrl)}</span></div><div class="table-wrap"><table><thead><tr><th>Dimensiones</th><th>Clics</th><th>Impresiones</th><th>CTR</th><th>Posición</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${escapeHtml((row.keys||[]).join(' · '))}</td><td>${Number(row.clicks||0).toLocaleString('es-MX')}</td><td>${Number(row.impressions||0).toLocaleString('es-MX')}</td><td>${(Number(row.ctr||0)*100).toFixed(2)}%</td><td>${Number(row.position||0).toFixed(2)}</td></tr>`).join('')||'<tr><td colspan="5">Google no devolvió filas para este rango y propiedad.</td></tr>'}</tbody></table></div>${renderGscDiagnostics(rows,{siteUrl,startDate,endDate})}<section class="card gsc-product-linker"><p class="eyebrow">FASE 24 · PRODUCTO ↔ SEARCH CONSOLE</p><h2>Diagnóstico de una ficha de producto</h2><p class="section-sub">Relaciona una ficha del catálogo activo con su URL exacta en Search Console. Compara el periodo consultado contra el periodo anterior de la misma duración. La URL debe coincidir con la que Google registra.</p><div class="gsc-product-form"><label>Producto del catálogo<select id="gsc-product-select"><option value="">Cargando catálogo…</option></select></label><label>URL exacta de la ficha<input id="gsc-product-url" type="url" placeholder="https://www.ejemplo.com/producto"></label><button class="primary-btn" id="gsc-product-compare">Analizar producto</button></div><div id="gsc-product-result" aria-live="polite"></div></section><details><summary>Ver respuesta JSON</summary><pre>${escapeHtml(JSON.stringify(result.data,null,2))}</pre></details>`;
     const productSelect=resultsEl.querySelector('#gsc-product-select'), productUrl=resultsEl.querySelector('#gsc-product-url'), productStatus=resultsEl.querySelector('#gsc-product-result');
     try{const catalog=await loadCatalog();const products=catalog?.data?.products||[];productSelect.innerHTML='<option value="">Selecciona un producto…</option>'+products.map((p,i)=>`<option value="${i}">${escapeHtml(p.Nombre_Producto||p.SKU)} · ${escapeHtml(p.SKU||'')}</option>`).join('');if(!products.length)productSelect.innerHTML='<option value="">No hay productos en el catálogo activo</option>';productSelect.onchange=()=>{const p=products[Number(productSelect.value)];if(p)productUrl.value=normalizeProductUrl(p.URL_Slug,siteUrl)};productSelect.dataset.products=JSON.stringify(products.map(p=>({SKU:p.SKU,Nombre_Producto:p.Nombre_Producto,URL_Slug:p.URL_Slug})));}catch{productSelect.innerHTML='<option value="">No se pudo leer el catálogo local</option>'}
     resultsEl.querySelector('#gsc-product-compare')?.addEventListener('click',async()=>{const out=productStatus;const url=productUrl.value.trim();if(!url){out.innerHTML='<p class="gsc-product-error">Selecciona un producto o escribe la URL exacta de su ficha.</p>';return}let parsed;try{parsed=new URL(url)}catch{out.innerHTML='<p class="gsc-product-error">La URL no es válida.</p>';return}const start=new Date(`${startDate}T00:00:00Z`),end=new Date(`${endDate}T00:00:00Z`);const days=Math.round((end-start)/86400000)+1;const prevEnd=new Date(start.getTime()-86400000),prevStart=new Date(prevEnd.getTime()-(days-1)*86400000);const fmt=d=>d.toISOString().slice(0,10);out.innerHTML='<p>Consultando la URL en ambos periodos…</p>';try{const [current,previous]=await Promise.all([querySearchConsole({siteUrl,startDate,endDate,dimensions:['page'],rowLimit:10,pageUrl:url}),querySearchConsole({siteUrl,startDate:fmt(prevStart),endDate:fmt(prevEnd),dimensions:['page'],rowLimit:10,pageUrl:url})]);const sum=r=>(r.data?.rows||[]).reduce((a,x)=>({clicks:a.clicks+Number(x.clicks||0),impressions:a.impressions+Number(x.impressions||0),positionWeighted:a.positionWeighted+Number(x.position||0)*Number(x.impressions||0)}),{clicks:0,impressions:0,positionWeighted:0});const c=sum(current),p=sum(previous);const matchedProduct=catalogProductForUrl(await loadCatalog(),url,siteUrl);if(matchedProduct){const stored=await loadCatalog();if(stored?.data?.products){const products=stored.data.products.map(product=>product.SKU===matchedProduct.SKU?{...product,Clicks_GSC:c.clicks,Impresiones_GSC:c.impressions,CTR_GSC:c.impressions?c.clicks/c.impressions:0,Posicion_GSC:c.impressions?c.positionWeighted/c.impressions:null,GSC_Periodo_Inicio:startDate,GSC_Periodo_Fin:endDate,GSC_Ultima_Actualizacion:new Date().toISOString()}:product);await saveCatalog({...stored.data,products},stored.source||'real');window.dispatchEvent(new CustomEvent('gssc:catalog-updated',{detail:{sku:matchedProduct.SKU}}));}}const ctr=x=>x.impressions?x.clicks/x.impressions:0,delta=(a,b)=>b?((a-b)/b)*100:null,fmtN=x=>x.toLocaleString('es-MX'),fmtPct=x=>`${(x*100).toFixed(2)}%`,change=(d)=>d===null?'sin base comparable':`${d>0?'+':''}${d.toFixed(1)}%`;const selected=productSelect.options[productSelect.selectedIndex]?.text||'Ficha seleccionada';const rows=[['Clics',c.clicks,p.clicks,delta(c.clicks,p.clicks)],['Impresiones',c.impressions,p.impressions,delta(c.impressions,p.impressions)],['CTR',ctr(c),ctr(p),delta(ctr(c),ctr(p))]];out.innerHTML=`<h3>${escapeHtml(selected)}</h3><p class="section-sub">Periodo actual: ${startDate} a ${endDate} · Comparación: ${fmt(prevStart)} a ${fmt(prevEnd)} · URL: ${escapeHtml(url)}</p><div class="table-wrap"><table><thead><tr><th>Métrica</th><th>Actual</th><th>Periodo anterior</th><th>Variación</th></tr></thead><tbody>${rows.map(([name,a,b,d])=>`<tr><td>${name}</td><td>${name==='CTR'?fmtPct(a):fmtN(a)}</td><td>${name==='CTR'?fmtPct(b):fmtN(b)}</td><td>${change(d)}</td></tr>`).join('')}<tr><td>Posición media</td><td>${c.impressions?(c.positionWeighted/c.impressions).toFixed(2):'—'}</td><td>${p.impressions?(p.positionWeighted/p.impressions).toFixed(2):'—'}</td><td>Menor suele ser mejor; no es causalidad</td></tr></tbody></table></div><div class="gsc-product-interpretation"><strong>Hecho</strong><p>${c.clicks<p.clicks?`La ficha recibió ${fmtN(p.clicks-c.clicks)} clics menos que en el periodo anterior.`:c.clicks>p.clicks?`La ficha recibió ${fmtN(c.clicks-p.clicks)} clics más que en el periodo anterior.`:'Los clics se mantuvieron iguales entre los periodos.'}</p><strong>Driver a investigar</strong><p>${c.impressions<p.impressions?'Las impresiones también disminuyeron; investiga cambios en demanda, indexación o visibilidad.':ctr(c)<ctr(p)?'Las impresiones no explican por sí solas el cambio; revisa el CTR y la composición de consultas.':'Contrasta impresiones, CTR y posición antes de atribuir una causa.'}</p><strong>Hipótesis (no confirmada)</strong><p>Comprueba consultas, resultados de búsqueda, cambios de contenido, indexación y estacionalidad. Search Console no demuestra por sí sola la causa comercial ni las ventas del producto.</p></div>`;}catch(error){out.innerHTML=`<p class="gsc-product-error">No se pudo comparar la ficha: ${escapeHtml(error.message)}. Comprueba que la URL pertenezca a la propiedad y que tengas permisos.</p>`}});
   }catch(error){statusEl.textContent=`No se pudo consultar Search Console: ${error.message}. Revisa permisos, propiedad, fechas y configuración OAuth.`}
   finally{if(button)button.disabled=false}
 });
 root.querySelector('#gsc-disconnect')?.addEventListener('click',()=>{disconnectGoogleSearchConsole();root.querySelector('#gsc-query-status').textContent='Conexión local borrada. Si Google conserva permisos, puedes revocarlos en tu cuenta de Google.';toast('Search Console desconectado')});
 const saveGA4=()=>{const propertyId=root.querySelector('#ga4-property-id')?.value.trim()||'';const channel=root.querySelector('#ga4-channel')?.value||'organic';if(!/^\d+$/.test(propertyId)){root.querySelector('#ga4-query-status').textContent='El Property ID debe contener solo números. No uses el ID de flujo G-...';return false}const config=loadIntegrationConfig();config.ga4={...config.ga4,propertyId,channel,enabled:true};saveIntegrationConfig(config);root.querySelector('#ga4-query-status').textContent='Configuración GA4 guardada. Autoriza Google y ejecuta una consulta real.';return true};
 root.querySelector('#ga4-save')?.addEventListener('click',()=>{if(saveGA4())toast('Configuración GA4 guardada')});
 root.querySelector('#ga4-query')?.addEventListener('click',async()=>{const statusEl=root.querySelector('#ga4-query-status'),resultsEl=root.querySelector('#ga4-query-results'),button=root.querySelector('#ga4-query');if(!saveGA4())return;const propertyId=root.querySelector('#ga4-property-id').value.trim(),channel=root.querySelector('#ga4-channel').value,dimension=root.querySelector('#ga4-dimension')?.value||'date',period=getGlobalPeriod();button.disabled=true;statusEl.textContent='Consultando Google Analytics 4…';resultsEl.innerHTML='';try{const result=await runGA4Report({propertyId,startDate:period.startDate,endDate:period.endDate,channel,dimensions:ga4DimensionConfig(dimension),metrics:[{name:'sessions'},{name:'totalUsers'},{name:'screenPageViews'},{name:'keyEvents'},{name:'purchaseRevenue'}],limit:1000});const rows=ga4RowsToObjects(result.data);const row=rows.reduce((acc,item)=>{for(const key of ['sessions','totalUsers','screenPageViews','keyEvents','purchaseRevenue'])acc[key]=Number(acc[key]||0)+Number(item[key]||0);return acc;},{});const previous=previousEquivalentRange(period);let previousRows=[];try{const previousResult=await runGA4Report({propertyId,startDate:previous.startDate,endDate:previous.endDate,channel,dimensions:[],metrics:[{name:'sessions'},{name:'totalUsers'},{name:'screenPageViews'},{name:'keyEvents'},{name:'purchaseRevenue'}],limit:1});previousRows=ga4RowsToObjects(previousResult.data)}catch{}const previousSummary=previousRows[0]||{};let productSync={updated:0,reason:'El catálogo no se modificó.'};try{const landingResult=await runGA4Report({propertyId,startDate:period.startDate,endDate:period.endDate,channel,dimensions:[{name:'landingPage'}],metrics:[{name:'sessions'},{name:'totalUsers'},{name:'screenPageViews'},{name:'keyEvents'},{name:'purchaseRevenue'}],limit:10000});productSync=await syncGA4LandingPagesToCatalog(ga4RowsToObjects(landingResult.data),{startDate:period.startDate,endDate:period.endDate,channel});}catch(syncError){productSync={updated:0,reason:syncError.message};}const metrics=[['Sesiones','sessions'],['Usuarios','totalUsers'],['Vistas de página','screenPageViews'],['Eventos clave','keyEvents'],['Ingresos de compra','purchaseRevenue']];resultsEl.innerHTML=`<div class="gsc-result-summary"><strong>GA4 · propiedad ${escapeHtml(propertyId)}</strong><span>${escapeHtml(period.startDate)} a ${escapeHtml(period.endDate)} · ${channel==='all'?'Todos los canales':'Organic Search'} · desglose: ${escapeHtml(dimension)}</span></div><div class="table-wrap"><table><thead><tr><th>Métrica</th><th>Periodo seleccionado</th><th>Periodo anterior</th><th>Variación</th></tr></thead><tbody>${metrics.map(([label,key])=>{const v=Number(row[key]||0),pv=Number(previousSummary[key]||0),delta=pv?((v-pv)/pv)*100:null;return `<tr><td>${label}</td><td>${key==='purchaseRevenue'?`${v.toLocaleString('es-MX',{maximumFractionDigits:2})} (moneda configurada en GA4)`:v.toLocaleString('es-MX')}</td><td>${pv.toLocaleString('es-MX',{maximumFractionDigits:2})}</td><td>${delta===null?'Sin base':`${delta>0?'+':''}${delta.toFixed(1)}%`}</td></tr>`}).join('')}</tbody></table></div><details><summary>Ver respuesta JSON</summary><pre>${escapeHtml(JSON.stringify(result.data,null,2))}</pre></details>`;const config=loadIntegrationConfig();config.ga4={...config.ga4,propertyId,channel,enabled:true,configured:true,lastSync:new Date().toISOString()};saveIntegrationConfig(config);localStorage.setItem(GA4_STORAGE_KEY,JSON.stringify({propertyId,channel,startDate:period.startDate,endDate:period.endDate,summary:row,rows,dimension,previousRange:previous,previousSummary,updatedAt:config.ga4.lastSync}));statusEl.textContent=`Consulta real completada. Productos vinculados: ${productSync.updated}. ${productSync.reason||''} Los valores reflejan la propiedad, canal y periodo seleccionados.`;toast('Consulta GA4 completada');}catch(error){statusEl.textContent=`No se pudo consultar GA4: ${error.message}. Revisa Property ID, permisos, API habilitada y rango.`}finally{button.disabled=false}});

 const saveAds=()=>{const customerId=(root.querySelector('#ads-customer-id')?.value||'').trim();if(!/^(?:\d{10}|\d{3}-\d{3}-\d{4})$/.test(customerId)){root.querySelector('#ads-query-status').textContent='Introduce un ID de cliente válido de 10 dígitos, con o sin guiones.';return false}const config=loadIntegrationConfig();config.ads={...config.ads,customerId,view:root.querySelector('#ads-report-view')?.value||'campaign',enabled:true};saveIntegrationConfig(config);return true};
 root.querySelector('#ads-save')?.addEventListener('click',()=>{if(saveAds())toast('Configuración de Google Ads guardada')});
 root.querySelector('#ads-query')?.addEventListener('click',async()=>{const statusEl=root.querySelector('#ads-query-status'),resultsEl=root.querySelector('#ads-query-results'),button=root.querySelector('#ads-query');if(!saveAds())return;const customerId=root.querySelector('#ads-customer-id').value.trim(),reportView=root.querySelector('#ads-report-view').value,period=getGlobalPeriod();button.disabled=true;statusEl.textContent='Consultando Google Ads en modo de solo lectura…';resultsEl.innerHTML='';try{const report=await queryGoogleAds({customerId,startDate:period.startDate,endDate:period.endDate,view:reportView});const rows=report.rows;let adsProductSync={updated:0,matched:[],unmatched:0,ambiguous:[]};if(reportView==='product'){try{const storedCatalog=await loadCatalog();const products=storedCatalog?.data?.products||[];const bySku=new Map();for(const product of products){const key=String(product.SKU??'').trim();if(!key)continue;if(!bySku.has(key))bySku.set(key,[]);bySku.get(key).push(product)}const aggregated=new Map();for(const row of rows){const seg=row.segments||{},sku=String(seg.productItemId??'').trim();if(!sku)continue;const m=row.metrics||{};const a=aggregated.get(sku)||{impressions:0,clicks:0,costMicros:0,conversions:0,conversionsValue:0,title:seg.productTitle||''};a.impressions+=Number(m.impressions||0);a.clicks+=Number(m.clicks||0);a.costMicros+=Number(m.costMicros||0);a.conversions+=Number(m.conversions||0);a.conversionsValue+=Number(m.conversionsValue||0);if(!a.title&&seg.productTitle)a.title=seg.productTitle;aggregated.set(sku,a)}const now=new Date().toISOString(),matched=new Set();const nextProducts=products.map(product=>{const sku=String(product.SKU??'').trim(),matches=bySku.get(sku)||[],metric=aggregated.get(sku);if(!metric||matches.length!==1)return product;matched.add(sku);return {...product,Ads_Impresiones:metric.impressions,Ads_Clics:metric.clicks,Ads_Gasto:metric.costMicros/1e6,Ads_Conversiones:metric.conversions,Ads_Valor_Conversiones:metric.conversionsValue,Ads_CTR:metric.impressions?metric.clicks/metric.impressions:null,Ads_CPC:metric.clicks?metric.costMicros/1e6/metric.clicks:null,Ads_CPA:metric.conversions?metric.costMicros/1e6/metric.conversions:null,Ads_ROAS:metric.costMicros?metric.conversionsValue/(metric.costMicros/1e6):null,Ads_Periodo_Inicio:period.startDate,Ads_Periodo_Fin:period.endDate,Ads_Ultima_Actualizacion:now,Ads_Estado:'sincronizado por SKU'} });const ambiguous=[...aggregated.keys()].filter(sku=>(bySku.get(sku)||[]).length>1);adsProductSync={updated:matched.size,matched:[...matched],unmatched:[...aggregated.keys()].filter(sku=>!matched.has(sku)&&!(bySku.get(sku)||[]).length).length,ambiguous};if(matched.size&&storedCatalog?.data){await saveCatalog({...storedCatalog.data,products:nextProducts},storedCatalog.source||'real');window.dispatchEvent(new CustomEvent('gssc:catalog-updated',{detail:{source:'google-ads-product',skus:[...matched],updated:matched.size,startDate:period.startDate,endDate:period.endDate}}))}}catch(syncError){console.warn('No se pudieron vincular métricas de Ads con el catálogo:',syncError);adsProductSync={...adsProductSync,error:syncError.message}}}const previous=previousEquivalentRange(period);let previousRows=[];let previousError='';try{const previousReport=await queryGoogleAds({customerId,startDate:previous.startDate,endDate:previous.endDate,view:reportView});previousRows=previousReport.rows||[]}catch(e){previousError=e.message||'No disponible'}const sum=rows.reduce((a,r)=>{const m=r.metrics||{};a.impressions+=Number(m.impressions||0);a.clicks+=Number(m.clicks||0);a.cost+=Number(m.costMicros||0)/1e6;a.conversions+=Number(m.conversions||0);a.value+=Number(m.conversionsValue||0);return a},{impressions:0,clicks:0,cost:0,conversions:0,value:0});const money=n=>n.toLocaleString('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2});const fmt=n=>Number(n||0).toLocaleString('es-MX',{maximumFractionDigits:2});const derived=(cost,clicks,conversions,value)=>({ctr:clicks?clicks/Math.max(1,0):0,cpc:clicks?cost/clicks:null,cpa:conversions?cost/conversions:null,roas:cost?value/cost:null});sum.ctr=sum.impressions?sum.clicks/sum.impressions:null;sum.cpc=sum.clicks?sum.cost/sum.clicks:null;sum.cpa=sum.conversions?sum.cost/sum.conversions:null;sum.roas=sum.cost?sum.value/sum.cost:null;const previousSum=previousRows.reduce((a,r)=>{const m=r.metrics||{};a.impressions+=Number(m.impressions||0);a.clicks+=Number(m.clicks||0);a.cost+=Number(m.costMicros||0)/1e6;a.conversions+=Number(m.conversions||0);a.value+=Number(m.conversionsValue||0);return a},{impressions:0,clicks:0,cost:0,conversions:0,value:0});previousSum.ctr=previousSum.impressions?previousSum.clicks/previousSum.impressions:null;previousSum.cpc=previousSum.clicks?previousSum.cost/previousSum.clicks:null;previousSum.cpa=previousSum.conversions?previousSum.cost/previousSum.conversions:null;previousSum.roas=previousSum.cost?previousSum.value/previousSum.cost:null;const change=(current,prior)=>prior===null||prior===undefined||prior===0?'Sin base':`${current>=prior?'+':''}${((current-prior)/Math.abs(prior)*100).toFixed(1)}%`;const records=rows.map(r=>{const m=r.metrics||{},c=r.campaign||{},seg=r.segments||{};const impressions=Number(m.impressions||0),clicks=Number(m.clicks||0),cost=Number(m.costMicros||0)/1e6,conversions=Number(m.conversions||0),value=Number(m.conversionsValue||0);return {name:reportView==='product'?(seg.productTitle||seg.productItemId||'Producto sin nombre'):reportView==='searchTerms'?(r.searchTermView?.searchTerm||'Término no disponible'):(c.name||'Campaña'),id:reportView==='product'?(seg.productItemId||''):reportView==='searchTerms'?(r.adGroup?.name||c.name||''):(c.id||''),impressions,clicks,cost,conversions,value,ctr:impressions?clicks/impressions:null,cpc:clicks?cost/clicks:null,cpa:conversions?cost/conversions:null,roas:cost?value/cost:null}});resultsEl.innerHTML=`<div class="gsc-result-summary"><strong>Google Ads · cliente ${escapeHtml(report.customerId)}</strong><span>${escapeHtml(period.startDate)} a ${escapeHtml(period.endDate)} · ${reportView==='product'?'Productos de Shopping':reportView==='searchTerms'?'Términos de búsqueda':'Campañas'} · ${rows.length} filas</span></div>${reportView==='product'?`<p class="integration-note">Vinculación con catálogo por SKU/item_id: ${adsProductSync.updated} productos actualizados · ${adsProductSync.unmatched} sin coincidencia · ${adsProductSync.ambiguous.length} SKU ambiguos. Solo se vinculan coincidencias únicas exactas; periodo ${escapeHtml(period.startDate)} a ${escapeHtml(period.endDate)}.${adsProductSync.error?` Error de sincronización: ${escapeHtml(adsProductSync.error)}`:''}</p>`:''}<div class="table-wrap"><table><thead><tr><th>Métrica</th><th>Total</th></tr></thead><tbody><tr><td>Impresiones</td><td>${fmt(sum.impressions)}</td></tr><tr><td>Clics</td><td>${fmt(sum.clicks)}</td></tr><tr><td>Gasto reportado</td><td>${money(sum.cost)}*</td></tr><tr><td>Conversiones</td><td>${fmt(sum.conversions)}</td></tr><tr><td>Valor de conversiones</td><td>${fmt(sum.value)} (moneda configurada en Ads)</td></tr><tr><td>CTR</td><td>${sum.ctr===null?'—':(sum.ctr*100).toFixed(2)+'%'}</td></tr><tr><td>CPC promedio</td><td>${sum.cpc===null?'—':money(sum.cpc)}</td></tr><tr><td>CPA (costo por conversión)</td><td>${sum.cpa===null?'—':money(sum.cpa)}</td></tr><tr><td>ROAS (valor de conversión / gasto)</td><td>${sum.roas===null?'—':sum.roas.toFixed(2)+'x'}</td></tr></tbody></table></div><h3>Comparación con el periodo anterior equivalente</h3><p class="integration-note">Periodo actual: ${escapeHtml(period.startDate)} a ${escapeHtml(period.endDate)} · Periodo anterior: ${escapeHtml(previous.startDate)} a ${escapeHtml(previous.endDate)}${previousError?` · Aviso: ${escapeHtml(previousError)}`:''}</p><div class="table-wrap"><table><thead><tr><th>KPI</th><th>Actual</th><th>Anterior</th><th>Variación</th></tr></thead><tbody>${[['Impresiones','impressions'],['Clics','clicks'],['Gasto','cost'],['Conversiones','conversions'],['Valor de conversiones','value'],['CTR','ctr'],['CPC','cpc'],['CPA','cpa'],['ROAS','roas']].map(([label,key])=>{const a=sum[key],b=previousSum[key],isRate=['ctr'].includes(key);const show=v=>v===null||v===undefined?'—':isRate?`${(v*100).toFixed(2)}%`:key==='roas'?`${v.toFixed(2)}x`:['cost','cpc','cpa'].includes(key)?money(v):fmt(v);return `<tr><td>${label}</td><td>${show(a)}</td><td>${show(b)}</td><td>${change(a,b)}</td></tr>`}).join('')}</tbody></table></div><div class="table-wrap"><table><thead><tr><th>${reportView==='product'?'Producto':reportView==='searchTerms'?'Término de búsqueda':'Campaña'}</th><th>${reportView==='searchTerms'?'Grupo de anuncios': 'ID'}</th><th>Impresiones</th><th>Clics</th><th>Gasto</th><th>CTR</th><th>CPC</th><th>Conversiones</th><th>CPA</th><th>Valor conv.</th><th>ROAS</th></tr></thead><tbody>${records.map(r=>`<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.id)}</td><td>${fmt(r.impressions)}</td><td>${fmt(r.clicks)}</td><td>${money(r.cost)}</td><td>${r.ctr===null?'—':(r.ctr*100).toFixed(2)+'%'}</td><td>${r.cpc===null?'—':money(r.cpc)}</td><td>${fmt(r.conversions)}</td><td>${r.cpa===null?'—':money(r.cpa)}</td><td>${fmt(r.value)}</td><td>${r.roas===null?'—':r.roas.toFixed(2)+'x'}</td></tr>`).join('')}</tbody></table></div><p class="integration-note">* Google Ads devuelve el gasto en micros; el formato MXN es solo orientativo, confirma la moneda real de la cuenta antes de comparar con ingresos. CTR = clics/impresiones; CPC = gasto/clics; CPA = gasto/conversiones; ROAS = valor de conversiones/gasto. Si el denominador es cero, se muestra ‘—’; ROAS no equivale necesariamente a rentabilidad. Los productos requieren campañas de Shopping con datos disponibles.</p><details><summary>Ver respuesta técnica</summary><pre>${escapeHtml(JSON.stringify(report.raw,null,2))}</pre></details>`;const config=loadIntegrationConfig();config.ads={...config.ads,customerId,view:reportView,enabled:true,configured:true,lastSync:new Date().toISOString()};saveIntegrationConfig(config);localStorage.setItem(ADS_STORAGE_KEY,JSON.stringify({customerId,view:reportView,startDate:period.startDate,endDate:period.endDate,summary:sum,rows:records,updatedAt:config.ads.lastSync}));statusEl.textContent=`Consulta completada: ${rows.length} filas reales. No se modificó ninguna campaña.`;toast('Consulta Google Ads completada')}catch(error){statusEl.textContent=`No se pudo consultar Google Ads: ${error.message}. Verifica el acceso API del proyecto, el permiso adwords, el ID de cliente y que la cuenta sea accesible para el usuario autorizado.`}finally{button.disabled=false}});

 root.querySelector('#save-integrations')?.addEventListener('click',()=>{const config=loadIntegrationConfig();config.gsc={...config.gsc,siteUrl:root.querySelector('#gsc-site-url')?.value.trim()||''};const propertyId=root.querySelector('#ga4-property-id')?.value.trim()||'';if(propertyId&&/^\d+$/.test(propertyId))config.ga4={...config.ga4,propertyId,channel:root.querySelector('#ga4-channel')?.value||'organic',enabled:true};saveIntegrationConfig(config);toast('Preferencias guardadas')});
 root.querySelector('#reset-integrations')?.addEventListener('click',()=>{resetIntegrationConfig();localStorage.removeItem('gssc.google.client_id');accessToken=null;tokenExpiresAt=0;root.innerHTML=renderIntegrations(loadIntegrationConfig());bindIntegrations(root,toast);toast('Configuración restablecida')});
}
