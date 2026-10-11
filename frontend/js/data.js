import {dataQuality} from './businessRules.js';
import {runPipeline} from './pipeline.js';

export async function loadData(){
  const res=await fetch('data/data_mock.json',{cache:'no-store'});
  if(!res.ok) throw new Error(`No se pudo cargar data_mock.json (HTTP ${res.status})`);
  return validateData(await res.json());
}

export function validateData(data){
  const errors=[];
  if(!data||!Array.isArray(data.products)) errors.push('El dataset no contiene un arreglo products.');
  const required=['SKU','URL_Slug','Nombre_Producto','Marca','Sustancia_Activa','Categoria'];
  (data?.products||[]).forEach((p,i)=>{
    required.forEach(k=>{if(p[k]===undefined||p[k]===null||p[k]==='') errors.push(`Producto ${i+1}: falta ${k}.`)});
    if(p.Stock!==null && (typeof p.Stock!=='number'||Number.isNaN(p.Stock))) errors.push(`${p.SKU||i}: Stock debe ser numérico o null.`);
    const numeric=['Posicion_GSC','Conversion_Rate','AOV','Volumen_Mercado','Clicks_GSC'];
    numeric.forEach(k=>{if(p[k]!==null && (typeof p[k]!=='number'||Number.isNaN(p[k]))) errors.push(`${p.SKU||i}: ${k} debe ser numérico o null.`)});
    const q=dataQuality(p);
    if(q.status==='INVALID') errors.push(`${p.SKU||i}: ${q.issues.join(', ')}.`);
  });
  if(errors.length) throw new Error(errors.join(' | '));
  return runPipeline(data);
}

export function totals(data){return data.products.reduce((a,p)=>({clicks:a.clicks+(p.Clicks_GSC||0),revenueGap:a.revenueGap+(p.Revenue_Gap||0),impressions:a.impressions+(p.Impresiones_GSC||0),marketVolume:a.marketVolume+(p.Volumen_Mercado||0)}),{clicks:0,revenueGap:0,impressions:0,marketVolume:0})}
export function organicShare(data){const t=totals(data);return t.marketVolume?t.impressions/t.marketVolume:0}
export const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
export const number=n=>new Intl.NumberFormat('es-MX').format(n||0);
export const pct=n=>n==null?'—':new Intl.NumberFormat('es-MX',{style:'percent',maximumFractionDigits:1}).format(n);
