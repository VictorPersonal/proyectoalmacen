import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Logo dulce hogar.png";
import { FaCheckCircle, FaQuestionCircle } from "react-icons/fa";
import "./PagoExitoso.css";

const PagoExitoso = () => {
  const navigate = useNavigate();

  return (
    <div className="pago-exitoso-page-wrapper">

      {/* 🔹 Header */}
      <header className="pago-exitoso-top-bar">
        <div className="pago-exitoso-logo-section">
          <img src={logo} alt="Logo" className="pago-exitoso-logo-img" />
          <div className="pago-exitoso-logo-text">
            <span className="pago-exitoso-logo-title">Dulce hogar</span>
            <span className="pago-exitoso-logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="pago-exitoso-help-icon">
          <FaQuestionCircle />
        </div>
      </header>

      {/* 🔹 Cuerpo */}
      <main className="pago-exitoso-container">
        <div className="pago-exitoso-content">
          
          <h2 className="pago-exitoso-title">¡Pago exitoso! 🎉</h2>

          <p className="pago-exitoso-mensaje">
            Gracias por tu compra. Tu pago ha sido procesado correctamente.
          </p>

          <div className="pago-exitoso-icono">
            <FaCheckCircle />
          </div>

          <button
            onClick={() => navigate("/")}
            className="pago-exitoso-btn-volver"
          >
            Volver al inicio
          </button>
        </div>
      </main>

      {/* 🔹 Footer */}
      <footer className="pago-exitoso-footer">
        <div className="pago-exitoso-footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Términos</a>
        </div>
        <p className="pago-exitoso-footer-copyright">
          © 2025 FHO, todos los derechos reservados
        </p>
      </footer>

    </div>
  );
};

export default PagoExitoso;