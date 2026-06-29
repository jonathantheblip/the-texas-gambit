import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { roomBox } from '../model/compoundModel.js';
import RoomBox from './RoomBox.jsx';
import Diorama from './Diorama.jsx';
import WallHandles from './WallHandles.jsx';
import { cameraBus } from './cameraBus.js';
import { canonicalId } from '../data/aliases.js';

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

function SceneContents({ rooms, framing, allRooms, selectedId, onSelect, xray, mode, entryFacing, focusId, instantArrival = false, enableControls = true, background = '#e9e5db' }) {
  const controls = useRef();
  const { camera } = useThree();
  const tween = useRef(null);
  const inited = useRef(false);
  const { center, radius, gridSize, gridCenter, northTip } = framing;

  useEffect(() => {
    const c = controls.current;
    if (c) { c.target.set(center[0], center[1], center[2]); c.update(); }
  }, [center]);

  // Place the camera on the side you "came from" so arrival ≈ the render's viewpoint.
  function offsetFor(facing, dist) {
    const h = dist * 0.5;
    switch (facing) {
      case 'N': return [0, h, dist];      // looking north (−z) → camera to the south (+z)
      case 'S': return [0, h, -dist];
      case 'E': return [-dist, h, 0];     // looking east (+x) → camera to the west (−x)
      case 'W': return [dist, h, 0];
      default:  return [dist * 0.6, h, dist * 0.7]; // isometric default
    }
  }
  // Where the camera sits to "stand in" a room: framed close enough to land ON
  // that space (not the whole estate), with enough back-off to read its shape.
  function poseFor(roomId, facing) {
    const room = allRooms?.find((r) => r.id === roomId);
    if (!room) return null;
    const b = roomBox(room);
    const target = new THREE.Vector3(b.position[0], b.position[1], b.position[2]);
    const dist = Math.max(room.w, room.d, room.height) * 2.0 + 16;
    const [ox, oy, oz] = offsetFor(facing, dist);
    return { target, pos: target.clone().add(new THREE.Vector3(ox, oy, oz)) };
  }
  function driftToRoom(roomId, facing = null, { arc = false } = {}) {
    if (!controls.current) return;
    const pose = poseFor(roomId, facing);
    if (!pose) return;
    const fromPos = camera.position.clone();
    // A flight lifts up and over the masses at mid-move (so you read the building
    // you're crossing, not the dark insides of close-framed rooms), then descends
    // onto the destination. Lift scales with how far you're travelling.
    const horiz = Math.hypot(pose.pos.x - fromPos.x, pose.pos.z - fromPos.z);
    const arcLift = arc ? Math.max(16, Math.min(140, horiz * 0.4)) : 0;
    tween.current = {
      t: 0, dur: 1.1, roomId, arcLift,
      fromPos,
      toPos: pose.pos,
      fromTarget: controls.current.target.clone(),
      toTarget: pose.target,
    };
  }
  // Snap straight to a room's pose, no glide — used to seat the fly-to substrate
  // exactly where the eye already is before the first flight (so the reveal matches).
  function placeAtRoom(roomId, facing = null) {
    if (!controls.current) return;
    const pose = poseFor(roomId, facing);
    if (!pose) return;
    tween.current = null;
    camera.position.copy(pose.pos);
    controls.current.target.copy(pose.target);
    controls.current.update();
  }

  // Design's camera API: cameraBus.driftTo(roomId, facing). Code owns the move.
  // Calls through the bus are flights between rooms → arc up and over the masses.
  useEffect(() => cameraBus._register((roomId, facing) => driftToRoom(roomId, facing, { arc: true })), [allRooms, camera]);

  useFrame((_, dt) => {
    if (!inited.current) {
      inited.current = true;
      // arrival pose on entry — snap (fly-to substrate, seated behind the render)
      // or glide (step-into, watched through the cross-fade).
      if (selectedId) (instantArrival ? placeAtRoom : driftToRoom)(selectedId, entryFacing);
      cameraBus._ready(selectedId || null);                  // first frame painted → safe to cross-fade
    }
    const tw = tween.current;
    if (!tw || !controls.current) return;
    tw.t = Math.min(1, tw.t + dt / tw.dur);
    const e = tw.t < 0.5 ? 2 * tw.t * tw.t : 1 - Math.pow(-2 * tw.t + 2, 2) / 2; // ease in-out
    camera.position.lerpVectors(tw.fromPos, tw.toPos, e);
    if (tw.arcLift) camera.position.y += tw.arcLift * Math.sin(Math.PI * e); // rise at mid-flight, settle on arrival
    controls.current.target.lerpVectors(tw.fromTarget, tw.toTarget, e);
    controls.current.update();
    if (tw.t >= 1) { tween.current = null; cameraBus._arrived(tw.roomId); }
  });

  const northDir = useMemo(() => new THREE.Vector3(0, 0, -1), []);
  const northOrigin = useMemo(() => new THREE.Vector3(...framing.southBase), [framing.southBase]);

  // The room whose walls are grabbable (the canonical selected room, with edits applied).
  const editRoom = selectedId ? rooms.find((r) => r.id === selectedId) : null;

  return (
    <>
      <color attach="background" args={[background]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[0.5, 1, 0.35].map((v) => v * radius)} intensity={0.7} />
      <directionalLight position={[-0.6, 0.4, -0.5].map((v) => v * radius)} intensity={0.28} />

      <gridHelper args={[gridSize, gridSize / 20, '#bfb8a8', '#d5cfc0']} position={gridCenter} />

      {/* North indicator */}
      <arrowHelper args={[northDir, northOrigin, Math.min(40, radius * 0.12), 0x9a3b2a, 10, 7]} />
      <Html position={northTip} center style={{ font: '600 13px Inter, sans-serif', color: '#9a3b2a', pointerEvents: 'none' }}>N</Html>

      {/* Aliased rooms (e.g. Octagonal Stair Hall → Entry Hall) read as one space:
          both boxes select/highlight/focus together, and clicking either selects the
          canonical room. */}
      {mode !== 'diorama' && rooms.map((r) => (
        <RoomBox key={r.id} room={r} selected={canonicalId(r.id) === selectedId} xray={xray || mode === 'both'} dim={Boolean(focusId) && canonicalId(r.id) !== focusId} onSelect={(rid) => onSelect(canonicalId(rid))} />
      ))}
      {mode !== 'massing' && (
        <Diorama rooms={rooms.filter((r) => r.renderImage)} selectedId={selectedId} focusId={focusId} onSelect={(rid) => onSelect(canonicalId(rid))} />
      )}

      {/* Grab-a-wall: drag handles on the selected room (massing mode), live-validated. */}
      {mode === 'massing' && editRoom && <WallHandles room={editRoom} />}

      <OrbitControls ref={controls} makeDefault enabled={enableControls} enableDamping dampingFactor={0.08} maxDistance={radius * 3} minDistance={5} />
    </>
  );
}

export default function CompoundScene({ rooms, framingRooms, selectedId, onSelect, xray, mode = 'both', entryFacing = null, focusId = null, frameloop, instantArrival = false, enableControls = true, background = '#e9e5db' }) {
  const framing = useFraming(framingRooms);
  const camPos = useMemo(() => {
    const [cx, cy, cz] = framing.center;
    const r = framing.radius;
    return [cx + r * 0.5, cy + r * 0.45, cz + r * 0.55];
  }, [framing]);

  return (
    <Canvas
      frameloop={frameloop}
      camera={{ position: camPos, fov: 45, near: 0.5, far: 8000 }}
      onPointerMissed={() => onSelect(null)}
      dpr={[1, 2]}
    >
      <SceneContents rooms={rooms} framing={framing} allRooms={framingRooms} selectedId={selectedId} onSelect={onSelect} xray={xray} mode={mode} entryFacing={entryFacing} focusId={focusId} instantArrival={instantArrival} enableControls={enableControls} background={background} />
    </Canvas>
  );
}
