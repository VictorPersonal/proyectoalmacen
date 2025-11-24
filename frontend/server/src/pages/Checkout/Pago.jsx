import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FaCreditCard, 
  FaMobileAlt, 
  FaUniversity, 
  FaArrowRight, 
  FaBan,
  FaQuestionCircle
} from "react-icons/fa";
import logo from "../../assets/Logo dulce hogar.png";
import "./Pago.css";

const Pago = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const total = state?.total || 0;
  const nombreProducto = state?.producto || "Sin producto";

  const handlePagarStripe = async () => {
    try {
      const producto = {
        productName: nombreProducto,
        price: total,
      };

      const res = await fetch("http://localhost:4000/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(producto),
      });

      const data = await res.json();
      window.location.href = data.url;
    } catch (error) {
      console.log("Error iniciando pago:", error);
    }
  };

  return (
    <div className="page-wrapper">
      {/* HEADER */}
      <header className="top-bar">
        <div className="logo-section">
          <img src={logo} alt="Logo" className="logo-icon" />
          <div className="logo-text">
            <span className="logo-title">Dulce hogar</span>
            <span className="logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="help-icon">
          <FaQuestionCircle />
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="container">
        <div className="login-box">
          <h2 className="form-title">Método de pago</h2>

          <p style={{ fontSize: "13px", marginBottom: "15px", textAlign: "center" }}>
            Selecciona un método de pago para completar tu compra.
          </p>

          {/* RESUMEN */}
          <div
            style={{
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "20px",
              fontSize: "13px",
            }}
          >
            <p><b>Producto:</b> {nombreProducto}</p>
            <p><b>Total a pagar:</b> ${total.toLocaleString("es-CO")}</p>
          </div>

          {/* MÉTODOS DE PAGO */}
          <div className="metodos-pago-container">

            {/* 🔵 STRIPE - ÚNICO MÉTODO ACTIVO */}
            <div
              className="metodo-pago activo"
              onClick={handlePagarStripe}
            >
              <div className="metodo-pago-info">
                <FaCreditCard className="metodo-icon" />
                <span>Pagar con tarjeta (Stripe)</span>
              </div>
              <FaArrowRight className="metodo-flecha" />
            </div>

            {/* 🔒 NEQUI - DESACTIVADO */}
            <div
              className="metodo-pago desactivado"
            >
              <div className="metodo-pago-info">
                <FaMobileAlt className="metodo-icon" />
                <span>Pagar con Nequi (Próximamente)</span>
              </div>
              <FaBan className="metodo-bloqueado" />
            </div>

            {/* 🔒 BANCOLOMBIA - DESACTIVADO */}
            <div
              className="metodo-pago desactivado"
            >
              <div className="metodo-pago-info">
                <FaUniversity className="metodo-icon" />
                <span>Transferencia Bancolombia (Próximamente)</span>
              </div>
              <FaBan className="metodo-bloqueado" />
            </div>
          </div>

          {/* BOTÓN VOLVER */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "15px" }}>
            <button
              onClick={() => navigate("/")}
              className="btn-ingresar"
              style={{
                width: "fit-content",
                minWidth: "160px",
                textAlign: "center",
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
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

export default Pago;