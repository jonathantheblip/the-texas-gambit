import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges, Html } from '@react-three/drei';
import { buildingsOf, phaseOpacity } from './buildingMasses.js';

/**
 * BuildingMasses — the whole-compound bird's-eye. Each building is one translucent
 * mass, faded by build phase (earlier = solid, later = planned/faint), labelled,
 * and click-to-fly: tapping a mass (or its label) flies the camera down into that
 * building. Shown only in the bird's-eye; the per-room boxes return when you land.
 */
function Mass({ b, maxPhase, onFlyIn }) {
  const color = useMemo(() => new THREE.Color(b.color[0], b.color[1], b.color[2]), [b.color]);
  const opacity = phaseOpacity(b.phase, maxPhase);
  const fly = (e) => { e.stopPropagation?.(); onFlyIn(b.flyToId); };
  return (
    <group>
      <mesh
        position={b.center}
        scale={b.size}
        onClick={fly}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} depthWrite={false} roughness={0.85} metalness={0} />
        <Edges threshold={15} color="#2c281f" />
      </mesh>
      <Html position={[b.center[0], b.top + 8, b.center[2]]} center distanceFactor={150} zIndexRange={[12, 0]} occlude={false}>
        <button className="mass-label" onClick={fly}>
          <span className="nm">{b.building}</span>
          {b.phase != null && <span className="ph">Phase {b.phase}</span>}
        </button>
      </Html>
    </group>
  );
}

export default function BuildingMasses({ rooms, onFlyIn }) {
  const list = useMemo(() => buildingsOf(rooms), [rooms]);
  const maxPhase = useMemo(() => Math.max(1, ...list.map((b) => b.phase || 0)), [list]);
  return list.map((b) => <Mass key={b.building} b={b} maxPhase={maxPhase} onFlyIn={onFlyIn} />);
}
