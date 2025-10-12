import "./RecuperarContrasena.css";
import logo from "../assets/Logo dulce hogar.png"; 
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

const RecuperarContrasena = () => {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMensaje("Por favor, ingresa tu correo electrónico");
      setTipoMensaje("error");
      return;
    }

    try {
      const response = await fetch("http://localhost:4000/api/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensaje(data.message || "No se pudo enviar el correo de recuperación");
        setTipoMensaje("error");
        return;
      }

      setMensaje("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
      setTipoMensaje("exito");

      setTimeout(() => navigate("/login"), 3000);
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
      setMensaje("Error al conectar con el servidor");
      setTipoMensaje("error");
    }
  };

  return (
    <div className="recuperar-wrapper">
      <header className="top-bar">
        <div className="logo-section">
          <img src={logo} alt="Logo Dulce Hogar" className="logo-icon" />
          <div className="logo-text">
            <h1 className="logo-title">Dulce Hogar</h1>
            <span className="logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="help-icon">?</div>
      </header>

      <div className="container">
        <div className="recuperar-box">
          <h2 className="recuperar-title">Recuperar contraseña</h2>

          {mensaje && (
            <div
              className={`recuperar-mensaje ${
                tipoMensaje === "exito" ? "recuperar-exito" : "recuperar-error"
              }`}
            >
              {mensaje}
            </div>
          )}

          <form className="recuperar-form" onSubmit={handleSubmit}>
            <div className="recuperar-group">
              <label>Email:</label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <p className="recuperar-info">
              Al presionar <b>"Restablecer contraseña"</b> se enviará un correo
              con un link para restablecer su contraseña.
            </p>

            <button type="submit" className="recuperar-btn">
              Restablecer Contraseña
            </button>
          </form>

          <div className="recuperar-links">
            <p>
              ¿Recordaste tu contraseña?{" "}
              <a href="/login">Inicia sesión</a>
            </p>
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Términos</a>
        </div>
        <div className="footer-copyright">
          © 2025 FDO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
};

export default RecuperarContrasena;