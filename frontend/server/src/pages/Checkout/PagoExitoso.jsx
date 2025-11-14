import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Logo dulce hogar.png";

const PagoExitoso = () => {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper">

      {/* 🔹 Header */}
      <header className="top-bar">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="logo-icon" />
          <div className="logo-text">
            <span className="logo-title">Dulce hogar</span>
            <span className="logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="help-icon">?</div>
      </header>

      {/* 🔹 Cuerpo */}
      <main className="container">
        <div className="login-box" style={{ textAlign: "center", padding: "25px" }}>
          
          <h2 className="form-title">¡Pago exitoso! 🎉</h2>

          <p style={{ marginTop: "10px", fontSize: "14px" }}>
            Gracias por tu compra. Tu pago ha sido procesado correctamente.
          </p>

          <div style={{ fontSize: "50px", margin: "20px 0" }}>✅</div>

          <button
            onClick={() => navigate("/")}
            className="btn-ingresar"
            style={{
              width: "100%",
              marginTop: "15px",
              padding: "12px",
              fontWeight: "bold",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Volver al inicio
          </button>
        </div>
      </main>

      {/* 🔹 Footer */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Términos</a>
        </div>
        <p className="footer-copyright">
          © 2025 FHO, todos los derechos reservados
        </p>
      </footer>

    </div>
  );
};

export default PagoExitoso;
