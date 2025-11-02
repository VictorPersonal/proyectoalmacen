import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./RestablecerContrasena.css"; // 👈 importante importar los estilos

import logo from "../assets/Logo dulce hogar.png"; // si tienes logo

const RestablecerContrasena = () => {
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();
  const { token } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nuevaContrasena) {
      setMensaje("Por favor, ingresa una nueva contraseña");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/auth/restablecer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, nuevaContrasena }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("Contraseña actualizada correctamente. Serás redirigido al login...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setMensaje(data.message || "Error al restablecer contraseña");
      }
    } catch (error) {
      console.error(error);
      setMensaje("Error de conexión con el servidor");
    }
  };

  return (
    <div className="recuperar-wrapper">
      {/* ===== HEADER ===== */}
      <header className="top-bar">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="logo-icon" />
          <div className="logo-text">
            <span className="logo-title">Dulce Hogar</span>
            <span className="logo-subtitle">Tu espacio de confianza</span>
          </div>
        </div>
        <div className="help-icon">?</div>
      </header>

      {/* ===== BODY ===== */}
      <main className="container">
        <div className="recuperar-box">
          <h2 className="recuperar-title">Restablecer Contraseña</h2>

          {mensaje && (
            <p
              className={`recuperar-mensaje ${
                mensaje.includes("correctamente")
                  ? "recuperar-exito"
                  : "recuperar-error"
              }`}
            >
              {mensaje}
            </p>
          )}

          <form className="recuperar-form" onSubmit={handleSubmit}>
            <div className="recuperar-group">
              <label>Nueva Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu nueva contraseña"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
              />
            </div>

            <button type="submit" className="recuperar-btn">
              Actualizar Contraseña
            </button>
          </form>

          <div className="recuperar-links">
            <a href="/login">Volver al inicio de sesión</a>
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#">Términos</a>
          <span>|</span>
          <a href="#">Privacidad</a>
          <span>|</span>
          <a href="#">Ayuda</a>
        </div>
        <div className="footer-copyright">
          © 2025 Dulce Hogar. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default RestablecerContrasena;
