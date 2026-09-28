/* Deterministic mock telemetry. No data is presented as a live BMS connection. */
'use strict';
Twin.floors=[
 {number:1,name:'接待大厅',short:'大堂',area:330,people:24,temperature:24.1},
 {number:2,name:'共享办公',short:'办公',area:330,people:68,temperature:24.6},
 {number:3,name:'协作办公',short:'协作',area:330,people:52,temperature:26.8},
 {number:4,name:'会议中心',short:'会议',area:330,people:18,temperature:24.3},
 {number:5,name:'运维中心',short:'运维',area:330,people:16,temperature:23.8},
 {number:6,name:'数据机房',short:'机房',area:330,people:4,temperature:22.5}
];
Twin.types={
 hvac:{name:'空调机组',system:'暖通空调',code:'AHU',icon:'fan',pos:[8.6,1.7,-6.15],unit:'°C',metric:'回风温度',base:24.2,sub:'东侧设备区'},
 camera:{name:'网络摄像机',system:'安防监控',code:'CAM',icon:'camera',pos:[-9.5,2.8,5.65],unit:'Mbps',metric:'实时码率',base:4.2,sub:'西侧通道'},
 smoke:{name:'光电烟感',system:'消防监测',code:'SMK',icon:'shield',pos:[-7.4,2.96,-.73],unit:'%/m',metric:'烟雾浓度',base:.02,sub:'电梯厅吊顶'},
 sensor:{name:'环境传感器',system:'环境感知',code:'ENV',icon:'thermo',pos:[-4.0,1.8,-1.36],unit:'°C',metric:'环境温度',base:24.4,sub:'电梯前厅'},
 meter:{name:'智能电表',system:'能源计量',code:'PWR',icon:'bolt',pos:[-4.2,1.8,-6.84],unit:'kW',metric:'有功功率',base:16.8,sub:'配电间'},
 access:{name:'门禁控制器',system:'门禁管理',code:'ACS',icon:'door',pos:[-.5,1.55,6.7],unit:'次',metric:'今日通行',base:128,sub:'主入口'}
};
Twin.createDevices=()=>Twin.floors.flatMap((f,fi)=>Object.entries(Twin.types).map(([type,t],i)=>({
 id:`LL-A-${t.code}-${String(f.number).padStart(2,'0')}01`,type,floor:fi,name:t.name,area:t.sub,position:[...t.pos],
 online:!(fi===4&&type==='camera'),status:fi===2&&type==='hvac'?'alert':'normal',
 alert:fi===2&&type==='hvac'?'回风温度持续偏高':'',alertAt:fi===2&&type==='hvac'?'14:32:08':'',
 base:t.base+(type==='sensor'?fi*.12:type==='meter'?fi*1.2:0),index:fi*6+i
})));
Twin.Store=class {
 constructor(){this.devices=Twin.createDevices();this.orders=[];this.storageAvailable=true;this.simulationTick=0;this.key='building-twin:v1';this.restore()}
 restore(){try{const raw=localStorage.getItem(this.key);if(!raw)return;const data=JSON.parse(raw);if(data.version!==1)return;
  for(const saved of data.devices||[]){const d=this.devices.find(x=>x.id===saved.id);if(!d)continue;if(['normal','alert'].includes(saved.status))d.status=saved.status;if(typeof saved.online==='boolean')d.online=saved.online;d.alert=d.status==='alert'?(d.type==='smoke'?'烟雾浓度超出阈值':'回风温度持续偏高'):'';d.alertAt=typeof saved.alertAt==='string'&&/^\d{2}:\d{2}:\d{2}$/.test(saved.alertAt)?saved.alertAt:''}
  this.orders=(data.orders||[]).filter(o=>this.devices.some(d=>d.id===o.deviceId)&&/^WO-\d{3,6}$/.test(o.id)&&['processing','closed'].includes(o.status)).slice(0,200).map(o=>({id:o.id,deviceId:o.deviceId,status:o.status,createdAt:Number(o.createdAt)||Date.now(),closedAt:Number(o.closedAt)||null}));
 }catch{this.storageAvailable=false}}
 save(){try{localStorage.setItem(this.key,JSON.stringify({version:1,devices:this.devices.map(({id,status,online,alertAt})=>({id,status,online,alertAt})),orders:this.orders}));return true}catch{this.storageAvailable=false;return false}}
 get(id){return this.devices.find(d=>d.id===id)}
 stats(){const online=this.devices.filter(d=>d.online).length;return {online,total:this.devices.length,rate:(online/this.devices.length*100).toFixed(1),alarms:this.devices.filter(d=>d.status==='alert').length,orders:this.orders.filter(o=>o.status==='processing').length,energy:1248.6}}
 value(d,t=0){if(!d.online)return null;if(d.status==='alert')return d.type==='smoke'?2.8+Math.sin(t*.3)*.04:31.4+Math.sin(t*.4)*.15;if(d.type==='access')return d.base+d.floor*37;if(d.type==='smoke')return d.base;return d.base+Math.sin(t*.35+d.index)*.12}
 unitValue(d,t=0){const v=this.value(d,t);return v===null?'—':d.type==='access'?String(Math.round(v)):v.toFixed(d.type==='smoke'?2:1)}
 simulate(){let d=this.devices.find(d=>d.type==='smoke'&&d.floor===1);if(d.status==='alert')return {device:d,existing:true};d.status='alert';d.online=true;d.alert='烟雾浓度超出阈值';d.alertAt=new Date().toLocaleTimeString('zh-CN',{hour12:false});this.save();return {device:d,existing:false}}
 createOrder(id){const d=this.get(id);if(!d)throw new Error('设备不存在');let o=this.orders.find(o=>o.deviceId===id&&o.status==='processing');if(o)return {order:o,existing:true};const next=Math.max(0,...this.orders.map(o=>Number(o.id.split('-')[1])))+1;if(this.orders.length>=200)this.orders=this.orders.filter(o=>o.status==='processing');o={id:`WO-${String(next).padStart(3,'0')}`,deviceId:id,status:'processing',createdAt:Date.now(),closedAt:null};this.orders.unshift(o);this.save();return {order:o,existing:false}}
 completeOrder(id){const o=this.orders.find(o=>o.id===id&&o.status==='processing');if(!o)return false;o.status='closed';o.closedAt=Date.now();const d=this.get(o.deviceId);d.status='normal';d.alert='';d.online=true;this.save();return true}
 reset(){this.devices=Twin.createDevices();this.orders=[];this.save()}
};
Twin.energyHours=[20,19,18,17,18,22,30,48,70,76,71,64,67,73,77,76,69,65,53,43,35,29,26,23];
