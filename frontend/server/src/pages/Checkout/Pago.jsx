import React, { useRef, useEffect } from "react";
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
import { Link } from "react-router-dom";

const Pago = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const ejecutadoRef = useRef(false); 

  const {
    tipoCompra = "carrito",
    productos = [],
    subtotal = 0,
    costoEnvio = 0,
    total = 0,
    iddireccion = null
  } = state || {};

  // 👈 Log solo una vez cuando el componente se monta
  useEffect(() => {
    if (!ejecutadoRef.current) {
      console.log("📦 Productos recibidos en Pago (solo una vez):", productos);
      ejecutadoRef.current = true;
    }
  }, [productos]);

  const nombresProductos = productos.length === 1
    ? productos[0].nombre
    : productos.map(p => p.nombre).join(", ");

  const handlePagarStripe = async () => {
    try {
      const productName = productos.length === 1
        ? productos[0].nombre
        : `Compra de ${productos.length} productos`;

      console.log("🛒 Preparando productos para Stripe (solo una vez):", productos);

      // 🔥 PREPARAR PRODUCTOS CORRECTAMENTE
      const productosParaStripe = productos.map(producto => ({
        id: producto.idproducto || producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: producto.cantidad || 1
      }));

      console.log("🚀 Productos formateados (solo una vez):", productosParaStripe);

      // 🔥 BODY COMPLETO CON PRODUCTOS
      const bodyData = {
        productName,
        price: total,
        source: tipoCompra === "directa" ? "producto" : "carrito",
        iddireccion: iddireccion,
        productos: productosParaStripe
      };

      console.log("📤 Enviando a Stripe (solo una vez):", bodyData);

      const res = await fetch("http://localhost:4000/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error del servidor");
      }

      const data = await res.json();
      console.log("✅ Respuesta de Stripe (solo una vez):", data);
      window.location.href = data.url;

    } catch (error) {
      console.error("❌ Error iniciando pago:", error);
      alert("Error al procesar el pago: " + error.message);
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

          {/* RESUMEN MEJORADO */}
          <div className="pago-resumen">
            <p><b>Productos:</b> {nombresProductos}</p>
            <p><b>Cantidad de productos:</b> {productos.length}</p>
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
          <Link to="/preguntas-frecuentes">Preguntas frecuentes</Link>
          <span>/</span>
          <Link to="/consejo-de-seguridad">Consejo de Seguridad</Link>
          <span>/</span>
          <Link to="/terminos-y-condiciones">Términos y Condiciones</Link>
        </div>
        <p className="pago-footer-copyright">
          © 2025 FDO, todos los derechos reservados
        </p>
      </footer>
    </div>
  );
};

export default Pago;