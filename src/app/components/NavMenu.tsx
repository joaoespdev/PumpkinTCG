import { Layers, BookOpen, Package, Gem, Users } from "lucide-react";
import { useState } from "react";

const menuItems = [
  { icon: Layers, label: "Cards" },
  { icon: BookOpen, label: "Coleções" },
  { icon: Package, label: "Produtos" },
  { icon: Gem, label: "Acessórios" },
  { icon: Users, label: "Comunidade" },
];

export function NavMenu() {
  const [active, setActive] = useState("Cards");

  return (
    <nav className="w-full shadow-md" style={{ backgroundColor: "#2C2422" }}>
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {menuItems.map(({ icon: Icon, label }) => (
            <li key={label}>
              <button
                onClick={() => setActive(label)}
                className={`flex items-center gap-2 px-5 py-3 text-sm transition-all whitespace-nowrap relative ${
                  active === label
                    ? "text-[#DCBE50]"
                    : "text-[#C3ACA2] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {active === label && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ backgroundColor: "#DCBE50" }}
                  />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
