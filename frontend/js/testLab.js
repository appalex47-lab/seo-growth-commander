import {loadData} from './data.js';

export async function loadScenarios(){
  const res=await fetch('data/test_scenarios.json',{cache:'no-store'});
  if(!res.ok) throw new Error(`No se pudo cargar el laboratorio (${res.status})`);
  const payload=await res.json();
  if(!Array.isArray(payload.scenarios)) throw new Error('El laboratorio no contiene escenarios válidos');
  return payload.scenarios;
}

export function renderTestLab(scenarios){
  return `<section class="card"><div class="lab-head"><div><h2 class="section-title">Test Data Lab</h2><p class="section-sub">Carga escenarios aislados para comprobar reglas y estados antes de usar archivos reales o APIs.</p></div><span class="test-badge">MODO PRUEBA</span></div><div class="scenario-grid">${scenarios.map(s=>`<article class="scenario-card"><span class="scenario-id">${s.id}</span><h3>${s.name}</h3><p>${s.description}</p><button class="primary-btn scenario-load" data-scenario="${s.id}" type="button">Cargar escenario</button></article>`).join('')}</div></section>`;
}

export async function bindTestLab(scenarios,onLoad){
  document.querySelectorAll('.scenario-load').forEach(btn=>btn.addEventListener('click',()=>{
    const scenario=scenarios.find(s=>s.id===btn.dataset.scenario);
    if(scenario) onLoad({products:scenario.products,source:`scenario:${scenario.id}`});
  }));
}
