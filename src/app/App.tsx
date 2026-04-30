import { Navbar } from "./components/Navbar";
import { NavMenu } from "./components/NavMenu";
import { HeroBanner } from "./components/HeroBanner";
import { Footer } from "./components/Footer";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#121517" }}>
      <Navbar />
      <NavMenu />
      <main className="flex-1">
        <HeroBanner />
      </main>
      <Footer />
    </div>
  );
}
