import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Finish } from "../../generated/prisma/client";

// ============================================================================
// Busca de dados de carta no Scryfall, DO LADO DO SERVIDOR.
//
// O cliente envia só o externalId; nome, set e imagem são buscados aqui,
// na fonte. Se o navegador pudesse mandar o nome junto, alguém cadastraria
// "Black Lotus" apontando pra um Mountain qualquer.
// ============================================================================

const API_BASE_URL = "https://api.scryfall.com";

// O Scryfall EXIGE os cabeçalhos User-Agent e Accept. Requisição sem eles é
// recusada com HTTP 400 — que aqui virava um 502 "Scryfall respondeu HTTP 400".
// O fetch do Node não manda nenhum dos dois por padrão; no navegador funciona
// porque o próprio browser preenche. Docs: scryfall.com/docs/api
const SCRYFALL_HEADERS = {
  "User-Agent": "TCGPumpkin/0.1",
  Accept: "application/json;q=0.9,*/*;q=0.8",
} as const;

// Só o que o Product precisa — irmão do ScryfallCard do frontend (mtg.ts).
interface ScryfallCardResponse {
  id: string;
  name: string;
  set?: string;
  set_name?: string;
  collector_number?: string;
  finishes?: string[];
  image_uris?: { normal?: string };
  card_faces?: { image_uris?: { normal?: string } }[];
}

export interface ScryfallProductData {
  externalId: string;
  name: string;
  setCode?: string;
  setName?: string;
  collectorNumber?: string;
  imageUrl?: string;
  // Acabamentos que ESTA impressão realmente tem. Valida a entrada:
  // impede cadastrar foil de carta que nunca saiu em foil.
  finishes: Finish[];
}

const FINISH_MAP: Record<string, Finish> = {
  nonfoil: Finish.NONFOIL,
  foil: Finish.FOIL,
  etched: Finish.ETCHED,
};

@Injectable()
export class ScryfallService {
  async getCardForProduct(externalId: string): Promise<ScryfallProductData> {
    const response = await fetch(
      `${API_BASE_URL}/cards/${encodeURIComponent(externalId)}`,
      { headers: SCRYFALL_HEADERS }
    );
    if (response.status === 404) {
      throw new NotFoundException(
        `Carta ${externalId} não encontrada no Scryfall`
      );
    }
    if (!response.ok) {
      // 502: a falha é do serviço externo, não do cliente nem nossa.
      throw new BadGatewayException(
        `Scryfall respondeu HTTP ${response.status}`
      );
    }

    const card = (await response.json()) as ScryfallCardResponse;
    return {
      externalId: card.id,
      name: card.name,
      setCode: card.set?.toUpperCase(),
      setName: card.set_name,
      collectorNumber: card.collector_number,
      imageUrl:
        card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal,
      finishes: (card.finishes ?? [])
        .map((f) => FINISH_MAP[f])
        .filter((f): f is Finish => f !== undefined),
    };
  }
}
