/* UI + scene coordination. Business state is kept in Store, not in render code. */
'use strict';
(() => {
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],M=Twin.math;
const state={mode:'overview',floor:2,selected:null,panel:'overview',markers:true,night:false,auto:false,presentation:false,cameraPreset:null,quality:'detail',filter:'all',tick:0};
let renderer,model,store,firstFrame=true,last=0,frameCount=0,frameTime=0,fps=0,toastTimer;
const canvas=$('#scene'),panel=$('#panel');
const cam={yaw:.72,pitch:.56,span:40,target:[0,8.9,0],goal:{yaw:.72,pitch:.56,span:40,target:[0,8.9,0]},eye:[0,0,0],vp:M.identity()};
let split=0,nightMix=0,splitGoal=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const floorLabel=i=>`${Twin.floors[i].number}F ${Twin.floors[i].name}`;
const alertText=d=>d.type==='smoke'?'烟雾浓度超限':'回风温度偏高';

function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3200)}
function statusWord(d){return d.online?(d.status==='alert'?'告警':'正常'):'离线'}
function statusClass(d){return d.online?(d.status==='alert'?'st-alarm':'st-normal'):'st-offline'}

function refreshStats(){
 const s=store.stats();
 $('#r-online').textContent=`${s.online}/${s.total}`;
 $('#r-alarms').textContent=s.alarms;$('#stat-alarms').classList.toggle('is-alarm',s.alarms>0);
 $('#r-orders').textContent=s.orders;
 $$('.floor-row').forEach(el=>{const i=Number(el.dataset.floor),n=store.devices.filter(d=>d.floor===i&&d.status==='alert').length;el.querySelector('em').textContent=n?`告警 ${n}`:''});
}
function chart(values,{height=60,alarm=false}={}){
 const w=240,h=height,min=Math.min(...values)*.75,max=Math.max(...values)*1.12,pts=values.map((v,i)=>[i/(values.length-1)*w,h-(v-min)/(max-min||1)*(h-6)]);
 let line=`M${pts[0].join(',')}`;for(let i=1;i<pts.length;i++){const prev=pts[i-1],p=pts[i],mid=(prev[0]+p[0])/2;line+=` C${mid},${prev[1]} ${mid},${p[1]} ${p[0]},${p[1]}`}
 const color=alarm?'var(--alarm)':'var(--accent)';
 return `<svg viewBox="0 0 240 ${h+2}" preserveAspectRatio="none" aria-label="模拟趋势"><path d="M0 ${h}H240" style="stroke:var(--rule)" stroke-width="1"/><path d="${line}L240,${h}L0,${h}Z" style="fill:${color}" opacity=".10"/><path d="${line}" style="stroke:${color}" fill="none" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`;
}
function head(title,sub,back=false){return `<div class="panel-head"><div><h2>${title}</h2><p>${sub}</p></div>${back?'<button class="back" data-action="back">返回</button>':''}</div>`}
function alarmBox(d){return `<div class="alarm-box"><header><span>告警 · ${d.floor+1}F</span><span class="num">${d.alertAt||'--:--:--'}</span></header><h4>${d.name}${alertText(d)}</h4><p class="id">${d.id}</p><button class="btn" data-device="${d.id}">定位到设备</button></div>`}
function footnote(){return `<div class="footnote"><span>模拟数据 · ${store.storageAvailable?'操作记录保存在本机':'本次会话有效'}</span><button class="link" data-action="reset-demo">复位演示</button></div>`}
function simulateButton(){return '<button class="btn" data-action="simulate" style="margin-top:14px">模拟一次烟感告警</button>'}

