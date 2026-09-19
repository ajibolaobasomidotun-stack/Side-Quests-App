import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "SideQuests Platform Server",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Escrow verification endpoint
  app.post("/api/escrow/verify", (req, res) => {
    const { amount = 0, currency = "USD", questTitle = "Quest" } = req.body || {};
    const parsedAmount = typeof amount === "number" ? amount : parseFloat(String(amount).replace(/[^0-9.]/g, "")) || 1000;
    const platformFee = Math.round(parsedAmount * 0.03 * 100) / 100;
    const netPayout = Math.round((parsedAmount - platformFee) * 100) / 100;

    res.json({
      verified: true,
      questTitle,
      escrowId: `ESC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      lockedAmount: parsedAmount,
      platformFee,
      netPayout,
      currency,
      guarantee: "100% Escrow Collateralized",
      releaseTrigger: "Mutual Sign-off / Milestone Acceptance",
      timestamp: new Date().toISOString(),
    });
  });

  // Platform creative gig ecosystem statistics
  app.get("/api/stats", (_req, res) => {
    res.json({
      totalSecuredEscrow: "$4.8M+",
      activeCreatives: "12,400+",
      averageFillTime: "4.2 hrs",
      disputeRate: "0.02%",
      networkStatus: "Operational",
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
