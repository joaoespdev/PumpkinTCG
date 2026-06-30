import { TrendingUp } from "lucide-react";

// Página "Em Alta". Renderizada na rota "/em-alta".
// Aqui ficarão os cards em alta (mais pesquisados) — a lógica vem depois.
export function EmAlta() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "#DCBE50" }}
        >
          <TrendingUp className="w-5 h-5" style={{ color: "#2C2422" }} />
        </div>
        <h1 className="text-3xl font-black text-white">Em Alta</h1>
      </div>

      <p className="text-[#C3ACA2] max-w-2xl mb-10">
        Os cards mais pesquisados do momento. Em breve esta página listará
        automaticamente os destaques com base nas buscas dos usuários.
      </p>

      {/* Placeholder dos cards (grid responsivo). Será preenchido depois. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] rounded-xl border border-white/5 flex items-center justify-center"
            style={{ backgroundColor: "#1B1F22" }}
          >
            <TrendingUp className="w-8 h-8 text-[#3a4147]" />
          </div>
        ))}
      </div>
    </section>
  );
}
