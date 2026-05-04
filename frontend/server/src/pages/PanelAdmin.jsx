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
  FaTags,
  FaTrash,
} from "react-icons/fa";

const ESTADOS_PEDIDO = [
  "Pendiente",
  "Pagado",
  "En camino",
  "Entregado",
  "Cancelado",
];

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

  // Procesamiento de imágenes
  const [processingImages, setProcessingImages] = useState([
    false,
    false,
    false,
    false,
  ]);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);

  // Pedidos
  const [pedidos, setPedidos] = useState([]);
  const [pedidosLoading, setPedidosLoading] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [estadoEditando, setEstadoEditando] = useState("");
  const [showPedidoModal, setShowPedidoModal] = useState(false);

  // Notificaciones
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Promociones
  const [promociones, setPromociones] = useState([]);
  const [promoModalVisible, setPromoModalVisible] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const [promoForm, setPromoForm] = useState({
    nombre: "",
    descripcion: "",
    valor_descuento: "",
    scope: "global",
    idproducto: "",
    idcategoria: "",
    fecha_inicio: "",
    fecha_fin: "",
    activo_manual: true,
  });

  const navigate = useNavigate();
  const profileRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    stock: "",
    descripcion: "",
    categoriaNombre: "",
    marcaNombre: "",
    imagenes: [],
  });

  const [, setPromoClock] = useState(Date.now());

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

  /* =========================================================
     HELPERS IMÁGENES
  ========================================================= */
  const resetProcessingImages = () => {
    setProcessingImages([false, false, false, false]);
  };

  const fileFromBlob = (blob, originalName = "imagen") => {
    const safeName = originalName.replace(/\.[^/.]+$/, "");
    return new File([blob], `${safeName}-sin-fondo.png`, {
      type: "image/png",
    });
  };

  const removeBackgroundFromImage = async (file) => {
    const data = new FormData();
    data.append("image", file);

    const response = await axios.post(
      "http://localhost:4000/api/images/remove-background",
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
        responseType: "blob",
        timeout: 60000,
        withCredentials: true,
      }
    );

    return fileFromBlob(response.data, file.name);
  };

  const previewImage = (file) => {
    if (!file) return null;
    return URL.createObjectURL(file);
  };


  useEffect(() => {
    if (currentSection !== "promociones") return;

    const interval = setInterval(() => {
      setPromoClock(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSection]);

  /* =========================================================
     HELPERS PROMOCIONES
  ========================================================= */
  const formatDateTimeLocal = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const resetPromoForm = () => {
    setPromoForm({
      nombre: "",
      descripcion: "",
      valor_descuento: "",
      scope: "global",
      idproducto: "",
      idcategoria: "",
      fecha_inicio: "",
      fecha_fin: "",
      activo_manual: true,
    });
  };

  const handlePromoChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPromoForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /* =========================================================
     NOTIFICACIONES
  ========================================================= */
  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);

      const res = await axios.get("http://localhost:4000/api/admin/pedidos", {
        withCredentials: true,
      });

      const pedidosData = res.data || [];
      const pendientes = pedidosData.filter((p) => p.estado === "Pendiente");

      setNotifications(pendientes);
    } catch (err) {
      console.error(
        "Error al obtener notificaciones:",
        err.response?.data || err.message
      );
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

      const res = await axios.get(
        "http://localhost:4000/api/productosAdmin/admin/productos",
        {
          withCredentials: true,
        }
      );

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
          const resPublic = await axios.get(
            "http://localhost:4000/api/productos",
            {
              withCredentials: true,
            }
          );
          setProducts(resPublic.data);
        } catch {
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
     TRAER CATEGORÍAS Y MARCAS
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

  /* =========================================================
     TRAER PROMOCIONES
  ========================================================= */
  const fetchPromociones = async () => {
    try {
      setPromoLoading(true);
      const res = await axios.get("http://localhost:4000/api/promociones", {
        withCredentials: true,
      });
      setPromociones(res.data || []);
    } catch (err) {
      console.error("Error promociones:", err.response?.data || err.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar las promociones",
      });
    } finally {
      setPromoLoading(false);
    }
  };

  useEffect(() => {
    if (currentSection === "promociones") {
      fetchPromociones();
    }
  }, [currentSection]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
     IMÁGENES MÚLTIPLES + REMOVE BACKGROUND
  ========================================================= */
  const handleImageChange = async (e, index) => {
    const files = e.target.files;
    if (!files || !files[0]) return;

    const selectedFile = files[0];

    try {
      const updatedProcessing = [...processingImages];
      updatedProcessing[index] = true;
      setProcessingImages(updatedProcessing);

      let finalFile = selectedFile;

      if (autoRemoveBg) {
        finalFile = await removeBackgroundFromImage(selectedFile);

        Swal.fire({
          title: "Imagen procesada",
          text: `Se quitó el fondo de la imagen ${index + 1}`,
          icon: "success",
          timer: 1400,
          showConfirmButton: false,
        });
      }

      const newImages = [...(formData.imagenes || [])];
      newImages[index] = finalFile;

      setFormData((prev) => ({
        ...prev,
        imagenes: newImages,
      }));
    } catch (err) {
      console.error(
        "Error al procesar imagen:",
        err.response?.data || err.message
      );

      Swal.fire({
        title: "Error",
        text: "No se pudo quitar el fondo. Se usará la imagen original.",
        icon: "warning",
        confirmButtonText: "Entendido",
      });

      const newImages = [...(formData.imagenes || [])];
      newImages[index] = selectedFile;

      setFormData((prev) => ({
        ...prev,
        imagenes: newImages,
      }));
    } finally {
      const updatedProcessing = [...processingImages];
      updatedProcessing[index] = false;
      setProcessingImages(updatedProcessing);
    }
  };

  const removeImage = (index) => {
    const newImages = [...(formData.imagenes || [])];
    newImages[index] = null;
    setFormData((prev) => ({ ...prev, imagenes: newImages }));
  };

  /* =========================================================
     BÚSQUEDA
  ========================================================= */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  /* =========================================================
     HELPERS CATEGORÍA / MARCA
  ========================================================= */
  const getNombreCategoria = (productOrId) => {
    if (productOrId && typeof productOrId === "object") {
      const p = productOrId;
      if (p.descripcionCategoria) return p.descripcionCategoria;

      const id = p.idcategoria;
      const cat = categorias.find((c) => String(c.idcategoria) === String(id));
      return cat ? cat.descripcionCategoria : id;
    }

    const id = productOrId;
    const cat = categorias.find((c) => String(c.idcategoria) === String(id));
    return cat ? cat.descripcionCategoria : id;
  };

  const getNombreMarca = (productOrId) => {
    if (productOrId && typeof productOrId === "object") {
      const p = productOrId;
      if (p.descripcionMarca) return p.descripcionMarca;

      const id = p.idmarca;
      if (!id) return "";

      const m = marcas.find((mar) => String(mar.idmarca) === String(id));
      return m ? m.descripcionMarca : String(id);
    }

    const id = productOrId;
    if (!id) return "";

    const m = marcas.find((mar) => String(mar.idmarca) === String(id));
    return m ? m.descripcionMarca : String(id);
  };

  const obtenerOCrearCategoria = async (nombreCategoria) => {
    const nombre = (nombreCategoria || "").trim();
    if (!nombre) return null;

    const existente = categorias.find((c) => {
      const desc =
        c.descripcionCategoria ||
        c.descripionCategoria ||
        c.descripcion ||
        "";
      return desc.toLowerCase() === nombre.toLowerCase();
    });

    if (existente) return existente.idcategoria;

    const res = await axios.post("http://localhost:4000/api/categorias", {
      descripcionCategoria: nombre,
    });

    const nueva = res.data;
    setCategorias((prev) => [...prev, nueva]);
    return nueva.idcategoria;
  };

  const obtenerOCrearMarca = async (nombreMarca) => {
    const nombre = (nombreMarca || "").trim();
    if (!nombre) return null;

    const existente = marcas.find((m) => {
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
            withCredentials: true,
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
            withCredentials: true,
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
      resetProcessingImages();
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
     PREPARAR EDICIÓN PRODUCTO
  ========================================================= */
  const handleEdit = (product) => {
    setEditingProduct(product);
    resetProcessingImages();
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
     HELPERS PRODUCTO
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
     CRUD PROMOCIONES
  ========================================================= */
  const handleSavePromo = async () => {
    const descuento = Number(promoForm.valor_descuento);

    if (!promoForm.nombre.trim()) {
      Swal.fire("Error", "El nombre es obligatorio", "error");
      return;
    }

    if (!promoForm.valor_descuento) {
      Swal.fire("Error", "Debes ingresar el descuento", "error");
      return;
    }

    if (!promoForm.fecha_inicio || !promoForm.fecha_fin) {
      Swal.fire("Error", "Debes ingresar fecha de inicio y fin", "error");
      return;
    }

    if (promoForm.scope === "producto" && !promoForm.idproducto) {
      Swal.fire("Error", "Debes seleccionar un producto", "error");
      return;
    }

    if (promoForm.scope === "categoria" && !promoForm.idcategoria) {
      Swal.fire("Error", "Debes seleccionar una categoría", "error");
      return;
    }

    if (descuento > 50) {
      const confirm = await Swal.fire({
        title: "Descuento alto",
        text: `Estás aplicando ${descuento}% de descuento. ¿Seguro que deseas continuar?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí aplicar",
        cancelButtonText: "Cancelar",
      });

      if (!confirm.isConfirmed) return;
    }

    try {
      setPromoLoading(true);

      const payload = {
        nombre: promoForm.nombre,
        descripcion: promoForm.descripcion,
        valor_descuento: Number(promoForm.valor_descuento),
        scope: promoForm.scope,
        idproducto:
          promoForm.scope === "producto" && promoForm.idproducto
            ? Number(promoForm.idproducto)
            : null,
        idcategoria:
          promoForm.scope === "categoria" && promoForm.idcategoria
            ? Number(promoForm.idcategoria)
            : null,
        fecha_inicio: promoForm.fecha_inicio,
        fecha_fin: promoForm.fecha_fin,
        activo_manual: promoForm.activo_manual,
      };

      if (editingPromo) {
        await axios.put(
          `http://localhost:4000/api/promociones/${editingPromo.idpromocion}`,
          payload,
          { withCredentials: true }
        );
      } else {
        await axios.post("http://localhost:4000/api/promociones", payload, {
          withCredentials: true,
        });
      }

      Swal.fire("Éxito", "Promoción guardada correctamente", "success");

      setPromoModalVisible(false);
      setEditingPromo(null);
      resetPromoForm();
      fetchPromociones();
    } catch (err) {
      console.error("Error guardando promoción:", err.response?.data || err);

      const mensaje =
        err.response?.data?.errores?.join(" | ") ||
        err.response?.data?.message ||
        "No se pudo guardar la promoción";

      Swal.fire("Error", mensaje, "error");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleEditPromo = (promo) => {
    setEditingPromo(promo);
    setPromoForm({
      nombre: promo.nombre || "",
      descripcion: promo.descripcion || "",
      valor_descuento: promo.valor_descuento || "",
      scope: promo.scope || "global",
      idproducto: promo.idproducto || "",
      idcategoria: promo.idcategoria || "",
      fecha_inicio: formatDateTimeLocal(promo.fecha_inicio),
      fecha_fin: formatDateTimeLocal(promo.fecha_fin),
      activo_manual:
        promo.activo_manual === undefined ? true : promo.activo_manual,
    });
    setPromoModalVisible(true);
  };

  const togglePromoEstado = async (promo) => {
    try {
      await axios.patch(
        `http://localhost:4000/api/promociones/${promo.idpromocion}/estado`,
        { activo_manual: !promo.activo_manual },
        { withCredentials: true }
      );

      Swal.fire({
        title: "Actualizado",
        text: `Promoción ${
          promo.activo_manual ? "desactivada" : "activada"
        } correctamente`,
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
      });

      fetchPromociones();
    } catch (err) {
      console.error("Error al actualizar promoción:", err);
      Swal.fire("Error", "No se pudo actualizar la promoción", "error");
    }
  };

  const deletePromo = async (promo) => {
    const confirm = await Swal.fire({
      title: "Eliminar promoción",
      text: `¿Deseas eliminar "${promo.nombre}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(
        `http://localhost:4000/api/promociones/${promo.idpromocion}`,
        { withCredentials: true }
      );

      Swal.fire({
        title: "Eliminada",
        text: "La promoción fue eliminada correctamente",
        icon: "success",
        timer: 1400,
        showConfirmButton: false,
      });

      fetchPromociones();
    } catch (err) {
      console.error("Error eliminando promoción:", err);
      Swal.fire("Error", "No se pudo eliminar la promoción", "error");
    }
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
     FILTRO PROMOCIONES
  ========================================================= */
  const filteredPromociones = promociones.filter((promo) =>
    promo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* =========================================================
     PAGINACIÓN CON TECLADO
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
     PEDIDOS
  ========================================================= */
  const fetchPedidos = async () => {
    try {
      setPedidosLoading(true);
      const res = await axios.get("http://localhost:4000/api/admin/pedidos", {
        withCredentials: true,
      });
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

  useEffect(() => {
    if (currentSection === "pedidos" && pedidos.length === 0) {
      fetchPedidos();
    }
  }, [currentSection, pedidos.length]);

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

  const getPromoEstadoReal = (promo) => {
    const ahora = new Date();
    const inicio = new Date(promo.fecha_inicio);
    const fin = new Date(promo.fecha_fin);

    if (!promo.activo_manual) {
      return { texto: "Desactivada", clase: "status-inactive" };
    }

    if (ahora < inicio) {
      return { texto: "Programada", clase: "status-pending" };
    }

    if (ahora >= inicio && ahora <= fin) {
      return { texto: "Activa ahora", clase: "status-active" };
    }

    return { texto: "Vencida", clase: "status-expired" };
  };

  const getPromoCountdown = (promo) => {
    const ahora = new Date();
    const inicio = new Date(promo.fecha_inicio);
    const fin = new Date(promo.fecha_fin);

    let diff = 0;
    let texto = "";

    if (!promo.activo_manual) return "Desactivada";

    if (ahora < inicio) {
      diff = inicio - ahora;
      texto = "Empieza en";
    } else if (ahora >= inicio && ahora <= fin) {
      diff = fin - ahora;
      texto = "Termina en";
    } else {
      return "Finalizada";
    }

    const s = Math.floor(diff / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");

    return `${texto} ${h}:${m}:${sec}`;
  };

  return (
    <div className="admin-panel">
      <aside className="sidebar">
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
              currentSection === "promociones" ? "active" : ""
            }`}
            onClick={() => setCurrentSection("promociones")}
          >
            <FaTags className="nav-icon" />
            Promociones
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

      {showHelp && (
        <div className="modal">
          <div className="modal-content help-modal">
            <h3>
              <FaQuestionCircle className="help-icon" />
              Ayuda del Administrador
            </h3>
            <p>
              Desde aquí puedes gestionar productos, pedidos y promociones.
              También puedes programar descuentos por porcentaje con fecha de
              inicio y fin.
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
          <button
            className="notif-btn"
            onClick={toggleNotifications}
            title="Notificaciones"
          >
            <FaBell size={18} />
            {notifications.length > 0 && (
              <span className="notif-badge">{notifications.length}</span>
            )}
          </button>

          <button className="help-btn" onClick={() => setShowHelp(true)}>
            <FaQuestionCircle size={18} />
          </button>
        </div>

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
              <p className="notifications-empty">No hay pedidos pendientes.</p>
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
                      <span className="notification-date">{pedido.fecha}</span>
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

        {currentSection === "productos" && (
          <>
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
                  resetProcessingImages();
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

            {loading && (
              <div className="loading-indicator">
                <FaSpinner className="loading-spinner" />
                <span>Cargando...</span>
              </div>
            )}

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

        {currentSection === "pedidos" && (
          <div className="pedidos-section">
            <div className="section-header">
              <h2>
                <FaClipboardList className="section-icon" />
                Gestión de Pedidos
              </h2>
              <p>Visualiza y administra todos los pedidos del sistema.</p>
            </div>

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

            {pedidosLoading && (
              <div className="loading-indicator">
                <FaSpinner className="loading-spinner" />
                <span>Cargando pedidos...</span>
              </div>
            )}

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
                          <span className={getEstadoBadgeClass(pedido.estado)}>
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

        {currentSection === "promociones" && (
          <div className="promos-section">
            <div className="section-header">
              <h2>
                <FaTags className="section-icon" />
                Gestión de Promociones
              </h2>
              <p>Programa descuentos por producto, categoría o globales.</p>
            </div>

            <div className="search-wrapper">
              <div className="search-container">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar promoción"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              <button
                className="btn btn--add-secondary"
                onClick={() => {
                  setEditingPromo(null);
                  resetPromoForm();
                  setPromoModalVisible(true);
                }}
                disabled={promoLoading}
              >
                <FaPlus className="btn-icon" />
                Nueva promoción
              </button>
            </div>

            {promoLoading && (
              <div className="loading-indicator">
                <FaSpinner className="loading-spinner" />
                <span>Cargando promociones...</span>
              </div>
            )}

            <div className="table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descuento</th>
                    <th>Scope</th>
                    <th>Estado real</th>
                    <th>Tiempo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPromociones.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="no-products">
                        {searchTerm
                          ? "No se encontraron promociones"
                          : "No hay promociones registradas"}
                      </td>
                    </tr>
                  ) : (
                    filteredPromociones.map((promo) => (
                      <tr key={promo.idpromocion}>
                        <td>{promo.idpromocion}</td>
                        <td>{promo.nombre}</td>
                        <td>{promo.valor_descuento}%</td>
                        <td>{promo.scope}</td>


                        <td>
                          {(() => {
                            const estado = getPromoEstadoReal(promo);
                            return <span className={estado.clase}>{estado.texto}</span>;
                          })()}
                        </td>

                        <td>{getPromoCountdown(promo)}</td>

                        <td>
                          <div className="action-buttons">
                            <button className="btn btn--edit" onClick={() => handleEditPromo(promo)}>
                              <FaEdit className="btn-icon" />
                              Editar
                            </button>

                            <button
                              className={`btn btn--status ${
                                promo.activo_manual ? "btn--inactive" : "btn--add"
                              }`}
                              onClick={() => togglePromoEstado(promo)}
                            >
                              {promo.activo_manual ? "Desactivar" : "Activar"}
                            </button>

                            <button className="btn btn--delete" onClick={() => deletePromo(promo)}>
                              <FaTrash className="btn-icon" />
                              Eliminar
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

              <div className="image-upload-section">
                <h4>
                  <FaImage className="section-icon" />
                  Imágenes del Producto (máximo 4)
                </h4>

                <p className="image-upload-info">
                  Puedes subir hasta 4 imágenes. La primera imagen será la
                  principal.
                </p>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "12px",
                    fontSize: "14px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoRemoveBg}
                    onChange={(e) => setAutoRemoveBg(e.target.checked)}
                    disabled={loading}
                  />
                  Quitar fondo automáticamente al subir imagen
                </label>

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
                      {processingImages[index] && (
                        <div className="image-processing-overlay">
                          <FaSpinner className="loading-spinner spinning" />
                          <span>Procesando...</span>
                        </div>
                      )}

                      {formData.imagenes && formData.imagenes[index] ? (
                        <>
                          <img
                            src={previewImage(formData.imagenes[index])}
                            alt={`Vista ${index + 1}`}
                            className="image-preview"
                          />
                          <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => removeImage(index)}
                            disabled={loading || processingImages[index]}
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
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(e) => handleImageChange(e, index)}
                        disabled={loading || processingImages[index]}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="btn btn--add"
                  disabled={loading || processingImages.some(Boolean)}
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
                    resetProcessingImages();
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

      {promoModalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h3>
              {editingPromo ? (
                <>
                  <FaEdit className="modal-icon" /> Editar Promoción
                </>
              ) : (
                <>
                  <FaPlus className="modal-icon" /> Nueva Promoción
                </>
              )}
            </h3>

            <input
              type="text"
              name="nombre"
              placeholder="Nombre de la promoción"
              value={promoForm.nombre}
              onChange={handlePromoChange}
              disabled={promoLoading}
            />

            <textarea
              name="descripcion"
              placeholder="Descripción"
              value={promoForm.descripcion}
              onChange={handlePromoChange}
              rows="3"
              disabled={promoLoading}
            />

            <input
              type="number"
              name="valor_descuento"
              placeholder="Descuento (%)"
              min="1"
              max="90"
              value={promoForm.valor_descuento}
              onChange={handlePromoChange}
              disabled={promoLoading}
            />

            <select
              name="scope"
              value={promoForm.scope}
              onChange={handlePromoChange}
              disabled={promoLoading}
            >
              <option value="global">Global</option>
              <option value="producto">Producto</option>
              <option value="categoria">Categoría</option>
            </select>

            {promoForm.scope === "producto" && (
              <select
                name="idproducto"
                value={promoForm.idproducto}
                onChange={handlePromoChange}
                disabled={promoLoading}
              >
                <option value="">Selecciona un producto</option>
                {products.map((prod) => (
                  <option key={prod.idproducto} value={prod.idproducto}>
                    {prod.nombre}
                  </option>
                ))}
              </select>
            )}

            {promoForm.scope === "categoria" && (
              <select
                name="idcategoria"
                value={promoForm.idcategoria}
                onChange={handlePromoChange}
                disabled={promoLoading}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.idcategoria} value={cat.idcategoria}>
                    {cat.descripcionCategoria || cat.descripcion}
                  </option>
                ))}
              </select>
            )}

            <label style={{ marginTop: "8px", fontWeight: "600" }}>
              Fecha y hora de inicio
            </label>
            <input
              type="datetime-local"
              name="fecha_inicio"
              value={promoForm.fecha_inicio}
              onChange={handlePromoChange}
              disabled={promoLoading}
            />

            <label style={{ marginTop: "8px", fontWeight: "600" }}>
              Fecha y hora de fin
            </label>
            <input
              type="datetime-local"
              name="fecha_fin"
              value={promoForm.fecha_fin}
              onChange={handlePromoChange}
              disabled={promoLoading}
            />

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "10px",
              }}
            >
              <input
                type="checkbox"
                name="activo_manual"
                checked={promoForm.activo_manual}
                onChange={handlePromoChange}
                disabled={promoLoading}
              />
              Activar promoción manualmente
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn--add"
                onClick={handleSavePromo}
                disabled={promoLoading}
              >
                {promoLoading ? (
                  <>
                    <FaSpinner className="btn-icon spinning" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaSave className="btn-icon" />
                    Guardar
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn--delete"
                onClick={() => {
                  setPromoModalVisible(false);
                  setEditingPromo(null);
                  resetPromoForm();
                }}
                disabled={promoLoading}
              >
                <FaTimes className="btn-icon" />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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
                <p>
                  <strong>Nombre:</strong> {selectedPedido.cliente}
                </p>
                <p>
                  <strong>Correo:</strong> {selectedPedido.correo || "N/D"}
                </p>
                <p>
                  <strong>Teléfono:</strong> {selectedPedido.telefono || "N/D"}
                </p>
              </div>

              <div className="pedido-detalle-col">
                <h4>Envío</h4>
                <p>
                  <strong>Dirección:</strong>{" "}
                  {selectedPedido.direccion || "Sin dirección"}
                </p>
                <p>
                  <strong>Ciudad:</strong> {selectedPedido.ciudad || "N/D"}
                </p>
                <p>
                  <strong>Fecha:</strong> {selectedPedido.fecha}
                </p>
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
                  <label htmlFor="estadoPedido">Cambiar estado:</label>
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