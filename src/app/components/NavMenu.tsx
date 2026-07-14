import { TrendingUp, BookOpen, Package, Gem, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

// Itens da barra de navegação.
// - "submenuItems": se existir, o item abre um dropdown no hover e NÃO é clicável (ex.: Produtos).
// - "path": se existir, o item vira um link que redireciona para essa rota (ex.: Em Alta).
const navMenuItems = [
  { icon: TrendingUp, label: "Em Alta", path: "/em-alta" },
  { icon: BookOpen, label: "Coleções" },
  { icon: Package, label: "Produtos", submenuItems: ["Booster", "Decks", "Colecionáveis"] },
  { icon: Gem, label: "Acessórios" },
  { icon: Users, label: "Comunidade" },
];

// Estilo base compartilhado pelos três tipos de item (div, link e botão).
// Centralizar aqui evita repetir a mesma string e mantém a aparência consistente.
// Celular: ícone em cima e texto embaixo (flex-col), compacto para caber os 5 itens.
// md+: volta ao formato original, ícone ao lado do texto (flex-row).
const itemBaseClasses =
  "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-1.5 sm:px-3 md:px-5 py-2.5 md:py-3 text-xs md:text-sm transition-all whitespace-nowrap relative";

export function NavMenu() {
  // Guarda o rótulo do item atualmente ativo. Começa vazio: nada fica
  // destacado em amarelo no carregamento da página.
  const [activeLabel, setActiveLabel] = useState("");

  return (
    <nav className="w-full shadow-md" style={{ backgroundColor: "#2C2422" }}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        {/* Celular: itens distribuídos na largura toda (justify-between).
            md+: alinhados à esquerda como antes. */}
        <ul className="flex items-center justify-between md:justify-start gap-0 md:gap-1">
          {navMenuItems.map(({ icon: Icon, label, submenuItems, path }) => {
            const isActive = activeLabel === label;

            // Conteúdo visual do item: ícone + texto + linha amarela inferior.
            const menuItemContent = (
              <>
                <Icon className="w-5 h-5 md:w-4 md:h-4" />
                <span>{label}</span>
                {/* Linha amarela: visível se ativo, ou ao passar o mouse (group-hover). */}
                <span
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  style={{ backgroundColor: "#DCBE50" }}
                />
              </>
            );

            // Cor do texto: amarelo se ativo, senão cinza que vira amarelo no hover do grupo.
            const textColorClasses = isActive
              ? "text-[#DCBE50]"
              : "text-[#C3ACA2] group-hover:text-[#DCBE50]";

            return (
              <li key={label} className="relative group">
                {submenuItems ? (
                  // Produtos: não é clicável (div, sem onClick, cursor padrão).
                  <div className={`${itemBaseClasses} cursor-default select-none ${textColorClasses}`}>
                    {menuItemContent}
                  </div>
                ) : path ? (
                  // Em Alta: link que redireciona para a rota.
                  <Link
                    to={path}
                    onClick={() => setActiveLabel(label)}
                    className={`${itemBaseClasses} cursor-pointer ${textColorClasses}`}
                  >
                    {menuItemContent}
                  </Link>
                ) : (
                  // Demais itens: continuam como botões clicáveis.
                  <button
                    onClick={() => setActiveLabel(label)}
                    className={`${itemBaseClasses} cursor-pointer ${textColorClasses}`}
                  >
                    {menuItemContent}
                  </button>
                )}

                {/* Dropdown (só para itens que têm submenuItems). */}
                {submenuItems && (
                  <div
                    className="absolute top-full left-0 w-full z-50 shadow-lg overflow-hidden
                               invisible opacity-0 group-hover:visible group-hover:opacity-100
                               transition-opacity duration-150"
                    style={{ backgroundColor: "#2C2422" }}
                  >
                    <ul className="py-1">
                      {submenuItems.map((submenuLabel) => (
                        <li key={submenuLabel}>
                          <button
                            className="w-full text-left px-5 py-2.5 text-sm whitespace-nowrap
                                       text-[#C3ACA2] hover:text-[#DCBE50] hover:bg-white/5 transition-colors"
                          >
                            {submenuLabel}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
