import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaCheckCircle, FaFileInvoice, FaSpinner } from "react-icons/fa";
import "../../styles/pages/checkout/PagoExitoso.css";
import SimpleHeader from "../../components/SimpleHeader";
import SimpleFooter from "../../components/SimpleFooter";

const PagoExitoso = () => {
  const navigate = useNavigate();
  const [facturaUrl, setFacturaUrl] = useState(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(false);
  const [generandoFactura, setGenerandoFactura] = useState(true); // 👈 Nuevo estado
  const ejecutadoRef = useRef(false);

  // Leer payment_id de la URL
  const query = new URLSearchParams(window.location.search);
  const paymentId = query.get("payment_id");

  useEffect(() => {
    if (!paymentId) {
      setGenerandoFactura(false); // 👈 Si no hay paymentId, no generar factura
      return;
    }

    const obtenerFactura = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/pago/factura/${paymentId}`);
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
  }, [paymentId]);

  useEffect(() => {
    if (!paymentId || ejecutadoRef.current || pedidoConfirmado) {
      console.log("⏭️ Confirmación ya ejecutada o sin paymentId");
      return;
    }

    const confirmarPedido = async () => {
      try {
        ejecutadoRef.current = true;
        console.log("🔔 Confirmando pedido por primera vez para session:", paymentId);

        const res = await fetch("http://localhost:4000/api/pago/pedido/confirmar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payment_id: paymentId }),
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
  }, [paymentId, pedidoConfirmado]);

  return (
    <div className="pago-exitoso-page-wrapper">

      <SimpleHeader />

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

      <SimpleFooter />

    </div>
  );
};

export default PagoExitoso;