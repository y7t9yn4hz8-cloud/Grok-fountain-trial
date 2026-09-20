
import * as THREE from './three.module.js';
import {makeEnvironment, buildFountain, animateWater} from './visuals.js';

// ============================================================
//  CONFIG
// ============================================================
const TILE = 3;                    // world units per dungeon tile
const PLAYER_HEIGHT = 1.6;
const MOVE_DURATION = 0.18;        // seconds for snap movement (feels responsive)

// Simple collision map for the courtyard (1 = blocked)
// Rows = Z, Columns = X.  Center of map is roughly (5,4)
const MAP_W = 11;
const MAP_H = 9;
const collision = [
  // 0 1 2 3 4 5 6 7 8 9 10
  [1,1,1,1,1,1,1,1,1,1,1], // 0  north wall
  [1,0,0,0,0,0,0,0,0,0,1], // 1
  [1,0,0,0,0,0,0,0,0,0,1], // 2
  [1,0,0,0,0,0,0,0,0,0,1], // 3
  [1,0,0,0,0,1,0,0,0,0,1], // 4  ← fountain occupies (5,4)
  [1,0,0,0,0,0,0,0,0,0,1], // 5
  [1,0,0,0,0,0,0,0,0,0,1], // 6
  [1,0,0,0,0,0,0,0,0,0,1], // 7
  [1,1,1,1,1,1,1,1,1,1,1], // 8  south wall
];

// ============================================================
//  PLAYER STATE  (grid coordinates + facing)
// ============================================================
// Facing: 0 = North (-Z), 1 = East (+X), 2 = South (+Z), 3 = West (-X)
const player = {
  x: 5,          // start south of fountain
  z: 6,
  facing: 0,     // looking north toward the fountain
  moving: false
};

// ============================================================
//  FOUNTAIN COMPONENT  (reusable)
// ============================================================
class Fountain {
  constructor(scene, gridX, gridZ) {
    this.gridX = gridX;
    this.gridZ = gridZ;
    this.available = true;          // once-per-visit flag
    this.waterFlowing = true;
    this.particles = [];
    this.maxParticles = 50;

    this.group = new THREE.Group();
    this.group.position.set(gridX * TILE, 0, gridZ * TILE);
    scene.add(this.group);

    this._buildGeometry();
    this._seedParticles();
  }

  _buildGeometry() { this.visual = buildFountain(this.group); this.waterSurface=this.visual.water; }
  _seedParticles() {} // Fixed GPU buffers are created once by buildFountain.
  update(dt) { animateWater(this.visual, dt, this.waterFlowing); }

  // Called when player drinks
  drink() {
    if (!this.available) {
      showMessage("The fountain is already still.");
      return false;
    }
    this.available = false;
    try { sessionStorage.setItem(VISIT_KEY,'used'); } catch {}
    this.waterFlowing = false;
    this.visual.points.visible = false;
    this.waterSurface.material.opacity = 0.82;
    showMessage("You feel restored.");
    return true;
  }

  // Called only by dungeon-exit / reset event
  reset() {
    this.available = true;
    this.waterFlowing = true;
    this.visual.points.visible = true;
    this.waterSurface.material.opacity = 0.82;
  }

  // Is the player adjacent (or on) the fountain tile?
  isAdjacent(px, pz) {
    return Math.abs(px - this.gridX) + Math.abs(pz - this.gridZ) <= 1;
  }
}

// ============================================================
//  SCENE SETUP
// ============================================================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 220);
let renderer;
try { renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'low-power'}); }
catch(error) { document.getElementById('message').textContent='3D graphics could not start. Please enable WebGL and reload.'; document.getElementById('message').style.opacity=1; throw error; }
const pixelBudget = 1800000;
function sizeRenderer(){
 const ratio=Math.min(devicePixelRatio,1.5,Math.sqrt(pixelBudget/(innerWidth*innerHeight)));
 renderer.setPixelRatio(ratio); renderer.setSize(innerWidth,innerHeight);
 camera.aspect=innerWidth/innerHeight;camera.fov=camera.aspect<.75?90:65;camera.updateProjectionMatrix();
}
sizeRenderer();
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
document.body.appendChild(renderer.domElement);
makeEnvironment(scene,renderer,collision);

// Fountain instance (modular)
const fountain = new Fountain(scene, 5, 4);
const VISIT_KEY='veyra-fountain-trial-visit';
try { if(sessionStorage.getItem(VISIT_KEY)==='used'){fountain.available=false;fountain.waterFlowing=false;fountain.visual.points.visible=false;} } catch {}


