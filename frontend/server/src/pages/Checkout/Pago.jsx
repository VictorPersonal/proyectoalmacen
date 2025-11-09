import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Logo dulce hogar.png";
import "./Pago.css";

const Pago = () => {
  const navigate = useNavigate();

  // Datos fijos (puedes reemplazarlos luego por valores dinámicos)
  const total = 26596;
  const numeroNequi = "3108287279";

  // Enlace de WhatsApp
  const mensaje = encodeURIComponent(
    `Hola! Acabo de realizar un pago por Nequi a Dulce Hogar por un total de $${total.toLocaleString(
      "es-CO"
    )}. Adjunto el comprobante.`
  );
  const enlaceWhatsapp = `https://wa.me/57${3108287279}?text=${mensaje}`;

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

      {/* 🔹 Contenido principal */}
      <main className="container">
        <div className="login-box">
          <h2 className="form-title">Pago por Nequi</h2>

          <p style={{ fontSize: "13px", marginBottom: "15px", textAlign: "center" }}>
            Para completar tu compra, realiza el pago a través de <b>Nequi</b> y envía el
            comprobante por WhatsApp.
          </p>

          <div
            style={{
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
              padding: "15px",
              marginBottom: "20px",
              fontSize: "13px",
            }}
          >
            <p>
              <b>Cuenta Nequi:</b> {numeroNequi}
            </p>
            <p>
              <b>Nombre:</b> Dulce Hogar
            </p>
            <p>
              <b>Valor a pagar:</b> ${total.toLocaleString("es-CO")}
            </p>
          </div>

          <div
            style={{
              backgroundColor: "#fff4e5",
              border: "1px solid #ffd9a0",
              borderRadius: "8px",
              padding: "12px",
              fontSize: "12px",
              marginBottom: "25px",
            }}
          >
            <p style={{ marginBottom: "5px" }}>
              📋 <b>Pasos para completar el pago:</b>
            </p>
            <ol style={{ paddingLeft: "20px", marginTop: "5px" }}>
              <li>Abre tu aplicación Nequi.</li>
              <li>
                Envía <b>${total.toLocaleString("es-CO")}</b> al número <b>{numeroNequi}</b>.
              </li>
              <li>Toma una captura del comprobante de pago.</li>
              <li>
                Haz clic en el botón de abajo para enviarlo por WhatsApp y confirmar tu pedido.
              </li>
            </ol>
          </div>

          <a
            href={enlaceWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ingresar"
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
            }}
          >
            Enviar comprobante por WhatsApp
          </a>

          {/* 🔹 Botón centrado */}
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

export default Pago;
