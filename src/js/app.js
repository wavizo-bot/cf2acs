'use strict';
/* ================================================================
   ACS Digital — aplicativo single-file (PWA-ready / Vite+Capacitor)
   Armazenamento local: IndexedDB (10–30 MB suportados nativamente)
   ================================================================ */

/* ---------------- Utilitários ---------------- */
const $  = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
/* Sanitização de texto digitado/importado (defesa em profundidade — a exibição
   também escapa com esc()): remove tags, caracteres de controle e limita tamanho. */
function sanitizarTexto(s, maxLen){
  s = String(s ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if(maxLen && s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}
function yieldUI(){ return new Promise(r => requestAnimationFrame(() => setTimeout(r, 0))); }

/* ---------------- Loading (processamento pesado) ---------------- */
function showLoading(msg, sub){
  const r = $('#loading-root');
  const m = $('#ld-msg'), s = $('#ld-sub');
  if(m) m.textContent = msg || 'Processando…';
  if(s) s.textContent = sub || '';
  r.classList.add('open');
}
function setLoadingMsg(msg, sub){
  if(msg != null){ const m = $('#ld-msg'); if(m) m.textContent = msg; }
  if(sub != null){ const s = $('#ld-sub'); if(s) s.textContent = sub; }
}
function hideLoading(){ const r = $('#loading-root'); if(r) r.classList.remove('open'); }
const onlyDigits = s => String(s ?? '').replace(/\D/g,'');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const APP_ICON = 'data:image/webp;base64,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'; // ícone oficial do app (imagem anexada) — tela de nome e de senha
function debounce(fn, ms){ let t; return function(...a){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,a), ms); }; }
function fuzzy(hay, q){ // subsequência simples, ignorando acentos/caixa (apenas letras)
  hay = norm(hay); q = norm(q); if(!q) return true;
  let i = 0;
  for(const c of hay){ if(c === q[i]) i++; if(i >= q.length) return true; }
  return i >= q.length;
}
function containsFuzzy(hay, q){ return norm(hay).includes(norm(q)); }

/* ---------------- Datas ---------------- */
function pad2(n){ return String(n).padStart(2,'0'); }
function todayISO(d){ d = d || new Date(); return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
function parseDateCell(v){
  v = String(v ?? '').trim(); if(!v) return '';
  let m = v.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if(m){
    let d = +m[1], mo = +m[2], y = +m[3];
    if(y < 100) y += y < 70 ? 2000 : 1900;
    if(mo > 12 && d <= 12){ const t=d; d=mo; mo=t; } // fallback mm/dd
    if(mo < 1 || mo > 12 || d < 1 || d > 31) return '';
    const dt = new Date(Date.UTC(y, mo-1, d));
    if(dt.getUTCFullYear()===y && dt.getUTCMonth()===mo-1 && dt.getUTCDate()===d)
      return y+'-'+pad2(mo)+'-'+pad2(d);
    return '';
  }
  m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if(m){
    const y=+m[1], mo=+m[2], d=+m[3];
    if(mo<1||mo>12||d<1||d>31) return '';
    return y+'-'+pad2(mo)+'-'+pad2(d);
  }
  return '';
}
function fmtDate(iso){ if(!iso) return ''; const p = iso.split('-'); return p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : iso; }
function idadeEm(nascISO, refISO){
  if(!nascISO) return null;
  const n = nascISO.split('-').map(Number), r = (refISO || todayISO()).split('-').map(Number);
  let a = r[0]-n[0];
  if(r[1] < n[1] || (r[1] === n[1] && r[2] < n[2])) a--;
  return a < 0 ? null : a;
}
function idadeTxt(r){ const i = idadeEm(r.nascimento); return i==null ? '' : '('+i+' anos)'; }
function diffDias(isoA, isoB){ // isoA - isoB em dias
  const a = new Date(isoA+'T00:00:00Z'), b = new Date(isoB+'T00:00:00Z');
  return Math.round((a-b)/86400000);
}
function addMeses(iso, m){
  const p = iso.split('-').map(Number);
  const d = new Date(Date.UTC(p[0], p[1]-1+m, 1));
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth()+1, 0)).getUTCDate();
  return d.getUTCFullYear()+'-'+pad2(d.getUTCMonth()+1)+'-'+pad2(Math.min(p[2], last));
}
function trimestreNum(d){ d = d || new Date(); return Math.floor(d.getMonth()/3)+1; }
function trimestreStr(d){ d = d || new Date(); return pad2(trimestreNum(d))+'/'+d.getFullYear(); }
function fimTrimestreISO(d){
  d = d || new Date();
  const lastMonth = [2,5,8,11][trimestreNum(d)-1];
  const y = d.getFullYear();
  const last = new Date(Date.UTC(y, lastMonth+1, 0));
  return todayISO(last);
}
function isPrimeiroDiaTrimestre(d){
  d = d || new Date();
  return d.getDate() === 1 && [0,3,6,9].includes(d.getMonth());
}
function aniversarioNoDia(nascISO, refISO){
  if(!nascISO) return false;
  const p = nascISO.split('-'), r = (refISO||todayISO()).split('-');
  return p[1] === r[1] && p[2] === r[2];
}
function diasParaAniversario(nascISO, refISO){
  if(!nascISO) return null;
  const p = nascISO.split('-').map(Number);
  const ref = refISO || todayISO();
  const r = ref.split('-').map(Number);
  const mk = y => new Date(Date.UTC(y, p[1]-1, p[2]));
  let alvo = mk(r[0]);
  const hoje = new Date(ref+'T00:00:00Z');
  if(alvo < hoje) alvo = mk(r[0]+1);
  return Math.round((alvo-hoje)/86400000);
}

/* ---------------- Hash e senha sazonal ---------------- */
function hashStr(s){
  let h = 2166136261;
  for(let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const SENHA_ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
function senhaSazonal(nome, triStr){
  const rng = mulberry32(hashStr(String(nome||'').trim().toUpperCase() + '|' + triStr));
  let s = '';
  for(let i=0;i<4;i++) s += SENHA_ALFABETO[Math.floor(rng()*SENHA_ALFABETO.length)];
  return s;
}
function senhaValida(s){ return /^[A-Z1-9]{4}$/.test(s||''); }

/* ---------------- IndexedDB ---------------- */
const DB_NAME = 'acs-digital', DB_VER = 1;
let _db = null;
function idb(){
  if(_db) return Promise.resolve(_db);
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = e => {
      const db = e.target.result;
      const mk = (name, opt) => { if(!db.objectStoreNames.contains(name)) db.createObjectStore(name, opt); };
      mk('kv', {keyPath:'k'});
      mk('residents', {keyPath:'id', autoIncrement:true});
      mk('area', {keyPath:'id', autoIncrement:true});
      mk('filterDefs', {keyPath:'nome'});
      mk('guides', {keyPath:'id', autoIncrement:true});
      mk('appointments', {keyPath:'id', autoIncrement:true});
    };
    r.onsuccess = () => { _db = r.result; res(_db); };
    r.onerror = () => rej(r.error);
  });
}
function idbReq(store, mode, fn){
  return idb().then(db => new Promise((res, rej) => {
    const t = db.transaction(store, mode);
    const out = fn(t.objectStore(store));
    t.oncomplete = () => res(out && out.result !== undefined ? out.result : out);
    t.onerror = () => rej(t.error);
  }));
}
const idbGet  = (st, k)    => idbReq(st,'readonly',  o => o.get(k)).then(r => r);
const idbAll  = (st)       => idbReq(st,'readonly',  o => o.getAll()).then(r => r || []);
const idbPut  = (st, v)    => idbReq(st,'readwrite', o => o.put(v));
const idbDel  = (st, k)    => idbReq(st,'readwrite', o => o.delete(k));
const idbClr  = (st)       => idbReq(st,'readwrite', o => o.clear());
async function idbClrAll(){ for(const st of ['kv','residents','area','filterDefs','guides','appointments']) await idbClr(st); }

/* ---------------- KV / estado ---------------- */
async function kvGet(k, def){ const r = await idbGet('kv', k); return r === undefined || r === null ? def : r.v; }
async function kvSet(k, v){ return idbPut('kv', {k, v}); }

const S = { // estado carregado do banco
  nome: '', importado: false, areaDefinida: false,
  senhaCustom: null, senhaCancelada: false, usadaTri: null,
  tema: { fonte:'m', modo:'claro', paleta:0 }
};
let desbloqueada = false; // estado da sessão (senha já validada nesta sessão)
async function carregarEstado(){
  const st = await kvGet('state', null);
  if(st) Object.assign(S, st);
  if(!S.tema) S.tema = { fonte:'m', modo:'claro', paleta:0 };
}
function salvarEstado(){ return kvSet('state', S); }
function senhaObrigatoria(){
  const y = new Date().getFullYear();
  return y > 2026 || new URLSearchParams(location.search).has('senha');
}
function senhaAtiva(){ return (S.senhaCustom && !S.senhaCancelada) ? S.senhaCustom : senhaSazonal(S.nome, trimestreStr()); }
function senhaEhSazonal(){ return !(S.senhaCustom && !S.senhaCancelada); }

/* ---------------- Tema ---------------- */
function applyTheme(){
  const t = S.tema || { fonte:'m', modo:'claro', paleta:0 };
  document.documentElement.dataset.font = t.fonte || 'm';
  document.documentElement.dataset.modo = t.modo || 'claro';
  document.documentElement.dataset.paleta = String(t.paleta ?? 0);
  const meta = document.querySelector('meta[name=theme-color]');
  if(meta) meta.content = (t.modo === 'escuro') ? '#0d2c44' : '#0066b3';
}

/* ---------------- Banner / Toast ---------------- */
let toastTimer = null;
function toast(msg, ms){
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>t.classList.remove('show'), ms || 2200);
}
let bannerTimer = null;
function banner(msg, ms){
  const b = $('#banner'), bi = $('#banner-in');
  bi.textContent = msg; b.classList.add('show');
  const fechar = () => { b.classList.remove('show'); clearTimeout(bannerTimer); cleanup(); };
  let startY = null;
  const onDown = e => { startY = (e.touches ? e.touches[0].clientY : e.clientY); };
  const onUp = e => {
    if(startY != null){
      const y = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
      if(startY - y > 25){ fechar(); return; } // empurrado para cima
    }
    if(e.target === b || e.target === bi || bi.contains(e.target)) fechar(); // clique
  };
  function cleanup(){
    b.removeEventListener('pointerdown', onDown);
    b.removeEventListener('pointerup', onUp);
  }
  b.addEventListener('pointerdown', onDown);
  b.addEventListener('pointerup', onUp);
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(fechar, ms || 5000);
}

/* ---------------- Modal ---------------- */
function openModal(html, opts){
  opts = opts || {};
  const root = $('#modal-root');
  const jaAberto = root.classList.contains('open');
  // Guarda o foco: se um input/textarea do modal estava em uso e o conteúdo é
  // re-renderizado (ex.: lista atualizando enquanto digita), devolve foco+cursor.
  const foco = jaAberto ? document.activeElement : null;
  let guardou = null;
  if(foco && foco.id && root.contains(foco) && (foco.tagName === 'INPUT' || foco.tagName === 'TEXTAREA')){
    let s = null, e = null;
    try{ s = foco.selectionStart; e = foco.selectionEnd; }catch(err){}
    guardou = { id: foco.id, s, e };
  }
  if(jaAberto){
    // Reaproveita a caixa aberta: sem re-animar (evita "piscar" e perda de foco)
    const m = root.querySelector('.modal');
    if(m) m.innerHTML = html;
    const ov = root.querySelector('.overlay');
    if(ov) ov.classList.toggle('alto', !!opts.alto);
  } else {
    root.innerHTML = '<div class="overlay'+(opts.alto ? ' alto' : '')+'"><div class="modal">' + html + '</div></div>';
    root.classList.add('open');
  }
  if(guardou){
    const sel = '#modal-root #' + (window.CSS && CSS.escape ? CSS.escape(guardou.id) : guardou.id);
    const alvo = root.querySelector(sel);
    if(alvo){
      try{
        alvo.focus({preventScroll:true});
        if(guardou.s != null) alvo.setSelectionRange(guardou.s, guardou.e);
      }catch(err){}
    }
  }
  return root.querySelector('.modal');
}
function closeModal(){ const r = $('#modal-root'); r.classList.remove('open'); r.innerHTML = ''; }
function modalTop(titulo, btnVoltarLabel){
  return '<div class="m-top">' +
    '<button class="btn btn-sm btn-ghost m-voltar">← ' + esc(btnVoltarLabel||'VOLTAR') + '</button>' +
    '<div class="m-title">' + esc(titulo) + '</div>' +
    '<span style="min-width:60px;display:inline-block"></span>' +
  '</div>';
}
function bindModalVoltar(fn){
  const b = $('#modal-root .m-voltar');
  if(b) b.addEventListener('click', fn);
}

