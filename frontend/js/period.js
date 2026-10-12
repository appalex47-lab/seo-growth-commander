const KEY='gssc.global.period.v1';
const DAY=86400000;
const iso=d=>new Date(d).toISOString().slice(0,10);
function endDate(){const d=new Date();d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-3);return d;}
export function periodRange(value='28d',customStart='',customEnd=''){
 const end=endDate();let start=new Date(end);
 if(value==='custom'){
  const s=customStart||iso(new Date(end.getTime()-27*DAY)),e=customEnd||iso(end);
  if(s>e)throw new Error('La fecha inicial no puede ser posterior a la fecha final.');
  return {key:value,startDate:s,endDate:e,label:`${s} a ${e}`,days:Math.round((Date.parse(e+'T00:00:00Z')-Date.parse(s+'T00:00:00Z'))/DAY)+1};
 }
 if(value==='7d')start.setUTCDate(start.getUTCDate()-6);
 else if(value==='28d')start.setUTCDate(start.getUTCDate()-27);
 else if(value==='month'){start=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth(),1));}
 else if(value==='prevmonth'){start=new Date(Date.UTC(end.getUTCFullYear(),end.getUTCMonth()-1,1));end.setUTCDate(0);}
 else if(value==='quarter'){start=new Date(Date.UTC(end.getUTCFullYear(),Math.floor(end.getUTCMonth()/3)*3,1));}
 else if(value==='year'){start=new Date(Date.UTC(end.getUTCFullYear(),0,1));}
 else {value='28d';start.setUTCDate(start.getUTCDate()-27)}
 const s=iso(start),e=iso(end);return {key:value,startDate:s,endDate:e,label:`${s} a ${e}`,days:Math.round((Date.parse(e+'T00:00:00Z')-Date.parse(s+'T00:00:00Z'))/DAY)+1};
}
export function loadGlobalPeriod(){try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');return {key:p.key||'28d',startDate:p.startDate||'',endDate:p.endDate||''}}catch{return {key:'28d',startDate:'',endDate:''}}}
export function saveGlobalPeriod(p){localStorage.setItem(KEY,JSON.stringify(p));return p}
export function getGlobalPeriod(){const p=loadGlobalPeriod();return periodRange(p.key,p.startDate,p.endDate)}
export function renderPeriodControls(){const p=loadGlobalPeriod();return `<div class="global-period" aria-label="Periodo global de análisis"><label for="global-period-select">Periodo de análisis</label><select id="global-period-select"><option value="7d" ${p.key==='7d'?'selected':''}>Últimos 7 días</option><option value="28d" ${p.key==='28d'?'selected':''}>Últimos 28 días (predeterminado)</option><option value="month" ${p.key==='month'?'selected':''}>Mes actual</option><option value="prevmonth" ${p.key==='prevmonth'?'selected':''}>Mes anterior</option><option value="quarter" ${p.key==='quarter'?'selected':''}>Trimestre actual</option><option value="year" ${p.key==='year'?'selected':''}>Año actual</option><option value="custom" ${p.key==='custom'?'selected':''}>Personalizado</option></select><span id="global-period-label">${periodRange(p.key,p.startDate,p.endDate).label}</span><div id="global-period-custom" ${p.key==='custom'?'':'hidden'}><input id="global-period-start" type="date" aria-label="Fecha inicial" value="${p.startDate}"><input id="global-period-end" type="date" aria-label="Fecha final" value="${p.endDate}"><button id="global-period-apply" class="secondary-btn" type="button">Aplicar</button></div></div>`}
