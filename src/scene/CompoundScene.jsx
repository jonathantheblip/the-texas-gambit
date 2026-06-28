import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import RoomBox from './RoomBox.jsx';

/**
 * Compute a sensible framing of the whole compound in three.js world space.
 * World mapping (from compoundModel.js): East=+x, Up=+y, North=-z.
 */
function useFraming(rooms) {
  return useMemo(() => {
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    rooms.forEach((r) => {
      minX = Math.min(minX, r.x);            maxX = Math.max(maxX, r.x + r.w);
      minZ = Math.min(minZ, -(r.y + r.d));   maxZ = Math.max(maxZ, -r.y);     // north -> -z
      minY = Math.min(minY, r.zFloor);       maxY = Math.max(maxY, r.zCeil ?? r.zFloor + r.height);
    });
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    const diag = Math.hypot(maxX - minX, maxZ - minZ, maxY - minY);
    const gridSize = Math.ceil((Math.max(maxX - minX, maxZ - minZ) * 1.3) / 20) * 20;
    return {
      center: [cx, Math.max(3, cy), cz],
      radius: diag,
      gridSize,
      gridCenter: [cx, 0, cz],
      northTip: [cx, 1.5, minZ - 10],   // north edge (-z)
      southBase: [cx, 1.5, maxZ + 8],
    };
  }, [rooms]);
}

function SceneContents({ rooms, framing, selectedId, onSelect, xray }) {
  const controls = useRef();
  const { center, radius, gridSize, gridCenter, northTip } = framing;

  useEffect(() => {
    const c = controls.current;
    if (c) { c.target.set(center[0], center[1], center[2]); c.update(); }
  }, [center]);

  const northDir = useMemo(() => new THREE.Vector3(0, 0, -1), []);
  const northOrigin = useMemo(() => new THREE.Vector3(...framing.southBase), [framing.southBase]);

  return (
    <>
      <color attach="background" args={['#e9e5db']} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[0.5, 1, 0.35].map((v) => v * radius)} intensity={0.7} />
      <directionalLight position={[-0.6, 0.4, -0.5].map((v) => v * radius)} intensity={0.28} />

      <gridHelper args={[gridSize, gridSize / 20, '#bfb8a8', '#d5cfc0']} position={gridCenter} />

      {/* North indicator */}
      <arrowHelper args={[northDir, northOrigin, Math.min(40, radius * 0.12), 0x9a3b2a, 10, 7]} />
      <Html position={northTip} center style={{ font: '600 13px Inter, sans-serif', color: '#9a3b2a', pointerEvents: 'none' }}>N</Html>

      {rooms.map((r) => (
        <RoomBox key={r.id} room={r} selected={r.id === selectedId} xray={xray} onSelect={onSelect} />
      ))}

      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} maxDistance={radius * 3} minDistance={5} />
    </>
  );
}

export default function CompoundScene({ rooms, framingRooms, selectedId, onSelect, xray }) {
  const framing = useFraming(framingRooms);
  const camPos = useMemo(() => {
    const [cx, cy, cz] = framing.center;
    const r = framing.radius;
    return [cx + r * 0.5, cy + r * 0.45, cz + r * 0.55];
  }, [framing]);

  return (
    <Canvas
      camera={{ position: camPos, fov: 45, near: 0.5, far: 8000 }}
      onPointerMissed={() => onSelect(null)}
      dpr={[1, 2]}
    >
      <SceneContents rooms={rooms} framing={framing} selectedId={selectedId} onSelect={onSelect} xray={xray} />
    </Canvas>
  );
}