function overviewPanel(){
 const alerts=store.devices.filter(d=>d.status==='alert'),s=store.stats();
 const systems=Object.entries(Twin.types).map(([type,t])=>{const ds=store.devices.filter(d=>d.type===type),on=ds.filter(d=>d.online).length,al=ds.filter(d=>d.status==='alert').length;return `<dt>${t.system}</dt><dd class="${al?'warn':on<ds.length?'dim':''}">${al?`告警 ${al} · `:''}${on}/${ds.length}</dd>`}).join('');
 return head('运行概况',`${s.online}/${s.total} 个点位在线 · ${s.alarms} 项告警`)
  +alerts.map(alarmBox).join('')
  +`<div class="section"><h3>子系统<small>在线 / 点位</small></h3><dl class="kv">${systems}</dl></div>`
  +`<div class="section"><h3>今日用电<small>0–24 时</small></h3><div class="big"><b>1,248.6</b><small>kWh</small></div><div class="chart">${chart(Twin.energyHours)}</div><div class="chart-axis"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div><div class="split-bar"><i style="width:46%"></i><i style="width:24%"></i><i style="flex:1"></i></div><div class="split-legend"><span>空调 46%</span><span>照明 24%</span><span>动力及其他 30%</span></div></div>`
  +simulateButton()+footnote();
}
function deviceRow(d){const t=Twin.types[d.type],v=d.online?(d.status==='alert'?'告警':`${store.unitValue(d,state.tick)}<small>${t.unit}</small>`):'离线';
 return `<button class="device-row ${d.status==='alert'?'is-alarm':''} ${!d.online?'is-offline':''}" data-device="${d.id}"><code>${t.code}</code><span><b>${d.name}</b><small>${state.panel==='floor'?d.area:`${d.floor+1}F · ${d.area}`}</small></span><span class="val">${v}</span></button>`}
function floorPanel(){const f=Twin.floors[state.floor],ds=store.devices.filter(d=>d.floor===state.floor);
 return head(`${f.number}F ${f.name}`,`${f.area} m² · 室温 ${f.temperature} °C · ${ds.length} 个点位`,true)
  +`<div class="section"><h3>本层设备<small>点击定位</small></h3><div class="device-list">${ds.map(deviceRow).join('')}</div></div>`+simulateButton()+footnote()}
function devicePanel(){const d=store.get(state.selected);if(!d){state.panel='overview';return overviewPanel()}
 const t=Twin.types[d.type],order=store.orders.find(o=>o.deviceId===d.id&&o.status==='processing');
 const trend=Array.from({length:20},(_,i)=>d.status==='alert'?(d.type==='hvac'?25.5+i*.29+Math.sin(i*.8)*.32:.12+i*.13+Math.sin(i*.5)*.05):d.base+Math.sin(i*.4)*.3);
 const extra=d.type==='hvac'?[['功率','5.8 kW'],['设定温度','24.0 °C']]:d.type==='smoke'?[['报警阈值','1.50 %/m'],['灵敏度','标准']]:d.type==='camera'?[['码流','1080p H.265'],['延时','38 ms']]:d.type==='sensor'?[['湿度','48.2 %'],['CO₂','612 ppm']]:d.type==='meter'?[['电压','220.6 V'],['功率因数','0.96']]:[['控制模式','自动'],['门状态','关闭']];
 return head(d.name,`${floorLabel(d.floor)} · ${d.area}`,true)
  +`<div class="status-line"><i class="${statusClass(d)}"></i>${statusWord(d)}<span class="dim">· ${order?'工单处理中':'模拟遥测'}</span></div><p class="asset-id">${d.id}</p>`
  +`<div class="section"><h3>${t.metric}</h3><div class="big reading ${d.status==='alert'?'alarm':''}"><b id="device-reading">${store.unitValue(d,state.tick)}</b><small>${t.unit}</small></div>`
  +`<div class="chart">${d.online?chart(trend,{alarm:d.status==='alert'}):chart(Array(20).fill(0))}</div><div class="chart-axis"><span>${d.online?'近 20 次采样（模拟）':'离线，无有效数据'}</span><span>当前</span></div>`
  +`<dl class="kv" style="margin-top:12px">${d.online?extra.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join(''):'<dt>遥测</dt><dd class="dim">等待重连</dd>'}</dl></div>`
  +(d.status==='alert'?`<p class="note alarm">${d.alert}，${d.type==='hvac'?'已超过 30.0 °C 阈值':'已超过 1.50 %/m 阈值'}。</p>`:'')
  +(order?`<div class="order-state"><code>${order.id}</code><span>已受理，检修中</span></div><button class="btn primary" data-complete="${order.id}">完成检修并复位</button>`:`<button class="btn primary" data-order="${d.id}">${d.status==='alert'?'创建检修工单':'创建巡检工单'}</button>`)
  +`<div class="btn-row"><button class="btn" data-focus="${d.id}">镜头对准</button><button class="btn" data-action="floor-panel">本层设备</button></div>`+footnote();
}
function devicesPanel(){const ds=store.devices.filter(d=>state.filter==='all'||(state.filter==='alert'?d.status==='alert':state.filter==='offline'?!d.online:d.type===state.filter));
 return head(state.filter==='alert'?'活动告警':'设备目录',`A 座 · ${store.devices.length} 个点位`,true)
  +`<div class="filters">${[['all','全部'],['alert','告警'],['offline','离线'],['hvac','空调'],['smoke','烟感']].map(([v,l])=>`<button data-filter="${v}" class="${v===state.filter?'active':''}">${l}</button>`).join('')}</div>`
  +`<div class="device-list">${ds.length?ds.map(deviceRow).join(''):'<p class="empty">这个筛选下没有设备。</p>'}</div>`+footnote()}
