import {renderPeriodControls,loadGlobalPeriod,saveGlobalPeriod,periodRange,getGlobalPeriod} from './period.js';
import {loadData} from './data.js';
import {calculateDataset} from './businessRules.js';
import {renderOverview,mountOverviewChart} from './dashboard.js';
import {renderMatrix,mountMatrix} from './matrix.js';
import {renderBacklog,bindBacklog} from './backlog.js';
import {renderLookup,bindLookup} from './lookup.js';
import {loadScenarios,renderTestLab,bindTestLab} from './testLab.js';
import {loadIntegrationConfig,renderIntegrations,bindIntegrations,getGatewayStatus,syncAllSources} from './integrations.js';
import {loadAIConfig,renderAI,bindAI} from './ai.js';
import {saveCatalog,loadCatalog,deleteCatalog,deleteCatalogBySource} from './storage.js';
// Compatibility note: legacy reset used `await deleteCatalog()`; the test-data button now deletes only the test catalog.
import {renderCatalog,bindCatalog} from './catalog.js';

const state={data:null,view:'overview',dataSource:'none',scenarios:null};
document.getElementById('global-period-host').innerHTML=renderPeriodControls();
function bindGlobalPeriod(){const select=document.getElementById('global-period-select'),custom=document.getElementById('global-period-custom'),label=document.getElementById('global-period-label');const saved=loadGlobalPeriod();const update=(p)=>{try{saveGlobalPeriod(p);const range=periodRange(p.key,p.startDate,p.endDate);label.textContent=range.label;window.dispatchEvent(new CustomEvent('gssc:period-changed',{detail:range}));}catch(e){toast(e.message)}};select.addEventListener('change',()=>{custom.hidden=select.value!=='custom';const p={key:select.value,startDate:'',endDate:''};if(select.value==='custom'){const r=periodRange('28d');document.getElementById('global-period-start').value=r.startDate;document.getElementById('global-period-end').value=r.endDate;return}update(p)});document.getElementById('global-period-apply').addEventListener('click',()=>update({key:'custom',startDate:document.getElementById('global-period-start').value,endDate:document.getElementById('global-period-end').value}));window.addEventListener('gssc:period-changed',()=>{if(state.view==='integrations')render()});label.textContent=periodRange(saved.key,saved.startDate,saved.endDate).label;}
bindGlobalPeriod();
const view=document.getElementById('app-view'),title=document.getElementById('view-title'),status=document.getElementById('data-status');
const titles={overview:'Executive Overview',matrix:'Strategic Action Matrix',backlog:'Operational Backlog',lookup:'Product Lookup',lab:'Test Data Lab',integrations:'Integraciones',ai:'Configuración IA',catalog:'Catálogo y datos'};
window.addEventListener('gssc:catalog-updated',async()=>{try{const stored=await loadCatalog();state.data=stored?.data||state.data;state.dataSource=stored?.source||state.dataSource;setStatus();if(state.view==='backlog'||state.view==='lookup')render();toast('Métricas de Search Console guardadas en el catálogo');}catch(error){toast('Las métricas se guardaron, pero no se pudo actualizar la vista');}});


