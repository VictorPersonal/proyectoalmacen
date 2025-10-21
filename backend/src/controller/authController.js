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


/**
 * 📩 Enviar correo de recuperación de contraseña
 */
export const enviarCorreoRecuperacion = async (req, res) => {
  const { email } = req.body;

  try {
    // Verificar si el usuario existe
    const userResult = await pool.query("SELECT * FROM usuario WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const user = userResult.rows[0];

    // ✅ Generar token temporal (expira en 1 hora) — usando el email
    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Construir URL de recuperación (usa FRONTEND_URL del .env)
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

/**
 * 🔑 Restablecer la contraseña
 */
export const restablecerContrasena = async (req, res) => {
  try {
    const { token, nuevaContrasena } = req.body;

    if (!token || !nuevaContrasena) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    // ✅ Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    if (!email) {
      return res.status(400).json({ message: "Token inválido o sin correo" });
    }

    // ✅ Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // ✅ Actualizar la contraseña en la base de datos
    const result = await pool.query(
      "UPDATE usuario SET password = $1 WHERE email = $2",
      [hashedPassword, email]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error);
    res.status(400).json({
      message: "Token inválido, expirado o error en el proceso",
    });
  }
};