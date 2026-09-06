// ============================================================================
// Módulo de acesso à API Scryfall (https://scryfall.com/docs/api)
// Centralizar as chamadas HTTP aqui mantém os componentes limpos: eles só
// chamam searchCards() / getCardById() e não precisam saber a URL nem o fetch.
//
// A interface pública (MtgCard e as 4 funções) é a MESMA da versão anterior
// (magicthegathering.io), então Navbar e CardPage não precisaram mudar.
// O que o Scryfall devolve diferente é normalizado em toMtgCard():
//   - legalities vem como objeto ({ standard: "legal" }) -> viramos array
//   - rarity/set vêm em minúsculas -> capitalizamos para exibição
//   - imagem vem em image_uris (ou card_faces, em cartas dupla-face)
// ============================================================================

const API_BASE_URL = "https://api.scryfall.com";

// Formato de uma carta usado pelo app (só os campos que usamos).
export interface MtgCard {
  id: string;
  name: string;
  imageUrl?: string;      // pode não existir (nem toda carta tem imagem)
  manaCost?: string;      // ex.: "{2}{U}{U}"
  type?: string;          // ex.: "Legendary Creature — Merfolk Wizard"
  rarity?: string;        // ex.: "Rare"
  set?: string;           // código da coleção, ex.: "2X2"
  setName?: string;       // nome da coleção, ex.: "Double Masters 2022"
  collectorNumber?: string; // nº de coletor, ex.: "249" (diferencia artes no mesmo set)
  artist?: string;
  text?: string;          // texto de regras
  flavor?: string;        // texto de ambientação (itálico)
  power?: string;
  toughness?: string;
  legalities?: { format: string; legality: string }[];
}

// Formato bruto da carta como o Scryfall devolve (só o que nos interessa).
interface ScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  type_line?: string;
  rarity?: string;
  set?: string;
  set_name?: string;
  collector_number?: string;
  illustration_id?: string; // mesma arte => mesmo id (ex.: normal e surge foil)
  layout?: string;          // "token", "art_series", "emblem", ...
  oversized?: boolean;      // cartas superdimensionadas (não jogáveis)
  artist?: string;
  oracle_text?: string;
  flavor_text?: string;
  power?: string;
  toughness?: string;
  image_uris?: { normal?: string; large?: string };
  // Cartas dupla-face não têm image_uris/textos na raiz; vêm por face.
  card_faces?: {
    image_uris?: { normal?: string; large?: string };
    mana_cost?: string;
    oracle_text?: string;
    flavor_text?: string;
  }[];
  legalities?: Record<string, string>;
}

interface ScryfallList {
  data: ScryfallCard[];
  has_more?: boolean;
  next_page?: string; // URL pronta da próxima página (quando has_more)
}

// Usamos include_extras=true para não esconder sets "memorabilia" (ex.:
// Ponies: The Galloping, gold-bordered de Campeonato Mundial), que são
// itens vendáveis. O efeito colateral é a busca passar a devolver também
// tokens, art series etc. — que NÃO são cartas do catálogo; filtramos aqui.
const EXCLUDED_LAYOUTS = new Set([
  "token",
  "double_faced_token",
  "art_series",
  "emblem",
]);

function isCatalogCard(card: ScryfallCard): boolean {
  return !EXCLUDED_LAYOUTS.has(card.layout ?? "") && !card.oversized;
}

// Executa uma busca /cards/search e segue a paginação (175 cartas/página)
// até maxPages. 404 do Scryfall significa "sem resultados" => lista vazia.
async function fetchSearchAllPages(
  params: string,
  maxPages: number,
  errorLabel: string
): Promise<ScryfallCard[]> {
  let url: string | undefined =
    `${API_BASE_URL}/cards/search?${params}&include_extras=true`;
  const cards: ScryfallCard[] = [];

  for (let page = 0; url && page < maxPages; page++) {
    const response = await fetch(url);
    if (response.status === 404) return cards;
    if (!response.ok) {
      throw new Error(`${errorLabel} (HTTP ${response.status})`);
    }
    const data: ScryfallList = await response.json();
    cards.push(...(data.data ?? []));
    url = data.has_more ? data.next_page : undefined;
  }
  return cards;
}

