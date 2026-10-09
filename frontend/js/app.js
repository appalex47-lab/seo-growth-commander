import {loadData} from './data.js';
import {calculateDataset} from './businessRules.js';
import {renderOverview,mountOverviewChart} from './dashboard.js';
import {renderMatrix,mountMatrix} from './matrix.js';
import {renderBacklog,bindBacklog} from './backlog.js';
import {renderLookup,bindLookup} from './lookup.js';
import {loadScenarios,renderTestLab,bindTestLab} from './testLab.js';
import {loadIntegrationConfig,renderIntegrations,bindIntegrations,getGatewayStatus} from './integrations.js';
import {loadAIConfig,renderAI,bindAI} from './ai.js';
import {saveCatalog,loadCatalog,deleteCatalog} from './storage.js';

const state={data:null,view:'overview',dataSource:'none',scenarios:null};
const view=document.getElementById('app-view'),title=document.getElementById('view-title'),status=document.getElementById('data-status');
const titles={overview:'Executive Overview',matrix:'Strategic Action Matrix',backlog:'Operational Backlog',lookup:'Product Lookup',lab:'Test Data Lab',integrations:'Integraciones',ai:'Configuración IA'};

function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),2400)}
function escapeHtml(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

function drawer(p){
  if(!p)return;
  document.body.insertAdjacentHTML('beforeend',`<div class="drawer-backdrop" id="drawer-backdrop"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><button class="close" id="drawer-close" aria-label="Cerrar detalle">Cerrar</button><h2 id="drawer-title">${escapeHtml(p.Nombre_Producto)}</h2><p class="source-note">${escapeHtml(p.SKU)} · ${escapeHtml(p.URL_Slug)}</p><div class="detail-grid"><div class="detail"><small>Clasificación</small>${escapeHtml(p.Clasificacion)}</div><div class="detail"><small>Revenue Gap</small>${p.Revenue_Gap==null?'—':p.Revenue_Gap.toLocaleString('es-MX',{style:'currency',currency:'USD',maximumFractionDigits:0})}</div><div class="detail"><small>Stock</small>${p.Stock==null?'—':p.Stock}</div><div class="detail"><small>Posición GSC</small>${p.Posicion_GSC==null?'—':p.Posicion_GSC}</div><div class="detail"><small>Volumen mercado</small>${p.Volumen_Mercado==null?'—':p.Volumen_Mercado.toLocaleString('es-MX')}</div><div class="detail"><small>Conversión</small>${p.Conversion_Rate==null?'—':(p.Conversion_Rate*100).toFixed(1)+'%'}</div></div><h3>Por qué esta prioridad</h3><ul class="reason-list"><li>Stock: ${p.Stock==null?'sin dato':p.Stock>=5?'suficiente':'insuficiente'}</li><li>Posición: ${p.Posicion_GSC==null?'—':p.Posicion_GSC}</li><li>Volumen: ${p.Volumen_Mercado==null?'—':p.Volumen_Mercado.toLocaleString('es-MX')}</li><li>Revenue Gap: ${p.Revenue_Gap==null?'—':p.Revenue_Gap.toLocaleString('es-MX',{style:'currency',currency:'USD',maximumFractionDigits:0})}</li></ul><h3>Insight IA</h3><p>${escapeHtml(p.Insight_IA)}</p><h3>Acción sugerida</h3><p>${escapeHtml(p.Accion_IA)}</p></aside>`);
  const close=()=>{document.getElementById('drawer-backdrop')?.remove();document.querySelector('.drawer')?.remove()};
  document.getElementById('drawer-close').onclick=close;document.getElementById('drawer-backdrop').onclick=close;
  const esc=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',esc)}};document.addEventListener('keydown',esc);
}

function emptyState(){return `<section class="card dataset-empty"><div class="empty-icon" aria-hidden="true">＋</div><h2>No hay información de prueba cargada</h2><p>Agrega el dataset de prueba para validar las métricas, reglas, gráficos, filtros, backlog y búsqueda antes de conectar APIs o cargar archivos reales.</p><button class="primary-btn" id="empty-add-test">Agregar información de prueba</button></section>`}

function render(){
  title.textContent=titles[state.view];
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===state.view));
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
  await deleteCatalog();state.data=null;state.dataSource='none';setStatus();render();toast('Dataset de prueba eliminado correctamente')
}

document.querySelectorAll('.nav-btn').forEach(b=>b.addEventListener('click',async()=>{state.view=b.dataset.view;if(state.view==='lab') await openLab(); else {render();toast(`${titles[state.view]} cargado correctamente`)}}));
document.getElementById('add-test-data').addEventListener('click',addTestData);
document.getElementById('remove-test-data').addEventListener('click',removeTestData);

view.innerHTML='<div class="card loading">Recuperando catálogo…</div>';
(async()=>{
  try{const stored=await loadCatalog();if(stored?.data){state.data=stored.data;state.dataSource=stored.source||'catalog';setStatus();render();toast('Catálogo recuperado desde IndexedDB')}else{await addTestData()}}catch(err){await addTestData()}})();
