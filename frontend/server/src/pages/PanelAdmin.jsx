import React, { useState, useEffect } from "react";
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
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState(null);
  const [categorias, setCategorias] = useState([]);


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


  // BLOQUEAR BOTÓN ATRÁS DEL NAVEGADOR
  useEffect(() => {
    const bloquearNavegacion = () => {
      navigate(0); // evita volver atrás recargando el panel
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", bloquearNavegacion);

    return () => {
      window.removeEventListener("popstate", bloquearNavegacion);
    };
  }, []);


  // Cerrar menú de perfil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showProfileMenu &&
        !e.target.closest(".profile-clickable") &&
        !e.target.closest(".profile-menu")
      ) {
        setShowProfileMenu(false);
      }
  };

  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, [showProfileMenu]);


  // 🔍 nuevo: texto del buscador
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    stock: "",
    descripcion: "",
    idcategoria: "",
    idmarca: "",
    imagen: null,
  });

  // Traer productos al cargar el componente
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("https://backend-tpeu.onrender.com/api/productos");
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

  // Traer categorías al cargar el componente
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get("https://backend-tpeu.onrender.com/api/categorias");
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

  const getNombreCategoria = (id) => {
  const cat = categorias.find(
    (c) => String(c.idcategoria) === String(id)
  );
  return cat ? cat.descripcion : id;
  };



  const handleLogout = () => {
  // 🔴 lo importante es borrar este:
  localStorage.removeItem("usuarioInfo");

  // si usas otros para el backend, los dejamos también
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // limpiar estado local del admin (opcional pero prolijo)
  setShowProfileMenu(false);
  // si tienes adminInfo como estado:
  // setAdminInfo(null);

  // Redirigir al home y forzar que se recargue el header
  window.location.href = "/";
  };


  // 🔍 cuando cambie el término de búsqueda, volvemos a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Manejar cambios de input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // 🔍 manejar cambio en el input de búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Guardar producto (crear o editar)
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
          `https://backend-tpeu.onrender.com/api/productos/${editingProduct.idproducto}/con-imagen`,
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setProducts(
          products.map((p) =>
            p.idproducto === editingProduct.idproducto ? res.data.producto : p
          )
        );
        setEditingProduct(null);
      } else {
        // Crear producto
        const res = await axios.post(
          "https://backend-tpeu.onrender.com/api/productos/con-imagen",
          data,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setProducts([...products, res.data.producto]);
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

  // Eliminar producto
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await axios.delete(`https://backend-tpeu.onrender.com/api/productos/${id}`);
      setProducts(products.filter((p) => p.idproducto !== id));
    } catch (err) {
      console.error(
        "Error al eliminar producto:",
        err.response?.data || err.message
      );
      alert("Error al eliminar producto");
    }
  };

  // Preparar formulario para editar
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

  // 🔍 filtrar productos por nombre (puedes ampliar a descripción, categoría, etc.)
  const filteredProducts = products.filter((prod) =>
    prod.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginación (sobre la lista filtrada)
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
// 🔥 Cambiar de página con las flechas del teclado
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      handleNextPage();
    } else if (e.key === "ArrowLeft") {
      handlePrevPage();
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [currentPage, totalPages]);


  return (
    <div className="admin-panel">
      <aside className="sidebar">
        {/* Perfil con menú de cerrar sesión */}
        <div
          className="admin-profile profile-clickable"
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          <div className="admin-avatar">👤</div>
          <span className="admin-name">
            {adminInfo?.nombre || "Administrador"}
          </span>

          {showProfileMenu && (
            <div className="profile-menu">
              <button onClick={handleLogout}>Cerrar sesión</button>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          <a
            href="#"
            className={`nav-item ${currentSection === "productos" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setCurrentSection("productos");
            }}
          >
            📦 Productos
          </a>
          <a
            href="#"
            className={`nav-item ${currentSection === "dashboard" ? "active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setCurrentSection("dashboard");
            }}
          >
            📊 Dashboard
          </a>
        </nav>

      </aside>

      {/* MODAL DE AYUDA */}
      {showHelp && (
        <div className="modal">
          <div className="modal-content help-modal">
            <h3>Ayuda del Administrador</h3>
            <p>
              Aquí puedes gestionar todos los productos del sistema. Usa el
              buscador para encontrar productos rápidamente, agrega nuevos
              productos con el botón de la derecha y usa las acciones Editar /
              Eliminar dentro de la tabla.
            </p>
            <button className="btn btn--add" onClick={() => setShowHelp(false)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      <main className="main-content">
        {/* === BOTONES SUPERIORES === */}
        <div className="top-buttons">
          <button className="help-btn" onClick={() => setShowHelp(true)}>
            ❓
          </button>
        </div>

        {currentSection === "productos" && (
          <>
            {/* 🔍 Barra de búsqueda + botón agregar (estilo como tu imagen) */}
            <div className="admin-search-wrapper">
              <div className="admin-search-container">
                <span className="admin-search-icon">🔍</span>
                <input
                  type="text"
                  className="admin-search-input"
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
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7">No hay productos</td>
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
                          <button
                            className="btn btn--edit"
                            onClick={() => handleEdit(prod)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            className="btn btn--delete"
                            onClick={() => handleDelete(prod.idproducto)}
                          >
                            🗑️ Eliminar
                          </button>
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
