(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const WEEK = ["周日","周一","周二","周三","周四","周五","周六"];
  const BASE = [
    {name:"基础概念",en:"FOUNDATIONS",color:"#5279ed",tint:"#eaf0ff",deep:"#3053a3",short:"研究方法 · 受力 · 性质",diagram:"basic"},
    {name:"流体黏性",en:"VISCOSITY",color:"#f07762",tint:"#fff0e8",deep:"#a44e40",short:"黏度 · 内摩擦",diagram:"viscous"},
    {name:"流体静力学",en:"HYDROSTATICS",color:"#2fad9c",tint:"#e1f7f1",deep:"#126b63",short:"静压强 · 真空度",diagram:"pressure"},
    {name:"流体运动的描述",en:"KINEMATICS",color:"#8b77ee",tint:"#f0edff",deep:"#5e4cad",short:"欧拉法 · 加速度",diagram:"motion"},
    {name:"欧拉法基本概念",en:"EULERIAN FLOW",color:"#d6a340",tint:"#fff4df",deep:"#86641f",short:"流线 · 迹线 · 恒定流",diagram:"streamline"},
    {name:"连续性方程",en:"CONTINUITY",color:"#229eca",tint:"#e2f5ff",deep:"#1e6b8b",short:"质量守恒 · 管流",diagram:"continuity"}
  ];
  const state = {notes:[],chapters:BASE,selected:"连续性方程",query:"",fast:false,loaded:false};
  const palette = name => state.chapters.find(c=>c.name===name) || {name,color:"#587eab",tint:"#eaf1f9",deep:"#345a83",short:"课堂内容",diagram:"basic"};

  function element(tag,cls,text) {
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(text!==undefined)n.textContent=text;
    return n;
  }
  function dateText(s) {
    const d=new Date(String(s)+"T12:00:00");
    return Number.isNaN(d.getTime()) ? String(s||"") : (d.getMonth()+1)+"月"+d.getDate()+"日 "+WEEK[d.getDay()];
  }
  function safeStore(key,val) { try{localStorage.setItem(key,val)}catch(e){} }
  function safeRead(key) { try{return localStorage.getItem(key)}catch(e){return null} }
  function normalize(s) {
    return String(s||"").toLowerCase().replace(/粘/g,"黏").replace(/[？?！!。、·\s\-()（）:：，,\/]/g,"");
  }
  function highlight(target,text,query) {
    const value=String(text||"");
    if(!query){target.textContent=value;return}
    const i=value.toLowerCase().indexOf(query.toLowerCase());
    if(i<0){target.textContent=value;return}
    target.append(document.createTextNode(value.slice(0,i)));
    target.append(element("mark",null,value.slice(i,i+query.length)));
    target.append(document.createTextNode(value.slice(i+query.length)));
  }
  function chapterOrder() {
    const fromData=[...new Set(state.notes.map(n=>n.chapter))];
    state.chapters=[...BASE,...fromData.filter(n=>!BASE.some(c=>c.name===n)).map((name,i)=>({name,en:"CLASS NOTES",color:["#5279ed","#2fad9c","#8b77ee"][i%3],tint:["#eaf0ff","#e1f7f1","#f0edff"][i%3],deep:"#345a83",short:"新增课堂章节",diagram:"basic"}))];
  }
  function miniArt(which,color) {
    const common='stroke="'+color+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"';
    const drawings={
      basic:'<path d="M18 82V25M18 82H138" '+common+'/><path d="M15 31l3-7 3 7M130 79l8 3-8 3" '+common+'/><circle cx="65" cy="53" r="20" fill="'+color+'" opacity=".12"/><path d="M65 72V37M65 53h42M65 53l-11-9" '+common+'/>',
      viscous:'<path d="M8 18H149M8 83H149" '+common+'/><path d="M22 75h20M22 63h36M22 51h51M22 39h68M22 27h93" '+common+'/><path d="M38 72l5 3-5 3M53 60l5 3-5 3M67 48l6 3-6 3M84 36l6 3-6 3M109 24l6 3-6 3" '+common+'/><path d="M22 80L128 24" stroke="'+color+'" opacity=".25" stroke-dasharray="4 5" fill="none"/>',
      pressure:'<path d="M25 16V86H133V16" '+common+'/><path d="M26 35Q42 32 59 35T95 35T132 35" '+common+'/><path d="M27 38h104v46H27Z" fill="'+color+'" opacity=".13"/><path d="M137 42h7M137 55h12M137 68h18M137 81h21" '+common+'/>',
      motion:'<path d="M15 78Q39 9 83 34T153 17" '+common+'/><circle cx="75" cy="31" r="7" fill="'+color+'" opacity=".52"/><path d="M75 31l34-11M75 31l-7 30" '+common+'/><path d="M100 19l9 1-6 7M65 52l3 9 7-8" '+common+'/>',
      streamline:'<path d="M9 26C39 10 53 53 88 34S133 20 152 30M8 49C43 31 55 76 90 59S130 44 154 54M9 74C43 56 65 91 95 78S140 69 154 79" '+common+'/><path d="M141 27l11 3-9 5M142 51l12 3-9 6M142 76l12 3-9 5" '+common+'/>',
      continuity:'<path d="M4 12H41C72 12 80 37 111 37H158M4 89H41C72 89 80 64 111 64H158" '+common+'/><path d="M5 40H40M5 61H40M86 47H153M86 55H153" '+common+'/><path d="M31 37l9 3-9 3M31 58l9 3-9 3M142 44l11 3-11 3M142 52l11 3-11 3" '+common+'/>'
    };
    return '<svg viewBox="0 0 160 100" aria-hidden="true" role="img">'+(drawings[which]||drawings.basic)+'</svg>';
  }
  function diagramArt(name) {
    const which=palette(name).diagram;
    const svgHead='<svg viewBox="0 0 330 190" role="img" aria-label="流体力学工程示意图" xmlns="http://www.w3.org/2000/svg">';
    const svgFoot='</svg>';
    const parts={
      continuity:'<defs><linearGradient id="water" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#8cc8ee" stop-opacity=".3"/><stop offset="1" stop-color="#61b7e1" stop-opacity=".68"/></linearGradient></defs><path d="M18 28H92C128 28 151 71 196 71H313V118H196C151 118 128 162 92 162H18Z" fill="url(#water)"/><path d="M18 28H92C128 28 151 71 196 71H313M18 162H92C128 162 151 118 196 118H313" fill="none" stroke="#3e81b6" stroke-width="4" stroke-linecap="round"/><path d="M32 95H110M144 95H295" stroke="#168bbb" stroke-width="4" stroke-linecap="round"/><path d="M103 87l12 8-12 8M283 87l12 8-12 8" fill="none" stroke="#168bbb" stroke-width="4"/><path d="M64 39V152M254 76V112" stroke="#5d78ae" stroke-dasharray="5 5" stroke-width="2"/><text x="49" y="19" fill="#2c6497" font-size="12" font-weight="bold">A₁</text><text x="241" y="61" fill="#2c6497" font-size="12" font-weight="bold">A₂</text><text x="38" y="86" fill="#2c6497" font-size="13" font-weight="bold">v₁</text><text x="242" y="86" fill="#2c6497" font-size="13" font-weight="bold">v₂</text><text x="93" y="183" fill="#537998" font-size="11">不可压缩：A₁v₁ = A₂v₂</text>',
      viscous:'<rect x="28" y="24" width="272" height="12" rx="3" fill="#e29574"/><rect x="28" y="150" width="272" height="12" rx="3" fill="#527ea0"/><path d="M30 147L259 39" stroke="#edae8c" stroke-width="3" stroke-dasharray="6 6"/><path d="M50 130h33m-33-20h65m-65-20h94m-94-20h133m-133-20h174" stroke="#ed8c6e" stroke-width="3" stroke-linecap="round"/><path d="M75 125l9 5-9 5M106 105l9 5-9 5M135 85l9 5-9 5M174 65l9 5-9 5M215 45l9 5-9 5" fill="none" stroke="#ed8c6e" stroke-width="3"/><text x="28" y="17" fill="#a65b47" font-size="12">运动平板</text><text x="29" y="183" fill="#53768e" font-size="12">固定平板</text><text x="240" y="92" fill="#a65b47" font-size="14" font-weight="bold">du/dy</text>',
      pressure:'<path d="M61 20V164H197V20" fill="none" stroke="#519d9a" stroke-width="4" stroke-linecap="round"/><path d="M62 64Q84 60 105 64T150 64T196 64" stroke="#359eab" stroke-width="3" fill="none"/><rect x="64" y="67" width="132" height="95" fill="#72d1c3" opacity=".25"/><path d="M204 77h26m-26 25h49m-49 25h74m-74 25h100" stroke="#2f9d91" stroke-width="3" stroke-linecap="round"/><path d="M221 73l9 4-9 4M244 98l9 4-9 4M269 123l9 4-9 4M295 148l9 4-9 4" fill="none" stroke="#2f9d91" stroke-width="2"/><path d="M43 64v95m-5-89 5-7 5 7m-10 81 5 9 5-9" stroke="#5b8f98" stroke-width="1.7" fill="none"/><text x="27" y="114" fill="#3a7c7e" font-size="13">h</text><text x="122" y="57" fill="#2f827f" font-size="11">自由液面</text>',
      streamline:'<path d="M12 28C69 8 83 81 150 50S250 21 314 40M12 71C63 49 89 121 156 94S254 63 315 87M12 119C76 98 109 157 169 145S260 123 315 139" fill="none" stroke="#6b65d4" stroke-width="3" stroke-linecap="round"/><path d="M302 35l12 5-11 7M301 82l14 5-11 8M301 134l14 5-11 7" fill="none" stroke="#6b65d4" stroke-width="2.5"/><circle cx="148" cy="50" r="8" fill="#9c96ef"/><path d="M150 50l34-11m-5-4 5 4-3 6" fill="none" stroke="#9a66b8" stroke-width="2.5"/><text x="143" y="28" fill="#7256af" font-size="12">速度切线方向</text><text x="100" y="178" fill="#8f83b0" font-size="12">某一时刻的流线</text>',
      motion:'<path d="M30 140Q78 25 151 97T299 35" stroke="#8b79da" fill="none" stroke-width="3"/><circle cx="150" cy="97" r="9" fill="#9f93e8"/><path d="M150 97L204 78M150 97L134 144" stroke="#7167c5" stroke-width="3" stroke-linecap="round"/><path d="M192 74l12 4-8 8M126 135l8 9 9-8" stroke="#7167c5" fill="none" stroke-width="2"/><text x="206" y="72" fill="#7662c2" font-size="12">速度</text><text x="82" y="171" fill="#8b79b2" font-size="12">质点运动轨迹</text>',
      basic:'<path d="M55 148V28M55 148H293M55 148L20 167" stroke="#6285d6" stroke-width="3" fill="none"/><path d="M47 41l8-13 8 13M280 140l13 8-13 8" fill="none" stroke="#6285d6" stroke-width="2.5"/><rect x="100" y="73" width="71" height="71" rx="6" fill="#bad0ff" opacity=".6" stroke="#6285d6" stroke-width="2"/><path d="M135 110l66-32M135 110l30-49" fill="none" stroke="#4366bf" stroke-width="3"/><text x="299" y="156" fill="#6788c7" font-size="12">x</text><text x="50" y="19" fill="#6788c7" font-size="12">y</text>'
    };
    return svgHead+(parts[which]||parts.basic)+svgFoot;
  }
  function buildChapters() {
    const root=$("chapter-grid");
    root.replaceChildren();
    state.chapters.forEach((c,i)=>{
      const count=state.notes.filter(n=>n.chapter===c.name).length;
      if(!count)return;
      const btn=element("button","chapter-card"+(state.selected===c.name?" selected":""));
      btn.type="button";
      btn.style.setProperty("--color",c.color);
      btn.style.setProperty("--tint",c.tint);
      btn.style.setProperty("--deep",c.deep);
      btn.setAttribute("aria-label","打开"+c.name+"，共"+count+"个知识点");
      const head=element("div","chapter-head");
      head.append(element("span","chapter-number",String(i+1).padStart(2,"0")+" / "+c.en),element("span","chapter-count",count+" 条"));
      btn.append(head,element("h3",null,c.name),element("p",null,c.short));
      const art=element("div","chapter-art");art.innerHTML=miniArt(c.diagram,c.color);btn.append(art,element("span","chapter-arrow","↗"));
      btn.onclick=()=>{state.selected=c.name;renderExplorer();buildChapters();go("explore-section");};
      root.append(btn);
    });
    $("total-count").textContent=state.notes.length;
  }
  function getRecent() {
    return state.notes.map((n,i)=>({...n,_order:i}))
      .sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt))||b._order-a._order).slice(0,4);
  }
  function buildRecent(){
    const root=$("recent-list");root.replaceChildren();
    for(const n of getRecent()){
      const btn=element("button","recent-row");btn.type="button";
      const p=palette(n.chapter),dot=element("span","recent-bullet");dot.style.setProperty("--bullet",p.color);
      btn.append(dot,element("span","recent-name",n.title),element("span","recent-date",dateText(n.updatedAt||n.createdAt).split(" ")[0]));
      btn.onclick=()=>openNote(n);
      root.append(btn);
    }
  }
  function appendAnswer(target,n,query){
    const p=element("p","qa-answer");highlight(p,n.answer||String(n.content||"").split("\n")[0],query);
    target.append(p);
  }
  function questionCard(n,query){
    const p=palette(n.chapter),card=element("article","qa-card");
    card.id="note-"+n.id;
    card.style.setProperty("--qtint",p.tint);
    card.style.setProperty("--qcolor",p.deep);
    const top=element("div","question-line");
    top.append(element("span","q-indicator","Q"));
    const title=element("h3");highlight(title,n.title,query);top.append(title);
    card.append(top);
    appendAnswer(card,n,query);
    const foot=element("div","qa-footer");
    foot.append(element("span","qa-meta",n.chapter+" · "+dateText(n.createdAt)));
    const full=n.detail||n.formula||n.content;
    if(full){
      const more=element("button","more");more.type="button";more.setAttribute("aria-expanded","false");
      more.append("公式 / 补充 ");
      more.innerHTML+=' <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
      const extra=element("div","qa-extra");extra.hidden=true;
      if(n.detail) extra.append(element("div","qa-detail",n.detail));
      else if(n.content) extra.append(element("div","qa-detail",n.content));
      if(n.formula)extra.append(element("div","formula",n.formula));
      more.onclick=()=>{extra.hidden=!extra.hidden;more.setAttribute("aria-expanded",String(!extra.hidden));};
      foot.append(more);card.append(foot,extra);
    }else card.append(foot);
    return card;
  }
  function renderExplorer(){
    const root=$("qa-list");root.replaceChildren();
    const filtered=state.selected==="全部"?state.notes:state.notes.filter(n=>n.chapter===state.selected);
    const qname=state.selected==="全部"?"全部知识点":state.selected;
    $("explore-title").textContent=qname;
    $("explore-caption").textContent="共 "+filtered.length+" 条 · 点开可查看公式和补充";
    for(const n of filtered)root.append(questionCard(n,""));
    if(!filtered.length)root.append(element("div","empty","当前章节还没有知识点。"));
    const paletteCurrent=palette(state.selected);
    $("diagram-title").textContent=state.selected==="全部"?"工程原理示意":"专业示意 · "+qname;
    $("diagram-caption").textContent=state.selected==="全部"?"根据章节切换查看对应的示意图。":"本图为简化示意，公式与定义请以对应知识卡片为准。";
    $("diagram-view").innerHTML=diagramArt(state.selected==="全部"?"连续性方程":state.selected);
    buildFilters();
  }
  function buildFilters(){
    const root=$("filter-bar");root.replaceChildren();
    for(const name of ["全部",...state.chapters.map(c=>c.name)]){
      if(name!=="全部"&&!state.notes.some(n=>n.chapter===name))continue;
      const chip=element("button","filter"+(state.selected===name?" active":""),name);
      chip.type="button";chip.onclick=()=>{state.selected=name;renderExplorer();buildChapters();};
      root.append(chip);
    }
  }
  function score(n,term){
    const t=normalize(term),title=normalize(n.title);
    const answer=normalize(n.answer||""),details=normalize((n.detail||"")+" "+(n.content||""));
    const aliases=normalize((n.keywords||[]).join(" "));
    if(title===t)return 100;
    if(title.includes(t))return 80;
    if(answer.includes(t))return 45;
    if(aliases.includes(t))return 38;
    if(normalize(n.chapter).includes(t))return 25;
    if(details.includes(t)||normalize(n.formula||"").includes(t))return 12;
    return 0;
  }
  function renderSearch(){
    const q=state.query.trim(),active=q.length>0;
    $("search-results").hidden=!active;
    $("chapters-section").hidden=active;
    $("recents-section").hidden=active;
    $("explore-section").hidden=active;
    $("clear-search").classList.toggle("visible",active);
    if(!active)return;
    const hits=state.notes.map((n,i)=>({n,i,rank:score(n,q)})).filter(r=>r.rank>0)
      .sort((a,b)=>b.rank-a.rank||a.i-b.i);
    $("result-summary").textContent="找到 "+hits.length+" 条相关知识点";
    const root=$("result-list");root.replaceChildren();
    for(const item of hits)root.append(questionCard(item.n,q));
    if(!hits.length){
      const empty=element("div","empty");
      empty.append(element("b",null,"没有找到这个知识点"),element("span",null,"换个关键词试试，例如：黏度、流线、质量守恒。"));
      root.append(empty);
    }
    $("search-hint").textContent=hits.length?"答案已按相关程度排列":"支持近义词：粘度 = 黏度";
  }
  function go(id){document.getElementById(id)?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});}
  function openNote(n){
    state.query="";$("search-input").value="";renderSearch();
    state.selected=n.chapter;renderExplorer();buildChapters();
    requestAnimationFrame(()=>{go("note-"+n.id);const target=$("note-"+n.id);if(target){target.classList.add("flash");setTimeout(()=>target.classList.remove("flash"),1600)}});
  }
  function setFast(next){
    state.fast=!!next;document.body.classList.toggle("fast",state.fast);
    const btn=$("fast-toggle");btn.setAttribute("aria-pressed",String(state.fast));btn.textContent=state.fast?"退出速答":"⚡ 课堂速答";
    if(state.fast&&!state.query){state.selected="连续性方程";renderExplorer();}
    safeStore("fm-fast-v3",state.fast?"1":"0");
    $("fast-status").textContent=state.fast?"速答模式已开启 · 精简图文，优先显示答案":"输入关键词，直接定位答案";
    if(state.fast){go("search-zone");$("search-input").focus({preventScroll:true})}
  }
  function setStatus(message){$("sync-status").textContent=message;$("status-text").textContent=message;}
  function ready(data,cached=false){
    if(!data||!Array.isArray(data.notes))throw Error("笔记文件格式异常");
    const ids=new Set();
    state.notes=data.notes.filter(n=>{
      if(!n||typeof n.id!=="string"||typeof n.title!=="string"||typeof n.chapter!=="string"||!n.createdAt||ids.has(n.id))return false;
      ids.add(n.id);return true;
    });
    chapterOrder();state.loaded=true;
    $("hero-total").textContent=state.notes.length+" 条知识点";
    buildChapters();buildRecent();renderExplorer();renderSearch();
    setStatus(cached?"已加载离线备份 · 可稍后刷新":"已同步 "+state.notes.length+" 条 · "+new Date().toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"}));
  }
  async function load(){
    $("refresh-button").disabled=true;setStatus("正在同步笔记…");
    try{
      const res=await fetch("./notes.json?v="+Date.now(),{cache:"no-store"});
      if(!res.ok)throw Error("HTTP "+res.status);
      const data=await res.json();ready(data,false);safeStore("fm-cache-v3",JSON.stringify(data));
    }catch(e){
      const raw=safeRead("fm-cache-v3");
      if(raw){try{ready(JSON.parse(raw),true)}catch(err){setStatus("同步失败，请检查网络")}}
      else setStatus("加载失败 · "+e.message);
    }finally{$("refresh-button").disabled=false;}
  }
  function bind(){
    const input=$("search-input");
    input.addEventListener("input",()=>{state.query=input.value;renderSearch();if(state.query)go("search-zone")});
    input.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();const first=$("result-list").querySelector(".qa-card");first?.scrollIntoView({behavior:"smooth",block:"start"});}if(e.key==="Escape"){input.value="";state.query="";renderSearch();input.blur();}});
    $("clear-search").onclick=()=>{input.value="";state.query="";renderSearch();input.focus();};
    $("fast-toggle").onclick=()=>setFast(!state.fast);
    $("refresh-button").onclick=load;
    $("recent-more").onclick=()=>{state.selected="全部";renderExplorer();buildChapters();go("explore-section")};
    $("featured-open").onclick=()=>{const n=state.notes.find(x=>x.chapter==="连续性方程"&&x.title.includes("意思"));if(n)openNote(n);};
    document.querySelectorAll("[data-nav]").forEach(btn=>btn.addEventListener("click",()=>{
      const route=btn.dataset.nav;
      if(route==="search"){$("search-input").focus();go("search-zone");}
      else if(route==="catalog"){state.query="";input.value="";renderSearch();go("chapters-section");}
      else if(route==="recent"){state.query="";input.value="";renderSearch();go("recents-section");}
      else{state.query="";input.value="";renderSearch();go("explore-section");}
      document.querySelectorAll("[data-nav]").forEach(b=>b.classList.toggle("active",b===btn));
    }));
    $("search-zone").addEventListener("focusin",()=>{$("search-zone").classList.add("stuck")});
    window.addEventListener("scroll",()=>{$("search-zone").classList.toggle("stuck",window.scrollY>240)},{passive:true});
  }
  bind();setFast(safeRead("fm-fast-v3")==="1");load();
})();
