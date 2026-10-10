const CONFIG_KEY='gssc.cohere.config.v1';
const SECRET_KEY='gssc.cohere.api_key.v1';
export const AI_CONFIG_VERSION='1.1';

// Modelos Cohere vigentes y compatibles con Chat según la documentación oficial.
export const COHERE_MODELS=[
  {id:'command-a-plus-05-2026',name:'Command A+ — recomendado para máxima capacidad',recommended:true},
  {id:'command-a-03-2025',name:'Command A — recomendado para producción',recommended:true},
  {id:'command-a-reasoning-08-2025',name:'Command A Reasoning — razonamiento avanzado'},
  {id:'command-r7b-12-2024',name:'Command R7B — rápido y eficiente'},
  {id:'command-r-plus-08-2024',name:'Command R+ 08-2024 — RAG y tareas complejas'},
  {id:'command-r-08-2024',name:'Command R 08-2024 — opción económica'}
];

export function defaultAIConfig(){return {provider:'cohere',enabled:true,configured:false,model:'command-a-03-2025',lastRun:null}}
export function loadAIConfig(){try{return {...defaultAIConfig(),...(JSON.parse(localStorage.getItem(CONFIG_KEY))||{})}}catch{return defaultAIConfig()}}
export function loadCohereApiKey(){try{return sessionStorage.getItem(SECRET_KEY)||''}catch{return ''}}
export function saveAIConfig(config){
  const safe={provider:'cohere',enabled:Boolean(config.enabled),configured:Boolean(config.configured),model:COHERE_MODELS.some(m=>m.id===config.model)?config.model:defaultAIConfig().model,lastRun:config.lastRun||null};
  localStorage.setItem(CONFIG_KEY,JSON.stringify(safe));
  if(config.apiKey){try{sessionStorage.setItem(SECRET_KEY,String(config.apiKey).trim())}catch{}}
  return {...safe,apiKey:loadCohereApiKey()}
}
export function resetAIConfig(){try{localStorage.removeItem(CONFIG_KEY);sessionStorage.removeItem(SECRET_KEY)}catch{}return defaultAIConfig()}

export function buildAIContext(product){return {schema_version:'1.0',product:{SKU:product.SKU,Nombre_Producto:product.Nombre_Producto,Marca:product.Marca,Categoria:product.Categoria,Stock:product.Stock,Posicion_GSC:product.Posicion_GSC,Clicks_GSC:product.Clicks_GSC,Impresiones_GSC:product.Impresiones_GSC,Conversion_Rate:product.Conversion_Rate,AOV:product.AOV,Volumen_Mercado:product.Volumen_Mercado,Potential_Traffic:product.Potential_Traffic,Revenue_Gap:product.Revenue_Gap,Clasificacion:product.Clasificacion,Prioridad:product.Prioridad,Data_Quality:product.Data_Quality,Accion_IA:product.Accion_IA||''}}}

function generateMockInsight(product){
  if(product.Data_Quality==='INVALID') return 'No generar una recomendación concluyente: los datos contienen valores inválidos.';
  if(product.Data_Quality==='INCOMPLETE') return 'La oportunidad debe revisarse con datos faltantes antes de tomar una decisión definitiva.';
  if(product.Clasificacion==='QUICK_WIN') return `Oportunidad prioritaria: ${product.Nombre_Producto} combina demanda, margen potencial y una posición mejorable. Conviene optimizarlo primero.`;
  if(product.Clasificacion==='PROTEGER') return `Producto a proteger: ${product.Nombre_Producto} ya tiene una presencia orgánica relevante. Conviene mantener y defender su visibilidad.`;
  if(product.Clasificacion==='CONTENT_GAP') return `Hay una brecha de contenido: ${product.Nombre_Producto} tiene demanda pero necesita mejorar su cobertura y relevancia orgánica.`;
  if(product.Clasificacion==='IGNORAR') return `No priorizar ${product.Nombre_Producto} mientras las restricciones actuales —especialmente inventario o bajo potencial— limiten el retorno.`;
  return `Revisar ${product.Nombre_Producto} antes de ejecutar una acción SEO porque presenta señales anómalas o información incompleta.`;
}