/* ---------------- CSV ---------------- */
function detectDelim(text){
  const linha = text.split(/\r?\n/).find(l => l.trim()) || '';
  let inQ = false, sc=0, cm=0, tb=0;
  for(const ch of linha){
    if(ch === '"') inQ = !inQ;
    else if(!inQ){ if(ch === ';') sc++; else if(ch === ',') cm++; else if(ch === '\t') tb++; }
  }
  const mx = Math.max(sc, cm, tb);
  if(mx === 0) return ',';
  return mx === sc ? ';' : (mx === cm ? ',' : '\t');
}
async function parseCSV(text){
  text = String(text ?? '').replace(/^\uFEFF/, '');
  const delim = detectDelim(text);
  const rows = []; let row = [], field = '', inQ = false;
  for(let i = 0; i < text.length; i++){
    const c = text[i];
    if(inQ){
      if(c === '"'){
        if(text[i+1] === '"'){ field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else {
      if(c === '"') inQ = true;
      else if(c === delim){ row.push(field); field = ''; }
      else if(c === '\n'){ row.push(field); rows.push(row); row = []; field = ''; }
      else if(c === '\r'){ /* ignora */ }
      else field += c;
    }
    // Arquivos grandes (30 mil+ linhas): devolve o controle à UI periodicamente
    // para o spinner continuar girando e a tela não congelar.
    if((i & 0x3FFFF) === 0x3FFFF){
      setLoadingMsg(null, rows.length.toLocaleString('pt-BR') + ' linhas lidas…');
      await yieldUI();
    }
  }
  if(field !== '' || row.length){ row.push(field); rows.push(row); }
  return rows.filter(r => r.some(c => String(c).trim() !== ''));
}
const isSim = v => ['SIM','S','X','TRUE','VERDADEIRO','1','YES','OK'].includes(String(v ?? '').trim().toUpperCase());
const HEADER_WORDS = ['nome','nome completo','nome do morador','data de nascimento','nascimento','nome da mãe','nome da mae','cadastro nome','cidadao nome','usuario saude nome','usuário saúde nome'];

/* ---------------- Impressão ---------------- */
function imprimirHTML(titulo, corpoHTML){
  const css = 'body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#111}' +
    'h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:18px 0 6px}' +
    '.sub{color:#555;font-size:12px;margin-bottom:14px}' +
    'table{width:100%;border-collapse:collapse;font-size:12px}' +
    'td,th{border:1px solid #999;padding:5px 7px;text-align:left;vertical-align:top}' +
    'th{background:#e3eef7}.empty{color:#777;font-size:12px}';
  const html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(titulo) + '</title>' +
    '<style>' + css + '</style></head><body>' +
    '<h1>' + esc(titulo) + '</h1>' +
    '<div class="sub">ACS Digital — ' + esc(S.nome || '') + ' — ' + fmtDate(todayISO()) + '</div>' +
    corpoHTML + '</body></html>';
  const w = window.open('', '_blank');
  if(w){ w.document.write(html); w.document.close(); w.focus(); setTimeout(()=>w.print(), 350); }
  else {
    const f = document.createElement('iframe');
    f.style.position='fixed'; f.style.right='0'; f.style.bottom='0'; f.style.width='0'; f.style.height='0'; f.style.border='0';
    document.body.appendChild(f);
    f.srcdoc = html;
    f.onload = () => { try{ f.contentWindow.print(); }catch(e){} setTimeout(()=>f.remove(), 4000); };
  }
}
async function copiarTexto(txt){
  try { await navigator.clipboard.writeText(txt); toast('Copiado para a área de transferência'); }
  catch(e){
    const ta = document.createElement('textarea');
    ta.value = txt; document.body.appendChild(ta); ta.select();
    try{ document.execCommand('copy'); toast('Copiado para a área de transferência'); }
    catch(e2){ toast('Não foi possível copiar'); }
    ta.remove();
  }
}
/* ---------------- Navegação ---------------- */
const stack = [];
let menuLiberado = false;
let currentRender = null;
const SCREENS = {};
function registerScreen(name, fn){ SCREENS[name] = fn; }
function render(scr, params){
  currentRender = {scr, params: params || {}};
  closeModal();
  const fn = SCREENS[scr];
  const app = $('#app');
  app.innerHTML = '';
  if(fn) fn(app, params || {});
  window.scrollTo(0, 0);
}
function go(scr, params){
  stack.push({scr, params: params || {}});
  render(scr, params || {});
  try{ history.pushState({i: stack.length - 1}, ''); }catch(e){}
}
function resetStack(scr, params, escudo){
  stack.length = 0;
  stack.push({scr, params: params || {}});
  render(scr, params || {});
  try{
    history.replaceState({i: 0}, '');
    if(escudo) history.pushState({i: 0, shield: true}, ''); // escudo só no boot
  }catch(e){}
}
window.addEventListener('popstate', (e) => {
  const cur = stack[stack.length - 1];
  if(!cur) return;
  const st = e.state || {};
  // TELA DO MENU liberada: botão voltar do aparelho não retorna a nome/senha.
  const bloqueado = (cur.scr === 'nome') || (cur.scr === 'senha') ||
                    (cur.scr === 'menu' && menuLiberado) || stack.length <= 1;
  if(st.shield || bloqueado){
    // Escudo no meio do histórico: se a tela atual NÃO for bloqueada, executa o
    // voltar de verdade (antes o usuário ficava preso após o primeiro retorno).
    if(!bloqueado){
      stack.pop();
      const t = stack[stack.length - 1];
      render(t.scr, t.params);
    }
    try{ history.pushState({i: stack.length - 1, shield: stack.length <= 1}, ''); }catch(err){}
    return;
  }
  if(typeof st.i === 'number' && st.i >= 0 && st.i < stack.length - 1){
    stack.length = st.i + 1;
  } else {
    stack.pop();
  }
  const t = stack[stack.length - 1];
  render(t.scr, t.params);
  if(stack.length === 1){
    try{ history.pushState({i: 0, shield: true}, ''); }catch(err){} // re-escudo na raiz
  }
});
function navBack(){
  // Navegação direta pelo stack interno — NÃO depende de history.back(),
  // que trava em file:// ("'file:' URLs are treated as unique security origins")
  // e após consumir o escudo de histórico (bug: voltar funcionava só uma vez).
  if(stack.length <= 1){
    // segurança extra: nunca deixa o usuário preso fora do menu
    if(menuLiberado && currentRender && currentRender.scr !== 'menu') resetStack('menu');
    return;
  }
  stack.pop();
  const t = stack[stack.length - 1];
  render(t.scr, t.params);
  try{ history.replaceState({i: stack.length - 1}, ''); }catch(e){}
}
/* ---------------- Relógio (virada do dia / trimestre) ---------------- */
let _lastDate = todayISO();
let _lastTri = trimestreStr();
function iniciarRelogio(){
  setInterval(async () => {
    const t = todayISO();
    if(t === _lastDate) return;
    _lastDate = t;
    const tri = trimestreStr();
    if(tri !== _lastTri){
      _lastTri = tri;
      if(senhaObrigatoria()){
        desbloqueada = false;
        banner('O trimestre mudou. A senha foi redefinida — informe a senha de ativação.');
        resetStack('senha');
      } else {
        banner('Novo trimestre iniciado (' + tri + '). A senha sazonal foi redefinida.');
      }
    }
    const cur = currentRender;
    if(cur && ['menu','avisos','moradores','filtros','perfil','agendamentos','guias'].includes(cur.scr))
      render(cur.scr, cur.params);
  }, 30000);
}

/* ---------------- Busca de moradores (regras próprias) ---------------- */
const RUA_WORDS = ['rua','avenida','estrada','alameda','viela','praca','travessa'];
function letras(s){ return norm(s).replace(/[^a-z]/g,'').length; }
function comecaComRua(s){ const t = norm(s).split(/\s+/); return t.length && RUA_WORDS.includes(t[0]); }
function interpretarBusca(q){
  const raw = String(q || '').trim();
  if(!raw) return {tipo:'vazio'};
  const nq = norm(raw);
  if(/^(\d{2})\/(\d{2})\/(\d{4})$/.test(raw)) return {tipo:'data', iso: parseDateCell(raw)};
  if(nq.includes('aniversariante')) return {tipo:'aniversario'};
  const mm = nq.match(/^m[ae]e\s+(.+)$/);
  if(mm){
    const rest = mm[1].trim();
    return letras(rest) >= 3 ? {tipo:'mae', q: rest} : {tipo:'nenhum'};
  }
  if(/^\d+$/.test(raw)) return raw.length >= 4 ? {tipo:'numero', n: raw} : {tipo:'nenhum'};
  const mn = raw.match(/^(.+?)\s+(\d+)$/);
  if(mn && !(/^\d+$/.test(mn[1]))){
    if(letras(mn[1]) >= 3 || comecaComRua(mn[1])) return {tipo:'enderecoNumero', rua: mn[1], num: mn[2]};
    return {tipo:'nenhum'};
  }
  const toks = nq.split(/\s+/);
  if(RUA_WORDS.includes(toks[0])){
    const rest = toks.slice(1).join(' ').trim();
    if(!rest) return {tipo:'nenhum'}; // nome de rua sozinho não ativa a busca
    return {tipo:'endereco', q: rest};
  }
  if(letras(raw) >= 3) return {tipo:'geral', q: raw};
  return {tipo:'nenhum'};
}
function buscarMoradores(rs, it){
  switch(it.tipo){
    case 'data': return rs.filter(r => r.nascimento && r.nascimento === it.iso);
    case 'aniversario': return rs.filter(r => aniversarioNoDia(r.nascimento));
    case 'mae': return rs.filter(r => fuzzy(r.mae, it.q));
    case 'numero': return rs.filter(r =>
        onlyDigits(r.cns).includes(it.n) || onlyDigits(r.cpf).includes(it.n) ||
        onlyDigits(r.cadastro).includes(it.n) || onlyDigits(r.telRes).includes(it.n) ||
        onlyDigits(r.telCel).includes(it.n) || onlyDigits(r.telRec).includes(it.n));
    case 'enderecoNumero': return rs.filter(r => fuzzy(r.endereco, it.rua) && String(r.numero||'').trim() === it.num);
    case 'endereco': return rs.filter(r => fuzzy(r.endereco, it.q));
    case 'geral': return rs.filter(r => fuzzy(r.nome, it.q) || fuzzy(r.endereco, it.q));
    default: return [];
  }
}
const TXT_BUSCA_NENHUM = 'Digite ao menos 3 letras do nome ou endereço. Ex.: "mãe ana", "dario 3080", "05/03/1978", "aniversariante" ou 4+ números (CNS, CPF, cadastro, telefone).';

/* ---------------- Ordenação de moradores ---------------- */
function numDe(v){ const n = parseInt(String(v).replace(/\D/g,''),10); return isNaN(n) ? Infinity : n; }
function ordenarMoradores(arr, org){
  const byNum = (sinal) => (a,b) => {
    const na = numDe(a.numero), nb = numDe(b.numero);
    if(na === nb) return 0;
    if(na === Infinity) return 1;
    if(nb === Infinity) return -1;
    return sinal * (na - nb);
  };
  const byEnd = (sinal) => (a,b) => sinal * String(a.endereco||'').localeCompare(String(b.endereco||''), 'pt-BR');
  const byNasc = (sinal) => (a,b) => {
    if(!a.nascimento && !b.nascimento) return 0;
    if(!a.nascimento) return 1;
    if(!b.nascimento) return -1;
    return sinal * a.nascimento.localeCompare(b.nascimento);
  };
  const byNome = (sinal) => (a,b) => sinal * String(a.nome||'').localeCompare(String(b.nome||''), 'pt-BR');
  const fns = {
    'e0': [byEnd(-1),  byNum(-1)],   // ⬆️⬆️ endereço e número decrescentes
    'e1': [byEnd(1),   byNum(1)],    // ⬇️⬇️ endereço e número crescentes (padrão)
    'e2': [byEnd(1),   byNum(-1)],   // ⬇️⬆️ endereço crescente, número decrescente
    'e3': [byEnd(-1),  byNum(1)],    // ⬆️⬇️ endereço decrescente, número crescente
    'i0': [byNasc(-1)],              // 👶👴 mais novo → mais velho
    'i1': [byNasc(1)],               // 👴👶 mais velho → mais novo
    'a0': [byNome(1)],               // ⬇️🔠 A-Z
    'a1': [byNome(-1)]               // ⬆️🔠 Z-A
  };
  return arr.sort((a,b) => { for(const f of fns[org]){ const r = f(a,b); if(r) return r; } return 0; });
}
const ORG_BANNERS = {
  'e0':'Endereço e número decrescentes','e1':'Endereço e número crescentes',
  'e2':'Endereço crescente, número decrescente','e3':'Endereço decrescente, número crescente',
  'i0':'Idade crescente','i1':'Idade decrescente','a0':'Alfabético crescente','a1':'Alfabético decrescente'
};
const ORG_ICONES = {'e0':'⬆️⬆️🏠','e1':'⬇️⬇️🏠','e2':'⬇️⬆️🏠','e3':'⬆️⬇️🏠','i0':'👶👴','i1':'👴👶','a0':'⬇️🔠','a1':'⬆️🔠'};
const ORG_CICLO = { end:['e0','e1','e2','e3'], idade:['i0','i1'], alfa:['a0','a1'] };
/*
 Estado dos organizadores: cada botão exibe a PRÓXIMA organização que será
 aplicada ao clicar; a organização ativa atual fica com fundo destacado.
 Padrão: e1 (endereço e número crescentes).
*/
function novoEstadoOrd(){ return {org:'e1', prox:{end:'e2', idade:'i0', alfa:'a0'}}; }
function htmlSortRow(st){
  const ehAtiva = g => st.prox[g] && st.org.startsWith && ORG_CICLO[g].includes(st.org);
  const ativaEnd = st.org[0] === 'e', ativaId = st.org[0] === 'i', ativaAl = st.org[0] === 'a';
  return '<div class="sort-row">' +
    '<button class="sort-btn '+(ativaEnd?'active':'')+'" data-sort="end" title="Organizar por endereço">'+ORG_ICONES[st.prox.end]+'</button>' +
    '<button class="sort-btn '+(ativaId?'active':'')+'" data-sort="idade" title="Organizar por idade">'+ORG_ICONES[st.prox.idade]+'</button>' +
    '<button class="sort-btn '+(ativaAl?'active':'')+'" data-sort="alfa" title="Organizar por nome">'+ORG_ICONES[st.prox.alfa]+'</button>' +
  '</div>';
}
function bindSortRow(container, st, reexec){
  container.querySelectorAll('[data-sort]').forEach(b => {
    b.addEventListener('click', () => {
      const g = b.dataset.sort;
      st.org = st.prox[g]; // aplica a organização exibida
      toast(ORG_BANNERS[st.org], 2000);
      // avança para a próxima opção do ciclo
      const ciclo = ORG_CICLO[g];
      st.prox[g] = ciclo[(ciclo.indexOf(st.org) + 1) % ciclo.length];
      // reescreve ícones mantendo destaque da ativa
      const ativaEnd = st.org[0] === 'e', ativaId = st.org[0] === 'i', ativaAl = st.org[0] === 'a';
      container.querySelectorAll('[data-sort]').forEach(bb => {
        const gg = bb.dataset.sort;
        bb.classList.toggle('active', (gg==='end'&&ativaEnd)||(gg==='idade'&&ativaId)||(gg==='alfa'&&ativaAl));
        bb.textContent = ORG_ICONES[st.prox[gg]];
      });
      reexec();
    });
  });
}

/* ---------------- Moradores: helpers ---------------- */
function linhaEndereco(r){
  const e = (r.endereco||'').trim(), n = String(r.numero||'').trim();
  const base = e ? (n ? e + ', ' + n : e) : n;
  const extra = [String(r.complemento||'').trim(), String(r.bairro||'').trim()].filter(Boolean).join(' — ');
  const s = base + (base && extra ? ' — ' : '') + extra;
  return s || '(sem endereço)';
}
function filtrosDoMorador(r){
  const list = (r.filtros||[]).map(f => f.nome);
  const i = idadeEm(r.nascimento);
  if(i != null && i < 2 && !list.some(n => norm(n) === 'puericultura')) list.push('PUERICULTURA');
  return list;
}
function filtrosBadges(r, max){
  const fs = filtrosDoMorador(r);
  if(!fs.length) return '';
  max = max || 4;
  const vis = fs.slice(0, max).map(f => '<span class="badge imp">'+esc(f)+'</span>').join('');
  return '<span class="p-badges">' + vis + (fs.length > max ? '<span class="badge">+'+(fs.length-max)+'</span>' : '') + '</span>';
}
function moradorRowHTML(r, opts){
  opts = opts || {};
  return '<div class="p-row '+(opts.classe||'')+'" data-id="'+r.id+'">' +
    '<span class="p-nome">'+esc(r.nome||'(sem nome)')+'</span>' +
    '<span class="p-sub">'+esc(linhaEndereco(r))+(r.nascimento ? ' · '+fmtDate(r.nascimento)+' '+idadeTxt(r) : '')+'</span>' +
    filtrosBadges(r, opts.maxBadges) +
  '</div>';
}
function topbarHTML(opts){
  const esq = opts.esq
    ? '<button class="btn-tb" id="'+(opts.esq.id||'tb-voltar')+'"'+(opts.esq.disabled?' disabled':'')+'>'+esc(opts.esq.label||'⟵ VOLTAR')+'</button>'
    : '<span style="min-width:56px"></span>';
  const dir = opts.dir
    ? '<button class="btn-tb" id="'+(opts.dir.id||'tb-salvar')+'"'+(opts.dir.disabled?' disabled':'')+'>'+esc(opts.dir.label||'SALVAR')+'</button>'
    : '<span style="min-width:56px"></span>';
  return '<div class="topbar">' +
    '<div class="tb-side">'+esq+'</div>' +
    '<div class="tb-title">'+esc(opts.titulo)+(opts.sub?'<small'+(opts.subWrap?' class="wrap"':'')+'>'+esc(opts.sub)+'</small>':'')+'</div>' +
    '<div class="tb-side right">'+dir+'</div>' +
  '</div>';
}

/* ---------------- Cálculo de avisos ---------------- */
async function computeAvisos(){
  const hoje = todayISO();
  const triAgora = trimestreStr();
  const resolvidos = (await kvGet('resolvidos', {})) || {};
  const avisados = (await kvGet('avisados', {})) || {};
  const out = [];
  const ativo = id => !(resolvidos[id]) || resolvidos[id] === hoje; // resolvido hoje ainda aparece; depois some

  if(S.importado){
    const rs = await idbAll('residents');
    const defs = await idbAll('filterDefs');
    const defPorNome = {}; defs.forEach(d => defPorNome[norm(d.nome)] = d);
    const cnsCount = {};
    for(const r of rs){ const c = onlyDigits(r.cns); if(c) cnsCount[c] = (cnsCount[c]||0)+1; }
    // perfis duplicados: mesmo nome completo + nascimento
    const gruposNN = {};
    for(const r of rs){
      if(!norm(r.nome) || !r.nascimento) continue;
      const k = norm(r.nome) + '|' + r.nascimento;
      (gruposNN[k] = gruposNN[k] || []).push(r);
    }
    for(const k in gruposNN){
      const g = gruposNN[k];
      if(g.length > 1){
        const id = 'dup-'+hashStr(k);
        if(ativo(id)) out.push({id, acao:'RESOLVIDO', feito:!!resolvidos[id],
          titulo:'Perfis possivelmente duplicados ('+g.length+')',
          texto: esc(g[0].nome)+' · '+fmtDate(g[0].nascimento)+' — '+g.length+' perfis com o mesmo nome e nascimento. Verifique e unifique os dados.'});
      }
    }
    for(const r of rs){
      // 1) cadastros incompletos
      const faltas = [];
      if(!onlyDigits(r.cadastro)) faltas.push('cadastro (cartão cidadão)');
      if(!onlyDigits(r.cpf)) faltas.push('CPF');
      const c = onlyDigits(r.cns);
      if(!c) faltas.push('CNS');
      else if(cnsCount[c] > 1) faltas.push('CNS em duplicidade');
      if(!norm(r.mae)) faltas.push('nome da mãe');
      if(!r.nascimento) faltas.push('data de nascimento');
      if(!norm(r.endereco) || !String(r.numero||'').trim()) faltas.push('endereço completo (com número)');
      if(faltas.length){
        const id = 'inc-'+r.id;
        if(ativo(id)) out.push({id, acao:'RESOLVIDO', feito:!!resolvidos[id],
          titulo:'Cadastro incompleto',
          texto: esc(r.nome||'(sem nome)')+' — falta: '+faltas.join(', ')});
      }
      // 2) validade de filtros chegando (10 dias)
      for(const f of (r.filtros||[])){
        if(f.validade){
          const d = diffDias(f.validade, hoje);
          if(d >= 0 && d <= 10){
            const id = 'val-'+r.id+'-'+norm(f.nome)+'-'+f.validade;
            if(ativo(id)) out.push({id, acao:'RESOLVIDO', feito:!!resolvidos[id],
              titulo:'Filtro com validade chegando ('+(d===0?'hoje':d+' dia'+(d===1?'':'s'))+')',
              texto: esc(r.nome||'(sem nome)')+' — filtro '+esc(f.nome)+' vale até '+fmtDate(f.validade)});
          }
        }
      }
      // 3) periodicidade de visitas
      for(const f of (r.filtros||[])){
        const def = defPorNome[norm(f.nome)];
        if(def && def.periodicidade > 0){
          const visitas = (r.visitas||[]).map(v => v.data).filter(Boolean).sort();
          const base = visitas.length ? visitas[visitas.length-1] : (f.desde || hoje);
          const prazo = addMeses(base, def.periodicidade);
          const d = diffDias(prazo, hoje);
          if(d <= 10){
            const id = 'per-'+r.id+'-'+norm(f.nome);
            out.push({id, acao:null, feito:false,
              titulo:'Visita periódica '+(d>=0?('em '+(d===0?'hoje':d+' dia'+(d===1?'':'s'))):('vencida há '+(-d)+' dia'+(d===-1?'':'s'))),
              texto: esc(r.nome||'(sem nome)')+' — filtro '+esc(f.nome)+', visita a cada '+def.periodicidade+' mês'+(def.periodicidade>1?'es':'')+'. Registrar em VISITA DOMICILIAR.'});
          }
        }
      }
      // 7) aniversariantes (3 dias antes)
      const dAniv = diasParaAniversario(r.nascimento, hoje);
      if(dAniv != null && dAniv >= 0 && dAniv <= 3){
        const uniq = 'an-'+r.id+'-'+hoje; // aviso diário; OK só marca visualmente até o fim do dia
        out.push({id: uniq, acao:'OK', feito:!!avisados['an-'+r.id],
          titulo:'Aniversariante '+(dAniv===0?'hoje!':'em '+dAniv+' dia'+(dAniv===1?'':'s')),
          texto: esc(r.nome||'(sem nome)')+' — '+fmtDate(r.nascimento)+' '+idadeTxt(r)});
      }
    }
    // 5) agendamentos (1 dia antes; some quando o dia da consulta termina)
    const ags = await idbAll('appointments');
    for(const a of ags){
      const d = diffDias(a.data, hoje);
      if(d >= 0 && d <= 1){
        out.push({id:'ag-'+a.id, acao:'AVISADO', feito:!!avisados['ag-'+a.id],
          titulo:'Consulta '+(d===1?'amanhã':d===0?'hoje':''),
          texto: esc(a.nome||'(sem nome)')+' — '+(a.profissional?('com '+esc(a.profissional)+', '):'')+fmtDate(a.data)+(a.hora?(' às '+esc(a.hora)):'')});
      }
    }
    // 6) guias de exames (5 dias antes; some quando o dia do exame termina)
    const guias = await idbAll('guides');
    for(const g of guias){
      if(g.situacao !== 'comigo' || !g.data) continue;
      const d = diffDias(g.data, hoje);
      if(d >= 0 && d <= 5){
        out.push({id:'gu-'+g.id, acao:'AVISADO', feito:!!avisados['gu-'+g.id],
          titulo:'Exame '+(d===0?'hoje':d===1?'amanhã':'em '+d+' dias'),
          texto: esc(g.nome||'(sem nome)')+' — '+esc(g.exame||'exame')+' em '+esc(g.local||'?')+', '+fmtDate(g.data)+(g.hora?(' às '+esc(g.hora)):'')});
      }
    }
  }
  // 4) expiração de senha (10 dias antes do fim do trimestre)
  if(senhaObrigatoria() && S.usadaTri !== triAgora){
    const dFim = diffDias(fimTrimestreISO(), hoje);
    if(dFim <= 10){
      out.push({id:'senha-'+triAgora, acao:null, feito:false,
        titulo:'Senha expira '+(dFim===0?'hoje':dFim===1?'amanhã':'em '+dFim+' dia'+(dFim===1?'':'s')),
        texto:'Fim do trimestre '+triAgora+': use a nova senha sazonal para eliminar este aviso.'});
    }
  }
  return out;
}
/* ================= TELA DE NOME ================= */
registerScreen('nome', (app) => {
  app.innerHTML = '<div class="full-center">' +
    '<div class="logo-row"><img class="logo-img" alt="ACS Digital" src="'+APP_ICON+'">' +
    '<div class="app-name">ACS Digital</div>' +
    '<div class="app-sub">Esse app não recebeu recursos, apoio ou financiamento da Prefeitura Municipal de Jundiaí</div></div>' +
    '<label class="fld" for="in-nome">Nome do funcionário</label>' +
    '<input class="inp" id="in-nome" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" placeholder="Digite seu nome">' +
    '<div class="spacer"></div>' +
    '<button class="btn btn-p btn-block btn-big" id="bt-avancar" disabled>AVANÇAR</button>' +
    '<div class="recent-names" id="recentes"></div>' +
    '</div>';
  const inp = $('#in-nome'), bt = $('#bt-avancar');
  const atualizar = () => { bt.disabled = !inp.value.trim(); };
  inp.addEventListener('input', atualizar);
  kvGet('recentNames', []).then(list => {
    if(!list || !list.length) return;
    const cont = $('#recentes');
    cont.innerHTML = '<div class="muted small center" style="margin-bottom:.2rem">Toque para usar um nome recente:</div>' +
      list.map(n => '<button type="button" data-n="'+esc(n)+'">'+esc(n)+'</button>').join('');
    cont.querySelectorAll('[data-n]').forEach(b =>
      b.addEventListener('click', () => { inp.value = b.dataset.n; atualizar(); }));
  });
  setTimeout(() => inp.focus(), 60);
  const avancar = () => {
    const nome = sanitizarTexto(inp.value, 60);
    if(!nome) return;
    S.nome = nome; salvarEstado();
    kvGet('recentNames', []).then(l => {
      l = [nome].concat((l||[]).filter(n => norm(n) !== norm(nome))).slice(0,3);
      kvSet('recentNames', l);
    });
    prosseguirAposNome();
  };
  bt.addEventListener('click', avancar);
  inp.addEventListener('keydown', e => { if(e.key === 'Enter' && !bt.disabled) avancar(); });
});
async function prosseguirAposNome(){
  if(senhaObrigatoria() && !desbloqueada){ resetStack('senha'); return; }
  await irPosDesbloqueio();
}
async function irPosDesbloqueio(){
  menuLiberado = S.importado && S.areaDefinida;
  if(!S.importado) resetStack('importar');
  else if(!S.areaDefinida) resetStack('area');
  else resetStack('menu');
}

/* ================= TELA DE SENHA ================= */
/*
  4 botões com 3 caracteres cada (12 caracteres únicos). Um deles contém o
  caractere atual da senha. Toda escolha regenera os caracteres. Tela
  silenciosa: nenhum aviso de erro. 3 erros ou 3 RECOMEÇAR sem concluir =
  senha bloqueada nesta sessão (senha personalizada é cancelada).
*/
registerScreen('senha', (app) => {
  const PS = { pos: 0, err: 0, resets: 0, bloqueada: false };
  app.innerHTML = '<div class="senha-wrap">' +
    '<div class="logo-row" style="margin-bottom:.4rem"><img class="logo-img" alt="ACS Digital" src="'+APP_ICON+'" style="width:56px;height:56px;border-radius:16px">' +
    '<div class="app-sub">Senha de ativação<br><b>'+esc(S.nome||'')+'</b> · trimestre '+trimestreStr()+'</div></div>' +
    '<div class="senha-grid" id="sg">' +
      '<button class="senha-btn" data-b="0"></button>' +
      '<button class="senha-btn" data-b="1"></button>' +
      '<button class="senha-btn" data-b="2"></button>' +
      '<button class="senha-btn" data-b="3"></button>' +
    '</div>' +
    '<div class="senha-mini">' +
      '<button class="btn" id="bt-voltar2">VOLTAR</button>' +
      '<button class="btn" id="bt-recomecar">RECOMEÇAR</button>' +
    '</div></div>';
  const alfabeto = SENHA_ALFABETO.split('');
  const senhaAtual = () => senhaAtiva();
  function novaRodada(){
    const s = senhaAtual();
    if(PS.pos >= 4) return;
    const pool = alfabeto.filter(c => c !== s[PS.pos]);
    for(let i = pool.length-1; i > 0; i--){ const j = Math.floor(Math.random()*(i+1)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    const chars = pool.slice(0, 11); chars.push(s[PS.pos]);
    for(let i = chars.length-1; i > 0; i--){ const j = Math.floor(Math.random()*(i+1)); const t = chars[i]; chars[i] = chars[j]; chars[j] = t; }
    $$('#sg .senha-btn').forEach((b, i) => { b.textContent = chars[i*3] + chars[i*3+1] + chars[i*3+2]; });
  }
  function flash(){
    $$('#sg .senha-btn').forEach(b => { b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); });
  }
  function bloquear(){
    PS.bloqueada = true;
    if(S.senhaCustom){ S.senhaCustom = null; salvarEstado(); } // senha personalizada é cancelada
  }
  $$('#sg .senha-btn').forEach(b => b.addEventListener('click', () => {
    flash();
    const s = senhaAtual();
    const acertou = !PS.bloqueada && b.textContent.includes(s[PS.pos]);
    setTimeout(() => {
      if(acertou){
        PS.pos++;
        if(PS.pos >= 4){ desbloquear(); return; }
      } else {
        PS.err++;
        if(PS.err >= 3 && !PS.bloqueada) bloquear();
      }
      novaRodada();
    }, 200);
  }));
  $('#bt-recomecar').addEventListener('click', () => {
    flash();
    PS.pos = 0; PS.resets++;
    setTimeout(() => {
      if(PS.resets >= 3 && !PS.bloqueada) bloquear();
      novaRodada();
    }, 200);
  });
  $('#bt-voltar2').addEventListener('click', () => resetStack('nome'));
  novaRodada();
  async function desbloquear(){
    desbloqueada = true;
    if(senhaEhSazonal()){ S.usadaTri = trimestreStr(); }
    await salvarEstado();
    await irPosDesbloqueio();
  }
});
/* ---------------- Helpers de escrita em lote ---------------- */
function idbBulkPut(store, arr){
  return idb().then(db => new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    const os = t.objectStore(store);
    arr.forEach(v => os.put(v));
    t.oncomplete = () => res(arr.length);
    t.onerror = () => rej(t.error);
  }));
}
function idbBulkDel(store, keys){
  return idb().then(db => new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    const os = t.objectStore(store);
    keys.forEach(k => os.delete(k));
    t.oncomplete = () => res(keys.length);
    t.onerror = () => rej(t.error);
  }));
}

/* ================= TELA DE IMPORTAR ================= */
const FILTROS_INICIAIS = ['Acamado','Bolsa Família','Câncer','DM','Domiciliado','Drogas habitual','Etilista habitual','GESTANTE','Hanseníase','HAS','PUERICULTURA','Recusa Vacinas','Recusa Visitas','Saúde mental','Tabagista habitual','Tuberculose','Vulnerabilidade'];
const COND_FILTRO = { gestante:'GESTANTE', has:'HAS', dm:'DM', cancer:'Câncer', hanseniase:'Hanseníase',
  tuberculose:'Tuberculose', tabaco:'Tabagista habitual', etilista:'Etilista habitual',
  drogas:'Drogas habitual', domiciliado:'Domiciliado', acamado:'Acamado' };
