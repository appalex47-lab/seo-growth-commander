const DB_NAME='gssc.catalog';
const DB_VERSION=1;
const STORE='catalogs';
const ACTIVE_ID='active';
const ACTIVE_KEY='active-pointer';

function openDB(){
  return new Promise((resolve,reject)=>{
    if(!('indexedDB' in window)){reject(new Error('IndexedDB no está disponible en este navegador.'));return;}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE,{keyPath:'id'});};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error('No se pudo abrir IndexedDB.'));
  });
}

export async function saveCatalog(data,source='catalog'){
  const db=await openDB();
  const id=source==='test'?'dataset-test':source==='real'?'dataset-real':source==='scenario'?'dataset-scenario':ACTIVE_ID;
  const record={id,source,updated_at:new Date().toISOString(),data};
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);store.put(record);store.put({id:ACTIVE_KEY,active_id:id,source,updated_at:record.updated_at});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('No se pudo guardar el catálogo.'));});
  db.close();return record;
}

export async function loadCatalog(){
  const db=await openDB();
  const record=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const store=tx.objectStore(STORE);const ptr=store.get(ACTIVE_KEY);ptr.onsuccess=()=>{const active=ptr.result;if(!active){const req=store.get(ACTIVE_ID);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);return;}const req=store.get(active.active_id);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);};ptr.onerror=()=>reject(ptr.error||new Error('No se pudo leer el catálogo.'));});
  db.close();return record;
}

export async function deleteCatalog(){
  const db=await openDB();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);const ptr=store.get(ACTIVE_KEY);ptr.onsuccess=()=>{const active=ptr.result; if(active?.active_id)store.delete(active.active_id);store.delete(ACTIVE_KEY);};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('No se pudo borrar el catálogo.'));});
  db.close();
}

export async function deleteCatalogBySource(source){
  const db=await openDB();const id=source==='test'?'dataset-test':source==='real'?'dataset-real':source==='scenario'?'dataset-scenario':ACTIVE_ID;
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');const store=tx.objectStore(STORE);store.delete(id);const ptr=store.get(ACTIVE_KEY);ptr.onsuccess=()=>{if(ptr.result?.active_id===id)store.delete(ACTIVE_KEY)};tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('No se pudo borrar el catálogo.'));});db.close();
}

export async function clearCatalogDatabase(){
  if(!('indexedDB' in window)) return;
  await new Promise((resolve,reject)=>{const req=indexedDB.deleteDatabase(DB_NAME);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error||new Error('No se pudo eliminar la base IndexedDB.'));req.onblocked=()=>reject(new Error('La base IndexedDB está bloqueada.'));});
}

export const STORAGE_INFO={dbName:DB_NAME,dbVersion:DB_VERSION,store:STORE};
