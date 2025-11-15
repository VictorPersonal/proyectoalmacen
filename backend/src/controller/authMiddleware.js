import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verificarToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "No autorizado. Token no encontrado." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "clave_secreta_segura");
    req.usuario = decoded;
    next();
  } catch (error) {
    console.error("❌ Error al verificar token:", error.message);
    return res.status(403).json({ message: "Token inválido o expirado." });
  }
};