const IMP = { parsed: {}, desconhecidos: [] }; // {s1:{n,regs,nome}, s2:..., s3:...} + arquivos não identificados

function colIdx(letter){
  let n = 0;
  for(const ch of String(letter).toUpperCase()) n = n*26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}
const col = (row, letter) => {
  const i = colIdx(letter);
  return (row && row[i] !== undefined) ? String(row[i]).trim() : '';
};
function ehCabecalho(s){ return HEADER_WORDS.includes(norm(s)) || ['sexo','cns','cpf','mãe','mae','endereço','endereco','número','numero','unidade','idade'].includes(norm(s)); }

/* ---- Reconhecimento dos relatórios do BI pelo CONTEÚDO do cabeçalho ---- */
const ASSINATURAS = {
  s1: ['cadastro nome','cadastro dn','numero imovel','cadastro cns','cadastro sexo','tipo logradouro','logradouro'],
  s2: ['usuario saude nome','data nascimento','doenca cardiaca','esta domiciliado','esta acamado','esta gestante','usa alcool','usa drogas','fumante','hipertensao','diabetes','cancer','hanseniase','tuberculose','planta medicinal'],
  s3: ['cidadao nome','cidadao dn','cartao cidadao','nome do pai','pais de nascimento','equipe nome','tel residencial','tel celular','tel recado','codigo ine']
};
const PALAVRA_ARQ = { s1:'analise detalhada', s2:'auto referido', s3:'cadastros detalhados' };
function pontuarCabecalho(rows){
  const hitT = { s1:0, s2:0, s3:0 };
  const info = { s1:null, s2:null, s3:null };
  const lim = Math.min(8, rows.length);
  for(let i = 0; i < lim; i++){
    const vista = new Map();
    const r = rows[i] || [];
    for(let j = 0; j < r.length; j++){
      const c = norm(r[j]);
      if(c && !vista.has(c)) vista.set(c, j);
    }
    for(const t of ['s1','s2','s3']){
      let hit = 0;
      const mapa = new Map();
      for(const tok of ASSINATURAS[t]) if(vista.has(tok)){ hit++; mapa.set(tok, vista.get(tok)); }
      if(hit > hitT[t]){ hitT[t] = hit; if(hit >= 2) info[t] = { linha:i, mapa, todos:vista }; }
    }
  }
  return { hitT, info };
}
function detectarPlanilha(nomeArq, rows){
  const { hitT } = pontuarCabecalho(rows);
  const arq = norm(nomeArq);
  for(const t of ['s1','s2','s3']) if(arq.includes(PALAVRA_ARQ[t])) hitT[t] += 2; // nome do arquivo ajuda, mas não decide sozinho
  let melhor = null, n = 0;
  for(const t of ['s1','s2','s3']) if(hitT[t] > n){ n = hitT[t]; melhor = t; }
  return n >= 2 ? melhor : null;
}
/* Colunas resolvidas pelo NOME do cabeçalho (aceita ordem variável), com fallback para a letra da especificação */
const PINOS = {
  s1: {
    nome:{alias:['cadastro nome'],letra:'E'}, nascimento:{alias:['cadastro dn','data nascimento'],letra:'F'},
    mae:{alias:['nome da mae'],letra:'H'}, tipoLogr:{alias:['tipo logradouro'],letra:'I'},
    endereco:{alias:['logradouro'],letra:'J'}, numero:{alias:['numero imovel'],letra:'K'},
    complemento:{alias:['complemento'],letra:'L'}, bairro:{alias:['bairro'],letra:'M'},
    cns:{alias:['cadastro cns'],letra:'O'}, sexo:{alias:['cadastro sexo'],letra:'P'}
  },
  s2: {
    nome:{alias:['usuario saude nome'],letra:'A'}, nascimento:{alias:['data nascimento'],letra:'B'},
    cns:{alias:['cns'],letra:'D'}, cpf:{alias:['cpf'],letra:'E'}, sexo:{alias:['sexo'],letra:'F'},
    c_cardiaca:{alias:['doenca cardiaca'],letra:'G'}, c_respiratoria:{alias:['doenca respiratoria'],letra:'I'},
    c_domiciliado:{alias:['esta domiciliado'],letra:'J'}, c_acamado:{alias:['esta acamado'],letra:'K'},
    c_gestante:{alias:['esta gestante'],letra:'L'}, c_etilista:{alias:['usa alcool'],letra:'M'},
    c_drogas:{alias:['usa drogas'],letra:'N'}, c_tabaco:{alias:['fumante'],letra:'O'},
    c_has:{alias:['hipertensao'],letra:'P'}, c_dm:{alias:['diabetes'],letra:'Y'}, c_cancer:{alias:['cancer'],letra:'Z'},
    c_hanseniase:{alias:['hanseniase'],letra:'AB'}, c_tuberculose:{alias:['tuberculose'],letra:'AD'}
  },
  s3: {
    nome:{alias:['cidadao nome'],letra:'B'}, nascimento:{alias:['cidadao dn'],letra:'C'},
    sexo:{alias:['sexo'],letra:'E'}, raca:{alias:['raca'],letra:'F'}, etnia:{alias:['etnia'],letra:'G'},
    cpf:{alias:['cpf'],letra:'H'}, cns:{alias:['cns'],letra:'I'}, cadastro:{alias:['cartao cidadao'],letra:'J'},
    mae:{alias:['nome da mae'],letra:'K'}, pai:{alias:['nome do pai'],letra:'L'}, pais:{alias:['pais de nascimento'],letra:'M'},
    telRes:{alias:['tel. residencial','tel residencial'],letra:'V'}, telCel:{alias:['tel. celular','tel celular'],letra:'W'}, telRec:{alias:['tel. recado','tel recado'],letra:'X'}
  }
};
function criarResolutor(rows, tipo, pinos){
  const { info } = pontuarCabecalho(rows);
  const inf = info[tipo];
  const todos = inf ? (inf.todos || inf.mapa) : null;
  const cache = {};
  const idx = campo => {
    if(cache[campo] !== undefined) return cache[campo];
    let i = -1;
    const p = pinos[campo];
    if(todos){ for(const a of p.alias){ if(todos.has(a)){ i = todos.get(a); break; } } }
    if(i < 0) i = colIdx(p.letra);
    cache[campo] = i;
    return i;
  };
  return { idx, ini: inf ? inf.linha + 1 : 0 }; // dados começam APÓS a linha de cabeçalho detectada
}
const colI = (row, i) => (row && row[i] !== undefined) ? String(row[i]).trim() : '';
const CONECTIVOS = new Set(['de','da','do','das','dos','e']);
function caixaTitulo(s){
  return String(s ?? '').toLowerCase().split(/\s+/).filter(Boolean)
    .map((w,i) => (i > 0 && CONECTIVOS.has(w)) ? w : w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
}
function mapearS1(rows){
  const R = criarResolutor(rows, 's1', PINOS.s1);
  const out = [];
  for(let i = R.ini; i < rows.length; i++){
    const row = rows[i];
    const nome = colI(row, R.idx('nome'));
    if(!nome || ehCabecalho(nome)) continue;
    const tipo = colI(row, R.idx('tipoLogr'));
    const logr = colI(row, R.idx('endereco'));
    let endereco = logr;
    if(tipo && logr && !containsFuzzy(logr, tipo)) endereco = tipo + ' ' + logr;
    else if(tipo && !logr) endereco = tipo;
    out.push({ d:{ nome, nascimento:parseDateCell(colI(row, R.idx('nascimento'))), mae:colI(row, R.idx('mae')),
      endereco:caixaTitulo(endereco), numero:colI(row, R.idx('numero')), cns:colI(row, R.idx('cns')), sexo:colI(row, R.idx('sexo')),
      complemento:colI(row, R.idx('complemento')), bairro:colI(row, R.idx('bairro')) } });
  }
  return out;
}
function mapearS2(rows){
  const R = criarResolutor(rows, 's2', PINOS.s2);
  const out = [];
  for(let i = R.ini; i < rows.length; i++){
    const row = rows[i];
    const nome = colI(row, R.idx('nome'));
    if(!nome || ehCabecalho(nome)) continue;
    out.push({ d:{ nome, nascimento:parseDateCell(colI(row, R.idx('nascimento'))), cns:colI(row, R.idx('cns')), cpf:colI(row, R.idx('cpf')), sexo:colI(row, R.idx('sexo')),
      c_cardiaca:isSim(colI(row, R.idx('c_cardiaca'))), c_respiratoria:isSim(colI(row, R.idx('c_respiratoria'))), c_domiciliado:isSim(colI(row, R.idx('c_domiciliado'))),
      c_acamado:isSim(colI(row, R.idx('c_acamado'))), c_gestante:isSim(colI(row, R.idx('c_gestante'))), c_etilista:isSim(colI(row, R.idx('c_etilista'))),
      c_drogas:isSim(colI(row, R.idx('c_drogas'))), c_tabaco:isSim(colI(row, R.idx('c_tabaco'))), c_has:isSim(colI(row, R.idx('c_has'))),
      c_dm:isSim(colI(row, R.idx('c_dm'))), c_cancer:isSim(colI(row, R.idx('c_cancer'))), c_hanseniase:isSim(colI(row, R.idx('c_hanseniase'))),
      c_tuberculose:isSim(colI(row, R.idx('c_tuberculose'))) } });
  }
  return out;
}
function mapearS3(rows){
  const R = criarResolutor(rows, 's3', PINOS.s3);
  const out = [];
  for(let i = R.ini; i < rows.length; i++){
    const row = rows[i];
    const nome = colI(row, R.idx('nome'));
    if(!nome || ehCabecalho(nome)) continue;
    out.push({ d:{ nome, nascimento:parseDateCell(colI(row, R.idx('nascimento'))), sexo:colI(row, R.idx('sexo')), raca:colI(row, R.idx('raca')),
      etnia:colI(row, R.idx('etnia')), cpf:colI(row, R.idx('cpf')), cns:colI(row, R.idx('cns')), cadastro:colI(row, R.idx('cadastro')), mae:colI(row, R.idx('mae')),
      pai:colI(row, R.idx('pai')), pais:colI(row, R.idx('pais')), telRes:colI(row, R.idx('telRes')), telCel:colI(row, R.idx('telCel')), telRec:colI(row, R.idx('telRec')) } });
  }
  return out;
}
async function lerArquivoTexto(file){
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  if(bytes[0] === 0xFF && bytes[1] === 0xFE) return new TextDecoder('utf-16le').decode(buf);
  if(bytes[0] === 0xFE && bytes[1] === 0xFF) return new TextDecoder('utf-16be').decode(buf);
  let txt = new TextDecoder('utf-8', {fatal:false}).decode(buf);
  if((txt.match(/\uFFFD/g)||[]).length > 0) txt = new TextDecoder('windows-1252').decode(buf); // qualquer U+FFFD ⇒ não é UTF-8
  return txt;
}

registerScreen('importar', (app) => {
  const podeVoltar = S.importado;
  const slotHTML = (key, titulo, desc) =>
    '<div class="card" style="margin-top:.6rem">' +
      '<div class="card-title" style="font-size:.95rem">'+titulo+'</div>' +
      '<div class="tiny muted">'+desc+'</div>' +
      '<div style="display:flex;gap:.5rem;align-items:center;margin-top:.55rem;flex-wrap:wrap">' +
        '<button class="btn btn-sm" data-pick="'+key+'">📄 Escolher arquivo…</button>' +
        '<input type="file" id="file-'+key+'" style="display:none" multiple>' +
        '<span class="small" id="st-'+key+'"></span>' +
      '</div>' +
    '</div>';
  app.innerHTML = topbarHTML({titulo:'IMPORTAR', sub:'Base de moradores (BI em CSV)',
      esq:{disabled:!podeVoltar}, dir:{label:'SALVAR', disabled:true}}) +
    '<div class="content">' +
      '<div class="card"><b>Selecione os relatórios do BI exportados em CSV.</b>' +
      '<p class="small muted" style="margin-top:.4rem">Cada arquivo é reconhecido pelo conteúdo do cabeçalho (a ordem e o nome do arquivo não importam). Aceita CSV com vírgula ou ponto-e-vírgula e codificação UTF-8, Latin-1/Windows-1252 ou UTF-16. Você pode escolher os três arquivos de uma vez em um único botão. O app monta o PERFIL DE MORADOR cruzando, nesta ordem: CNS → nome + nascimento + mãe → CPF → nome + nascimento. Perfis incompletos e duplicados aparecem em ACOMPANHAMENTO → AVISOS. Nenhum dado sai do aparelho.</p></div>' +
      slotHTML('s1','BI — Cadastro individual — ANÁLISE DETALHADA','nome (E), nascimento (F), mãe (H), endereço (J), número (K), CNS (O), sexo (P)') +
      slotHTML('s2','BI — QUESTIONÁRIO AUTO REFERIDO','nome (A), nascimento (B), CNS (D), CPF (E), sexo (F) e condições de saúde (G–AD)') +
      slotHTML('s3','BI — Saúde — CADASTROS DETALHADOS','nome (B), nascimento (C), sexo, raça, CPF, CNS, cadastro (J), mãe, pai, telefones (V–X)') +
      '<div id="imp-unknown"></div>' +
      '<div id="imp-status" class="small muted" style="margin-top:.7rem"></div>' +
      '<p class="tiny muted" style="margin-top:.6rem">O botão SALVAR fica disponível quando pelo menos um arquivo válido é lido. Importar novamente substitui a base atual.</p>' +
    '</div>';
  const salvarBt = $('#tb-salvar');
  const MAPEADORES = { s1:mapearS1, s2:mapearS2, s3:mapearS3 };
  const ROTULO_TIPO = { s1:'CADASTRO — ANÁLISE DETALHADA', s2:'QUESTIONÁRIO AUTO REFERIDO', s3:'SAÚDE — CADASTROS DETALHADOS' };
  const renderStatus = () => {
    for(const t of ['s1','s2','s3']){
      const v = IMP.parsed[t];
      $('#st-'+t).innerHTML = v ? '✔ <b>'+esc(v.nome)+'</b> → '+ROTULO_TIPO[t]+' · '+v.n+' registro(s)' : '';
    }
    const cont = $('#imp-unknown');
    if(!IMP.desconhecidos.length){ cont.innerHTML = ''; }
    else{
      cont.innerHTML = '<div class="card" style="margin-top:.6rem;border:2px dashed #c8a200">' +
        '<div class="card-title" style="font-size:.95rem">⚠ Arquivos não identificados automaticamente</div>' +
        '<div class="tiny muted">O conteúdo não corresponde a nenhum dos três relatórios esperados. Confira o tipo de cada arquivo:</div>' +
        IMP.desconhecidos.map((u, i) =>
          '<div style="display:flex;gap:.5rem;align-items:center;margin-top:.5rem;flex-wrap:wrap">' +
            '<span class="small" style="flex:1;min-width:140px">'+esc(u.nome)+'</span>' +
            '<select class="inp" style="max-width:280px" data-u="'+i+'"><option value="">— escolher tipo…</option>' +
            '<option value="s1">CADASTRO — ANÁLISE DETALHADA</option>' +
            '<option value="s2">QUESTIONÁRIO AUTO REFERIDO</option>' +
            '<option value="s3">SAÚDE — CADASTROS DETALHADOS</option></select>' +
          '</div>').join('') + '</div>';
      cont.querySelectorAll('[data-u]').forEach(sel => sel.addEventListener('change', () => {
        const u = IMP.desconhecidos[+sel.dataset.u];
        const v = sel.value;
        if(!u || !v) return;
        const regs = MAPEADORES[v](u.rows);
        IMP.parsed[v] = { n: regs.length, regs, nome: u.nome };
        IMP.desconhecidos = IMP.desconhecidos.filter(x => x !== u);
        renderStatus();
      }));
    }
    const n = Object.values(IMP.parsed).filter(v => v && v.n > 0).length;
    salvarBt.disabled = n === 0;
    const total = Object.values(IMP.parsed).reduce((s,v)=> s + (v ? v.n : 0), 0);
    $('#imp-status').textContent = n ? ('Pronto: '+n+' arquivo'+(n>1?'s':'')+' lido'+(n>1?'s':'')+', '+total+' registro(s) de dados.') : '';
  };
  const lerVarios = async (files) => {
    const lista = Array.from(files);
    for(let fi = 0; fi < lista.length; fi++){
      const f = lista[fi];
      showLoading('Lendo arquivo ' + (fi+1) + ' de ' + lista.length + '…', f.name);
      await yieldUI(); // garante que o spinner pinte antes do trabalho pesado
      try{
        const txt = await lerArquivoTexto(f);
        setLoadingMsg('Processando “' + f.name + '”…', 'Lendo as linhas do CSV');
        await yieldUI();
        const rows = await parseCSV(txt);
        setLoadingMsg('Identificando relatório…', f.name + ' · ' + rows.length.toLocaleString('pt-BR') + ' linhas');
        await yieldUI();
        const tipo = detectarPlanilha(f.name, rows);
        if(tipo){
          const regs = MAPEADORES[tipo](rows);
          IMP.parsed[tipo] = { n: regs.length, regs, nome: f.name };
        } else {
          IMP.desconhecidos.push({ file: f, nome: f.name, rows });
        }
      }catch(err){ toast('⚠ erro ao ler '+f.name); }
    }
    hideLoading();
    renderStatus();
  };
  $$('[data-pick]').forEach(b => b.addEventListener('click', () => $('#file-'+b.dataset.pick).click()));
  for(const key of ['s1','s2','s3']){
    $('#file-'+key).addEventListener('change', async (e) => {
      const fs = e.target.files;
      if(!fs || !fs.length) return;
      $('#st-'+key).textContent = '⏳ lendo…';
      await lerVarios(fs);
      e.target.value = '';
    });
  }
  $('#tb-voltar').addEventListener('click', () => resetStack('menu'));
  salvarBt.addEventListener('click', async () => {
    const temAlgo = Object.values(IMP.parsed).some(v => v && v.n > 0);
    if(!temAlgo) return;
    if(S.importado){
      const ok = await modalConfirmar('Importar novamente?', 'Isso SUBSTITUI a base de moradores atual (incluindo visitas e filtros aplicados). Deseja continuar?', 'IMPORTAR');
      if(!ok) return;
    }
    await salvarImportacao();
  });
});
function modalConfirmar(titulo, texto, botao){
  return new Promise(res => {
    openModal(
      modalTop(titulo) +
      '<p style="margin:.4rem 0 .9rem">'+texto+'</p>' +
      '<div style="display:flex;gap:.5rem;justify-content:flex-end">' +
        '<button class="btn" id="cf-n">CANCELAR</button>' +
        '<button class="btn btn-r" id="cf-s">'+esc(botao||'CONFIRMAR')+'</button>' +
      '</div>');
    $('#cf-n').addEventListener('click', () => { closeModal(); res(false); });
    $('#cf-s').addEventListener('click', () => { closeModal(); res(true); });
    bindModalVoltar(() => { closeModal(); res(false); });
  });
}
async function salvarImportacao(){
  showLoading('Montando perfis…', 'Cruzando CNS, CPF e nome+nascimento entre os relatórios');
  await yieldUI();
  try{
    const perfis = mesclarPerfis([]
      .concat(IMP.parsed.s1 && IMP.parsed.s1.regs || [])
      .concat(IMP.parsed.s2 && IMP.parsed.s2.regs || [])
      .concat(IMP.parsed.s3 && IMP.parsed.s3.regs || []));
    setLoadingMsg('Salvando base de moradores…', perfis.length.toLocaleString('pt-BR') + ' perfis');
    await yieldUI();
    await idbClr('residents');
    await idbBulkPut('residents', perfis);
    // definições iniciais de filtros
    const defs = await idbAll('filterDefs');
    const nomes = new Set(defs.map(d => norm(d.nome)));
    const novas = FILTROS_INICIAIS.filter(n => !nomes.has(norm(n))).map(n => ({nome:n, periodicidade:null}));
    if(novas.length) await idbBulkPut('filterDefs', novas);
    S.importado = true;
    await salvarEstado();
    if(S.areaDefinida){
      setLoadingMsg('Aplicando sua área…', 'Removendo moradores fora dos endereços de atuação');
      await yieldUI();
      const mantidos = await aplicarArea();
      toast(perfis.length.toLocaleString('pt-BR')+' perfis importados · '+mantidos.toLocaleString('pt-BR')+' na sua área');
    } else {
      toast(perfis.length.toLocaleString('pt-BR')+' perfis de morador criados');
    }
    IMP.parsed = {}; IMP.desconhecidos = [];
  } finally {
    hideLoading();
  }
  if(!S.areaDefinida) resetStack('area'); else resetStack('menu');
}
function mesclarPerfis(regs){
  const perfis = [];
  const idxCns = new Map(), idxCpf = new Map(), idxNN = new Map();
  for(const reg of regs){
    const d = reg.d;
    const cns = onlyDigits(d.cns), cpf = onlyDigits(d.cpf);
    const temNN = !!norm(d.nome) && !!d.nascimento;
    const nn = norm(d.nome) + '|' + (d.nascimento||'');
    let alvo = null;
    if(cns && idxCns.has(cns)) alvo = idxCns.get(cns);
    else if(cpf && idxCpf.has(cpf)) alvo = idxCpf.get(cpf);
    else if(temNN && idxNN.has(nn)) alvo = idxNN.get(nn);
    if(!alvo){ alvo = { p:{}, cnsVistos:[] }; perfis.push(alvo); }
    if(cns){
      if(!idxCns.has(cns)){ idxCns.set(cns, alvo); alvo.cnsVistos.push(cns); }
      if(alvo.cnsVistos.length > 1) alvo.p.cnsExtra = alvo.cnsVistos[1];
    }
    if(cpf && !idxCpf.has(cpf)) idxCpf.set(cpf, alvo);
    if(temNN && !idxNN.has(nn)) idxNN.set(nn, alvo);
    for(const k in d){
      const v = d[k];
      if(v === '' || v == null) continue;
      // Sanitiza textos vindos do CSV (sem tags HTML, sem caracteres de controle)
      const vv = typeof v === 'string' ? sanitizarTexto(v) : v;
      if(vv === '' || vv == null) continue;
      if(alvo.p[k] === undefined || alvo.p[k] === '' || alvo.p[k] === false) alvo.p[k] = vv;
    }
  }
  return perfis.map(a => {
    const p = a.p;
    const cond = { cardiaca:!!p.c_cardiaca, respiratoria:!!p.c_respiratoria, domiciliado:!!p.c_domiciliado,
      acamado:!!p.c_acamado, gestante:!!p.c_gestante, etilista:!!p.c_etilista, drogas:!!p.c_drogas,
      tabaco:!!p.c_tabaco, has:!!p.c_has, dm:!!p.c_dm, cancer:!!p.c_cancer,
      hanseniase:!!p.c_hanseniase, tuberculose:!!p.c_tuberculose };
    const filtros = [];
    for(const k in COND_FILTRO) if(cond[k]) filtros.push({nome:COND_FILTRO[k], origem:'importado', desde:todayISO()});
    return { nome:p.nome||'', nascimento:p.nascimento||'', mae:p.mae||'', pai:p.pai||'',
      cpf:onlyDigits(p.cpf), cns:onlyDigits(p.cns), cnsExtra:p.cnsExtra||'', cadastro:onlyDigits(p.cadastro),
      sexo:p.sexo||'', raca:p.raca||'', etnia:p.etnia||'', pais:p.pais||'',
      endereco:p.endereco||'', numero:String(p.numero||'').trim(),
      complemento:p.complemento||'', bairro:p.bairro||'',
      telRes:onlyDigits(p.telRes), telCel:onlyDigits(p.telCel), telRec:onlyDigits(p.telRec),
      cond, filtros, visitas:[], obs:'' };
  });
}
/* ================= TELA DE DEFINIR ÁREA ================= */
async function ruasDoBanco(){
  const rs = await idbAll('residents');
  const m = new Map();
  for(const r of rs){
    const e = (r.endereco||'').trim();
    if(!e) continue;
    const k = norm(e);
    if(!k) continue;
    if(!m.has(k)) m.set(k, {rua:e, n:0});
    m.get(k).n++;
  }
  return Array.from(m.values()).sort((a,b) => a.rua.localeCompare(b.rua,'pt-BR'));
}
/*
 Mantém moradores apenas dentro da área definida; os demais são excluídos
 para economizar espaço e acelerar o app.
*/
async function aplicarArea(){
  const cards = await idbAll('area');
  const rs = await idbAll('residents');
  if(!cards.length) return rs.length; // sem cartões: mantém tudo
  const dentro = r => {
    const ruaN = norm(r.endereco);
    if(!ruaN) return false;
    const numStr = String(r.numero||'').trim();
    const num = parseInt(numStr.replace(/\D/g,''),10);
    const temNum = numStr !== '' && !isNaN(num);
    for(const c of cards){
      if(norm(c.rua) !== ruaN) continue;
      const temComeco = c.comeco !== '' && c.comeco != null && !isNaN(+c.comeco);
      const temFim = c.fim !== '' && c.fim != null && !isNaN(+c.fim);
      if((temComeco || temFim) && !temNum) continue;
      if(temComeco && num < +c.comeco) continue;
      if(temFim && num > +c.fim) continue;
      const par = temNum && num % 2 === 0, imp = temNum && num % 2 === 1;
      if(c.impares && !c.pares && !imp) continue;
      if(c.pares && !c.impares && !par) continue;
      return true;
    }
    return false;
  };
  const manter = rs.filter(dentro);
  const fora = rs.filter(r => !dentro(r));
  if(fora.length) await idbBulkDel('residents', fora.map(r => r.id));
  return manter.length;
}
registerScreen('area', (app) => {
  const primeiraVez = !S.areaDefinida;
  const cards = []; // {rua, comeco, fim, impares, pares}
  const TXT_EXPLICA = 'Sua área sempre pode ser editada aqui. Deixe os números das casas em branco incluir todas da rua. Marque apenas início se for de um determinado número até o final. Marque apenas o final se for do início até um determinado número. Marque ambos para um período específico.';
  app.innerHTML = topbarHTML({
      titulo:'DEFINIR ÁREA', sub:'Defina sua área de atuação.',
      esq: primeiraVez ? null : {label:'⟵ VOLTAR'},
      dir: primeiraVez ? null : {label:'SALVAR', disabled:true}}) +
    '<div class="content">' +
      (primeiraVez ? '<button class="btn btn-g btn-block btn-big" id="area-save" style="display:none;margin-bottom:.8rem">SALVAR E CONTINUAR</button>'
                   : '') +
      '<div class="search-box"><input id="area-q" placeholder="Endereço de atuação" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">' +
      '<button class="clear-x" id="area-x" style="display:none">❌</button></div>' +
      '<p class="tiny muted" style="margin-top:.5rem" id="area-dica">'+(primeiraVez?'':'Ao salvar, moradores fora da área são excluídos do aparelho.')+'</p>' +
      '<p class="small" id="area-explica" style="display:none;margin-top:.55rem;background:var(--chip);color:var(--chip-ink);padding:.6rem .7rem;border-radius:10px">'+TXT_EXPLICA+'</p>' +
      '<div id="area-cards"></div>' +
    '</div>';
  const q = $('#area-q'), xBt = $('#area-x');
  let ruas = null;
  const buscar = debounce(async () => {
    const v = q.value.trim();
    xBt.style.display = v ? 'block' : 'none';
    if(!v || letras(v) < 1) return;
    if(!ruas) ruas = await ruasDoBanco();
    const res = ruas.filter(r => fuzzy(r.rua, v)).slice(0, 60);
    abrirModalResultados(v, res);
  }, 1000);
  q.addEventListener('input', buscar);
  xBt.addEventListener('click', () => { q.value = ''; xBt.style.display='none'; q.focus(); });

  function abrirModalResultados(query, res){
    let sel = new Set();
    // opts {alto:true}: modal ancorado no TOPO da tela — com o teclado virtual
    // aberto no celular ele fica visível em vez de abrir atrás do teclado.
    openModal(
      '<div class="m-top">' +
        '<button class="btn btn-sm m-voltar" id="ar-v">⟵ VOLTAR</button>' +
        '<div class="m-title">Endereços</div>' +
        '<button class="btn btn-sm btn-p" id="ar-c" disabled>CONFIRMAR</button>' +
      '</div>' +
      '<p class="small muted">Resultados para “'+esc(query)+'” — toque para marcar um ou mais.</p>' +
      '<div class="res-list">' +
        (res.length ? res.map((r,i) =>
          '<label class="res-item" data-i="'+i+'"><input type="checkbox"><span style="flex:1">'+esc(r.rua)+'</span><span class="tiny muted">'+r.n+'</span></label>').join('')
          : '<p class="muted small center mt">Nenhum endereço encontrado no banco de dados.</p>') +
      '</div>', {alto:true});
    $('#ar-v').addEventListener('click', () => { closeModal(); q.value=''; xBt.style.display='none'; });
    const cb = $('#ar-c');
    $$('#modal-root .res-item').forEach(item => item.addEventListener('click', () => {
      // o label já ativa o input nativamente; sincroniza após o evento
      setTimeout(() => {
        const c = item.querySelector('input');
        item.classList.toggle('on', c.checked);
        if(c.checked) sel.add(+item.dataset.i); else sel.delete(+item.dataset.i);
        cb.disabled = sel.size === 0;
      }, 0);
    }));
    cb.addEventListener('click', () => {
      for(const i of sel) adicionarCard(res[i].rua);
      closeModal(); q.value = ''; xBt.style.display = 'none';
      renderCards(); toast(sel.size+' endereço'+(sel.size>1?'s':'')+' adicionado'+(sel.size>1?'s':'')+' à área');
    });
  }
  function adicionarCard(rua){
    if(cards.some(c => norm(c.rua) === norm(rua))) return; // sem duplicados
    cards.unshift({rua, comeco:'', fim:'', impares:false, pares:false}); // mais recente primeiro
  }
  function renderCards(){
    const cont = $('#area-cards');
    cont.innerHTML = cards.map((c,i) =>
      '<div class="area-card" data-i="'+i+'">' +
        '<div class="area-head"><span class="a-nome">'+esc(c.rua)+'</span><button class="del-x" data-del="'+i+'" title="Remover">❌</button></div>' +
        '<div class="area-nums">' +
          '<input class="inp" placeholder="Começo" inputmode="numeric" data-f="comeco" value="'+esc(c.comeco)+'">' +
          '<input class="inp" placeholder="Fim" inputmode="numeric" data-f="fim" value="'+esc(c.fim)+'">' +
        '</div>' +
        '<div class="check-line">' +
          '<label><input type="checkbox" data-t="impares"'+(c.impares?' checked':'')+'> apenas ímpares</label>' +
          '<label><input type="checkbox" data-t="pares"'+(c.pares?' checked':'')+'> apenas pares</label>' +
        '</div>' +
      '</div>').join('');
    $('#area-explica').style.display = cards.length ? 'block' : 'none';
    const saveBt1 = $('#area-save');
    if(saveBt1) saveBt1.style.display = cards.length ? 'flex' : 'none';
    if(!primeiraVez) $('#tb-salvar').disabled = cards.length === 0;
    cont.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
      cards.splice(+b.dataset.del, 1); renderCards();
    }));
    cont.querySelectorAll('.area-card').forEach(card => {
      const i = +card.dataset.i;
      card.querySelectorAll('[data-f]').forEach(inp => inp.addEventListener('input', () => { cards[i][inp.dataset.f] = inp.value.replace(/\D/g,'').slice(0,6); }));
      card.querySelectorAll('[data-t]').forEach(chk => chk.addEventListener('change', () => { cards[i][chk.dataset.t] = chk.checked; }));
    });
  }
  async function salvar(){
    if(!cards.length){
      toast('Adicione ao menos um endereço antes de salvar');
      return;
    }
    showLoading('Salvando sua área…', 'Aplicando os endereços aos moradores da base');
    await yieldUI();
    try{
      await idbClr('area');
      await idbBulkPut('area', cards);
      S.areaDefinida = true;
      await salvarEstado();
      setLoadingMsg('Filtrando moradores…', 'Removendo os que ficam fora da sua área');
      await yieldUI();
      const mantidos = await aplicarArea();
      toast('Área salva — '+mantidos.toLocaleString('pt-BR')+' moradores na sua área');
      menuLiberado = true;
    } finally {
      hideLoading();
    }
    resetStack('menu');
  }
  const sb1 = $('#area-save');
  if(sb1) sb1.addEventListener('click', salvar);
  if(!primeiraVez){
    $('#tb-salvar').addEventListener('click', salvar);
    $('#tb-voltar').addEventListener('click', () => resetStack('menu')); // cancela a edição
  }
  // carrega cartões existentes (modo edição)
  (async () => {
    if(!primeiraVez){
      const salvos = await idbAll('area');
      salvos.sort((a,b) => (b.id||0) - (a.id||0));
      for(const c of salvos) cards.push({rua:c.rua, comeco:c.comeco||'', fim:c.fim||'', impares:!!c.impares, pares:!!c.pares});
      renderCards();
    }
  })();
});
/* ================= TELA DO MENU ================= */
registerScreen('menu', async (app) => {
  const avisos = await computeAvisos();
  app.innerHTML = topbarHTML({titulo:'ACS Digital', sub:'Gentileza do ACS Maico - contato 11978831938', subWrap:true}) +
    '<div class="content">' +
      '<div class="menu-grid">' +
        '<button class="menu-btn" data-go="moradores"><span class="ic">🏠</span><span>MORADORES<small>consultar os perfis da sua área</small></span></button>' +
        '<button class="menu-btn b-verde" data-go="filtros"><span class="ic">🧩</span><span>FILTROS<small>aplicar, editar e ajustar filtros</small></span></button>' +
        '<button class="menu-btn b-amarelo" data-go="acompanhamento"><span class="ic">📋</span><span>ACOMPANHAMENTO<small>avisos, exames, consultas e visitas</small></span></button>' +
        '<button class="menu-btn b-vermelho" data-go="config"><span class="ic">⚙️</span><span>CONFIGURAÇÕES<small>importar, área, senha e tema</small></span></button>' +
      '</div>' +
      (avisos.length ? '<div class="badge-avisos">🔔 '+avisos.length+' aviso'+(avisos.length>1?'s':'')+'</div>' : '') +
    '</div>';
  app.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
});

