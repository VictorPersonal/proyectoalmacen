import React, { useState, useEffect } from "react";
import logo from "../../assets/Logo dulce hogar.png";
import "./FormaEntrega.css";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from 'sweetalert2';

const FormaEntrega = () => {
  const [opcion, setOpcion] = useState("domicilio");
  const [direccionUsuario, setDireccionUsuario] = useState("");
  const [productos, setProductos] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener datos del usuario y productos del carrito al cargar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // 1. Obtener perfil del usuario (dirección)
        const respuestaUsuario = await fetch("https://backend-tpeu.onrender.com/api/usuario/perfil", {
          credentials: "include"
        });
        
        let direccionCompleta = "No has configurado tu dirección";
        
        if (respuestaUsuario.ok) {
          const datosUsuario = await respuestaUsuario.json();
          console.log("Datos del usuario:", datosUsuario);
          if (datosUsuario.direccion) {
            direccionCompleta = datosUsuario.direccion;
            if (datosUsuario.ciudad) {
              direccionCompleta += `, ${datosUsuario.ciudad}`;
            }
          }
        }
        setDireccionUsuario(direccionCompleta);

        // 2. Obtener TODOS los productos del carrito
        const respuestaCarrito = await fetch("https://backend-tpeu.onrender.com/api/carrito", {
          credentials: "include"
        });
        
        if (respuestaCarrito.ok) {
          const carrito = await respuestaCarrito.json();
          console.log("Carrito completo obtenido:", carrito);
          
          if (carrito.length > 0) {
            // Procesar todos los productos del carrito
            const productosProcesados = await Promise.all(
              carrito.map(async (itemCarrito) => {
                try {
                  // Obtener información completa de cada producto
                  const respuestaProducto = await fetch(
                    `https://backend-tpeu.onrender.com/api/productos/${itemCarrito.idproducto}`
                  );
                  
                  if (respuestaProducto.ok) {
                    const productoCompleto = await respuestaProducto.json();
                    
                    return {
                      id: itemCarrito.idproducto,
                      nombre: productoCompleto.nombre || itemCarrito.nombre || "Producto sin nombre",
                      precio: productoCompleto.precio || itemCarrito.precio || 0,
                      cantidad: itemCarrito.cantidad || 1,
                      subtotal: itemCarrito.subtotal || (productoCompleto.precio * (itemCarrito.cantidad || 1)),
                      imagen_url: productoCompleto.imagen_url
                    };
                  } else {
                    // Si falla la API de producto, usar datos del carrito
                    return {
                      id: itemCarrito.idproducto,
                      nombre: itemCarrito.nombre || "Producto sin nombre",
                      precio: itemCarrito.precio || 0,
                      cantidad: itemCarrito.cantidad || 1,
                      subtotal: itemCarrito.subtotal || 0,
                      imagen_url: null
                    };
                  }
                } catch (error) {
                  console.error(`Error obteniendo producto ${itemCarrito.idproducto}:`, error);
                  return {
                    id: itemCarrito.idproducto,
                    nombre: itemCarrito.nombre || "Producto sin nombre",
                    precio: itemCarrito.precio || 0,
                    cantidad: itemCarrito.cantidad || 1,
                    subtotal: itemCarrito.subtotal || 0,
                    imagen_url: null
                  };
                }
              })
            );
            
            console.log("Productos procesados:", productosProcesados);
            setProductos(productosProcesados);
            
            // Calcular subtotal sumando todos los subtotales
            const totalSubtotal = productosProcesados.reduce(
              (total, producto) => total + parseFloat(producto.subtotal || 0), 
              0
            );
            setSubtotal(totalSubtotal);
            console.log("Subtotal calculado:", totalSubtotal);
            
          } else {
            console.log("Carrito vacío");
            setProductos([]);
            setSubtotal(0);
          }
        } else {
          console.log("Error al obtener carrito");
          setProductos([]);
          setSubtotal(0);
        }
        
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setDireccionUsuario("Error al cargar la dirección");
        setProductos([]);
        setSubtotal(0);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [location.state]);

  const handleContinuar = () => {
    const costoEnvio = opcion === "domicilio" ? 15400 : 0;
    const total = subtotal + costoEnvio;

    console.log("Datos al continuar:", {
      productos: productos.map(p => p.nombre),
      subtotal,
      costoEnvio,
      total
    });

    // Mostrar confirmación antes de continuar
    Swal.fire({
      title: '¿Confirmar dirección de entrega?',
      html: `
        <div style="text-align: left;">
          <p><strong>Dirección seleccionada:</strong></p>
          <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
            ${direccionUsuario}
          </p>
          <p><strong>Productos en el carrito:</strong></p>
          <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
            ${productos.map(producto => 
              `<li>${producto.nombre} - ${producto.cantidad} x $${producto.precio.toLocaleString()}</li>`
            ).join('')}
          </ul>
          <p><strong>Subtotal productos:</strong> $${subtotal.toLocaleString()}</p>
          <p><strong>Tipo de entrega:</strong> ${opcion === "domicilio" ? "Envío a domicilio" : "Recoger en tienda"}</p>
          ${opcion === "domicilio" ? `<p><strong>Costo de envío:</strong> $15.400</p>` : ''}
          <p><strong>Total a pagar:</strong> $${total.toLocaleString()}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, continuar el pago',
      cancelButtonText: 'Revisar dirección',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        // Si confirma, navegar a la página de pago con TODOS los productos
        navigate("/checkout/forma-entrega/pago", {
          state: {
            productos: productos, // Enviar todos los productos
            subtotal: subtotal,
            costoEnvio: costoEnvio,
            total: total,
          },
        });
      }
    });
  };

  // Función para manejar la navegación a modificar dirección
  const handleModificarDireccion = (e) => {
    e.preventDefault();
    navigate("/modificar-direccion");
  };

  if (loading) {
    return (
      <div className="page-wrapper">
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

        <div className="envio-container">
          <div className="envio-left">
            <h2 className="envio-titulo">Elige la forma de entrega</h2>
            <div className="envio-opcion">
              <div className="envio-opcion-header">
                <input type="radio" checked readOnly />
                <h3>Enviar a domicilio</h3>
                <span className="envio-precio">$15.400</span>
              </div>
              <p className="envio-direccion">Cargando dirección...</p>
              <p className="envio-tipo">Residencial</p>
              <a 
                href="#" 
                className="envio-modificar"
                onClick={handleModificarDireccion}
              >
                Modificar domicilio o elegir otro
              </a>
            </div>
            <div className="envio-btn-continuar-container">
              <button className="envio-btn-continuar" disabled>
                Cargando...
              </button>
            </div>
          </div>

          <div className="envio-right">
            <div className="envio-resumen-compra">
              <h3>Resumen de compra</h3>
              <div className="envio-resumen-item">
                <span>Productos</span>
                <span>Cargando...</span>
              </div>
              <div className="envio-resumen-item">
                <span>Envío</span>
                <span>$15.400</span>
              </div>
              <hr />
              <div className="envio-resumen-total">
                <span>Total</span>
                <strong>Cargando...</strong>
              </div>
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
            © 2025 FHO, todos los derechos reservados
          </div>
        </footer>
      </div>
    );
  }

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
              {direccionUsuario}
            </p>
            <p className="envio-tipo">Residencial</p>
            <a 
              href="#" 
              className="envio-modificar"
              onClick={handleModificarDireccion}
            >
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
            
            {/* Mostrar todos los productos */}
            {productos.map((producto, index) => (
              <div key={index} className="envio-resumen-item">
                <span>{producto.nombre} ({producto.cantidad}x)</span>
                <span>${producto.subtotal.toLocaleString()}</span>
              </div>
            ))}
            
            <div className="envio-resumen-item">
              <span>Subtotal</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            
            <div className="envio-resumen-item">
              <span>Envío</span>
              <span>{opcion === "domicilio" ? "$15.400" : "Gratis"}</span>
            </div>
            
            <hr />
            <div className="envio-resumen-total">
              <span>Total</span>
              <strong>${(subtotal + (opcion === "domicilio" ? 15400 : 0)).toLocaleString()}</strong>
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