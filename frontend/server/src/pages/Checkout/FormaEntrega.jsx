import React, { useState, useEffect, useRef } from "react";
import "../../styles/pages/checkout/FormaEntrega.css";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Swal from "sweetalert2";
import SimpleHeader from "../../components/SimpleHeader";
import SimpleFooter from "../../components/SimpleFooter";
import API_URL from "../../config/api.js";

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
  const ejecutadoRef = useRef(false);

  const normalizarProductoConPromo = (producto, cantidadBase = 1) => {
    const cantidad = Number(producto.cantidad || cantidadBase || 1);

    const precioAplicado = Number(
      producto.precio_final ||
        producto.precioFinal ||
        producto.precio ||
        0
    );

    return {
      ...producto,
      id: producto.id || producto.idproducto,
      idproducto: producto.idproducto || producto.id,
      precio: precioAplicado,
      precio_final: precioAplicado,
      precio_original: Number(producto.precio_original || producto.precio || precioAplicado),
      descuento_porcentaje: Number(producto.descuento_porcentaje || 0),
      tiene_promocion: Boolean(producto.tiene_promocion),
      promocion_nombre: producto.promocion_nombre || null,
      promocion_fecha_fin: producto.promocion_fecha_fin || null,
      cantidad,
      subtotal: precioAplicado * cantidad,
    };
  };

  useEffect(() => {
    const cargarDatos = async () => {
      if (ejecutadoRef.current) {
        console.log("⏭️ Carga de datos ya ejecutada");
        return;
      }

      try {
        ejecutadoRef.current = true;
        setLoading(true);

        const compraState = location.state;
        console.log("🔄 Estado de la compra:", compraState);

        if (compraState?.compraTipo === "directa") {
          setTipoCompra("directa");

          const compraDirecta = compraState.compraData;

          const productosConSubtotal = (compraDirecta.productos || []).map(
            (producto) => normalizarProductoConPromo(producto, producto.cantidad)
          );

          setProductos(productosConSubtotal);

          const totalSubtotal = productosConSubtotal.reduce(
            (total, producto) => total + Number(producto.subtotal || 0),
            0
          );

          setSubtotal(totalSubtotal);
        } else {
          setTipoCompra("carrito");

          const respuestaCarrito = await fetch(`${API_URL}/api/carrito`, {
            credentials: "include",
          });

          if (respuestaCarrito.ok) {
            const carrito = await respuestaCarrito.json();
            console.log("✅ Carrito completo obtenido:", carrito);

            if (carrito.length > 0) {
              const productosProcesados = await Promise.all(
                carrito.map(async (itemCarrito) => {
                  try {
                    const respuestaProducto = await fetch(
                      `${API_URL}/api/productos/${itemCarrito.idproducto}`
                    );

                    if (respuestaProducto.ok) {
                      const productoCompleto = await respuestaProducto.json();

                      const precioAplicado = Number(
                        productoCompleto.precio_final ||
                          itemCarrito.precio_final ||
                          itemCarrito.precio ||
                          productoCompleto.precio ||
                          0
                      );

                      const cantidad = Number(itemCarrito.cantidad || 1);

                      return {
                        id: itemCarrito.idproducto,
                        idproducto: itemCarrito.idproducto,
                        nombre:
                          productoCompleto.nombre ||
                          itemCarrito.nombre ||
                          "Producto sin nombre",
                        precio: precioAplicado,
                        precio_original: Number(
                          productoCompleto.precio_original ||
                            itemCarrito.precio_original ||
                            precioAplicado
                        ),
                        precio_final: precioAplicado,
                        descuento_porcentaje: Number(
                          productoCompleto.descuento_porcentaje ||
                            itemCarrito.descuento_porcentaje ||
                            0
                        ),
                        tiene_promocion: Boolean(
                          productoCompleto.tiene_promocion ||
                            itemCarrito.tiene_promocion
                        ),
                        promocion_nombre:
                          productoCompleto.promocion_nombre ||
                          itemCarrito.promocion_nombre ||
                          null,
                        promocion_fecha_fin:
                          productoCompleto.promocion_fecha_fin ||
                          itemCarrito.promocion_fecha_fin ||
                          null,
                        cantidad,
                        subtotal: precioAplicado * cantidad,
                        imagen_url:
                          productoCompleto.imagen_url ||
                          itemCarrito.imagen_url ||
                          productoCompleto.producto_imagen?.[0]?.url ||
                          null,
                      };
                    }

                    return normalizarProductoConPromo(itemCarrito);
                  } catch (error) {
                    console.error(
                      `❌ Error obteniendo producto ${itemCarrito.idproducto}:`,
                      error
                    );
                    return normalizarProductoConPromo(itemCarrito);
                  }
                })
              );

              setProductos(productosProcesados);

              const totalSubtotal = productosProcesados.reduce(
                (total, producto) => total + Number(producto.subtotal || 0),
                0
              );

              setSubtotal(totalSubtotal);
            } else {
              setProductos([]);
              setSubtotal(0);
            }
          } else {
            setProductos([]);
            setSubtotal(0);
          }
        }

        const respuestaUsuario = await fetch(
          `${API_URL}/api/usuario/perfil`,
          {
            credentials: "include",
          }
        );

        let direccionCompleta = "No has configurado tu dirección";
        let idDireccionUsuario = null;

        if (respuestaUsuario.ok) {
          const datosUsuario = await respuestaUsuario.json();

          if (datosUsuario.direccion) {
            direccionCompleta = datosUsuario.direccion;
            if (datosUsuario.ciudad) {
              direccionCompleta += `, ${datosUsuario.ciudad}`;
            }
          }

          idDireccionUsuario = datosUsuario.iddireccion;
        }

        setDireccionUsuario(direccionCompleta);
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

    Swal.fire({
      title: "¿Confirmar dirección de entrega?",
      html: `
        <div style="text-align: left;">
          <p><strong>Tipo de compra:</strong> ${
            tipoCompra === "directa" ? "Compra directa" : "Desde carrito"
          }</p>

          <p><strong>Dirección seleccionada:</strong></p>
          <p style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
            ${direccionUsuario}
          </p>

          <p><strong>Productos:</strong></p>
          <ul style="text-align: left; margin: 10px 0; padding-left: 20px;">
            ${productos
              .map((producto) => {
                const lineaPromo = producto.tiene_promocion
                  ? ` <span style="color:#d84040;">(-${producto.descuento_porcentaje}% aplicado)</span>`
                  : "";

                return `<li>
                  ${producto.nombre} - ${producto.cantidad} x $${Number(
                  producto.precio_final || producto.precio || 0
                ).toLocaleString("es-CO")}${lineaPromo}
                </li>`;
              })
              .join("")}
          </ul>

          <p><strong>Subtotal productos:</strong> $${subtotal.toLocaleString("es-CO")}</p>

          <p><strong>Tipo de entrega:</strong> ${
            opcion === "domicilio" ? "Envío a domicilio" : "Recoger en tienda"
          }</p>

          ${
            opcion === "domicilio"
              ? `<p><strong>Costo de envío:</strong> $15.400</p>`
              : ""
          }

          <p><strong>Total a pagar:</strong> $${total.toLocaleString("es-CO")}</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Sí, continuar el pago",
      cancelButtonText: "Revisar dirección",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/checkout/forma-entrega/pago", {
          state: {
            tipoCompra,
            productos,
            subtotal,
            costoEnvio,
            total,
            iddireccion: idDireccion,
          },
        });
      }
    });
  };

  const handleModificarDireccion = (e) => {
    e.preventDefault();
    navigate("/modificar-direccion");
  };

  const handleVolverProducto = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="entrega-page-wrapper">
        <SimpleHeader />

        <div className="entrega-container">
          <button className="entrega-btn-volver" onClick={handleVolverProducto}>
            ←
          </button>

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

        <SimpleFooter />
      </div>
    );
  }

  return (
    <div className="entrega-page-wrapper">
      <SimpleHeader />

      <div className="entrega-container">
        <button className="entrega-btn-volver" onClick={handleVolverProducto}>
          ←
        </button>

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

            <p className="entrega-direccion">{direccionUsuario}</p>
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

            {productos.map((producto, index) => (
              <div key={index} className="entrega-resumen-item">
                <span>
                  {producto.nombre} ({producto.cantidad}x)
                  {producto.tiene_promocion && (
                    <small style={{ color: "#d84040", marginLeft: "6px" }}>
                      -{producto.descuento_porcentaje}%
                    </small>
                  )}
                </span>

                <span>
                  ${Number(producto.subtotal || 0).toLocaleString("es-CO")}
                </span>
              </div>
            ))}

            <div className="entrega-resumen-item">
              <span>Subtotal</span>
              <span>${Number(subtotal || 0).toLocaleString("es-CO")}</span>
            </div>

            <div className="entrega-resumen-item">
              <span>Envío</span>
              <span>{opcion === "domicilio" ? "$15.400" : "Gratis"}</span>
            </div>

            <hr />

            <div className="entrega-resumen-total">
              <span>Total</span>
              <strong>
                $
                {Number(
                  (subtotal || 0) + (opcion === "domicilio" ? 15400 : 0)
                ).toLocaleString("es-CO")}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <SimpleFooter />
    </div>
  );
};

export default FormaEntrega;