/* ================= TELA DE MORADORES ================= */
const MOR = { st: novoEstadoOrd(), filtrosAtivos: [], defs: [], mostrarTodos: false };
registerScreen('moradores', (app) => {
  app.innerHTML = topbarHTML({titulo:'MORADORES', esq:{}}) +
    '<div class="content">' +
      '<div id="mor-sorts"></div>' +
      '<div class="search-box mt"><input id="mor-q" placeholder="Buscar morador, endereço, CNS…" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">' +
        '<button class="clear-x" id="mor-x" style="display:none">❌</button></div>' +
      '<div id="mor-hist"></div>' +
      '<div class="small" style="font-weight:700;margin-top:.8rem">FILTROS</div>' +
      '<p class="tiny muted" style="margin:.15rem 0 0">Toque para marcar vários; o morador precisa ter todos os marcados.</p>' +
      '<div class="chips" id="mor-fchips"></div>' +
      '<div id="mor-result" class="mt"></div>' +
    '</div>';
  $('#tb-voltar').addEventListener('click', navBack);
  $('#mor-sorts').innerHTML = htmlSortRow(MOR.st);
  bindSortRow($('#mor-sorts'), MOR.st, executar);
  const q = $('#mor-q'), xBt = $('#mor-x'), resDiv = $('#mor-result');
  // chips de filtros: NENHUM FILTRO (limpa tudo) + filtros em ordem alfabética
  (async () => {
    const defs = await idbAll('filterDefs');
    MOR.defs = defs.map(d => d.nome).sort((a,b) => a.localeCompare(b, 'pt-BR'));
    renderFiltroChips();
  })();
  function renderFiltroChips(){
    const cont = $('#mor-fchips');
    if(!cont) return;
    const at = MOR.filtrosAtivos;
    cont.innerHTML =
      '<button type="button" class="chip-t limpar'+(at.length ? '' : ' on')+'" data-limpar title="Limpa todos os filtros marcados">NENHUM FILTRO</button>' +
      MOR.defs.map(n => '<button type="button" class="chip-t'+(at.some(a => norm(a) === norm(n)) ? ' on' : '')+'" data-f="'+esc(n)+'">'+esc(n)+'</button>').join('');
    cont.querySelector('[data-limpar]').addEventListener('click', () => {
      if(!MOR.filtrosAtivos.length) return;
      MOR.filtrosAtivos = [];
      renderFiltroChips(); executar();
    });
    cont.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
      const n = b.dataset.f;
      const i = MOR.filtrosAtivos.findIndex(a => norm(a) === norm(n));
      if(i >= 0) MOR.filtrosAtivos.splice(i, 1); else MOR.filtrosAtivos.push(n);
      renderFiltroChips(); executar();
    }));
  }
  function salvarHistorico(termo){
    if(!termo) return;
    kvGet('searchHist', []).then(l => {
      l = [termo].concat((l||[]).filter(t => norm(t) !== norm(termo))).slice(0,3);
      kvSet('searchHist', l).then(renderHist);
    });
  }
  function renderHist(){
    kvGet('searchHist', []).then(l => {
      const div = $('#mor-hist');
      if(!l || !l.length){ div.innerHTML = ''; return; }
      div.innerHTML = '<div class="hist-line">'+l.map(t => '<button class="hist-chip" data-t="'+esc(t)+'">🔎 '+esc(t)+'</button>').join('')+'</div>';
      div.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { q.value = b.dataset.t; q.focus(); executar(); }));
    });
  }
  async function executar(){
    const qv = q.value.trim();
    xBt.style.display = qv ? 'block' : 'none';
    const rs = await idbAll('residents');
    let lista = null, hint = '';
    if(!qv){
      if(!MOR.mostrarTodos){
        resDiv.innerHTML = '<button class="btn btn-block mt" id="mor-todos" style="margin-top:1rem">MOSTRAR TODOS</button>';
        const b = $('#mor-todos');
        if(b) b.addEventListener('click', () => { MOR.mostrarTodos = true; executar(); });
        return;
      }
      lista = rs.slice();
    } else {
      const it = interpretarBusca(qv);
      if(it.tipo === 'nenhum'){ hint = TXT_BUSCA_NENHUM; lista = []; }
      else { lista = buscarMoradores(rs, it); salvarHistorico(qv); }
    }
    if(MOR.filtrosAtivos.length){
      // busca combinada: o morador precisa ter TODOS os filtros marcados
      const at = MOR.filtrosAtivos.map(norm);
      lista = lista.filter(r => {
        const fs = filtrosDoMorador(r).map(norm);
        return at.every(a => fs.includes(a));
      });
    }
    ordenarMoradores(lista, MOR.st.org);
    const filtroTxt = MOR.filtrosAtivos.length
      ? '<p class="small muted mt">Filtros ativos: <b>'+MOR.filtrosAtivos.map(esc).join('</b> + <b>')+'</b></p>'
      : '';
    resDiv.innerHTML = filtroTxt +
      (hint ? '<p class="small muted mt">'+hint+'</p>' :
      (lista.length ?
        '<p class="small muted mt">'+lista.length+' morador'+(lista.length>1?'es':'')+'</p>' : '') +
      '<div class="row-list">' +
        lista.slice(0, 400).map(r => moradorRowHTML(r)).join('') +
        (lista.length > 400 ? '<p class="tiny muted center">Exibindo os primeiros 400 — refine a busca.</p>' : '') +
      '</div>' +
      (!lista.length ? '<p class="small muted center mt">Nenhum morador encontrado.</p>' : ''));
    resDiv.querySelectorAll('.p-row').forEach(row => row.addEventListener('click', () => go('perfil', {id:+row.dataset.id})));
  }
  q.addEventListener('input', debounce(() => { if(!q.value.trim()) MOR.mostrarTodos = false; executar(); }, 260));
  $('#mor-x').addEventListener('click', () => { q.value=''; xBt.style.display='none'; MOR.mostrarTodos=false; executar(); q.focus(); });
  renderHist();
  executar();
});

/* ================= PERFIL DE MORADOR ================= */
function linkWhatsApp(fone){
  let d = onlyDigits(fone);
  if(!d) return '';
  if(d.length >= 12 && d.length <= 13 && d.startsWith('55')) return 'https://wa.me/' + d;
  return 'https://wa.me/55' + d;
}
registerScreen('perfil', async (app, p) => {
  const rs = await idbAll('residents');
  const r = rs.find(x => x.id === p.id);
  if(!r){
    app.innerHTML = topbarHTML({titulo:'PERFIL', esq:{}}) + '<div class="content"><p>Morador não encontrado.</p></div>';
    $('#tb-voltar').addEventListener('click', navBack);
    return;
  }
  const linha = (lab, val) => val ? '<div class="i-line"><span class="i-lab">'+lab+'</span>'+val+'</div>' : '';
  const conds = [];
  const COND_NOMES = { cardiaca:'Doença cardíaca', respiratoria:'Doença respiratória', domiciliado:'Domiciliado',
    acamado:'Acamado', gestante:'Gestante', etilista:'Etílico habitual', drogas:'Drogas habitual',
    tabaco:'Tabagista habitual', has:'HAS', dm:'DM', cancer:'Câncer', hanseniase:'Hanseníase', tuberculose:'Tuberculose' };
  for(const k in COND_NOMES) if(r.cond && r.cond[k]) conds.push(COND_NOMES[k]);
  const filtros = filtrosDoMorador(r);
  const visitas = (r.visitas||[]).slice().sort((a,b) => (b.data||'').localeCompare(a.data||''));
  const fones = [r.telCel, r.telRes, r.telRec].filter(Boolean);
  const wa = linkWhatsApp(r.telCel || r.telRes || r.telRec || '');
  app.innerHTML = topbarHTML({titulo:'PERFIL DE MORADOR', esq:{}}) +
    '<div class="content">' +
      '<h2 style="text-transform:uppercase;font-size:1.15rem;line-height:1.25">'+esc(r.nome||'(sem nome)')+'</h2>' +
      '<div class="info-box mt">' +
        linha('Nome da mãe', esc(r.mae||'')) +
        linha('Nome do pai', esc(r.pai||'')) +
        linha('Data de nascimento', esc(fmtDate(r.nascimento)+' '+idadeTxt(r))) +
        linha('Cadastro (cartão cidadão)', esc(r.cadastro||'')) +
        linha('CPF', esc(r.cpf||'')) +
        linha('CNS', esc(r.cns||'') + (r.cnsExtra ? ' <span class="tiny muted">(2º CNS: '+esc(r.cnsExtra)+')</span>' : '')) +
        linha('Endereço completo', esc(linhaEndereco(r))) +
        (fones.length ? '<div class="i-line"><span class="i-lab">Telefone</span>'+esc(fones.join(' · '))+
          (wa ? '<button class="wa-btn" id="pf-wa">📱 WhatsApp</button>' : '')+'</div>' : '') +
        linha('Sexo', esc(r.sexo||'')) +
        linha('Raça / Etnia', esc([r.raca, r.etnia].filter(Boolean).join(' / '))) +
        linha('País de origem', esc(r.pais||'')) +
        (conds.length ? '<div class="i-line"><span class="i-lab">Condições de saúde</span>'+conds.map(c=>'<span class="badge imp" style="margin-right:.25rem">'+esc(c)+'</span>').join('')+'</div>' : '') +
        (filtros.length ? '<div class="i-line"><span class="i-lab">Filtros</span>'+filtros.map(f=>{
            const fv = (r.filtros||[]).find(x => norm(x.nome)===norm(f) && x.validade);
            return '<span class="badge imp" style="margin-right:.25rem">'+esc(f)+(fv?' · até '+fmtDate(fv.validade):'')+'</span>';
          }).join('')+'</div>' : '') +
        (visitas.length ? '<div class="i-line"><span class="i-lab">Visitas domiciliares</span>'+
          visitas.map(v => fmtDate(v.data)+' — '+(v.status==='nao'?'não realizada':'realizada')).map(esc).join('<br>')+'</div>' : '') +
        '<div class="i-line"><span class="i-lab">Observações</span>' +
          '<textarea class="obs-area mt" id="pf-obs" placeholder="Anotações sobre o morador…">'+esc(r.obs||'')+'</textarea>' +
        '</div>' +
      '</div>' +
    '</div>';
  $('#tb-voltar').addEventListener('click', navBack);
  const wab = $('#pf-wa');
  if(wab) wab.addEventListener('click', () => window.open(wa, '_blank'));
  $('#pf-obs').addEventListener('change', async () => {
    r.obs = sanitizarTexto($('#pf-obs').value, 2000);
    $('#pf-obs').value = r.obs;
    await idbPut('residents', r);
    toast('Observação salva');
  });
});
/* ---------------- Utilitário: resultado de busca dentro de modais ---------------- */
async function resultadoModalBusca(resDiv, q, st, onRow){
  const rs = await idbAll('residents');
  const qv = q.value.trim();
  let lista;
  if(!qv){
    if(!st.todos){
      resDiv.innerHTML = '<button class="btn btn-block" data-mt style="margin-top:.9rem">MOSTRAR TODOS</button>';
      resDiv.querySelector('[data-mt]').addEventListener('click', () => { st.todos = true; st.reexec(); });
      return;
    }
    lista = rs.slice();
  } else {
    const it = interpretarBusca(qv);
    if(it.tipo === 'nenhum'){ resDiv.innerHTML = '<p class="small muted mt">'+TXT_BUSCA_NENHUM+'</p>'; return; }
    lista = buscarMoradores(rs, it);
  }
  ordenarMoradores(lista, st.ord.org);
  resDiv.innerHTML = '<p class="tiny muted mt">'+lista.length+' resultado(s)</p><div class="row-list">' +
    lista.slice(0,300).map(r => moradorRowHTML(r, {classe: (st.sel && st.sel.has(r.id)) ? 'selected':''})).join('') + '</div>';
  resDiv.querySelectorAll('.p-row').forEach(row => row.addEventListener('click', () => onRow(+row.dataset.id, row)));
}
function modalTopDup(titulo, rotuloDir, idDir, dirDisabled){
  return '<div class="m-top">' +
    '<button class="btn btn-sm m-voltar">⟵ VOLTAR</button>' +
    '<div class="m-title">'+esc(titulo)+'</div>' +
    '<button class="btn btn-sm btn-p" id="'+idDir+'"'+(dirDisabled?' disabled':'')+'>'+esc(rotuloDir)+'</button>' +
  '</div>';
}

