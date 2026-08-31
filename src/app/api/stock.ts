// ============================================================================
// Módulo de acesso à API de estoque do próprio TCGPumpkin (backend Nest).
//
// Espelha o papel do mtg.ts, mas para a NOSSA API: os componentes chamam
// getStockByExternalId() e não precisam saber a rota nem o formato do fetch.
//
// Em dev o caminho é relativo (/api): o Vite repassa para o Nest na 3333
// (ver o proxy no vite.config.ts). Em produção frontend e API ficam na
// mesma origem, então o caminho relativo continua valendo.
// ============================================================================

const API_BASE_URL = "/api";

export type Finish = "NONFOIL" | "FOIL" | "ETCHED";
export type Condition = "NM" | "SP" | "MP" | "HP" | "D";

// Uma variante à venda: mesma carta em acabamento/condição/idioma distintos
// é um item de estoque separado.
export interface StockOffer {
  id: string;
  finish: Finish;
  condition: Condition;
  language: string;
  quantity: number;
  priceCents: number;
}

// Formato bruto devolvido por GET /api/stock (só o que usamos aqui).
interface StockItemResponse {
  id: string;
  finish: Finish;
  condition: Condition;
  language: string;
  quantity: number;
  priceCents: number;
}

// Busca o estoque de UMA impressão, pelo id do Scryfall.
// Retorna só o que está de fato à venda (quantidade > 0), ordenado do mais
// barato para o mais caro — a ordem que o comprador espera.
export async function getStockByExternalId(
  externalId: string
): Promise<StockOffer[]> {
  const response = await fetch(
    `${API_BASE_URL}/stock?externalId=${encodeURIComponent(externalId)}`
  );
  if (!response.ok) {
    throw new Error(`Falha ao consultar o estoque (HTTP ${response.status})`);
  }

  const items: StockItemResponse[] = await response.json();
  return items
    .filter((item) => item.quantity > 0)
    .map((item) => ({
      id: item.id,
      finish: item.finish,
      condition: item.condition,
      language: item.language,
      quantity: item.quantity,
      priceCents: item.priceCents,
    }))
    .sort((a, b) => a.priceCents - b.priceCents);
}
