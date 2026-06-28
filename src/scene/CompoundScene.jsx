import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { roomBox } from '../model/compoundModel.js';
import RoomBox from './RoomBox.jsx';
import Diorama from './Diorama.jsx';
import { cameraBus } from './cameraBus.js';

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

function SceneContents({ rooms, framing, allRooms, selectedId, onSelect, xray, mode }) {
  const controls = useRef();
  const { camera } = useThree();
  const tween = useRef(null);
  const { center, radius, gridSize, gridCenter, northTip } = framing;

  useEffect(() => {
    const c = controls.current;
    if (c) { c.target.set(center[0], center[1], center[2]); c.update(); }
  }, [center]);

  // Camera drift API — Design calls cameraBus.driftTo(roomId); Code owns the move.
  useEffect(() => cameraBus._register((roomId) => {
    const room = allRooms?.find((r) => r.id === roomId);
    if (!room || !controls.current) return;
    const b = roomBox(room);
    const target = new THREE.Vector3(b.position[0], b.position[1], b.position[2]);
    const dist = Math.max(room.w, room.d, room.height) * 2.4 + 16;
    tween.current = {
      t: 0, dur: 1.1, roomId,
      fromPos: camera.position.clone(),
      toPos: target.clone().add(new THREE.Vector3(dist * 0.6, dist * 0.55, dist * 0.7)),
      fromTarget: controls.current.target.clone(),
      toTarget: target,
    };
  }), [allRooms, camera]);

  useFrame((_, dt) => {
    const tw = tween.current;
    if (!tw || !controls.current) return;
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    const e = tw.t < 0.5 ? 2 * tw.t * tw.t : 1 - Math.pow(-2 * tw.t + 2, 2) / 2; // ease in-out
    camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
    controls.current.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
    controls.current.update();
    if (tw.t >= 1) { tween.current = null; cameraBus._arrived(tw.roomId); }
  });

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

      {mode !== 'diorama' && rooms.map((r) => (
        <RoomBox key={r.id} room={r} selected={r.id === selectedId} xray={xray || mode === 'both'} onSelect={onSelect} />
      ))}
      {mode !== 'massing' && (
        <Diorama rooms={rooms.filter((r) => r.renderImage)} selectedId={selectedId} onSelect={onSelect} />
      )}

      <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={0.08} maxDistance={radius * 3} minDistance={5} />
    </>
  );
}

export default function CompoundScene({ rooms, framingRooms, selectedId, onSelect, xray, mode = 'both' }) {
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
      <SceneContents rooms={rooms} framing={framing} allRooms={framingRooms} selectedId={selectedId} onSelect={onSelect} xray={xray} mode={mode} />
    </Canvas>
  );
}