/* ================= TELA DE FILTROS ================= */
registerScreen('filtros', async (app) => {
  const defs = (await idbAll('filterDefs')).sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'));
  const rs = await idbAll('residents');
  const contagem = {};
  rs.forEach(r => filtrosDoMorador(r).forEach(n => contagem[norm(n)] = (contagem[norm(n)]||0)+1));
  app.innerHTML = topbarHTML({titulo:'FILTROS', esq:{}}) +
    '<div class="content">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">' +
        '<button class="btn btn-p" id="fl-aplicar">APLICAR</button>' +
        '<button class="btn" id="fl-editar">EDITAR</button>' +
        '<button class="btn" id="fl-ajustar">AJUSTAR FILTROS</button>' +
        '<button class="btn btn-r" id="fl-reiniciar">REINICIAR FILTROS</button>' +
      '</div>' +
      '<div class="card mt"><div class="card-title">Filtros configurados (ordem alfabética)</div>' +
        (defs.length ? defs.map(d =>
          '<div style="display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px dashed var(--line)">' +
          '<span>'+esc(d.nome)+(d.periodicidade ? ' <span class="tiny muted">(visita a cada '+d.periodicidade+' mes'+(d.periodicidade>1?'es':'')+')</span>' : '')+'</span>' +
          '<span class="badge">'+(contagem[norm(d.nome)]||0)+'</span></div>').join('')
          : '<p class="small muted">Nenhum filtro definido.</p>') +
        '<p class="tiny muted" style="margin-top:.5rem">PUERICULTURA é aplicada automaticamente a qualquer morador com menos de 2 anos. Filtros importados das planilhas não são removidos pelo REINICIAR FILTROS.</p>' +
      '</div>' +
    '</div>';
  $('#tb-voltar').addEventListener('click', navBack);
  $('#fl-aplicar').addEventListener('click', modalAplicar);
  $('#fl-editar').addEventListener('click', modalEditar);
  $('#fl-ajustar').addEventListener('click', modalAjustar);
  $('#fl-reiniciar').addEventListener('click', modalReiniciar);
});

/* ---- APLICAR: escolhe filtro, seleciona moradores, aplica ---- */
function modalAplicar(){
  (async () => {
    const defs = (await idbAll('filterDefs')).sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'));
    if(!defs.length){ toast('Nenhum filtro cadastrado'); return; }
    openModal(modalTop('APLICAR') +
      '<p class="small muted">Toque no filtro que será aplicado aos moradores:</p>' +
      defs.map(d => '<button class="btn btn-block" data-def="'+esc(d.nome)+'" style="margin-top:.45rem;justify-content:flex-start">🏷️ '+esc(d.nome)+'</button>').join(''));
    bindModalVoltar(closeModal);
    $$('#modal-root [data-def]').forEach(b => b.addEventListener('click', () => modalAplicarEscolher(b.dataset.def)));
  })();
}
function modalAplicarEscolher(nomeFiltro){
  const st = { todos:false, ord:novoEstadoOrd(), sel:new Set(), reexec:exec };
  openModal(
    modalTopDup('APLICAR FILTRO', 'VOLTAR', 'ap-cancel') +
    '<button class="btn btn-g btn-block" id="ap-go">APLICAR filtro '+esc(nomeFiltro)+'</button>' +
    '<div id="ap-sorts"></div>' +
    '<div class="search-box mt"><input id="ap-q" placeholder="Buscar morador…" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"></div>' +
    '<div id="ap-res" class="mt"></div>', {alto:true});
  bindModalVoltar(() => modalAplicar());
  $('#ap-sorts').innerHTML = htmlSortRow(st.ord);
  bindSortRow($('#ap-sorts'), st.ord, exec);
  const q = $('#ap-q'), res = $('#ap-res');
  async function exec(){ await resultadoModalBusca(res, q, st, (id, row) => {
    if(st.sel.has(id)){ st.sel.delete(id); row.classList.remove('selected'); }
    else { st.sel.add(id); row.classList.add('selected'); }
  }); }
  q.addEventListener('input', debounce(exec, 260));
  exec();
  $('#ap-go').addEventListener('click', async () => {
    if(!st.sel.size){ toast('Selecione ao menos um morador na lista'); return; }
    const rs = await idbAll('residents');
    let n = 0;
    for(const r of rs){
      if(!st.sel.has(r.id)) continue;
      r.filtros = r.filtros || [];
      if(!r.filtros.some(f => norm(f.nome) === norm(nomeFiltro))){
        r.filtros.push({nome:nomeFiltro, origem:'aplicado', desde:todayISO()});
        await idbPut('residents', r);
        n++;
      }
    }
    closeModal();
    toast(n ? ('Filtro '+nomeFiltro+' aplicado a '+n+' morador'+(n>1?'es':'')) : 'Todos os selecionados já tinham esse filtro');
  });
}

/* ---- EDITAR: filtros de um morador (adicionar, remover, validade) ---- */
function modalEditar(){
  const st = { todos:false, ord:novoEstadoOrd(), sel:null, reexec:exec };
  openModal(
    modalTop('EDITAR FILTROS') +
    '<p class="small muted">Use a busca ou MOSTRAR TODOS e toque em um morador para editar os filtros dele.</p>' +
    '<div class="search-box mt"><input id="ed-q" placeholder="Buscar morador…" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false"></div>' +
    '<div id="ed-res" class="mt"></div>', {alto:true});
  bindModalVoltar(closeModal);
  const q = $('#ed-q'), res = $('#ed-res');
  async function exec(){ await resultadoModalBusca(res, q, st, (id) => modalEditarMorador(id)); }
  q.addEventListener('input', debounce(exec, 260));
  exec();
}
async function modalEditarMorador(idM){
  const rs = await idbAll('residents');
  const r = rs.find(x => x.id === idM);
  if(!r){ toast('Morador não encontrado'); return; }
  const defs = (await idbAll('filterDefs')).sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'));
  let lista = (r.filtros||[]).map(f => ({nome:f.nome, validade:f.validade||'', origem:f.origem||'aplicado'}));
  function render(){
    const disponiveis = defs.filter(d => !lista.some(f => norm(f.nome) === norm(d.nome)));
    openModal(
      modalTopDup('EDITAR — '+r.nome, 'SALVAR', 'em-salvar') +
      '<div class="card" style="margin-top:.3rem"><div class="card-title">Filtros do morador</div>' +
      (lista.length ? lista.map((f,i) =>
        '<div class="area-card" style="margin-top:.4rem" data-i="'+i+'">' +
          '<div class="area-head"><span class="a-nome">'+esc(f.nome)+'</span><button class="del-x" data-rm="'+i+'">❌</button></div>' +
          '<label class="tiny muted">Validade (opcional)</label>' +
          '<input type="date" class="inp" data-vd="'+i+'" value="'+esc(f.validade)+'">' +
        '</div>').join('')
        : '<p class="small muted">Nenhum filtro neste morador.</p>') +
      '</div>' +
      (disponiveis.length ?
        '<label class="fld">Adicionar filtro</label>' +
        '<div class="sel-wrap"><select id="em-add">'+disponiveis.map(d=>'<option value="'+esc(d.nome)+'">'+esc(d.nome)+'</option>').join('')+'</select></div>' +
        '<button class="btn btn-block mt" id="em-addbt">➕ ADICIONAR</button>'
        : '<p class="tiny muted mt">Todos os filtros já estão aplicados.</p>'));
    bindModalVoltar(() => modalEditar());
    $('#em-salvar').addEventListener('click', async () => {
      r.filtros = lista.map(f => ({nome:f.nome, validade:f.validade||undefined, origem:f.origem}));
      await idbPut('residents', r);
      closeModal(); toast('Filtros salvos');
    });
    $$('#modal-root [data-rm]').forEach(b => b.addEventListener('click', () => { lista.splice(+b.dataset.rm,1); render(); }));
    $$('#modal-root [data-vd]').forEach(inp => inp.addEventListener('change', () => { lista[+inp.dataset.vd].validade = inp.value; }));
    const addBt = $('#em-addbt');
    if(addBt) addBt.addEventListener('click', () => {
      const v = $('#em-add').value;
      lista.push({nome:v, validade:'', origem:'aplicado'});
      render();
    });
  }
  render();
}

/* ---- AJUSTAR FILTROS: renomear, periodicidade, excluir, criar ---- */
function modalAjustar(){
  (async () => {
    const defs = (await idbAll('filterDefs')).sort((a,b) => a.nome.localeCompare(b.nome,'pt-BR'));
    openModal(
      modalTop('AJUSTAR FILTROS') +
      '<p class="small muted">Edite nomes, defina periodicidade de visitas (em meses) ou exclua filtros. Excluir remove o filtro de TODOS os moradores.</p>' +
      defs.map((d,i) =>
        '<div class="area-card" data-n="'+esc(d.nome)+'">' +
          '<label class="tiny muted">Nome do filtro</label>' +
          '<input class="inp" data-ren value="'+esc(d.nome)+'">' +
          '<label class="tiny muted" style="margin-top:.35rem">Periodicidade de visita (meses, vazio = sem)</label>' +
          '<input class="inp" inputmode="numeric" data-per placeholder="ex.: 6" value="'+(d.periodicidade||'')+'">' +
          '<button class="btn btn-sm btn-r" data-ex style="margin-top:.5rem">🗑 EXCLUIR FILTRO</button>' +
        '</div>').join('') +
      '<div class="card mt"><div class="card-title">Criar novo filtro</div>' +
        '<input class="inp" id="aj-novo" placeholder="Nome do novo filtro">' +
        '<button class="btn btn-block mt" id="aj-criar">➕ CRIAR FILTRO</button>' +
      '</div>');
    bindModalVoltar(closeModal);
    const renomear = async (nomeAntigo, novo) => {
      novo = sanitizarTexto(novo, 60);
      if(!novo || norm(novo) === norm(nomeAntigo)) return;
      const all = await idbAll('filterDefs');
      if(all.some(d => norm(d.nome) === norm(novo))){ toast('Já existe um filtro com esse nome'); return; }
      const def = all.find(d => norm(d.nome) === norm(nomeAntigo));
      await idbDel('filterDefs', def ? def.nome : nomeAntigo);
      await idbPut('filterDefs', {nome:novo, periodicidade: def ? def.periodicidade : null});
      const rs = await idbAll('residents');
      for(const r of rs){
        let mudou = false;
        (r.filtros||[]).forEach(f => { if(norm(f.nome) === norm(nomeAntigo)){ f.nome = novo; mudou = true; } });
        if(mudou) await idbPut('residents', r);
      }
      toast('Filtro renomeado para '+novo);
      modalAjustar();
    };
    $$('#modal-root [data-ren]').forEach(inp => inp.addEventListener('change', () => {
      renomear(inp.closest('.area-card').dataset.n, inp.value);
    }));
    $$('#modal-root [data-per]').forEach(inp => inp.addEventListener('change', async () => {
      const nome = inp.closest('.area-card').dataset.n;
      const defs2 = await idbAll('filterDefs');
      const def = defs2.find(d => norm(d.nome) === norm(nome));
      if(!def) return;
      def.periodicidade = inp.value ? Math.max(1, parseInt(inp.value.replace(/\D/g,''),10) || 0) : null;
      await idbPut('filterDefs', def);
      toast('Periodicidade salva');
    }));
    $$('#modal-root [data-ex]').forEach(b => b.addEventListener('click', async () => {
      const nome = b.closest('.area-card').dataset.n;
      if(!(await modalConfirmar('Excluir filtro?', 'O filtro "'+esc(nome)+'" será removido de todos os moradores. Confirma?', 'EXCLUIR'))) return;
      if(!(await modalConfirmar('Confirmação final', 'Esta ação não pode ser desfeita. Excluir "'+esc(nome)+'" de todos os moradores?', 'EXCLUIR DEFINITIVAMENTE'))) return;
      const defs2 = await idbAll('filterDefs');
      const def = defs2.find(d => norm(d.nome) === norm(nome));
      if(def) await idbDel('filterDefs', def.nome);
      const rs = await idbAll('residents');
      for(const r of rs){
        const antes = (r.filtros||[]).length;
        r.filtros = (r.filtros||[]).filter(f => norm(f.nome) !== norm(nome));
        if(r.filtros.length !== antes) await idbPut('residents', r);
      }
      toast('Filtro excluído');
      modalAjustar();
    }));
    $('#aj-criar').addEventListener('click', async () => {
      const v = sanitizarTexto($('#aj-novo').value, 60);
      if(!v){ toast('Digite um nome'); return; }
      const defs2 = await idbAll('filterDefs');
      if(defs2.some(d => norm(d.nome) === norm(v))){ toast('Já existe'); return; }
      await idbPut('filterDefs', {nome:v, periodicidade:null});
      toast('Filtro criado');
      modalAjustar();
    });
  })();
}

/* ---- REINICIAR FILTROS (mantém os importados) ---- */
function modalReiniciar(){
  (async () => {
    if(!(await modalConfirmar('Reiniciar filtros?', 'Todos os filtros personalizados serão removidos dos moradores. Os filtros importados das planilhas são mantidos.', 'REINICIAR'))) return;
    if(!(await modalConfirmar('Confirmação final', 'Tem certeza? Esta ação não pode ser desfeita.', 'SIM, REINICIAR'))) return;
    const rs = await idbAll('residents');
    let n = 0;
    for(const r of rs){
      const antes = (r.filtros||[]).length;
      r.filtros = (r.filtros||[]).filter(f => f.origem === 'importado');
      if(r.filtros.length !== antes){ await idbPut('residents', r); n++; }
    }
    toast('Filtros personalizados removidos ('+n+' moradores afetados)');
    closeModal();
  })();
}
/* ================= TELA DE ACOMPANHAMENTO ================= */
registerScreen('acompanhamento', async (app) => {
  const avisos = await computeAvisos();
  app.innerHTML = topbarHTML({titulo:'ACOMPANHAMENTO', esq:{}}) +
    '<div class="content"><div class="menu-grid" style="margin-top:.4rem">' +
      '<button class="menu-btn b-amarelo" data-go="avisos"><span class="ic">🔔</span><span>AVISOS<small>'+(avisos.length ? avisos.length+' pendência'+(avisos.length>1?'s':'') : 'nenhum aviso no momento')+'</small></span></button>' +
      '<button class="menu-btn" data-go="guias"><span class="ic">📄</span><span>GUIAS DE EXAMES<small>entrega e conferência</small></span></button>' +
      '<button class="menu-btn" data-go="agendamentos"><span class="ic">🗓️</span><span>AGENDAMENTOS<small>consultas na unidade</small></span></button>' +
      '<button class="menu-btn b-verde" data-go="visitas"><span class="ic">🚪</span><span>VISITA DOMICILIAR<small>registrar visitas da rota</small></span></button>' +
      '<button class="menu-btn b-verde" data-go="gestantes"><span class="ic">🤰</span><span>GESTANTE / PUERICULTURA<small>acompanhamento prioritário</small></span></button>' +
    '</div></div>';
  $('#tb-voltar').addEventListener('click', navBack);
  app.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
});

/* ================= TELA DE AVISOS ================= */
registerScreen('avisos', async (app) => {
  app.innerHTML = topbarHTML({titulo:'AVISOS', esq:{}}) + '<div class="content"><div id="av-lista" class="avisos-list"></div></div>';
  $('#tb-voltar').addEventListener('click', navBack);
  const lista = $('#av-lista');
  async function render(){
    const avisos = await computeAvisos();
    if(!avisos.length){
      lista.innerHTML = '<div class="card center" style="padding:2rem 1rem"><div style="font-size:2rem">✅</div><p class="muted mt">Nenhum aviso no momento.</p></div>';
      return;
    }
    lista.innerHTML = avisos.map(a =>
      '<div class="card av-card '+(a.feito?'av-done':'')+'">' +
        '<div class="av-t">'+esc(a.titulo)+(a.feito?' <span class="st-tag st-avisado">MARCADO</span>':'')+'</div>' +
        '<div class="av-x">'+a.texto+'</div>' +
        (a.acao ? '<div class="av-actions">'+(a.feito ? '' :
          '<button class="btn btn-sm '+(a.acao==='RESOLVIDO'?'btn-g':'')+'" data-av="'+esc(a.id)+'" data-tipo="'+a.acao+'">'+
          (a.acao==='RESOLVIDO'?'✔ RESOLVIDO':a.acao==='AVISADO'?'✔ AVISADO':'✔ OK')+'</button>')+'</div>' : '') +
      '</div>').join('');
    lista.querySelectorAll('[data-av]').forEach(b => b.addEventListener('click', async () => {
      const key = b.dataset.tipo === 'RESOLVIDO' ? 'resolvidos' : 'avisados';
      const mapa = (await kvGet(key, {})) || {};
      mapa[b.dataset.av] = todayISO();
      await kvSet(key, mapa);
      render();
    }));
  }
  render();
});

/* ================= GESTANTE / PUERICULTURA ================= */
registerScreen('gestantes', async (app) => {
  const rs = await idbAll('residents');
  const lista = rs.filter(r => (r.cond && r.cond.gestante) || (idadeEm(r.nascimento) != null && idadeEm(r.nascimento) < 2))
    .sort((a,b) => (b.nascimento||'').localeCompare(a.nascimento||''));
  app.innerHTML = topbarHTML({titulo:'GESTANTE / PUERICULTURA', esq:{}}) +
    '<div class="content">' +
      (lista.length ? '<p class="small muted">'+lista.length+' morador(es) em acompanhamento prioritário</p><div class="row-list">' +
        lista.map(r => {
          const tags = [];
          if(r.cond && r.cond.gestante) tags.push('GESTANTE');
          if(idadeEm(r.nascimento) != null && idadeEm(r.nascimento) < 2) tags.push('PUERICULTURA');
          const ultVisita = (r.visitas||[]).map(v=>v.data).sort().pop();
          return '<div class="p-row" data-id="'+r.id+'"><span class="p-nome">'+esc(r.nome)+'</span>' +
            '<span class="p-sub">'+esc(linhaEndereco(r))+'</span>' +
            '<span class="p-badges">'+tags.map(t=>'<span class="badge imp">'+t+'</span>').join('')+
            (ultVisita ? '<span class="badge">última visita '+fmtDate(ultVisita)+'</span>' : '<span class="badge">sem visitas</span>')+'</span></div>';
        }).join('') + '</div>'
        : '<div class="card center" style="padding:2rem 1rem"><p class="muted">Nenhuma gestante ou criança menor de 2 anos na área.</p></div>') +
    '</div>';
  $('#tb-voltar').addEventListener('click', navBack);
  app.querySelectorAll('.p-row').forEach(row => row.addEventListener('click', () => go('perfil', {id:+row.dataset.id})));
});