function ordersPanel(){const open=store.orders.filter(o=>o.status==='processing').length;
 return head('运维工单',`${open} 单处理中 · 共 ${store.orders.length} 单`,true)
  +`<div class="section">${store.orders.length?store.orders.map(o=>{const d=store.get(o.deviceId);return `<div class="order-card"><header><code>${o.id}</code><span class="${o.status==='closed'?'':'open'}">${o.status==='closed'?'已完成':'处理中'}</span></header><p>${floorLabel(d.floor)} · ${d.name}</p><button class="btn" data-device="${d.id}">查看设备</button></div>`}).join(''):'<p class="empty">还没有工单。选中一台设备即可创建检修或巡检工单。</p>'}</div>`+footnote()}
function renderPanel(){panel.dataset.panel=state.panel;panel.innerHTML=({overview:overviewPanel,floor:floorPanel,device:devicePanel,devices:devicesPanel,orders:ordersPanel}[state.panel]||overviewPanel)();refreshStats()}

function sceneButtons(){
 $$('[data-mode]').forEach(b=>{const on=b.dataset.mode===state.mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on))});
 $$('.floor-row').forEach(b=>{const on=state.mode==='floor'&&Number(b.dataset.floor)===state.floor;b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on))});
 const f=Twin.floors[state.floor];
 $('#view-title').innerHTML=state.mode==='floor'?`${f.number}F ${f.name}<small>剖切平面 · ${f.area} m²</small>`:'';
}
function targetCamera(focus=null){const narrow=innerWidth<=900,presentation=state.presentation;let goal;
 if(state.mode==='overview')goal={yaw:.72,pitch:.58,span:narrow?56:46,target:[0,9.4,0]};
 else if(state.mode==='explode')goal={yaw:.73,pitch:.35,span:narrow?66:54,target:[0,20.3,0]};
 else goal={yaw:.60,pitch:.87,span:narrow?30:24.5,target:[.6,.75,.6]};
 if(focus&&state.mode==='floor'){goal.span=narrow?22:16.5;goal.target=[focus.position[0]*.45,.9,focus.position[2]*.45]}
 if(presentation){goal.span=state.mode==='overview'?(narrow?57:40):state.mode==='explode'?(narrow?65:52):(narrow?35:21);if(state.mode==='overview')goal.target=[0,10,0]}
 if(!focus&&state.cameraPreset){
  const id=state.cameraPreset;
  if(state.mode==='overview'){
   if(id==='front')goal={yaw:.015,pitch:.17,span:narrow?43:32,target:[0,12,0]};
   if(id==='back')goal={yaw:3.87,pitch:.54,span:narrow?45:41,target:[0,9.4,0]};
   if(id==='roof')goal={yaw:.69,pitch:.78,span:narrow?29:22,target:[0,23.1,0]};
  }else if(state.mode==='floor'){
   if(id==='top')goal={yaw:0,pitch:1.565,span:narrow?31:18,target:[0,.50,0]};
   if(id==='reverse')goal={yaw:3.92,pitch:.86,span:narrow?35:21,target:[0,.90,0]};
   if(id==='detail'){
    const spaces=[{target:[4.6,1.1,1.5],yaw:.62},{target:[4.1,1.15,.3],yaw:.60},{target:[4.0,1.15,-2.1],yaw:.60},{target:[4.3,1.15,.8],yaw:.55},{target:[3.8,1.25,-1.1],yaw:.52},{target:[3.6,1.55,-.15],yaw:.55}];
    const pose=spaces[state.floor];goal={yaw:pose.yaw,pitch:.73,span:narrow?23:12.5,target:pose.target};
   }
  }else if(state.mode==='explode'){
   if(id==='front')goal={yaw:0,pitch:.17,span:narrow?64:52,target:[0,21.0,0]};
   if(id==='back')goal={yaw:3.86,pitch:.38,span:narrow?65:56,target:[0,20.8,0]};
  }
 }
 cam.goal=goal;if(reduced){cam.yaw=goal.yaw;cam.pitch=goal.pitch;cam.span=goal.span;cam.target=[...goal.target]}
}
const presetList=()=>state.mode==='overview'?[['hero','轴测'],['front','正立面'],['back','背面'],['roof','屋面']]:state.mode==='floor'?[['hero','轴测'],['top','平面'],['reverse','反向'],['detail','近景']]:[['hero','轴测'],['front','正立面'],['back','背面']];
function cameraButtons(){$('#view-presets').innerHTML=presetList().map(([id,name])=>{const on=(state.cameraPreset||'hero')===id;return `<button data-view="${id}" class="${on?'active':''}" aria-pressed="${on}">${name}</button>`}).join('')}
function setCameraPreset(id){if(!presetList().some(([v])=>v===id))return;state.cameraPreset=id==='hero'?null:id;setAuto(false);targetCamera();cameraButtons()}
function setQuality(quality){
 state.quality=quality==='balanced'?'balanced':'detail';renderer.quality=state.quality==='detail'?1.5:1;renderer.ao=state.quality==='detail'?1:0;renderer.shadowDirty=true;
 $('#quality-toggle').textContent=state.quality==='detail'?'画质：精细':'画质：流畅';$('#quality-toggle').setAttribute('aria-pressed',String(state.quality==='detail'));
}
function setToggle(el,on){el.classList.toggle('active',on);el.setAttribute('aria-pressed',String(on))}
function setAuto(on){state.auto=on;setToggle($('#orbit-toggle'),on)}

