import {money,pct,number} from './data.js';

function esc(value){return String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function val(value, fallback='—'){return value===null||value===undefined||value===''?fallback:value}
function stock(value){if(value===null||value===undefined)return '<span class="badge red">Sin dato</span>';if(value<=0)return '<span class="badge red">Sin stock</span>';if(value<5)return `<span class="badge yellow">${number(value)}</span>`;return number(value)}
function classificationBadge(c){const map={QUICK_WIN:['green','Quick Win'],PROTEGER:['blue','Proteger'],CONTENT_GAP:['yellow','Content Gap'],IGNORAR:['gray','Ignorar'],ANOMALIA:['red','Anomalía']};const [cls,label]=map[c]||['gray',val(c)];return `<span class="badge ${cls}">${esc(label)}</span>`}

export function searchProducts(data,query){
  const q=String(query||'').trim().toLowerCase();
  if(!q)return [];
  return (data?.products||[]).filter(p=>[
    p.SKU,p.Nombre_Producto,p.URL_Slug,p.Marca,p.Sustancia_Activa,p.Categoria
  ].some(v=>String(v??'').toLowerCase().includes(q)));
}

function resultCard(p,index,onSelect){
  return `<article class="lookup-product card" data-index="${index}">
    <div class="lookup-product-head"><div><span class="source-note">${esc(p.SKU)}</span><h3>${esc(p.Nombre_Producto)}</h3><p class="source-note">${esc(p.URL_Slug)}</p></div>${classificationBadge(p.Clasificacion)}</div>
    <div class="detail-grid">
      <div class="detail"><small>Marca</small>${esc(val(p.Marca))}</div>
      <div class="detail"><small>Sustancia activa</small>${esc(val(p.Sustancia_Activa))}</div>
      <div class="detail"><small>Stock</small>${stock(p.Stock)}</div>
      <div class="detail"><small>Posición GSC</small>${esc(p.Posicion_GSC==null?'—':Number(p.Posicion_GSC).toFixed(2))}</div>
      <div class="detail"><small>Clics GSC</small>${esc(p.Clicks_GSC==null?'—':Number(p.Clicks_GSC).toLocaleString('es-MX'))}</div>
      <div class="detail"><small>Impresiones GSC</small>${esc(p.Impresiones_GSC==null?'—':Number(p.Impresiones_GSC).toLocaleString('es-MX'))}</div>
      <div class="detail"><small>CTR GSC</small>${esc(p.CTR_GSC==null?'—':`${(Number(p.CTR_GSC)*100).toFixed(2)}%`)}</div>
      <div class="detail"><small>Periodo GSC</small>${esc(p.GSC_Periodo_Inicio&&p.GSC_Periodo_Fin?`${p.GSC_Periodo_Inicio} a ${p.GSC_Periodo_Fin}`:'—')}</div>
      <div class="detail"><small>Conversión</small>${p.Conversion_Rate==null?'—':pct(p.Conversion_Rate)}</div>
      <div class="detail"><small>Revenue Gap</small>${money(p.Revenue_Gap)}</div>
    </div>
    <div class="lookup-insight"><strong>Insight:</strong> ${esc(val(p.Insight_IA))}</div>
    <div class="lookup-action"><strong>Acción:</strong> ${esc(val(p.Accion_IA))}</div>
    <button class="primary-btn lookup-detail-btn" type="button" data-index="${index}">Ver detalle completo</button>
  </article>`
}

export function renderLookup(){return `<div class="card">
  <div class="lookup-head"><div><h2 class="section-title">Buscar producto</h2><p class="section-sub">Consulta por SKU, nombre, URL slug, marca, sustancia activa o categoría.</p></div><span class="test-badge">CATÁLOGO</span></div>
  <div class="filters lookup-filters"><input id="lookup-input" placeholder="Ej. SKU-1001, Omeprazol o Marca Farma" aria-label="Buscar producto" autocomplete="off"><button class="primary-btn" id="lookup-btn" type="button">Buscar</button><button class="secondary-btn" id="lookup-clear" type="button">Limpiar</button></div>
  <div id="lookup-result" class="lookup-result" aria-live="polite"><div class="empty">Escribe un criterio para comenzar la búsqueda.</div></div>
</div>`}

export function bindLookup(data,onSelect){
  const input=document.getElementById('lookup-input'),btn=document.getElementById('lookup-btn'),clear=document.getElementById('lookup-clear'),out=document.getElementById('lookup-result');
  const run=()=>{
    const q=input.value.trim();
    if(!q){out.innerHTML='<div class="empty">Escribe un SKU, nombre, URL slug, marca, sustancia activa o categoría.</div>';return}
    const results=searchProducts(data,q);
    if(!results.length){out.innerHTML=`<div class="empty"><strong>No se encontró ningún producto.</strong><br>Prueba con otro SKU, nombre, marca o sustancia activa.</div>`;return}
    out.innerHTML=`<div class="lookup-summary">${results.length===1?'1 producto encontrado':`${results.length} productos encontrados`}</div>${results.map((p,i)=>resultCard(p,i,onSelect)).join('')}`;
    out.querySelectorAll('.lookup-detail-btn').forEach((b,i)=>b.addEventListener('click',()=>onSelect?.(results[Number(b.dataset.index)])));
  };
  btn.onclick=run;clear.onclick=()=>{input.value='';out.innerHTML='<div class="empty">Escribe un criterio para comenzar la búsqueda.</div>';input.focus()};input.onkeydown=e=>{if(e.key==='Enter')run()};
}
