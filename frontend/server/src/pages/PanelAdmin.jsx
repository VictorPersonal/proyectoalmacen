import React, { useState, useEffect, useRef } from "react";
import "./PanelAdmin.css";
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
  FaShoppingBag
} from "react-icons/fa";

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
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const profileRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    stock: "",
    descripcion: "",
    idcategoria: "",
    idmarca: "",
    imagenes: [],
  });

  // ====== BLOQUEAR BOTÓN ATRÁS SOLO EN ADMIN ======
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

  // ====== CARGAR INFO ADMIN DESDE localStorage ======
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

  // ====== CERRAR SESIÓN ======
  const handleLogout = () => {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "¿Estás seguro de que deseas salir del panel de administración?",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, cerrar sesión',
      cancelButtonText: 'Cancelar',
      background: '#fff',
      color: '#333'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem("usuarioInfo");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setShowProfileMenu(false);
        
        Swal.fire({
          title: 'Sesión cerrada',
          text: 'Has cerrado sesión correctamente',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          window.location.href = "/";
        });
      }
    });
  };

  // ✅ Ir al menú / home SIN cerrar sesión
  const handleGoHome = () => {
    Swal.fire({
      title: 'Ir al inicio',
      text: '¿Deseas ir a la página principal?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, ir al inicio',
      cancelButtonText: 'Cancelar',
      background: '#fff',
      color: '#333'
    }).then((result) => {
      if (result.isConfirmed) {
        setShowProfileMenu(false);
        navigate("/");
      }
    });
  };

  // ====== CERRAR MENÚ DE PERFIL AL HACER CLICK AFUERA ======
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ====== TRAER PRODUCTOS ======
  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const res = await axios.get("http://localhost:4000/api/admin/productos", {
        withCredentials: true 
      });
      
      setProducts(res.data);
    } catch (err) {
      console.error(
        "Error al obtener productos:",
        err.response?.data || err.message
      );
      
      // Si falla por permisos (no es admin), mostrar mensaje específico
      if (err.response?.status === 403) {
        Swal.fire({
          title: 'Acceso denegado',
          text: 'No tienes permisos de administrador para ver todos los productos.',
          icon: 'error',
          confirmButtonText: 'Entendido'
        });
      } else if (err.response?.status === 401) {
        Swal.fire({
          title: 'Sesión expirada',
          text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          icon: 'warning',
          confirmButtonText: 'Entendido'
        }).then(() => {
          handleLogout();
        });
      } else {
        // Si hay otro error, intentar con el endpoint público
        try {
          console.log("⚠️ Intentando con endpoint público...");
          const resPublic = await axios.get("http://localhost:4000/api/productos", {
            withCredentials: true
          });
          setProducts(resPublic.data);
        } catch (fallbackErr) {
          Swal.fire({
            title: 'Error',
            text: 'No se pudieron cargar los productos',
            icon: 'error',
            confirmButtonText: 'Entendido'
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

  // ====== TRAER CATEGORÍAS ======
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/categorias");
        setCategorias(res.data);
      } catch (err) {
        console.error(
          "Error al obtener categorías:",
          err.response?.data || err.message
        );
      }
    };
    fetchCategorias();
  }, []);

  // cuando cambie el término de búsqueda, volver a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Manejar cambios de input del modal
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ====== MANEJAR CAMBIOS EN IMÁGENES MÚLTIPLES ======
  const handleImageChange = (e, index) => {
    const files = e.target.files;
    if (files && files[0]) {
      const newImages = [...(formData.imagenes || [])];
      newImages[index] = files[0];
      setFormData({ ...formData, imagenes: newImages });
    }
  };

  // ====== ELIMINAR IMAGEN SELECCIONADA ======
  const removeImage = (index) => {
    const newImages = [...(formData.imagenes || [])];
    newImages[index] = null;
    setFormData({ ...formData, imagenes: newImages });
  };

  // Búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ====== CREAR / EDITAR PRODUCTO ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const data = new FormData();
    
    // Agregar campos básicos
    data.append('nombre', formData.nombre);
    data.append('precio', formData.precio);
    data.append('stock', formData.stock);
    data.append('descripcion', formData.descripcion);
    data.append('idcategoria', formData.idcategoria);
    if (formData.idmarca) {
      data.append('idmarca', formData.idmarca);
    }
    
    // Agregar imágenes múltiples - usar el mismo nombre 'imagenes' para todas
    if (formData.imagenes) {
      formData.imagenes.forEach((imagen, index) => {
        if (imagen) {
          data.append('imagenes', imagen); // Mismo nombre para todas las imágenes
        }
      });
    }

    try {
      let response;
      if (editingProduct) {
        // Editar producto
        response = await axios.put(
          `http://localhost:4000/api/productos/${editingProduct.idproducto}/con-imagen`,
          data,
          { 
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000 // 30 segundos timeout para subida de imágenes
          }
        );
        
        Swal.fire({
          title: '¡Éxito!',
          text: `Producto actualizado ${response.data.message ? response.data.message.toLowerCase() : 'correctamente'}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Crear producto
        response = await axios.post(
          "http://localhost:4000/api/productos/con-imagen",
          data,
          { 
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 30000
          }
        );
        
        Swal.fire({
          title: '¡Producto Creado!',
          text: `Producto creado ${response.data.message ? response.data.message.toLowerCase() : 'correctamente'}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      // Recargar la lista de productos para mostrar las imágenes actualizadas
      await fetchProducts();

      setModalVisible(false);
      setEditingProduct(null);
      setFormData({
        nombre: "",
        precio: "",
        stock: "",
        descripcion: "",
        idcategoria: "",
        idmarca: "",
        imagenes: [],
      });
    } catch (err) {
      console.error(
        "Error al guardar producto:",
        err.response?.data || err.message
      );
      
      Swal.fire({
        title: 'Error',
        text: `Error al guardar producto: ${err.response?.data?.message || err.message}`,
        icon: 'error',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setLoading(false);
    }
  };

  // ====== PREPARAR EDICIÓN ======
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nombre: product.nombre,
      precio: product.precio,
      stock: product.stock,
      descripcion: product.descripcion || "",
      idcategoria: product.idcategoria,
      idmarca: product.idmarca || "",
      imagenes: [],
    });
    setModalVisible(true);
  };

  // ====== ACTIVAR / DESACTIVAR PRODUCTO ======
  const handleToggleActive = async (product) => {
    // si stock es 0 y está inactivo, no permitir activar
    if (product.stock === 0 && !product.activo) {
      Swal.fire({
        title: 'Stock insuficiente',
        text: 'Este producto no se puede activar porque su stock es 0.',
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const nuevoEstado = !product.activo;

    Swal.fire({
      title: `${nuevoEstado ? 'Activar' : 'Desactivar'} producto`,
      text: `¿Estás seguro de que deseas ${nuevoEstado ? 'activar' : 'desactivar'} "${product.nombre}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nuevoEstado ? '#28a745' : '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: nuevoEstado ? 'Sí, activar' : 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      background: '#fff',
      color: '#333'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          const res = await axios.patch(
            `http://localhost:4000/api/productos/${product.idproducto}/estado`,
            { activo: nuevoEstado }
          );
          
          await fetchProducts(); // Recargar productos después de cambiar estado
          
          Swal.fire({
            title: '¡Estado Actualizado!',
            text: `Producto ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`,
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        } catch (err) {
          console.error(
            "Error al cambiar estado del producto:",
            err.response?.data || err.message
          );
          
          Swal.fire({
            title: 'Error',
            text: 'Error al cambiar estado del producto',
            icon: 'error',
            confirmButtonText: 'Entendido'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ====== OBTENER PRIMERA IMAGEN DEL PRODUCTO ======
  const getPrimeraImagen = (product) => {
    // Verificar si hay imágenes en producto_imagen
    if (product.producto_imagen && product.producto_imagen.length > 0) {
      return product.producto_imagen[0].url;
    }
    // Si no hay imágenes, retornar null
    return null;
  };

  // ====== OBTENER TODAS LAS IMÁGENES DEL PRODUCTO ======
  const getTodasImagenes = (product) => {
    if (product.producto_imagen && product.producto_imagen.length > 0) {
      return product.producto_imagen.map(img => img.url);
    }
    return [];
  };

  // ====== CONTAR IMÁGENES DEL PRODUCTO ======
  const contarImagenes = (product) => {
    if (product.producto_imagen && product.producto_imagen.length > 0) {
      return product.producto_imagen.length;
    }
    return 0;
  };

  // ====== VERIFICAR SI EL PRODUCTO TIENE IMÁGENES ======
  const tieneImagenes = (product) => {
    return product.producto_imagen && product.producto_imagen.length > 0;
  };

  // ====== helpers ======
  const getNombreCategoria = (id) => {
    const cat = categorias.find(
      (c) => String(c.idcategoria) === String(id)
    );
    return cat ? cat.descripcion : id;
  };

  const filteredProducts = products.filter((prod) =>
    prod.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación
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

  // ====== PAGINACIÓN CON TECLADO (← →) ======
  useEffect(() => {
    if (currentSection !== "productos") return;

    const handleKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();

      // Si el usuario está escribiendo en un input/textarea/select → NO paginar
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

  // Limpiar URLs de objetos cuando el modal se cierra
  useEffect(() => {
    return () => {
      if (formData.imagenes) {
        formData.imagenes.forEach(img => {
          if (img && typeof img === 'object') {
            URL.revokeObjectURL(URL.createObjectURL(img));
          }
        });
      }
    };
  }, [modalVisible]);

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
              Puedes agregar hasta 4 imágenes por producto, editar información 
              y activar/desactivar productos según la disponibilidad de stock.
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
          <button className="help-btn" onClick={() => setShowHelp(true)}>
            <FaQuestionCircle size={18} />
          </button>
        </div>

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
                    idcategoria: "",
                    idmarca: "",
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
                        {searchTerm ? 'No se encontraron productos' : 'No hay productos'}
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
                              style={{objectFit: 'cover', borderRadius: '4px'}}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
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
                        <td>{getNombreCategoria(prod.idcategoria)}</td>
                        <td>
                          <span className={`image-count ${contarImagenes(prod) === 0 ? 'no-images' : ''}`}>
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
                            {prod.activo ? 
                              <><FaEye className="status-icon" /> Activo</> : 
                              <><FaEyeSlash className="status-icon" /> Inactivo</>
                            }
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
                              disabled={(prod.stock === 0 && !prod.activo) || loading}
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

        {currentSection === "dashboard" && <Dashboard />}
      </main>

      {/* MODAL CREAR / EDITAR CON 4 IMÁGENES */}
      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h3>
              {editingProduct ? 
                <><FaEdit className="modal-icon" /> Editar Producto</> : 
                <><FaPlus className="modal-icon" /> Agregar Producto</>
              }
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
                type="number"
                name="idcategoria"
                placeholder="ID Categoría"
                min="1"
                value={formData.idcategoria}
                onChange={handleChange}
                required
                disabled={loading}
              />
              <input
                type="number"
                name="idmarca"
                placeholder="ID Marca (opcional)"
                min="1"
                value={formData.idmarca}
                onChange={handleChange}
                disabled={loading}
              />
              
              {/* SECCIÓN DE 4 IMÁGENES */}
              <div className="image-upload-section">
                <h4>
                  <FaImage className="section-icon" />
                  Imágenes del Producto (máximo 4)
                </h4>
                <p className="image-upload-info">
                  Puedes subir hasta 4 imágenes. La primera imagen será la principal.
                </p>
                <div className="image-grid">
                  {[0, 1, 2, 3].map((index) => (
                    <div 
                      key={index} 
                      className={`image-upload-item ${
                        formData.imagenes && formData.imagenes[index] ? 'has-image' : ''
                      }`}
                    >
                      {formData.imagenes && formData.imagenes[index] ? (
                        <>
                          <img 
                            src={URL.createObjectURL(formData.imagenes[index])} 
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
                      {editingProduct ? 'Actualizar' : 'Guardar'}
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
    </div>
  );
};

export default PanelAdmin;