function setMode(mode,floorIndex=state.floor,{keepSelection=false}={}){if(!['overview','explode','floor'].includes(mode))return;state.mode=mode;state.cameraPreset=null;state.floor=M.clamp(Number(floorIndex)||0,0,5);setAuto(false);splitGoal=mode==='explode'?1:0;if(!keepSelection){state.selected=null;state.panel=mode==='floor'?'floor':'overview'}renderer.shadowDirty=true;targetCamera();sceneButtons();cameraButtons();buildPins();renderPanel()}
function selectDevice(id){const d=store.get(id);if(!d)return;state.selected=id;state.panel='device';setMode('floor',d.floor,{keepSelection:true});state.markers=true;setToggle($('#devices-toggle'),true);buildPins();renderer.shadowDirty=true;panel.scrollTop=0}
function buildPins(){
 const ds=state.mode==='floor'?store.devices.filter(d=>d.floor===state.floor):store.devices.filter(d=>d.status==='alert');
 $('#pins').innerHTML=ds.map(d=>{const t=Twin.types[d.type],label=d.id===state.selected||d.status==='alert'||state.mode!=='floor';
  return `<button class="device-pin ${d.status==='alert'?'alarm':''} ${!d.online?'offline':''} ${d.id===state.selected?'selected':''}" data-pin="${d.id}" title="${d.floor+1}F ${d.name} · ${statusWord(d)}" aria-label="${d.floor+1}楼${d.name}，${statusWord(d)}"><span class="tag">${t.code}${label?`<span>${state.mode==='floor'?'':`${d.floor+1}F `}${d.status==='alert'?alertText(d):d.name}</span>`:''}</span><span class="stem"></span><span class="foot"></span></button>`}).join('');
 $('#floor-tags').innerHTML=state.mode==='explode'?Twin.floors.map((f,i)=>`<button class="floor-tag" data-floor-tag="${i}"><b>${f.number}F</b>${f.name}</button>`).join(''):'';
}
function offsetForFloor(f){if(state.mode==='floor')return [0,.49-(.91+f*3.7),0];return [0,f*3.2*split,0]}
function worldPosition(d){const base=.91+d.floor*3.7,off=offsetForFloor(d.floor);let p=[d.position[0],d.position[1]+base+off[1],d.position[2]];if(state.mode==='overview'&&d.status==='alert')p=[11.1,base+2.0,5.6];return p}
function updatePins(){const rect=canvas.getBoundingClientRect();
 for(const el of $$('[data-pin]')){const d=store.get(el.dataset.pin),p=renderer.project(worldPosition(d),cam);const inside=state.markers&&p.x>20&&p.x<rect.width-20&&p.y>50&&p.y<rect.height-10;el.classList.toggle('hidden',!inside);if(inside){el.style.left=`${p.x}px`;el.style.top=`${p.y}px`;el.style.zIndex=d.id===state.selected?'8':d.status==='alert'?'6':'3'}}
 for(const el of $$('[data-floor-tag]')){const i=Number(el.dataset.floorTag),p=renderer.project([-11.7,.91+i*3.7+i*3.2*split+.2,7.9],cam);el.style.left=`${p.x-24}px`;el.style.top=`${p.y}px`;el.style.display=p.x>60&&p.y>40&&p.y<rect.height-10?'flex':'none'}
 $('.compass svg').style.transform=`rotate(${cam.yaw*180/Math.PI}deg)`}
