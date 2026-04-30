import { Instagram, Twitter, Youtube, Facebook, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  "Navegação": ["Cards", "Coleções", "Produtos", "Acessórios", "Comunidade"],
  "Suporte": ["Central de Ajuda", "Política de Devolução", "Rastrear Pedido", "Contato"],
  "TCGArena": ["Sobre Nós", "Trabalhe Conosco", "Blog", "Termos de Uso", "Privacidade"],
};

const socials = [
  { icon: Instagram, label: "Instagram" },
  { icon: Twitter, label: "Twitter" },
  { icon: Youtube, label: "YouTube" },
  { icon: Facebook, label: "Facebook" },
];

export function Footer() {
  return (
    <footer style={{ backgroundColor: "#2C2422" }}>
      {/* Top section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#DCBE50" }}
              >
                <span className="text-sm font-black" style={{ color: "#2C2422" }}>TCG</span>
              </div>
              <span className="text-white font-black text-xl tracking-wide">
                TCG<span style={{ color: "#DCBE50" }}>Arena</span>
              </span>
            </div>
            <p className="text-sm mb-5 leading-relaxed max-w-xs" style={{ color: "#C3ACA2" }}>
              A maior plataforma de Trading Card Games do Brasil. Encontre, compre, venda e colecione suas cartas favoritas.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2 mb-6">
              {socials.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ backgroundColor: "#593724", color: "#DCBE50" }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Contact */}
            <div className="space-y-2">
              {[
                { icon: Mail, text: "contato@tcgarena.com.br" },
                { icon: Phone, text: "+55 (11) 9999-9999" },
                { icon: MapPin, text: "São Paulo, SP — Brasil" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#9D4B1F" }} />
                  <span className="text-xs" style={{ color: "#C3ACA2" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4
                className="text-sm font-bold mb-4 uppercase tracking-wider"
                style={{ color: "#DCBE50" }}
              >
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm transition-colors hover:text-white"
                      style={{ color: "#C3ACA2" }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(195,172,162,0.1)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs" style={{ color: "#593724" }}>
            © 2026 TCGArena — Todos os direitos reservados
          </span>
          <div className="flex items-center gap-4">
            {["Termos", "Privacidade", "Cookies"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-xs transition-colors hover:text-white"
                style={{ color: "#593724" }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
