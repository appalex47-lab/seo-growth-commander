const DB_NAME='gssc.catalog';
const DB_VERSION=1;
const STORE='catalogs';
const ACTIVE_ID='active';

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
  const record={id:ACTIVE_ID,source,updated_at:new Date().toISOString(),data};
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('No se pudo guardar el catálogo.'));});
  db.close();
  return record;
}

export async function loadCatalog(){
  const db=await openDB();
  const record=await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(ACTIVE_ID);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error||new Error('No se pudo leer el catálogo.'));});
  db.close();
  return record;
}

export async function deleteCatalog(){
  const db=await openDB();
  await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(ACTIVE_ID);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('No se pudo borrar el catálogo.'));});
  db.close();
}

export async function clearCatalogDatabase(){
  if(!('indexedDB' in window)) return;
  await new Promise((resolve,reject)=>{const req=indexedDB.deleteDatabase(DB_NAME);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error||new Error('No se pudo eliminar la base IndexedDB.'));req.onblocked=()=>reject(new Error('La base IndexedDB está bloqueada.'));});
}

export const STORAGE_INFO={dbName:DB_NAME,dbVersion:DB_VERSION,store:STORE};
