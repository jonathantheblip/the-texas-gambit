import { useMemo } from 'react';
import * as THREE from 'three';
import { Edges } from '@react-three/drei';
import { roomBox } from '../model/compoundModel.js';

const SELECT_EDGE = '#b5462f';
const BASE_EDGE = '#2c281f';

/**
 * One room rendered as a box, generated from the room table via roomBox().
 * Geometry is a unit cube scaled to [W, height, D] — never authored directly.
 */
const DIM_EDGE = '#cfc8ba';

export default function RoomBox({ room, selected, xray, dim, onSelect }) {
  const box = useMemo(() => roomBox(room), [room]);
  const color = useMemo(() => new THREE.Color(box.color[0], box.color[1], box.color[2]), [box.color]);

  // X-ray makes everything translucent so you can read interior layout.
  const base = xray ? Math.min(box.opacity, 0.22) : box.opacity;
  // `dim` ghosts the rooms you're NOT focused on (step-into from the walk), so the
  // room you're in reads clearly. Faded box + near-background edges.
  const opacity = dim ? Math.min(base, 0.06) : base;
  const transparent = opacity < 1;

  return (
    <mesh
      position={box.position}
      scale={box.scale}
      onClick={(e) => { e.stopPropagation(); onSelect(room.id); }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color={color}
        transparent={transparent}
        opacity={opacity}
        depthWrite={!transparent}
        roughness={0.92}
        metalness={0}
        emissive={SELECT_EDGE}
        emissiveIntensity={selected && !dim ? 0.22 : 0}
      />
      <Edges
        threshold={15}
        color={dim ? DIM_EDGE : selected ? SELECT_EDGE : BASE_EDGE}
        scale={1}
      />
    </mesh>
  );
}
