// server/src/routes/searchWeb.ts
import { Router } from "express";
import { searchWebController } from "../controllers/searchWebController";

const router = Router();

router.get("/", (req, res, next) => {
  console.log("[DEBUG] /api/search-web called, query:", req.query);
  next();
}, searchWebController);

export default router; 