export function runAI(product,config=loadAIConfig()){
  if(!config.enabled) return {status:'DISABLED',provider:'cohere',model:config.model,insight:'La capa de IA está desactivada.'};
  if(!loadCohereApiKey()) return {status:'NOT_CONFIGURED',provider:'cohere',model:config.model,insight:'Cohere está seleccionado, pero falta configurar la API Key.'};
  return {status:'READY',provider:'cohere',model:config.model,prompt_version:AI_CONFIG_VERSION,context:buildAIContext(product),insight:'Cohere está configurado. La llamada real se habilitará mediante el adaptador seguro de integración.'};
}

function maskKey(key){if(!key)return ''; if(key.length<=8)return '••••••••'; return `${key.slice(0,4)}••••••••${key.slice(-4)}`}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

export function renderAI(config=loadAIConfig()){
 const key=loadCohereApiKey();
 return `<section class="card ai-engine-head"><div><p class="eyebrow">INTELLIGENCE LAYER</p><h2>Configuración de IA — Cohere</h2><p>Cohere será el proveedor de inteligencia de Growth SEO Command Center. La IA interpreta los resultados del motor determinista; no calcula ni modifica las métricas de negocio.</p></div><span class="ai-engine-status ${config.enabled?'ready':''}">${config.enabled?'Activo':'Desactivado'}</span></section>
 <section class="card"><div class="ai-config-grid"><label>Proveedor<input value="Cohere" readonly aria-readonly="true"></label><label>Modelo Cohere<select id="ai-model">${COHERE_MODELS.map(m=>`<option value="${m.id}" ${config.model===m.id?'selected':''}>${m.name}</option>`).join('')}</select></label><label class="ai-key-field">API Key de Cohere<input id="ai-key" type="password" autocomplete="off" placeholder="Pega aquí tu API Key de Cohere" value=""></label><label class="ai-check"><input id="ai-enabled" type="checkbox" ${config.enabled?'checked':''}> Activar interpretación IA</label></div>
 <div class="key-status"><strong>${key?'API Key configurada':'API Key no configurada'}</strong>${key?`<span>${escapeHtml(maskKey(key))}</span>`:'<span>La clave se mantiene solo en la sesión del navegador durante esta fase.</span>'}</div>
 <p class="integration-note">Modelos disponibles en esta versión: Command A+, Command A, Command A Reasoning, Command R7B, Command R+ 08-2024 y Command R 08-2024. Cohere mantiene una API para listar modelos disponibles, por lo que la lista podrá sincronizarse dinámicamente cuando implementemos la conexión segura.</p>
 <div class="ai-actions"><button class="primary-btn" id="save-ai">Guardar configuración</button><button class="secondary-btn" id="reset-ai">Restablecer</button></div></section>
 <section class="card"><h3>Guardrails</h3><ul class="reason-list"><li>Revenue Gap, clasificación y prioridad provienen del motor determinista.</li><li>Cohere recibe contexto calculado, no datos derivados sin validar.</li><li>Datos INCOMPLETE/INVALID deben explicitarse como limitación.</li><li>La API Key no se guarda en localStorage; durante esta fase se conserva solo en sessionStorage.</li><li>La llamada real a Cohere requerirá un adaptador seguro; no se expone una clave de producción al cliente.</li></ul></section>`;
}

export function bindAI(root,toast){
 root.querySelector('#save-ai')?.addEventListener('click',()=>{const previous=loadAIConfig();const c=saveAIConfig({model:root.querySelector('#ai-model').value,apiKey:root.querySelector('#ai-key').value,enabled:root.querySelector('#ai-enabled').checked,lastRun:previous.lastRun,configured:Boolean(root.querySelector('#ai-key').value.trim()||loadCohereApiKey())});toast('Configuración de Cohere guardada');root.innerHTML=renderAI(c);bindAI(root,toast)});
 root.querySelector('#reset-ai')?.addEventListener('click',()=>{const c=resetAIConfig();toast('Configuración de Cohere restablecida');root.innerHTML=renderAI(c);bindAI(root,toast)});
}
