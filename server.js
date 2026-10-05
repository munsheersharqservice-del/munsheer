import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "healthy", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
const distPath = path.resolve(__dirname, "dist");
app.use(express.static(distPath, {
  maxAge: "1d",
  etag: true
}));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
