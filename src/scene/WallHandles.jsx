import { useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { setOverride, getIdentity } from '../store/geometryStore.js';
import { wallResize } from './wallEdit.js';

/**
 * WallHandles — grab a wall of the selected room and drag it to resize the room,
 * live. The locks re-validate on every frame of the drag (setOverride updates the
 * shared geometry immediately); only the release commits a synced write
 * (sync:false during the drag → no backend spam).
 *
 * One grip per wall, each constrained to its own world axis:
 *   E/W → width (E–W),  N/S → depth (N–S),  Top → height.
 * The far wall stays anchored, so the room grows/shrinks from the wall you hold
 * (W/S also shift the SW corner x/y to keep the opposite wall put). Coordinates
 * follow compoundModel: x=East(+x), North=−z, Up=+y; 1 world unit = 1 foot.
 */
const R = 1.6;        // grip radius, feet

// kind → { grip world position, outward axis (dragging out grows the room), label }
function gripsFor(room) {
  const { x, y, w, d, zFloor, height } = room;
  const cx = x + w / 2, czN = -(y + d / 2), cyMid = zFloor + height / 2;
  return [
    { k: 'E', pos: [x + w, cyMid, czN],            axis: [1, 0, 0],  dim: 'w' },
    { k: 'W', pos: [x, cyMid, czN],                axis: [-1, 0, 0], dim: 'w' },
    { k: 'N', pos: [cx, cyMid, -(y + d)],          axis: [0, 0, -1], dim: 'd' },
    { k: 'S', pos: [cx, cyMid, -y],                axis: [0, 0, 1],  dim: 'd' },
    { k: 'T', pos: [cx, zFloor + height, czN],     axis: [0, 1, 0],  dim: 'height' },
  ];
}
const DIM_LABEL = { w: 'W', d: 'D', height: 'H' };

export default function WallHandles({ room }) {
  const { camera, gl, controls } = useThree();
  const ray = useRef(new THREE.Raycaster());
  const plane = useRef(new THREE.Plane());
  const tmp = useRef(new THREE.Vector3());
  const [active, setActive] = useState(null);   // kind currently being dragged

  const ndc = (ev) => {
    const r = gl.domElement.getBoundingClientRect();
    return new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
  };

  function startDrag(kind, axisArr) {
    return (e) => {
      e.stopPropagation();
      if (controls) controls.enabled = false;          // don't orbit while resizing
      document.body.style.cursor = 'grabbing';
      setActive(kind);
      const axis = new THREE.Vector3(...axisArr).normalize();
      // Drag on a camera-facing plane through the grab point; project travel onto
      // the wall's axis → feet moved. Relative to the grab point, so no jump.
      plane.current.setFromNormalAndCoplanarPoint(camera.getWorldDirection(tmp.current).clone().negate(), e.point.clone());
      const p0 = e.point.clone();
      const s = { x: room.x, y: room.y, w: room.w, d: room.d, h: room.height };
      const author = getIdentity();

      const resize = (delta, sync) => setOverride(room.id, wallResize(kind, s, delta), author, { sync });
      const deltaAt = (ev) => {
        ray.current.setFromCamera(ndc(ev), camera);
        const p = ray.current.ray.intersectPlane(plane.current, tmp.current);
        return p ? p.clone().sub(p0).dot(axis) : null;
      };
      const move = (ev) => { const dl = deltaAt(ev); if (dl != null) resize(dl, false); };
      const up = (ev) => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (controls) controls.enabled = true;
        document.body.style.cursor = 'auto';
        const dl = deltaAt(ev); if (dl != null) resize(dl, true);   // commit one synced write
        setActive(null);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };
  }

  const grips = gripsFor(room);
  return (
    <group>
      {grips.map((g) => (
        <mesh
          key={g.k}
          position={g.pos}
          onPointerDown={startDrag(g.k, g.axis)}
          onPointerOver={(e) => { e.stopPropagation(); if (!active) document.body.style.cursor = 'grab'; }}
          onPointerOut={() => { if (!active) document.body.style.cursor = 'auto'; }}
        >
          <sphereGeometry args={[active === g.k ? R * 1.25 : R, 20, 20]} />
          <meshStandardMaterial color={active === g.k ? '#8c321f' : '#b5462f'} emissive="#b5462f" emissiveIntensity={active === g.k ? 0.5 : 0.18} roughness={0.5} />
        </mesh>
      ))}
      {active && (
        <Html position={grips.find((g) => g.k === active).pos} center distanceFactor={42} zIndexRange={[20, 0]}>
          <div className="wall-readout">{DIM_LABEL[grips.find((g) => g.k === active).dim]} {room[grips.find((g) => g.k === active).dim]}′</div>
        </Html>
      )}
    </group>
  );
}