function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),2400)}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function drawer(p){
  if(!p)return;
  document.body.insertAdjacentHTML('beforeend',`<div class="drawer-backdrop" id="drawer-backdrop"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><button class="close" id="drawer-close" aria-label="Cerrar detalle">Cerrar</button><h2 id="drawer-title">${escapeHtml(p.Nombre_Producto)}</h2><p class="source-note">${escapeHtml(p.SKU)} · ${escapeHtml(p.URL_Slug)}</p><div class="detail-grid"><div class="detail"><small>Clasificación</small>${escapeHtml(p.Clasificacion)}</div><div class="detail"><small>Revenue Gap</small>${p.Revenue_Gap==null?'—':p.Revenue_Gap.toLocaleString('es-MX',{style:'currency',currency:'USD',maximumFractionDigits:0})}</div><div class="detail"><small>Stock</small>${p.Stock==null?'—':p.Stock}</div><div class="detail"><small>Posición GSC</small>${p.Posicion_GSC==null?'—':Number(p.Posicion_GSC).toFixed(2)}</div><div class="detail"><small>Clics GSC</small>${p.Clicks_GSC==null?'—':Number(p.Clicks_GSC).toLocaleString('es-MX')}</div><div class="detail"><small>Impresiones GSC</small>${p.Impresiones_GSC==null?'—':Number(p.Impresiones_GSC).toLocaleString('es-MX')}</div><div class="detail"><small>CTR GSC</small>${p.CTR_GSC==null?'—':(Number(p.CTR_GSC)*100).toFixed(2)+'%'}</div><div class="detail"><small>Periodo GSC</small>${p.GSC_Periodo_Inicio&&p.GSC_Periodo_Fin?escapeHtml(p.GSC_Periodo_Inicio+' a '+p.GSC_Periodo_Fin):'—'}</div><div class="detail"><small>Volumen mercado</small>${p.Volumen_Mercado==null?'—':p.Volumen_Mercado.toLocaleString('es-MX')}</div><div class="detail"><small>Conversión</small>${p.Conversion_Rate==null?'—':(p.Conversion_Rate*100).toFixed(1)+'%'}</div></div><h3>Por qué esta prioridad</h3><ul class="reason-list"><li>Stock: ${p.Stock==null?'sin dato':p.Stock>=5?'suficiente':'insuficiente'}</li><li>Posición: ${p.Posicion_GSC==null?'—':p.Posicion_GSC}</li><li>Volumen: ${p.Volumen_Mercado==null?'—':p.Volumen_Mercado.toLocaleString('es-MX')}</li><li>Revenue Gap: ${p.Revenue_Gap==null?'—':p.Revenue_Gap.toLocaleString('es-MX',{style:'currency',currency:'USD',maximumFractionDigits:0})}</li></ul><h3>Insight IA</h3><p>${escapeHtml(p.Insight_IA)}</p><h3>Acción sugerida</h3><p>${escapeHtml(p.Accion_IA)}</p></aside>`);
  const close=()=>{document.getElementById('drawer-backdrop')?.remove();document.querySelector('.drawer')?.remove()};
  document.getElementById('drawer-close').onclick=close;document.getElementById('drawer-backdrop').onclick=close;
  const esc=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',esc)}};document.addEventListener('keydown',esc);
}

function emptyState(){return `<section class="card dataset-empty"><div class="empty-icon" aria-hidden="true">＋</div><h2>No hay información de prueba cargada</h2><p>Agrega el dataset de prueba para validar las métricas, reglas, gráficos, filtros, backlog y búsqueda antes de conectar APIs o cargar archivos reales.</p><button class="primary-btn" id="empty-add-test">Agregar información de prueba</button></section>`}

function render(){
  title.textContent=titles[state.view];
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
  if(state.view==='catalog'){renderCatalog().then(html=>{if(state.view!=='catalog')return;view.innerHTML=html;bindCatalog(view,toast,async()=>{const stored=await loadCatalog();state.data=stored?.data||null;state.dataSource=stored?.source||'none';setStatus();render()})}).catch(err=>{view.innerHTML=`<div class="card error">No se pudo abrir el catálogo: ${escapeHtml(err.message)}</div>`});return}
  if(!state.data){view.innerHTML=emptyState();document.getElementById('empty-add-test')?.addEventListener('click',addTestData);return}
  if(state.view==='overview'){view.innerHTML=renderOverview(state.data);mountOverviewChart(state.data)}
  if(state.view==='matrix'){view.innerHTML=renderMatrix(state.data);mountMatrix(state.data,drawer)}
  if(state.view==='backlog'){view.innerHTML=renderBacklog(state.data);bindBacklog(state.data)}
  if(state.view==='lookup'){view.innerHTML=renderLookup();bindLookup(state.data,drawer)}
  if(state.view==='lab'){view.innerHTML=state.scenarios?renderTestLab(state.scenarios):'<div class="card loading">Cargando laboratorio…</div>'; if(state.scenarios) bindTestLab(state.scenarios,loadScenario)}
  if(state.view==='integrations'){view.innerHTML=renderIntegrations(loadIntegrationConfig(),{available:false,error:'loading'});bindIntegrations(view,toast)}
  if(state.view==='ai'){view.innerHTML=renderAI(loadAIConfig());bindAI(view,toast)}
}

function setStatus(){
  if(state.data){status.innerHTML='<span class="dot ok"></span> Dataset de prueba activo';status.setAttribute('aria-label','Dataset de prueba activo')}
  else{status.innerHTML='<span class="dot"></span> Sin dataset';status.setAttribute('aria-label','Sin dataset cargado')}
}

