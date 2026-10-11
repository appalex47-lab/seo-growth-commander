export const EXPECTED_CTR_DEFAULT = 0.10;
export const STOCK_MINIMUM = 5;
export const HIGH_VOLUME_MIN = 50000;
export const PRIORITY_BY_CLASS = {QUICK_WIN:1, PROTEGER:2, CONTENT_GAP:3, ANOMALIA:4, IGNORAR:5};

const num = (p,k) => typeof p?.[k] === 'number' && Number.isFinite(p[k]) ? p[k] : null;

export function dataQuality(p){
  const required=['Stock','Posicion_GSC','Conversion_Rate','AOV','Volumen_Mercado','Clicks_GSC'];
  const missing=required.filter(k=>p?.[k] == null);
  const issues=[];
  if(num(p,'Stock')!==null && p.Stock<0) issues.push('Stock negativo');
  if(num(p,'Posicion_GSC')!==null && p.Posicion_GSC<1) issues.push('Posición GSC menor a 1');
  if(num(p,'Conversion_Rate')!==null && (p.Conversion_Rate<0||p.Conversion_Rate>1)) issues.push('Conversion_Rate fuera de 0..1');
  for(const k of ['AOV','Volumen_Mercado','Clicks_GSC']) if(num(p,k)!==null && p[k]<0) issues.push(`${k} negativo`);
  if(issues.length) return {status:'INVALID',missing,issues};
  if(missing.length) return {status:'INCOMPLETE',missing,issues:[]};
  return {status:'VALID',missing:[],issues:[]};
}

export function classify(p){
  const q=dataQuality(p);
  if(q.status!=='VALID') return 'ANOMALIA';
  const {Stock,Posicion_GSC:position,Volumen_Mercado:volume}=p;
  if(Stock<STOCK_MINIMUM) return 'IGNORAR';
  if(position>=4&&position<=15&&volume>=HIGH_VOLUME_MIN) return 'QUICK_WIN';
  if(position>=1&&position<=3&&volume>=HIGH_VOLUME_MIN) return 'PROTEGER';
  if(volume>=HIGH_VOLUME_MIN&&position>20) return 'CONTENT_GAP';
  return 'ANOMALIA';
}

export function potentialTraffic(p,expectedCtr=EXPECTED_CTR_DEFAULT){
  const volume=num(p,'Volumen_Mercado');
  return volume===null||expectedCtr==null?null:Math.max(0,volume*expectedCtr);
}

export function revenueGap(p,expectedCtr=EXPECTED_CTR_DEFAULT){
  const potential=potentialTraffic(p,expectedCtr), clicks=num(p,'Clicks_GSC'), cr=num(p,'Conversion_Rate'), aov=num(p,'AOV');
  if([potential,clicks,cr,aov].some(v=>v===null)) return null;
  return Math.max(0,(potential-clicks)*cr*aov);
}

export function organicSearchShare(p){
  const impressions=num(p,'Impresiones_GSC'), volume=num(p,'Volumen_Mercado');
  return impressions===null||volume===null||volume<=0?null:impressions/volume;
}

export function calculateProduct(p,expectedCtr=EXPECTED_CTR_DEFAULT){
  const result={...p};
  result.Data_Quality=dataQuality(p).status;
  result.Potential_Traffic=potentialTraffic(p,expectedCtr);
  result.Revenue_Gap=revenueGap(p,expectedCtr);
  result.Organic_Search_Share=organicSearchShare(p);
  result.Clasificacion=classify(p);
  result.Prioridad=PRIORITY_BY_CLASS[result.Clasificacion]??4;
  return result;
}

export function calculateDataset(products,expectedCtr=EXPECTED_CTR_DEFAULT){return products.map(p=>calculateProduct(p,expectedCtr));}
