const safe = value => String(value ?? '').replace(/[&<>\'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const n = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const pct = value => `${(value*100).toFixed(2)}%`;

/** Deterministic, descriptive signals from Search Console rows. No causal claims. */
export function diagnoseGscRows(rows=[]) {
  const normalized = rows.map(row => ({
    key: Array.isArray(row.keys) ? row.keys.join(' · ') : String(row.key || ''),
    clicks: n(row.clicks), impressions: n(row.impressions), ctr: n(row.ctr), position: n(row.position)
  }));
  const highImpressionsLowCtr = normalized.filter(r => r.impressions >= 100 && r.ctr < 0.02).sort((a,b)=>b.impressions-a.impressions);
  const nearPageOne = normalized.filter(r => r.position >= 4 && r.position <= 20 && r.impressions >= 100).sort((a,b)=>b.impressions-a.impressions);
  const strongPages = normalized.filter(r => r.clicks > 0).sort((a,b)=>b.clicks-a.clicks);
  const totals = normalized.reduce((a,r)=>({clicks:a.clicks+r.clicks,impressions:a.impressions+r.impressions}),{clicks:0,impressions:0});
  return {rows:normalized,totals,ctr:totals.impressions?totals.clicks/totals.impressions:0,highImpressionsLowCtr,nearPageOne,strongPages};
}
function list(items, empty) { return items.length ? `<ol>${items.slice(0,5).map(r=>`<li><span class="gsc-dx-name">${safe(r.key || '(sin dimensión)')}</span><span>${r.clicks.toLocaleString('es-MX')} clics · ${r.impressions.toLocaleString('es-MX')} impresiones · CTR ${pct(r.ctr)} · posición ${r.position.toFixed(1)}</span></li>`).join('')}</ol>` : `<p class="gsc-dx-empty">${empty}</p>`; }
export function renderGscDiagnostics(rows=[], meta={}) {
 const d=diagnoseGscRows(rows); const label=safe(meta.siteUrl||'Propiedad consultada'); const dates=safe(`${meta.startDate||''} a ${meta.endDate||''}`);
 return `<section class="card gsc-diagnostics" aria-labelledby="gsc-dx-title"><div><p class="eyebrow">DIAGNÓSTICO SEO · REGLAS DETERMINÍSTICAS</p><h2 id="gsc-dx-title">Lectura de rendimiento orgánico</h2><p class="section-sub">${label} · ${dates}. Las señales priorizan investigación; no prueban causalidad.</p></div>
 <div class="gsc-dx-kpis"><article><span>Hecho · clics de filas recibidas</span><strong>${d.totals.clicks.toLocaleString('es-MX')}</strong></article><article><span>Hecho · impresiones de filas recibidas</span><strong>${d.totals.impressions.toLocaleString('es-MX')}</strong></article><article><span>Driver · CTR agregado de filas</span><strong>${pct(d.ctr)}</strong></article></div>
 <div class="gsc-dx-grid"><article><h3>Señal · muchas impresiones, CTR bajo</h3><p>Regla: al menos 100 impresiones y CTR menor a 2%. Es un umbral de cribado configurable en futuras fases, no un estándar universal.</p>${list(d.highImpressionsLowCtr,'No hay filas que cumplan el umbral en esta consulta.')}</article>
 <article><h3>Señal · oportunidad de posicionamiento</h3><p>Regla: posición media entre 4 y 20 y al menos 100 impresiones; candidatas para revisar intención, snippet y contenido.</p>${list(d.nearPageOne,'No hay filas que cumplan el umbral en esta consulta.')}</article>
 <article><h3>Señal · principales aportadores de clics</h3><p>Ordenadas por clics recibidos en la consulta. Úsalas para identificar páginas que conviene proteger.</p>${list(d.strongPages,'No se recibieron clics en las filas consultadas.')}</article></div>
 <div class="gsc-dx-method"><strong>Hipótesis por validar</strong><p>Un CTR bajo puede relacionarse con la posición, la intención de búsqueda, el título o la descripción mostrados en Google, o la composición de consultas. Una posición entre 4 y 20 no demuestra por sí sola que editar contenido aumentará los clics. Contrasta cada señal con la SERP, cambios recientes y datos de otros periodos.</p><strong>Alcance de los datos</strong><p>Los totales se calculan únicamente sobre las filas devueltas por la API. Search Console puede omitir consultas o filas de bajo volumen; no deben interpretarse como el total absoluto de la propiedad.</p></div></section>`;
}
