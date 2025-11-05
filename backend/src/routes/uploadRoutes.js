import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

const router = express.Router();

// Configurar Multer (guarda temporalmente en /uploads)
const upload = multer({ dest: "uploads/" });

// Ruta para subir imagen a Cloudinary
router.post("/upload", upload.single("imagen"), async (req, res) => {
  try {
    const filePath = req.file.path;

    // Subir imagen a Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "productos_dulcehogar",
    });

    // Eliminar archivo temporal
    fs.unlinkSync(filePath);

    res.json({ secure_url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al subir imagen", error });
  }
});

export default router;
