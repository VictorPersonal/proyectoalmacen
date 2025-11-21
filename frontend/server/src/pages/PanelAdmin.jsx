import React, { useState, useEffect, useRef } from "react";
import "./PanelAdmin.css";
import Dashboard from "../components/dashboard";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

  const navigate = useNavigate();
  const profileRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    stock: "",
    descripcion: "",
    idcategoria: "",
    idmarca: "",
    imagen: null,
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
    localStorage.removeItem("usuarioInfo");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setShowProfileMenu(false);
    window.location.href = "/"; // redirigir al home
  };

  // ✅ Ir al menú / home SIN cerrar sesión
  const handleGoHome = () => {
    setShowProfileMenu(false);
    navigate("/"); // solo navega, mantiene la sesión
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
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("https://backend-tpeu.onrender.com//api/productos");
        setProducts(res.data);
      } catch (err) {
        console.error(
          "Error al obtener productos:",
          err.response?.data || err.message
        );
      }
    };
    fetchProducts();
  }, []);

  // ====== TRAER CATEGORÍAS ======
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get("https://backend-tpeu.onrender.com//api/categorias");
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
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ====== CREAR / EDITAR PRODUCTO ======
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    for (const key in formData) {
      if (formData[key]) data.append(key, formData[key]);
    }

    try {
      if (editingProduct) {
        // Editar producto
        const res = await axios.put(
          `https://backend-tpeu.onrender.com//api/productos/${editingProduct.idproducto}/con-imagen`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        const actualizado = res.data.producto || res.data;
        setProducts((prev) =>
          prev.map((p) =>
            p.idproducto === editingProduct.idproducto
              ? { ...p, ...actualizado }
              : p
          )
        );
        setEditingProduct(null);
      } else {
        // Crear producto (activo por defecto en la BD)
        const res = await axios.post(
          "https://backend-tpeu.onrender.com//api/productos/con-imagen",
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        const nuevo = res.data.producto || res.data;
        setProducts((prev) => [...prev, nuevo]);
      }

      setModalVisible(false);
      setFormData({
        nombre: "",
        precio: "",
        stock: "",
        descripcion: "",
        idcategoria: "",
        idmarca: "",
        imagen: null,
      });
    } catch (err) {
      console.error(
        "Error al guardar producto:",
        err.response?.data || err.message
      );
      alert("Error al guardar producto");
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
      imagen: null,
    });
    setModalVisible(true);
  };

  // ====== ACTIVAR / DESACTIVAR PRODUCTO ======
  const handleToggleActive = async (product) => {
    // si stock es 0 y está inactivo, no permitir activar
    if (product.stock === 0 && !product.activo) {
      alert("Este producto no se puede activar porque su stock es 0.");
      return;
    }

    const nuevoEstado = !product.activo;

    try {
      const res = await axios.patch(
        `https://backend-tpeu.onrender.com//api/productos/${product.idproducto}/estado`,
        { activo: nuevoEstado }
      );
      const actualizado = res.data.producto || res.data;

      setProducts((prev) =>
        prev.map((p) =>
          p.idproducto === product.idproducto
            ? { ...p, activo: actualizado.activo }
            : p
        )
      );
    } catch (err) {
      console.error(
        "Error al cambiar estado del producto:",
        err.response?.data || err.message
      );
      alert("Error al cambiar estado del producto");
    }
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


  return (
    <div className="admin-panel">
      <aside className="sidebar">
        {/* Perfil con menú de opciones */}
        <div
          className="admin-profile profile-clickable"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          ref={profileRef}
        >
          <div className="admin-avatar">👤</div>
          <span className="admin-name">
            {adminInfo?.nombre || "Administrador"}
          </span>

          {showProfileMenu && (
            <div className="profile-menu">
              <button onClick={handleGoHome}>Ir al menú</button>
              <button onClick={handleLogout}>Cerrar sesión</button>
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
            📦 Productos
          </button>
          <button
            type="button"
            className={`nav-item ${
              currentSection === "dashboard" ? "active" : ""
            }`}
            onClick={() => setCurrentSection("dashboard")}
          >
            📊 Dashboard
          </button>
        </nav>
      </aside>

      {/* MODAL AYUDA */}
      {showHelp && (
        <div className="modal">
          <div className="modal-content help-modal">
            <h3>Ayuda del Administrador</h3>
            <p>
              Desde aquí puedes gestionar todos los productos del sistema. Usa
              el buscador, edita los datos y activa o desactiva los productos
              según la disponibilidad de stock.
            </p>
            <button className="btn btn--add" onClick={() => setShowHelp(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      <main className="main-content">
        <div className="top-buttons">
          <button className="help-btn" onClick={() => setShowHelp(true)}>
            ❓
          </button>
        </div>

        {currentSection === "productos" && (
          <>
            {/* Buscador + agregar */}
            <div className="search-wrapper">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar producto"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              <button
                className="btn btn--add-secondary"
                onClick={() => setModalVisible(true)}
              >
                ➕ Agregar producto
              </button>
            </div>

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
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8">No hay productos</td>
                    </tr>
                  ) : (
                    currentProducts.map((prod) => (
                      <tr key={prod.idproducto}>
                        <td>{prod.idproducto}</td>
                        <td>
                          {prod.imagen_url && (
                            <img
                              src={prod.imagen_url}
                              alt={prod.nombre}
                              width="50"
                            />
                          )}
                        </td>
                        <td>{prod.nombre}</td>
                        <td>${prod.precio}</td>
                        <td>{prod.stock}</td>
                        <td>{getNombreCategoria(prod.idcategoria)}</td>

                        <td>
                          <span
                            className={`status-badge ${
                              prod.activo ? "status-active" : "status-inactive"
                            }`}
                          >
                            {prod.activo ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        <td>
                          <button
                            className="btn btn--edit"
                            onClick={() => handleEdit(prod)}
                          >
                            ✏️ Editar
                          </button>

                          <button
                            className={`btn btn--status ${
                              prod.activo ? "btn--inactive" : "btn--add"
                            }`}
                            onClick={() => handleToggleActive(prod)}
                            disabled={prod.stock === 0 && !prod.activo}
                          >
                            {prod.stock === 0 && !prod.activo
                              ? "Sin stock"
                              : prod.activo
                              ? "Desactivar"
                              : "Activar"}
                          </button>
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
                disabled={currentPage === 1}
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
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="page-btn"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                ›
              </button>
            </div>
          </>
        )}

        {currentSection === "dashboard" && <Dashboard />}
      </main>

      {/* MODAL CREAR / EDITAR */}
      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editingProduct ? "Editar Producto" : "Agregar Producto"}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="precio"
                placeholder="Precio"
                value={formData.precio}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="stock"
                placeholder="Stock"
                value={formData.stock}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="descripcion"
                placeholder="Descripción"
                value={formData.descripcion}
                onChange={handleChange}
              />
              <input
                type="number"
                name="idcategoria"
                placeholder="ID Categoría"
                value={formData.idcategoria}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="idmarca"
                placeholder="ID Marca"
                value={formData.idmarca}
                onChange={handleChange}
              />
              <input
                type="file"
                name="imagen"
                accept="image/*"
                onChange={handleChange}
              />
              <div className="modal-actions">
                <button type="submit" className="btn btn--add">
                  💾 Guardar
                </button>
                <button
                  type="button"
                  className="btn btn--delete"
                  onClick={() => {
                    setModalVisible(false);
                    setEditingProduct(null);
                  }}
                >
                  ❌ Cancelar
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
