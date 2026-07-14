// ============================================================================
// Módulo de acesso à API Magic: The Gathering (https://docs.magicthegathering.io)
// Centralizar as chamadas HTTP aqui mantém os componentes limpos: eles só
// chamam searchCards() / getCardById() e não precisam saber a URL nem o fetch.
// ============================================================================

const API_BASE_URL = "https://api.magicthegathering.io/v1";

// Formato de uma carta (só os campos que usamos). A API retorna mais campos,
// mas declarar só o necessário deixa claro no que dependemos.
export interface MtgCard {
  id: string;
  name: string;
  imageUrl?: string;      // pode não existir (nem toda carta tem imagem)
  manaCost?: string;      // ex.: "{2}{U}{U}"
  type?: string;          // ex.: "Legendary Creature — Merfolk Wizard"
  rarity?: string;        // ex.: "Rare"
  set?: string;           // código da coleção, ex.: "2X2"
  setName?: string;       // nome da coleção, ex.: "Double Masters 2022"
  artist?: string;
  text?: string;          // texto de regras
  flavor?: string;        // texto de ambientação (itálico)
  power?: string;
  toughness?: string;
  legalities?: { format: string; legality: string }[];
}

// As imagens da API vêm em http://; forçamos https:// para evitar bloqueio
// de "conteúdo misto" quando o site estiver publicado com HTTPS.
function toHttps(url?: string): string | undefined {
  return url?.replace(/^http:\/\//, "https://");
}

function normalizeCard(card: MtgCard): MtgCard {
  return { ...card, imageUrl: toHttps(card.imageUrl) };
}

// Busca cartas por nome (parcial). Retorna a lista de cartas encontradas.
// Lança erro se a requisição falhar, para o componente tratar.
export async function searchCards(name: string): Promise<MtgCard[]> {
  const query = name.trim();
  if (!query) return [];

  const response = await fetch(
    `${API_BASE_URL}/cards?name=${encodeURIComponent(query)}&pageSize=20`
  );
  if (!response.ok) {
    throw new Error(`Falha na busca (HTTP ${response.status})`);
  }

  const data: { cards: MtgCard[] } = await response.json();
  return (data.cards ?? []).map(normalizeCard);
}

// Busca uma única carta pelo id (usado na página de detalhe).
export async function getCardById(id: string): Promise<MtgCard | null> {
  const response = await fetch(`${API_BASE_URL}/cards/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Carta não encontrada (HTTP ${response.status})`);
  }

  const data: { card: MtgCard } = await response.json();
  return data.card ? normalizeCard(data.card) : null;
}

// A busca traz várias "impressões" da mesma carta (mesmo nome em vários sets).
// Para as sugestões, queremos cada nome só uma vez — mantendo a 1ª que tiver id.
export function dedupeByName(cards: MtgCard[]): MtgCard[] {
  const seen = new Set<string>();
  const unique: MtgCard[] = [];
  for (const card of cards) {
    if (!seen.has(card.name)) {
      seen.add(card.name);
      unique.push(card);
    }
  }
  return unique;
}

// Busca todas as impressões (versões em coleções diferentes) de UMA carta,
// pelo nome exato. Usado no seletor de versões da página de detalhe.
// Retorna só as que têm imagem, uma por coleção (set).
export async function getCardPrintings(name: string): Promise<MtgCard[]> {
  const response = await fetch(
    `${API_BASE_URL}/cards?name=${encodeURIComponent(name)}&pageSize=100`
  );
  if (!response.ok) {
    throw new Error(`Falha ao buscar versões (HTTP ${response.status})`);
  }

  const data: { cards: MtgCard[] } = await response.json();
  const all = (data.cards ?? []).map(normalizeCard);

  // Mantém só as que têm exatamente este nome e possuem imagem.
  const exactWithImage = all.filter((card) => card.name === name && card.imageUrl);

  // Uma impressão por coleção (evita repetir o mesmo set várias vezes).
  const seenSets = new Set<string>();
  const printings: MtgCard[] = [];
  for (const card of exactWithImage) {
    const setKey = card.set ?? card.id;
    if (!seenSets.has(setKey)) {
      seenSets.add(setKey);
      printings.push(card);
    }
  }
  return printings;
}
