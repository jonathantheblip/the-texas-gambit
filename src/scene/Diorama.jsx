import { Suspense } from 'react';
import { Billboard, Image } from '@react-three/drei';

/**
 * Diorama mode — the colored-pencil renders standing in 3D space, each at its
 * room's place and floor height, like a pop-up-book model of the compound.
 * Cards billboard toward the camera so they stay readable as you orbit.
 * (First Code prototype of Jon's "renders in 3D" aspiration; Design will refine.)
 */
function Card({ room, selected, onSelect }) {
  const cx = room.x + room.w / 2;
  const czN = -(room.y + room.d / 2);
  const footprint = Math.max(room.w, room.d);
  const w = Math.min(Math.max(footprint, 12), 38);   // clamp so tiny rooms stay legible, huge ones don't dominate
  const h = w * (2 / 3);                              // renders are ~3:2
  const y = room.zFloor + h / 2 + 1.5;               // stand just above the floor plane

  return (
    <Billboard position={[cx, y, czN]}>
      {selected && (
        <mesh position={[0, 0, -0.15]}>
          <planeGeometry args={[w + 1.4, h + 1.4]} />
          <meshBasicMaterial color="#b5462f" />
        </mesh>
      )}
      <Image
        url={room.renderImage}
        scale={[w, h]}
        transparent
        toneMapped={false}
        onClick={(e) => { e.stopPropagation(); onSelect(room.id); }}
        onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      />
    </Billboard>
  );
}

export default function Diorama({ rooms, selectedId, onSelect }) {
  // Per-card Suspense so renders pop in independently as their textures decode —
  // one slow/missing image can't blank the whole diorama.
  return rooms.map((r) => (
    <Suspense key={r.id} fallback={null}>
      <Card room={r} selected={r.id === selectedId} onSelect={onSelect} />
    </Suspense>
  ));
}
