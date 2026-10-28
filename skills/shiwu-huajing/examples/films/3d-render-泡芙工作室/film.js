// 3D 软萌质感 · 虚构品牌「泡芙工作室 PUFF」。原版语法：充气感的粗圆字（光滑、大高光）、一颗亮面球、满地小圆珠被压出波纹，
// 粉紫柔光、软阴影，字和球落地会挤压回弹。用 Three.js 渲染到离屏画布，再画到主画布上叠 2D 字。
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clamp, lerp, seg, E, rng, Mix } from './lib/core.js';

const W = 1920, H = 1080, DUR = 8.5;
const CN = '"Noto Sans SC", "PingFang SC", sans-serif';
let R, scene, cam, beads, letters = [], ball, dummy = new THREE.Object3D();
const GX = 64, GZ = 40, SP = .3;
const LAND = [.9, 1.25, 1.6, 1.95];            // 每个字母落地时间
const LX = [-2.85, -1.05, .8, 2.2];             // 字母位置

// 字母做成「充气管子」：沿路径的管 + 两端圆球封口
function tube(points, r, closed = false) { const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), closed, 'catmullrom', .3); return new THREE.TubeGeometry(curve, 80, r, 28, closed); }
function arc(cx, cy, rr, a0, a1, n = 24) { const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } return out; }
function letter(ch, mat) {
  const g = new THREE.Group(), r = .27, add = geo => g.add(new THREE.Mesh(geo, mat)), cap = (x, y) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), mat); m.position.set(x, y, 0); g.add(m); };
  if (ch === 'p') { add(tube([[0, 1.25], [0, .4], [0, -.9]], r)); cap(0, 1.25); cap(0, -.9); add(new THREE.TorusGeometry(.55, r, 24, 60)).position?.set(0, 0, 0); g.children[g.children.length - 1].position.set(.55, .7, 0); }
  if (ch === 'u') { add(tube([[0, 1.25], [0, .7], ...arc(.55, .6, .55, Math.PI, Math.PI * 2, 16).slice(1, -1), [1.1, .7], [1.1, 1.25]], r)); cap(0, 1.25); cap(1.1, 1.25); add(tube([[1.1, 1.0], [1.1, .3], [1.1, 0]], r)); cap(1.1, 0); }
  if (ch === 'f') { add(tube([[.2, 0], [.2, .8], [.2, 1.45], [.35, 1.8], [.7, 1.9]], r)); cap(.2, 0); cap(.7, 1.9); add(tube([[-.05, 1.15], [.3, 1.15], [.6, 1.15]], r * .85)); cap(-.05, 1.15); cap(.6, 1.15); }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g;
}
const bounce = (t, t0) => { const d = t - t0; if (d < 0) return { y: 4.5 - 0, sq: 0, fall: true, d }; const y = Math.abs(Math.sin(d * 7.5)) * 1.1 * Math.exp(-d * 4.2); const sq = Math.exp(-d * 6) * Math.max(0, Math.cos(d * 7.5 + .2)) * .35; return { y, sq, fall: false, d }; };

