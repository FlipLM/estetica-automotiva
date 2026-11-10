import {
  Object3D,
  Quaternion,
  Vector3,
  Mesh,
  Group,
  MeshStandardMaterial,
  TorusGeometry,
  CylinderGeometry,
} from "three";

export const MODEL_VERSION = "palio-1997-30532acbac63-v2";
export const MODEL_URL = "/models/palio-1997.glb";

export const PARTS = [
  { id: "door_lf", node: "door_lf_dummy", label: "Porta Dianteira Esquerda", axis: [0, 0, 1], angle: -1.05 },
  { id: "door_rf", node: "door_rf_dummy", label: "Porta Dianteira Direita", axis: [0, 0, 1], angle: 1.05 },
  { id: "door_lr", node: "door_lr_dummy", label: "Porta Traseira Esquerda", axis: [0, 0, 1], angle: -1.05 },
  { id: "door_rr", node: "door_rr_dummy001", label: "Porta Traseira Direita", axis: [0, 0, 1], angle: 1.05 },
  { id: "hood", node: "bonnet_dummy", label: "Capô do Motor", axis: [1, 0, 0], angle: 1.05 },
  { id: "trunk", node: "boot_dummy", label: "Porta-Malas", axis: [1, 0, 0], angle: -1.1 },
] as const;

export type PartId = (typeof PARTS)[number]["id"];

export type Anchor = {
  version: 1;
  modelVersion: string;
  node: string;
  part: string;
  position: [number, number, number];
  normal: [number, number, number];
  revealAny: PartId[];
};

export type OpenState = Partial<Record<PartId, boolean>>;

// Materiais mapeados para lataria/pintura do veículo
const PAINT = new Set([
  "g10m1",
  "g9m1",
  "g8m1",
  "g7m0",
  "g6m1",
  "g0m3",
  "g11m0001",
  "g11m0.001",
]);

export function prepareScene(source: Object3D) {
  const scene = source.clone(true);
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const clone = (material: MeshStandardMaterial) => {
      const result = material.clone();
      if (PAINT.has(material.name)) {
        // Tonalidade cinza titânio premium com reflexo elegante
        result.color.set("#9ba7ae");
        result.metalness = 0.55;
        result.roughness = 0.32;
      }
      return result;
    };
    object.material = Array.isArray(object.material)
      ? object.material.map((m) => clone(m as MeshStandardMaterial))
      : clone(object.material as MeshStandardMaterial);
  });

  // Montagem de rodas auxiliares de alta qualidade geométrica
  for (const [id, x, z] of [
    ["lf", -0.86, -1.36],
    ["rf", 0.98, -1.36],
    ["lr", -0.86, 1.43],
    ["rr", 0.98, 1.43],
  ] as const) {
    const wheel = new Group();
    wheel.name = `apex_wheel_${id}`;
    wheel.position.set(x, -0.3, z);

    const tire = new Mesh(
      new TorusGeometry(0.265, 0.105, 12, 40),
      new MeshStandardMaterial({ color: "#202326", roughness: 0.92 })
    );
    tire.name = `${wheel.name}_tire`;
    tire.rotation.y = Math.PI / 2;
    wheel.add(tire);

    const rim = new Mesh(
      new CylinderGeometry(0.225, 0.225, 0.15, 32),
      new MeshStandardMaterial({ color: "#73818b", metalness: 0.75, roughness: 0.35 })
    );
    rim.name = `${wheel.name}_rim`;
    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);

    const hub = new Mesh(
      new CylinderGeometry(0.075, 0.075, 0.17, 16),
      new MeshStandardMaterial({ color: "#293640", metalness: 0.6, roughness: 0.4 })
    );
    hub.name = `${wheel.name}_hub`;
    hub.rotation.z = Math.PI / 2;
    wheel.add(hub);

    scene.add(wheel);
  }

  return scene;
}

export function revealed(anchor: Anchor, open: OpenState) {
  return anchor.revealAny.length === 0 || anchor.revealAny.some((id) => open[id]);
}

export function makeRig(scene: Object3D) {
  return PARTS.map((part) => {
    const node = scene.getObjectByName(part.node);
    if (!node || !node.children.length) {
      throw new Error(`Modelo incompatível ou nó ausente: ${part.node}`);
    }
    const closed = node.quaternion.clone();
    const opened = closed
      .clone()
      .multiply(
        new Quaternion().setFromAxisAngle(
          new Vector3(...(part.axis as [number, number, number])),
          part.angle
        )
      );
    return { ...part, node, closed, opened };
  });
}

export function describeHit(
  node: Object3D,
  worldPoint: Vector3,
  localNormal?: Vector3
): Pick<Anchor, "part" | "revealAny"> {
  for (let current: Object3D | null = node; current; current = current.parent) {
    if (current.name.startsWith("apex_wheel_")) {
      return {
        part: current.name.split("_").slice(0, 3).join("_"),
        revealAny: [],
      };
    }
    const part = PARTS.find((p) => p.node === current!.name);
    if (part) {
      const normal = localNormal
        ?.clone()
        .transformDirection(node.matrixWorld)
        .transformDirection(current.matrixWorld.clone().invert());
      const inside =
        normal &&
        (part.id.startsWith("door_")
          ? normal.x * (part.id.includes("_l") ? -1 : 1) < -0.2
          : part.id === "hood"
          ? normal.z < -0.2
          : normal.y > 0.2);
      return { part: part.id, revealAny: inside ? [part.id] : [] };
    }
    if (current.name === "motor") return { part: "engine", revealAny: ["hood"] };
    if (current.name === "interior") {
      return worldPoint.z > 1.25
        ? { part: "cargo", revealAny: ["trunk"] }
        : { part: "interior", revealAny: ["door_lf", "door_rf", "door_lr", "door_rr"] };
    }
  }
  return { part: "body", revealAny: [] };
}

