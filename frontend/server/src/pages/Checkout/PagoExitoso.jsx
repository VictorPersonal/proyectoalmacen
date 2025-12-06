import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/Logo dulce hogar.png";
import { FaCheckCircle, FaQuestionCircle, FaFileInvoice, FaSpinner } from "react-icons/fa";
import "./PagoExitoso.css";

const PagoExitoso = () => {
  const navigate = useNavigate();
  const [facturaUrl, setFacturaUrl] = useState(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [generandoFactura, setGenerandoFactura] = useState(true); // 👈 Nuevo estado
  const ejecutadoRef = useRef(false);

  // Leer session_id de la URL
  const query = new URLSearchParams(window.location.search);
  const sessionId = query.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setGenerandoFactura(false); // 👈 Si no hay sessionId, no generar factura
      return;
    }

    const obtenerFactura = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/stripe/factura/${sessionId}`);
        const data = await res.json();

        if (data.url) {
          setFacturaUrl(data.url);
        }
      } catch (err) {
        console.log("Error obteniendo factura:", err);
      } finally {
        setGenerandoFactura(false); // 👈 Ocultar mensaje tanto en éxito como en error
      }
    };

    obtenerFactura();
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId || ejecutadoRef.current || pedidoConfirmado) {
      console.log("⏭️ Confirmación ya ejecutada o sin sessionId");
      return;
    }

    const confirmarPedido = async () => {
      try {
        ejecutadoRef.current = true;
        console.log("🔔 Confirmando pedido por primera vez para session:", sessionId);

        const res = await fetch("http://localhost:4000/api/stripe/pedido/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        
        const data = await res.json();
        console.log("✅ Pedido confirmado:", data);

        if (!res.ok) {
          throw new Error(data.error || "Error confirmando pedido");
        }

        setPedidoConfirmado(true);
        console.log("🎉 Pedido procesado correctamente, productos insertados:", data.productosCount);

      } catch (err) {
        console.error("❌ Error confirmando pedido:", err);
        ejecutadoRef.current = false;
      }
    };

    const timer = setTimeout(() => {
      confirmarPedido();
    }, 100);

    return () => clearTimeout(timer);
  }, [sessionId, pedidoConfirmado]);

  return (
    <div className="pago-exitoso-page-wrapper">

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

      <main className="pago-exitoso-container">
        <div className="pago-exitoso-content">
          
          <h2 className="pago-exitoso-title">¡Pago exitoso! 🎉</h2>

          <p className="pago-exitoso-mensaje">
            Gracias por tu compra. Tu pago ha sido procesado correctamente.
            {pedidoConfirmado && " Tu pedido ha sido confirmado y está siendo preparado."}
          </p>

          <div className="pago-exitoso-icono">
            <FaCheckCircle />
          </div>

          {/* 👇 Mostrar mensaje de "Generando factura" mientras se carga */}
          {generandoFactura && (
            <div className="pago-exitoso-generando-factura">
              <FaSpinner className="pago-exitoso-spinner" />
              <h3>Generando factura...</h3>
              <p>Por favor espera un momento</p>
            </div>
          )}

          {/* 👇 Mostrar botón de descargar solo cuando la factura esté lista */}
          {facturaUrl && !generandoFactura && (
            <a
              href={facturaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="pago-exitoso-btn-descargar"
            >
              <FaFileInvoice style={{ marginRight: "8px" }} />
              Descargar factura (PDF)
            </a>
          )}

          <button
            onClick={() => navigate("/")}
            className="pago-exitoso-btn-volver"
          >
            Volver al inicio
          </button>
        </div>
      </main>

      <footer className="pago-exitoso-footer">
        <div className="pago-exitoso-footer-links">
          <Link to="/preguntas-frecuentes">Preguntas frecuentes</Link>
          <span>/</span>
          <Link to="/consejo-de-seguridad">Consejo de Seguridad</Link>
          <span>/</span>
          <Link to="/terminos-y-condiciones">Términos y Condiciones</Link>
        </div>
        <p className="pago-exitoso-footer-copyright">
          © 2025 FDO, todos los derechos reservados
        </p>
      </footer>

    </div>
  );
};

export default PagoExitoso;