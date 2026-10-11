const STORAGE_KEY='gssc.integration.config.v2';
export const GATEWAY_URL=localStorage.getItem('gssc.gateway.url')||'http://127.0.0.1:8787';

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

export async function querySearchConsole({connectionId,siteUrl,startDate,endDate,dimensions=['page'],rowLimit=250}){
  return providerRequest('/api/sync/gsc/query',{connection_id:connectionId,site_url:siteUrl,start_date:startDate,end_date:endDate,dimensions,row_limit:rowLimit});
}
export async function runGA4Report({connectionId,propertyId,startDate,endDate,dimensions=[{name:'landingPagePlusQueryString'}],metrics=[{name:'sessions'},{name:'keyEvents'},{name:'totalRevenue'}],limit=1000}){
  return providerRequest('/api/sync/ga4/report',{connection_id:connectionId,property_id:String(propertyId),start_date:startDate,end_date:endDate,dimensions,metrics,limit});
}
async function providerRequest(path,payload){
  const response=await fetch(`${GATEWAY_URL}${path}`,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload)});
  const data=await response.json(); if(!response.ok) throw new Error(data.message||data.error||`Gateway HTTP ${response.status}`); return data;
}

export async function getGatewayStatus(){
  try{const response=await fetch(`${GATEWAY_URL}/api/integrations/status`,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Gateway HTTP ${response.status}`);return await response.json()}
  catch(error){return {available:false,error:error.message,google:{configured:false,sources:[]},cohere:{server_configured:false},production_ready:false}}
}

function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

export function renderIntegrations(config=loadIntegrationConfig(),gatewayStatus=null){
 const gatewayReady=gatewayStatus?.available!==false && gatewayStatus?.google;
 return `<section class="card integration-intro"><div><p class="eyebrow">SECURE INTEGRATION LAYER</p><h2>Centro de integraciones</h2><p>Las conexiones reales pasan por el gateway seguro. El navegador no recibe client secrets ni tokens de Google.</p></div><div class="integration-contract"><strong>Fase 14</strong><span>${gatewayReady?'Gateway detectado':'Gateway no disponible'}</span></div></section>
 <section class="card gateway-status"><div><strong>Gateway seguro</strong><p>${gatewayReady?'La capa de conexión responde correctamente.':'Inicia el gateway local para habilitar el botón Conectar.'}</p></div><span class="integration-status ${gatewayReady?'ready':''}">${gatewayReady?'Disponible':'No disponible'}</span></section>
 <section class="card gsc-query-panel">
 <div><p class="eyebrow">SEARCH CONSOLE · CONSULTA REAL</p><h2>Consultar rendimiento orgánico</h2>
 <p>Autoriza Google, indica la propiedad exacta de Search Console y consulta clics, impresiones, CTR y posición. La consulta es de solo lectura.</p></div>
 <div class="gsc-query-form">
 <label>Propiedad de Search Console<input id="gsc-site-url" type="text" placeholder="https://www.tudominio.com/ o sc-domain:tudominio.com" value="${escapeHtml(loadIntegrationConfig().gsc?.siteUrl||'')}"></label>
 <label>Fecha inicial<input id="gsc-start-date" type="date" value="${new Date(Date.now()-14*86400000).toISOString().slice(0,10)}"></label>
 <label>Fecha final<input id="gsc-end-date" type="date" value="${new Date(Date.now()-3*86400000).toISOString().slice(0,10)}"></label>
 <label>Granularidad<select id="gsc-dimensions"><option value="page">Página (para métricas por producto)</option><option value="query,page">Consulta + página</option><option value="date,page">Fecha + página</option><option value="country,device,page">País + dispositivo + página</option></select></label>
 <label>Límite de filas<select id="gsc-row-limit"><option value="250">250</option><option value="1000">1,000</option><option value="5000">5,000</option></select></label>
 <button class="primary-btn" id="gsc-run-query" ${loadIntegrationConfig().gsc?.connectionId?'':'disabled'}>Consultar Search Console</button>
 </div>
 <p class="integration-note" id="gsc-query-status" role="status">La consulta requiere una conexión OAuth vigente y una propiedad a la que tu cuenta tenga acceso.</p>
 <div id="gsc-query-results" class="gsc-query-results" aria-live="polite"></div>
 </section>
 <section class="integration-grid">${INTEGRATIONS.map(i=>{const c=config[i.id]||{};const isGoogle=i.provider==='google';return `<article class="card integration-card"><div class="integration-head"><div><span class="integration-category">${i.category}</span><h3>${i.name}</h3></div><span class="integration-status ${c.configured?'ready':''}">${c.configured?'Conectada':'Pendiente'}</span></div><p>${i.description}</p><label><span>Activar fuente</span><input type="checkbox" data-int-enabled="${i.id}" ${c.enabled?'checked':''}></label><label>Identificador / cuenta<input type="text" data-int-account="${i.id}" value="${escapeHtml(c.account||'')}" placeholder="Se seleccionará al conectar" ${isGoogle?'readonly':''}></label><label>Endpoint / proyecto<input type="text" data-int-endpoint="${i.id}" value="${escapeHtml(c.endpoint||'')}" placeholder="Gestionado por el gateway" ${isGoogle?'readonly':''}></label>${isGoogle?`<button class="primary-btn" data-connect-google="${i.id}" ${gatewayReady?'':'disabled'}>${c.configured?'Reconectar':'Conectar con Google'}</button>`:'<button class="secondary-btn" disabled>Se conectará en una fase posterior</button>'}<p class="integration-note">${c.configured?'Conexión local registrada.':'No hay una conexión real registrada todavía.'}</p></article>`}).join('')}</section>
 <section class="card integration-footer"><button class="primary-btn" id="save-integrations">Guardar preferencias</button><button class="secondary-btn" id="reset-integrations">Restablecer</button><p>Los metadatos no secretos pueden persistirse localmente. Los secretos y tokens deben permanecer en el gateway/almacén seguro.</p></section>`;
}

export function bindIntegrations(root,toast){
 if(!window.__gsscOAuthListener){
   window.__gsscOAuthListener=true;
   window.addEventListener('message',(event)=>{
     if(event.origin!==new URL(GATEWAY_URL).origin || event.data?.type!=='gssc:google-connected') return;
     const config=loadIntegrationConfig(); const source=event.data.source;
     if(!config[source]) return;
     config[source]={...config[source],configured:true,connectionId:event.data.connectionId,lastSync:null};
     saveIntegrationConfig(config); toast(`Google conectado: ${source.toUpperCase()}`);
     window.dispatchEvent(new CustomEvent('gssc:integration-connected',{detail:{source}}));
     if (source === 'gsc') render();
   });
 }
 const connect=async(source)=>{
   try{
     const response=await fetch(`${GATEWAY_URL}/api/oauth/google/start/${encodeURIComponent(source)}`,{headers:{Accept:'application/json'}});
     const payload=await response.json();
     if(!response.ok)throw new Error(payload.message||payload.error||`Gateway HTTP ${response.status}`);
     const popup=window.open(payload.authorization_url,'gssc-google-oauth','width=520,height=720');
     if(!popup){toast('El navegador bloqueó la ventana OAuth. Permite ventanas emergentes para continuar.');return}
     toast('Autorización de Google iniciada');
   }catch(error){toast(`No se pudo iniciar Google: ${error.message}`)}
 };
 root.querySelectorAll('[data-connect-google]').forEach(button=>button.addEventListener('click',()=>connect(button.dataset.connectGoogle)));
 root.querySelector('#save-integrations')?.addEventListener('click',()=>{
   const config=loadIntegrationConfig();
   INTEGRATIONS.forEach(i=>{config[i.id]={...config[i.id],enabled:root.querySelector(`[data-int-enabled="${i.id}"]`)?.checked||false,account:root.querySelector(`[data-int-account="${i.id}"]`)?.value.trim()||config[i.id]?.account||'',endpoint:root.querySelector(`[data-int-endpoint="${i.id}"]`)?.value.trim()||config[i.id]?.endpoint||''};});
   saveIntegrationConfig(config);toast('Preferencias de integraciones guardadas');
 });
 root.querySelector('#gsc-run-query')?.addEventListener('click',async()=>{
   const statusEl=root.querySelector('#gsc-query-status'), resultsEl=root.querySelector('#gsc-query-results');
   const config=loadIntegrationConfig(), connectionId=config.gsc?.connectionId;
   const siteUrl=root.querySelector('#gsc-site-url')?.value.trim();
   const startDate=root.querySelector('#gsc-start-date')?.value, endDate=root.querySelector('#gsc-end-date')?.value;
   const dimensions=(root.querySelector('#gsc-dimensions')?.value||'page').split(',');
   const rowLimit=Number(root.querySelector('#gsc-row-limit')?.value||250);
   if(!connectionId){statusEl.textContent='Primero conecta Google Search Console mediante OAuth.';return}
   if(!siteUrl){statusEl.textContent='Escribe la propiedad exacta de Search Console.';return}
   if(!startDate||!endDate||startDate>endDate){statusEl.textContent='Revisa el rango de fechas.';return}
   statusEl.textContent='Consultando Google Search Console…'; resultsEl.innerHTML='';
   const button=root.querySelector('#gsc-run-query'); if(button)button.disabled=true;
   try{
     config.gsc={...config.gsc,siteUrl,enabled:true};saveIntegrationConfig(config);
     const result=await querySearchConsole({connectionId,siteUrl,startDate,endDate,dimensions,rowLimit});
     const rows=result?.data?.rows||[];
     statusEl.textContent=`Consulta completada: ${rows.length} filas devueltas (${startDate} a ${endDate}). Google puede limitar las filas disponibles.`;
     resultsEl.innerHTML=`<div class="gsc-result-summary"><strong>${rows.length.toLocaleString('es-MX')} filas</strong><span>${escapeHtml(siteUrl)}</span></div><div class="table-wrap"><table><thead><tr><th>Dimensiones</th><th>Clics</th><th>Impresiones</th><th>CTR</th><th>Posición</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${escapeHtml((row.keys||[]).join(' · '))}</td><td>${Number(row.clicks||0).toLocaleString('es-MX')}</td><td>${Number(row.impressions||0).toLocaleString('es-MX')}</td><td>${(Number(row.ctr||0)*100).toFixed(2)}%</td><td>${Number(row.position||0).toFixed(2)}</td></tr>`).join('')||'<tr><td colspan="5">Google no devolvió filas para este rango y propiedad.</td></tr>'}</tbody></table></div><details><summary>Ver respuesta JSON</summary><pre>${escapeHtml(JSON.stringify(result.data,null,2))}</pre></details>`;
   }catch(error){statusEl.textContent=`No se pudo consultar Search Console: ${error.message}. Verifica OAuth, permisos, propiedad y fechas.`}
   finally{if(button)button.disabled=false}
 });
 root.querySelector('#reset-integrations')?.addEventListener('click',()=>{resetIntegrationConfig();render();toast('Configuración restablecida')});
 async function render(){const status=await getGatewayStatus();root.innerHTML=renderIntegrations(loadIntegrationConfig(),{...status,available:!status.error});bindIntegrations(root,toast)}
}
