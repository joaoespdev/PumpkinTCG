import { Routes, Route, Outlet } from "react-router";
import { Navbar } from "./components/Navbar";
import { NavMenu } from "./components/NavMenu";
import { HeroBanner } from "./components/HeroBanner";
import { Footer } from "./components/Footer";
import { EmAlta } from "./pages/EmAlta";
import { CardPage } from "./pages/CardPage";

// Layout: tudo que é fixo (Navbar, NavMenu, Footer).
// O <Outlet /> é onde o React Router troca o conteúdo de cada rota.
function Layout() {
  return (
    // overflow-x-clip: se algum elemento estourar a largura da tela, ele é cortado
    // em vez de criar scroll horizontal e a "faixa branca" ao lado da página.
    <div className="min-h-screen flex flex-col overflow-x-clip" style={{ backgroundColor: "#121517" }}>
      <Navbar />
      <NavMenu />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* "/" = página inicial (banner) | "/em-alta" = página Em Alta */}
        <Route path="/" element={<HeroBanner />} />
        <Route path="/em-alta" element={<EmAlta />} />
        {/* :id é dinâmico — vale qualquer id de carta vindo da busca */}
        <Route path="/card/:id" element={<CardPage />} />
      </Route>
    </Routes>
  );
}
