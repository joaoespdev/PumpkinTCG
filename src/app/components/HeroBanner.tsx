import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1708856034151-5de6269965bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaW5nJTIwY2FyZCUyMGdhbWUlMjBmYW50YXN5JTIwZXBpY3xlbnwxfHx8fDE3Nzc0NjAzOTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "NOVIDADE",
    title: "Expanda Sua Coleção",
    subtitle: "Encontre as cartas mais raras e exclusivas do mercado TCG",
    ctaPrimary: "Ver Cartas",
    ctaSecondary: "Saiba Mais",
    accent: "#DCBE50",
  },
  {
    image: "https://images.unsplash.com/photo-1665157753181-6e7a495ed95a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJkJTIwZ2FtZSUyMGNvbGxlY3Rpb24lMjBkYXJrJTIwbWFnaWNhbHxlbnwxfHx8fDE3Nzc0NjAzOTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "EVENTO",
    title: "Torneios & Campeonatos",
    subtitle: "Participe dos maiores torneios TCG da sua região e conquiste prêmios incríveis",
    ctaPrimary: "Ver Torneios",
    ctaSecondary: "Inscrever-se",
    accent: "#9D4B1F",
  },
  {
    image: "https://images.unsplash.com/photo-1769893494602-54d305d7f3bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib2FyZCUyMGdhbWUlMjBjYXJkcyUyMHRvdXJuYW1lbnQlMjBjb21wZXRpdGlvbnxlbnwxfHx8fDE3Nzc0NjAzOTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "DESTAQUE",
    title: "Itens Raros & Exclusivos",
    subtitle: "Pacotes especiais, cartas holográficas e edições limitadas esperando por você",
    ctaPrimary: "Comprar Agora",
    ctaSecondary: "Ver Coleção",
    accent: "#593724",
  },
  {
    image: "https://images.unsplash.com/photo-1600196025037-fa07d787bd54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWN0aWJsZSUyMGNhcmRzJTIwcmFyZSUyMHZpbnRhZ2UlMjBwYWNrfGVufDF8fHx8MTc3NzQ2MDQwMXww&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "COMUNIDADE",
    title: "Junte-se à Comunidade",
    subtitle: "Conecte-se com milhares de colecionadores e jogadores apaixonados por TCG",
    ctaPrimary: "Entrar na Comunidade",
    ctaSecondary: "Conhecer",
    accent: "#DCBE50",
  },
];

export function HeroBanner() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const handleSlideChange = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", handleSlideChange);
    handleSlideChange();
  }, [emblaApi, handleSlideChange]);

  // Troca de slide automática (a cada 5s)
  useEffect(() => {
    if (!emblaApi) return;
    const autoPlayTimer = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(autoPlayTimer);
  }, [emblaApi]);

  return (
    <section className="relative w-full" style={{ backgroundColor: "#121517" }}>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={index} className="relative flex-none w-full" style={{ minWidth: "100%" }}>
              {/* Background Image */}
              <div
                className="relative w-full"
                style={{ height: "clamp(320px, 55vw, 520px)" }}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                />
                {/* Dark Overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(18,21,23,0.92) 0%, rgba(18,21,23,0.75) 40%, rgba(18,21,23,0.35) 70%, rgba(18,21,23,0.15) 100%)",
                  }}
                />
                {/* Bottom fade */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-24"
                  style={{
                    background: "linear-gradient(to top, #121517 0%, transparent 100%)",
                  }}
                />

                {/* Content */}
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl w-full mx-auto px-8 md:px-16">
                    <div className="max-w-xl">
                      {/* Badge */}
                      <span
                        className="inline-block text-xs font-black tracking-widest px-3 py-1 rounded-full mb-4"
                        style={{ backgroundColor: "#DCBE50", color: "#2C2422" }}
                      >
                        {slide.badge}
                      </span>

                      {/* Title */}
                      <h1
                        className="text-white mb-3"
                        style={{ fontSize: "clamp(1.6rem, 4vw, 2.8rem)", fontWeight: 900, lineHeight: 1.15 }}
                      >
                        {slide.title}
                      </h1>

                      {/* Subtitle */}
                      <p
                        className="mb-6 max-w-md"
                        style={{ color: "#C3ACA2", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}
                      >
                        {slide.subtitle}
                      </p>

                      {/* CTA Buttons */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          className="px-6 py-2.5 rounded-md font-bold text-sm transition-all hover:brightness-90 shadow-lg"
                          style={{ backgroundColor: "#DCBE50", color: "#2C2422" }}
                        >
                          {slide.ctaPrimary}
                        </button>
                        <button
                          className="px-6 py-2.5 rounded-md font-bold text-sm transition-all border hover:bg-white/10"
                          style={{ borderColor: "#C3ACA2", color: "#C3ACA2" }}
                        >
                          {slide.ctaSecondary}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Arrow Left */}
      <button
        onClick={scrollPrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-xl z-10"
        style={{ backgroundColor: "rgba(44,36,34,0.75)", color: "#DCBE50", border: "1px solid rgba(220,190,80,0.3)" }}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Arrow Right */}
      <button
        onClick={scrollNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-xl z-10"
        style={{ backgroundColor: "rgba(44,36,34,0.75)", color: "#DCBE50", border: "1px solid rgba(220,190,80,0.3)" }}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((_, dotIndex) => (
          <button
            key={dotIndex}
            onClick={() => scrollTo(dotIndex)}
            className="rounded-full transition-all"
            style={{
              width: selectedIndex === dotIndex ? "24px" : "8px",
              height: "8px",
              backgroundColor: selectedIndex === dotIndex ? "#DCBE50" : "rgba(220,190,80,0.35)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