function visible(b){if(b.kind==='context')return state.mode==='overview';if(b.detail&&state.mode==='overview'&&cam.span>30)return false;if(b.floor===-4)return true;if(b.floor===-3)return state.mode==='floor';if(b.floor===-1)return state.mode!=='floor'&&(b.kind!=='exterior'||state.mode==='overview');if(b.floor===6)return state.mode!=='floor';if(state.mode==='floor'&&b.floor!==state.floor)return false;if(b.kind==='stair-upper'&&state.mode==='floor')return false;if(b.kind==='shell')return state.mode==='overview';if(b.kind==='selection')return state.mode==='floor'&&!!state.selected&&store.get(state.selected)?.floor===b.floor;if(b.kind==='smokeAlarm')return state.mode!=='overview'&&store.devices.some(d=>d.floor===b.floor&&d.type==='smoke'&&d.status==='alert');if(b.kind==='alarm'){const d=store.devices.find(d=>d.floor===b.floor&&d.status==='alert'&&d.type==='hvac');return !!d&&state.mode!=='overview'}return true}
function offsets(b){if(b.floor<0)return [0,0,0];const off=offsetForFloor(b.floor);if(b.kind==='selection'&&state.selected){const d=store.get(state.selected);off[0]=d.position[0];off[2]=d.position[2]}return off}
function toggleNight(){state.night=!state.night;document.body.classList.toggle('night',state.night);setToggle($('#night-toggle'),state.night);$('meta[name=theme-color]').content=state.night?'#1c3136':'#f5f7f5'}
function togglePresentation(){state.presentation=!state.presentation;document.body.classList.toggle('presentation',state.presentation);targetCamera();toast(state.presentation?'演示模式：按 P 或 Esc 恢复界面':'已恢复界面')}
function makeScreenshot(){try{
 const bar=64,out=document.createElement('canvas'),w=canvas.width,h=canvas.height+bar;out.width=w;out.height=h;const c=out.getContext('2d'),css=getComputedStyle(document.body);
 c.drawImage(canvas,0,0);c.fillStyle=css.getPropertyValue('--surface').trim();c.fillRect(0,canvas.height,w,bar);c.fillStyle=css.getPropertyValue('--rule').trim();c.fillRect(0,canvas.height,w,1);
 const f=Twin.floors[state.floor],title=state.mode==='floor'?`${f.number}F ${f.name}`:state.mode==='explode'?'逐层拆解':'外观';
 c.fillStyle=css.getPropertyValue('--ink').trim();c.font='600 22px "Microsoft YaHei UI","PingFang SC",sans-serif';c.textBaseline='middle';c.fillText(`云庭中心 A 座 · ${title}`,28,canvas.height+bar/2);
 c.fillStyle=css.getPropertyValue('--ink-3').trim();c.font='16px "Microsoft YaHei UI","PingFang SC",sans-serif';c.textAlign='right';c.fillText(`原生 WebGL 2 实时渲染 · 模拟数据 · ${new Date().toLocaleDateString('zh-CN')}`,w-28,canvas.height+bar/2);
 out.toBlob(blob=>{if(!blob)return toast('导出失败');const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=`yunting-a-${state.mode}${state.mode==='floor'?'-'+(state.floor+1)+'F':''}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);toast('已导出当前画面')},'image/png')}catch(e){toast('导出失败：'+e.message)}}
function openPanel(name,filter){state.panel=name;if(filter)state.filter=filter;renderPanel();panel.scrollTop=0}
function onPanelClick(e){const el=e.target.closest('button');if(!el)return;
 if(el.dataset.device)return selectDevice(el.dataset.device);
 if(el.dataset.focus){targetCamera(store.get(el.dataset.focus));toast('镜头已对准设备');return}
 if(el.dataset.order){const {order,existing}=store.createOrder(el.dataset.order);renderPanel();toast(existing?`${order.id} 已在处理中`:`已创建工单 ${order.id}`);return}
 if(el.dataset.complete){store.completeOrder(el.dataset.complete);renderPanel();buildPins();renderer.shadowDirty=true;toast('检修完成，告警已复位');return}
 if(el.dataset.filter){state.filter=el.dataset.filter;state.panel='devices';renderPanel();return}
 switch(el.dataset.action){
 case 'back':state.selected=null;state.panel=state.mode==='floor'?'floor':'overview';renderPanel();buildPins();break;
 case 'floor-panel':state.panel='floor';state.selected=null;renderPanel();buildPins();break;
 case 'simulate':{const {device,existing}=store.simulate();selectDevice(device.id);toast(existing?'这条烟感告警已经存在，已定位':'已在 2F 触发一次烟感告警');break}
 case 'reset-demo':if(confirm('复位演示数据？本机的工单记录会清空，告警恢复到初始状态。')){store.reset();setMode('overview');toast('演示数据已复位')}break;
 }
}
function setupInteraction(){
 $('#floor-buttons').innerHTML=[...Twin.floors].map((f,i)=>({f,i})).reverse().map(({f,i})=>`<button class="floor-row" data-floor="${i}" title="${f.number}F ${f.name} · ${f.number}"><b>${f.number}F</b><span>${f.name}</span><em></em></button>`).join('');
 $$('.floor-row').forEach(b=>b.addEventListener('click',()=>setMode('floor',Number(b.dataset.floor))));
 $$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
 $('#home').addEventListener('click',e=>{e.preventDefault();setMode('overview')});
 $('#reset-view').addEventListener('click',()=>setCameraPreset('hero'));
 $('#view-presets').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)setCameraPreset(b.dataset.view)});
 $('#quality-toggle').addEventListener('click',()=>{setQuality(state.quality==='detail'?'balanced':'detail');toast(state.quality==='detail'?'精细：高分辨率渲染，开启接触阴影':'流畅：降低渲染分辨率，关闭接触阴影')});
 $('#night-toggle').addEventListener('click',toggleNight);
 $('#devices-toggle').addEventListener('click',()=>{state.markers=!state.markers;setToggle($('#devices-toggle'),state.markers);updatePins()});
 $('#orbit-toggle').addEventListener('click',()=>setAuto(!state.auto));
 $('#presentation').addEventListener('click',togglePresentation);$('#exit-presentation').addEventListener('click',togglePresentation);$('#capture').addEventListener('click',makeScreenshot);
 $('#stat-devices').addEventListener('click',()=>openPanel('devices','all'));$('#stat-energy').addEventListener('click',()=>openPanel('overview'));$('#stat-alarms').addEventListener('click',()=>openPanel('devices','alert'));$('#stat-orders').addEventListener('click',()=>openPanel('orders'));
 panel.addEventListener('click',onPanelClick);$('#pins').addEventListener('click',e=>{const b=e.target.closest('[data-pin]');if(b)selectDevice(b.dataset.pin)});$('#floor-tags').addEventListener('click',e=>{const b=e.target.closest('[data-floor-tag]');if(b)setMode('floor',Number(b.dataset.floorTag))});
 let down=null,pointers=new Map(),pinch=0;
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);down={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};canvas.classList.add('dragging');if(pointers.size===2){const p=[...pointers.values()];pinch=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])}});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)||!down)return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2){const p=[...pointers.values()],d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);if(pinch>0)cam.goal.span=M.clamp(cam.goal.span*pinch/d,10,85);pinch=d;down.moved=true;return}const dx=e.clientX-down.lastX,dy=e.clientY-down.lastY;cam.goal.yaw-=dx*.006;cam.goal.pitch=M.clamp(cam.goal.pitch+dy*.005,.18,1.42);down.lastX=e.clientX;down.lastY=e.clientY;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>4)down.moved=true;setAuto(false)});
 const release=e=>{pointers.delete(e.pointerId);if(down&&!down.moved&&e.type==='pointerup'){const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;let best=null,min=23;for(const el of $$('[data-pin]:not(.hidden)')){const d=store.get(el.dataset.pin),p=renderer.project(worldPosition(d),cam),dist=Math.hypot(p.x-x,p.y-y);if(dist<min){min=dist;best=d}}if(best)selectDevice(best.id)}if(!pointers.size){down=null;canvas.classList.remove('dragging')}else{const p=[...pointers.values()][0];down={x:p[0],y:p[1],lastX:p[0],lastY:p[1],moved:true}}};
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('wheel',e=>{e.preventDefault();cam.goal.span=M.clamp(cam.goal.span*Math.exp(e.deltaY*.001),10,85)},{passive:false});canvas.addEventListener('contextmenu',e=>e.preventDefault());
 window.addEventListener('keydown',e=>{if(e.ctrlKey||e.altKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;const key=e.key.toLowerCase();if(/^[1-6]$/.test(key)){e.preventDefault();setMode('floor',Number(key)-1)}else if(key==='0')setMode('overview');else if(key==='e')setMode('explode');else if(key==='r')setCameraPreset('hero');else if(key==='d')toggleNight();else if(key==='p')togglePresentation();else if(key==='escape'){if(state.presentation)togglePresentation();else{state.selected=null;state.panel=state.mode==='floor'?'floor':'overview';renderPanel();buildPins()}}});
 window.addEventListener('resize',()=>{targetCamera();renderer.shadowDirty=true});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false;$('#error-text').textContent='图形上下文丢失。本机保存的演示工单不受影响，请重新加载页面。'});
 canvas.addEventListener('webglcontextrestored',()=>location.reload());
}
function frame(now){
 requestAnimationFrame(frame);const clockDt=Math.min((now-(frame.clock||now))/1000,.12);frame.clock=now;if(document.hidden)return;
 // Animation time is independent of GPU submission cadence.
 if(state.auto)cam.goal.yaw+=clockDt*.085;
 if(!renderer.frameReady())return;const moving=Math.abs(cam.yaw-cam.goal.yaw)+Math.abs(cam.pitch-cam.goal.pitch)+Math.abs(cam.span-cam.goal.span)+cam.target.reduce((sum,v,i)=>sum+Math.abs(v-cam.goal.target[i]),0)+Math.abs(split-splitGoal)+Math.abs(nightMix-(state.night?1:0))>.0005;if(!firstFrame&&!moving&&!state.auto&&!renderer.shadowDirty&&now-(renderer.lastComplete||last)<1200){updatePins();return}if(last&&now-last<29)return;const dt=Math.min((now-last)/1000||.033,.5);last=now;state.tick=now/1000;
 frameCount++;frameTime+=(frame.lastNow?(now-frame.lastNow)/1000:dt);frame.lastNow=now;if(frameTime>=2){fps=frameCount/frameTime;frameCount=0;frameTime=0}
 const a=reduced?1:1-Math.exp(-dt*6.8);cam.yaw=M.lerp(cam.yaw,cam.goal.yaw,a);cam.pitch=M.lerp(cam.pitch,cam.goal.pitch,a);cam.span=M.lerp(cam.span,cam.goal.span,a);cam.target=cam.target.map((v,i)=>M.lerp(v,cam.goal.target[i],a));
 const prev=split;split=M.lerp(split,splitGoal,a);if(Math.abs(split-splitGoal)<.001)split=splitGoal;if(Math.abs(split-prev)>.0003)renderer.shadowDirty=true;nightMix=M.lerp(nightMix,state.night?1:0,a);
 const size=renderer.resize(),aspect=size[0]/Math.max(size[1],1),r=85;
 cam.eye=[cam.target[0]+r*Math.cos(cam.pitch)*Math.sin(cam.yaw),cam.target[1]+r*Math.sin(cam.pitch),cam.target[2]+r*Math.cos(cam.pitch)*Math.cos(cam.yaw)];cam.vp=M.mul(M.ortho(-cam.span*aspect/2,cam.span*aspect/2,-cam.span/2,cam.span/2,.1,260),M.lookAt(cam.eye,cam.target));
 const lightBg=[.910,.933,.921],darkBg=[.090,.169,.188];const sceneState={visible,offset:offsets,tint:b=>b.kind==='equipment'&&state.selected&&store.get(state.selected)?.floor===b.floor&&store.get(state.selected)?.status==='alert'?.15:0,night:nightMix,background:lightBg.map((v,i)=>M.lerp(v,darkBg[i],nightMix))};
 const farLOD=state.mode==='overview'&&cam.span>30;if(renderer.farLOD!==farLOD){renderer.farLOD=farLOD;renderer.shadowDirty=true;}
 renderer.draw(sceneState,cam,state.tick);renderer.lastState={mode:state.mode,floor:state.floor,split,night:nightMix,selected:state.selected};updatePins();
 if(firstFrame){firstFrame=false;$('#loading').classList.add('gone');window.__TWIN_READY__=true;setTimeout(()=>$('#loading').remove(),400)}
}
function main(){try{store=new Twin.Store();renderer=new Twin.Renderer(canvas);model=Twin.buildModel();renderer.load(model.items);setupInteraction();renderPanel();sceneButtons();cameraButtons();buildPins();targetCamera();requestAnimationFrame(frame);
 setInterval(()=>{if(state.selected&&$('#device-reading'))$('#device-reading').textContent=store.unitValue(store.get(state.selected),state.tick)},5000);
 window.twinApp={state,store,camera:cam,setMode,selectDevice,setCameraPreset,setQuality,renderer,model,diagnostics:()=>({...renderer.diagnostics(),fps:Number(fps.toFixed(1)),renderPolicy:'on-demand + 1.2s idle refresh',cameraPreset:state.cameraPreset||'hero',quality:state.quality,mode:state.mode,selected:state.selected,split:Number(split.toFixed(3)),nightMix:Number(nightMix.toFixed(3)),storageAvailable:store.storageAvailable}),projectDevice:id=>renderer.project(worldPosition(store.get(id)),cam)};
 }catch(error){console.error(error);$('#loading')?.remove();$('#error').hidden=false;$('#error-text').textContent=error.message;window.__TWIN_ERROR__=error.message}}
 setTimeout(main,40);
})();
