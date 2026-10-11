import {renderGscDiagnostics} from './gscDiagnostics.js';
import {loadCatalog,saveCatalog} from './storage.js';
const STORAGE_KEY='gssc.integration.config.v2';
const GOOGLE_GIS_URL='https://accounts.google.com/gsi/client';
const GSC_SCOPE='https://www.googleapis.com/auth/webmasters.readonly';
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
    const client=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:GSC_SCOPE,include_granted_scopes:true,callback:(response)=>{
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
export async function runGA4Report({connectionId,propertyId,startDate,endDate,dimensions=[{name:'landingPagePlusQueryString'}],metrics=[{name:'sessions'},{name:'keyEvents'},{name:'totalRevenue'}],limit=1000}){
  return providerRequest('/api/sync/ga4/report',{connection_id:connectionId,property_id:String(propertyId),start_date:startDate,end_date:endDate,dimensions,metrics,limit});
}
async function providerRequest(path,payload){throw new Error('Esta fuente aún requiere una integración propia; la Fase 22 sin backend habilita únicamente Search Console.')}
export async function getGatewayStatus(){return {available:false,error:'La Fase 22 usa OAuth en navegador y no necesita gateway para Search Console.',google:{configured:false,sources:[]},cohere:{server_configured:false},production_ready:false}}


// Sincronización central: ejecuta las fuentes realmente disponibles y devuelve un informe por fuente.
export async function syncAllSources({onProgress=()=>{}}={}){
  const config=loadIntegrationConfig();
  const report=[];
  onProgress('Preparando sincronización…');
  const gsc=config.gsc||{};
  if(!gsc.siteUrl){
    report.push({id:'gsc',name:'Google Search Console',status:'needs_setup',message:'Configura la propiedad en Integraciones antes de sincronizar.'});
  }else{
    try{
      onProgress('Consultando Google Search Console…');
      // Search Console suele tener un retraso de algunos días; excluir los últimos 3 días evita interpretar datos incompletos como definitivos.
      const end=new Date();end.setUTCDate(end.getUTCDate()-3);
      const start=new Date(end);start.setUTCDate(start.getUTCDate()-13);
      const fmt=d=>d.toISOString().slice(0,10);
      const startDate=fmt(start),endDate=fmt(end);
      const result=await querySearchConsole({siteUrl:gsc.siteUrl,startDate,endDate,dimensions:['page'],rowLimit:25000});
      const rows=result?.data?.rows||[];
      const summary=await syncGscRowsToCatalog(rows,{siteUrl:gsc.siteUrl,startDate,endDate});
      config.gsc={...gsc,enabled:true,configured:true,lastSync:new Date().toISOString()};
      saveIntegrationConfig(config);
      report.push({id:'gsc',name:'Google Search Console',status:'success',message:`${rows.length} filas consultadas; ${summary.updated} producto(s) actualizado(s). Periodo ${startDate} a ${endDate}.`,rows:rows.length,updated:summary.updated,startDate,endDate});
    }catch(error){
      report.push({id:'gsc',name:'Google Search Console',status:'error',message:error?.message||'Error desconocido al consultar Search Console.'});
    }
  }
  for(const [id,name,detail] of [
    ['ga4','Google Analytics 4','La integración ejecutable requiere configurar un conector seguro de GA4; todavía no está implementado en esta versión frontend-only.'],
    ['merchant','Google Merchant Center','La sincronización de Merchant Center requiere implementar su API y autorización; todavía no está disponible.'],
    ['ads','Google Ads','La sincronización de Google Ads requiere un conector autorizado y backend; todavía no está disponible.'],
    ['trends','Google Trends','No hay una fuente/API de Trends configurada en esta versión; no se simularán datos.']
  ]) report.push({id,name,status:'not_implemented',message:detail});
  onProgress('Sincronización finalizada.');
  return {completedAt:new Date().toISOString(),report};
}

function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function normalizeProductUrl(value,siteUrl){const raw=String(value||'').trim();if(!raw)return '';try{if(/^https?:\/\//i.test(raw))return new URL(raw).href;const base=/^https?:\/\//i.test(siteUrl)?siteUrl:'https://'+String(siteUrl||'').replace(/^sc-domain:/,'');return new URL(raw.replace(/^\/+/,''),base.endsWith('/')?base:base+'/').href}catch{return raw}}
function canonicalPageUrl(value,siteUrl){try{const u=new URL(normalizeProductUrl(value,siteUrl));u.hash='';u.search='';return u.href.replace(/\/$/,'').toLowerCase()}catch{return String(value||'').trim().replace(/\/$/,'').toLowerCase()}}
function catalogProductForUrl(catalog,url,siteUrl){return (catalog?.data?.products||[]).find(p=>canonicalPageUrl(p.URL_Slug,siteUrl)===canonicalPageUrl(url,siteUrl))||null}

async function syncGscRowsToCatalog(rows,{siteUrl,startDate,endDate}={}){
  const stored=await loadCatalog();
  const products=stored?.data?.products;
  if(!Array.isArray(products)||!products.length)return {updated:0,matched:[]};
  const byUrl=new Map();
  for(const row of rows||[]){
    const keys=row.keys||[];
    // GSC places the page dimension at the end for supported combinations such as query,page/date,page.
    const rawUrl=keys.find(key=>/^https?:\/\//i.test(String(key||'')));
    if(!rawUrl)continue;
    const key=canonicalPageUrl(rawUrl,siteUrl);
    const prior=byUrl.get(key)||{clicks:0,impressions:0,positionWeighted:0};
    const impressions=Number(row.impressions||0);
    prior.clicks+=Number(row.clicks||0);prior.impressions+=impressions;prior.positionWeighted+=Number(row.position||0)*impressions;
    byUrl.set(key,prior);
  }
  let updated=0;const matched=[];const now=new Date().toISOString();
  const nextProducts=products.map(product=>{
    const metric=byUrl.get(canonicalPageUrl(product.URL_Slug,siteUrl));
    if(!metric)return product;
    updated++;matched.push(product.SKU);
    return {...product,Clicks_GSC:metric.clicks,Impresiones_GSC:metric.impressions,CTR_GSC:metric.impressions?metric.clicks/metric.impressions:0,Posicion_GSC:metric.impressions?metric.positionWeighted/metric.impressions:null,GSC_Periodo_Inicio:startDate,GSC_Periodo_Fin:endDate,GSC_Ultima_Actualizacion:now};
  });
  if(updated){await saveCatalog({...stored.data,products:nextProducts},stored.source||'real');window.dispatchEvent(new CustomEvent('gssc:catalog-updated',{detail:{skus:matched,source:'gsc-query'}}));}
  return {updated,matched};
}


export function renderIntegrations(config=loadIntegrationConfig(),gatewayStatus=null){
 const clientId=getClientId();const connected=Boolean(config.gsc?.configured);
 return `<section class="card integration-intro"><div><p class="eyebrow">INTEGRACIÓN DIRECTA · SIN BACKEND</p><h2>Centro de integraciones</h2><p>Search Console se autoriza desde este navegador con Google Identity Services. El Client Secret nunca se utiliza ni se guarda en el frontend.</p></div><div class="integration-contract"><strong>Fase 22</strong><span>OAuth emergente</span></div></section>
 <section class="card gsc-query-panel"><div><p class="eyebrow">SEARCH CONSOLE · CONSULTA REAL</p><h2>Conectar y consultar rendimiento orgánico</h2><p>Usa un ID de cliente OAuth de tipo Aplicación web, con el origen autorizado <code>https://appalex47-lab.github.io</code>. No pegues aquí el secreto del cliente.</p></div>
 <div class="gsc-query-form"><label>ID de cliente OAuth<input id="gsc-client-id" type="text" autocomplete="off" placeholder="...apps.googleusercontent.com" value="${escapeHtml(clientId)}"></label><button class="primary-btn" id="gsc-connect">${connected?'Volver a autorizar Google':'Conectar con Google'}</button>
 <label>Propiedad de Search Console<input id="gsc-site-url" type="text" placeholder="https://www.tudominio.com/ o sc-domain:tudominio.com" value="${escapeHtml(config.gsc?.siteUrl||'')}"></label>
 <label>Fecha inicial<input id="gsc-start-date" type="date" value="${new Date(Date.now()-14*86400000).toISOString().slice(0,10)}"></label>
 <label>Fecha final<input id="gsc-end-date" type="date" value="${new Date(Date.now()-3*86400000).toISOString().slice(0,10)}"></label>
 <label>Dimensiones<select id="gsc-dimensions"><option value="page">Página</option><option value="query,page">Consulta + página</option><option value="date,page">Fecha + página</option><option value="country,device,page">País + dispositivo + página</option></select></label>
 <label>Límite de filas<select id="gsc-row-limit"><option value="250">250</option><option value="1000">1,000</option><option value="5000">5,000</option></select></label><button class="primary-btn" id="gsc-run-query">Consultar Search Console</button><button class="secondary-btn" id="gsc-disconnect">Desconectar</button></div>
 <p class="integration-note" id="gsc-query-status" role="status">${connected?'Autorización registrada en esta sesión.':'Configura el ID de cliente y autoriza tu cuenta de Google.'} El token de acceso solo se mantiene en memoria y puede caducar.</p><div id="gsc-query-results" class="gsc-query-results" aria-live="polite"></div></section>
 <section class="integration-grid">${INTEGRATIONS.filter(i=>i.id!=='gsc').map(i=>{const c=config[i.id]||{};return `<article class="card integration-card"><div class="integration-head"><div><span class="integration-category">${i.category}</span><h3>${i.name}</h3></div><span class="integration-status">Pendiente</span></div><p>${i.description}</p><p class="integration-note">Esta fuente no forma parte de la conexión directa de Search Console de la Fase 22.</p></article>`}).join('')}</section>
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
   const startDate=root.querySelector('#gsc-start-date')?.value,endDate=root.querySelector('#gsc-end-date')?.value;
   const dimensions=(root.querySelector('#gsc-dimensions')?.value||'page').split(',');const rowLimit=Number(root.querySelector('#gsc-row-limit')?.value||250);
   if(!getClientId()){statusEl.textContent='Guarda y autoriza primero el ID de cliente OAuth.';return}if(!siteUrl){statusEl.textContent='Escribe la propiedad exacta como aparece en Search Console.';return}
   if(!startDate||!endDate||startDate>endDate){statusEl.textContent='Revisa el rango de fechas.';return}
   statusEl.textContent='Consultando Google Search Console…';resultsEl.innerHTML='';const button=root.querySelector('#gsc-run-query');if(button)button.disabled=true;
   try{const result=await querySearchConsole({siteUrl,startDate,endDate,dimensions,rowLimit});const rows=result?.data?.rows||[];let syncSummary={updated:0,matched:[]};try{syncSummary=await syncGscRowsToCatalog(rows,{siteUrl,startDate,endDate});}catch(syncError){console.warn('No se pudieron sincronizar las métricas GSC con el catálogo:',syncError)}const config=loadIntegrationConfig();config.gsc={...config.gsc,siteUrl,enabled:true,configured:true,lastSync:new Date().toISOString()};saveIntegrationConfig(config);
     statusEl.textContent=`Consulta completada: ${rows.length} filas (${startDate} a ${endDate}). ${syncSummary.updated?`${syncSummary.updated} producto(s) del catálogo actualizados automáticamente.`:'No se encontró coincidencia exacta entre las URLs consultadas y las fichas del catálogo.'} Google puede omitir filas de bajo volumen.`;
     resultsEl.innerHTML=`<div class="gsc-result-summary"><strong>${rows.length.toLocaleString('es-MX')} filas</strong><span>${escapeHtml(siteUrl)}</span></div><div class="table-wrap"><table><thead><tr><th>Dimensiones</th><th>Clics</th><th>Impresiones</th><th>CTR</th><th>Posición</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${escapeHtml((row.keys||[]).join(' · '))}</td><td>${Number(row.clicks||0).toLocaleString('es-MX')}</td><td>${Number(row.impressions||0).toLocaleString('es-MX')}</td><td>${(Number(row.ctr||0)*100).toFixed(2)}%</td><td>${Number(row.position||0).toFixed(2)}</td></tr>`).join('')||'<tr><td colspan="5">Google no devolvió filas para este rango y propiedad.</td></tr>'}</tbody></table></div>${renderGscDiagnostics(rows,{siteUrl,startDate,endDate})}<section class="card gsc-product-linker"><p class="eyebrow">FASE 24 · PRODUCTO ↔ SEARCH CONSOLE</p><h2>Diagnóstico de una ficha de producto</h2><p class="section-sub">Relaciona una ficha del catálogo activo con su URL exacta en Search Console. Compara el periodo consultado contra el periodo anterior de la misma duración. La URL debe coincidir con la que Google registra.</p><div class="gsc-product-form"><label>Producto del catálogo<select id="gsc-product-select"><option value="">Cargando catálogo…</option></select></label><label>URL exacta de la ficha<input id="gsc-product-url" type="url" placeholder="https://www.ejemplo.com/producto"></label><button class="primary-btn" id="gsc-product-compare">Analizar producto</button></div><div id="gsc-product-result" aria-live="polite"></div></section><details><summary>Ver respuesta JSON</summary><pre>${escapeHtml(JSON.stringify(result.data,null,2))}</pre></details>`;
     const productSelect=resultsEl.querySelector('#gsc-product-select'), productUrl=resultsEl.querySelector('#gsc-product-url'), productStatus=resultsEl.querySelector('#gsc-product-result');
     try{const catalog=await loadCatalog();const products=catalog?.data?.products||[];productSelect.innerHTML='<option value="">Selecciona un producto…</option>'+products.map((p,i)=>`<option value="${i}">${escapeHtml(p.Nombre_Producto||p.SKU)} · ${escapeHtml(p.SKU||'')}</option>`).join('');if(!products.length)productSelect.innerHTML='<option value="">No hay productos en el catálogo activo</option>';productSelect.onchange=()=>{const p=products[Number(productSelect.value)];if(p)productUrl.value=normalizeProductUrl(p.URL_Slug,siteUrl)};productSelect.dataset.products=JSON.stringify(products.map(p=>({SKU:p.SKU,Nombre_Producto:p.Nombre_Producto,URL_Slug:p.URL_Slug})));}catch{productSelect.innerHTML='<option value="">No se pudo leer el catálogo local</option>'}
     resultsEl.querySelector('#gsc-product-compare')?.addEventListener('click',async()=>{const out=productStatus;const url=productUrl.value.trim();if(!url){out.innerHTML='<p class="gsc-product-error">Selecciona un producto o escribe la URL exacta de su ficha.</p>';return}let parsed;try{parsed=new URL(url)}catch{out.innerHTML='<p class="gsc-product-error">La URL no es válida.</p>';return}const start=new Date(`${startDate}T00:00:00Z`),end=new Date(`${endDate}T00:00:00Z`);const days=Math.round((end-start)/86400000)+1;const prevEnd=new Date(start.getTime()-86400000),prevStart=new Date(prevEnd.getTime()-(days-1)*86400000);const fmt=d=>d.toISOString().slice(0,10);out.innerHTML='<p>Consultando la URL en ambos periodos…</p>';try{const [current,previous]=await Promise.all([querySearchConsole({siteUrl,startDate,endDate,dimensions:['page'],rowLimit:10,pageUrl:url}),querySearchConsole({siteUrl,startDate:fmt(prevStart),endDate:fmt(prevEnd),dimensions:['page'],rowLimit:10,pageUrl:url})]);const sum=r=>(r.data?.rows||[]).reduce((a,x)=>({clicks:a.clicks+Number(x.clicks||0),impressions:a.impressions+Number(x.impressions||0),positionWeighted:a.positionWeighted+Number(x.position||0)*Number(x.impressions||0)}),{clicks:0,impressions:0,positionWeighted:0});const c=sum(current),p=sum(previous);const matchedProduct=catalogProductForUrl(await loadCatalog(),url,siteUrl);if(matchedProduct){const stored=await loadCatalog();if(stored?.data?.products){const products=stored.data.products.map(product=>product.SKU===matchedProduct.SKU?{...product,Clicks_GSC:c.clicks,Impresiones_GSC:c.impressions,CTR_GSC:c.impressions?c.clicks/c.impressions:0,Posicion_GSC:c.impressions?c.positionWeighted/c.impressions:null,GSC_Periodo_Inicio:startDate,GSC_Periodo_Fin:endDate,GSC_Ultima_Actualizacion:new Date().toISOString()}:product);await saveCatalog({...stored.data,products},stored.source||'real');window.dispatchEvent(new CustomEvent('gssc:catalog-updated',{detail:{sku:matchedProduct.SKU}}));}}const ctr=x=>x.impressions?x.clicks/x.impressions:0,delta=(a,b)=>b?((a-b)/b)*100:null,fmtN=x=>x.toLocaleString('es-MX'),fmtPct=x=>`${(x*100).toFixed(2)}%`,change=(d)=>d===null?'sin base comparable':`${d>0?'+':''}${d.toFixed(1)}%`;const selected=productSelect.options[productSelect.selectedIndex]?.text||'Ficha seleccionada';const rows=[['Clics',c.clicks,p.clicks,delta(c.clicks,p.clicks)],['Impresiones',c.impressions,p.impressions,delta(c.impressions,p.impressions)],['CTR',ctr(c),ctr(p),delta(ctr(c),ctr(p))]];out.innerHTML=`<h3>${escapeHtml(selected)}</h3><p class="section-sub">Periodo actual: ${startDate} a ${endDate} · Comparación: ${fmt(prevStart)} a ${fmt(prevEnd)} · URL: ${escapeHtml(url)}</p><div class="table-wrap"><table><thead><tr><th>Métrica</th><th>Actual</th><th>Periodo anterior</th><th>Variación</th></tr></thead><tbody>${rows.map(([name,a,b,d])=>`<tr><td>${name}</td><td>${name==='CTR'?fmtPct(a):fmtN(a)}</td><td>${name==='CTR'?fmtPct(b):fmtN(b)}</td><td>${change(d)}</td></tr>`).join('')}<tr><td>Posición media</td><td>${c.impressions?(c.positionWeighted/c.impressions).toFixed(2):'—'}</td><td>${p.impressions?(p.positionWeighted/p.impressions).toFixed(2):'—'}</td><td>Menor suele ser mejor; no es causalidad</td></tr></tbody></table></div><div class="gsc-product-interpretation"><strong>Hecho</strong><p>${c.clicks<p.clicks?`La ficha recibió ${fmtN(p.clicks-c.clicks)} clics menos que en el periodo anterior.`:c.clicks>p.clicks?`La ficha recibió ${fmtN(c.clicks-p.clicks)} clics más que en el periodo anterior.`:'Los clics se mantuvieron iguales entre los periodos.'}</p><strong>Driver a investigar</strong><p>${c.impressions<p.impressions?'Las impresiones también disminuyeron; investiga cambios en demanda, indexación o visibilidad.':ctr(c)<ctr(p)?'Las impresiones no explican por sí solas el cambio; revisa el CTR y la composición de consultas.':'Contrasta impresiones, CTR y posición antes de atribuir una causa.'}</p><strong>Hipótesis (no confirmada)</strong><p>Comprueba consultas, resultados de búsqueda, cambios de contenido, indexación y estacionalidad. Search Console no demuestra por sí sola la causa comercial ni las ventas del producto.</p></div>`;}catch(error){out.innerHTML=`<p class="gsc-product-error">No se pudo comparar la ficha: ${escapeHtml(error.message)}. Comprueba que la URL pertenezca a la propiedad y que tengas permisos.</p>`}});
   }catch(error){statusEl.textContent=`No se pudo consultar Search Console: ${error.message}. Revisa permisos, propiedad, fechas y configuración OAuth.`}
   finally{if(button)button.disabled=false}
 });
 root.querySelector('#gsc-disconnect')?.addEventListener('click',()=>{disconnectGoogleSearchConsole();root.querySelector('#gsc-query-status').textContent='Conexión local borrada. Si Google conserva permisos, puedes revocarlos en tu cuenta de Google.';toast('Search Console desconectado')});
 root.querySelector('#save-integrations')?.addEventListener('click',()=>{const config=loadIntegrationConfig();config.gsc={...config.gsc,siteUrl:root.querySelector('#gsc-site-url')?.value.trim()||''};saveIntegrationConfig(config);toast('Preferencias guardadas')});
 root.querySelector('#reset-integrations')?.addEventListener('click',()=>{resetIntegrationConfig();localStorage.removeItem('gssc.google.client_id');accessToken=null;tokenExpiresAt=0;root.innerHTML=renderIntegrations(loadIntegrationConfig());bindIntegrations(root,toast);toast('Configuración restablecida')});
}
