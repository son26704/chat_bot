// server/src/controllers/chatController.ts
import { Request, Response } from "express";
import {
  processChat,
  getConversationHistory,
  getUserConversations,
  deleteConversation,
  renameConversation,
  deleteMessageAndBelow,
  editMessageAndContinue,
  generateFollowUpQuestions,
  suggestProfileFromConversation,
  suggestProfileFromMessage,
} from "../services/chatService";
import {
  AuthenticatedRequest,
  ChatResponse,
  FollowUpQuestionsResponse,
} from "../types/auth";
import multer from "multer";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import fs from "fs";
import path from "path";
import rp from "request-promise";
import * as cheerio from "cheerio";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 1024 * 1024 },
});

export const chatController = [
  upload.array("files"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { prompt, conversationId, systemPrompt } = req.body;
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      if (!prompt) return res.status(400).json({ message: "Prompt required" });

      const attachments: { name: string; content: string }[] = [];

      // 1. Parse file đính kèm
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const ext = path.extname(file.originalname).toLowerCase();
          const filePath = file.path;
          let content = "";

          try {
            if (ext === ".pdf") {
              const buffer = fs.readFileSync(filePath);
              const parsed = await pdfParse(buffer);
              content = parsed.text;
            } else if (ext === ".docx" || ext === ".doc") {
              const buffer = fs.readFileSync(filePath);
              const result = await mammoth.extractRawText({ buffer });
              content = result.value;
            } else if (ext === ".txt") {
              content = fs.readFileSync(filePath, "utf8");
            }
          } catch (err) {
            console.warn("❗ Failed to parse file", file.originalname, err);
          } finally {
            fs.unlinkSync(filePath);
          }

          if (content.length > 2000) content = content.slice(0, 2000);
          attachments.push({
            name: file.originalname,
            content: content || "[Không thể đọc nội dung]",
          });
        }
      }

      // 2. Parse link đính kèm
      let linkItems: { url: string; name: string }[] = [];
      if (req.body.links) {
        try {
          linkItems = JSON.parse(req.body.links);
        } catch (err) {
          console.warn("❌ Không parse được req.body.links", err);
        }
      }

      for (const link of linkItems) {
        try {
          // console.log(`[DEBUG] Crawling link: ${link.url}`);
          const html = await rp(link.url, { timeout: 5000 });
          const $ = cheerio.load(html);

          const title = $("title").text().trim() || link.url;

          // Ưu tiên phần tử chính nếu có
          const mainSelectors = [
            "article",
            "[role=main]",
            "main",
            ".post-content",
            ".blog-post",
            "#main",
            "body",
          ];

          let contentElem = null;
          for (const selector of mainSelectors) {
            const found = $(selector);
            if (found.length && found.text().length > 100) {
              contentElem = found;
              break;
            }
          }

          if (!contentElem) contentElem = $("body");

          const blocks = contentElem.find("p, h1, h2, h3, li").toArray();
          const cleanedBlocks = blocks
            .map((el) => $(el).text().trim())
            .filter((t) => t.length > 30);

          let text = "";
          let total = 0;
          for (const para of cleanedBlocks) {
            if (total + para.length > 1800) break;
            text += para + "\n\n";
            total += para.length;
          }

          attachments.push({
            name: title,
            content: text || "[Không lấy được nội dung từ link]",
          });

          // console.log(`[DEBUG] ✅ Crawled ${link.url} - ${text.length} chars`);
        } catch (err) {
          console.warn("❗ Lỗi khi tải link:", link.url, err);
          attachments.push({
            name: link.name || link.url,
            content: "[Không thể lấy nội dung từ link]",
          });
        }
      }

      // 3. Gửi prompt xử lý
      const result: ChatResponse = await processChat(userId, {
        prompt,
        conversationId,
        systemPrompt,
        attachments,
      });

      res.status(200).json(result);
    } catch (err: any) {
      console.error("❌ chatController error:", err);
      res.status(500).json({ message: err.message || "Internal Server Error" });
    }
  },
];

export const getHistoryController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const history = await getConversationHistory(userId, conversationId);
    res.status(200).json(history);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const getConversationsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const conversations = await getUserConversations(userId);
    res.status(200).json(conversations);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteConversationController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    await deleteConversation(userId, conversationId);
    res.status(204).send();
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const renameConversationController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    if (!title || typeof title !== "string") {
      return res
        .status(400)
        .json({ message: "Title is required and must be a string" });
    }
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: "User not authenticated" });
    const conversation = await renameConversation(
      userId,
      conversationId,
      title
    );
    res.status(200).json(conversation);
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const deleteMessageController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    await deleteMessageAndBelow(userId, messageId);
    res.status(204).send();
  } catch (error: any) {
    res.status(404).json({ message: error.message });
  }
};

export const editMessageController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { messageId } = req.params;
    const { newContent } = req.body;
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ message: "User not authenticated" });
    if (!newContent || typeof newContent !== "string")
      return res.status(400).json({ message: "newContent is required" });
    const result = await editMessageAndContinue(userId, messageId, newContent);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getFollowUpQuestionsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const suggestions = await generateFollowUpQuestions(userId, conversationId);
    const response: FollowUpQuestionsResponse = { suggestions };
    res.status(200).json(response);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getSuggestedProfileFromMessage = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await suggestProfileFromMessage(userId, messageId);
    res.status(200).json({ result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getSuggestedProfileFromConversation = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const result = await suggestProfileFromConversation(userId, conversationId);
    res.status(200).json({ result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
