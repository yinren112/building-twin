/* Original procedural architectural model, dimensions in metres.
   Six independent floor assemblies; separate curtain wall and interior groups. */
'use strict';
Twin.buildModel = function(){
 const M=Twin.math,rand=M.random(4207),items=[];let rackIndex=0;let floor=-1,kind='site',root=M.identity();
 const material=(hex,rough=.65,metal=0,em=0,type=0,alpha=1)=>({color:M.color(hex,alpha),material:[rough,metal,em,type]});
 const lobbyGlass=material('#a9c4bd',.08,.1,0,3,.14);
 const P={
  stone:material('#d4cebf',.79,0,0,6),ivory:material('#eae6da',.46,0,0,6),edge:material('#b3bfba',.5,.35),dark:material('#334b4b',.5,.3),
  glass:material('#366c70',.12,.1,0,3,.35),innerGlass:material('#a1b9b1',.12,.15,0,3,.15),spandrel:material('#203f43',.25,.55),
  metal:material('#8b9b9c',.28,.75,0,10),brass:material('#9c835e',.34,.72,0,10),wood:material('#987855',.56,0,0,2),white:material('#f3f1e8',.55),
  floor:material('#d6d5c9',.66,0,0,1),carpet:material('#97a39b',.98,0,0,11),carpetDark:material('#4f6b6c',.98,0,0,11),
  charcoal:material('#263b40',.65,.25),screen:material('#163c43',.22,.35,.12),led:material('#82d6b4',.25,0,1.1),warm:material('#f5db9d',.4,0,.5),
  soil:material('#5b705c',1),grass:material('#7b9777',1),leaf:material('#588052',.9,0,0,9),leaf2:material('#829958',.94,0,0,9),leaf3:material('#365e49',.94,0,0,9),
  bark:material('#88755c',.99),water:material('#234e4d',.10,.35,0,4),road:material('#727e79',.96,0,0,11),paint:material('#e5e8da',.85),
  blue:material('#5d8790',.46,.3),red:material('#af7261',.5,.2),orange:material('#df9161',.6),solar:material('#17333e',.20,.35,0,7),
  redLed:material('#ed9767',.25,0,1.2),black:material('#17272c',.6),soft:material('#cfc4a9',.9,0,0,11),greenSoft:material('#627d70',.88,0,0,11)
 };
 function add(shape,p,s,mat=P.white,r=[0,0,0],k=kind){items.push({shape,matrix:M.mul(root,M.compose(p,s,r)),color:mat.color,material:mat.material,floor,kind:k,detail:floor>=0&&k!=='shell'&&Math.max(...s.map(Math.abs))<.095})}
 const bevel=(p,s,m,r,k)=>add('bevel',p,s,m,r,k);
 const box=(p,s,m,r,k)=>add('box',p,s,m,r,k),round=(p,s,m,r,k)=>add('round',p,s,m,r,k),cyl=(p,s,m,r,k)=>add('cylinder',p,s,m,r,k),ball=(p,s,m,k)=>add('sphere',p,s,m,[0,0,0],k);
 function at(p,angle,fn){const old=root;root=M.mul(root,M.compose(p,[1,1,1],[0,angle,0]));fn();root=old}
 function set(f,k,base=0){floor=f;kind=k;root=M.compose([0,base,0])}
 function pipe(a,b,r,m){const mid=M.add(a,b).map(v=>v/2),dir=M.sub(b,a),len=Math.hypot(...dir);const yaw=Math.atan2(dir[0],dir[2]),pitch=Math.acos(M.clamp(dir[1]/len,-1,1));cyl(mid,[r,len,r],m,[pitch,yaw,0])}
 function plant(x,z,scale=1){at([x,.18,z],0,()=>{
  cyl([0,.22*scale,0],[.27*scale,.44*scale,.27*scale],P.ivory);add('torus',[0,.44*scale,0],[.55*scale,.32*scale,.55*scale],P.brass);
  cyl([0,.434*scale,0],[.245*scale,.016,.245*scale],P.soil);
  for(let j=0;j<12;j++){const a=j*2.399,h=(.73+rand()*.62)*scale,r=(.18+rand()*.22)*scale;
   const tip=[Math.cos(a)*r,h,Math.sin(a)*r];pipe([0,.42*scale,0],tip,.012*scale,P.leaf3);
   add('leaf',[tip[0],tip[1]+.09*scale,tip[2]],[.50*scale,.85*scale,.65*scale],j%3===0?P.leaf2:P.leaf,[-.52+rand()*.8,a,rand()*.4]);
  }
 })}
 function chair(x,z,angle=0,mat=P.greenSoft){at([x,.18,z],angle,()=>{
 cyl([0,.29,0],[.037,.39,.037],P.metal);cyl([0,.19,0],[.060,.12,.060],P.charcoal);
 for(let j=0;j<5;j++){const a=j/5*6.283;const end=[Math.cos(a)*.30,.085,Math.sin(a)*.30];pipe([0,.12,0],end,.024,P.charcoal);
  cyl([end[0],.048,end[2]],[.046,.078,.046],P.black,[0,a,Math.PI/2]);
 }
 round([0,.49,0],[.64,.13,.61],mat);bevel([0,.415,0],[.49,.05,.45],P.charcoal);
 round([0,.90,-.27],[.63,.69,.095],P.charcoal,[-.13,0,0]);round([0,.91,-.21],[.54,.56,.055],mat,[-.13,0,0]);
 for(let j=0;j<6;j++)box([0,.68+j*.073,-.17],[.46,.010,.01],P.dark,[-.13,0,0]);
 for(const xx of [-.34,.34]){pipe([xx,.45,-.14],[xx,.73,-.14],.018,P.charcoal);round([xx,.75,.015],[.09,.045,.37],P.charcoal);}
 pipe([0,.43,-.18],[0,.64,-.33],.025,P.metal);
 })}
 function monitor(x,z,angle=0){at([x,.997,z],angle,()=>{
 bevel([0,0,0],[.38,.028,.24],P.metal);box([0,.17,0],[.033,.31,.04],P.metal);
 round([0,.44,0],[.82,.49,.043],P.charcoal);box([0,.445,.024],[.775,.438,.009],P.screen);
 box([-.27,.445,.031],[.13,.410,.002],P.dark);for(let j=0;j<6;j++)box([-.27,.595-j*.055,.034],[.085,.013,.001],j%3?P.blue:P.led);
 for(let i=0;i<7;i++)box([-.13+i*.065,.33+rand()*.05,.032],[.037,.05+rand()*.13,.002],i%3?P.blue:P.led);
 box([.07,.59,.032],[.47,.013,.002],P.metal);ball([0,.218,.028],[.010,.008,.002],P.led);
 bevel([0,.025,.40],[.55,.035,.18],P.metal);
 for(let row=0;row<4;row++)for(let c=0;c<12;c++)box([-.238+c*.043,.047,.338+row*.036],[.030,.006,.023],P.charcoal);
 round([.39,.037,.40],[.085,.043,.14],P.charcoal);box([.39,.057,.386],[.008,.005,.023],P.edge);
 pipe([.10,-.015,.13],[.16,-.32,.13],.009,P.black);
 })}
 function desk(x,z,angle=0){at([x,.0,z],angle,()=>{round([0,.93,0],[2.3,.12,1.22],P.wood);box([0,1.003,0],[2.19,.014,1.10],P.white);for(const a of [-.96,.96]){box([a,.56,0],[.05,.72,.89],P.metal);box([a,.22,0],[.12,.07,.99],P.metal)}box([.69,.55,0],[.5,.62,.57],P.ivory);for(let j=0;j<3;j++)box([.69,.40+j*.18,.29],[.16,.025,.015],P.metal);monitor(-.3,-.23);box([.78,1.02,.3],[.28,.035,.35],P.blue);cyl([.66,1.10,-.3],[.075,.18,.075],P.white);add('torus',[.74,1.09,-.3],[.12,.9,.12],P.white,[Math.PI/2,0,0]);cyl([.74,1.008,-.42],[.044,.010,.044],P.charcoal);box([0,.73,-.18],[1.87,.07,.16],P.dark);box([0,1.24,-.54],[2.12,.40,.035],P.greenSoft);for(const xx of [-.90,.90])box([xx,1.02,-.54],[.04,.18,.10],P.metal);chair(-.2,1.03,Math.PI)})}
 function sofa(x,z,angle=0){at([x,.18,z],angle+Math.PI,()=>{for(const a of [-.8,.8])for(const b of [-.28,.28])box([a,.13,b],[.1,.25,.1],P.brass);round([0,.38,0],[2.2,.35,.90],P.soft);round([0,.73,-.35],[2.2,.65,.22],P.soft);for(const a of [-1,1])round([a,.61,0],[.22,.55,.86],P.soft);for(const a of [-.48,.48]){round([a,.60,0],[.88,.11,.70],P.soft);round([a,.90,-.18],[.77,.38,.14],P.soft,[-.15,0,0]);}})}
 function meeting(x,z,w=4.2,d=1.8){box([x,.20,z],[w+2.5,.025,d+2.4],P.carpet);round([x,.94,z],[w,.13,d],P.wood);box([x-w*.3,.56,z],[.18,.72,d*.62],P.charcoal);box([x+w*.3,.56,z],[.18,.72,d*.62],P.charcoal);for(let i=0;i<Math.round(w/1.3);i++){const xx=x-w*.36+i*(w*.72/(Math.round(w/1.3)-1));chair(xx,z+d*.5+.62,Math.PI);chair(xx,z-d*.5-.62);round([xx,1.035,z],[.42,.018,.30],P.blue)}cyl([x,1.08,z],[.12,.13,.12],P.white)}
 function partition(x,z,w,angle=0){at([x,0,z],angle,()=>{box([0,1.35,0],[w,2.35,.035],P.innerGlass);for(let i=0;i<=Math.round(w/1.5);i++)box([-w/2+i*w/Math.round(w/1.5),1.35,0],[.04,2.4,.05],P.metal);box([0,2.56,0],[w,.05,.07],P.dark);box([0,.23,0],[w,.075,.07],P.dark)})}
 function hvac(x,z,angle=0,large=false){at([x,.17,z],angle,()=>{let w=large?1.7:1.25,h=large?2.5:1.1;round([0,h/2,0],[w,h,.62],P.ivory);box([0,h*.55,.325],[w*.8,h*.65,.014],material('#687b7b',.55,.3,0,14));for(let j=0;j<8;j++)box([0,h*.32+j*h*.055,.346],[w*.73,.025,.019],P.dark);box([w*.25,h*.88,.335],[.16,.09,.018],P.screen);ball([w*.39,h*.87,.35],[.026,.026,.026],P.led);for(const xx of [-w*.4,w*.4])box([xx,.035,0],[.12,.1,.48],P.dark);for(const xx of [-w*.43,w*.43])for(const yy of [.15,h-.15])cyl([xx,yy,.32],[.022,.012,.022],P.metal,[Math.PI/2,0,0]);box([w*.32,h*.52,.342],[.033,.17,.027],P.metal)})}
 function rack(x,z){const serial=String(++rackIndex).padStart(2,'0');at([x,.18,z],0,()=>{
 bevel([0,1.36,0],[1.20,2.65,1.3],P.charcoal);box([0,1.37,.664],[1.03,2.37,.020],P.black);
 box([0,2.70,0],[1.13,.028,1.21],material('#53676c',.5,.4,0,14));
 for(let j=0;j<11;j++){
  bevel([0,.37+j*.197,.690],[.94,.158,.040],P.dark);box([-.03,.37+j*.197,.716],[.60,.105,.006],material('#667476',.6,.5,0,14));
  for(const xx of [-.43,.43])box([xx,.37+j*.197,.730],[.023,.079,.019],P.metal);
  box([-.30,.37+j*.197,.722],[.12,.012,.011],P.edge);
  for(let k=0;k<3;k++)ball([.25+k*.054,.37+j*.197,.729],[.012,.014,.006],(j+k)%4?P.led:P.blue);
 }
 for(const xx of [-.52,.52]){box([xx,1.35,.718],[.028,2.48,.025],P.metal);for(let j=0;j<24;j++)box([xx,.22+j*.098,.734],[.010,.025,.003],P.black);}
 box([.48,1.35,.755],[.026,.26,.036],P.metal);box([0,2.60,.735],[.40,.115,.006],P.white);
 const segments=[[-.022,.04,.045,.006],[.024,.02,.006,.035],[.024,-.02,.006,.035],[-.022,-.04,.045,.006],[-.026,-.02,.006,.035],[-.026,.02,.006,.035],[-.022,0,.045,.006]];
 const masks=[63,6,91,79,102,109,125,7,127,111];
 [...serial].forEach((d,k)=>segments.forEach(([xx,yy,w,h],i)=>{if(masks[Number(d)]&(1<<i))box([-.033+k*.11+xx,2.60+yy,.741],[w,h,.001],P.charcoal);}));
 box([.46,1.34,-.67],[.065,2.33,.055],P.black);for(let j=0;j<9;j++){box([.46,.34+j*.23,-.704],[.044,.065,.015],P.blue);}
 for(let k=0;k<6;k++){
  const xx=-.39+k*.13;pipe([xx,2.58,-.10],[xx,2.83,-.25],.012,k%2?P.blue:P.orange);
  pipe([xx,2.83,-.25],[xx,2.83,-.61],.012,k%2?P.blue:P.orange);
 }
 for(const xx of [-.45,.45])for(const zz of [-.46,.46])cyl([xx,.017,zz],[.055,.04,.055],P.metal);
 })}
 function sign(text,p,size=1,mat=P.brass){const paths={L:[[0,1,0,0],[0,0,.58,0]],A:[[0,0,.3,1],[.3,1,.6,0],[.14,.42,.46,.42]],I:[[.25,0,.25,1]],N:[[0,0,0,1],[0,1,.6,0],[.6,0,.6,1]],T:[[0,1,.6,1],[.3,1,.3,0]],C:[[.58,1,0,1],[0,1,0,0],[0,0,.58,0]],E:[[0,0,0,1],[0,1,.55,1],[0,.5,.38,.5],[0,0,.55,0]],R:[[0,0,0,1],[0,1,.55,1],[.55,1,.55,.52],[.55,.52,0,.52],[.18,.52,.55,0]]};at(p,0,()=>{let x=0;for(const letter of text){for(const [x1,y1,x2,y2] of paths[letter]||[]){const dx=x2-x1,dy=y2-y1;box([(x+(x1+x2)/2)*size,(y1+y2)/2*size,0],[Math.hypot(dx,dy)*size,.065*size,.04*size],mat,[0,0,Math.atan2(dy,dx)])}x+=.88}})}
 // Architectural plinth, streetscape, entrance and landscape.
 set(-4,'ground');box([0,-.9,0],[900,.2,900],material('#e8eeeb',1,0,0,8));
 set(-1,'site');box([0,-.15,0],[51,.95,40],P.stone);box([0,.31,0],[50.5,.10,39.5],P.floor);box([0,.337,19.93],[51,.05,.14],P.edge);box([0,.337,-19.93],[51,.05,.14],P.edge);
 box([0,.38,16.35],[48,.035,5.5],P.road);box([-21,.39,0],[5,.04,31.5],P.road);
 for(let x=-21;x<24;x+=4.2)box([x,.406,16.4],[2.1,.008,.09],P.paint);
 for(let z=-12;z<14;z+=4.2)box([-21,.417,z],[.09,.008,2.1],P.paint);
 for(let x=-1.6;x<2.2;x+=.65)box([x,.42,16.4],[.35,.01,4.4],P.paint);
 box([0,.48,10.9],[31,.25,4.9],P.ivory);for(let i=0;i<3;i++)box([0,.47+i*.12,8.95-i*.48],[12.5,.23,.8],P.stone);
 for(let x=-23;x<25;x+=2.2)box([x,.372,10.3],[.018,.01,5.8],P.edge);
 box([0,.62,0],[23,.44,16.2],P.stone);box([0,.857,0],[22.85,.05,16.05],P.edge);
 box([-11,.59,10.8],[9.3,.35,3.2],P.dark);box([-11,.779,10.8],[8.94,.02,2.82],P.water);
 for(let j=0;j<6;j++){cyl([-14.9+j*1.47,.82,10.8],[.032,.1,.032],P.metal);ball([-14.9+j*1.47,.90,10.8],[.09,.015,.09],P.warm)}
 function tree(x,z,h=4){at([x,.96,z],0,()=>{
 const palette=[P.leaf,P.leaf2,P.leaf3];
 cyl([0,h*.34,0],[.095,h*.68,.095],P.bark);
 for(let j=0;j<7;j++){
  const a=j*2.399,r=.60+rand()*.45,yy=h*(.52+rand()*.20),tip=[Math.cos(a)*r,yy,Math.sin(a)*r];
  pipe([0,h*.33,0],tip,.032+rand()*.018,P.bark);
  for(let k=0;k<3;k++){
   const aa=a+k*.65,pp=[tip[0]+Math.cos(aa)*.28,tip[1]+.33+rand()*.38,tip[2]+Math.sin(aa)*.28];
   pipe(tip,pp,.015,P.bark);add('foliage',pp,[.86,.70,.82],palette[(j+k)%3],[0,aa,0]);
  }
 }
 add('foliage',[0,h*.92,0],[.94,.92,.94],P.leaf2);
 // Three tree supports anchored in the planter, rather than floating above it.
 for(let j=0;j<3;j++){const a=j/3*6.283;pipe([Math.cos(a)*.48,0,Math.sin(a)*.48],[0,h*.34,0],.027,P.wood);}
 })}
 for(const x of [-15.4,15.1]){
 bevel([x,.65,-.5],[4,.55,23.6],P.ivory);box([x,.93,-.5],[3.65,.08,23.25],P.soil);
 for(let j=0;j<30;j++){
  const z=-11.3+j*.73,xx=x+(j%2?.83:-.83);
  add('foliage',[xx,1.13,z],[.51,.31,.48],j%3?P.leaf3:P.leaf2);
  if(j%3===0)for(let k=0;k<7;k++){const a=k*2.399;add('leaf',[xx+.12*Math.cos(a),1.20,z+.12*Math.sin(a)],[.10,.6,.7],P.leaf2,[-.7,a,.2]);}
 }
 for(const z of [-9,-2,6])tree(x,z,3.5+rand()*1.1);
 }
 for(const x of [-9,-1,8]){round([x,.66,-13.0],[3.2,.58,2.9],P.ivory);round([x,.96,-13.0],[2.96,.06,2.66],P.soil);tree(x,-13.0,3.4+rand());}
 for(const x of [-17.8,17.4])for(const z of [-10,3,11.5]){cyl([x,.41,z],[.15,.09,.15],P.dark);cyl([x,2.55,z],[.052,4.2,.052],P.metal);box([x,4.68,z],[.09,.09,1.22],P.dark);box([x,4.62,z+.25],[.09,.025,.56],P.warm)}
 function bench(x,z,ang=0){at([x,Math.abs(z-11.1)<.1?.57:.35,z],ang,()=>{for(let j=0;j<5;j++)box([0,.42,-.27+j*.14],[2.45,.1,.1],P.wood);for(const xx of [-.85,.85])box([xx,.23,0],[.13,.4,.65],P.dark)})}
 bench(10.4,11.1);bench(18.8,3,Math.PI/2);bench(18.8,-4,Math.PI/2);bench(-18.7,0,Math.PI/2);

 // Paving relief, movement joints, pool coping and walkable threshold.
 for(let i=0;i<36;i++){const x=-17.5+i*.99;box([x,.622,12.78],[.025,.007,.88],P.edge);}
 for(const z of [9.50,12.15])box([-11,.815,z],[9.25,.08,.15],P.ivory);
 for(const x of [-15.55,-6.45])box([x,.815,10.8],[.15,.08,2.8],P.ivory);
 for(const x of [-5.7,5.7])for(const z of [11.3,13.2]){cyl([x,.91,z],[.09,.90,.09],P.dark);cyl([x,1.29,z],[.094,.045,.094],P.warm);}
 for(let i=0;i<19;i++)box([-18.45,.44,-12.5+i*1.4],[.23,.16,1.34],P.stone);
 // Perforated tree grates and gently curved landscape seating ends.
 for(const z of [-9,-2,6])for(const x of [-15.4,15.1]){add('torus',[x,.992,z],[1.5,.28,1.5],P.metal);}
 at([4.55,.73,10.8],0,()=>{bevel([0,.8,0],[.35,1.6,.20],P.dark);box([0,1.08,.106],[.29,.37,.015],P.screen);box([0,.66,.11],[.25,.035,.01],P.brass);});
 // Cycle racks, charging points and two small vehicles.
 for(let i=0;i<4;i++){const x=17.8+i*.85;pipe([x,.4,10.6],[x,1.2,10.6],.04,P.metal);pipe([x,1.2,10.6],[x,1.2,11.4],.04,P.metal);pipe([x,1.2,11.4],[x,.4,11.4],.04,P.metal)}
 function car(x,z,ang,col){at([x,.38,z],ang,()=>{round([0,.50,0],[1.8,.55,3.8],col);round([0,.94,-.2],[1.55,.65,2.1],P.spandrel);round([0,1.23,-.2],[1.52,.08,1.7],col);for(const xx of [-.91,.91])for(const zz of [-1.11,1.1]){cyl([xx,.35,zz],[.32,.18,.32],P.black,[0,0,Math.PI/2]);cyl([xx*1.05,.35,zz],[.17,.025,.17],P.metal,[0,0,Math.PI/2])}for(const xx of [-.61,.61]){round([xx,.57,1.91],[.42,.13,.055],P.warm);round([xx,.57,-1.91],[.42,.12,.055],P.redLed)}box([0,.55,1.944],[.40,.11,.02],P.white)})}
 car(-21,-8,0,P.white);car(11,16.6,Math.PI/2,P.blue);car(-21,4,Math.PI,P.dark);
 for(const z of [-8,4]){round([-18.6,.43,z],[.62,.14,.60],P.stone);round([-18.6,1.04,z],[.48,1.12,.42],P.white);box([-18.6,1.3,z+.22],[.3,.35,.03],P.screen);box([-18.6,.67,z+.23],[.32,.12,.04],P.led)}
 function person(x,z,ang,col){at([x,.57,z],ang,()=>{for(const xx of [-.1,.1]){cyl([xx,.38,0],[.067,.71,.067],P.charcoal);round([xx,.07,.06],[.16,.12,.29],P.black)}round([0,.96,0],[.4,.53,.26],col);ball([0,1.42,0],[.15,.19,.15],P.wood);for(const xx of [-.27,.27])cyl([xx,.95,0],[.055,.54,.055],col,[0,0,xx>0?.15:-.15])})}
 person(-2,10.5,.3,P.ivory);person(2,11.2,-1,P.blue);person(6,13,-.8,P.white);
 // Continuous urban ground and adjoining blocks anchor the monitored building.
 set(-1,'context');
 const districtPaving=material('#bbc5bf',.96,0,0,1),districtWall=material('#b8c3bd',.86,0,0,6),districtGlass=material('#718b8c',.38,.18),districtRoof=material('#a1ada7',.93);
 box([0,.14,0],[360,.34,360],districtPaving);
 for(const [x,z,w,d] of [[-86,16.35,124,5.5],[87,16.35,126,5.5],[-21,-83,5,135],[-21,85,5,134],[29,-3,7,170],[0,-23,180,7],[0,41,180,7],[-65,-4,7,170],[0,-76,240,8],[87,-4,8,170]])box([x,.34,z],[w,.06,d],P.road);
 for(let k=-140;k<=140;k+=4.2){
  if(k < -24 || k >24)box([k,.379,16.35],[2.1,.014,.09],P.paint);
  if(k < -16 || k >16)box([-21,.379,k],[.09,.014,2.1],P.paint);
  for(const z of [-23,41,-76])if(Math.abs(k+21)>5&&Math.abs(k-29)>6&&Math.abs(k+65)>6&&Math.abs(k-87)>6)box([k,.379,z],[2.1,.014,.09],P.paint);
  if(k>-82&&k<81)for(const x of [29,-65,87])if(Math.abs(k+23)>6&&Math.abs(k-41)>6&&Math.abs(k-16.35)>5)box([x,.379,k],[.09,.014,2.1],P.paint);
 }
 // Kerbs, planted medians and crossings define the block edges.
 for(const x of [-24.1,-17.9,24.9,33.1])for(const [a,b] of [[-70,-28],[-18,12],[21,36],[46,77]])box([x,.43,(a+b)/2],[.25,.22,b-a],P.stone);
 for(const z of [-27.1,-18.9,37,45])for(const [a,b] of [[-60,-26],[-16,24],[35,82]])box([(a+b)/2,.43,z],[b-a,.22,.25],P.stone);
 for(const x of [-29,-13,21,37])for(let i=-3;i<=3;i++)box([x,.382,-23+i*.77],[2.5,.014,.42],P.paint);
 for(const z of [9.5,23,34,48])for(let i=-3;i<=3;i++)box([29+i*.77,.382,z],[.42,.014,2.5],P.paint);
 // Neighbouring offices have roof equipment and recessed window bands.
 function districtBuilding(x,z,w,d,h){at([x,.32,z],0,()=>{
  box([0,.13,0],[w+3,.26,d+3],P.stone);box([0,h/2+.26,0],[w,h,d],districtWall);
  for(let y=1.4;y<h-.6;y+=3.05){
   for(const side of [-1,1]){box([0,y,side*(d/2+.012)],[w-.8,1.55,.04],districtGlass);box([side*(w/2+.012),y,0],[.04,1.55,d-.8],districtGlass);}
   for(let xx=-w/2+.7;xx<w/2;xx+=1.8)for(const side of [-1,1])box([xx,y,side*(d/2+.05)],[.11,1.73,.12],districtWall);
   for(let zz=-d/2+.7;zz<d/2;zz+=1.8)for(const side of [-1,1])box([side*(w/2+.05),y,zz],[.12,1.73,.11],districtWall);
   box([0,y+1,0],[w+.25,.15,d+.25],districtWall);
  }
  box([0,h+.30,0],[w-.5,.18,d-.5],districtRoof);
  for(const side of [-1,1]){box([side*(w/2-.12),h+.52,0],[.24,.55,d],districtWall);box([0,h+.52,side*(d/2-.12)],[w,.55,.24],districtWall);}
  box([-w*.22,h+.83,0],[w*.22,1.2,d*.35],P.edge);box([w*.21,h+.50,-d*.18],[w*.23,.28,d*.25],P.solar);
  box([0,1.25,d/2+.025],[2.5,2.5,.10],districtGlass);box([0,2.63,d/2+.65],[4,.18,1.6],P.ivory);
 });}
 for(const b of [[-43,-43,26,23,13],[4,-47,28,28,10],[52,-43,27,26,16],[-46,-3,21,23,6],[56,3,28,17,7],[-42,64,23,23,7],[54,65,27,21,10],[-91,-45,27,29,18],[5,-101,31,28,21],[53,-101,28,31,16],[-47,-101,23,28,24]])districtBuilding(...b);
 for(const [x,z,w,d] of [[5,29,34,10],[-43,28,28,10],[52,27,29,10],[4,-32,29,6]]){
  box([x,.56,z],[w,.46,d],P.stone);box([x,.80,z],[w-.5,.05,d-.5],P.grass);
  for(let xx=x-w/2+2;xx<x+w/2;xx+=5){round([xx,.83,z],[2.2,.2,2.2],P.soil);tree(xx,z,3.8);}
 }
 for(const z of [-61,-34,-9,29,57])for(const x of [-25.8,35]){round([x,.65,z],[2.4,.58,2.4],P.stone);round([x,.95,z],[2.1,.035,2.1],P.soil);tree(x,z,4.3);}
 for(const z of [-51,-13,29,60])for(const x of [-16,24]){cyl([x,3.05,z],[.065,5.4,.065],P.dark);box([x,5.75,z],[1.3,.09,.22],P.dark);box([x+.3,5.70,z],[.65,.025,.2],P.warm);}
 for(let x=-9;x<=14;x+=3.1){for(const dx of [-1.3,1.3])box([x+dx,.373,34.3],[.055,.015,4.7],P.paint);if(x<9)car(x,34.2,0,x%2?P.edge:P.white);}
 car(27,-9,0,P.white);car(31,32,Math.PI,P.blue);car(-43,14.9,Math.PI/2,P.edge);car(3,-24.8,Math.PI/2,P.white);car(-19.5,-39,Math.PI,P.blue);
 at([15,.38,20.9],0,()=>{for(const x of [-2.8,2.8])box([x,1.4,0],[.1,2.8,.1],P.dark);box([0,2.84,0],[6.2,.16,2.1],P.ivory);box([0,1.5,-.6],[5.8,2.3,.05],districtGlass);box([0,.55,-.2],[4.8,.1,.6],P.wood);box([2.95,1.45,.7],[.08,2.5,.55],P.dark);});
 person(12,20.5,.4,P.blue);person(17,21.4,-.7,P.ivory);
 // Isolated-floor presentation base (only visible in floor mode).
 set(-3,'platform');box([0,.16,0],[24.1,.38,17.0],P.stone);box([0,.36,0],[24.3,.03,17.2],P.edge);
 for(let f=0;f<6;f++){
  const base=.91+f*3.7;set(f,'structure',base);
  
  if(f===0){bevel([0,0,0],[22.3,.27,15.3],P.ivory);box([0,.155,0],[21.95,.055,14.95],P.floor);}
  else {
   box([1.375,0,0],[19.55,.27,15.3],P.ivory);box([1.287,.155,0],[19.375,.055,14.95],P.floor);
   box([-9.775,0,1.675],[2.75,.27,11.95],P.ivory);box([-9.687,.155,1.588],[2.575,.055,11.775],P.floor);
   box([-9.775,0,-7.325],[2.75,.27,.65],P.ivory);box([-9.775,.155,-7.237],[2.75,.055,.475],P.floor);
   box([-10.85,0,-5.65],[.6,.27,2.7],P.ivory);box([-10.762,.155,-5.65],[.425,.055,2.7],P.floor);
  }

  for(const z of [-7.48,7.48])box([0,.08,z],[22.2,.14,.16],P.edge);
  for(const x of [-10.98,10.98])box([x,.38,0],[.16,.47,15],P.ivory);
  box([0,.38,-7.45],[22,.47,.16],P.ivory);box([0,.30,7.45],[22,.28,.14],P.ivory);
  for(const x of [-10.52,10.52])for(const z of [-7.0,7])box([x,1.9,z],[.35,3.45,.35],P.ivory);
  // Elevator and stair core: intentionally open at the circulation corridor.
  kind='interior';box([-6.45,1.48,-4.6],[3.8,2.6,.18],P.ivory);box([-10.4,1.48,-3.1],[.18,2.6,3.1],P.ivory);
  box([-7.5,1.48,-1.55],[5.75,2.6,.19],P.stone);
  for(const x of [-8.65,-6.24]){box([x,1.45,-1.428],[1.55,2.45,.08],P.dark);box([x,1.40,-1.37],[1.39,2.22,.04],P.metal);box([x,1.4,-1.338],[.023,2.2,.013],P.dark);box([x,2.70,-1.32],[.52,.15,.026],P.screen);box([x+.91,1.38,-1.33],[.10,.23,.03],P.charcoal);ball([x+.91,1.43,-1.305],[.018,.02,.01],P.led)}

  // 22 risers = 3.70 m: two flights with a shared intermediate landing.
  const rise=3.7/22,tread=.20;
  for(let i=0;i<11;i++){
   box([-10.00,.182+(i+.5)*rise,-6.77+i*tread],[.85,rise,.22],P.stone);
   box([-10.00,.184+(i+1)*rise,-6.84+i*tread],[.85,.019,.045],P.brass);
   kind='stair-upper';box([-8.95,.182+(11+i+.5)*rise,-4.77-i*tread],[.85,rise,.22],P.stone);
   box([-8.95,.184+(12+i)*rise,-4.70-i*tread],[.85,.019,.045],P.brass);kind='interior';
  }
  box([-9.48,1.975,-4.47],[1.98,.15,.49],P.stone);
  box([-9.48,1.01,-4.57],[1.86,1.79,.12],P.ivory);
  pipe([-10.44,2.84,-4.20],[-8.51,2.84,-4.20],.025,P.metal);
  for(const x of [-10.44,-9.48,-8.51])pipe([x,2.00,-4.20],[x,2.84,-4.20],.013,P.metal);
  kind='stair-upper';box([-8.95,3.79,-7.12],[1.03,.17,.68],P.stone);kind='interior';
  pipe([-10.44,1.02,-6.83],[-10.44,2.82,-4.63],.025,P.metal);
  kind='stair-upper';pipe([-8.51,2.86,-4.63],[-8.51,4.53,-6.80],.025,P.metal);kind='interior';
  for(let i=0;i<6;i++){
   pipe([-10.44,.35+i*.336,-6.77+i*.40],[-10.44,1.02+i*.336,-6.77+i*.40],.013,P.metal);
   kind='stair-upper';pipe([-8.51,2.18+i*.336,-4.77-i*.40],[-8.51,2.85+i*.336,-4.77-i*.40],.013,P.metal);kind='interior';
  }
  // Angled stringers support the stair. No isolated floating treads.
  pipe([-10.3,.25,-6.86],[-10.3,1.94,-4.48],.062,P.dark);
  pipe([-9.66,.25,-6.86],[-9.66,1.94,-4.48],.062,P.dark);
  kind='stair-upper';pipe([-9.26,1.92,-4.48],[-9.26,3.72,-6.87],.062,P.dark);
  pipe([-8.64,1.92,-4.48],[-8.64,3.72,-6.87],.062,P.dark);kind='interior';
  bevel([-6.25,.55,-6.4],[3.6,.73,.62],P.wood);box([-6.25,.93,-6.4],[3.68,.07,.69],P.stone);box([-6.45,1.3,-6.7],[4.0,2.2,.13],P.white);
  for(const x of [-7.4,-6.2,-5.0]){round([x,1.02,-6.35],[.62,.19,.49],P.white);round([x,1.113,-6.34],[.43,.018,.33],P.edge);cyl([x,1.11,-6.59],[.021,.27,.021],P.metal);pipe([x,1.24,-6.59],[x,1.24,-6.43],.021,P.metal)}
  if(f===0){
   round([1.8,.70,-1.2],[5.2,1.04,1.45],P.ivory);box([1.8,.70,-.457],[4.9,.85,.034],P.wood);box([1.8,1.26,-1.2],[5.2,.08,1.45],P.white);box([1.8,1.17,-.43],[4.7,.025,.02],P.brass);at([0,.315,0],0,()=>monitor(2.8,-1.25,Math.PI));chair(2.8,-2.83,0);
   box([1.9,1.65,-3.9],[7.0,2.9,.2],P.wood);for(let i=0;i<35;i++)box([-1.5+i*.2,1.65,-3.74],[.05,2.9,.09],P.brass);sign('CENTER',[-.5,1.8,-3.65],.70,P.ivory);
   for(const x of [-2.5,-.8,.9,2.6]){round([x,.71,4.5],[.35,1.0,1.25],P.metal);box([x,.91,4.5],[.07,.40,1.1],P.innerGlass);box([x,1.23,4.15],[.19,.025,.23],P.screen)}
   box([7,.20,2.3],[5.6,.024,6.3],P.carpet);sofa(7,4.3);sofa(7,.2,Math.PI);round([7,.53,2.2],[1.9,.18,1.0],P.wood);box([7,.32,2.2],[1.4,.3,.62],P.charcoal);plant(9.4,4.8,1.25);plant(4.5,-3.8,1.5);plant(-4.2,-.8,1.3);
   for(const z of [2,5]){cyl([-7,.84,z],[.82,.09,.82],P.wood);cyl([-7,.49,z],[.12,.62,.12],P.metal);chair(-8.2,z,Math.PI/2,P.soft);chair(-5.8,z,-Math.PI/2,P.soft)}
  }else if(f===1){
   box([3.5,.20,0],[13.2,.025,12.7],P.carpet);for(const x of [-.4,4.1,8.5])for(const z of [-4.8,-.6,3.5])desk(x,z);
   meeting(-7.2,3.7,4.0,1.6);partition(-3.9,3.5,7.4,Math.PI/2);plant(-4.2,-1.1);plant(9.5,6.0);plant(9.4,-6.2);
  }else if(f===2){
   box([3.8,.20,-3.1],[12.7,.025,6.8],P.carpet);for(const x of [-.3,4.0,8.3])for(const z of [-4.7,-.7])desk(x,z);
   meeting(5.7,4.6,5.1,1.7);partition(5.0,1.55,11.8);sofa(-7.4,4.8);sofa(-7.4,1.0,Math.PI);round([-7.4,.58,3.0],[1.6,.15,.92],P.wood);box([-7.4,.34,3.0],[1.0,.45,.45],P.white);plant(-4.1,5.9);plant(9.5,6.2);
  }else if(f===3){
   meeting(4.3,.8,8.0,2.1);partition(4.2,-2.8,13.0);for(const x of [0,4.4,8.6])desk(x,-5.4,Math.PI);partition(-3.3,3.1,8.0,Math.PI/2);desk(-7.3,1.35,Math.PI);sofa(-7.4,5.5);plant(9.5,5.7,1.35);plant(-4.4,-1.2);
   box([4.4,1.80,6.8],[3.8,1.5,.11],P.charcoal);box([4.4,1.8,6.73],[3.6,1.3,.012],P.screen);
   for(const x of [3.15,5.65]){bevel([x,.74,6.86],[.055,1.10,.08],P.metal);bevel([x,.22,6.86],[.62,.07,.70],P.dark);}
   pipe([4.4,1.05,6.89],[4.4,.22,6.89],.012,P.black);pipe([4.4,.22,6.89],[4.4,.22,7.25],.012,P.black);
  }else if(f===4){
   box([3.5,.20,.6],[13.5,.025,12.9],P.carpetDark);for(const x of [-.2,4.0,8.2])for(const z of [0,4.3])desk(x,z,Math.PI);
   box([4.1,1.7,-6.85],[10.5,2.8,.35],P.charcoal);box([4.1,.25,-6.85],[10.5,.16,.37],P.charcoal);for(let i=0;i<4;i++)for(let j=0;j<2;j++){box([.25+i*2.6,.93+j*1.34,-6.64],[2.5,1.26,.045],P.screen);for(let k=0;k<5;k++)box([-.65+i*2.6+k*.34,.94+j*1.34,-6.611],[.20,.25+rand()*.65,.007],k%2?P.blue:P.led)}
   rack(-8,3.0);rack(-6,3.0);plant(9.5,6.2);plant(-4.2,-.4);
  }else{
   for(const z of [-4.0,.15,4.1]){box([3.6,.21,z+1.1],[13.4,.03,1.25],P.blue);for(const x of [-1.4,.55,2.5,4.45,6.4,8.35])rack(x,z)}
   for(const x of [-8.7,-6.7,-4.7])hvac(x,4.6,0,true);
   for(const x of [-2.2,1.9,6.2]){pipe([x,2.95,-6.7],[x,2.95,6.65],.095,P.blue);pipe([x+.32,2.73,-6.7],[x+.32,2.73,6.65],.072,P.red);for(const z of [-3,2,6])box([x+.16,3.18,z],[.85,.05,.12],P.metal)}
   box([-5.9,.22,5.95],[6.0,.03,.13],P.orange);
   // Closed, vertically separated supply/return loops; no same-height pipe crossings.
   for(const z of [-6.7,6.65]){pipe([-2.2,2.95,z],[6.2,2.95,z],.095,P.blue);pipe([-1.88,2.73,z],[6.52,2.73,z],.072,P.red);}
   for(const [x,y,m] of [[-2.2,2.95,P.blue],[-1.88,2.73,P.red]]){
    pipe([x,y,-6.7],[x,.32,-6.7],.075,m);cyl([x,.25,-6.7],[.15,.055,.15],P.dark);
    cyl([x,2.10,-6.7],[.105,.045,.105],P.metal);pipe([x,1.6,-6.7],[x,1.6,-6.5],.026,P.metal);add('torus',[x,1.6,-6.48],[.30,.6,.30],m,[Math.PI/2,0,0]);
   }
   // Six foot-mounted gantry columns support the ladder trays and piping hangers.
   for(const z of [-4.0,.15,4.1])for(const x of [-3.1,10.35]){
    bevel([x,1.69,z],[.12,3.02,.12],P.metal);box([x,.22,z],[.34,.065,.34],P.charcoal);
    for(const dx of [-.11,.11])for(const dz of [-.11,.11])cyl([x+dx,.26,z+dz],[.022,.018,.022],P.metal);
   }
   for(const z of [-4.0,.15,4.1]){
    box([3.62,3.08,z],[13.60,.10,.11],P.metal);
    for(const x of [-2.2,1.9,6.2]){pipe([x+.16,3.11,z],[x+.16,2.62,z],.013,P.metal);box([x+.16,2.63,z],[.60,.035,.10],P.metal);}
   }

  }

  // Continuous skirting, acoustic panels, and washroom mirror over a supported vanity.
  box([-6.25,1.79,-6.60],[3.7,.82,.035],P.spandrel);box([-6.25,2.245,-6.57],[3.7,.025,.045],P.warm);
  box([-7.48,.28,-1.43],[5.72,.14,.032],P.brass);
  for(const x of [-10.93,10.93])box([x,.235,0],[.055,.085,14.75],P.dark);
  // Lift-lobby soffit is cantilevered from the continuous core wall.
  box([-7.48,3.10,-.97],[5.88,.14,1.42],P.ivory);
  for(const x of [-9.8,-7.4,-5.2]){box([x,3.01,-.95],[.15,.02,.85],P.warm);box([x,2.94,-1.32],[.07,.22,.40],P.metal);}
  // Fixed supports remain visible after the curtain wall is cut away.
  box([-4.2,1.55,-6.99],[1.05,2.72,.14],P.ivory);
  box([-4.11,1.48,-1.51],[1.10,2.60,.18],P.stone);
  bevel([-.5,.72,6.68],[.115,1.06,.12],P.metal);box([-.5,.211,6.68],[.30,.055,.27],P.dark);
  cyl([-9.5,1.40,5.65],[.038,2.43,.038],P.metal);cyl([-9.5,.22,5.65],[.17,.06,.17],P.dark);
  // Emergency cabinet with hose reel and extinguisher, at the elevator landing.
  at([-4.86,.18,-1.32],0,()=>{
   bevel([0,.78,0],[.64,1.18,.24],P.red);box([0,.79,.13],[.53,1.02,.015],P.white);
   cyl([0,1.0,.16],[.19,.04,.19],P.red,[Math.PI/2,0,0]);add('torus',[0,1.0,.188],[.32,.4,.32],P.dark,[Math.PI/2,0,0]);
   cyl([-.11,.48,.17],[.082,.32,.082],P.red);box([-.11,.66,.17],[.12,.05,.05],P.black);box([.24,.74,.162],[.017,.15,.022],P.metal);
  });
  // Slim wall-wash fixtures and downlight housings (the ceiling is cut away).
  for(const x of [-8.6,-6.2]){box([x,2.91,-1.37],[1.65,.085,.22],P.ivory);box([x,2.862,-1.34],[1.5,.009,.15],P.warm);}
  // Accent textile and fitted millwork; each floor has its own use pattern.
  if(f===0){
   for(let j=0;j<6;j++)box([1.8,1.20,-.436+j*.025],[4.78,.018,.008],P.brass);
   box([1.8,.212,1.45],[6.2,.029,3.5],P.stone);for(const x of [-1.35,4.95])box([x,.231,1.45],[.032,.01,3.55],P.brass);
   cyl([7,.655,2.2],[.20,.12,.20],P.ivory);add('leaf',[7,.93,2.2],[.20,.6,.36],P.leaf,[-.4,.3,.1]);
   for(let j=0;j<3;j++)box([6.45,.65+j*.022,2.3],[.35,.02,.46],j%2?P.ivory:P.blue);
   // Curved reception visitor bench and check-in display.
   bevel([-.2,1.56,-1.16],[.36,.47,.045],P.charcoal,[.15,0,0]);box([-.2,1.35,-1.3],[.035,.15,.12],P.metal);
  }
  if(f===1||f===2){
   // Pantry replaces a previously empty strip of corridor. Drawer gaps and coffee equipment are modeled.
   at([-2.55,.18,-5.55],Math.PI/2,()=>{
    bevel([0,.43,0],[2.6,.86,.66],P.wood);box([0,.905,0],[2.72,.08,.77],P.ivory);
    for(const x of [-.86,0,.86]){box([x,.46,.346],[.014,.78,.01],P.dark);box([x+.27,.74,.36],[.30,.025,.021],P.brass);}
    bevel([-.75,1.26,-.04],[.43,.57,.44],P.charcoal);box([-.75,1.10,.19],[.31,.11,.055],P.metal);cyl([-.75,1.15,.18],[.056,.11,.056],P.white);
    for(const x of [.2,.47,.74]){cyl([x,1.04,.12],[.064,.16,.064],P.white);}
    box([0,.96,-.44],[2.70,1.78,.10],P.ivory);box([0,1.78,-.38],[2.70,.11,.44],P.wood);for(let j=0;j<8;j++)box([-.65+j*.15,1.92,-.28],[.08,.26,.22],j%3?P.soft:P.blue);
   });
   for(const x of [-3.75,10.3])plant(x,6.18,.73);
   bevel([-10.38,1.62,2.6],[.16,2.88,3.06],P.ivory);box([-10.285,1.67,2.6],[.018,2.45,2.86],P.dark);
   for(let j=0;j<11;j++)box([-10.25,1.68,1.4+j*.24],[.06,2.3,.056],P.wood);
  }
  if(f===3){
   box([4.4,3.10,.8],[8.9,.12,.11],P.charcoal);box([4.4,3.035,.8],[8.7,.013,.078],P.warm);
   for(const x of [.15,8.65]){box([x,3.35,-1.0],[.055,.09,3.68],P.metal);pipe([x,3.18,.8],[x,3.35,.8],.015,P.metal);box([x,2.98,-2.79],[.075,.75,.085],P.metal);}
   for(let j=0;j<4;j++){const x=1+j*2.25;bevel([x,1.025,.8],[.5,.04,.35],P.charcoal);bevel([x,1.21,.64],[.5,.34,.018],P.charcoal,[-.20,0,0]);box([x,1.22,.66],[.44,.27,.004],P.screen,[-.20,0,0]);}
  }
  if(f===4){
   for(let j=0;j<16;j++)box([-.7+j*.64,.35,-6.60],[.24,.03,.04],P.warm);
   for(const x of [-9.45,-5.25]){box([x,1.36,3.0],[.06,2.4,2.0],P.innerGlass);}
  }
  if(f===5){
   // 600 mm raised-floor panels, perforated cold aisles and overhead ladder trays.
   for(const z of [-2.85,1.3,5.25]){
    for(let j=0;j<20;j++)box([-2.5+j*.59,.235,z],[.55,.025,.56],material('#8b9c9e',.62,.32,0,14));
    for(const x of [-2.7,10.1])box([x,.25,z],[.055,.012,1.1],P.orange);
   }
   for(const z of [-4.0,.15,4.1]){
    for(const zz of [-.24,.24])box([3.6,3.17,z+zz],[13.4,.09,.045],P.metal);
    for(let j=0;j<38;j++)box([-3+j*.355,3.15,z],[.038,.048,.49],P.metal);
    for(let k=0;k<4;k++)pipe([-3,3.22+k*.016,z-.13+k*.08],[10.3,3.22+k*.016,z-.13+k*.08],.014,k%2?P.blue:P.orange);
   }
  }
  // Every point has a matching physical equipment model (positions match data.js).
  kind='equipment';
  hvac(8.6,-6.15); // AC
  at([-9.5,2.62,5.65],-.45,()=>{pipe([0,0,0],[.30,0,0],.045,P.metal);round([.42,-.05,0],[.42,.24,.64],P.white,[-.22,0,0]);cyl([.42,-.12,.33],[.087,.06,.087],P.black,[Math.PI/2,0,0]);ball([.51,-.11,.34],[.018,.018,.01],P.redLed)});
  cyl([-7.4,2.96,-.73],[.18,.10,.18],P.white);cyl([-7.4,2.89,-.73],[.12,.07,.12],P.edge);ball([-7.32,2.85,-.71],[.026,.013,.026],P.led);
  round([-4.0,1.60,-1.36],[.27,.32,.09],P.white);box([-4.0,1.64,-1.307],[.19,.13,.011],P.screen);
  round([-4.2,1.17,-6.84],[.70,1.2,.19],P.metal);box([-4.2,1.4,-6.734],[.42,.23,.018],P.screen);for(let j=0;j<3;j++)cyl([-4.4+j*.20,1.03,-6.72],[.044,.028,.044],P.charcoal,[Math.PI/2,0,0]);
  round([-.5,1.18,6.7],[.16,.24,.1],P.charcoal);box([-.5,1.20,6.756],[.10,.07,.009],P.led);

  // Curtain wall: glazing, gaskets, caps and external bronze fins are distinct geometry.
  kind='shell';
  const pane=f===0?lobbyGlass:P.glass;
  // Stone-clad corner piers run the full storey height and close the glazing grid at each corner.
  for(const x of [-11.02,11.02])for(const z of [-7.58,7.58]){box([x,1.85,z],[.72,3.7,.72],P.stone);box([x,3.47,z],[.78,.22,.78],P.ivory);}
  for(const z of [-7.61,7.61]){
   const side=Math.sign(z);
   box([0,.43,z],[22,.43,.105],P.spandrel);
   bevel([0,3.47,z+side*.065],[22.38,.215,.39],P.ivory);
   box([0,3.32,z+side*.112],[22.23,.036,.31],P.dark);
   box([0,3.405,z+side*.268],[22.40,.022,.030],P.brass);
   box([0,3.296,z+side*.207],[22.1,.014,.055],P.warm);
   for(let i=0;i<11;i++){
    const x=-10+i*2;
    box([x,1.97,z],[1.936,2.65,.027],pane);
    box([x-1,1.88,z+side*.045],[.055,3.47,.12],P.dark);
    box([x,2.68,z+side*.031],[1.96,.035,.065],P.metal);
    box([x, .70,z+side*.035],[1.96,.032,.067],P.brass);
    // A few partially lowered interior blinds add variation without opaque glass.
    if(f>0&&(i+f)%4===0)for(let j=0;j<8;j++)box([x,3.13-j*.052,z-side*.17],[1.75,.025,.07],P.soft,[-.22,0,0]);
    // South elevation: aluminium light shelf at transom height, between the fins.
    if(side>0&&f>0){box([x,2.74,z+.36],[1.84,.045,.62],P.metal,[.06,0,0]);box([x,2.705,z+.64],[1.84,.05,.035],P.edge);for(const dx of [-.62,.62])box([x+dx,2.64,z+.30],[.03,.16,.5],P.dark);}
   }
   for(let i=0;i<=11;i++){
    const x=-11+i*2;
    bevel([x,1.92,z+side*.30],[.11,3.38,.44],i%2?P.brass:P.ivory);
    for(const y of [.80,3.05])box([x,y,z+side*.18],[.16,.045,.26],P.metal);
   }
  }
  for(const x of [-11.06,11.06]){
   const side=Math.sign(x);
   box([x,.43,0],[.105,.43,15.2],P.spandrel);
   bevel([x+side*.06,3.47,0],[.39,.215,15.3],P.ivory);
   box([x+side*.11,3.32,0],[.31,.036,15.17],P.dark);
   box([x+side*.268,3.405,0],[.03,.022,15.35],P.brass);
   box([x+side*.207,3.296,0],[.055,.014,15.1],P.warm);
   for(let i=0;i<8;i++){
    const z=-6.65+i*1.9;
    box([x,1.97,z],[.027,2.65,1.835],pane);
    box([x+side*.045,1.88,z-.95],[.12,3.47,.052],P.dark);
    box([x+side*.034,2.68,z],[.065,.035,1.86],P.metal);
    bevel([x+side*.25,1.92,z-.95],[.38,3.38,.11],P.brass);
   }
  }
 }
 // Entrance canopy and glazing joint details belong to exterior only.
 set(-1,'exterior');box([0,4.05,9.0],[11.0,.20,4.1],P.ivory);box([0,4.17,11.02],[11.1,.12,.08],P.metal);box([0,4.18,9.0],[10.75,.025,3.82],P.glass);for(const x of [-5.2,5.2])box([x,2.42,10.8],[.13,3.4,.13],P.metal);sign('CENTER',[-2.3,3.54,11.07],.78);
 box([0,3.932,9.0],[10.7,.04,3.88],P.wood);
 for(let j=0;j<27;j++)box([-5.15+j*.396,3.887,9.0],[.045,.050,3.76],P.brass);
 for(const z of [7.6,10.87])box([0,3.895,z],[10.45,.022,.044],P.warm);
 for(const x of [-2.2,2.2])box([x,2.14,8.17],[.06,2.75,.96],P.metal);
 box([0,3.55,8.60],[4.46,.13,.11],P.dark);
 for(const x of [-1.1,1.1]){box([x,2.18,8.6],[2.12,2.57,.033],P.innerGlass);box([x,2.18,8.64],[.032,2.5,.043],P.metal);pipe([x*.18,1.64,8.67],[x*.18,2.25,8.67],.019,P.brass);}
 box([0,.888,8.20],[4.20,.018,1.17],P.carpetDark);

 // Roof: photovoltaic field, chillers, maintenance paths and landscaped terrace.
 set(6,'roof',23.11);box([0,0,0],[22.6,.34,15.6],P.ivory);box([0,.20,0],[21.9,.055,14.9],P.floor);
 for(const z of [-7.45,7.45])box([0,.55,z],[22.3,.74,.15],P.ivory);for(const x of [-11.1,11.1])box([x,.55,0],[.15,.74,15.0],P.ivory);
 // Folded aluminium coping on the parapet, with a small drip edge on the outside.
 for(const z of [-7.45,7.45]){box([0,.94,z],[22.5,.05,.30],P.metal);box([0,.90,z+Math.sign(z)*.15],[22.5,.10,.02],P.metal);}
 for(const x of [-11.1,11.1]){box([x,.94,0],[.30,.05,15.2],P.metal);box([x+Math.sign(x)*.15,.90,0],[.02,.10,15.2],P.metal);}
 // Louvred screen around the chiller deck: posts, top rail and angled horizontal blades.
 const screenSide=(a,b,fixed,alongX)=>{const len=Math.hypot(b-a),mid=(a+b)/2,at2=(u,y)=>alongX?[u,y,fixed]:[fixed,y,u];
  for(let u=a;u<=b+.01;u+=(b-a)/Math.round((b-a)/2.2))box(at2(u,1.02),[.09,1.6,.09],P.dark);
  box(at2(mid,1.84),alongX?[len+.1,.06,.12]:[.12,.06,len+.1],P.dark);
  for(let j=0;j<8;j++)box(at2(mid,.42+j*.19),alongX?[len,.028,.20]:[.20,.028,len],P.metal,alongX?[.55,0,0]:[0,0,.55]);};
 screenSide(-4.1,8.9,-2.2,true);screenSide(-7.25,-2.2,8.9,false);screenSide(-7.25,-2.2,-4.1,false);
 box([-8.0,1.26,-4.5],[5.8,2.1,5.2],P.ivory);bevel([-8.0,2.37,-4.5],[5.97,.12,5.35],P.dark);for(let j=0;j<24;j++)box([-9.99+j*.217,1.25,-1.865],[.07,1.95,.09],P.brass);
 for(let j=0;j<3;j++)at([-.9+j*3.5,.24,-3.8],0,()=>{round([0,.53,0],[2.7,.90,2.4],P.metal);box([0,.08,0],[2.85,.16,2.55],P.charcoal);for(const x of [-.70,.70]){cyl([x,1.01,0],[.54,.09,.54],P.charcoal);for(const s of [.9,.64,.36])add('torus',[x,1.07,0],[s,1,s],P.metal);for(let k=0;k<5;k++)box([x,1.056,0],[.88,.018,.045],P.edge,[0,k/5*Math.PI,0]);cyl([x,1.09,0],[.11,.05,.11],P.metal)}for(let k=0;k<9;k++)box([0,.2+k*.078,1.22],[2.49,.022,.032],P.dark);pipe([0,.42,-1.25],[0,.42,-2.2],.09,P.blue)});
 for(let i=0;i<3;i++)for(let j=0;j<3;j++)at([-8.7+i*2.7,.27,1.0+j*1.7],0,()=>{box([0,.24,0],[2.48,.06,1.52],P.metal,[-.18,0,0]);box([0,.283,0],[2.38,.016,1.44],P.solar,[-.18,0,0]);for(const z of [-.55,.55]){const h=.24+Math.sin(.18)*z-.03;box([0,(h-.04)/2,z],[2.30,h+.04,.045],P.metal);box([0,-.02,z],[2.34,.04,.22],P.dark)}});
 box([6.6,.31,3.8],[7.5,.14,5.4],P.wood);for(let j=0;j<25;j++)box([3.0+j*.3,.39,3.8],[.018,.008,5.3],P.brass);
 for(const x of [3.1,10.1])for(const z of [1.3,6.25])box([x,1.76,z],[.10,2.8,.10],P.brass);
 for(const z of [1.3,6.25])bevel([6.61,3.052,z],[7.22,.16,.19],P.brass);
 for(let j=0;j<17;j++)box([3.05+j*.44,3.15,3.78],[.15,.15,5.2],P.ivory);
 at([0,.21,0],0,()=>{sofa(6.2,5.3);sofa(6.2,2.3,Math.PI);plant(9.4,5.3,1.0);plant(3.8,5.4);});round([6.2,.76,3.8],[1.5,.12,.75],P.wood);cyl([6.2,.54,3.8],[.34,.32,.34],P.dark);
 sign('CENTER',[3.1,.65,7.55],.87);

 // Mechanical services: trunk duct, flanged insulated piping and roof anchors.
 for(const j of [0,1,2]){
  const x=-.9+j*3.5;
  box([x,.46,-6.15],[.80,.46,1.12],P.metal);
  box([x,.71,-6.15],[.85,.037,1.17],P.edge);
  for(const z of [-6.56,-5.82])box([x,.43,z],[.9,.56,.038],P.dark);
  for(const xx of [x-.3,x+.3])box([xx,.285,-6.15],[.12,.11,1.4],P.charcoal);
 }
 pipe([-3.9,.71,-6.47],[8.5,.71,-6.47],.10,P.blue);
 pipe([-3.9,.71,-6.78],[8.5,.71,-6.78],.09,P.red);
 for(let i=0;i<13;i++){
  const x=-3.6+i*.95;
  cyl([x,.71,-6.47],[.145,.045,.145],P.metal,[0,0,Math.PI/2]);
  cyl([x,.71,-6.78],[.132,.045,.132],P.metal,[0,0,Math.PI/2]);
 }
 for(const x of [-3.4,1.2,5.4,8.3]){
  pipe([x,.23,-6.64],[x,.71,-6.64],.023,P.metal);box([x,.24,-6.64],[.38,.055,.70],P.dark);
  pipe([x,.71,-6.47],[x,1.06,-6.47],.026,P.metal);add('torus',[x,1.08,-6.47],[.27,.65,.27],P.red);
 }
 // Green buffer between technical deck and private roof terrace.
 round([.87,.50,3.3],[1.25,.59,6.1],P.ivory);box([.87,.807,3.3],[1.10,.02,5.93],P.soil);
 for(let j=0;j<9;j++)add('foliage',[.87,1.04,.63+j*.68],[.42,.46,.39],j%3?P.leaf3:P.leaf2);
 for(const x of [2.74,10.42]){
  box([x,1.17,3.83],[.028,1.35,5.12],P.innerGlass);pipe([x,1.89,1.28],[x,1.89,6.4],.025,P.brass);
  for(const z of [1.35,3.82,6.25])box([x,1.145,z],[.04,1.50,.04],P.brass);
 }
 box([6.58,1.17,6.45],[7.62,1.35,.028],P.innerGlass);pipe([2.74,1.89,6.45],[10.42,1.89,6.45],.025,P.brass);for(const x of [2.74,5.30,7.86,10.42])box([x,1.145,6.45],[.04,1.50,.04],P.brass);
 for(const x of [-10.7,10.7])for(const z of [-7.15,7.15]){box([x,.25,z],[.21,.02,.21],P.dark);for(let k=0;k<5;k++)box([x-.08+k*.04,.263,z],[.012,.006,.18],P.metal);}
 // Roof access door, ventilator and its framing.
 box([-7.5,1.24,-1.78],[1.18,1.89,.13],P.dark);box([-7.5,1.23,-1.702],[1.02,1.78,.025],P.metal);box([-7.1,1.2,-1.676],[.028,.19,.025],P.brass);
 for(const x of [-8.7,-6.3]){cyl([x,2.66,-3.65],[.21,.44,.21],P.metal);cyl([x,2.90,-3.65],[.30,.055,.30],P.edge);}
 // floor highlights: local geometry, activated for the selected alarm only.
 for(let f=0;f<6;f++){set(f,'alarm',.91+f*3.7);const glow=material('#e5a071',.5,0,.18,0,.23);box([7.8,.215,-5.5],[5.6,.015,3.1],glow);for(const z of [-7.0,-4.0])box([7.8,.232,z],[5.65,.014,.065],P.orange);for(const x of [5.0,10.6])box([x,.232,-5.5],[.065,.014,3.06],P.orange)}
 for(let f=0;f<6;f++){
  set(f,'smokeAlarm',.91+f*3.7);cyl([-7.4,.218,-.73],[1.65,.012,1.65],material('#e5aa70',.5,0,.2,0,.16));add('torus',[-7.4,.245,-.73],[3.4,.32,3.4],P.orange);
  set(f,'selection',.91+f*3.7);cyl([0,.238,0],[.75,.01,.75],material('#79a785',.5,0,.2,0,.20));add('torus',[0,.251,0],[1.55,.40,1.55],P.led);
 }
 return {items,floorHeight:3.7,floorBase:.91,palette:P};
};
