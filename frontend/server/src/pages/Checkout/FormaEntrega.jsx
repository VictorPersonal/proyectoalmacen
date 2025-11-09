import React, { useState } from "react";
import logo from "../../assets/Logo dulce hogar.png";
import "./FormaEntrega.css";
import { useNavigate } from "react-router-dom";

const FormaEntrega = () => {
  const [opcion, setOpcion] = useState("domicilio");
  const navigate = useNavigate();

  const handleContinuar = () => {
    navigate("/checkout/forma-entrega/pago");
  };

  return (
    <div className="page-wrapper">
      {/* 🔹 Header igual al de Login */}
      <header className="top-bar">
        <div className="logo-section">
          <img src={logo} alt="Dulce hogar logo" id="logo-img" />
          <div className="logo-text">
            <span className="logo-title">Dulce hogar</span>
            <span className="logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="help-icon">?</div>
      </header>

      {/* 🔹 CONTENEDOR PRINCIPAL CON NUEVAS CLASES */}
      <div className="envio-container">
        {/* Lado izquierdo - Forma de entrega */}
        <div className="envio-left">
          <h2 className="envio-titulo">Elige la forma de entrega</h2>

          <div
            className={`envio-opcion ${
              opcion === "domicilio" ? "seleccionado" : ""
            }`}
            onClick={() => setOpcion("domicilio")}
          >
            <div className="envio-opcion-header">
              <input
                type="radio"
                checked={opcion === "domicilio"}
                onChange={() => setOpcion("domicilio")}
              />
              <h3>Enviar a domicilio</h3>
              <span className="envio-precio">$15.400</span>
            </div>
            <p className="envio-direccion">
              Calle 10 # 9-05 - Las Américas, Valle Del Cauca
            </p>
            <p className="envio-tipo">Residencial</p>
            <a href="#" className="envio-modificar">
              Modificar domicilio o elegir otro
            </a>
          </div>


          <div className="envio-btn-continuar-container">
            <button className="envio-btn-continuar" onClick={handleContinuar}>
              Continuar
            </button>
          </div>
        </div>

        {/* Lado derecho - Resumen de compra */}
        <div className="envio-right">
          <div className="envio-resumen-compra">
            <h3>Resumen de compra</h3>
            <div className="envio-resumen-item">
              <span>Producto</span>
              <span>$11.196</span>
            </div>
            <div className="envio-resumen-item">
              <span>Envío</span>
              <span>$15.400</span>
            </div>
            <hr />
            <div className="envio-resumen-total">
              <span>Total</span>
              <strong>$26.596</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Footer igual al de Login */}
      <footer className="footer">
        <div className="footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Términos</a>
        </div>
        <div className="footer-copyright">
          © 2025 FHO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
};

export default FormaEntrega;