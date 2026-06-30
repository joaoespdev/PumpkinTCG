import { TrendingUp, BookOpen, Package, Gem, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

// "Produtos" carrega uma lista "submenu" e NÃO é clicável (só hover).
// "Em Alta" tem "path": vira um link que redireciona para a página /em-alta.
const menuItems = [
  { icon: TrendingUp, label: "Em Alta", path: "/em-alta" },
  { icon: BookOpen, label: "Coleções" },
  { icon: Package, label: "Produtos", submenu: ["Booster", "Decks", "Colecionáveis"] },
  { icon: Gem, label: "Acessórios" },
  { icon: Users, label: "Comunidade" },
];

export function NavMenu() {
  // Começa vazio: nada fica amarelo no carregamento da página.
  const [active, setActive] = useState("");

  return (
    <nav className="w-full shadow-md" style={{ backgroundColor: "#2C2422" }}>
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex items-center gap-1">
          {menuItems.map(({ icon: Icon, label, submenu, path }) => {
            const isActive = active === label;

            // Conteúdo interno do item (ícone + texto + linha amarela).
            // A cor fica amarela se estiver ativo OU no hover do grupo.
            const inner = (
              <>
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {/* Linha amarela: visível se ativo, ou ao passar o mouse (group-hover) */}
                <span
                  className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                  style={{ backgroundColor: "#DCBE50" }}
                />
              </>
            );

            // Classes de cor: amarelo se ativo, senão cinza que vira amarelo no hover do grupo.
            const colorClasses = isActive
              ? "text-[#DCBE50]"
              : "text-[#C3ACA2] group-hover:text-[#DCBE50]";

            return (
              <li key={label} className="relative group">
                {submenu ? (
                  // Produtos: não é clicável (div, sem onClick, cursor padrão)
                  <div
                    className={`flex items-center gap-2 px-5 py-3 text-sm transition-all whitespace-nowrap relative cursor-default select-none ${colorClasses}`}
                  >
                    {inner}
                  </div>
                ) : path ? (
                  // Cards: link que redireciona para a página /cards
                  <Link
                    to={path}
                    onClick={() => setActive(label)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm transition-all whitespace-nowrap relative cursor-pointer ${colorClasses}`}
                  >
                    {inner}
                  </Link>
                ) : (
                  // Demais itens: continuam clicáveis
                  <button
                    onClick={() => setActive(label)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm transition-all whitespace-nowrap relative cursor-pointer ${colorClasses}`}
                  >
                    {inner}
                  </button>
                )}

                {/* Dropdown do Produtos */}
                {submenu && (
                  <div
                    className="absolute top-full left-0 w-full z-50 shadow-lg overflow-hidden
                               invisible opacity-0 group-hover:visible group-hover:opacity-100
                               transition-opacity duration-150"
                    style={{ backgroundColor: "#2C2422" }}
                  >
                    <ul className="py-1">
                      {submenu.map((sub) => (
                        <li key={sub}>
                          <button
                            className="w-full text-left px-5 py-2.5 text-sm whitespace-nowrap
                                       text-[#C3ACA2] hover:text-[#DCBE50] hover:bg-white/5 transition-colors"
                          >
                            {sub}
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