/* ================= GUIAS DE EXAMES ================= */
const GUI = { sel:new Set(), filt:new Set() };
function fldHTML(id, label, val, opts){
  opts = opts || {};
  const req = opts.req ? ' <span class="req">*</span>' : '';
  if(opts.type === 'date')
    return '<label class="fld" for="'+id+'">'+label+req+'</label><input type="date" class="inp" id="'+id+'" value="'+esc(val||'')+'">';
  return '<label class="fld" for="'+id+'">'+label+req+'</label><input class="inp" id="'+id+'" value="'+esc(val||'')+'" placeholder="'+esc(opts.ph||'')+'"'+(opts.im?' inputmode="'+opts.im+'"':'')+'>';
}
registerScreen('guias', async (app) => {
  GUI.sel = new Set();
  app.innerHTML = topbarHTML({titulo:'GUIAS DE EXAMES', esq:{}}) +
    '<div class="content">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">' +
        '<button class="btn btn-p" id="gu-add">➕ ADICIONAR</button>' +
        '<button class="btn" id="gu-editar" disabled>✏️ EDITAR</button>' +
        '<button class="btn btn-r" id="gu-excluir" disabled>🗑 EXCLUIR</button>' +
        '<button class="btn btn-g" id="gu-conferir" disabled>🤝 CONFERIR</button>' +
      '</div>' +
      '<div class="chips">' +
        ['comigo|🫵 COMIGO','entregue|🤝 ENTREGUE','passou|DATA PASSOU','porvir|DATA POR VIR'].map(s => {
          const [k, l] = s.split('|');
          return '<button class="chip-t'+(GUI.filt.has(k)?' on':'')+'" data-f="'+k+'">'+l+'</button>';
        }).join('') +
      '</div>' +
      '<div id="gu-lista"></div>' +
      '<div class="print-bar"><button class="btn" id="gu-imprimir">🖨️ IMPRIMIR</button></div>' +
    '</div>';
  $('#tb-voltar').addEventListener('click', navBack);
  async function renderLista(){
    const guias = await filtrarGuias();
    const div = $('#gu-lista');
    $('#gu-conferir').disabled = !guias.length;
    $('#gu-editar').disabled = GUI.sel.size !== 1;
    $('#gu-excluir').disabled = GUI.sel.size < 1;
    div.innerHTML = guias.length ? guias.map(g =>
      '<div class="g-row '+(GUI.sel.has(g.id)?'sel':'')+'" data-id="'+g.id+'">' +
        '<input type="checkbox" '+(GUI.sel.has(g.id)?'checked':'')+'>' +
        '<div class="g-body">' +
          '<div class="g-nome">'+esc(g.nome||'(sem nome)')+'<span class="st-tag '+(g.situacao==='entregue'?'st-entregue':'st-comigo')+'">'+(g.situacao==='entregue'?'🤝 ENTREGUE':'🫵 COMIGO')+'</span></div>' +
          '<div class="g-l">'+esc(g.exame||'Exame')+' — '+esc(g.local||'local não informado')+'</div>' +
          '<div class="g-l">📅 '+fmtDate(g.data)+(g.hora?' às '+esc(g.hora):'')+' · 🏠 '+esc(g.endereco||'—')+'</div>' +
          (g.cadastro ? '<div class="g-l">Cadastro: '+esc(g.cadastro)+'</div>' : '') +
          (g.situacao === 'entregue' ?
            '<div class="g-l">Entregue em '+fmtDate(g.entregueData||'')+(g.entregueQuem?' — recebeu: '+esc(g.entregueQuem):'')+'</div>' :
            ((g.tentativas||[]).length ? '<div class="g-l">Tentativas: '+g.tentativas.map(fmtDate).join(', ')+'</div>' : '')) +
        '</div>' +
      '</div>').join('')
      : '<div class="card center" style="padding:1.6rem 1rem"><p class="muted">Nenhuma guia registrada'+(GUI.filt.size?' para os filtros escolhidos':'')+'.</p></div>';
    div.querySelectorAll('.g-row').forEach(row => row.addEventListener('click', (e) => {
      const id = +row.dataset.id;
      if(GUI.sel.has(id)) GUI.sel.delete(id); else GUI.sel.add(id);
      renderLista();
    }));
  }
  app.querySelectorAll('[data-f]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.f;
    if(GUI.filt.has(k)) GUI.filt.delete(k); else GUI.filt.add(k);
    b.classList.toggle('on');
    renderLista();
  }));
  $('#gu-add').addEventListener('click', () => modalGuiaForm(null));
  $('#gu-editar').addEventListener('click', async () => {
    const g = (await idbAll('guides')).find(x => x.id === [...GUI.sel][0]);
    if(g) modalGuiaForm(g);
  });
  $('#gu-excluir').addEventListener('click', async () => {
    if(!(await modalConfirmar('Excluir guia(s)?', GUI.sel.size+' guia(s) serão excluídos.', 'EXCLUIR'))) return;
    await idbBulkDel('guides', [...GUI.sel]);
    GUI.sel.clear();
    toast('Guias excluídas');
    renderLista();
  });
  $('#gu-conferir').addEventListener('click', () => modalGuiaConferir(renderLista));
  $('#gu-imprimir').addEventListener('click', async () => {
    const guias = await filtrarGuias();
    const tds = g => '<tr><td>'+esc(g.cadastro||'')+'</td><td>'+esc(g.nome||'')+'</td><td>'+esc(g.endereco||'')+'</td><td>'+esc(g.local||'')+'</td><td>'+esc(g.exame||'')+'</td><td>'+fmtDate(g.data)+' '+esc(g.hora||'')+'</td><td>'+(g.situacao==='entregue' ? 'ENTREGUE '+fmtDate(g.entregueData||'')+(g.entregueQuem?' — '+esc(g.entregueQuem):'') : 'COMIGO'+((g.tentativas||[]).length?' (tentativas: '+g.tentativas.map(fmtDate).join(', ')+')':''))+'</td></tr>';
    imprimirHTML('Guias de exames',
      '<table><tr><th>Cadastro</th><th>Nome</th><th>Endereço</th><th>Local</th><th>Exame</th><th>Data</th><th>Situação</th></tr>' +
      guias.map(tds).join('') + '</table>');
  });
  await renderLista();
});
async function filtrarGuias(){
  const hoje = todayISO();
  let guias = await idbAll('guides');
  const fSit = [...GUI.filt].filter(k => k === 'comigo' || k === 'entregue');
  const fDat = [...GUI.filt].filter(k => k === 'passou' || k === 'porvir');
  if(fSit.length) guias = guias.filter(g => fSit.includes(g.situacao));
  if(fDat.length) guias = guias.filter(g => {
    if(!g.data) return false;
    const passou = g.data < hoje;
    return (passou && fDat.includes('passou')) || (!passou && fDat.includes('porvir'));
  });
  return guias.sort((a,b) => (a.data||'9999').localeCompare(b.data||'9999'));
}
function modalGuiaForm(g){
  const edicao = !!g;
  g = g || { cadastro:'', nome:'', endereco:'', local:'', exame:'', data:'', hora:'', situacao:'comigo', entregueData:'', entregueQuem:'', tentativas:[] };
  const tent = (g.tentativas||[]).slice();
  openModal(
    modalTopDup(edicao ? 'EDITAR GUIA' : 'ADICIONAR GUIA', 'SALVAR', 'gf-salvar') +
    '<div class="form-grid">' +
      fldHTML('gf-cadastro','Cadastro (cartão cidadão)', g.cadastro, {ph:'digite para buscar o morador'}) +
      fldHTML('gf-nome','Nome completo', g.nome, {req:true}) +
      fldHTML('gf-end','Endereço completo', g.endereco) +
      fldHTML('gf-local','Local do exame', g.local) +
      fldHTML('gf-exame','Exame', g.exame) +
      '<div class="two-col">' + fldHTML('gf-data','Data do exame', g.data, {type:'date', req:true}) + fldHTML('gf-hora','Horário', g.hora, {ph:'00:00'}) + '</div>' +
      '<label class="fld">Situação <span class="req">*</span></label>' +
      '<div class="radio-line">' +
        '<label><input type="radio" name="gf-sit" value="comigo" '+(g.situacao!=='entregue'?'checked':'')+'>🫵 COMIGO</label>' +
        '<label><input type="radio" name="gf-sit" value="entregue" '+(g.situacao==='entregue'?'checked':'')+'>🤝 ENTREGUE</label>' +
      '</div>' +
      '<div id="gf-entrega" style="display:'+(g.situacao==='entregue'?'block':'none')+'">' +
        '<div class="two-col">' + fldHTML('gf-entdata','Data que foi entregue', g.entregueData, {type:'date'}) + fldHTML('gf-entquem','Quem recebeu', g.entregueQuem) + '</div>' +
      '</div>' +
      '<label class="fld">Datas das tentativas de entrega</label>' +
      '<div id="gf-tents"></div>' +
      '<button class="btn btn-sm mt" id="gf-addtent">➕ Tentativa</button>' +
    '</div>');
  bindModalVoltar(closeModal);
  const renderTents = () => {
    $('#gf-tents').innerHTML = tent.map((d,i) =>
      '<div style="display:flex;gap:.4rem;margin-top:.35rem;align-items:center">' +
        '<input type="date" class="inp" data-t="'+i+'" value="'+esc(d)+'">' +
        '<button class="clear-x" data-tr="'+i+'" style="position:static">❌</button>' +
      '</div>').join('') || '<p class="tiny muted">Nenhuma tentativa registrada.</p>';
    $$('#gf-tents [data-t]').forEach(inp => inp.addEventListener('change', () => tent[+inp.dataset.t] = inp.value));
    $$('#gf-tents [data-tr]').forEach(b => b.addEventListener('click', () => { tent.splice(+b.dataset.tr,1); renderTents(); }));
  };
  renderTents();
  $('#gf-addtent').addEventListener('click', () => { tent.push(todayISO()); renderTents(); });
  // autofill por cadastro
  $('#gf-cadastro').addEventListener('change', async () => {
    const dig = onlyDigits($('#gf-cadastro').value);
    if(!dig) return;
    const rs = await idbAll('residents');
    const r = rs.find(x => x.cadastro === dig);
    if(r){
      if(!$('#gf-nome').value) $('#gf-nome').value = r.nome||'';
      if(!$('#gf-end').value) $('#gf-end').value = linhaEndereco(r);
      toast('Morador encontrado: '+r.nome);
    }
  });
  $$('#modal-root [name=gf-sit]').forEach(rd => rd.addEventListener('change', () => {
    $('#gf-entrega').style.display = $('#modal-root [name=gf-sit]:checked').value === 'entregue' ? 'block' : 'none';
  }));
  $('#gf-salvar').addEventListener('click', async () => {
    const nome = $('#gf-nome').value.trim();
    const data = $('#gf-data').value;
    const situacao = $('#modal-root [name=gf-sit]:checked').value;
    if(!nome){ toast('O nome completo é obrigatório'); return; }
    if(!data){ toast('A data do exame é obrigatória'); return; }
    const obj = {
      cadastro: onlyDigits($('#gf-cadastro').value),
      nome: sanitizarTexto(nome, 120),
      endereco: sanitizarTexto($('#gf-end').value, 160),
      local: sanitizarTexto($('#gf-local').value, 120),
      exame: sanitizarTexto($('#gf-exame').value, 120),
      data, hora: $('#gf-hora').value.trim(),
      situacao,
      entregueData: situacao==='entregue' ? $('#gf-entdata').value : '',
      entregueQuem: sanitizarTexto($('#gf-entquem').value, 120),
      tentativas: tent.filter(Boolean)
    };
    if(g.id != null) obj.id = g.id;
    await idbPut('guides', obj);
    closeModal();
    toast(edicao ? 'Guia atualizada' : 'Guia adicionada');
    if(currentRender.scr === 'guias') render(currentRender.scr, currentRender.params);
  });
}
function modalGuiaConferir(atualizar){
  (async () => {
    const guias = (await idbAll('guides')).filter(g => g.situacao === 'comigo')
      .sort((a,b) => (a.data||'9999').localeCompare(b.data||'9999'));
    const sel = new Set();
    openModal(
      modalTop('CONFERIR ENTREGAS') +
      '<div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;margin-bottom:.6rem">' +
        '<button class="btn btn-sm btn-g" id="gc-ent" disabled>🤝 ENTREGUE</button>' +
        '<button class="btn btn-sm" id="gc-aus" disabled>🚪 AUSENTE</button>' +
        '<input type="date" class="inp" id="gc-data" style="max-width:180px">' +
      '</div>' +
      '<p class="tiny muted">Selecione as guias COMIGO e marque ENTREGUE (grava a entrega) ou AUSENTE (grava a tentativa).</p>' +
      '<div class="row-list" id="gc-lista">' +
        (guias.length ? guias.map(g2 =>
          '<label class="res-item" data-id="'+g2.id+'"><input type="checkbox"><span style="flex:1"><b>'+esc(g2.nome)+'</b><br><span class="tiny muted">'+esc(g2.exame||'')+' · '+fmtDate(g2.data)+'</span></span></label>').join('')
          : '<p class="muted small">Nenhuma guia marcada como 🫵 COMIGO.</p>') +
      '</div>');
    bindModalVoltar(closeModal);
    const dataInp = $('#gc-data');
    const bot = () => { $('#gc-ent').disabled = $('#gc-aus').disabled = sel.size === 0; };
    $$('#gc-lista .res-item').forEach(item => item.addEventListener('click', () => {
      setTimeout(() => {
        const c = item.querySelector('input');
        item.classList.toggle('on', c.checked);
        if(c.checked) sel.add(+item.dataset.id); else sel.delete(+item.dataset.id);
        bot();
      }, 0);
    }));
    $('#gc-ent').addEventListener('click', async () => {
      for(const id of sel){
        const g2 = guias.find(x => x.id === id);
        g2.situacao = 'entregue';
        g2.entregueData = dataInp.value || todayISO();
        await idbPut('guides', g2);
      }
      closeModal(); toast(sel.size+' guia(s) marcada(s) como ENTREGUE'); atualizar();
    });
    $('#gc-aus').addEventListener('click', async () => {
      for(const id of sel){
        const g2 = guias.find(x => x.id === id);
        g2.tentativas = g2.tentativas || [];
        g2.tentativas.push(dataInp.value || todayISO());
        await idbPut('guides', g2);
      }
      closeModal(); toast('Tentativa registrada para '+sel.size+' guia(s)'); atualizar();
    });
  })();
}
/* ================= AGENDAMENTO DE CONSULTAS ================= */
const AGD = { sel:new Set() };
registerScreen('agendamentos', async (app) => {
  AGD.sel = new Set();
  app.innerHTML = topbarHTML({titulo:'AGENDAMENTO DE CONSULTAS', esq:{}}) +
    '<div class="content">' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:.6rem">' +
        '<button class="btn btn-p" id="ag-add">➕ ADICIONAR</button>' +
        '<button class="btn" id="ag-editar" disabled>✏️ EDITAR</button>' +
        '<button class="btn btn-r" id="ag-excluir" disabled>🗑 EXCLUIR</button>' +
        '<button class="btn btn-g" id="ag-conferir" disabled>✅ CONFERIR</button>' +
      '</div>' +
      '<div id="ag-lista"></div>' +
      '<div class="print-bar"><button class="btn" id="ag-imprimir">🖨️ IMPRIMIR</button></div>' +
    '</div>';
  $('#tb-voltar').addEventListener('click', navBack);
  async function renderLista(){
    const ags = (await idbAll('appointments')).sort((a,b) => (a.data||'9999').localeCompare(b.data||'9999') || (a.hora||'').localeCompare(b.hora||''));
    $('#ag-conferir').disabled = !ags.length;
    $('#ag-editar').disabled = AGD.sel.size !== 1;
    $('#ag-excluir').disabled = AGD.sel.size < 1;
    const VIA = { pessoalmente:'🤝 aviso entregue pessoalmente', naCasa:'🏠 aviso entregue na casa', whatsapp:'📱 avisado por WhatsApp', ausente:'🚪 ausente na entrega' };
    const div = $('#ag-lista');
    div.innerHTML = ags.length ? ags.map(a =>
      '<div class="g-row '+(AGD.sel.has(a.id)?'sel':'')+'" data-id="'+a.id+'">' +
        '<input type="checkbox" '+(AGD.sel.has(a.id)?'checked':'')+'>' +
        '<div class="g-body">' +
          '<div class="g-nome">'+esc(a.nome||'(sem nome)')+'</div>' +
          '<div class="g-l">🩺 '+esc(a.profissional||'—')+'</div>' +
          '<div class="g-l">📅 '+fmtDate(a.data)+(a.hora?' às '+esc(a.hora):'')+' · 🏠 '+esc(a.endereco||'—')+'</div>' +
          (a.cadastro ? '<div class="g-l">Cadastro: '+esc(a.cadastro)+'</div>' : '') +
          (a.notificadoVia ? '<div class="g-l"><span class="st-tag '+(a.notificadoVia==='ausente'?'st-avisado':'st-entregue')+'">'+VIA[a.notificadoVia]+'</span>'+(a.notificadoEm?' '+fmtDate(a.notificadoEm):'')+'</div>' : '') +
        '</div>' +
      '</div>').join('')
      : '<div class="card center" style="padding:1.6rem 1rem"><p class="muted">Nenhum agendamento registrado.</p></div>';
    div.querySelectorAll('.g-row').forEach(row => row.addEventListener('click', () => {
      const id = +row.dataset.id;
      if(AGD.sel.has(id)) AGD.sel.delete(id); else AGD.sel.add(id);
      renderLista();
    }));
  }
  $('#ag-add').addEventListener('click', () => modalAgForm(null));
  $('#ag-editar').addEventListener('click', async () => {
    const a = (await idbAll('appointments')).find(x => x.id === [...AGD.sel][0]);
    if(a) modalAgForm(a);
  });
  $('#ag-excluir').addEventListener('click', async () => {
    if(!(await modalConfirmar('Excluir agendamento(s)?', AGD.sel.size+' agendamento(s) serão excluídos.', 'EXCLUIR'))) return;
    await idbBulkDel('appointments', [...AGD.sel]);
    AGD.sel.clear();
    toast('Agendamentos excluídos');
    renderLista();
  });
  $('#ag-conferir').addEventListener('click', () => modalAgConferir(renderLista));
  $('#ag-imprimir').addEventListener('click', async () => {
    const ags = (await idbAll('appointments')).sort((a,b) => (a.data||'9999').localeCompare(b.data||'9999'));
    const VIA = { pessoalmente:'entregue pessoalmente', naCasa:'entregue na casa', whatsapp:'WhatsApp', ausente:'ausente' };
    imprimirHTML('Agendamento de consultas',
      '<table><tr><th>Nome</th><th>Endereço</th><th>Profissional</th><th>Data</th><th>Hora</th><th>Aviso</th></tr>' +
      ags.map(a => '<tr><td>'+esc(a.nome||'')+'</td><td>'+esc(a.endereco||'')+'</td><td>'+esc(a.profissional||'')+'</td><td>'+fmtDate(a.data)+'</td><td>'+esc(a.hora||'')+'</td><td>'+(a.notificadoVia?VIA[a.notificadoVia]+(a.notificadoEm?' '+fmtDate(a.notificadoEm):''):'')+'</td></tr>').join('') +
      '</table>');
  });
  await renderLista();
});
function modalAgForm(a){
  const edicao = !!a;
  a = a || { cadastro:'', nome:'', endereco:'', profissional:'', data:'', hora:'', notificadoVia:'', notificadoEm:'' };
  openModal(
    modalTopDup(edicao ? 'EDITAR AGENDAMENTO' : 'ADICIONAR AGENDAMENTO', 'SALVAR', 'af-salvar') +
    '<div class="form-grid">' +
      fldHTML('af-cadastro','Cadastro (cartão cidadão)', a.cadastro, {ph:'digite para buscar o morador'}) +
      fldHTML('af-nome','Nome completo', a.nome, {req:true}) +
      fldHTML('af-end','Endereço completo', a.endereco) +
      fldHTML('af-prof','Profissional que irá atender', a.profissional, {req:true}) +
      '<div class="two-col">' + fldHTML('af-data','Data da consulta', a.data, {type:'date', req:true}) + fldHTML('af-hora','Hora da consulta', a.hora, {ph:'00:00'}) + '</div>' +
      '<label class="fld">Como a pessoa foi avisada (opcional)</label>' +
      '<div class="radio-line" style="flex-direction:column;gap:.45rem">' +
        '<label><input type="radio" name="af-via" value="pessoalmente" '+(a.notificadoVia==='pessoalmente'?'checked':'')+'>🤝 aviso de consulta entregue pessoalmente</label>' +
        '<label><input type="radio" name="af-via" value="naCasa" '+(a.notificadoVia==='naCasa'?'checked':'')+'>🏠 entregue na casa</label>' +
        '<label><input type="radio" name="af-via" value="whatsapp" '+(a.notificadoVia==='whatsapp'?'checked':'')+'>📱 por WhatsApp</label>' +
        '<label><input type="radio" name="af-via" value="ausente" '+(a.notificadoVia==='ausente'?'checked':'')+'>🚪 pessoa ausente</label>' +
      '</div>' +
    '</div>');
  bindModalVoltar(closeModal);
  $('#af-cadastro').addEventListener('change', async () => {
    const dig = onlyDigits($('#af-cadastro').value);
    if(!dig) return;
    const rs = await idbAll('residents');
    const r = rs.find(x => x.cadastro === dig);
    if(r){
      if(!$('#af-nome').value) $('#af-nome').value = r.nome||'';
      if(!$('#af-end').value) $('#af-end').value = linhaEndereco(r);
      toast('Morador encontrado: '+r.nome);
    }
  });
  $('#af-salvar').addEventListener('click', async () => {
    const nome = $('#af-nome').value.trim(), prof = $('#af-prof').value.trim(), data = $('#af-data').value;
    if(!nome){ toast('O nome completo é obrigatório'); return; }
    if(!prof){ toast('A profissional que irá atender é obrigatória'); return; }
    if(!data){ toast('A data da consulta é obrigatória'); return; }
    const via = $('#modal-root [name=af-via]:checked');
    const obj = {
      cadastro: onlyDigits($('#af-cadastro').value),
      nome: sanitizarTexto(nome, 120),
      endereco: sanitizarTexto($('#af-end').value, 160),
      profissional: sanitizarTexto(prof, 120),
      data, hora: $('#af-hora').value.trim(),
      notificadoVia: via ? via.value : '', notificadoEm: via ? (a.notificadoEm && a.notificadoVia === via.value ? a.notificadoEm : todayISO()) : ''
    };
    if(a.id != null) obj.id = a.id;
    await idbPut('appointments', obj);
    closeModal();
    toast(edicao ? 'Agendamento atualizado' : 'Agendamento adicionado');
    if(currentRender.scr === 'agendamentos') render(currentRender.scr, currentRender.params);
  });
}
function modalAgConferir(atualizar){
  (async () => {
    const ags = (await idbAll('appointments')).sort((a,b) => (a.data||'9999').localeCompare(b.data||'9999'));
    const sel = new Set();
    openModal(
      modalTop('CONFERIR AVISOS DE CONSULTA') +
      '<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-bottom:.6rem">' +
        '<button class="btn btn-sm btn-g" id="ac-1" disabled>🤝 ENTREGUE</button>' +
        '<button class="btn btn-sm btn-g" id="ac-2" disabled>🏠 NA CASA</button>' +
        '<button class="btn btn-sm btn-g" id="ac-3" disabled>📱 WhatsApp</button>' +
        '<button class="btn btn-sm" id="ac-4" disabled>🚪 AUSENTE</button>' +
        '<input type="date" class="inp" id="ac-data" style="max-width:170px">' +
      '</div>' +
      '<div class="row-list" id="ac-lista">' +
        (ags.length ? ags.map(a2 =>
          '<label class="res-item" data-id="'+a2.id+'"><input type="checkbox"><span style="flex:1"><b>'+esc(a2.nome)+'</b><br><span class="tiny muted">'+esc(a2.profissional||'')+' · '+fmtDate(a2.data)+(a2.hora?' '+esc(a2.hora):'')+'</span></span></label>').join('')
          : '<p class="muted small">Nenhum agendamento.</p>') +
      '</div>');
    bindModalVoltar(closeModal);
    const dataInp = $('#ac-data');
    const bot = () => { ['ac-1','ac-2','ac-3','ac-4'].forEach(id => $('#'+id).disabled = sel.size === 0); };
    $$('#ac-lista .res-item').forEach(item => item.addEventListener('click', () => {
      setTimeout(() => {
        const c = item.querySelector('input');
        item.classList.toggle('on', c.checked);
        if(c.checked) sel.add(+item.dataset.id); else sel.delete(+item.dataset.id);
        bot();
      }, 0);
    }));
    const VIA = { 'ac-1':'pessoalmente', 'ac-2':'naCasa', 'ac-3':'whatsapp', 'ac-4':'ausente' };
    for(const bt of ['ac-1','ac-2','ac-3','ac-4']){
      $('#'+bt).addEventListener('click', async () => {
        for(const id of sel){
          const a2 = ags.find(x => x.id === id);
          a2.notificadoVia = VIA[bt];
          a2.notificadoEm = dataInp.value || todayISO();
          await idbPut('appointments', a2);
        }
        closeModal();
        toast(sel.size+' agendamento(s) atualizado(s)');
        atualizar();
      });
    }
  })();
}

