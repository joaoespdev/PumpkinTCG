import { Search, SlidersHorizontal, Bell, ShoppingCart, ChevronDown, User } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header style={{ backgroundColor: "#9D4B1F" }} className="w-full shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#DCBE50" }}>
            <span style={{ color: "#2C2422" }} className="text-sm font-black">TCG</span>
          </div>
          <span className="text-white font-black text-xl tracking-wide hidden sm:block">
            TCG<span style={{ color: "#DCBE50" }}>Arena</span>
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 flex items-center gap-2 max-w-2xl mx-auto">
          <div className="flex-1 flex items-center rounded-md overflow-hidden shadow-md" style={{ backgroundColor: "#DCBE50" }}>
            <input
              type="text"
              placeholder="Procure por Cards e Produtos"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-transparent text-sm outline-none placeholder-[#593724] text-[#2C2422]"
            />
            <button
              className="px-3 py-2 hover:bg-[#C3ACA2]/30 transition-colors"
              style={{ color: "#593724" }}
            >
              <Search className="w-4 h-4" />
            </button>
            <div className="w-px h-5" style={{ backgroundColor: "#593724" }} />
            <button
              className="px-3 py-2 hover:bg-[#C3ACA2]/30 transition-colors flex items-center gap-1"
              style={{ color: "#593724" }}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Profile */}
          <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#593724]/60 transition-colors">
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
