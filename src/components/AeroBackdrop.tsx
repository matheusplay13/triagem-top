import { useRouterState } from "@tanstack/react-router";
import bgIndex from "@/assets/aero/bg-index.jpg";
import bgQueue from "@/assets/aero/bg-queue.jpg";
import bgDashboard from "@/assets/aero/bg-dashboard.jpg";
import bgClinica from "@/assets/aero/bg-clinica.jpg";
import bgPlanos from "@/assets/aero/bg-planos.jpg";

const ROUTE_BACKGROUNDS: Record<string, string> = {
  "/": bgIndex,
  "/queue": bgQueue,
  "/dashboard": bgDashboard,
  "/clinica": bgClinica,
  "/planos": bgPlanos,
};

export function AeroBackdrop() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
  const backgroundImage = ROUTE_BACKGROUNDS[normalizedPath];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {backgroundImage ? (
        <>
          {/* Imagem Frutiger Aero dedicada à página atual */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          {/* Véu luminoso suave para preservar a vivacidade da imagem e o contraste do vidro Aero */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(210,245,255,0.14) 55%, rgba(215,255,235,0.18) 100%)",
            }}
          />
        </>
      ) : (
        <>
          {/* Fundo atmosférico padrão para páginas ainda sem imagem dedicada */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, #6ed0ff 0%, #a5e6ff 28%, #dff8ff 56%, #d4fce8 78%, #9cf2a8 100%)",
            }}
          />
          <div
            className="absolute -right-24 -top-28 h-[34rem] w-[34rem] rounded-full opacity-80 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(164,244,255,0.6) 42%, rgba(0,174,255,0) 75%)",
            }}
          />
          <div
            className="absolute -bottom-32 -left-24 h-[32rem] w-[36rem] rounded-full opacity-75 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(114,246,120,0.68) 0%, rgba(42,214,162,0.34) 48%, rgba(42,214,162,0) 75%)",
            }}
          />
          <svg
            className="aero-aurora absolute inset-0 h-full w-full"
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="aeroRibbon1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.62" />
                <stop offset="48%" stopColor="#5ce6ff" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#46eb86" stopOpacity="0.4" />
              </linearGradient>
              <linearGradient id="aeroRibbon2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.52" />
                <stop offset="55%" stopColor="#2cc8ff" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#8ef768" stopOpacity="0.36" />
              </linearGradient>
              <linearGradient id="aeroWaveBottom" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3ad870" stopOpacity="0.32" />
                <stop offset="50%" stopColor="#1bc9e8" stopOpacity="0.24" />
                <stop offset="100%" stopColor="#72f05e" stopOpacity="0.34" />
              </linearGradient>
            </defs>
            <path
              d="M-80,220 C260,60 540,390 920,210 C1180,90 1340,180 1520,120 L1520,310 C1280,380 1050,240 760,380 C440,530 180,260 -80,390 Z"
              fill="url(#aeroRibbon1)"
            />
            <path
              d="M-100,520 C240,360 620,660 1040,460 C1260,360 1380,440 1540,390 L1540,560 C1280,620 980,520 680,640 C340,770 120,560 -100,660 Z"
              fill="url(#aeroRibbon2)"
            />
            <path
              d="M0,760 C320,680 620,840 980,750 C1200,695 1340,730 1440,710 L1440,900 L0,900 Z"
              fill="url(#aeroWaveBottom)"
            />
          </svg>
        </>
      )}

      {/* Bolhas translúcidas glossy flutuando suavemente */}
      <div
        className="aero-bubble absolute left-[6%] top-[14%] h-20 w-20 opacity-55"
        style={{ animationDuration: "10s" }}
      />
      <div
        className="aero-bubble absolute right-[8%] top-[18%] h-24 w-24 opacity-50"
        style={{ animationDuration: "12s", animationDelay: "-4s" }}
      />
      <div
        className="aero-bubble absolute bottom-[12%] left-[9%] h-24 w-24 opacity-50"
        style={{ animationDuration: "11s", animationDelay: "-5s" }}
      />
      <div
        className="aero-bubble absolute bottom-[18%] right-[11%] h-16 w-16 opacity-55"
        style={{ animationDuration: "9.5s", animationDelay: "-3s" }}
      />
    </div>
  );
}
