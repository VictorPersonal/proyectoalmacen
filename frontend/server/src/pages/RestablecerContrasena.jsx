import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./RestablecerContrasena.css";

import logo from "../assets/Logo dulce hogar.png";

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
    <div className="restablecer-page-wrapper">
      {/* ===== HEADER ===== */}
      <header className="restablecer-top-bar">
        <div className="restablecer-logo-section">
          <img src={logo} alt="Logo" className="restablecer-logo-img" />
          <div className="restablecer-logo-text">
            <span className="restablecer-logo-title">Dulce Hogar</span>
            <span className="restablecer-logo-subtitle">Almacen de electrodomesticos</span>
          </div>
        </div>
        <div className="restablecer-help-icon">?</div>
      </header>

      {/* ===== BODY ===== */}
      <main className="restablecer-container">
        <div className="restablecer-form-box">
          <h2 className="restablecer-form-title">Restablecer Contraseña</h2>

          {mensaje && (
            <p
              className={`restablecer-mensaje ${
                mensaje.includes("correctamente")
                  ? "restablecer-mensaje-exito"
                  : "restablecer-mensaje-error"
              }`}
            >
              {mensaje}
            </p>
          )}

          <form className="restablecer-form" onSubmit={handleSubmit}>
            <div className="restablecer-form-group">
              <label className="restablecer-form-label">Nueva Contraseña</label>
              <input
                type="password"
                placeholder="Ingresa tu nueva contraseña"
                value={nuevaContrasena}
                onChange={(e) => setNuevaContrasena(e.target.value)}
                className="restablecer-form-input"
              />
            </div>

            <button type="submit" className="restablecer-btn-actualizar">
              Actualizar Contraseña
            </button>
          </form>

          <div className="restablecer-form-links">
            <a href="/login">Volver al inicio de sesión</a>
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="restablecer-footer">
        <div className="restablecer-footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Terminos</a>
        </div>
        <div className="restablecer-footer-copyright">
          © 2025 help. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default RestablecerContrasena;