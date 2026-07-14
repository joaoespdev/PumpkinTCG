import { Search, SlidersHorizontal, Bell, ShoppingCart, ChevronDown, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { searchCards, dedupeByName, type MtgCard } from "../api/mtg";

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MtgCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navigate = useNavigate();
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // Busca com "debounce": só chama a API 400ms depois de o usuário parar de
  // digitar, evitando uma requisição a cada tecla.
  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const cards = await searchCards(query);
        setSuggestions(dedupeByName(cards).slice(0, 8)); // no máx. 8 sugestões
        setIsDropdownOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    // Se o usuário digitar de novo antes dos 400ms, cancela a busca anterior.
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fecha o dropdown ao clicar fora da caixa de busca.
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Vai para a página de detalhe da carta e limpa a busca.
  function goToCard(cardId: string) {
    navigate(`/card/${cardId}`);
    setIsDropdownOpen(false);
    setSearchQuery("");
  }

  // Enter (submit do formulário): abre a primeira sugestão da lista.
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (suggestions.length > 0) {
      goToCard(suggestions[0].id);
    }
  }

  return (
    <header style={{ backgroundColor: "#9D4B1F" }} className="w-full shadow-lg">
      {/* Celular: 2 linhas — [logo + ações] em cima e busca embaixo (flex-wrap +
          busca com w-full força a quebra). Em md+: volta a 1 linha única. */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 flex flex-wrap md:flex-nowrap items-center gap-x-2 sm:gap-x-4 gap-y-3">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#DCBE50" }}>
            <span style={{ color: "#2C2422" }} className="text-sm font-black">TCG</span>
          </div>
          <span className="text-white font-black text-xl tracking-wide hidden sm:block">
            TCG<span style={{ color: "#DCBE50" }}>Arena</span>
          </span>
        </div>

        {/* Search Bar — no celular ocupa a linha inteira (w-full + order-last);
            em md+ volta para o meio da linha única (flex-1). */}
        <div className="order-last md:order-none w-full md:w-auto md:flex-1 flex items-center gap-2 md:max-w-2xl md:mx-auto">
          {/* "relative" para o dropdown se posicionar em relação à caixa de busca */}
          <div ref={searchBoxRef} className="relative flex-1">
            <form
              onSubmit={handleSubmit}
              className="flex items-center rounded-md overflow-hidden shadow-md"
              style={{ backgroundColor: "#DCBE50" }}
            >
              <input
                type="text"
                placeholder="Procure por Cards e Produtos"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setIsDropdownOpen(true)}
                className="flex-1 px-4 py-2 bg-transparent text-sm outline-none placeholder-[#593724] text-[#2C2422]"
              />
              <button
                type="submit"
                className="px-3 py-2 hover:bg-[#C3ACA2]/30 transition-colors"
                style={{ color: "#593724" }}
              >
                <Search className="w-4 h-4" />
              </button>
              <div className="w-px h-5" style={{ backgroundColor: "#593724" }} />
              <button
                type="button"
                className="px-3 py-2 hover:bg-[#C3ACA2]/30 transition-colors flex items-center gap-1"
                style={{ color: "#593724" }}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </form>

            {/* Dropdown de sugestões */}
            {isDropdownOpen && searchQuery.trim().length >= 2 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-md shadow-xl overflow-hidden z-50 border"
                style={{ backgroundColor: "#2C2422", borderColor: "#593724" }}
              >
                {isLoading ? (
                  <div className="px-4 py-3 text-sm" style={{ color: "#C3ACA2" }}>
                    Buscando...
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="px-4 py-3 text-sm" style={{ color: "#C3ACA2" }}>
                    Nenhuma carta encontrada.
                  </div>
                ) : (
                  <ul className="max-h-80 overflow-y-auto">
                    {suggestions.map((card) => (
                      <li key={card.id}>
                        <button
                          type="button"
                          onClick={() => goToCard(card.id)}
                          className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors"
                        >
                          {card.imageUrl && (
                            <img
                              src={card.imageUrl}
                              alt=""
                              className="w-8 h-11 object-cover rounded flex-shrink-0"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          )}
                          <span className="flex flex-col">
                            <span className="text-sm text-white">{card.name}</span>
                            {card.setName && (
                              <span className="text-xs" style={{ color: "#C3ACA2" }}>
                                {card.setName}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User Actions — no celular ficam à direita da logo (ml-auto), na 1ª linha:
            Minha Conta, notificações e carrinho. */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-auto md:ml-0">
          {/* Profile (no celular mostra só o ícone; o texto aparece em md+) */}
          <button className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-md hover:bg-[#593724]/60 transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: "#DCBE50", color: "#2C2422" }}
            >
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:flex flex-col items-start leading-tight">
              <span className="text-white text-xs font-semibold">Minha Conta</span>
              <span className="text-xs" style={{ color: "#C3ACA2" }}>
                Entrar <ChevronDown className="inline w-3 h-3" />
              </span>
            </div>
          </button>

          {/* Notification Bell */}
          <button className="relative p-2 rounded-md hover:bg-[#593724]/60 transition-colors">
            <Bell className="w-5 h-5 text-white" />
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full"
              style={{ backgroundColor: "#DCBE50" }}
            />
          </button>

          {/* Cart */}
          <button className="relative p-2 rounded-md hover:bg-[#593724]/60 transition-colors">
            <ShoppingCart className="w-5 h-5 text-white" />
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: "#DCBE50", color: "#2C2422" }}
            >
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
