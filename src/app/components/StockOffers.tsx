import { useEffect, useState } from "react";
import { getStockByExternalId, type Condition, type Finish, type StockOffer } from "../api/stock";

// ============================================================================
// Estoque da loja para UMA impressão de carta.
//
// Recebe o id do Scryfall e cuida sozinho da consulta. É por isso que ele
// acompanha o seletor de versões da CardPage de graça: mudou a impressão,
// mudou a prop, o efeito roda de novo.
//
// Se a API estiver fora do ar, o componente mostra o aviso e some — a página
// da carta continua utilizável, porque os dados dela vêm do Scryfall.
// ============================================================================

const FINISH_LABELS: Record<Finish, string> = {
  NONFOIL: "Normal",
  FOIL: "Foil",
  ETCHED: "Etched",
};

const CONDITION_LABELS: Record<Condition, string> = {
  NM: "NM",
  SP: "SP",
  MP: "MP",
  HP: "HP",
  D: "D",
};

const LANGUAGE_LABELS: Record<string, string> = {
  pt: "Português",
  en: "Inglês",
  es: "Espanhol",
  ja: "Japonês",
};

function formatPrice(priceCents: number): string {
  return (priceCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function StockOffers({ externalId }: { externalId: string }) {
  const [offers, setOffers] = useState<StockOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    // Guarda contra resposta atrasada: se o usuário trocar de versão antes
    // da requisição anterior voltar, ignoramos a que ficou obsoleta.
    let isCurrent = true;

    async function load() {
      setIsLoading(true);
      setHasFailed(false);
      try {
        const result = await getStockByExternalId(externalId);
        if (isCurrent) setOffers(result);
      } catch {
        if (isCurrent) {
          setOffers([]);
          setHasFailed(true);
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    load();
    return () => {
      isCurrent = false;
    };
  }, [externalId]);

  if (isLoading) {
    return <StockPanelMessage text="Consultando estoque..." />;
  }

  if (hasFailed) {
    return <StockPanelMessage text="Não foi possível consultar o estoque." />;
  }

  if (offers.length === 0) {
    return <StockPanelMessage text="Nenhuma unidade em estoque." />;
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ backgroundColor: "#1B1F22" }}>
      <ul>
        {offers.map((offer, index) => (
          <li
            key={offer.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4"
            style={{
              borderTop: index === 0 ? "none" : "1px solid #2C2422",
            }}
          >
            {/* Identificação da variante */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded"
                style={{
                  backgroundColor: offer.finish === "NONFOIL" ? "#2C2422" : "#DCBE50",
                  color: offer.finish === "NONFOIL" ? "#C3ACA2" : "#2C2422",
                }}
              >
                {FINISH_LABELS[offer.finish]}
              </span>
              <span className="text-sm" style={{ color: "#C3ACA2" }}>
                {CONDITION_LABELS[offer.condition]}
                {" · "}
                {LANGUAGE_LABELS[offer.language] ?? offer.language.toUpperCase()}
              </span>
            </div>

            {/* Disponibilidade e preço */}
            <div className="flex items-baseline gap-3 sm:justify-end">
              <span className="text-sm" style={{ color: "#C3ACA2" }}>
                {offer.quantity} {offer.quantity === 1 ? "disponível" : "disponíveis"}
              </span>
              <span className="text-base font-bold" style={{ color: "#DCBE50" }}>
                {formatPrice(offer.priceCents)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Painel de uma linha só: carregando, erro ou estoque vazio.
function StockPanelMessage({ text }: { text: string }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: "#1B1F22" }}>
      <span className="text-sm" style={{ color: "#C3ACA2" }}>
        {text}
      </span>
    </div>
  );
}
