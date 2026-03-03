import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API Proxy for Product Details
  app.get("/api/proxy/product-detail", async (req, res) => {
    const { designNumber } = req.query;
    if (!designNumber) {
      return res.status(400).json({ error: "designNumber is required" });
    }

    try {
      const response = await fetch(`https://wms-prod.technoboost.in/api/product-item/get-design-mrp-detail?designNumber=${designNumber}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch product details" });
    }
  });

  // API Proxy for Google Sheets CSV
  app.get("/api/proxy/barcode-csv", async (req, res) => {
    try {
      const response = await fetch('https://docs.google.com/spreadsheets/d/e/2PACX-1vTSISPe7kCDrMdtQCYjwDWn9sIqN8HzSgCBZTm36UQfQC3JZ8SMWlW9mPfTqB6P8WjXUHK8EZWlzy-X/pub?output=csv');
      const data = await response.text();
      res.send(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch barcode CSV" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
