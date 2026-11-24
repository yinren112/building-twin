/* Architectural WebGL 2 renderer v2. Zero dependencies / WebGL 2.
 * Instanced geometry, analytic material reflection, filtered directional shadows,
 * normal/depth G-buffer, world-space contact AO, 4x MSAA (fine) or FXAA (balanced).
 * No image backgrounds, generated screenshots, CDN, or hidden external assets.
 */
'use strict';
(() => {
const M = Twin.math;
function geometry(kind) {
 const data=[];
 function tri(a,b,c,na,nb=na,nc=na) {
  // Every solid mesh is consistently CCW. Avoid shading inversions on curved meshes.
  if(M.dot(M.cross(M.sub(b,a),M.sub(c,a)),M.add(M.add(na,nb),nc))<0){[b,c]=[c,b];[nb,nc]=[nc,nb]}
  data.push(...a,...na,...b,...nb,...c,...nc);
 }
 if(['box','round','bevel'].includes(kind)) {
  const faces=[[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,0,1],[0,1,0]],[[0,1,0],[0,0,1],[1,0,0]],[[0,-1,0],[1,0,0],[0,0,1]],[[0,0,1],[1,0,0],[0,1,0]],[[0,0,-1],[0,1,0],[1,0,0]]];
  const r=kind==='bevel'?.025:.095,c=.5-r;
  const coords=kind==='box'?[-.5,.5]:[-.5,-c-r*.7071,-c,c,c+r*.7071,.5];
  for(const [normal,u,v] of faces) {
   const point=(a,b)=>{let q=normal.map((x,i)=>x*.5+u[i]*a+v[i]*b);if(kind==='box')return[q,normal];const core=q.map(x=>M.clamp(x,-c,c)),no=M.norm(M.sub(q,core));return [M.add(core,no.map(x=>x*r)),no]};
   for(let i=0;i<coords.length-1;i++)for(let j=0;j<coords.length-1;j++){
    const [a,na]=point(coords[i],coords[j]),[b,nb]=point(coords[i+1],coords[j]),[c,nc]=point(coords[i+1],coords[j+1]),[d,nd]=point(coords[i],coords[j+1]);tri(a,b,c,na,nb,nc);tri(a,c,d,na,nc,nd);
   }
  }
 } else if(kind==='sphere') {
  const nu=20,nv=12,pt=(u,v)=>[Math.sin(v)*Math.cos(u),Math.cos(v),Math.sin(v)*Math.sin(u)];
  for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){
   const a=pt(i/nu*6.2831853,j/nv*Math.PI),b=pt((i+1)/nu*6.2831853,j/nv*Math.PI),c=pt((i+1)/nu*6.2831853,(j+1)/nv*Math.PI),d=pt(i/nu*6.2831853,(j+1)/nv*Math.PI);tri(a,b,c,a,b,c);tri(a,c,d,a,c,d);
  }
 } else if(kind==='cylinder'||kind==='cone') {
  const count=32,top=kind==='cone'?0:1;
  for(let i=0;i<count;i++){
   const a=i/count*Math.PI*2,b=(i+1)/count*Math.PI*2,na=M.norm([Math.cos(a),kind==='cone'?1:0,Math.sin(a)]),nb=M.norm([Math.cos(b),kind==='cone'?1:0,Math.sin(b)]);
   const p1=[Math.cos(a),-.5,Math.sin(a)],p2=[Math.cos(b),-.5,Math.sin(b)],p3=[Math.cos(b)*top,.5,Math.sin(b)*top],p4=[Math.cos(a)*top,.5,Math.sin(a)*top];
   tri(p1,p4,p3,na,na,nb);tri(p1,p3,p2,na,nb,nb);tri([0,-.5,0],p1,p2,[0,-1,0]);if(top)tri([0,.5,0],p3,p4,[0,1,0]);
  }
 } else if(kind==='torus') {
  const pt=(u,v)=>[(.5+.035*Math.cos(v))*Math.cos(u),.035*Math.sin(v),(.5+.035*Math.cos(v))*Math.sin(u)],no=(u,v)=>[Math.cos(v)*Math.cos(u),Math.sin(v),Math.cos(v)*Math.sin(u)];
  for(let i=0;i<40;i++)for(let j=0;j<8;j++){
   const u=i/40*2*Math.PI,v=j/8*2*Math.PI,U=(i+1)/40*2*Math.PI,V=(j+1)/8*2*Math.PI;tri(pt(u,v),pt(U,V),pt(U,v),no(u,v),no(U,V),no(U,v));tri(pt(u,v),pt(u,V),pt(U,V),no(u,v),no(u,V),no(U,V));
  }
 } else if(kind==='leaf'||kind==='foliage') {
  const rng=M.random(7811),count=kind==='leaf'?1:76;
  for(let i=0;i<count;i++){
   const a=rng()*Math.PI*2,r=Math.cbrt(rng()),y=rng()*2-1;
   const p=kind==='leaf'?[0,0,0]:[Math.cos(a)*Math.sqrt(1-y*y)*r,y*r,Math.sin(a)*Math.sqrt(1-y*y)*r];
   const s=kind==='leaf'?1:.17+rng()*.19;
   const transform=kind==='leaf'?M.identity():M.compose(p,[s,s,s],[rng()*3.14,rng()*6.28,rng()*3.14]);
   const points=[[0,0,-.6],[-.32,.025,-.06],[0,.12,.08],[.32,.025,-.06],[0,.06,.62]];
   const q=points.map(p=>M.transform(transform,p).slice(0,3));
   for(const inds of [[0,1,2],[0,2,3],[1,4,2],[2,4,3]]){
    const [a,b,c]=inds.map(k=>q[k]),n=M.norm(M.cross(M.sub(b,a),M.sub(c,a)));tri(a,b,c,n);
   }
  }
 }
 return new Float32Array(data);
}
const vertex=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;layout(location=1) in vec3 aNormal;
layout(location=2) in mat4 aModel;layout(location=6) in vec4 aColor;layout(location=7) in vec4 aMaterial;
uniform mat4 uVP;uniform mat4 uLightVP;uniform vec3 uOffset;
out vec3 vWorld;out vec3 vNormal;out vec3 vLocal;out vec3 vScale;out vec4 vColor;out vec4 vMaterial;out vec4 vShadow;out float vUp;
void main(){vec4 w=aModel*vec4(aPosition,1.);w.xyz+=uOffset;vWorld=w.xyz;vLocal=aPosition;
 vec3 s2=vec3(dot(aModel[0].xyz,aModel[0].xyz),dot(aModel[1].xyz,aModel[1].xyz),dot(aModel[2].xyz,aModel[2].xyz));vScale=sqrt(s2);
 vNormal=normalize(mat3(aModel)*(aNormal/max(s2,vec3(.00001))));vUp=abs(aModel[1].y)/max(vScale.y,.00001);vColor=aColor;vMaterial=aMaterial;vShadow=uLightVP*w;gl_Position=uVP*w;}`;
const fragment=`#version 300 es
precision highp float;
in vec3 vWorld;in vec3 vNormal;in vec3 vLocal;in vec3 vScale;in vec4 vColor;in vec4 vMaterial;in vec4 vShadow;in float vUp;
uniform vec3 uEye;uniform vec3 uSun;uniform vec3 uBackground;uniform float uNight;uniform float uTime;uniform float uTint;uniform highp sampler2DShadow uShadow;uniform int uShadowTaps;
layout(location=0) out vec4 frag;layout(location=1) out vec4 gNormal;
const float PI=3.14159265;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
// Hardware-compared, bilinear PCF over a 16-tap Poisson disc: soft, stable penumbrae without noise.
const vec2 POISSON[16]=vec2[16](vec2(-.94,-.40),vec2(.95,-.77),vec2(-.09,-.93),vec2(.34,.29),vec2(-.92,.46),vec2(-.82,-.88),vec2(-.38,.28),vec2(-.26,-.39),vec2(.97,.19),vec2(.44,-.88),vec2(.53,-.17),vec2(.79,.62),vec2(-.24,.99),vec2(-.81,.91),vec2(.20,.79),vec2(.14,-.10));
float shadowValue(vec3 N){
 vec3 p=vShadow.xyz/vShadow.w*.5+.5;if(any(lessThan(p,vec3(0.)))||any(greaterThan(p,vec3(1.))))return 1.;
 float ndl=clamp(dot(N,uSun),0.,1.),bias=mix(.0010,.00030,ndl);vec2 texel=1./vec2(textureSize(uShadow,0));
 if(uShadowTaps<16){float s=0.;for(int x=0;x<2;x++)for(int y=0;y<2;y++)s+=texture(uShadow,vec3(p.xy+(vec2(x,y)-.5)*texel*1.4,p.z-bias));return s*.25;}
 float s=0.;for(int i=0;i<16;i++)s+=texture(uShadow,vec3(p.xy+POISSON[i]*texel*1.9,p.z-bias));return s/16.;
}
vec3 env(vec3 r,float rough){
 float sky=smoothstep(-.14,.64,r.y);vec3 c=mix(vec3(.18,.22,.20),vec3(.54,.70,.75),sky);
 float h=exp(-abs(r.y-.02)*12.);c=mix(c,vec3(.88,.91,.82),h*.6);
 float cloud=smoothstep(.42,.82,noise(r*vec3(5.,10.,5.)+vec3(0,2,4)));c=mix(c,vec3(.83,.85,.81),cloud*sky*(1.-rough)*.5);
 float city=step(r.y,.13)*step(-.14,r.y)*step(.50,hash(vec3(floor(atan(r.x,r.z)*23.),1,1)));
 c=mix(c,vec3(.19,.29,.30),city*.28*(1.-rough));
 return mix(c,vec3(.035,.065,.10)+c*.13,uNight);
}
float fresnel(float f){return pow(clamp(1.-f,0.,1.),5.);}
vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
void main(){
 vec3 N=normalize(vNormal);if(!gl_FrontFacing)N=-N;vec3 V=normalize(uEye-vWorld),R=reflect(-V,N);
 float rough=clamp(vMaterial.x,.06,.99),metal=vMaterial.y,em=vMaterial.z;int type=int(vMaterial.w+.1);vec3 base=pow(vColor.rgb,vec3(2.2));
 vec3 local=vLocal*vScale;vec2 uv=abs(N.y)>.7?vWorld.xz:(abs(N.z)>.7?vec2(vWorld.x,vWorld.y):vWorld.zy);
 if(type==1){vec2 q=abs(fract(uv*.65)-.5);vec2 fw=fwidth(uv*.65);float line=max(smoothstep(.5-fw.x*.7-.006,.5-fw.x*.1,q.x),smoothstep(.5-fw.y*.7-.006,.5-fw.y*.1,q.y));base*=1.-line*.15;base*=(.955+.09*hash(vec3(floor(uv*.65),2)))*(.965+.07*noise(vec3(vWorld.xz*.11,3.)));}
 if(type==2){float grain=sin(uv.x*90.+noise(vec3(uv*vec2(2.,9.),1))*7.)*.5+.5;float plank=1.-smoothstep(.474,.495,abs(fract(uv.x*3.)-.5));base*=.80+.17*grain+.03*plank;}
 if(type==6){float vein=noise(vWorld*vec3(2.,14.,2.));base*=.94+vein*.12;}
 if(type==7){vec2 cell=vec2(local.x*3.0,local.z*4.0),q=abs(fract(cell)-.5),fw=max(fwidth(cell),vec2(.018));float grid=max(smoothstep(.5-fw.x,.5,q.x),smoothstep(.5-fw.y,.5,q.y));base=mix(base,vec3(.050,.085,.11),grid*.40);base+=vec3(.025,.045,.07)*pow(max(dot(R,normalize(vec3(-.4,.8,.2))),0.),4.);}
 if(type==10){base*=.94+.06*sin(dot(vWorld,vec3(450.,0.,0.)));}
 if(type==11){float weave=hash(floor(vWorld*180.));base*=.84+.22*weave;vec2 q=abs(fract(vWorld.xz*2.)-.5);base*=1.-smoothstep(.49,.5,max(q.x,q.y))*.08;}
 if(type==14){vec2 q=fract(uv*28.)-.5;float holes=1.-smoothstep(.19,.28,length(q));base*=1.-holes*.68;}
 // Ribbed metal cladding: vertical trapezoidal ribs bend the normal; faded out when sub-pixel.
 if(type==12&&abs(N.y)<.6){vec3 T=abs(N.x)>.7?vec3(0,0,1):vec3(1,0,0);float u=dot(vWorld,T)*6.,fw=fwidth(u),rib=sin(u*6.2831853),keep=1.-smoothstep(.25,.8,fw);
  N=normalize(N+T*rib*.32*keep);R=reflect(-V,N);base*=1.-.10*keep*smoothstep(.55,.95,abs(rib));}
 if(type==9){base*=mix(.58,1.06,smoothstep(.05,.85,length(vLocal)));}
 // Contact darkening at the foot of upright instances (planters, kerbs, furniture, walls).
 float contact=1.;if(vUp>.96&&abs(N.y)<.6&&type!=9&&type!=3&&type!=8)contact=mix(.74,1.,smoothstep(0.,.42,(vLocal.y+.5)*vScale.y));
 float ndl=max(dot(N,uSun),0.),ndv=max(dot(N,V),.001),shadow=shadowValue(N);
 vec3 H=normalize(V+uSun);float ndh=max(dot(N,H),0.),vdh=max(dot(V,H),0.);
 float a=rough*rough,a2=a*a,den=ndh*ndh*(a2-1.)+1.;float D=a2/max(PI*den*den,.00001),k=(rough+1.)*(rough+1.)/8.;float G=ndv/(ndv*(1.-k)+k)*ndl/(ndl*(1.-k)+k);
 vec3 F0=mix(vec3(.04),base,metal),F=F0+(1.-F0)*fresnel(vdh);vec3 spec=D*G*F/max(4.*ndv*ndl,.001);
 vec3 sky=mix(vec3(.21,.23,.22),vec3(.66,.76,.81),N.y*.5+.5);
 vec3 diffuse=base*(1.-metal*.52);vec3 col=diffuse*sky*.67*contact;
 col+=(diffuse*.80+spec*.75)*ndl*shadow*vec3(1.24,1.12,.94)*mix(1.,contact,.5);
 // Image-based specular from the analytic sky, with horizon occlusion so it never leaks under surfaces.
 float horizon=clamp(1.+dot(R,N)*1.2,0.,1.);
 col+=env(R,rough)*mix(F0,vec3(1.),fresnel(ndv))*(1.-rough)*.44*horizon*horizon*contact;
 // Warm ground bounce, only on down-facing architectural surfaces.
 col+=diffuse*vec3(.20,.15,.095)*max(-N.y,0.);
 float alpha=vColor.a;
 if(type==3){
  // Each pane is a slightly different float-glass sheet: tiny tilt and tint changes break up the mirror.
  vec3 cell=floor(vWorld*vec3(.5,.2703,.5)+.5);float h1=hash(cell+7.1),h2=hash(cell+3.7);
  vec3 Rg=normalize(R+vec3(h1-.5,(h2-.5)*.6,h2-.5)*.11);
  float f=.08+.92*fresnel(ndv);vec3 reflected=env(Rg,rough)*(.88+.22*h1);
  reflected+=vec3(1.,.95,.85)*pow(max(dot(Rg,uSun),0.),220.)*2.2*shadow*(1.-uNight);
  col=mix(base*.34+reflected*.36,reflected,f*.76+.23);
  col+=spec*shadow*ndl*.18;alpha=clamp(alpha+f*.29,.12,.94);
 }
 if(type==4){
  vec3 ripple=normalize(N+vec3(sin(vWorld.x*15.+uTime*.65),0.,cos(vWorld.z*12.+uTime*.45))*.027);
  col=mix(col,env(reflect(-V,ripple),.12),.40+fresnel(ndv)*.45);
 }
 if(type==9){float back=pow(max(dot(-uSun,V),0.),3.);col+=base*(.22+back*.85)*(1.-shadow*.35);col*=.83+.25*noise(vWorld*3.);}
 if(uNight>.0){
  vec3 nc=diffuse*(vec3(.07,.13,.20)+ndl*shadow*vec3(.24,.31,.43));
  if(type==3){float lit=step(.34,hash(vec3(floor(vWorld.x/2.),floor(vWorld.y/3.7),floor(vWorld.z/1.9))));nc+=vec3(.32,.165,.055)*lit;nc+=env(R,rough)*.8;}
  // Architectural LED spill on the facade and roof; analytic accent, not GI.
  float floorBand=exp(-abs(mod(vWorld.y-.91,3.7)-3.48)*4.5);
  float wall=step(6.9,abs(vWorld.z))+step(10.7,abs(vWorld.x));
  nc+=base*vec3(.60,.32,.105)*floorBand*min(wall,1.)*.33;
  if(N.y>.8){float spots=exp(-length(vWorld.xz-vec2(0.,9.))*0.20)*exp(-abs(vWorld.y-.5)*2.);nc+=base*vec3(.45,.30,.13)*spots;}
  col=mix(col,nc,uNight);
 }
 col+=base*em*(1.+uNight*3.8);col=mix(col,vec3(.72,.21,.045),uTint*.2);
 col=pow(aces(col*1.10),vec3(1./2.2));
 float fog=smoothstep(145.,270.,length(vWorld-uEye));col=mix(col,uBackground,fog);
 if(type==8)col=uBackground*(.78+.22*shadow);
 frag=vec4(col,alpha);gNormal=vec4(N*.5+.5,type==9?.1:1.);
}`;
const depthVertex=`#version 300 es
precision highp float;layout(location=0) in vec3 aPosition;layout(location=2) in mat4 aModel;uniform mat4 uVP;uniform vec3 uOffset;
void main(){vec4 p=aModel*vec4(aPosition,1.);p.xyz+=uOffset;gl_Position=uVP*p;}`;
const depthFragment=`#version 300 es
precision highp float;void main(){}`;
const screenVertex=`#version 300 es
precision highp float;out vec2 vUV;void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUV=p;gl_Position=vec4(p*2.-1.,0.,1.);}`;
// Half-resolution contact AO followed by a depth-aware bilateral resolve.
// Samples outside the viewport are rejected, preventing a dark border at screen edges.
const aoFragment=`#version 300 es
precision highp float;in vec2 vUV;out vec4 frag;
uniform sampler2D uNormal;uniform sampler2D uDepth;uniform mat4 uInvVP;uniform vec2 uPixel;uniform float uRadius;uniform float uAO;
vec3 world(vec2 uv,float d){vec4 p=uInvVP*vec4(uv*2.-1.,d*2.-1.,1.);return p.xyz/p.w;}
void main(){
 float dep=texture(uDepth,vUV).r;vec4 nor=texture(uNormal,vUV);vec3 N=normalize(nor.xyz*2.-1.);float occ=0.;
 if(dep<.99999&&uAO>.0){
  vec3 P=world(vUV,dep);float angle=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)*6.283;
  for(int i=0;i<20;i++){
   float a=angle+float(i)*2.399963,r=sqrt((float(i)+.5)/20.);vec2 uv=vUV+vec2(cos(a),sin(a))*r*uRadius*uPixel;
   if(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))continue;
   float sd=texture(uDepth,uv).r;vec3 D=world(uv,sd)-P;float dist=length(D);
   if(sd<.99999&&dist>.025)occ+=max(dot(N,D/dist)-.14,0.)*(1.-smoothstep(.10,.9,dist));
  }
  occ=clamp(occ/20.*2.4,0.,.45)*nor.a*uAO;
 }
 frag=vec4(occ,0.,0.,1.);
}`;
// Bilateral AO resolve, then FXAA (only when the scene was not rendered with MSAA).
const postFragment=`#version 300 es
precision highp float;in vec2 vUV;out vec4 frag;
uniform sampler2D uColor;uniform sampler2D uDepth;uniform sampler2D uOcclusion;uniform vec2 uPixel;uniform vec2 uAOPixel;uniform float uAO;uniform float uFXAA;
float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
vec3 fxaa(vec2 uv){
 vec3 m=texture(uColor,uv).rgb,nw=texture(uColor,uv+vec2(-1,-1)*uPixel).rgb,ne=texture(uColor,uv+vec2(1,-1)*uPixel).rgb,sw=texture(uColor,uv+vec2(-1,1)*uPixel).rgb,se=texture(uColor,uv+vec2(1,1)*uPixel).rgb;
 float lm=luma(m),lnw=luma(nw),lne=luma(ne),lsw=luma(sw),lse=luma(se),lo=min(lm,min(min(lnw,lne),min(lsw,lse))),hi=max(lm,max(max(lnw,lne),max(lsw,lse)));
 if(hi-lo<max(.03,hi*.11))return m;
 vec2 dir=vec2(-((lnw+lne)-(lsw+lse)),(lnw+lsw)-(lne+lse));float reduce=max((lnw+lne+lsw+lse)*.03125,1./128.);
 dir=clamp(dir/(min(abs(dir.x),abs(dir.y))+reduce),-8.,8.)*uPixel;
 vec3 a=.5*(texture(uColor,uv-dir/6.).rgb+texture(uColor,uv+dir/6.).rgb),b=a*.5+.25*(texture(uColor,uv-dir*.5).rgb+texture(uColor,uv+dir*.5).rgb);
 float lb=luma(b);return lb<lo||lb>hi?a:b;
}
void main(){
 vec3 color=uFXAA>.5?fxaa(vUV):texture(uColor,vUV).rgb;float dep=texture(uDepth,vUV).r,occ=0.,weight=0.;
 if(uAO>.0)for(int x=-2;x<=2;x++)for(int y=-2;y<=2;y++){
  vec2 uv=vUV+vec2(x,y)*uAOPixel;float d=texture(uDepth,uv).r;
  float w=exp(-float(x*x+y*y)*.25)*exp(-abs(d-dep)*1000.);
  occ+=texture(uOcclusion,uv).r*w;weight+=w;
 }
 occ/=max(weight,.0001);color*=1.-occ;
 frag=vec4(color,1.);
}`;
class Renderer {
 constructor(canvas) {
  this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl2',{antialias:false,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
  if(!gl)throw new Error('需要支持 WebGL 2 的浏览器，请开启图形加速。');
  this.batch=[];this.meshes={};this.locations=new Map();this.shadowDirty=true;this.shadowSize=2048;this.ao=1;this.quality=1.5;
  this.program=this.makeProgram(vertex,fragment);this.depthProgram=this.makeProgram(depthVertex,depthFragment);this.postProgram=this.makeProgram(screenVertex,postFragment);this.aoProgram=this.makeProgram(screenVertex,aoFragment);
  this.lightVP=M.mul(M.ortho(-40,40,-39,45,.1,160),M.lookAt([-30,62,40],[0,14,0]));this.sun=M.norm([-30,48,40]);
  for(const kind of ['box','round','bevel','sphere','cylinder','cone','torus','leaf','foliage']){
   const data=geometry(kind),buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);this.meshes[kind]={buffer,count:data.length/6};
  }
  this.shadowTexture=this.texture(gl.DEPTH_COMPONENT24,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,this.shadowSize,this.shadowSize,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);
  this.maxSamples=Math.min(4,gl.getParameter(gl.MAX_SAMPLES)||0);this.samples=0;
  this.shadowFBO=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFBO);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,this.shadowTexture,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);this.checkFBO('shadow');gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);this.drawCalls=0;this.triangles=0;this.frameMs=0;this.frames=0;this.fence=null;this.lastGPUWaitMs=0;
 }
 makeProgram(vs,fs){const gl=this.gl;const shader=(type,code)=>{let s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(s);gl.deleteShader(s);throw new Error(log)}return s};const v=shader(gl.VERTEX_SHADER,vs),f=shader(gl.FRAGMENT_SHADER,fs),p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
 loc(p,name){let k=this.locations.get(p);if(!k){k={};this.locations.set(p,k)}if(!(name in k))k[name]=this.gl.getUniformLocation(p,name);return k[name];}
 texture(internal,format,type,w,h,filter=this.gl.NEAREST){const g=this.gl,t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.texImage2D(g.TEXTURE_2D,0,internal,w,h,0,format,type,null);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,filter);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,filter);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);return t;}
 checkFBO(label){const g=this.gl;if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE)throw new Error(label+' framebuffer incomplete');}
 load(items){
  const gl=this.gl,groups=new Map();
  for(const item of items){const key=[item.shape,item.floor,item.kind,item.detail?'detail':'base',item.color[3]<.99?'T':'O'].join(':');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(item)}
  for(const arr of groups.values()){
   const o=arr[0],data=new Float32Array(arr.length*24);arr.forEach((it,i)=>{data.set(it.matrix,i*24);data.set(it.color,i*24+16);data.set(it.material,i*24+20)});
   const vao=gl.createVertexArray();gl.bindVertexArray(vao);const mesh=this.meshes[o.shape];gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);
   const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,o.color[3]<.99?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);
   for(let j=0;j<4;j++){gl.enableVertexAttribArray(2+j);gl.vertexAttribPointer(2+j,4,gl.FLOAT,false,96,j*16);gl.vertexAttribDivisor(2+j,1)}
   for(let j=0;j<2;j++){gl.enableVertexAttribArray(6+j);gl.vertexAttribPointer(6+j,4,gl.FLOAT,false,96,64+j*16);gl.vertexAttribDivisor(6+j,1)}
   this.batch.push({vao,buffer,vertices:mesh.count,count:arr.length,floor:o.floor,kind:o.kind,detail:!!o.detail,transparent:o.color[3]<.99,items:arr,data});
  }
  gl.bindVertexArray(null);this.instances=items.length;this.totalTriangles=items.reduce((sum,x)=>sum+this.meshes[x.shape].count/3,0);
 }
 resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight,dpr=Math.min(this.quality>1?Math.max(devicePixelRatio||1,this.quality):1,2,Math.sqrt((this.quality>1?2400000:1100000)/Math.max(w*h,1)));const pw=Math.max(1,Math.round(w*dpr)),ph=Math.max(1,Math.round(h*dpr));const samples=this.quality>1?this.maxSamples:0;if(this.canvas.width!==pw||this.canvas.height!==ph||!this.sceneFBO||samples!==this.samples){this.samples=samples;this.canvas.width=pw;this.canvas.height=ph;this.resizeTargets(pw,ph)}return [w,h];}
 resizeTargets(w,h){const g=this.gl;if(this.sceneFBO){g.deleteFramebuffer(this.sceneFBO);g.deleteFramebuffer(this.aoFBO);for(const t of [this.colorTex,this.normalTex,this.depthTex,this.aoTex])g.deleteTexture(t)}
  if(this.msFBO){g.deleteFramebuffer(this.msFBO);for(const r of this.msBuffers)g.deleteRenderbuffer(r);this.msFBO=null}
  this.sceneFBO=g.createFramebuffer();this.colorTex=this.texture(g.RGBA8,g.RGBA,g.UNSIGNED_BYTE,w,h,g.LINEAR);this.normalTex=this.texture(g.RGBA8,g.RGBA,g.UNSIGNED_BYTE,w,h);this.depthTex=this.texture(g.DEPTH_COMPONENT24,g.DEPTH_COMPONENT,g.UNSIGNED_INT,w,h);
  g.bindFramebuffer(g.FRAMEBUFFER,this.sceneFBO);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.colorTex,0);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT1,g.TEXTURE_2D,this.normalTex,0);g.framebufferTexture2D(g.FRAMEBUFFER,g.DEPTH_ATTACHMENT,g.TEXTURE_2D,this.depthTex,0);g.drawBuffers([g.COLOR_ATTACHMENT0,g.COLOR_ATTACHMENT1]);this.checkFBO('scene');
  // Fine quality: 4x MSAA colour/normal/depth, resolved into the textures above before AO and post.
  if(this.samples>1){
   this.msFBO=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,this.msFBO);
   this.msBuffers=[[g.RGBA8,g.COLOR_ATTACHMENT0],[g.RGBA8,g.COLOR_ATTACHMENT1],[g.DEPTH_COMPONENT24,g.DEPTH_ATTACHMENT]].map(([format,attachment])=>{const r=g.createRenderbuffer();g.bindRenderbuffer(g.RENDERBUFFER,r);g.renderbufferStorageMultisample(g.RENDERBUFFER,this.samples,format,w,h);g.framebufferRenderbuffer(g.FRAMEBUFFER,attachment,g.RENDERBUFFER,r);return r});
   g.drawBuffers([g.COLOR_ATTACHMENT0,g.COLOR_ATTACHMENT1]);
   if(g.checkFramebufferStatus(g.FRAMEBUFFER)!==g.FRAMEBUFFER_COMPLETE){g.deleteFramebuffer(this.msFBO);for(const r of this.msBuffers)g.deleteRenderbuffer(r);this.msFBO=null;this.samples=0;this.maxSamples=0}
  }
  this.aoWidth=Math.ceil(w/2);this.aoHeight=Math.ceil(h/2);this.aoTex=this.texture(g.RGBA8,g.RGBA,g.UNSIGNED_BYTE,this.aoWidth,this.aoHeight);this.aoFBO=g.createFramebuffer();g.bindFramebuffer(g.FRAMEBUFFER,this.aoFBO);g.framebufferTexture2D(g.FRAMEBUFFER,g.COLOR_ATTACHMENT0,g.TEXTURE_2D,this.aoTex,0);g.drawBuffers([g.COLOR_ATTACHMENT0]);this.checkFBO('ao');g.bindFramebuffer(g.FRAMEBUFFER,null);this.shadowDirty=true;
 }
 frameReady(){
  if(!this.fence)return true;
  const g=this.gl,result=g.clientWaitSync(this.fence,0,0);
  if(result===g.TIMEOUT_EXPIRED)return false;
  g.deleteSync(this.fence);this.fence=null;this.lastComplete=performance.now();return true;
 }
 draw(scene,camera,time){
  const start=performance.now(),gl=this.gl;this.resize();this.drawCalls=0;this.triangles=0;const visible=this.batch.filter(b=>scene.visible(b));
  const drawBatch=(p,b)=>{gl.uniform3fv(this.loc(p,'uOffset'),scene.offset(b));if(p===this.program)gl.uniform1f(this.loc(p,'uTint'),scene.tint(b));gl.bindVertexArray(b.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,b.vertices,b.count);this.drawCalls++;if(p===this.program)this.triangles+=b.vertices/3*b.count;};
  gl.enable(gl.DEPTH_TEST);gl.depthMask(true);
  if(this.shadowDirty){
   gl.bindFramebuffer(gl.FRAMEBUFFER,this.shadowFBO);gl.viewport(0,0,this.shadowSize,this.shadowSize);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(this.depthProgram);gl.uniformMatrix4fv(this.loc(this.depthProgram,'uVP'),false,this.lightVP);gl.disable(gl.BLEND);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(2.,5.);
   for(const b of visible)if(!b.transparent&&b.kind!=='glow')drawBatch(this.depthProgram,b);
   gl.disable(gl.POLYGON_OFFSET_FILL);this.shadowDirty=false;
  }
  const target=this.msFBO||this.sceneFBO;gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);gl.viewport(0,0,this.canvas.width,this.canvas.height);const bg=scene.background;
  gl.clearBufferfv(gl.COLOR,0,new Float32Array([...bg,1]));gl.clearBufferfv(gl.COLOR,1,new Float32Array([.5,1,.5,0]));gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.useProgram(this.program);gl.uniformMatrix4fv(this.loc(this.program,'uVP'),false,camera.vp);gl.uniformMatrix4fv(this.loc(this.program,'uLightVP'),false,this.lightVP);gl.uniform3fv(this.loc(this.program,'uEye'),camera.eye);gl.uniform3fv(this.loc(this.program,'uSun'),this.sun);gl.uniform3fv(this.loc(this.program,'uBackground'),bg);gl.uniform1f(this.loc(this.program,'uNight'),scene.night);gl.uniform1f(this.loc(this.program,'uTime'),time);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);gl.uniform1i(this.loc(this.program,'uShadow'),0);gl.uniform1i(this.loc(this.program,'uShadowTaps'),this.quality>1?16:4);
  gl.disable(gl.BLEND);gl.depthMask(true);for(const b of visible)if(!b.transparent)drawBatch(this.program,b);
  const direction=M.norm(M.sub(camera.eye,camera.target));
  const depth=(it,b)=>M.dot(M.add([it.matrix[12],it.matrix[13],it.matrix[14]],scene.offset(b)),direction);
  const glass=visible.filter(b=>b.transparent);for(const b of glass)b.sortDepth=b.items.reduce((s,it)=>s+depth(it,b),0)/b.count;glass.sort((a,b)=>a.sortDepth-b.sortDepth);
  // Depth-sort transparent instances, not just floor numbers. This fixes rear views.
  gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.NONE]);gl.enable(gl.BLEND);gl.depthMask(false);
  for(const b of glass){
   const sorted=[...b.items].sort((a,c)=>depth(a,b)-depth(c,b));sorted.forEach((it,i)=>{b.data.set(it.matrix,i*24);b.data.set(it.color,i*24+16);b.data.set(it.material,i*24+20)});
   gl.bindBuffer(gl.ARRAY_BUFFER,b.buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,b.data);drawBatch(this.program,b);
  }

  gl.depthMask(true);gl.bindVertexArray(null);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);
  if(this.msFBO){
   // Resolve MSAA: colour+depth, then the normal buffer, each attachment blitted on its own.
   const W=this.canvas.width,H=this.canvas.height;gl.bindFramebuffer(gl.READ_FRAMEBUFFER,this.msFBO);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,this.sceneFBO);
   gl.readBuffer(gl.COLOR_ATTACHMENT0);gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.NONE]);gl.blitFramebuffer(0,0,W,H,0,0,W,H,gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT,gl.NEAREST);
   gl.readBuffer(gl.COLOR_ATTACHMENT1);gl.drawBuffers([gl.NONE,gl.COLOR_ATTACHMENT1]);gl.blitFramebuffer(0,0,W,H,0,0,W,H,gl.COLOR_BUFFER_BIT,gl.NEAREST);
   gl.drawBuffers([gl.COLOR_ATTACHMENT0,gl.COLOR_ATTACHMENT1]);gl.bindFramebuffer(gl.READ_FRAMEBUFFER,null);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER,this.aoFBO);gl.viewport(0,0,this.aoWidth,this.aoHeight);gl.useProgram(this.aoProgram);
  [this.normalTex,this.depthTex].forEach((t,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(this.loc(this.aoProgram,['uNormal','uDepth'][i]),i)});
  gl.uniformMatrix4fv(this.loc(this.aoProgram,'uInvVP'),false,M.inverse(camera.vp));gl.uniform2f(this.loc(this.aoProgram,'uPixel'),1/this.canvas.width,1/this.canvas.height);gl.uniform1f(this.loc(this.aoProgram,'uRadius'),this.canvas.height/camera.span*.74);gl.uniform1f(this.loc(this.aoProgram,'uAO'),this.ao);gl.drawArrays(gl.TRIANGLES,0,3);
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.useProgram(this.postProgram);gl.uniform1f(this.loc(this.postProgram,'uAO'),this.ao);gl.uniform1f(this.loc(this.postProgram,'uFXAA'),this.msFBO?0:1);
  [this.colorTex,this.depthTex,this.aoTex].forEach((t,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(this.loc(this.postProgram,['uColor','uDepth','uOcclusion'][i]),i)});
  gl.uniform2f(this.loc(this.postProgram,'uPixel'),1/this.canvas.width,1/this.canvas.height);gl.uniform2f(this.loc(this.postProgram,'uAOPixel'),1/this.aoWidth,1/this.aoHeight);gl.drawArrays(gl.TRIANGLES,0,3);this.drawCalls+=2;
  this.frameMs=performance.now()-start;this.frames++;this.lastView={yaw:camera.yaw,pitch:camera.pitch,span:camera.span,target:[...camera.target]};
  // Keep at most one submitted scene in flight, rather than flooding slow GPUs.
  if(this.fence)gl.deleteSync(this.fence);this.fence=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();
 }
 project(point,camera){const p=M.transform(camera.vp,point);return {x:(p[0]/p[3]*.5+.5)*this.canvas.clientWidth,y:(-.5*p[1]/p[3]+.5)*this.canvas.clientHeight,z:p[2]/p[3]};}
 diagnostics(){const gl=this.gl,ext=gl.getExtension('WEBGL_debug_renderer_info');return {webgl:gl.getParameter(gl.VERSION),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'WebGL 2',instances:this.instances,batches:this.batch.length,frameSerial:this.frames,lastView:this.lastView,drawCalls:this.drawCalls,triangles:this.triangles,totalTriangles:this.totalTriangles,shadowMap:this.shadowSize,shadowTaps:this.quality>1?16:4,msaa:this.msFBO?this.samples:0,fxaa:!this.msFBO,ambientOcclusion:this.ao===1,frameSubmissionMs:Number(this.frameMs.toFixed(2)),canvas:[this.canvas.width,this.canvas.height],error:gl.getError()};}
}
Twin.Renderer=Renderer;Twin.geometry=geometry;
})();