// "rare" -> "Rare", "standard" -> "Standard"
function capitalize(value?: string): string | undefined {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : undefined;
}

// Converte o formato do Scryfall para o nosso MtgCard.
function toMtgCard(card: ScryfallCard): MtgCard {
  // Em cartas dupla-face, imagem e textos ficam dentro de card_faces.
  const face = card.card_faces?.[0];

  return {
    id: card.id,
    name: card.name,
    imageUrl: card.image_uris?.normal ?? face?.image_uris?.normal,
    manaCost: card.mana_cost ?? face?.mana_cost,
    type: card.type_line,
    rarity: capitalize(card.rarity),
    set: card.set?.toUpperCase(),
    setName: card.set_name,
    collectorNumber: card.collector_number,
    artist: card.artist,
    text: card.oracle_text ?? face?.oracle_text,
    flavor: card.flavor_text ?? face?.flavor_text,
    power: card.power,
    toughness: card.toughness,
    // Objeto -> array, com valores no formato antigo ("legal" -> "Legal"),
    // para o CardPage continuar filtrando por legality === "Legal".
    legalities: card.legalities
      ? Object.entries(card.legalities).map(([format, legality]) => ({
          format: capitalize(format) ?? format,
          legality: capitalize(legality) ?? legality,
        }))
      : undefined,
  };
}

// Busca cartas por nome (parcial). Retorna a lista de cartas encontradas.
export async function searchCards(name: string): Promise<MtgCard[]> {
  const query = name.trim();
  if (!query) return [];

  // name:"..." busca por trecho do nome; unique=cards traz 1 por nome
  // (sem repetir impressões), ideal para sugestões de busca.
  const q = `name:"${query.replace(/"/g, "")}"`;
  const cards = await fetchSearchAllPages(
    `q=${encodeURIComponent(q)}&unique=cards&order=name`,
    1, // 1 página basta para sugestões
    "Falha na busca"
  );
  return cards.filter(isCatalogCard).slice(0, 20).map(toMtgCard);
}

// Busca uma única carta pelo id (usado na página de detalhe).
export async function getCardById(id: string): Promise<MtgCard | null> {
  const response = await fetch(`${API_BASE_URL}/cards/${encodeURIComponent(id)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Carta não encontrada (HTTP ${response.status})`);
  }

  const data: ScryfallCard = await response.json();
  return toMtgCard(data);
}

// A busca pode trazer nomes repetidos; mantém cada nome só uma vez.
// (Com unique=cards o Scryfall já deduplica, mas mantemos por segurança
// e para não mudar o contrato com a Navbar.)
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

// Busca todas as impressões (versões) de UMA carta, pelo nome exato.
// Usado no seletor de versões da página de detalhe.
// !"Nome" = nome exato; unique=prints = todas as impressões.
//
// NÃO deduplicamos. O unique=prints já devolve cada impressão uma vez, e
// cada impressão é um PRODUTO diferente, com preço próprio.
//
// Duas impressões do mesmo set podem repetir a arte: no Commander de
// Warhammer 40k o Sol Ring tem 4 artes e 8 impressões, porque cada arte
// vem também em surge foil, marcada com ★ no número de coletor ("249★").
// A surge foil custa de 4 a 5 vezes o preço da normal. Colapsar as duas
// pela arte esconderia a versão cara da loja — quem distingue os botões é
// o número de coletor, não a figura.
export async function getCardPrintings(name: string): Promise<MtgCard[]> {
  const q = `!"${name.replace(/"/g, "")}"`;
  const raw = await fetchSearchAllPages(
    `q=${encodeURIComponent(q)}&unique=prints&order=released`,
    4, // até 700 impressões — cobre até as cartas mais reimpressas
    "Falha ao buscar versões"
  );

  // Sem imagem não dá para montar o botão do seletor.
  return raw
    .filter(isCatalogCard)
    .map(toMtgCard)
    .filter((card) => Boolean(card.imageUrl));
}
