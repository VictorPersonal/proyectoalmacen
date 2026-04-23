// src/routes/removeBgRoutes.js
import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

router.post("/remove-background", upload.single("image"), async (req, res) => {
  try {
    if (!process.env.REMOVE_BG_API_KEY) {
      return res.status(500).json({
        message: "Falta configurar REMOVE_BG_API_KEY en el .env",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "No se recibió ninguna imagen",
      });
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        message: "Formato no permitido. Usa PNG, JPG o WEBP",
      });
    }

    const form = new FormData();
    form.append("image_file", req.file.buffer, {
      filename: req.file.originalname || "producto.png",
      contentType: req.file.mimetype,
    });
    form.append("size", "auto");

    const response = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "X-Api-Key": process.env.REMOVE_BG_API_KEY,
        },
        responseType: "arraybuffer",
        timeout: 60000,
      }
    );

    res.setHeader("Content-Type", "image/png");
    return res.send(response.data);
  } catch (error) {
    const detalle =
      error.response?.data instanceof Buffer
        ? error.response.data.toString("utf-8")
        : error.response?.data || error.message;

    console.error("Error remove background:", detalle);

    return res.status(500).json({
      message: "No se pudo quitar el fondo de la imagen",
      detalle,
    });
  }
});

export default router;