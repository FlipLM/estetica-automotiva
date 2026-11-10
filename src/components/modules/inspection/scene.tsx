"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { Group, Mesh, Vector3, Object3D } from "three";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useReducedMotion } from "framer-motion";
import {
  Anchor,
  makeRig,
  prepareScene,
  describeHit,
  MODEL_URL,
  MODEL_VERSION,
  OpenState,
  revealed,
  PartId,
  PARTS,
} from "./palio";
import type { DamagePin } from "../vehicle-silhouette-360";

type Props = {
  damages: DamagePin[];
  pendingAnchor?: Anchor | null;
  open: OpenState;
  readOnly: boolean;
  cameraResetTrigger?: number;
  onPick: (anchor: Anchor) => void;
  onTogglePart: (partId: PartId) => void;
  onSelect: (index: number) => void;
  onFailure: () => void;
};

const DEFAULT_CAMERA: [number, number, number] = [5.2, 2.9, -6.3];

function getCameraForViewport(width: number, height: number): [number, number, number] {
  const aspect = width / Math.max(1, height);
  if (width < 640 || aspect < 0.95) {
    return [11.2, 6.2, -13.5];
  }
  if (width < 1024 || aspect < 1.25) {
    return [7.8, 4.3, -9.4];
  }
  return [5.2, 2.9, -6.3];
}

function Car({
  damages,
  pendingAnchor,
  open,
  readOnly,
  cameraResetTrigger = 0,
  onPick,
  onTogglePart,
  onSelect,
}: Omit<Props, "onFailure">) {
  const loaded = useGLTF(MODEL_URL, true, true, (loader) => {
    if (typeof (loader as any).setMeshoptDecoder === "function") {
      (loader as any).setMeshoptDecoder(MeshoptDecoder);
    }
  });
  const scene = useMemo(() => prepareScene(loaded.scene), [loaded.scene]);
  const rig = useMemo(() => makeRig(scene), [scene]);
  const reduced = useReducedMotion();
  const { camera, size, controls } = useThree();

  const moving = useRef(false);
  const targetCam = useRef(new Vector3(...DEFAULT_CAMERA));

  const lastClickRef = useRef<{ time: number; part: string }>({ time: 0, part: "" });
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const desired = getCameraForViewport(size.width, size.height);
    camera.position.set(...desired);
    camera.lookAt(0, 0.25, 0);
    targetCam.current.set(...desired);
    if (controls) {
      const orbit = controls as unknown as OrbitControlsImpl;
      orbit.target.set(0, 0.25, 0);
      orbit.update();
    }
  }, [size.width, size.height, camera, controls]);

  useEffect(() => {
    if (cameraResetTrigger > 0) {
      const resetCam = getCameraForViewport(size.width, size.height);
      targetCam.current.set(...resetCam);
      moving.current = true;
    }
  }, [cameraResetTrigger, size.width, size.height]);

  useEffect(() => {
    const stop = () => {
      moving.current = false;
    };
    const orbit = controls as unknown as OrbitControlsImpl | undefined;
    orbit?.addEventListener("start", stop);
    return () => orbit?.removeEventListener("start", stop);
  }, [controls]);

  useFrame((_, delta) => {
    rig.forEach((p) =>
      p.node.quaternion.slerp(
        open[p.id] ? p.opened : p.closed,
        reduced ? 1 : 1 - Math.exp(-12 * delta)
      )
    );
    scene.updateMatrixWorld(true);

    if (moving.current) {
      camera.position.lerp(targetCam.current, reduced ? 1 : 1 - Math.exp(-7 * delta));
      camera.lookAt(0, 0.25, 0);
      if (camera.position.distanceTo(targetCam.current) < 0.02) moving.current = false;
    }
  });

  useEffect(() => {
    return () => {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    };
  }, []);

  function handleSceneClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (readOnly || e.delta > 5 || !e.face) return;

    const hit = describeHit(e.object, e.point, e.face.normal);
    const now = Date.now();
    const isArticulatedPart = PARTS.some((p) => p.id === hit.part);

    if (isArticulatedPart) {
      // Duplo clique na porta/capô/porta-malas abre ou fecha a peça
      if (now - lastClickRef.current.time < 320 && lastClickRef.current.part === hit.part) {
        if (clickTimerRef.current) {
          clearTimeout(clickTimerRef.current);
          clickTimerRef.current = null;
        }
        lastClickRef.current = { time: 0, part: "" };
        onTogglePart(hit.part as PartId);
        return;
      }

      lastClickRef.current = { time: now, part: hit.part };
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

      const targetObject = e.object;
      const targetPoint = e.point.clone();
      const targetNormal = e.face.normal.clone();

      clickTimerRef.current = setTimeout(() => {
        const anchor: Anchor = {
          version: 1,
          modelVersion: MODEL_VERSION,
          node: targetObject.name,
          ...hit,
          position: targetObject.worldToLocal(targetPoint).toArray() as [number, number, number],
          normal: targetNormal.toArray() as [number, number, number],
        };
        if (revealed(anchor, open)) {
          onPick(anchor);
        }
        clickTimerRef.current = null;
      }, 220);
      return;
    }

    // Clique em superfície estática (teto, lataria, motor, interior, roda)
    const anchor: Anchor = {
      version: 1,
      modelVersion: MODEL_VERSION,
      node: e.object.name,
      ...hit,
      position: e.object.worldToLocal(e.point.clone()).toArray() as [number, number, number],
      normal: e.face.normal.toArray() as [number, number, number],
    };
    if (revealed(anchor, open)) {
      onPick(anchor);
    }
  }

  return (
    <>
      <primitive object={scene} onClick={handleSceneClick} />

      {/* Marcador provisório enquanto o usuário preenche a avaria */}
      {pendingAnchor && pendingAnchor.modelVersion === MODEL_VERSION && (
        <Pin
          anchor={pendingAnchor}
          scene={scene}
          visible={revealed(pendingAnchor, open)}
          isPending
        />
      )}

      {/* Marcadores salvos na vistoria */}
      {damages.map(
        (d, index) =>
          d.anchor3D &&
          d.anchor3D.modelVersion === MODEL_VERSION && (
            <Pin
              key={d.id || index}
              anchor={d.anchor3D}
              scene={scene}
              visible={revealed(d.anchor3D, open)}
              onSelect={() => onSelect(index)}
            />
          )
      )}
    </>
  );
}

