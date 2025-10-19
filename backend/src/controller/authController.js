import pkg from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import brevo from "@getbrevo/brevo";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

// 🔹 Conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
});

// 🔹 Configuración de Brevo (correo)
const brevoClient = new brevo.TransactionalEmailsApi();
brevoClient.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

// ---------------------------
// 1️⃣ Enviar correo de recuperación
// ---------------------------
export const enviarCorreoRecuperacion = async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si el usuario existe
    const userResult = await pool.query("SELECT * FROM usuario WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    // Generar token temporal (expira en 1 hora)
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Construir URL de recuperación
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Crear correo con Brevo
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { name: "Soporte Técnico", email: process.env.EMAIL_FROM };
    sendSmtpEmail.to = [{ email }];
    sendSmtpEmail.subject = "Recuperación de contraseña";
    sendSmtpEmail.htmlContent = `
      <h2>Recuperación de contraseña</h2>
      <p>Hola, ${user.nombre || "usuario"}.</p>
      <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>Este enlace expirará en 1 hora.</p>
    `;

    // Enviar correo
    await brevoClient.sendTransacEmail(sendSmtpEmail);

    res.json({ message: "Correo de recuperación enviado correctamente" });
  } catch (error) {
    console.error("Error al enviar correo:", error);

    if (error.response && error.response.status === 401) {
      return res.status(401).json({
        message:
          "Error de autenticación con Brevo. Verifica tu clave BREVO_API_KEY en el archivo .env",
      });
    }

    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ---------------------------
// 2️⃣ Restablecer contraseña
// ---------------------------
export const restablecerContrasena = async (req, res) => {
  const { token, nuevaContrasena } = req.body;

  try {
    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar contraseña en la base de datos
    await pool.query("UPDATE usuario SET password = $1 WHERE id = $2", [hashedPassword, userId]);

    res.json({ message: "Contraseña restablecida correctamente" });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(400).json({ message: "Token inválido o expirado" });
  }
};