/* ================= TELA DE VISITA DOMICILIAR ================= */
const VIS = { sel:new Set(), marks:{}, data:'' };
registerScreen('visitas', async (app) => {
  VIS.sel = new Set(); VIS.marks = {};
  app.innerHTML = topbarHTML({titulo:'VISITA DOMICILIAR', esq:{}}) +
    '<div class="content">' +
      '<div style="display:flex;gap:.4rem;flex-wrap:wrap">' +
        '<button class="btn btn-sm btn-g" id="vs-ok">➡️🏠 Visita realizada</button>' +
        '<button class="btn btn-sm btn-y" id="vs-nao">🚪🔒 Visita não realizada</button>' +
        '<button class="btn btn-sm" id="vs-limpar">❌ Limpar</button>' +
        '<button class="btn btn-sm btn-p" id="vs-rel">📋 Gerar relatório</button>' +
        '<button class="btn btn-sm" id="vs-salvar" disabled>💾 Salvar</button>' +
      '</div>' +
      '<label class="fld" for="vs-data">Data das visitas</label>' +
      '<input type="date" class="inp" id="vs-data" value="'+esc(VIS.data)+'">' +
      '<div class="search-box mt"><input id="vs-q" placeholder="Buscar rua ou número…" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false">' +
        '<button class="clear-x" id="vs-x" style="display:none">❌</button></div>' +
      '<p class="tiny muted mt">Toque nas residências para selecionar. Verde = visita realizada, amarelo = não realizada.</p>' +
      '<div id="vs-lista" class="row-list"></div>' +
    '</div>';
  $('#tb-voltar').addEventListener('click', navBack);
  let casas = [];
  (async () => {
    const rs = await idbAll('residents');
    const m = new Map();
    for(const r of rs){
      const rua = (r.endereco||'').trim(), num = String(r.numero||'').trim();
      if(!rua || !num) continue;
      const k = norm(rua) + '|' + num;
      if(!m.has(k)) m.set(k, {rua, num});
    }
    casas = [...m.values()].sort((a,b) => a.rua.localeCompare(b.rua,'pt-BR') || numDe(a.num) - numDe(b.num));
    renderLista();
  })();
  const q = $('#vs-q'), xBt = $('#vs-x');
  const filtro = () => {
    const v = norm(q.value.trim());
    xBt.style.display = v ? 'block' : 'none';
    if(!v) return casas;
    return casas.filter(c => norm(c.rua).includes(v) || c.num.includes(v.replace(/\D/g,'') || '§'));
  };
  function renderLista(){
    const div = $('#vs-lista');
    const lista = filtro();
    const temMarca = Object.keys(VIS.marks).length > 0;
    $('#vs-salvar').disabled = !(temMarca && $('#vs-data').value);
    div.innerHTML = lista.length ? lista.map(c => {
      const k = norm(c.rua) + '|' + c.num;
      const mk = VIS.marks[k];
      return '<div class="p-row '+(mk==='ok'?'visit-ok':mk==='nao'?'visit-nao':'')+(VIS.sel.has(k)?' selected':'')+'" data-k="'+esc(k)+'">' +
        '<span class="p-nome">'+esc(c.rua+', '+c.num)+'</span>' +
        (mk ? '<span class="p-badges"><span class="st-tag '+(mk==='ok'?'st-entregue':'st-avisado')+'">'+(mk==='ok'?'✔ visita realizada':'🚪 não realizada')+'</span></span>' : '') +
      '</div>';
    }).join('') : '<p class="small muted center">Nenhuma residência encontrada'+(q.value?' para a busca':'')+'.</p>';
    div.querySelectorAll('.p-row').forEach(row => row.addEventListener('click', () => {
      const k = row.dataset.k;
      if(VIS.sel.has(k)) VIS.sel.delete(k); else VIS.sel.add(k);
      row.classList.toggle('selected');
    }));
  }
  q.addEventListener('input', debounce(renderLista, 200));
  xBt.addEventListener('click', () => { q.value=''; xBt.style.display='none'; renderLista(); });
  $('#vs-data').addEventListener('change', () => { VIS.data = $('#vs-data').value; $('#vs-salvar').disabled = !(Object.keys(VIS.marks).length && VIS.data); });
  $('#vs-ok').addEventListener('click', () => {
    if(!VIS.sel.size){ toast('Selecione uma ou mais residências'); return; }
    for(const k of VIS.sel) VIS.marks[k] = 'ok';
    VIS.sel.clear(); renderLista();
  });
  $('#vs-nao').addEventListener('click', () => {
    if(!VIS.sel.size){ toast('Selecione uma ou mais residências'); return; }
    for(const k of VIS.sel) VIS.marks[k] = 'nao';
    VIS.sel.clear(); renderLista();
  });
  $('#vs-limpar').addEventListener('click', () => { VIS.sel.clear(); VIS.marks = {}; renderLista(); toast('Seleções e marcações apagadas'); });
  $('#vs-rel').addEventListener('click', () => modalVisitaRelatorio());
  $('#vs-salvar').addEventListener('click', async () => {
    const data = $('#vs-data').value;
    if(!Object.keys(VIS.marks).length){ toast('Marque ao menos uma residência'); return; }
    if(!data){ toast('Informe a data das visitas'); return; }
    const rs = await idbAll('residents');
    const porCasa = {};
    for(const r of rs){
      const k = norm(r.endereco||'') + '|' + String(r.numero||'').trim();
      if(VIS.marks[k]) (porCasa[k] = porCasa[k] || []).push(r);
    }
    let n = 0;
    for(const k in porCasa){
      for(const r of porCasa[k]){
        r.visitas = r.visitas || [];
        r.visitas.push({data, status: VIS.marks[k] === 'ok' ? 'realizada' : 'nao'});
        await idbPut('residents', r);
        n++;
      }
    }
    VIS.marks = {}; VIS.sel.clear();
    renderLista();
    toast('Visitas registradas para '+n+' morador(es)');
  });
  async function coletarListas(){
    const rs = await idbAll('residents');
    const ok = [], nao = [];
    for(const r of rs){
      const k = norm(r.endereco||'') + '|' + String(r.numero||'').trim();
      if(VIS.marks[k] === 'ok') ok.push(r);
      else if(VIS.marks[k] === 'nao') nao.push(r);
    }
    const linhaTxt = r => (r.cns || '—') + '\t' + (r.nome||'').toUpperCase() + '\t' + linhaEndereco(r);
    return { ok, nao, txt:
      'Visitas realizadas:\n' + ok.map(linhaTxt).join('\n') +
      (nao.length ? '\n\nVisitas não realizadas:\n' + nao.map(linhaTxt).join('\n') : '') };
  }
  function modalVisitaRelatorio(){
    (async () => {
      const { ok, nao, txt } = await coletarListas();
      if(!ok.length && !nao.length){ toast('Marque residências primeiro'); return; }
      openModal(
        modalTop('RELATÓRIO DE VISITAS') +
        '<p style="margin:.3rem 0 .7rem">'+
          (ok.length ? ok.length+' moradores encontrados para visitas realizadas' : '') +
          (ok.length && nao.length ? ' e ' : '') +
          (nao.length ? nao.length+' moradores encontrados para visitas não realizadas' : '') +
        '</p>' +
        '<div style="display:flex;gap:.5rem;margin-bottom:.7rem">' +
          '<button class="btn btn-sm btn-p" id="vr-copiar">Copiar tudo</button>' +
          '<button class="btn btn-sm" id="vr-imprimir">Imprimir</button>' +
        '</div>' +
        '<div class="card" style="white-space:pre-wrap;font-size:.85rem;font-family:monospace">'+esc(txt)+'</div>');
      bindModalVoltar(closeModal);
      $('#vr-copiar').addEventListener('click', () => copiarTexto(txt));
      $('#vr-imprimir').addEventListener('click', () => {
        const tab = lista => '<table><tr><th>CNS</th><th>Nome completo</th><th>Endereço</th></tr>' +
          lista.map(r => '<tr><td>'+esc(r.cns||'—')+'</td><td>'+esc(r.nome||'')+'</td><td>'+esc(linhaEndereco(r))+'</td></tr>').join('') + '</table>';
        imprimirHTML('Relatório de visitas domiciliares',
          (ok.length ? '<h2>Visitas realizadas</h2>' + tab(ok) : '') +
          (nao.length ? '<h2>Visitas não realizadas</h2>' + tab(nao) : ''));
      });
    })();
  }
});
/* ================= TELA DE CONFIGURAÇÕES ================= */
registerScreen('config', async (app) => {
  let uso = '';
  try{
    const est = await navigator.storage.estimate();
    if(est && est.usage != null) uso = 'Armazenamento em uso: '+(est.usage/1048576).toFixed(1)+' MB' + (est.quota ? ' de ~'+Math.round(est.quota/1048576)+' MB disponíveis' : '');
  }catch(e){}
  app.innerHTML = topbarHTML({titulo:'CONFIGURAÇÕES', esq:{}}) +
    '<div class="content"><div class="menu-grid" style="margin-top:.4rem">' +
      '<button class="menu-btn" data-a="importar"><span class="ic">📥</span><span>IMPORTAR<small>planilhas BI em CSV</small></span></button>' +
      '<button class="menu-btn" data-a="area"><span class="ic">🗺️</span><span>DEFINIR ÁREA<small>endereços de atuação</small></span></button>' +
      '<button class="menu-btn b-verde" data-a="senha"><span class="ic">🔑</span><span>ALTERAR SENHA<small>senha de ativação de 4 caracteres</small></span></button>' +
      '<button class="menu-btn b-amarelo" data-a="tema"><span class="ic">🎨</span><span>TEMA<small>fonte, claro/escuro, cores</small></span></button>' +
      '<button class="menu-btn b-vermelho" data-a="reiniciar"><span class="ic">⚠️</span><span>REINICIAR<small>apaga todos os dados do app</small></span></button>' +
    '</div>' +
    (uso ? '<p class="tiny muted center mt">'+uso+'</p>' : '') +
    '</div>';
  $('#tb-voltar').addEventListener('click', navBack);
  app.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
    const a = b.dataset.a;
    if(a === 'importar') go('importar');
    else if(a === 'area') go('area');
    else if(a === 'tema') go('tema');
    else if(a === 'senha') modalAlterarSenha();
    else if(a === 'reiniciar') modalReiniciarApp();
  }));
});
function modalAlterarSenha(){
  openModal(
    modalTop('ALTERAR SENHA') +
    '<p class="center" style="font-weight:700;margin:.6rem 0">Insira a nova senha</p>' +
    '<input class="inp center" id="ns-valor" maxlength="4" placeholder="A1B2" ' +
      'style="text-transform:uppercase;letter-spacing:.4em;font-size:1.5rem;font-weight:800;text-align:center;max-width:220px;margin:0 auto;display:block">' +
    '<p class="tiny muted center mt">4 caracteres — letras maiúsculas e números de 1 a 9.</p>' +
    '<button class="btn btn-p btn-block mt" id="ns-salvar" style="max-width:220px;margin-left:auto;margin-right:auto">SALVAR</button>');
  bindModalVoltar(closeModal);
  const inp = $('#ns-valor');
  inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(/[^A-Z1-9]/g,''); });
  $('#ns-salvar').addEventListener('click', async () => {
    if(!senhaValida(inp.value)){ toast('Use 4 caracteres: letras maiúsculas e números de 1 a 9'); return; }
    S.senhaCustom = inp.value; S.senhaCancelada = false;
    await salvarEstado();
    closeModal();
    toast('Nova senha definida');
  });
}
async function modalReiniciarApp(){
  if(!(await modalConfirmar('Reiniciar o app?', 'Todos os dados serão apagados: moradores, área, filtros, guias, agendamentos e configurações. O app volta ao estado inicial.', 'REINICIAR'))) return;
  if(!(await modalConfirmar('Confirmação final', 'Esta ação é irreversível. Apagar TUDO agora?', 'APAGAR TUDO'))) return;
  await idbClrAll();
  try{ localStorage.clear(); sessionStorage.clear(); }catch(e){}
  location.reload();
}

/* ================= TELA DE TEMA ================= */
registerScreen('tema', (app) => {
  const t = S.tema;
  app.innerHTML = topbarHTML({titulo:'TEMA', esq:{}}) +
    '<div class="content">' +
      '<div class="card"><div class="card-title">Tamanho da fonte</div>' +
        '<div class="seg" id="t-fonte">' +
          ['p|Pequena','m|Média','g|Grande'].map(s => { const [k,l] = s.split('|');
            return '<button data-v="'+k+'" class="'+(t.fonte===k?'on':'')+'">'+l+'</button>'; }).join('') +
        '</div></div>' +
      '<div class="card mt"><div class="card-title">Fundo</div>' +
        '<div class="seg" id="t-modo">' +
          '<button data-v="claro" class="'+(t.modo!=='escuro'?'on':'')+'">☀️ Claro</button>' +
          '<button data-v="escuro" class="'+(t.modo==='escuro'?'on':'')+'">🌙 Escuro</button>' +
        '</div></div>' +
      '<div class="card mt"><div class="card-title">Cores de fundo claras (tons pastéis)</div>' +
        '<p class="tiny muted">Aplicadas quando o fundo claro está ativo.</p>' +
        '<div class="pal-row" id="t-pal">' +
          '<div class="pal '+(t.paleta==0?'on':'')+'" data-v="0"><div class="sw" style="background:#eef4f9"></div>Azul SUS</div>' +
          '<div class="pal '+(t.paleta==1?'on':'')+'" data-v="1"><div class="sw" style="background:#eaf6ee"></div>Verde SUS</div>' +
          '<div class="pal '+(t.paleta==2?'on':'')+'" data-v="2"><div class="sw" style="background:#faf3ea"></div>Areia</div>' +
          '<div class="pal '+(t.paleta==3?'on':'')+'" data-v="3"><div class="sw" style="background:#eae1f7"></div>Lilás</div>' +
          '<div class="pal '+(t.paleta==4?'on':'')+'" data-v="4"><div class="sw" style="background:#f7edc6"></div>Amarelo</div>' +
          '<div class="pal '+(t.paleta==5?'on':'')+'" data-v="5"><div class="sw" style="background:#fadfea"></div>Rosa</div>' +
        '</div></div>' +
    '</div>';
  $('#tb-voltar').addEventListener('click', navBack);
  const segBind = (id, key) => {
    $('#'+id).querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => {
      S.tema[key] = b.dataset.v;
      $('#'+id).querySelectorAll('[data-v]').forEach(x => x.classList.toggle('on', x === b));
      applyTheme(); salvarEstado();
    }));
  };
  segBind('t-fonte', 'fonte');
  segBind('t-modo', 'modo');
  $('#t-pal').querySelectorAll('.pal').forEach(b => b.addEventListener('click', () => {
    S.tema.paleta = +b.dataset.v;
    $('#t-pal').querySelectorAll('.pal').forEach(x => x.classList.toggle('on', x === b));
    applyTheme(); salvarEstado();
  }));
});

