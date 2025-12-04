import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verificarToken = (req, res, next) => {
  try {
    // Obtener token de cookies
    const token = req.cookies.token;
    
    if (!token) {
      console.error("❌ Middleware: No hay token en cookies");
      return res.status(401).json({ 
        message: "No autorizado. Por favor inicia sesión." 
      });
    }

    // Verificar y decodificar token
    const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_segura";
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 🔹 Ahora usamos cedula directamente
    if (!decoded.cedula) {
      console.error("❌ Middleware: Token no contiene cedula");
      return res.status(403).json({ 
        message: "Token inválido (sin cedula)" 
      });
    }
    
    // Pasar datos del usuario al request
    req.usuario = {
      cedula: decoded.cedula,    // ← Esto es lo importante
      nombre: decoded.nombre,
      email: decoded.email,
      rol: decoded.rol
    };
    
    console.log("✅ Middleware - Token válido para cédula:", req.usuario.cedula);
    next();
    
  } catch (error) {
    console.error("❌ Middleware - Error:", error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: "Sesión expirada" 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        message: "Token inválido" 
      });
    }
    
    return res.status(500).json({ 
      message: "Error de autenticación" 
    });
  }
};