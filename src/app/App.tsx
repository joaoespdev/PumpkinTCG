import { Routes, Route, Outlet } from "react-router";
import { Navbar } from "./components/Navbar";
import { NavMenu } from "./components/NavMenu";
import { HeroBanner } from "./components/HeroBanner";
import { Footer } from "./components/Footer";
import { EmAlta } from "./pages/EmAlta";

// Layout: tudo que é fixo (Navbar, NavMenu, Footer).
// O <Outlet /> é onde o React Router troca o conteúdo de cada rota.
function Layout() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#121517" }}>
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
      </Route>
    </Routes>
  );
}