async function addTestData(){
  try{status.innerHTML='<span class="dot"></span> Cargando prueba…';const data=await loadData();state.data=data;state.dataSource='mock';await saveCatalog(data,'test');setStatus();render();toast('Dataset de prueba agregado correctamente')}catch(err){status.innerHTML='<span class="dot error"></span> Error de datos';view.innerHTML=`<div class="card error"><strong>No se pudo agregar el dataset de prueba.</strong>${escapeHtml(err.message)}<br><br>Verifica que la aplicación se sirva mediante HTTP y que data/data_mock.json exista.</div>`;toast('No se pudo agregar el dataset')}}

async function loadScenario(dataset){ dataset.products=calculateDataset(dataset.products); state.data=dataset; state.dataSource=dataset.source||'scenario'; await saveCatalog(dataset,'scenario'); setStatus(); state.view='overview'; render(); toast('Escenario de prueba cargado correctamente') }

async function openLab(){ if(!state.scenarios){ try{state.scenarios=await loadScenarios()}catch(err){view.innerHTML=`<div class="card error"><strong>No se pudo cargar el laboratorio.</strong>${escapeHtml(err.message)}</div>`;return} } render(); }

async function removeTestData(){
  await deleteCatalogBySource('test');const stored=await loadCatalog().catch(()=>null);state.data=stored?.data||null;state.dataSource=stored?.source||'none';setStatus();render();toast('Dataset de prueba eliminado; el catálogo real no se modificó')
}

document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',async()=>{state.view=b.dataset.view;if(state.view==='lab') await openLab(); else {render();toast(`${titles[state.view]} cargado correctamente`)}}));
document.getElementById('add-test-data').addEventListener('click',addTestData);
document.getElementById('remove-test-data').addEventListener('click',removeTestData);
document.getElementById('sync-information').addEventListener('click',syncInformation);

function showSyncReport(result){
 const root=document.getElementById('sync-report-root');
 const labels={success:'Sincronizado',error:'Error',needs_setup:'Requiere configuración',not_implemented:'Pendiente de integración'};
 const rows=result.report.map(item=>`<article class="sync-report-item"><div><strong>${escapeHtml(item.name)}</strong><span class="sync-status ${escapeHtml(item.status)}">${escapeHtml(labels[item.status]||item.status)}</span></div><p>${escapeHtml(item.message)}</p></article>`).join('');
 root.innerHTML=`<div class="sync-modal-backdrop" id="sync-modal-backdrop"><section class="sync-modal card" role="dialog" aria-modal="true" aria-labelledby="sync-modal-title"><button class="close" id="sync-modal-close" type="button">Cerrar</button><p class="eyebrow">CENTRO DE DATOS</p><h2 id="sync-modal-title">Resultado de sincronización</h2><p class="section-sub">Finalizado: ${escapeHtml(new Date(result.completedAt).toLocaleString('es-MX'))}</p>${rows}<p class="integration-note">Las fuentes marcadas como pendientes no se consultaron ni generaron datos ficticios. La sincronización disponible ahora es Search Console.</p></section></div>`;
 const close=()=>root.replaceChildren();root.querySelector('#sync-modal-close').onclick=close;root.querySelector('#sync-modal-backdrop').addEventListener('click',e=>{if(e.target.id==='sync-modal-backdrop')close()});
}
async function syncInformation(){
 const button=document.getElementById('sync-information');if(button.disabled)return;button.disabled=true;const original=button.textContent;button.textContent='Sincronizando…';
 try{const period=getGlobalPeriod();const result=await syncAllSources({onProgress:message=>{button.textContent=message},period});const stored=await loadCatalog().catch(()=>null);if(stored?.data){state.data=stored.data;state.dataSource=stored.source||state.dataSource;setStatus();render()}showSyncReport(result);const success=result.report.filter(x=>x.status==='success').length;toast(success?`Sincronización terminada: ${success} fuente(s) actualizadas`:'Sincronización terminada; revisa el detalle de fuentes');}
 catch(error){showSyncReport({completedAt:new Date().toISOString(),report:[{id:'sync',name:'Sincronización central',status:'error',message:error.message||'Error inesperado.'}]});toast('La sincronización no pudo completarse')}
 finally{button.disabled=false;button.textContent=original}
}


view.innerHTML='<div class="card loading">Recuperando catálogo…</div>';
(async()=>{
  try{const stored=await loadCatalog();if(stored?.data){state.data=stored.data;state.dataSource=stored.source||'catalog';setStatus();render();toast('Catálogo recuperado desde IndexedDB')}else{await addTestData()}}catch(err){await addTestData()}})();
