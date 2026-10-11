import {calculateDataset} from './businessRules.js';

export const PIPELINE_VERSION='1.0';
export const CALCULATED_FIELDS=['Data_Quality','Potential_Traffic','Revenue_Gap','Organic_Search_Share','Clasificacion','Prioridad'];

export function runPipeline(data){
  if(!data || !Array.isArray(data.products)) throw new Error('El pipeline requiere data.products.');
  const products=calculateDataset(data.products);
  const qualitySummary=products.reduce((acc,p)=>{acc[p.Data_Quality]=(acc[p.Data_Quality]||0)+1;return acc},{VALID:0,INCOMPLETE:0,INVALID:0});
  return {...data,pipeline_version:PIPELINE_VERSION,products,quality_summary:qualitySummary,calculated_fields:[...CALCULATED_FIELDS],ai_ready:true};
}

export function protectBusinessTruth(product,aiOutput={}){
  const result={...product};
  const protectedFields=new Set(['SKU',...CALCULATED_FIELDS]);
  Object.entries(aiOutput).forEach(([key,value])=>{if(!protectedFields.has(key)) result[key]=value;});
  return result;
}
