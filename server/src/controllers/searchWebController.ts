// server/src/controllers/searchWebController.ts
import { Request, Response } from "express";
import axios from "axios";

export const searchWebController = async (req: Request, res: Response) => {
  const q = req.query.q as string;
  if (!q || typeof q !== "string" || q.length > 40) {
    return res.status(400).json({ message: "Invalid query" });
  }
  try {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
      // console.error("[DEBUG] Missing BRAVE_API_KEY");
      return res.status(500).json({ message: "Missing BRAVE_API_KEY" });
    }
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=20`;
    // console.log("[DEBUG] Brave API URL:", url);
    const { data } = await axios.get(url, {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": apiKey,
      },
    });
    // console.log("[DEBUG] Brave API response:", JSON.stringify(data).slice(0, 500));
    // Lấy kết quả web
    const webResults = (data.web && Array.isArray(data.web.results)) ? data.web.results : [];
    // Lọc lấy đúng trường title, url
    const results = webResults
      .filter((item: any) => item.url && item.title)
      .map((item: any) => ({ title: item.title, url: item.url }))
      .slice(0, 20);
    return res.json({ results });
  } catch (err: any) {
    const errMessage = err?.response?.data || err.message || "Unknown error";
  console.error("[searchWebController] error:", errMessage);

  // Trả về JSON rõ ràng dù có lỗi
  return res.status(500).json({
    message: "Search failed",
    error: errMessage,
  });
  }
}; 