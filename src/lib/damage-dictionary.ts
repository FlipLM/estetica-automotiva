// Dicionário Centralizado de Áreas e Tipos de Avaria
// Garante tradução amigável em português em toda a aplicação e nos laudos PDF oficiais.

export const DAMAGE_AREAS: Record<string, string> = {
  WHEEL_FRONT_LEFT: "Roda Diant. Esquerda / Pneu",
  WHEEL_FRONT_RIGHT: "Roda Diant. Direita / Pneu",
  WHEEL_REAR_LEFT: "Roda Tras. Esquerda / Pneu",
  WHEEL_REAR_RIGHT: "Roda Tras. Direita / Pneu",
  FRONT_BUMPER: "Para-choque Dianteiro / Grade",
  HOOD: "Capô Dianteiro",
  HEADLIGHTS: "Faróis Dianteiros / Milhas",
  MIRROR_LEFT: "Retrovisor Esquerdo",
  MIRROR_RIGHT: "Retrovisor Direito",
  WINDSHIELD: "Vidro Dianteiro / Para-brisa",
  ROOF: "Teto",
  LEFT_SIDE: "Lateral Esquerda (Portas/Para-lama)",
  RIGHT_SIDE: "Lateral Direita (Portas/Para-lama)",
  REAR_GLASS: "Vidro Traseiro",
  TRUNK: "Tampa Traseira / Porta-malas",
  REAR_BUMPER: "Para-choque Traseiro / Difusor",
  TAILLIGHTS: "Lanternas Traseiras",
  INTERIOR: "Interior / Bancos / Painel",
  PLASTICS: "Partes Plásticas / Frisos / Borrachas",
  FRONT: "Dianteira / Capô",
  REAR: "Traseira / Porta-malas",
  LEFT: "Lateral Esquerda",
  RIGHT: "Lateral Direita",
  GLASS: "Vidros / Para-brisa",
};

export const DAMAGE_TYPES: Record<string, string> = {
  SCRATCH: "Risco / Arranhão",
  DENT: "Amassado / Pique",
  CHIP: "Picado de Pedra / Lasca",
  PAINT_BURN: "Queimado de Sol / Verniz",
  SWIRL: "Marcas de Holograma / Swirls",
  PEELING: "Descascado de Verniz",
  RIPPED_TEAR: "Rasgo / Desgaste (Bancos/Pneu)",
  CURB_RASH: "Ralado de Guia / Meio-fio",
  CRACK: "Trinca / Quebrado",
  STAIN: "Mancha / Contaminação",
  RUST: "Ponto de Ferrugem / Oxidação",
  OTHER: "Outra Avaria",
};

export function translateArea(area?: string | null): string {
  if (!area) return "Geral / Não especificado";
  if (DAMAGE_AREAS[area]) return DAMAGE_AREAS[area];
  
  // Limpeza de códigos desconhecidos para apresentação legível
  return area
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
}

export function translateDamageType(type?: string | null): string {
  if (!type) return "Avaria";
  if (DAMAGE_TYPES[type]) return DAMAGE_TYPES[type];

  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
}

