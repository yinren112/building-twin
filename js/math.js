/* Building Twin — compact, dependency-free column-major 3D math. */
'use strict';
window.Twin = window.Twin || {};
Twin.math = (() => {
  const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n)};
  const identity=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  function mul(a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)r[c*4+row]+=a[k*4+row]*b[c*4+k];return r}
  function compose(p=[0,0,0],s=[1,1,1],r=[0,0,0]){
    const [x,y,z]=r,[cx,cy,cz]=r.map(Math.cos),[sx,sy,sz]=r.map(Math.sin);
    const rx=new Float32Array([1,0,0,0,0,cx,sx,0,0,-sx,cx,0,0,0,0,1]);
    const ry=new Float32Array([cy,0,-sy,0,0,1,0,0,sy,0,cy,0,0,0,0,1]);
    const rz=new Float32Array([cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1]);
    const m=mul(ry,mul(rx,rz));for(let c=0;c<3;c++)for(let j=0;j<3;j++)m[c*4+j]*=s[c];m[12]=p[0];m[13]=p[1];m[14]=p[2];return m;
  }
  function lookAt(eye,target,up=[0,1,0]){const z=norm(sub(eye,target)),x=norm(cross(up,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1])}
  function ortho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1])}
  function transform(m,p){const a=[p[0],p[1],p[2],p[3]??1];return [0,1,2,3].map(row=>a.reduce((s,v,c)=>s+v*m[c*4+row],0))}
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  function color(h,alpha=1){h=h.replace('#','');return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255,alpha]}
  function random(seed=17){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
  function inverse(a){
    // Gauss-Jordan inversion; column-major storage, pivoting avoids zero pivots.
    const r=Array.from({length:4},(_,i)=>[...Array.from({length:4},(_,j)=>a[j*4+i]),...Array.from({length:4},(_,j)=>Number(i===j))]);
    for(let c=0;c<4;c++){
      let pivot=c;for(let i=c+1;i<4;i++)if(Math.abs(r[i][c])>Math.abs(r[pivot][c]))pivot=i;
      [r[c],r[pivot]]=[r[pivot],r[c]];const d=r[c][c];if(Math.abs(d)<1e-12)throw new Error('Singular camera matrix');
      for(let j=0;j<8;j++)r[c][j]/=d;
      for(let i=0;i<4;i++)if(i!==c){const k=r[i][c];for(let j=0;j<8;j++)r[i][j]-=k*r[c][j];}
    }
    return new Float32Array(Array.from({length:16},(_,i)=>r[i%4][4+Math.floor(i/4)]));
  }
  return {inverse,add,sub,dot,cross,norm,identity,mul,compose,lookAt,ortho,transform,clamp,lerp,color,random};
})();

