import * as THREE from './three.module.js';
import {RGBELoader} from './RGBELoader.js';
import {Reflector} from './Reflector.js';
const loader=new THREE.TextureLoader();
function photo(name,rx=1,ry=rx,linear=false){const t=loader.load('./'+name);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=4;if(!linear)t.colorSpace=THREE.SRGBColorSpace;return t;}
let seed=7321;
const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
const canvas=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
function texture(c,repeat=1){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=4;return t;}
function masonry(paving=false){
 const c=canvas(512),g=c.getContext('2d');g.fillStyle='#292d29';g.fillRect(0,0,512,512);
 const rows=paving?4:8,cols=paving?4:3,h=512/rows,w=512/cols;
 for(let y=0;y<rows;y++)for(let x=-1;x<=cols;x++){
  const xx=x*w+(y%2)*w/2,yy=y*h,v=65+rand()*35;
  g.fillStyle=`rgb(${v},${v+3},${v+1})`;g.fillRect(xx+3,yy+3,w-6,h-6);
  g.strokeStyle='#93968c55';g.lineWidth=2;g.strokeRect(xx+5,yy+5,w-10,h-10);
  for(let j=0;j<180;j++){const q=rand()*55;g.fillStyle=`rgba(${q+100},${q+103},${q+93},${rand()*.16})`;g.fillRect(xx+rand()*w,yy+rand()*h,rand()*5+1,rand()*2+1)}
  if(rand()>.35){g.strokeStyle='#1c2423aa';g.lineWidth=.7;g.beginPath();let px=xx+rand()*w,py=yy;g.moveTo(px,py);for(let j=0;j<4;j++){px+=(rand()-.5)*20;py+=h/5;g.lineTo(px,py)}g.stroke()}
  for(let j=0;j<10;j++){g.fillStyle=`rgba(44,62,26,${rand()*.5})`;g.fillRect(xx+rand()*w,yy+h-5-rand()*3,rand()*14+1,3)}
 }
 return texture(c);
}
function ornament(){const c=canvas(512,256),g=c.getContext('2d');g.fillStyle='#74776b';g.fillRect(0,0,512,256);for(let i=0;i<24000;i++){g.fillStyle=rand()>.5?'#a0a28b20':'#171e1820';g.fillRect(rand()*512,rand()*256,2,2)}
 for(let k=0;k<8;k++){const x=k*64+32;g.lineWidth=6;g.strokeStyle='#30382c';g.beginPath();g.ellipse(x,122,26,88,0,0,Math.PI*2);g.stroke();g.lineWidth=2;g.strokeStyle='#b9b7a0';g.stroke();for(let j=0;j<5;j++){g.beginPath();g.moveTo(x,198-j*29);g.bezierCurveTo(x-35,170-j*29,x-24,142-j*29,x,158-j*29);g.bezierCurveTo(x+24,142-j*29,x+35,170-j*29,x,198-j*29);g.stroke()}}
 return texture(c);
}
let stone;
function box(group,x,y,z,w,h,d,mat=stone){const geo=new THREE.BoxGeometry(w,h,d),uv=geo.attributes.uv,pos=geo.attributes.position,n=geo.attributes.normal;
 for(let i=0;i<pos.count;i++){const nx=Math.abs(n.getX(i)),ny=Math.abs(n.getY(i));uv.setXY(i,(nx>.5?pos.getZ(i):pos.getX(i))/4,(ny>.5?pos.getZ(i):pos.getY(i))/4)}
 const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
function ring(group,r,t,y,mat=stone){const mesh=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,64),mat);mesh.rotation.x=Math.PI/2;mesh.position.y=y;group.add(mesh);return mesh;}
function cloudSky(){
 const c=canvas(1024,512),g=c.getContext('2d'),im=g.createImageData(1024,512);
 const hash=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)};
 const noise=(x,y)=>{let a=Math.floor(x),b=Math.floor(y),u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return (hash(a,b)*(1-u)+hash(a+1,b)*u)*(1-v)+(hash(a,b+1)*(1-u)+hash(a+1,b+1)*u)*v};
 for(let y=0;y<512;y++)for(let x=0;x<1024;x++){let n=0,amp=.55;for(let i=0;i<5;i++){n+=noise(x/150*2**i,y/90*2**i)*amp;amp*=.5}const glow=Math.exp(-((x-720)**2/40000+(y-140)**2/10000));const v=104+n*92+glow*45;const k=(y*1024+x)*4;im.data[k]=v;im.data[k+1]=v+4;im.data[k+2]=v+7;im.data[k+3]=255;}g.putImageData(im,0,0);const t=texture(c);t.mapping=THREE.EquirectangularReflectionMapping;return t;
}
function leavesTexture(){const c=canvas(64),g=c.getContext('2d');g.fillStyle='#637747';g.beginPath();g.moveTo(32,2);g.lineTo(43,20);g.lineTo(61,17);g.lineTo(49,36);g.lineTo(53,52);g.lineTo(32,46);g.lineTo(12,57);g.lineTo(15,34);g.lineTo(3,19);g.lineTo(23,21);g.closePath();g.fill();g.strokeStyle='#b1b690';g.lineWidth=1;g.beginPath();g.moveTo(32,60);g.lineTo(32,5);g.moveTo(32,32);g.lineTo(8,21);g.moveTo(32,32);g.lineTo(57,20);g.stroke();return texture(c);}
export function makeEnvironment(scene,renderer,collision){
 const sky=cloudSky();scene.background=sky;const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromEquirectangular(sky).texture;pm.dispose();scene.fog=new THREE.FogExp2('#919a99',.004);
 new RGBELoader().load('./sky.hdr',hdr=>{hdr.mapping=THREE.EquirectangularReflectionMapping;scene.background=hdr;scene.backgroundIntensity=.48;
 const dome=new THREE.Mesh(new THREE.SphereGeometry(150,40,24),new THREE.MeshBasicMaterial({map:hdr,side:THREE.BackSide,color:0x909090,depthWrite:false,fog:false}));dome.rotation.x=.6;dome.renderOrder=-10;scene.add(dome);
 const gen=new THREE.PMREMGenerator(renderer);scene.environment.dispose();scene.environment=gen.fromEquirectangular(hdr).texture;gen.dispose();sky.dispose();});
 scene.add(new THREE.HemisphereLight(0xdce3e7,0x343c30,1.4));const sun=new THREE.DirectionalLight(0xfff0e2,1.5);sun.position.set(12,25,18);scene.add(sun);
 const wallTex=photo('stone.jpg',4,4),floorTex=photo('paving.jpg',8,6);
 stone=new THREE.MeshStandardMaterial({color:0xa4afa9,map:wallTex,normalMap:photo('stone-normal.jpg',4,4,true),normalScale:new THREE.Vector2(.7,.7),roughness:.85});
 const floorMat=new THREE.MeshStandardMaterial({color:0x414a45,map:floorTex,normalMap:photo('paving-normal.jpg',8,6,true),normalScale:new THREE.Vector2(.55,.55),roughness:.38,metalness:.12,envMapIntensity:.55});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,24),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(15,0,12);scene.add(floor);
 box(scene,6,5,12,1,10,25);box(scene,24,5,12,1,10,25);
 for(let z=1;z<8;z++)for(const x of [1,2,8,9])collision[z][x]=1;box(scene,15,4.5,24,31,9,1);
 box(scene,15,.8,0,30,1.6,1);box(scene,15,1.66,0,30,.18,1.3);
 // Rear towers leave the sky and distant mountains open between them.
 for(const x of [8,22]){
  const tower=new THREE.Mesh(new THREE.CylinderGeometry(2.7,3,18,24),stone);tower.position.set(x,9,1);scene.add(tower);
  for(const y of [1.2,6,11,16.8]){const collar=new THREE.Mesh(new THREE.CylinderGeometry(2.82,2.85,.25,24),stone);collar.position.set(x,y,1);scene.add(collar)}
  for(let xx=1;xx<10;xx++)for(let zz=1;zz<3;zz++)if(Math.hypot(xx*3-x,zz*3-1)<3.4)collision[zz][xx]=1;
 }
 const mountainMat=new THREE.MeshStandardMaterial({color:0x6d7c79,roughness:1,flatShading:false});for(let i=0;i<13;i++){const m=new THREE.Mesh(new THREE.ConeGeometry(18+rand()*16,12+rand()*15,19,5),mountainMat);m.position.set(-70+i*15,-8,-65-rand()*25);m.rotation.y=rand()*6;scene.add(m)}
 // Sturdy benches stay wholly within blocked perimeter cells.
 for(const x of [7.1,22.9]){box(scene,x,.95,8,1.2,.28,4.2);for(const z of [6.6,9.4]){box(scene,x,.42,z,.85,.84,.6);box(scene,x,.11,z,1.2,.2,.9)}}
 const iron=new THREE.MeshStandardMaterial({color:0x191d1b,metalness:.7,roughness:.75});for(const x of [6.65,23.35])for(const z of [8,17]){box(scene,x,3.5,z,.18,.65,.28,iron);box(scene,x+(x<15?.4:-.4),3.2,z,.8,.1,.13,iron);const cup=new THREE.Mesh(new THREE.CylinderGeometry(.3,.12,.35,8,true),iron);cup.position.set(x+(x<15?.75:-.75),3.4,z);scene.add(cup)}
 const leafMat=new THREE.MeshStandardMaterial({map:leavesTexture(),alphaTest:.4,side:THREE.DoubleSide,roughness:.92,color:0x3d5135});
 const leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(.45,.55),leafMat,3000);const dummy=new THREE.Object3D();let count=0;
 for(let side=0;side<2;side++)for(let vine=0;vine<32;vine++){
  const z=rand()*24,top=8+rand()*2,bottom=1+rand()*6;
  for(let y=top;y>bottom;y-=.16){dummy.position.set(side?23.38:6.62,y,z+Math.sin(y*3+vine)*.55+(rand()-.5)*.5);dummy.rotation.set(0,side?-Math.PI/2:Math.PI/2,rand()*2-1);dummy.scale.setScalar(.45+rand()*.55);dummy.updateMatrix();leaves.setMatrixAt(count++,dummy.matrix)}
 }
 for(const x of [8,22])for(let vine=0;vine<22;vine++){
  const a=rand()*Math.PI*2,top=12+rand()*5,bottom=2+rand()*7;
  for(let y=top;y>bottom&&count<3000;y-=.24){dummy.position.set(x+Math.cos(a)*3.03,y,1+Math.sin(a)*3.03);dummy.rotation.set(0,Math.PI/2-a,rand());dummy.scale.setScalar(.4+rand()*.6);dummy.updateMatrix();leaves.setMatrixAt(count++,dummy.matrix)}
 }
 leaves.count=Math.min(count,3000);scene.add(leaves);
 // Scattered fallen leaves use one draw call.
 const litter=new THREE.InstancedMesh(new THREE.PlaneGeometry(.13,.2),leafMat,180);for(let i=0;i<180;i++){dummy.position.set(rand()*30,.015,rand()*24);dummy.rotation.set(-Math.PI/2,0,rand()*6);dummy.scale.setScalar(.5+rand());dummy.updateMatrix();litter.setMatrixAt(i,dummy.matrix)}scene.add(litter);
 const wet=new Reflector(new THREE.PlaneGeometry(30,24),{textureWidth:512,textureHeight:512,color:0x828a86,clipBias:.004});
 wet.rotation.x=-Math.PI/2;wet.position.set(15,.018,12);wet.material.transparent=true;wet.material.depthWrite=false;
 wet.material.fragmentShader=wet.material.fragmentShader.replace('void main() {',`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 void main() {`);
 // Projective UVs keep the reflection correct; world-space patches keep puddles stationary.
 wet.material.vertexShader=wet.material.vertexShader.replace('void main() {','varying vec3 groundPosition;\nvoid main() {').replace('gl_Position =','groundPosition = position;\n gl_Position =');
 wet.material.fragmentShader='varying vec3 groundPosition;\n'+wet.material.fragmentShader;
 wet.material.fragmentShader=wet.material.fragmentShader.replace('#include <tonemapping_fragment>',`float wetness=noise(groundPosition.xy*.75)*.7+noise(groundPosition.xy*2.)*.3;
 gl_FragColor.a=smoothstep(.46,.65,wetness)*.65;
 #include <tonemapping_fragment>`);
 scene.add(wet);
 // Grounded contact shade around the basin; avoids costly mobile shadow maps.
 const ao=canvas(128),g=ao.getContext('2d'),grad=g.createRadialGradient(64,64,23,64,64,64);grad.addColorStop(0,'#000b');grad.addColorStop(.65,'#0008');grad.addColorStop(1,'#0000');g.fillStyle=grad;g.fillRect(0,0,128,128);const shade=new THREE.Mesh(new THREE.PlaneGeometry(7,7),new THREE.MeshBasicMaterial({map:texture(ao),transparent:true,depthWrite:false}));shade.rotation.x=-Math.PI/2;shade.position.set(15,.024,12);scene.add(shade);
}
export function buildFountain(group){
 const tex=ornament(),mat=new THREE.MeshStandardMaterial({map:photo('stone.jpg',2,1),bumpMap:tex,bumpScale:.3,color:0xa5b1a6,roughness:.7,metalness:.03});
 function lathe(profile,material=mat){const m=new THREE.Mesh(new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),64),material);const p=m.geometry.attributes.position;
 for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),a=Math.atan2(x,z),f=1+Math.sin(a*24)*.014;p.setXYZ(i,x*f,p.getY(i),z*f)}
 m.geometry.computeVertexNormals();group.add(m);return m;}
 // Hollow, moulded basin rim rather than a solid cylinder.
 lathe([[2.2,.04],[2.58,.04],[2.6,.16],[2.5,.23],[2.46,.48],[2.51,.56],[2.47,.64],[2.18,.64],[2.14,.53],[2.16,.18],[2.2,.04]]);
 lathe([[0,.15],[.72,.15],[.78,.28],[.65,.4],[.49,.55],[.42,1.1],[.58,1.4],[.62,1.52],[.47,1.58]]);
 lathe([[.4,1.47],[.78,1.5],[1.12,1.68],[1.42,1.94],[1.56,2.13],[1.57,2.24],[1.48,2.29],[1.39,2.2],[1.1,1.96],[.5,1.77],[.4,1.47]]);
 lathe([[.25,1.8],[.4,1.85],[.38,2.1],[.26,2.32],[.22,2.7],[.36,2.9],[.37,3.04]]);
 lathe([[.18,2.97],[.5,3.03],[.73,3.18],[.9,3.4],[.92,3.5],[.86,3.55],[.77,3.44],[.53,3.26],[.18,3.19],[.18,2.97]]);
 ring(group,2.43,.08,.57,mat);ring(group,1.52,.07,2.25,mat);ring(group,.88,.045,3.51,mat);
 const waterMat=new THREE.MeshPhysicalMaterial({color:0x3b615a,roughness:.24,metalness:.0,transparent:true,opacity:.82,envMapIntensity:.6,side:THREE.DoubleSide});
 const surfaces=[];for(const [r,y] of [[2.17,.45],[1.38,2.14],[.77,3.42]]){const w=new THREE.Mesh(new THREE.CircleGeometry(r,64),waterMat);w.rotation.x=-Math.PI/2;w.position.y=y;group.add(w);surfaces.push(w)}
 const count=650,positions=new Float32Array(count*3),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const dot=canvas(32),g=dot.getContext('2d'),grad=g.createRadialGradient(16,16,0,16,16,16);grad.addColorStop(0,'#ffffff');grad.addColorStop(.4,'#ffffffaa');grad.addColorStop(1,'#ffffff00');g.fillStyle=grad;g.fillRect(0,0,32,32);
 const points=new THREE.Points(geo,new THREE.PointsMaterial({map:texture(dot),color:0xd0e3df,size:.043,transparent:true,opacity:.65,depthWrite:false}));points.frustumCulled=false;group.add(points);
 const streams=new THREE.Group();group.add(streams);
 const streamVertices=[];
 const streamMat=new THREE.LineBasicMaterial({color:0xc0d1cb,transparent:true,opacity:.22,depthWrite:false});
 for(const [radius,top,bottom] of [[.85,3.44,2.15],[1.51,2.2,.46]])for(let i=0;i<36;i++){
 const a=i*Math.PI*2/36,vertices=[];for(let j=0;j<=12;j++){const t=j/12,r=radius+t*.17;vertices.push(new THREE.Vector3(Math.cos(a)*r,top-(top-bottom)*t*t,Math.sin(a)*r));}
 for(let j=0;j<12;j++)streamVertices.push(...vertices[j].toArray(),...vertices[j+1].toArray());
 }
 const streamGeo=new THREE.BufferGeometry();streamGeo.setAttribute('position',new THREE.Float32BufferAttribute(streamVertices,3));streams.add(new THREE.LineSegments(streamGeo,streamMat));
 const ripples=[];const rm=new THREE.MeshBasicMaterial({color:0xc7dad1,transparent:true,opacity:.045,side:THREE.DoubleSide,depthWrite:false});for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.RingGeometry(.96,1,64),rm);m.rotation.x=-Math.PI/2;m.position.y=.456;group.add(m);ripples.push(m)}
 return {water:surfaces[0],points,positions,time:0,ripples,streams};
}
export function animateWater(v,dt,flowing){
 v.time+=dt;v.points.visible=flowing;v.streams.visible=flowing;if(!flowing){for(const r of v.ripples)r.visible=false;return;}
 const t=v.time;
 for(let i=0;i<v.positions.length/3;i++){
  const phase=((Math.sin(i*93.7)*43758.54%1+1)%1+t*.55)%1,a=i*2.39996;let r,y;
  if(i<150){const p=phase;r=.055+Math.sin(p*Math.PI)*.08;y=3.43+Math.sin(p*Math.PI)*.62;}
  else if(i<350){r=.83+phase*.14;y=3.46-phase*phase*1.31;}
  else{r=1.5+phase*.22;y=2.19-phase*phase*1.72;}
  v.positions[i*3]=Math.cos(a)*r;v.positions[i*3+1]=y;v.positions[i*3+2]=Math.sin(a)*r;
 }
 v.points.geometry.attributes.position.needsUpdate=true;
 v.ripples.forEach((r,i)=>{r.visible=true;const s=.55+((t*.18+i/7)%1)*1.5;r.scale.set(s,s,1)});
}

