import React, { useState, useEffect, useRef } from "react";
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
  const [tipoCompra, setTipoCompra] = useState("carrito");
  const [idDireccion, setIdDireccion] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const ejecutadoRef = useRef(false); // 👈 Nueva referencia para prevenir doble ejecución

  // Obtener datos del usuario y productos según el tipo de compra
  useEffect(() => {
    const cargarDatos = async () => {
      // 👈 Prevenir doble ejecución
      if (ejecutadoRef.current) {
        console.log("⏭️ Carga de datos ya ejecutada");
        return;
      }

      try {
        ejecutadoRef.current = true; // 👈 Marcar como ejecutado
        setLoading(true);
        
        // VERIFICAR TIPO DE COMPRA
        const compraState = location.state;
        console.log("🔄 Estado de la compra (solo una vez):", compraState);

        if (compraState?.compraTipo === "directa") {
          // 🛒 COMPRA DIRECTA - Usar solo el producto de compra directa
          console.log("🛒 Modo: COMPRA DIRECTA (solo una vez)");
          setTipoCompra("directa");
          
          const compraDirecta = compraState.compraData;
          
          // Asegurarnos de que cada producto tenga subtotal
          const productosConSubtotal = compraDirecta.productos.map(producto => ({
            ...producto,
            subtotal: producto.precio * producto.cantidad
          }));
          
          setProductos(productosConSubtotal);
          setSubtotal(compraDirecta.total);
          
          console.log("✅ Productos compra directa (solo una vez):", productosConSubtotal);
          console.log("✅ Total compra directa (solo una vez):", compraDirecta.total);
        } else {
          // 🛒 COMPRA DESDE CARRITO - Cargar todos los productos del carrito
          console.log("🛒 Modo: CARRITO NORMAL (solo una vez)");
          setTipoCompra("carrito");
          
          // Obtener TODOS los productos del carrito
          const respuestaCarrito = await fetch("http://localhost:4000/api/carrito", {
            credentials: "include"
          });
          
          if (respuestaCarrito.ok) {
            const carrito = await respuestaCarrito.json();
            console.log("✅ Carrito completo obtenido (solo una vez):", carrito);
            
            if (carrito.length > 0) {
              const productosProcesados = await Promise.all(
                carrito.map(async (itemCarrito) => {
                  try {
                    const respuestaProducto = await fetch(
                      `http://localhost:4000/api/productos/${itemCarrito.idproducto}`
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
                    console.error(`❌ Error obteniendo producto ${itemCarrito.idproducto}:`, error);
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
              
              console.log("✅ Productos del carrito (solo una vez):", productosProcesados);
              setProductos(productosProcesados);
              
              const totalSubtotal = productosProcesados.reduce(
                (total, producto) => total + parseFloat(producto.subtotal || 0), 
                0
              );
              setSubtotal(totalSubtotal);
              
            } else {
              console.log("✅ Carrito vacío (solo una vez)");
              setProductos([]);
              setSubtotal(0);
            }
          } else {
            console.log("❌ Error al obtener carrito");
            setProductos([]);
            setSubtotal(0);
          }
        }

        // Obtener perfil del usuario (dirección) - Esto se hace en ambos casos
        const respuestaUsuario = await fetch("http://localhost:4000/api/usuario/perfil", {
          credentials: "include"
        });

        let direccionCompleta = "No has configurado tu dirección";
        let idDireccionUsuario = null;

        if (respuestaUsuario.ok) {
          const datosUsuario = await respuestaUsuario.json();
          console.log("✅ Datos del usuario (solo una vez):", datosUsuario);

          if (datosUsuario.direccion) {
            direccionCompleta = datosUsuario.direccion;
            if (datosUsuario.ciudad) direccionCompleta += `, ${datosUsuario.ciudad}`;
          }

          // 🔑 Guardar ID de la dirección
          idDireccionUsuario = datosUsuario.iddireccion;
        }

        setDireccionUsuario(direccionCompleta);
        // 🔑 Guardamos el ID de la dirección en el estado para usarlo luego
        setIdDireccion(idDireccionUsuario);

        
      } catch (error) {
        console.error("❌ Error al cargar datos:", error);
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

    console.log("🚀 Datos al continuar (solo una vez):", {
      tipoCompra,
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
          <p><strong>Tipo de compra:</strong> ${tipoCompra === "directa" ? "Compra directa" : "Desde carrito"}</p>
          <p><strong>Dirección seleccionada:</strong></p>
          <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
            ${direccionUsuario}
          </p>
          <p><strong>Productos:</strong></p>
          <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
            ${productos.map(producto => 
              `<li>${producto.nombre} - ${producto.cantidad} x $${(producto.precio || 0).toLocaleString()}</li>`
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
        // Navegar a la página de pago con el tipo de compra
        navigate("/checkout/forma-entrega/pago", {
          state: {
            tipoCompra: tipoCompra,
            productos: productos,
            subtotal: subtotal,
            costoEnvio: costoEnvio,
            total: total,
            iddireccion: idDireccion
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
      <div className="entrega-page-wrapper">
        <header className="entrega-top-bar">
          <div className="entrega-logo-section">
            <img src={logo} alt="Dulce hogar logo" className="entrega-logo-img" />
            <div className="entrega-logo-text">
              <span className="entrega-logo-title">Dulce hogar</span>
              <span className="entrega-logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
            </div>
          </div>
          <div className="entrega-help-icon">?</div>
        </header>

        <div className="entrega-container">
          <div className="entrega-left">
            <h2 className="entrega-titulo">Elige la forma de entrega</h2>
            <div className="entrega-opcion">
              <div className="entrega-opcion-header">
                <input type="radio" checked readOnly />
                <h3>Enviar a domicilio</h3>
                <span className="entrega-precio">$15.400</span>
              </div>
              <p className="entrega-direccion">Cargando dirección...</p>
              <p className="entrega-tipo">Residencial</p>
              <a 
                href="#" 
                className="entrega-modificar"
                onClick={handleModificarDireccion}
              >
                Modificar domicilio o elegir otro
              </a>
            </div>
            <div className="entrega-btn-continuar-container">
              <button className="entrega-btn-continuar" disabled>
                Cargando...
              </button>
            </div>
          </div>

          <div className="entrega-right">
            <div className="entrega-resumen-compra">
              <h3>Resumen de compra</h3>
              <div className="entrega-resumen-item">
                <span>Productos</span>
                <span>Cargando...</span>
              </div>
              <div className="entrega-resumen-item">
                <span>Envío</span>
                <span>$15.400</span>
              </div>
              <hr />
              <div className="entrega-resumen-total">
                <span>Total</span>
                <strong>Cargando...</strong>
              </div>
            </div>
          </div>
        </div>

        <footer className="entrega-footer">
          <div className="entrega-footer-links">
            <a href="#">Preguntas frecuentes</a>
            <span>/</span>
            <a href="#">Consejos de seguridad</a>
            <span>/</span>
            <a href="#">Términos</a>
          </div>
          <div className="entrega-footer-copyright">
            © 2025 FHO, todos los derechos reservados
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="entrega-page-wrapper">
      <header className="entrega-top-bar">
        <div className="entrega-logo-section">
          <img src={logo} alt="Dulce hogar logo" className="entrega-logo-img" />
          <div className="entrega-logo-text">
            <span className="entrega-logo-title">Dulce hogar</span>
            <span className="entrega-logo-subtitle">ALMACÉN DE ELECTRODOMÉSTICOS</span>
          </div>
        </div>
        <div className="entrega-help-icon">?</div>
      </header>

      <div className="entrega-container">
        <div className="entrega-left">
          <h2 className="entrega-titulo">Elige la forma de entrega</h2>

          <div
            className={`entrega-opcion ${
              opcion === "domicilio" ? "entrega-seleccionado" : ""
            }`}
            onClick={() => setOpcion("domicilio")}
          >
            <div className="entrega-opcion-header">
              <input
                type="radio"
                checked={opcion === "domicilio"}
                onChange={() => setOpcion("domicilio")}
              />
              <h3>Enviar a domicilio</h3>
              <span className="entrega-precio">$15.400</span>
            </div>
            <p className="entrega-direccion">
              {direccionUsuario}
            </p>
            <p className="entrega-tipo">Residencial</p>
            <a 
              href="#" 
              className="entrega-modificar"
              onClick={handleModificarDireccion}
            >
              Modificar domicilio o elegir otro
            </a>
          </div>

          <div className="entrega-btn-continuar-container">
            <button className="entrega-btn-continuar" onClick={handleContinuar}>
              Continuar
            </button>
          </div>
        </div>

        <div className="entrega-right">
          <div className="entrega-resumen-compra">
            <h3>Resumen de compra</h3>
            
            {/* Mostrar todos los productos con validación segura */}
            {productos.map((producto, index) => (
              <div key={index} className="entrega-resumen-item">
                <span>{producto.nombre} ({producto.cantidad}x)</span>
                <span>${((producto.subtotal || producto.precio * producto.cantidad) || 0).toLocaleString()}</span>
              </div>
            ))}
            
            <div className="entrega-resumen-item">
              <span>Subtotal</span>
              <span>${(subtotal || 0).toLocaleString()}</span>
            </div>
            
            <div className="entrega-resumen-item">
              <span>Envío</span>
              <span>{opcion === "domicilio" ? "$15.400" : "Gratis"}</span>
            </div>
            
            <hr />
            <div className="entrega-resumen-total">
              <span>Total</span>
              <strong>${((subtotal || 0) + (opcion === "domicilio" ? 15400 : 0)).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>

      <footer className="entrega-footer">
        <div className="entrega-footer-links">
          <a href="#">Preguntas frecuentes</a>
          <span>/</span>
          <a href="#">Consejos de seguridad</a>
          <span>/</span>
          <a href="#">Términos</a>
        </div>
        <div className="entrega-footer-copyright">
          © 2025 FHO, todos los derechos reservados
        </div>
      </footer>
    </div>
  );
};

export default FormaEntrega;