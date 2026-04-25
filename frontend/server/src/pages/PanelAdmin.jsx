import React, { useState, useEffect, useRef } from "react";
import "../styles/pages/PanelAdmin.css";
import Dashboard from "../components/dashboard";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaBox,
  FaChartBar,
  FaSearch,
  FaPlus,
  FaEdit,
  FaPowerOff,
  FaQuestionCircle,
  FaImage,
  FaTimes,
  FaSave,
  FaHome,
  FaUserCircle,
  FaSpinner,
  FaEye,
  FaEyeSlash,
  FaShoppingBag,
  FaShoppingCart,
  FaClipboardList,
  FaBell,
} from "react-icons/fa";

const ESTADOS_PEDIDO = ["Pendiente", "Pagado", "En camino", "Entregado", "Cancelado"];

const PanelAdmin = () => {
  const [currentSection, setCurrentSection] = useState("productos");
  const [modalVisible, setModalVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;
  const [editingProduct, setEditingProduct] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔹 ESTADO PARA PEDIDOS (ADMIN)
  const [pedidos, setPedidos] = useState([]);
  const [pedidosLoading, setPedidosLoading] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [estadoEditando, setEstadoEditando] = useState("");
  const [showPedidoModal, setShowPedidoModal] = useState(false);

  const navigate = useNavigate();
  const profileRef = useRef(null);

   // 🔔 NOTIFICACIONES
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // 🔹 El formulario ahora usa nombre de categoría y marca, no IDs directos
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    stock: "",
    descripcion: "",
    categoriaNombre: "", // texto visible para el usuario
    marcaNombre: "", // texto visible para el usuario
    imagenes: [],
  });

  /* =========================================================
     BLOQUEAR BOTÓN ATRÁS SOLO EN ADMIN
  ========================================================= */
  useEffect(() => {
    const bloquearNavegacion = () => {
      navigate(0);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", bloquearNavegacion);

    return () => {
      window.removeEventListener("popstate", bloquearNavegacion);
    };
  }, [navigate]);

  /* =========================================================
     CARGAR INFO ADMIN DESDE localStorage
  ========================================================= */
  useEffect(() => {
    const stored = localStorage.getItem("usuarioInfo");
    if (stored) {
      try {
        setAdminInfo(JSON.parse(stored));
      } catch (e) {
        console.error("Error leyendo admin:", e);
      }
    }
  }, []);

  /* =========================================================
     CERRAR SESIÓN
  ========================================================= */
  const handleLogout = () => {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que deseas salir del panel de administración?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar",
      background: "#fff",
      color: "#333",
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("usuarioInfo");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setShowProfileMenu(false);

        Swal.fire({
          title: "Sesión cerrada",
          text: "Has cerrado sesión correctamente",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          window.location.href = "/";
        });
      }
    });
  };

  /* =========================================================
     IR AL HOME SIN CERRAR SESIÓN
  ========================================================= */
  const handleGoHome = () => {
    Swal.fire({
      title: "Ir al inicio",
      text: "¿Deseas ir a la página principal?",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, ir al inicio",
      cancelButtonText: "Cancelar",
      background: "#fff",
      color: "#333",
    }).then((result) => {
      if (result.isConfirmed) {
        setShowProfileMenu(false);
        navigate("/");
      }
    });
  };

  /* =========================================================
     CERRAR MENÚ DE PERFIL AL HACER CLICK AFUERA
  ========================================================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


    // =========================================================
  // 🔔 NOTIFICACIONES (pedidos en estado Pendiente)
  // =========================================================
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);

      const res = await axios.get(
        "http://localhost:4000/api/admin/pedidos",
        { withCredentials: true }
      );

      const pedidosData = res.data || [];

      // Notificamos solo pedidos en estado "Pendiente"
      const pendientes = pedidosData.filter(
        (p) => p.estado === "Pendiente"
      );

      setNotifications(pendientes);
    } catch (err) {
      console.error("Error al obtener notificaciones:", err.response?.data || err.message);
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar las notificaciones",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    } finally {
      setNotificationsLoading(false);
    }
  };

  const toggleNotifications = () => {
    // Cuando se abre el panel, recargamos las notificaciones
    if (!showNotifications) {
      fetchNotifications();
    }
    setShowNotifications((prev) => !prev);
  };

  /* =========================================================
     TRAER PRODUCTOS
  ========================================================= */
  const fetchProducts = async () => {
    try {
      setLoading(true);

      const res = await axios.get("http://localhost:4000/api/productosAdmin/admin/productos", {
        withCredentials: true,
      });

      setProducts(res.data);
    } catch (err) {
      console.error(
        "Error al obtener productos:",
        err.response?.data || err.message
      );

      if (err.response?.status === 403) {
        Swal.fire({
          title: "Acceso denegado",
          text: "No tienes permisos de administrador para ver todos los productos.",
          icon: "error",
          confirmButtonText: "Entendido",
        });
      } else if (err.response?.status === 401) {
        Swal.fire({
          title: "Sesión expirada",
          text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          icon: "warning",
          confirmButtonText: "Entendido",
        }).then(() => {
          handleLogout();
        });
      } else {
        try {
          console.log("⚠️ Intentando con endpoint público...");
          const resPublic = await axios.get(
            "http://localhost:4000/api/productos",
            {
              withCredentials: true,
            }
          );
          setProducts(resPublic.data);
        } catch (fallbackErr) {
          Swal.fire({
            title: "Error",
            text: "No se pudieron cargar los productos",
            icon: "error",
            confirmButtonText: "Entendido",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* =========================================================
     TRAER CATEGORÍAS Y MARCAS (id + descripción)
  ========================================================= */
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [resCat, resMar] = await Promise.all([
          axios.get("http://localhost:4000/api/categorias"),
          axios.get("http://localhost:4000/api/marcas"),
        ]);
        setCategorias(resCat.data || []);
        setMarcas(resMar.data || []);
      } catch (err) {
        console.error(
          "Error al obtener categorías/marcas:",
          err.response?.data || err.message
        );
      }
    };
    fetchCatalogos();
  }, []);

  // cuando cambie el término de búsqueda, volver a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // limpiar el buscador cuando cambias de sección
  useEffect(() => {
    setSearchTerm("");
  }, [currentSection]);

  /* =========================================================
     MANEJO DE INPUTS
  ========================================================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* =========================================================
     IMÁGENES MÚLTIPLES
  ========================================================= */
  const handleImageChange = (e, index) => {
    const files = e.target.files;
    if (files && files[0]) {
      const newImages = [...(formData.imagenes || [])];
      newImages[index] = files[0];
      setFormData({ ...formData, imagenes: newImages });
    }
  };

  const removeImage = (index) => {
    const newImages = [...(formData.imagenes || [])];
    newImages[index] = null;
    setFormData({ ...formData, imagenes: newImages });
  };

  /* =========================================================
     BÚSQUEDA
  ========================================================= */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  /* =========================================================
     HELPERS CATEGORÍA / MARCA (id <-> descripción)
  ========================================================= */

  // Obtener texto legible de categoría para mostrar en tabla o al editar
  const getNombreCategoria = (productOrId) => {
    // Si viene el objeto producto
    if (productOrId && typeof productOrId === "object") {
      const p = productOrId;

      // si el producto ya viene con la descripción directa
      if (p.descripcionCategoria) return p.descripcionCategoria;

      // si solo trae el idcategoria, buscamos en el arreglo categorias
      const id = p.idcategoria;
      const cat = categorias.find(
        (c) => String(c.idcategoria) === String(id)
      );
      return cat ? cat.descripcionCategoria : id;
    }

    // Si viene solo el ID
    const id = productOrId;
    const cat = categorias.find(
      (c) => String(c.idcategoria) === String(id)
    );
    return cat ? cat.descripcionCategoria : id;
  };

  const getNombreMarca = (productOrId) => {
    // Si viene el objeto producto completo
    if (productOrId && typeof productOrId === "object") {
      const p = productOrId;

      // Si el producto ya trae la descripción de la marca
      if (p.descripcionMarca) return p.descripcionMarca;

      const id = p.idmarca;
      if (!id) return "";

      const m = marcas.find((mar) => String(mar.idmarca) === String(id));
      return m ? m.descripcionMarca : String(id);
    }

    // Si viene solo el ID
    const id = productOrId;
    if (!id) return "";

    const m = marcas.find((mar) => String(mar.idmarca) === String(id));
    return m ? m.descripcionMarca : String(id);
  };

  // Buscar o crear categoría según su descripción
  const obtenerOCrearCategoria = async (nombreCategoria) => {
    const nombre = (nombreCategoria || "").trim();
    if (!nombre) return null;

    let existente = categorias.find((c) => {
      const desc =
        c.descripcionCategoria ||
        c.descripionCategoria ||
        c.descripcion ||
        "";
      return desc.toLowerCase() === nombre.toLowerCase();
    });

    if (existente) return existente.idcategoria;

    // Crear nueva categoría usando la columna de descripción que manejes
    const res = await axios.post("http://localhost:4000/api/categorias", {
      descripcionCategoria: nombre,
    });

    const nueva = res.data;
    setCategorias((prev) => [...prev, nueva]);
    return nueva.idcategoria;
  };

  // Buscar o crear marca según su descripción
  const obtenerOCrearMarca = async (nombreMarca) => {
    const nombre = (nombreMarca || "").trim();
    if (!nombre) return null;

    let existente = marcas.find((m) => {
      const desc = m.descripcionMarca || m.descripcion || "";
      return desc.toLowerCase() === nombre.toLowerCase();
    });

    if (existente) return existente.idmarca;

    const res = await axios.post("http://localhost:4000/api/marcas", {
      descripcionMarca: nombre,
    });

    const nueva = res.data;
    setMarcas((prev) => [...prev, nueva]);
    return nueva.idmarca;
  };

  /* =========================================================
     CREAR / EDITAR PRODUCTO
  ========================================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Resolver nombres de categoría / marca a IDs reales
      const idCategoria = await obtenerOCrearCategoria(
        formData.categoriaNombre
      );
      const idMarca = formData.marcaNombre
        ? await obtenerOCrearMarca(formData.marcaNombre)
        : null;

      const data = new FormData();

      data.append("nombre", formData.nombre);
      data.append("precio", formData.precio);
      data.append("stock", formData.stock);
      data.append("descripcion", formData.descripcion || "");

      if (idCategoria) data.append("idcategoria", idCategoria);
      if (idMarca) data.append("idmarca", idMarca);

      if (formData.imagenes) {
        formData.imagenes.forEach((imagen) => {
          if (imagen) {
            data.append("imagenes", imagen);
          }
        });
      }

      let response;
      if (editingProduct) {
        response = await axios.put(
          `http://localhost:4000/api/productosAdmin/productos/${editingProduct.idproducto}/con-imagen`,
          data,
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000,
            withCredentials: true //Todas estas variables con withCredentials son para validar el token
          }
        );

        Swal.fire({
          title: "¡Éxito!",
          text: `Producto actualizado ${
            response.data.message
              ? response.data.message.toLowerCase()
              : "correctamente"
          }`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        response = await axios.post(
          "http://localhost:4000/api/productosAdmin/productos/con-imagen",
          data,
          
          {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000,
            withCredentials: true
          }
        );

        Swal.fire({
          title: "¡Producto Creado!",
          text: `Producto creado ${
            response.data.message
              ? response.data.message.toLowerCase()
              : "correctamente"
          }`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }

      await fetchProducts();

      setModalVisible(false);
      setEditingProduct(null);
      setFormData({
        nombre: "",
        precio: "",
        stock: "",
        descripcion: "",
        categoriaNombre: "",
        marcaNombre: "",
        imagenes: [],
      });
    } catch (err) {
      console.error(
        "Error al guardar producto:",
        err.response?.data || err.message
      );

      Swal.fire({
        title: "Error",
        text: `Error al guardar producto: ${
          err.response?.data?.message || err.message
        }`,
        icon: "error",
        confirmButtonText: "Entendido",
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PREPARAR EDICIÓN
  ========================================================= */
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      precio: product.precio,
      stock: product.stock,
      descripcion: product.descripcion || "",
      categoriaNombre: getNombreCategoria(product),
      marcaNombre: getNombreMarca(product),
      imagenes: [],
    });
    setModalVisible(true);
  };

  /* =========================================================
     ACTIVAR / DESACTIVAR PRODUCTO
  ========================================================= */
  const handleToggleActive = async (product) => {
    if (product.stock === 0 && !product.activo) {
      Swal.fire({
        title: "Stock insuficiente",
        text: "Este producto no se puede activar porque su stock es 0.",
        icon: "warning",
        confirmButtonText: "Entendido",
      });
      return;
    }

    const nuevoEstado = !product.activo;

    Swal.fire({
      title: `${nuevoEstado ? "Activar" : "Desactivar"} producto`,
      text: `¿Estás seguro de que deseas ${
        nuevoEstado ? "activar" : "desactivar"
      } "${product.nombre}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? "#28a745" : "#d33",
      cancelButtonColor: "#6c757d",
      confirmButtonText: nuevoEstado ? "Sí, activar" : "Sí, desactivar",
      cancelButtonText: "Cancelar",
      background: "#fff",
      color: "#333",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await axios.patch(
            `http://localhost:4000/api/productosAdmin/productos/${product.idproducto}/estado`,
            { activo: nuevoEstado },
            { withCredentials: true }
          );

          await fetchProducts();

          Swal.fire({
            title: "¡Estado Actualizado!",
            text: `Producto ${
              nuevoEstado ? "activado" : "desactivado"
            } correctamente`,
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });
        } catch (err) {
          console.error(
            "Error al cambiar estado del producto:",
            err.response?.data || err.message
          );

          Swal.fire({
            title: "Error",
            text: "Error al cambiar estado del producto",
            icon: "error",
            confirmButtonText: "Entendido",
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  /* =========================================================
     IMÁGENES DEL PRODUCTO
  ========================================================= */
  const getPrimeraImagen = (product) => {
    if (product.producto_imagen && product.producto_imagen.length > 0) {
      return product.producto_imagen[0].url;
    }
    return null;
  };

  const contarImagenes = (product) => {
    if (product.producto_imagen && product.producto_imagen.length > 0) {
      return product.producto_imagen.length;
    }
    return 0;
  };

  const tieneImagenes = (product) => {
    return product.producto_imagen && product.producto_imagen.length > 0;
  };

  /* =========================================================
     FILTRO + PAGINACIÓN PRODUCTOS
  ========================================================= */
  const filteredProducts = products.filter((prod) =>
    prod.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / productsPerPage)
  );

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  /* =========================================================
     PAGINACIÓN CON TECLADO (PRODUCTOS)
  ========================================================= */
  useEffect(() => {
    if (currentSection !== "productos") return;

    const handleKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "ArrowRight") {
        handleNextPage();
      } else if (e.key === "ArrowLeft") {
        handlePrevPage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPage, totalPages, currentSection]);

  /* =========================================================
     LIMPIAR URLs DE OBJETOS AL CERRAR MODAL
  ========================================================= */
  useEffect(() => {
    return () => {
      if (formData.imagenes) {
        formData.imagenes.forEach((img) => {
          if (img && typeof img === "object") {
            URL.revokeObjectURL(URL.createObjectURL(img));
          }
        });
      }
    };
  }, [modalVisible]);

  /* =========================================================
     PEDIDOS - FETCH & HELPERS
  ========================================================= */
  const fetchPedidos = async () => {
    try {
      setPedidosLoading(true);
      const res = await axios.get(
        "http://localhost:4000/api/admin/pedidos",
        {
          withCredentials: true,
        }
      );
      setPedidos(res.data || []);
    } catch (err) {
      console.error(
        "Error al obtener pedidos:",
        err.response?.data || err.message
      );
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los pedidos",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    } finally {
      setPedidosLoading(false);
    }
  };

  // cargar pedidos al entrar a la sección
  useEffect(() => {
    if (currentSection === "pedidos" && pedidos.length === 0) {
      fetchPedidos();
    }
  }, [currentSection, pedidos.length]);

  // filtro de pedidos (por número o cliente)
  const filteredPedidos = pedidos.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.numero?.toLowerCase().includes(term) ||
      p.cliente?.toLowerCase().includes(term)
    );
  });

  const getEstadoBadgeClass = (estado) => {
    if (!estado) return "estado-pedido estado-desconocido";
    const key = estado.toLowerCase().trim().replace(/\s+/g, "-");
    return `estado-pedido estado-${key}`;
  };

  const handleVerPedido = async (idpedido) => {
    try {
      setPedidosLoading(true);
      const res = await axios.get(
        `http://localhost:4000/api/admin/pedidos/${idpedido}`,
        { withCredentials: true }
      );
      setSelectedPedido(res.data);
      setEstadoEditando(res.data.estado || "");
      setShowPedidoModal(true);
    } catch (err) {
      console.error(
        "Error al obtener detalle de pedido:",
        err.response?.data || err.message
      );
      Swal.fire({
        title: "Error",
        text: "No se pudo cargar el detalle del pedido",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    } finally {
      setPedidosLoading(false);
    }
  };

  const handleGuardarEstadoPedido = async () => {
    if (!selectedPedido) return;
    if (!estadoEditando) {
      Swal.fire({
        title: "Estado requerido",
        text: "Selecciona un estado antes de guardar.",
        icon: "warning",
      });
      return;
    }

    try {
      setPedidosLoading(true);
      await axios.patch(
        `http://localhost:4000/api/admin/pedidos/${selectedPedido.idpedido}/estado`,
        { estado: estadoEditando },
        { withCredentials: true }
      );

      // actualizar en la tabla
      setPedidos((prev) =>
        prev.map((p) =>
          p.idpedido === selectedPedido.idpedido
            ? { ...p, estado: estadoEditando }
            : p
        )
      );

      Swal.fire({
        title: "Estado actualizado",
        text: `El pedido ${selectedPedido.numero} ahora está en estado "${estadoEditando}".`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setShowPedidoModal(false);
      setSelectedPedido(null);
    } catch (err) {
      console.error(
        "Error al actualizar estado del pedido:",
        err.response?.data || err.message
      );
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar el estado del pedido",
        icon: "error",
        confirmButtonText: "Entendido",
      });
    } finally {
      setPedidosLoading(false);
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="admin-panel">
      <aside className="sidebar">
        {/* Perfil con menú de opciones */}
        <div
          className="admin-profile profile-clickable"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          ref={profileRef}
        >
          <div className="admin-avatar">
            <FaUserCircle size={24} />
          </div>
          <span className="admin-name">
            {adminInfo?.nombre || "Administrador"}
          </span>

          {showProfileMenu && (
            <div className="profile-menu">
              <button onClick={handleGoHome}>
                <FaHome className="menu-icon" />
                Ir al menú
              </button>
              <button onClick={handleLogout}>
                <FaPowerOff className="menu-icon" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {/* 👇 NAVBAR ACTUALIZADO CON 3 ELEMENTOS */}
          <button
            type="button"
            className={`nav-item ${
              currentSection === "productos" ? "active" : ""
            }`}
            onClick={() => setCurrentSection("productos")}
          >
            <FaBox className="nav-icon" />
            Productos
          </button>

          <button
            type="button"
            className={`nav-item ${
              currentSection === "pedidos" ? "active" : ""
            }`}
            onClick={() => setCurrentSection("pedidos")}
          >
            <FaShoppingCart className="nav-icon" />
            Pedidos
          </button>

          <button
            type="button"
            className={`nav-item ${
              currentSection === "dashboard" ? "active" : ""
            }`}
            onClick={() => setCurrentSection("dashboard")}
          >
            <FaChartBar className="nav-icon" />
            Dashboard
          </button>
        </nav>
      </aside>

      {/* MODAL AYUDA */}
      {showHelp && (
        <div className="modal">
          <div className="modal-content help-modal">
            <h3>
              <FaQuestionCircle className="help-icon" />
              Ayuda del Administrador
            </h3>
            <p>
              Desde aquí puedes gestionar todos los productos del sistema.
              Puedes agregar hasta 4 imágenes por producto, editar información y
              activar/desactivar productos según la disponibilidad de stock.
            </p>
            <button className="btn btn--add" onClick={() => setShowHelp(false)}>
              <FaTimes className="btn-icon" />
              Cerrar
            </button>
          </div>
        </div>
      )}

      <main className="main-content">
        <div className="top-buttons">
          {/* 🔔 Botón de notificaciones */}
          <button
              className="notif-btn"
              onClick={toggleNotifications}
              title="Notificaciones"
            >
              <FaBell size={18} />
              {notifications.length > 0 && (
                <span className="notif-badge">
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Botón de ayuda existente */}
            <button className="help-btn" onClick={() => setShowHelp(true)}>
              <FaQuestionCircle size={18} />
            </button>
          </div>

        {/* Panel de notificaciones */}
        {showNotifications && (
          <div className="notifications-panel">
            <div className="notifications-header">
              <h4>Notificaciones</h4>
              <button
                className="notifications-close"
                onClick={() => setShowNotifications(false)}
              >
                <FaTimes size={12} />
              </button>
            </div>

            {notificationsLoading ? (
              <div className="notifications-loading">
                <FaSpinner className="loading-spinner" />
                <span>Cargando notificaciones...</span>
              </div>
            ) : notifications.length === 0 ? (
              <p className="notifications-empty">
                No hay pedidos pendientes.
              </p>
            ) : (
              <ul className="notifications-list">
                {notifications.map((pedido) => (
                  <li key={pedido.idpedido} className="notification-item">
                    <div className="notification-main">
                      <span className="notification-title">
                        Pedido {pedido.numero}
                      </span>
                      <span className="notification-client">
                        {pedido.cliente}
                      </span>
                    </div>
                    <div className="notification-meta">
                      <span className="notification-total">
                        ${pedido.total.toLocaleString()}
                      </span>
                      <span className="notification-date">
                        {pedido.fecha}
                      </span>
                    </div>
                    <button
                      className="notification-btn"
                      onClick={() => {
                        setCurrentSection("pedidos");
                        setShowNotifications(false);
                      }}
                    >
                      Ver en pedidos
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}



        {/* =====================================================
            SECCIÓN PRODUCTOS
        ===================================================== */}
        {currentSection === "productos" && (
          <>
            {/* Buscador + agregar */}
            <div className="search-wrapper">
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar producto"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              <button
                className="btn btn--add-secondary"
                onClick={() => {
                  setEditingProduct(null);
                  setFormData({
                    nombre: "",
                    precio: "",
                    stock: "",
                    descripcion: "",
                    categoriaNombre: "",
                    marcaNombre: "",
                    imagenes: [],
                  });
                  setModalVisible(true);
                }}
                disabled={loading}
              >
                <FaPlus className="btn-icon" />
                Agregar producto
              </button>
            </div>

            {/* Loading indicator */}
            {loading && (
              <div className="loading-indicator">
                <FaSpinner className="loading-spinner" />
                <span>Cargando...</span>
              </div>
            )}

            {/* Tabla de productos */}
            <div className="table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Imágenes</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="no-products">
                        {searchTerm
                          ? "No se encontraron productos"
                          : "No hay productos"}
                      </td>
                    </tr>
                  ) : (
                    currentProducts.map((prod) => (
                      <tr key={prod.idproducto}>
                        <td>{prod.idproducto}</td>
                        <td>
                          {tieneImagenes(prod) ? (
                            <img
                              src={getPrimeraImagen(prod)}
                              alt={prod.nombre}
                              width="50"
                              height="50"
                              style={{
                                objectFit: "cover",
                                borderRadius: "4px",
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : (
                            <div className="no-image-placeholder">
                              <FaImage size={20} />
                            </div>
                          )}
                        </td>
                        <td>{prod.nombre}</td>
                        <td>${Number(prod.precio).toFixed(2)}</td>
                        <td>{prod.stock}</td>
                        {/* 🔹 Aquí ya mostramos la descripción, no el ID */}
                        <td>{getNombreCategoria(prod)}</td>
                        <td>
                          <span
                            className={`image-count ${
                              contarImagenes(prod) === 0 ? "no-images" : ""
                            }`}
                          >
                            <FaImage className="count-icon" />
                            {contarImagenes(prod)} img
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${
                              prod.activo ? "status-active" : "status-inactive"
                            }`}
                          >
                            {prod.activo ? (
                              <>
                                <FaEye className="status-icon" /> Activo
                              </>
                            ) : (
                              <>
                                <FaEyeSlash className="status-icon" /> Inactivo
                              </>
                            )}
                          </span>
                        </td>

                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn--edit"
                              onClick={() => handleEdit(prod)}
                              disabled={loading}
                            >
                              <FaEdit className="btn-icon" />
                              Editar
                            </button>

                            <button
                              className={`btn btn--status ${
                                prod.activo ? "btn--inactive" : "btn--add"
                              }`}
                              onClick={() => handleToggleActive(prod)}
                              disabled={
                                (prod.stock === 0 && !prod.activo) || loading
                              }
                            >
                              {prod.stock === 0 && !prod.activo ? (
                                <>
                                  <FaShoppingBag className="btn-icon" />
                                  Sin stock
                                </>
                              ) : prod.activo ? (
                                <>
                                  <FaEyeSlash className="btn-icon" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <FaEye className="btn-icon" />
                                  Activar
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="pagination">
              <button
                className="page-btn"
                onClick={handlePrevPage}
                disabled={currentPage === 1 || loading}
              >
                ‹
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  className={`page-number ${
                    currentPage === i + 1 ? "active" : ""
                  }`}
                  onClick={() => setCurrentPage(i + 1)}
                  disabled={loading}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || loading}
              >
                ›
              </button>
            </div>
          </>
        )}

        {/* =====================================================
            SECCIÓN DE PEDIDOS (REAL)
        ===================================================== */}
        {currentSection === "pedidos" && (
          <div className="pedidos-section">
            <div className="section-header">
              <h2>
                <FaClipboardList className="section-icon" />
                Gestión de Pedidos
              </h2>
              <p>Visualiza y administra todos los pedidos del sistema.</p>
            </div>

            {/* Buscador de pedidos */}
            <div className="search-wrapper">
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por número de pedido o cliente"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Loading */}
            {pedidosLoading && (
              <div className="loading-indicator">
                <FaSpinner className="loading-spinner" />
                <span>Cargando pedidos...</span>
              </div>
            )}

            {/* Tabla de pedidos */}
            <div className="table-wrapper">
              <table className="pedidos-table">
                <thead>
                  <tr>
                    <th>N° Pedido</th>
                    <th>Cliente</th>
                    <th>Dirección</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPedidos.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-products">
                        {searchTerm
                          ? "No se encontraron pedidos con ese criterio."
                          : "No hay pedidos registrados."}
                      </td>
                    </tr>
                  ) : (
                    filteredPedidos.map((pedido) => (
                      <tr key={pedido.idpedido}>
                        <td className="pedido-numero">{pedido.numero}</td>
                        <td className="pedido-cliente">{pedido.cliente}</td>
                        <td className="pedido-direccion">
                          <span title={pedido.direccion}>
                            {pedido.direccion &&
                            pedido.direccion.length > 30
                              ? `${pedido.direccion.substring(0, 30)}...`
                              : pedido.direccion || "Sin dirección"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={getEstadoBadgeClass(pedido.estado)}
                          >
                            {pedido.estado}
                          </span>
                        </td>
                        <td className="pedido-total">
                          $
                          {Number(pedido.total || 0).toLocaleString("es-CO")}
                        </td>
                        <td className="pedido-fecha">{pedido.fecha}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn--view"
                              title="Ver detalles"
                              onClick={() => handleVerPedido(pedido.idpedido)}
                            >
                              <FaEye className="btn-icon" />
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentSection === "dashboard" && <Dashboard />}
      </main>

      {/* MODAL CREAR / EDITAR PRODUCTO CON 4 IMÁGENES */}
      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h3>
              {editingProduct ? (
                <>
                  <FaEdit className="modal-icon" /> Editar Producto
                </>
              ) : (
                <>
                  <FaPlus className="modal-icon" /> Agregar Producto
                </>
              )}
            </h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="nombre"
                placeholder="Nombre del producto"
                value={formData.nombre}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="number"
                name="precio"
                placeholder="Precio"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="number"
                name="stock"
                placeholder="Stock disponible"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <textarea
                name="descripcion"
                placeholder="Descripción del producto"
                value={formData.descripcion}
                onChange={handleChange}
                rows="3"
                disabled={loading}
              />

              {/* 🔹 Categoría por nombre, con autocompletado */}
              <input
                type="text"
                name="categoriaNombre"
                list="categoria-options"
                placeholder="Categoría"
                value={formData.categoriaNombre}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <datalist id="categoria-options">
                {categorias.map((cat) => (
                  <option
                    key={cat.idcategoria}
                    value={
                      cat.descripcionCategoria ||
                      cat.descripionCategoria ||
                      cat.descripcion
                    }
                  />
                ))}
              </datalist>

              {/* 🔹 Marca por nombre, con autocompletado */}
              <input
                type="text"
                name="marcaNombre"
                list="marca-options"
                placeholder="Marca (opcional)"
                value={formData.marcaNombre}
                onChange={handleChange}
                disabled={loading}
              />
              <datalist id="marca-options">
                {marcas.map((mar) => (
                  <option
                    key={mar.idmarca}
                    value={mar.descripcionMarca || mar.descripcion}
                  />
                ))}
              </datalist>

              {/* SECCIÓN DE 4 IMÁGENES */}
              <div className="image-upload-section">
                <h4>
                  <FaImage className="section-icon" />
                  Imágenes del Producto (máximo 4)
                </h4>
                <p className="image-upload-info">
                  Puedes subir hasta 4 imágenes. La primera imagen será la
                  principal.
                </p>
                <div className="image-grid">
                  {[0, 1, 2, 3].map((index) => (
                    <div
                      key={index}
                      className={`image-upload-item ${
                        formData.imagenes && formData.imagenes[index]
                          ? "has-image"
                          : ""
                      }`}
                    >
                      {formData.imagenes && formData.imagenes[index] ? (
                        <>
                          <img
                            src={URL.createObjectURL(
                              formData.imagenes[index]
                            )}
                            alt={`Vista ${index + 1}`}
                            className="image-preview"
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeImage(index)}
                            disabled={loading}
                          >
                            <FaTimes />
                          </button>
                        </>
                      ) : (
                        <div className="image-upload-placeholder">
                          <FaImage className="placeholder-icon" />
                          <span>Imagen {index + 1}</span>
                        </div>
                      )}
                      <input
                        type="file"
                        className="image-upload-input"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, index)}
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn--add"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="btn-icon spinning" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaSave className="btn-icon" />
                      {editingProduct ? "Actualizar" : "Guardar"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn--delete"
                  onClick={() => {
                    setModalVisible(false);
                    setEditingProduct(null);
                  }}
                  disabled={loading}
                >
                  <FaTimes className="btn-icon" />
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE PEDIDO */}
      {showPedidoModal && selectedPedido && (
        <div className="modal">
          <div className="modal-content pedido-modal">
            <h3>
              <FaClipboardList className="modal-icon" />
              Detalle del Pedido {selectedPedido.numero}
            </h3>

            <div className="pedido-detalle-grid">
              <div className="pedido-detalle-col">
                <h4>Cliente</h4>
                <p><strong>Nombre:</strong> {selectedPedido.cliente}</p>
                <p><strong>Correo:</strong> {selectedPedido.correo || "N/D"}</p>
                <p><strong>Teléfono:</strong> {selectedPedido.telefono || "N/D"}</p>
              </div>
              <div className="pedido-detalle-col">
                <h4>Envío</h4>
                <p><strong>Dirección:</strong> {selectedPedido.direccion || "Sin dirección"}</p>
                <p><strong>Ciudad:</strong> {selectedPedido.ciudad || "N/D"}</p>
                <p><strong>Fecha:</strong> {selectedPedido.fecha}</p>
              </div>
              <div className="pedido-detalle-col">
                <h4>Resumen</h4>
                <p>
                  <strong>Total:</strong>{" "}
                  ${Number(selectedPedido.total || 0).toLocaleString("es-CO")}
                </p>
                <p>
                  <strong>Estado actual:</strong>{" "}
                  <span className={getEstadoBadgeClass(selectedPedido.estado)}>
                    {selectedPedido.estado}
                  </span>
                </p>
                <div className="estado-selector">
                  <label htmlFor="estadoPedido">
                    Cambiar estado:
                  </label>
                  <select
                    id="estadoPedido"
                    value={estadoEditando}
                    onChange={(e) => setEstadoEditando(e.target.value)}
                    disabled={pedidosLoading}
                  >
                    <option value="">Selecciona un estado</option>
                    {ESTADOS_PEDIDO.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn--add"
                onClick={handleGuardarEstadoPedido}
                disabled={pedidosLoading}
              >
                {pedidosLoading ? (
                  <>
                    <FaSpinner className="btn-icon spinning" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaSave className="btn-icon" />
                    Guardar cambios
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn--delete"
                onClick={() => {
                  setShowPedidoModal(false);
                  setSelectedPedido(null);
                }}
                disabled={pedidosLoading}
              >
                <FaTimes className="btn-icon" />
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAdmin;