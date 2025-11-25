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
    <div className="pago-page-wrapper">
      {/* HEADER */}
      <header className="pago-top-bar">
        <div className="pago-logo-section">
          <img src={logo} alt="Logo" className="pago-logo-img" />
          <div className="pago-logo-text">
            <span className="pago-logo-title">Dulce hogar</span>
            <span className="pago-logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="pago-help-icon">
          <FaQuestionCircle />
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="pago-container">
        <div className="pago-form-box">
          <h2 className="pago-form-title">Método de pago</h2>

          <p className="pago-descripcion">
            Selecciona un método de pago para completar tu compra.
          </p>

          {/* RESUMEN */}
          <div className="pago-resumen">
            <p><b>Producto:</b> {nombreProducto}</p>
            <p><b>Total a pagar:</b> ${total.toLocaleString("es-CO")}</p>
          </div>

          {/* MÉTODOS DE PAGO */}
          <div className="pago-metodos-container">

            {/* 🔵 STRIPE - ÚNICO MÉTODO ACTIVO */}
            <div
              className="pago-metodo pago-activo"
              onClick={handlePagarStripe}
            >
              <div className="pago-metodo-info">
                <FaCreditCard className="pago-metodo-icon" />
                <span>Pagar con tarjeta (Stripe)</span>
              </div>
              <FaArrowRight className="pago-metodo-flecha" />
            </div>

            {/* 🔒 NEQUI - DESACTIVADO */}
            <div
              className="pago-metodo pago-desactivado"
            >
              <div className="pago-metodo-info">
                <FaMobileAlt className="pago-metodo-icon" />
                <span>Pagar con Nequi (Próximamente)</span>
              </div>
              <FaBan className="pago-metodo-bloqueado" />
            </div>

            {/* 🔒 BANCOLOMBIA - DESACTIVADO */}
            <div
              className="pago-metodo pago-desactivado"
            >
              <div className="pago-metodo-info">
                <FaUniversity className="pago-metodo-icon" />
                <span>Transferencia Bancolombia (Próximamente)</span>
              </div>
              <FaBan className="pago-metodo-bloqueado" />
            </div>
          </div>

          {/* BOTÓN VOLVER */}
          <div className="pago-boton-volver-container">
            <button
              onClick={() => navigate("/")}
              className="pago-btn-volver"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="pago-footer">
        <div className="pago-footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Términos</a>
        </div>
        <p className="pago-footer-copyright">
          © 2025 FHO, todos los derechos reservados
        </p>
      </footer>
    </div>
  );
};

export default Pago;