function Pin({
  anchor,
  scene,
  visible,
  selected = false,
  isPending = false,
  onSelect,
}: {
  anchor: Anchor;
  scene: Object3D;
  visible: boolean;
  selected?: boolean;
  isPending?: boolean;
  onSelect?: () => void;
}) {
  const ref = useRef<Group>(null);
  const ringRef = useRef<Mesh>(null);
  const node = useMemo(() => scene.getObjectByName(anchor.node), [scene, anchor.node]);
  const local = useMemo(() => new Vector3(...anchor.position), [anchor.position]);
  const point = useMemo(() => new Vector3(), []);
  const normal = useMemo(() => new Vector3(), []);

  useFrame(({ clock }) => {
    if (!ref.current || !node) return;
    point.copy(local);
    node.localToWorld(point);
    normal.set(...anchor.normal).transformDirection(node.matrixWorld);
    ref.current.position.copy(point).addScaledVector(normal, 0.045);

    if (ringRef.current && isPending) {
      const scale = 1 + Math.sin(clock.elapsedTime * 7) * 0.18;
      ringRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!node) return null;

  const pinColor = isPending ? "#DC4C4C" : selected ? "#F59E0B" : "#247653";

  return (
    <group
      ref={ref}
      visible={visible}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      <mesh castShadow>
        <sphereGeometry args={[0.075, 20, 20]} />
        <meshStandardMaterial
          color={pinColor}
          emissive={pinColor}
          emissiveIntensity={isPending ? 0.6 : selected ? 0.45 : 0.25}
          metalness={0.2}
          roughness={0.2}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>

      <mesh ref={ringRef} scale={[1.35, 1.35, 1.35]}>
        <sphereGeometry args={[0.075, 16, 12]} />
        <meshBasicMaterial
          color={isPending ? "#F87171" : selected ? "#FDE68A" : "#6EE7B7"}
          wireframe
          transparent
          opacity={isPending ? 0.85 : selected ? 0.7 : 0.4}
        />
      </mesh>
    </group>
  );
}

function ContextGuard({ onFailure }: { onFailure: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const lost = (e: Event) => {
      e.preventDefault();
      onFailure();
    };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  return null;
}

export default function InspectionScene(props: Props) {
  return (
    <Canvas
      camera={{ position: DEFAULT_CAMERA, fov: 40 }}
      dpr={[1, 1.5]}
      fallback={
        <div className="p-8 text-center text-xs text-[#737D75]">
          Aceleração 3D WebGL indisponível neste navegador ou aparelho.
        </div>
      }
    >
      <color attach="background" args={["#F8FAF8"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 7, -5]} intensity={2.6} />
      <directionalLight position={[-4, 5, 5]} intensity={1.2} />

      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} intensity={3} />
          <Lightformer position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} intensity={2} />
        </Environment>
        <Car {...props} />
      </Suspense>

      <OrbitControls
        makeDefault
        target={[0, 0.25, 0]}
        enablePan={false}
        minDistance={1.2}
        maxDistance={28}
        maxPolarAngle={Math.PI * 0.9}
      />
      <ContextGuard onFailure={props.onFailure} />
    </Canvas>
  );
}