/* ---------------- PWA: manifest inline + service worker opcional ---------------- */
function buildManifest(){
  try{
    const manifest = {
      name:'ACS Digital', short_name:'ACS Digital',
      description:'Aplicativo de apoio ao Agente Comunitário de Saúde',
      start_url:'.', display:'standalone', orientation:'any',
      background_color:'#eef4f9', theme_color:'#0066b3', lang:'pt-BR',
      icons:[
        {src:'data:image/png;base64,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', sizes:'192x192', type:'image/png', purpose:'any'},
        {src:'data:image/webp;base64,UklGRnIfAABXRUJQVlA4IGYfAAAwcACdASrAAMAAPlEgjUSjoiEhLBL84HAKCWps9jBozE9VADq2OA95/K/2Sq9/gf7z+sP7nyIpm+3n+//h/ye+FPqc/Q/sBfrV/xeqN5kv2w/ZP3hf+P+2fvC/t3qCf3L/R9Zt+6XsJ/uH6c/7w/Cz/bv+t+5vtQf//2APQA5//kX6H/Jr8p3HfrX8H+UO8Mamvyz7o/gf7R+3X94/dv2kfF3gBfjf8z/u/5XfnDzY9uP9h6hHsf9F/yf9r/bD/C+mz/efkd72fZb/Wflv9AP88/pv+h/MrnM/MvYG/oP9s/533M/TR/Yf9//Pfkp7lfzz/I/9P/JflJ9hX8t/q3+9/uf+a/+H+f+dX2d/ud7On63uK3M7R1NfbK4e1N3FlcMT4zzsN4mxqDZ1izbXUgiLVDqtdpnXml5DbsnlCAu4Mh+nwoiCbN+kOV/cNRzfK3ZPiMxTQgfUM7LbhaQgslBnIbteDoYTnpgYW+n5dmiAuRjbLblkQJJkc8+jRdg1is59YolIciNVpLOM0Ie2q8C/PATFk94brBeaVIRKeGS7P+qCVgGcB/WP58rxn+o94GPpxmqZAfzEaOMRlaDTwYVS68DKlkNvYOsODPJTN9jmtpB8oI3Es/eeUGyjy4gTlp5MRBod+SO1zBqUHZTjW4wxbB+7G0Eplm2yDiqC+Z0FJuFD2SNj7Lid3oqGYd0LeY+HDsPx80Tr2Lq3OrA1riN0yF65MKXIwbi/oCZTUzC8CSPngXJcDClkE+Nk17TjDmz7rxm4ZD1Zi6aiiOERtLsIFrsdqLV/4/DZydXjWwx0nIVgn5Yo/x9nbCLHtffukaXbtsMCCYaPzjd0+hVtmVb6Ex2H/RFh2ipYJZpRZhaTvhkaUOMGQV1hcnmkRCBBv+Ok0+bF5Ik39pLLu7PtSsX5UYKlNAet8pwZ+Vy445ZBnzNsPpKUsa9QN1SsgQ18s6lKvm8vSsHmPFWzyFL25F2UL0fzS9gu6vI6ymQoyUxT4QgAZhJUiL+5mKpZw8Zgvzx/nV++zdNa5FeZru3lY4xYGnUsPUndpaDYT4JnPt6c97vMxnJ2VIyWENfDkot2YV8O6TL8o5XcPkdXLoRKGyEvjx68DuGagx46L7MDJk7BKrSx//tZJuNzm3S2jV6/oplOWP26dUfMejzaXEZDRHp2Z5miYdA1Ub/pdoFE1CDpaim595ezxnmNUcAA/v7MFr3cN5uiduKuiVmd/2dASKwrdg97jPsmu1PaqSA06jfSzOUproNTshxw6zKAIj3Jxa9A+HcbjUrR0cRMyEd6LlyW39cwEtYpZ02kPg/HGG3mnp6TNNmKX6eaex8+ybSJfPCeuG7leQ3uYIFcS9zXeDykgzV89+6qN3B/tOMykjyPsgLSLSWLZNhjr4g/euM7wAHHXiy+KlaRtrtJT2nPUmZcg7GgEt68QTcloo3Bxm1LScjIBCa0dbXgITefFiF3GMk6QW0DGbFK7igtUMD0YonRgeiGWY6Tc58FMRv3iG6fNUKlGeyDiGLbGWOjGvTUDzdOs72E+aTV1jChFFKIop0v95IV+wsxHB63+YSBGUt9ci+dn+GHBRkfJdn/2+siNM90IZ+RqfGu/e2+IFlZONdmigjlbz6UslIQT+GlMRb26z6djSDd15GdArgcq7SWXkj7QzkZXDSf4mL/pUMaawazbZG5b0tmm7jgwMehYCMCjy4HGbD84XehGy0bbHdCmQFlwWyGyujqRezTJLXh9MAmk/dcKWwI4amp4s0m7DPXw+IUe271/VtK935+n84H/n/qTMO45nDfQLYDw8sOpB4HVnkwkAfop4CYl+5tytWio99dBYzlSansF7AaS5xmoApAZLpt++s8ZlTFwMn2a984ucsn3fjmr0NLSjK9eHWnRkEhnwMVp7Rs6iE+cNDKkh7HG4d1KeSFBu3aYahN4Ea7pI4dsXVC4RISXRNsqNOX4i+csuds3pe/z5yvzWL63UtSnOjm7WxD3YDQOJ74aCse2GeKes26iUTN0whBqHYl9tXsLfM6wwOdx3rE2N4G4wvogaln/4/JmHYWj/stDCvrGlyRyErzuxs41GLfy2xLcUS+3E6YxJGBL1/AyUO994UnVwa7iLokf6bCM5SPq3Kn0diDx4mBB5V5P40tQ2/Z9mthGlL74ur9kbYWCc2Ju2ksT+F/km336ZMy85N6SPI652cLIC+1ZtksFLaqK/78aawEfcvWQZa+9zhioFf+/HUPQTEkh97/JTw3oRAKyPjkzK/kpyXSR0YBNfAW4Yr2iHJrKglOK8vc12eL5UPjAYGrmiwY9kGt+DPvF43sbB1TedEGyk8eaybR7KDsT0YTRsGavdNMYa7Ri6mAXAvDFQey2t6Wt+7z8XTMH4PIwESaRYp4AvQ83BvA1ud2YGrE7tkMqFiowtW5i1pQSuRJRXEKItWNb0SNDJn22k6cJ0dQJtTDUfTmWiRHVbVy0iv3IOq7dpKujGzh4leuN9TY4THQ5+Y5DwxMZ7TWszcDuucB8KfDCvdsIlfY35exG5zFPD++fn44r53MSBrUYCsY5WsDBr+xSmGQlOU/BqkiRe2mL1eaC6c3wqXf2yPbFub0RpPVblns6cIcTbe7sQdO2Z96GqQRlUDek11J6Xt3GJyWtibNZw3J2l6D0JD+sflsY5WMA2QPiTNejvNbJJH/BHb1yMOG3GXFmsVEzvsyLzHmApbZNMqlBYhE/w60ItKbheY0jFB02EuboF1s0afEgkC6I70arxzhXI/HZ5VN19QsZqAvPF6yExpZrILSQHNra5f85no7T/MecrhiXOHs0c5j0e4Wxq2BWJjQxVTM4ForT+aMZ5QgZEYDkQPzlIlwcP+Lu8cU7FTFBn+BYGR5tHrwG9gqpk8wXQE6mv/28uKKPjgwrL1zYtpwgtL4BOWh/3n37QboDMEA/wHnXvZkNA7EKdN+/3BcvEJtRt9SgjB9LBXVwaKZ7TbJW2aTPLv8Fmdk6y0d9su2HPXzOcgctBftoEY3JHl2Z6snA3wrHqazkLVWWGxLJ8fA6vWVzwS9B8NGvUObKM7mLRsg8mHQA3yPlkOPBuV1+HFz0x/Pl3iRZvv96AGB69OmlcKyQr2vqf8fMxcAFW2XqLwQMxcPfQZfXEh9eFxpJYaCSYoFSaQ5Tb+iv/q/eo25sWO+iEthjN+S8WnvLRcvUenrNEMyiENIxOL1+SOVZKnlMkxToKZnjd/X7fwMkT6aT/y8LeAKN2bW1ri50S3PDfw1lphJn8lcvd5PbHGeWiBnA63zau7LOcb+2SJEth//WDVN91+4dYLz5BsFWYzEX8BfqF4lnDXGlLbZsSHabsmehuWOBoaP1T2ZNLY/+cQ+A42eVJNFbvh/2thb3KGWMH8/GOSRYRMDzqgXT68KMSaBMD8ptNuqZDj2iEo545uY0dZhRpYQZGkfcio+Oxv0qjMEM5+UyBPVuFiazhhzLIXWNy1fDSfBUMejKS7dnrFLdgaj0yHJLbd//Cm2z+y/HsC6rRFY5RwOpbGyoeH+Njn5KJTfMgLxuft4dogpqtDfr2pHLuK+elbfWzj6mpqRgCBJ0ZnbDQQ4Fmspz19d8Dz1+w4phWI9tIfjvUeBioOwhTnDKzHLpff5nL9C/iL4wM9qBAIBXasAWCzIWolLtsoh0z5O9qgWveLvsmm6OwATY1ppvGYQdBmFLc8Ceu7f0BQrYNAGj2Kexc2+9oDdHvrMdC6TI0uK36LAiSDDO5Q3OwJNj3deF3J4K4plNYnJ+qmGPdTc5KZub68nA2CQD6NU1EMzafk5U6ALTaX8RfqFQszDsup6uv8C++9u8s51/NvVpYlK3WHvRIC5hHXBdEirOH4P8ouLp/ukxlrTlxRbhroikkxQ1bE+45capdmP6/WwXs+jyYqsQfzedNoZtb9/NeuwldUi9IjMamm7xttKMlttjWq1AcCwjAadiuXY0YeUKdFR226yEPZhJ9gf0RUkO38eM6JhCwtB5xAgJ0C5JcPQB8feBeflxRGS7HB1vZBEc93jt9ZkvuPYX5Dsy2CuxyuFXWYGAifSZeljnI8PYL16ctajZIbLms0/+TrPuR3uBldOPR9HZiOh7dvrdOE/JNDmIsb7dOSc/JnTVOliAbDPjcZFiu6eUsP+HNJQuhHXJQOXsTFuJzuondCrB6iWiTNGqlu3A6tU9IaQbcZQbZ+LkEKRSLqK2LnWxZsYdpiLLPFMWebYt65WnD1utJG0UcULBP6fp4nNn1GJYMRW/nKExEzo1SbtAEgaASBX8gQ6jPuAlTxzETaCnfD6AhxV9XR32rGZPuK4As56rivju/C2uGqQxtpVXouexSoEJd27GkXoxHdWGU5Tyz/OYnqm4RysDQ1+Yko2MiD1aNh2oGwmcm2J4XfGle6RTCOEvfff8OdNckPMdthv4pqbmgbCoP+2RV37WySn1ZWsQMMvpk/29p3UPep24zDhdPOIDWmtT4Cm8fBk6Vo+xSC8LDmxCVf3JuvhelcPZi75VYiKuutLzk39gzFCz+eoL79/k6QExydQKmHDq5NyFh1lK8otGgiySt+Jwwy+qJby/F1YPmEgTGruA9iljPBRKEI9SbzSrlJbKedPnDSjbYHSPj5W+qmUTRqaEeP57311+FBTEVhpGSG0D2QnpAwlUZiev8BihQAmODWsxGp0ZH5jz8RKHCzo2/AsKXmVfN/nI+NTLFgGIMytyGR67aD5MjytfV7gUfmDRjVhD92HTZ3V+zGm4imTmgZ90EjyDSput1RllOMnrvJj+BPTup8qMLTn+YeVW5fi9sGDD4EDvQL9XSZC0/hza1GUsKn6IARWVO14UaFR6LN3tes3EikuST2BtllZhTNXGAop+jTbxPQTHp1O6pT0S6zaTjDBvvTSFIn2FvC0jsYdkK+riL+cINE2dPlzELW4Mb5BBk9pcWn7V/bTOb2ou9zn/V5iL/t4qGqIc+kkRwQsMQwaw6pNFRT8ZRoJf4UG3CqAlb0OIdZpmMCbXnCXLorMeWliMFuRIuCWgT6Err5PNTSaZJHTlIDkHOz9nKnoEGGbH6u8GTwnI2F56vymWDy/zAy5m1ro5D48dqxGxKhcCi1/gJ4HaMgEf8lEuEInSdicHtSKYRxdQp5iSo3t/JICkL7xRKX+hHsYCg2bpZizFQuQHMOcSfiQ2NIxwzkguYG5869iCC1CALM6oN+nhwcui4I56IZRv04GKDNls9D78r/zSSzbhyKiZWI0NuWQdsKVYcJpUL+aNN+qNe5TtgxfjJ1eOzL+Q6MFHnvVDDsdaGG20wYNzSQK15KMR+8iuDs6AAGdR1b5T3yDnAP/JTkT7iP0YMA9qe90rVjKE4/OlTzBIOJBwcMRq19G7mfYID7TkcgkL1TIblKJ1MxzdCgKZpz8mEdn6562mDJcVFpsiy/YMA4TcWRRPmluw4Mpi0gPnw2aZIdZWmIevBOehJkOicxd2RzGzlh2ANL3Uc18CRLbgqm1IPi3d+yCO3J0lruV3iiCFoN9Raqb7EY9JLvO20S9/XsyRc2K7OpPyd4Gw/TlS7XIlz5VIFqGOaCaU+BL85FmsszZHRR79+ECjTQ76LCtcbez/oOYKghV1my5bhK99hyIpESNI7pW3qkJfV3PqQVTqBzjP+cPcMp9ESsqDW7TNaBmlPOXyWD9HzaVyCV/E9dsJNUxQcgfc+BGWuiu5r2z8jN5/6nyzLXm/4sxehd2B6li1lsNUXf9WavwBM0K4Y3EvtZu8Yi6jgKZA6fXPktkD8lZKWkpdunj6SBtdsz8JUAybam10Qi8b4CNdsnwoBZTTg2//ypH/dwyiGq1spz0iuHE2sMfvI0mm17g/vJkY06UYXbiG2HHWaETKitxPzjter4THdv61b52msS6P9ZQqz5lQ4I9RB/8gLOhr0Qo6fkFRSXmM1CIgKcxYyybQ/4Zv5Fw4VaF+/IJ4glQt9wh4iA8ys4f+Ggep2bJn115qTnUH4z7dvp/XH7aaoUjRo+phJgN8Kawz0FYMjyP658wjru93tS/2UR95wjgvUVang6VA9Wt8Es+J23mb1N4COsYLd10eYTPmpyrmzU6I1FKiPMTm9mmKmOwRbq9dv+Ql3p6Yjia+I+6N7uoUbDx5HbF7czB+vPJf7vRfj+Ykif4+hHBcPAVGaWK4K7e8wjXxVRzp8o7um+0Ecj1x4Kstix5Ll7ZoJpffYq/3/cItC2/ubW5F1qVQHdr0MHNLOxMfE1AXqkDvdS3oZWw620vgCINJieR3GrVI6O40286nIF7RImUuuutxXr4FOgpGpUFAimAAIJJ4lO44RgqNnnOwKe1mE/+sz/bUBLPo4QiN+kf3bgiBTsajjGyGZj8Oyi6+8IJ3cfxa7PjlgJxEK+mvXYcjqZgKLqrioHAVVFNjqWJ080sZnWHJJ60dYtBzxtrz5F9ccGoKLUqN5r3oU8b2hgO+G2lEXDmLGHAXFbn8L0h1SfcLjVd1OMUnGnAoBf2O8TqfpO0Jao5h79qmNti+1rgViNOcO8Vw5fuEA5fssfT2t1NlJ/+LcALlUz/h+Aq611Y3N9N4tv+ruaZ8excS+s/DzGQPuxndQGTZuds54as2YSLAvCOCm5nOcxPjX22lYT4grrm/vSZWxadrXsSoUTgc0F35YmVTbtGImH8vBjxvXTddqWUeDQIUulidYnPgkMN1IucWOcrDhRL9mXN2l17Gr+p+c642C4axMFKo+/cB2n+3Y2FaujpHVoKbHwFb2q8nlJxoo7Cn5WnudtKJxXRO6Y2klAn9d5eifCtdvadWuTrnDDPdnjzTgMxEUxCCTA8d/jiMCJ/r/SLAekI8WQN2pGiPZby08rlW+mT3ByCboj8wLIZPLJF/OB8bhTCDpKdOPTK2Y4Cqc3zDerUYFY9cC/FSuafMk/5Ny5njVo1BQG2yieSMobBj/zGSCDmzMUHSfrzKTyc3zL7fmm2DY/LXNNv2PMfYuP/yX2BIqn9XSblzaKNZ68MBnLWZZ1sTxSAF5qUnXTro1b/f8JBqALQ10Psm1Oukest5hi+wO5Bm/Ex3e2yJbrMgiXLW+BDFyc1cM8PoCbLgaVUoKu+LukaPneq5uM/jx69p1LAv1x2ET44JwGhqWIS0YefC/z+fU5crLQsAG63nWJr5427zfNsDD4BTCTyPREVvDV9JT0cyf+LVHP+tBpg6lOyOhzT5Yaceo8m1HaxSuvNZh+0jh0JWZV3+qsaXOYp2A0O+VIO1gm3C0NpXk3l6yfk/s/K7oe6OI6XMbIWiuYvUbtKGNoIDMa2JEqfRqlU03KStaFy+njkvJYKJ2fVdSIzPcAiBpGTWj36DPx93Z32ZnJ21kWCxCK5xHS9hHG+v1xHCIlHdQSZ0GvyOci+77aiC+NGWqsBl+mws4Tne7BBs60hbjmrJYTo9h8TEwgQ9VJt9Vl1n4x4OW/WRT2KFmf62wPB9xsfyfqG1jU1/xjC/C93OvtqhIYMdLGeZko0KdvjfCTSTSKu+3AtSfl7Tr+Z6kM9b1JdfgeID/bigttCVEJwU37weR+yFaHGThMxDFAIHFmlW7jtgjBz/sZPf1Eky06H7V6ANfdxnhk0kzBbjomfNnhCpL8ZMhwerJY401a4EeQeJ8pD+Tj0No5Tijkv7OlYJkIzrOhobU7LTOt/DCdEfMk3tCem9N3atd+ZR/oHVB966WNcC0wlAxE2jVICCDj/ByyKF5Ary/RJEmtfAfM2jDEzIAyKurGGIFzYSifj4LlPd3y/RuBej95vhOAuOLiM0zty0fgfaeyfML3A9FVjBq5U1vgqQTmLZHMOSdvyImcqeJY3JaWsTtcCteGGrj2VugcnTgA0K++GUz5nqfyii//Z/vKiVC2TOb3uBYsbP+ukhV9xIENv/oM7HFF4i1bdswVU4Cz/DYHsYDoQhmeb2TA0YURsMW5pKxFTczCzNva06anoaeTIvn2nnebnMaPuSDxnSESqEsdmrm5SZF5qHw1OFTtuQAuBEiIx5Z0frPsj43q3xNq1dukD7dmpaeXbk2ntHll2n+7coegLLwmIHEJd2Uy0oo1cVbOG3IXa2gkmxWi5kRu/fSo8m1gNzlhLuuf2whUeMY+uwhFt4i134Vf85NOQouQNUWuTtXD17uEB/P7dV2zRb3faFmmkFmjUs2dpY6UkzTgx4v2IRpUeUq6tlwnW51e2JGHUtivP4Rv9Va0kuNAMTz/RzA2esBJZuTWvE8VdSMDwZ9NcbO70Vi7TTQYjhslhCi21T2QG3/gOs7I6C79Pq4oO7ia3QMWR0d5HP+Ppr0Rg4Vvdgg4uTFAaaZ7Q1gv2skWIC9n2dpaMHwYr8rK/B2WxzfXCfa9fa4jBge7z+NMnnf6pbnB228xxPRNWYIWszzpCTTVG+/eGrgFg/UQcM5ERwoLG9db+Y1ejwPuKjDqEfMViGUixht+R18e8GEJ02rx6j9to/h3vvLRG1ZyyyPcemHxlNq7Lk3+t2WfSogrdo36veSfyGTOZ0PGA3XBvIPxLrhNAqi7UjPdm7tXuQSgMB0oNimPqz71ej71Vc571q5nujJBR81Yr0dSvHSqQoUAdIWdKCRZLTVNIjCeCW/kKVuU7h3dWh/Yj/45cB/3D1zUIfAPqXa/SdaEXafeOEMFh8S3L4k9JiIqsaaj1+lgjVVthVHciAYd+2QorvCJ/QMZ5xa4twQA9mNqYsHJZwt1IhoQ7MX/3ZYeLvqgFI/9kfT03Ck0OBs5e2Nn1R9urhE1h52lGY+Cl0icD+9H7XnvaYMkfAcc/61PIPsDP+it1/1LM4tE3qRIVXVAZ1nXKwTRoHZib73QZDQiwrH8qQNYyVa3YBR+9I1Kb7lirCvuyILvGNQ3pfmpAOzd7Ge09Pp/jrkwK1lS7c+fcFBvTlhW8VszsExFlPFnyAXp9wAxj9wERPg8dZMF1Y629P8vFiWyDJ/AISqa4phd1h/oGaOOPhLyN7iJUNuWR3MBUhs+FszOhV2xQoEu4QcbEI9nQwvU7frSz7GPc70uxxZ4KQXLx75ZRVZEjZz3iuvWYq1Jw9xuWuUpaCPK5h9yaP+q/pRbz9c9ra3MNZRZS1pXAw/dLn6ILjqQPvcT8a/+79xVTW3evLta65IdNT+qiivod57AHSDhj9vqqSyjHHOkTEJHiVYdIsmSfaFncvqppo2MH3uW2/+DXN7g8C/+j5cN5bZ53zeVkO1OxZQfNUGHzukrs6ufnNfbz6ykBPc9olnqLNlpWOiHOoDhoBX4DN5y8JzENta5951vK4DEC5zRJaCMwZVeDQ3paW5/xLJPQdMttQZvpYceSKGyZPXHmiLGi6GAH3Uxgnk4f8LjC5anB5VSlN7r6/ERmtmhhfMdFZ55dqeBYA1Uaix+8Y4B2MFiXmPGzmWEBWZvBCNu6lPn6elidRQtdueUtP0zEU5DSmiW+W7TpD38ntCxXrkP/8tp/8kRzjDNJeTH/Ioetd4YJdnXiE/Pabg8lP9kU/5LUruua7vB6yKUHjTvTskQl1xcsOAMBX5OX6PHXxEs0OrIma3D1H3mjH2uTcp4zRGubdTYxEgh3OscLnJ4YflujYSuyhuQc/GXOmyc2UZCgeeaRLDxIKxR5FP03xVO54XyNd261M1Xy+FPzkIC5KMmhtFAiaoF9ft3JfVmxwnAuZabHlr97x5TPdsxcgkecnZUbJm/NE8NfvKhhXJLHCcfecEs7peKW6KH0SUm1i3osu4kCF7UbeuHdxVaU5q2UlDGDhBvAAH3avucU36H/Uy6VtStjArME9Ur1TUR6B4dr0rfqZe/asSsLmlbYXN8EsF46XoRLOfUZJLEu/3Sr0Qnb67znRtr2lwjHtt8Y4KYVkjYrdgU1S8zCN/+TxIbyUY2dYhL1A3ryRBCiHfR1+vbw5xb3LawDUS+cSzT0MEw9OdFjN9r2gYafkM6kQk9t+r7F+n+PFclAwY1MPdfaEAKds0BNo0ngw4a0sYmOwLmsaTqpgo5Mrmn/cLKA0m59EO0ofJOgzNPCVAtal5axmVtN7vsz0Yn39T/TZKBLPrVY6SOGRrPOEwv212R7QdHkdRYKF1vOUykDcaUmmBy+Y7gSb+hLRjeHpYk1vis5bQUNDbVijHjxp80H9QwNOSy6T7I+WMSpad8TUpPlVw8NpBTyRPO+Tmw+NlI2z3zrhPJbKqAZ1ortG1YadUCnrL1N0kZ34s2wqY8iO9GaKsMwwGlCGhmFSlTB5Jm3/vGHDtkOEKchtoiKHVDPtOlQC0LsHmzTRvEjxEeJUAbANCXxatqJfVWXUNOtMfzyyc3Qf26fuvo8BHf97Ql2plGS4o9AVipEIx+z6CC3dRQKUWu6ZGFd5qpuYOevHVT4GHtcV3xbf5CJv8p7RhiZ1yY0SHefqUVUwxE4jrklIiHRyg52tfMKu1NX0Fs7YTcX75QtWLxrEqibPiMjHCTisfjLm8joMJRpxfFhuMe8XVJAxzuMJVIsZ4R5EOQCB9jYAEAzKtmHE9cUjylbM1uRSxSyVUibEBM7hyjDTgXW6PbfVkR33XfwtWFbUWQo+b97Ly/gEi/aXjNA/08sveXvp3EIzCNxUExMPtIoAMsVred7anF9IAMJc+yHipuAwKLp1G3WABc3Ue40R5/LBCO8EP/K/2WTCiFLEVeH+BIeiRosDxdaEr8dQB9JYFSQfgIJJ3FUAyKKHESJtr+xbkKXFGedYbqUV8+RIaHmOAB15hSs0wAA', sizes:'192x192', type:'image/webp', purpose:'any'},
        {src:'data:image/webp;base64,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', sizes:'512x512', type:'image/webp', purpose:'any'},
        {src:'data:image/webp;base64,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', sizes:'512x512', type:'image/webp', purpose:'maskable'}
      ]
    };
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifest));
    document.head.appendChild(link);
  }catch(e){}
}
async function setupSW(){
  // PWA completo: ao migrar para Vite + Capacitor, adicione um "sw.js" na raiz.
  try{
    if('serviceWorker' in navigator && location.protocol.startsWith('http')){
      const r = await fetch('sw.js', {method:'HEAD'});
      if(r.ok) navigator.serviceWorker.register('sw.js').catch(()=>{});
    }
  }catch(e){}
}

/* ---------------- Dados de demonstração (?seed=1) ---------------- */
async function seedDemo(){
  const ruas = ['Rua Dario Bocchino','Rua Raul Cardoso','Avenida Jundiaí','Rua Santa Cruz'];
  const nomes = ['PETER PARK','CATTLEYA SOPHIA LIMA OLIVEIRA','GABRIELLE SIGNATO DE ALBUQUERQUE','KAWAY GOMES SANTOS DA SILVA COSTA','MARIA APARECIDA DOS SANTOS','JOAO PEDRO HENRIQUE SOUZA','ANTONIA FERREIRA LIMA','CARLOS EDUARDO TOLEDO','BEATRIZ ALVES MORAES','LUCIANA PRADO BARBOSA','ROBERTO CARLOS DINIZ','FERNANDA COSTA E SILVA'];
  const rs = [];
  for(let i = 0; i < nomes.length; i++){
    const nasc = (1960 + (i*7)%45) + '-0' + (1 + (i%9)) + '-1' + (i%9);
    const cond = { cardiaca:false, respiratoria:false, domiciliado:false, acamado:i===4, gestante:i===10, etilista:false, drogas:false, tabaco:i===3, has:i%3===0, dm:i%4===0, cancer:false, hanseniase:false, tuberculose:false };
    const filtros = [];
    for(const k in COND_FILTRO) if(cond[k]) filtros.push({nome:COND_FILTRO[k], origem:'importado', desde:todayISO()});
    if(i === 2) filtros.push({nome:'Bolsa Família', origem:'aplicado', desde:todayISO(), validade:addMeses(todayISO(),1)});
    rs.push({
      nome:nomes[i], nascimento:i===11 ? addMeses(todayISO(),-1) : nasc,
      mae: 'MAE DE ' + nomes[i].split(' ')[0], pai:'', cpf:'1234567890'+i, cns:'70500'+String(1000000+i*137),
      cadastro:'9876543210'+i, sexo: i%2 ? 'F' : 'M', raca:'', etnia:'', pais:'BRASIL',
      endereco: ruas[i % ruas.length], numero: String(100 + i*37),
      telRes:'', telCel: '1197' + String(10000000 + i*111111).slice(0,8), telRec:'',
      cond, filtros, visitas: i < 3 ? [{data: addMeses(todayISO(), -7), status:'realizada'}] : [], obs:''
    });
  }
  await idbClr('residents');
  await idbBulkPut('residents', rs);
  const defs = FILTROS_INICIAIS.map(n => ({nome:n, periodicidade: n === 'HAS' ? 6 : (n === 'PUERICULTURA' ? 2 : null)}));
  await idbClr('filterDefs');
  await idbBulkPut('filterDefs', defs);
  S.importado = true; S.areaDefinida = false;
  await salvarEstado();
}
window.ACS = { seed: seedDemo, limpar: async () => { await idbClrAll(); location.reload(); } };

/* ---------------- Inicialização ---------------- */
(async function boot(){
  try{
    await idb();
    await carregarEstado();
    applyTheme();
    try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){}
    buildManifest();
    setupSW();
    resetStack('nome', {}, true);
    iniciarRelogio();
    if(new URLSearchParams(location.search).has('seed')){
      await seedDemo();
      banner('Dados de demonstração carregados (?seed=1)');
      await irPosDesbloqueio();
      return;
    }
    if(isPrimeiroDiaTrimestre() && S.usadaTri !== trimestreStr()){
      setTimeout(() => banner(
        senhaObrigatoria() ? 'A senha deste trimestre expirou. Informe a nova senha de ativação.'
                           : 'Novo trimestre iniciado ('+trimestreStr()+'). A senha sazonal foi redefinida.'), 700);
    }
  }catch(e){
    document.body.innerHTML = '<div style="padding:2rem;font-family:sans-serif;color:#900">Erro ao iniciar o ACS Digital: ' + esc(e && e.message) + '</div>';
  }
})();