// ============================================================
//  MOVEMENT & COLLISION
// ============================================================
const DIR = [
  { x: 0, z: -1 }, // 0 North
  { x: 1, z:  0 }, // 1 East
  { x: 0, z:  1 }, // 2 South
  { x: -1, z: 0 }  // 3 West
];

function canMoveTo(nx, nz) {
  if (nx < 0 || nz < 0 || nx >= MAP_W || nz >= MAP_H) return false;
  if (collision[nz][nx] === 1) return false;
  return true;
}

function turn(dir) {               // -1 = left, +1 = right
  if (player.moving) return;
  player.facing = (player.facing + dir + 4) % 4;
  updateCamera(true);
}

function moveForward() {
  if (player.moving) return;
  const d = DIR[player.facing];
  const nx = player.x + d.x;
  const nz = player.z + d.z;
  if (!canMoveTo(nx, nz)) return;

  player.moving = true;
  player.x = nx;
  player.z = nz;

  // short smooth transition
  const start = camera.position.clone();
  const end = new THREE.Vector3(player.x * TILE, PLAYER_HEIGHT, player.z * TILE);
  const startTime = performance.now();

  function step(now) {
    const t = Math.min(1, (now - startTime) / (MOVE_DURATION * 1000));
    camera.position.lerpVectors(start, end, t*t*(3-2*t));
    if (t < 1) requestAnimationFrame(step);
    else {
      player.moving = false;
      updateCamera(true);
    }
  }
  requestAnimationFrame(step);
}

function updateCamera(immediate = false) {
  const targetPos = new THREE.Vector3(player.x * TILE, PLAYER_HEIGHT, player.z * TILE);
  if (immediate) camera.position.copy(targetPos);

  const look = DIR[player.facing];
  camera.lookAt(
    camera.position.x + look.x,
    PLAYER_HEIGHT,
    camera.position.z + look.z
  );
}

// ============================================================
//  UI
// ============================================================
const messageEl = document.getElementById('message');
function showMessage(text, ms = 2600) {
  messageEl.textContent = text;
  messageEl.style.opacity = '1';
  clearTimeout(messageEl._t);
  messageEl._t = setTimeout(() => messageEl.style.opacity = '0', ms);
}

document.getElementById('leftBtn').addEventListener('click', () => turn(-1));
document.getElementById('rightBtn').addEventListener('click', () => turn(1));
document.getElementById('forwardBtn').addEventListener('click', moveForward);

document.getElementById('drinkBtn').addEventListener('click', () => {
  if (player.moving) return;
  if (!fountain.isAdjacent(player.x, player.z)) {
    showMessage("Move next to the fountain to drink.");
    return;
  }
  fountain.drink();
});

// Public reset hook for future dungeon-exit event
window.resetDungeonVisit = function () {
  fountain.reset();
  try { sessionStorage.removeItem(VISIT_KEY); } catch {}
  showMessage("The fountain’s waters flow once more.");
};

// ============================================================
//  MAIN LOOP
// ============================================================
updateCamera(true);   // place camera at start

let lastTime=0,frames=0,totalTime=0;
function animate(now){
 requestAnimationFrame(animate);
 if(document.hidden){lastTime=now;return;}
 const dt=Math.min((now-lastTime)/1000 || 0,.05);lastTime=now;
 fountain.update(dt);renderer.render(scene,camera);
 frames++;totalTime+=dt;
 document.getElementById('drinkBtn').disabled=player.moving||!fountain.available||!fountain.isAdjacent(player.x,player.z);
 document.getElementById('drinkBtn').textContent=fountain.available?'Drink':'Renewed';
}
requestAnimationFrame(animate);
window.addEventListener('resize',sizeRenderer);
window.addEventListener('orientationchange',()=>setTimeout(sizeRenderer,150));
renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();showMessage('Graphics paused. Reload to restore the courtyard.',60000)});
renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
window.addEventListener('keydown',e=>{
 if(['ArrowLeft','ArrowRight','ArrowUp',' '].includes(e.key))e.preventDefault();
 if(e.repeat)return;
 if(e.key==='ArrowLeft'||e.key==='a')turn(-1);
 if(e.key==='ArrowRight'||e.key==='d')turn(1);
 if(e.key==='ArrowUp'||e.key==='w')moveForward();
 if(e.key===' '||e.key==='e')document.getElementById('drinkBtn').click();
});
document.getElementById('visitBtn').onclick=()=>{
 if(player.moving)return;
 player.x=5;player.z=6;player.facing=0;updateCamera(true);window.resetDungeonVisit();
};
// Opt-in inspection for local regression/performance tests, never shown in normal play.
if(new URLSearchParams(location.search).has('test'))window.trial={player,fountain,collision,canMoveTo,renderer,scene,camera,turn,moveForward,stats:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures})};
