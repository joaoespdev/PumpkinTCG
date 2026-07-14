import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Heart, MoreVertical, ChevronLeft } from "lucide-react";
import { getCardById, getCardPrintings, type MtgCard } from "../api/mtg";

export function CardPage() {
  // Pega o :id da URL (ex.: /card/abc123 -> id = "abc123").
  const { id } = useParams<{ id: string }>();

  // A carta atualmente exibida (muda ao clicar numa versão/coleção).
  const [displayedCard, setDisplayedCard] = useState<MtgCard | null>(null);
  // Todas as impressões (versões) da carta, uma por coleção.
  const [printings, setPrintings] = useState<MtgCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Ao mudar o id: busca a carta e depois todas as suas versões.
  useEffect(() => {
    if (!id) return;

    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const mainCard = await getCardById(id);
        if (!mainCard) {
          setErrorMessage("Carta não encontrada.");
          return;
        }
        setDisplayedCard(mainCard);

        // Busca as outras versões (não bloqueia a exibição da carta principal).
        try {
          const versions = await getCardPrintings(mainCard.name);
          // Garante que a versão aberta esteja na lista, mesmo se filtrada.
          const hasCurrent = versions.some((v) => v.id === mainCard.id);
          setPrintings(hasCurrent || !mainCard.imageUrl ? versions : [mainCard, ...versions]);
        } catch {
          setPrintings([]);
        }
      } catch {
        setErrorMessage("Não foi possível carregar a carta.");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [id]);

  // --- Estados de carregamento e erro ---
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center" style={{ color: "#C3ACA2" }}>
        Carregando carta...
      </div>
    );
  }

  if (errorMessage || !displayedCard) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="mb-4" style={{ color: "#C3ACA2" }}>{errorMessage || "Carta não encontrada."}</p>
        <Link to="/" className="text-sm font-semibold" style={{ color: "#DCBE50" }}>
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  const card = displayedCard;

  // Formatos onde a carta é legal (a API não tem preço, mas tem legalidade).
  const legalFormats = (card.legalities ?? [])
    .filter((entry) => entry.legality === "Legal")
    .map((entry) => entry.format);

  return (
    <section className="max-w-7xl 3xl:max-w-[1600px] 4xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 3xl:py-12">
      {/* Voltar */}
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:underline"
        style={{ color: "#C3ACA2" }}
      >
        <ChevronLeft className="w-4 h-4" /> Voltar
      </Link>

      {/* Layout: [coluna de versões + imagem] à esquerda, informações à direita.
          - Celular: tudo empilhado em 1 coluna.
          - Tablet (md) em diante: 2 colunas; a da imagem cresce junto com a tela. */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,340px)_1fr] lg:grid-cols-[minmax(0,380px)_1fr] 3xl:grid-cols-[minmax(0,460px)_1fr] 4xl:grid-cols-[minmax(0,560px)_1fr] gap-6 lg:gap-8 3xl:gap-12">
        {/* No celular a lista de versões fica ABAIXO da imagem (col-reverse);
            de sm em diante volta a ser uma coluna vertical à esquerda da imagem. */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 md:self-start">
          {/* Coluna de versões (só aparece se houver mais de uma impressão) */}
          {printings.length > 1 && (
            <div
              className="flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible sm:overflow-y-auto sm:max-h-[480px] 3xl:max-h-[600px] 4xl:max-h-[730px] pb-1 sm:pb-0 sm:pr-1 flex-shrink-0"
              aria-label="Versões da carta por coleção"
            >
              {printings.map((printing) => {
                const isSelected = printing.id === card.id;
                return (
                  <button
                    key={printing.id}
                    onClick={() => setDisplayedCard(printing)}
                    title={printing.setName || printing.set}
                    className="w-11 h-11 3xl:w-13 3xl:h-13 rounded-md flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0"
                    style={{
                      backgroundColor: isSelected ? "#DCBE50" : "#1B1F22",
                      color: isSelected ? "#2C2422" : "#C3ACA2",
                      border: isSelected ? "2px solid #DCBE50" : "1px solid #2C2422",
                    }}
                  >
                    {/*
                      PLACEHOLDER do ícone da coleção: por enquanto mostra o código
                      do set (ex.: "2X2"). Quando tiver as imagens dos ícones, troque
                      este <span> por: <img src={iconePorSet[printing.set]} ... />
                    */}
                    <span>{printing.set}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Imagem da carta (limitada no celular para não ocupar a tela inteira) */}
          <div
            className="rounded-xl overflow-hidden shadow-lg w-full max-w-[340px] sm:max-w-none mx-auto sm:mx-0 aspect-[3/4] flex items-center justify-center"
            style={{ backgroundColor: "#1B1F22" }}
          >
            {card.imageUrl ? (
              <img src={card.imageUrl} alt={card.name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-sm" style={{ color: "#C3ACA2" }}>Sem imagem</span>
            )}
          </div>
        </div>

        {/* Coluna das informações */}
        <div>
          {/* Cabeçalho: nome + ações */}
          <div className="flex items-start justify-between gap-4 border-b pb-4 mb-6" style={{ borderColor: "#2C2422" }}>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl 3xl:text-4xl font-black text-white">{card.name}</h1>
              {card.setName && (
                <p className="text-sm 3xl:text-base mt-1" style={{ color: "#C3ACA2" }}>{card.setName}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button className="p-2 rounded-md hover:bg-white/5 transition-colors" style={{ color: "#C3ACA2" }}>
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-md hover:bg-white/5 transition-colors" style={{ color: "#C3ACA2" }}>
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Detalhes da carta (grade de pares rótulo/valor) */}
          <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "#DCBE50" }}>
            Detalhes da Carta
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 4xl:grid-cols-3 gap-x-8 gap-y-3 mb-8">
            <DetailRow label="Raridade" value={card.rarity} />
            <DetailRow label="Tipo" value={card.type} />
            <DetailRow label="Artista" value={card.artist} />
            <DetailRow label="Coleção" value={card.setName} />
            <DetailRow label="Custo de Mana" value={card.manaCost} />
            {card.power && card.toughness && (
              <DetailRow label="Poder / Resistência" value={`${card.power} / ${card.toughness}`} />
            )}
            <DetailRow
              label="Formatos Válidos"
              value={legalFormats.length > 0 ? legalFormats.join(", ") : undefined}
            />
          </div>

          {/* Texto de regras e ambientação */}
          {(card.text || card.flavor) && (
            <div className="rounded-lg p-4 mb-8" style={{ backgroundColor: "#1B1F22" }}>
              {card.text && (
                <p className="text-sm 3xl:text-base text-white whitespace-pre-line leading-relaxed">{card.text}</p>
              )}
              {card.flavor && (
                <p className="text-sm 3xl:text-base italic mt-3" style={{ color: "#C3ACA2" }}>{card.flavor}</p>
              )}
            </div>
          )}

          {/* Preço — a API não fornece; placeholder "em breve" */}
          <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: "#DCBE50" }}>
            Preço Médio de Venda
          </h2>
          <div
            className="rounded-lg p-4 flex items-center justify-between"
            style={{ backgroundColor: "#1B1F22" }}
          >
            <span className="text-sm" style={{ color: "#C3ACA2" }}>Normal</span>
            <span className="text-sm font-semibold" style={{ color: "#C3ACA2" }}>
              Preço indisponível — em breve
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Componente auxiliar: uma linha "Rótulo ....... Valor".
// Se o valor não existir, mostra "—" para não quebrar o layout.
function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "#2C2422" }}>
      <span className="text-sm 3xl:text-base" style={{ color: "#C3ACA2" }}>{label}</span>
      <span className="text-sm 3xl:text-base text-white text-right ml-4">{value || "—"}</span>
    </div>
  );
}
