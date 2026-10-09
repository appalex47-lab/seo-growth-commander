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

export async function getGatewayStatus(){
  try{const response=await fetch(`${GATEWAY_URL}/api/integrations/status`,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error(`Gateway HTTP ${response.status}`);return await response.json()}
  catch(error){return {available:false,error:error.message,google:{configured:false,sources:[]},cohere:{server_configured:false},production_ready:false}}
}

function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

export function renderIntegrations(config=loadIntegrationConfig(),gatewayStatus=null){
 const gatewayReady=gatewayStatus?.available!==false && gatewayStatus?.google;
 return `<section class="card integration-intro"><div><p class="eyebrow">SECURE INTEGRATION LAYER</p><h2>Centro de integraciones</h2><p>Las conexiones reales pasan por el gateway seguro. El navegador no recibe client secrets ni tokens de Google.</p></div><div class="integration-contract"><strong>Fase 14</strong><span>${gatewayReady?'Gateway detectado':'Gateway no disponible'}</span></div></section>
 <section class="card gateway-status"><div><strong>Gateway seguro</strong><p>${gatewayReady?'La capa de conexión responde correctamente.':'Inicia el gateway local para habilitar el botón Conectar.'}</p></div><span class="integration-status ${gatewayReady?'ready':''}">${gatewayReady?'Disponible':'No disponible'}</span></section>
 <section class="integration-grid">${INTEGRATIONS.map(i=>{const c=config[i.id]||{};const isGoogle=i.provider==='google';return `<article class="card integration-card"><div class="integration-head"><div><span class="integration-category">${i.category}</span><h3>${i.name}</h3></div><span class="integration-status ${c.configured?'ready':''}">${c.configured?'Conectada':'Pendiente'}</span></div><p>${i.description}</p><label><span>Activar fuente</span><input type="checkbox" data-int-enabled="${i.id}" ${c.enabled?'checked':''}></label><label>Identificador / cuenta<input type="text" data-int-account="${i.id}" value="${escapeHtml(c.account||'')}" placeholder="Se seleccionará al conectar" ${isGoogle?'readonly':''}></label><label>Endpoint / proyecto<input type="text" data-int-endpoint="${i.id}" value="${escapeHtml(c.endpoint||'')}" placeholder="Gestionado por el gateway" ${isGoogle?'readonly':''}></label>${isGoogle?`<button class="primary-btn" data-connect-google="${i.id}" ${gatewayReady?'':'disabled'}>${c.configured?'Reconectar':'Conectar con Google'}</button>`:'<button class="secondary-btn" disabled>Se conectará en una fase posterior</button>'}<p class="integration-note">${c.configured?'Conexión local registrada.':'No hay una conexión real registrada todavía.'}</p></article>`}).join('')}</section>
 <section class="card integration-footer"><button class="primary-btn" id="save-integrations">Guardar preferencias</button><button class="secondary-btn" id="reset-integrations">Restablecer</button><p>Los metadatos no secretos pueden persistirse localmente. Los secretos y tokens deben permanecer en el gateway/almacén seguro.</p></section>`;
}

export function bindIntegrations(root,toast){
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
 root.querySelector('#reset-integrations')?.addEventListener('click',()=>{resetIntegrationConfig();render();toast('Configuración restablecida')});
 async function render(){const status=await getGatewayStatus();root.innerHTML=renderIntegrations(loadIntegrationConfig(),{...status,available:!status.error});bindIntegrations(root,toast)}
}
