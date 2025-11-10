import jwt from "jsonwebtoken";

export const verificarToken = (req, res, next) => {
  const token = req.cookies.token; // 👈 se toma de las cookies, no del localStorage

  if (!token) {
    return res.status(401).json({ message: "No autorizado. Token no encontrado." });
  }

  try {
    const decoded = jwt.verify(token, "clave_secreta_segura"); // usa la misma clave que en el login
    req.usuario = decoded; // guardar datos del usuario en el request
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token inválido o expirado." });
  }
};