export default {
  width: W, height: H, fps: 30, duration: DUR,
  fonts: [[`800 60px ${CN}`, '软软的才最有力量泡芙工作室']],
  async setup() {
    R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setPixelRatio(1); R.setSize(W, H, false);
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = .95; R.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene(); scene.background = new THREE.Color('#F6DDE8'); scene.fog = new THREE.Fog('#F6DDE8', 9, 20);
    const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
    cam = new THREE.PerspectiveCamera(32, W / H, .1, 100);
    scene.add(new THREE.HemisphereLight('#FFF4F8', '#D9B8E8', .9));
    const sun = new THREE.DirectionalLight('#FFFFFF', 1.6); sun.position.set(-4, 8, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.radius = 8;
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 25 }); sun.shadow.bias = -.0005; scene.add(sun);
    // 满地小圆珠（实例化），少数换成彩色
    beads = new THREE.InstancedMesh(new THREE.SphereGeometry(.14, 16, 12), new THREE.MeshStandardMaterial({ roughness: .45, metalness: 0 }), GX * GZ); beads.receiveShadow = true;
    const r = rng(9), cream = new THREE.Color('#F3D3C3'), tint = [new THREE.Color('#C9B3F2'), new THREE.Color('#FFB3C7'), new THREE.Color('#FFE29A')];
    for (let i = 0; i < GX * GZ; i++) beads.setColorAt(i, r() < .05 ? tint[Math.floor(r() * 3)] : cream.clone().offsetHSL(0, 0, (r() - .5) * .04));
    scene.add(beads);
    const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: .18 })); shadowCatcher.rotation.x = -Math.PI / 2; shadowCatcher.position.y = .12; shadowCatcher.receiveShadow = true; scene.add(shadowCatcher);
    const mat = new THREE.MeshPhysicalMaterial({ color: '#9F84F2', roughness: .2, clearcoat: 1, clearcoatRoughness: .12, sheen: .6, sheenColor: new THREE.Color('#FFD6F0') });
    'puff'.split('').forEach((ch, i) => { const g = letter(ch, mat); const holder = new THREE.Group(); g.position.set(-.5, 0, 0); holder.add(g); holder.position.set(LX[i], 0, 0); scene.add(holder); letters.push(holder); });
    ball = new THREE.Mesh(new THREE.SphereGeometry(.6, 48, 32), new THREE.MeshPhysicalMaterial({ color: '#FFC94A', roughness: .08, metalness: .1, clearcoat: 1 })); ball.castShadow = true; scene.add(ball);
  },
  draw(ctx, t) {
    // 镜头：慢慢绕一点、推近一点
    const a = lerp(-.22, .12, E.inOutC(seg(t, 0, DUR))), dist = lerp(11, 9.8, E.inOutC(seg(t, 0, DUR)));
    cam.position.set(Math.sin(a) * dist, 3.4, Math.cos(a) * dist); cam.lookAt(.25, .9, 0);
    // 字母：从上方落下，弹几下，落地挤压
    const impacts = [];
    letters.forEach((L, i) => { const b = bounce(t, LAND[i]); if (b.fall) { const u = seg(t, LAND[i] - .55, LAND[i]); L.visible = u > 0; L.position.y = .12 + lerp(4.5, 0, E.inQ(u)); L.scale.set(.92, 1.1, .92); return; }
      L.visible = true; L.position.y = .12 + b.y; const breathe = .015 * Math.sin(t * 3 + i); L.scale.set(1 + b.sq * .5 + breathe, 1 - b.sq + breathe, 1 + b.sq * .5 + breathe); L.rotation.z = .04 * Math.sin(b.d * 5) * Math.exp(-b.d * 2);
      impacts.push([LX[i], 0, LAND[i], 1]); });
    // 小球：从右边滚进来，撞到最后一个 f，停住
    const bu = E.outC(seg(t, 3.2, 4.6)), bx = lerp(7, 3.35, bu), hit = t > 4.25 ? Math.exp(-(t - 4.25) * 5) * Math.sin((t - 4.25) * 20) : 0;
    ball.position.set(bx + hit * .08, .74, .2); ball.rotation.z = (7 - bx) / .6; if (t > 4.25) { letters[3].rotation.z += hit * .08; impacts.push([3.35, .2, 4.25, .6]); }
    // 圆珠：落点激起波纹，字和球下面压出凹陷
    let k = 0; for (let ix = 0; ix < GX; ix++) for (let iz = 0; iz < GZ; iz++) { const x = (ix - GX / 2) * SP + (iz % 2) * SP / 2, z = (iz - GZ / 2) * SP * .87; let y = .02 * Math.sin(x * 1.3 + t * 1.5) * Math.cos(z * 1.1 - t);
      for (const [px, pz, t0, amp] of impacts) { const d = Math.hypot(x - px, z - pz), dt = t - t0; if (dt > 0) y += amp * .16 * Math.sin(d * 3.2 - dt * 9) * Math.exp(-dt * 1.6) * Math.exp(-d * .45) * (d < dt * 3 ? 1 : 0); }
      for (let i = 0; i < 4; i++) if (t > LAND[i]) { const d = Math.hypot(x - LX[i], z); y -= .12 * Math.exp(-d * d / .9); }
      { const d = Math.hypot(x - ball.position.x, z - ball.position.z); y -= .14 * Math.exp(-d * d / .35); }
      dummy.position.set(x, y, z); dummy.updateMatrix(); beads.setMatrixAt(k++, dummy.matrix); }
    beads.instanceMatrix.needsUpdate = true;
    R.render(scene, cam); ctx.drawImage(R.domElement, 0, 0, W, H);
    // 2D 字：结尾的标语和品牌
    const s = E.outC(seg(t, 5.6, 6.3)), s2 = E.outC(seg(t, 6.1, 6.8)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.globalAlpha = s; ctx.fillStyle = '#5B3FA8'; ctx.font = `800 58px ${CN}`; ctx.fillText('软软的，才最有力量', 960, 930 + (1 - s) * 16);
    ctx.globalAlpha = s2; ctx.font = `700 22px ${CN}`; ctx.letterSpacing = '8px'; ctx.fillStyle = 'rgba(91,63,168,.7)'; ctx.fillText('PUFF STUDIO · 泡芙工作室', 965, 995); ctx.letterSpacing = '0px'; ctx.globalAlpha = 1;
  },
  audio() {
    const m = new Mix(DUR + .3);
    m.tone(0, DUR, 130.8, { wave: 'sine', vol: .06, env: [1, .1, 1, 1] }); m.tone(0, DUR, 196, { wave: 'tri', vol: .025, env: [1.5, .1, 1, 1] });
    for (let b = 0; b < DUR; b += .5) { m.kick(b, .18); m.hat(b + .25, .025); }
    LAND.forEach((t0, i) => { m.boing(t0, .22); m.tone(t0, .12, 440 * 2 ** ((72 + [0, 4, 7, 12][i] - 69) / 12), { vol: .08 }); m.pop(t0 + .3, .06); });
    m.whoosh(3.2, 1, .06); m.boing(4.25, .25); m.ding(5.6, .14); [79, 84, 88].forEach((n, i) => m.tone(6.1 + i * .08, .6, 440 * 2 ** ((n - 69) / 12), { vol: .05 }));
    m.echo(.22, .3, .2); return m.master();
  },
};
