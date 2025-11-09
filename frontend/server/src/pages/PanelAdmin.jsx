import React, { useState, useEffect } from "react";
import "./PanelAdmin.css";
import axios from "axios";
import Dashboard from "../components/dashboard";

const API_URL = "http://localhost:4000/api/productos";

const PanelAdmin = () => {
  const [products, setProducts] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentSection, setCurrentSection] = useState("productos"); // 🆕 nueva vista

  const [formData, setFormData] = useState({
    nombre: "",
    precio: "",
    stock: "",
    categoria: "",
    imagen: null,
  });

  const [currentId, setCurrentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchProducts = () => {
    setCargando(true);
    axios
      .get(API_URL)
      .then((res) => {
        setProducts(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error al cargar productos:", err);
        setError(
          `Error de conexión. Asegúrate de que el backend esté activo en ${API_URL}`
        );
        setProducts([]);
      })
      .finally(() => {
        setCargando(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      nombre: "",
      precio: "",
      stock: "",
      categoria: "",
      imagen: null,
    });
    setCurrentId(null);
  };

  const handleShowModal = (product = null) => {
    setCurrentId(product?.id || null);
    const initialFormData = product
      ? {
          ...product,
          precio: String(product.precio || ""),
          stock: String(product.stock || ""),
          categoria: String(product.categoria || ""),
          imagen: null,
        }
      : { nombre: "", precio: "", stock: "", categoria: "", imagen: null };
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.precio || !formData.stock || !formData.categoria) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    try {
      let imageUrl = null;
      if (formData.imagen) {
        const imageData = new FormData();
        imageData.append("imagen", formData.imagen);

        const uploadRes = await axios.post(
          "http://localhost:4000/api/productos/upload",
          imageData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        imageUrl = uploadRes.data.secure_url;
      }

      const payload = {
        nombre: formData.nombre,
        precio: parseFloat(formData.precio),
        stock: parseInt(formData.stock),
        categoria: parseInt(formData.categoria),
        imagen_url: imageUrl || formData.imagen_url || null,
      };

      if (currentId) {
        await axios.put(`${API_URL}/${currentId}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }

      fetchProducts();
      handleCloseModal();
    } catch (err) {
      console.error("Error al guardar producto:", err);
      alert("Error al guardar producto. Revisa la consola.");
    }
  };

  const handleDelete = (id) => {
    if (!id) return;
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      axios
        .delete(`${API_URL}/${id}`)
        .then(() => fetchProducts())
        .catch((err) => console.error("Error al eliminar:", err));
    }
  };

  return (
    <div className="admin-panel">
      {/* 🧭 Sidebar */}
      <aside className="sidebar">
        <div className="admin-profile">
          <div className="admin-avatar">👤</div>
          <span className="admin-name">Admin Enrique</span>
        </div>

        <nav className="sidebar-nav">
          <a
            href="#"
            className={`nav-item ${currentSection === "productos" ? "active" : ""}`}
            onClick={() => setCurrentSection("productos")}
          >
            <span className="nav-icon">📦</span> Productos
          </a>

          <a
            href="#"
            className={`nav-item ${currentSection === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentSection("dashboard")}
          >
            <span className="nav-icon">📊</span> Dashboard
          </a>
        </nav>
      </aside>

      {/* 🧩 Contenido principal */}
      <main className="main-content">
        {currentSection === "productos" && (
          <>
            <div className="search-wrapper">
              <div className="search-container">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="form-wrapper">
              <button className="btn btn--add" onClick={() => handleShowModal()}>
                ➕ Agregar
              </button>
            </div>

            {error && (
              <div className="error-message" style={{ color: "red", margin: "10px 0" }}>
                {error}
              </div>
            )}

            <div className="table-wrapper">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Categoría</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                        Cargando datos...
                      </td>
                    </tr>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((product) => (
                      <tr key={product.id}>
                        <td>{product.id}</td>
                        <td>
                          {product.imagen_url ? (
                            <img
                              src={product.imagen_url}
                              alt={product.nombre}
                              style={{
                                width: "60px",
                                height: "60px",
                                objectFit: "cover",
                                borderRadius: "6px",
                              }}
                            />
                          ) : (
                            "Sin imagen"
                          )}
                        </td>
                        <td>{product.nombre}</td>
                        <td>${parseFloat(product.precio || 0).toFixed(2)}</td>
                        <td>{product.stock}</td>
                        <td>{product.categoria || "N/A"}</td>
                        <td className="actions-cell">
                          <button
                            className="btn btn--edit"
                            onClick={() => handleShowModal(product)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn--delete"
                            onClick={() => handleDelete(product.id)}
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", padding: "10px" }}>
                        No se encontraron productos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <span
                  key={index + 1}
                  className={`page-number ${currentPage === index + 1 ? "active" : ""}`}
                  onClick={() => setCurrentPage(index + 1)}
                >
                  {index + 1}
                </span>
              ))}
              <button
                className="page-btn"
                onClick={() =>
                  setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))
                }
                disabled={currentPage === totalPages}
              >
                ›
              </button>
            </div>
          </>
        )}

        {/* 🆕 Dashboard integrado */}
        {currentSection === "dashboard" && <Dashboard />}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{currentId ? "Editar Producto" : "Agregar Producto"}</h3>
            <input
              type="text"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            />
            <input
              type="number"
              placeholder="Precio"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
            />
            <input
              type="number"
              placeholder="Stock"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
            <input
              type="number"
              placeholder="ID Categoría (Ej: 1)"
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFormData({ ...formData, imagen: e.target.files[0] })
              }
            />

            <div className="modal-actions">
              <button className="btn btn--add" onClick={handleSave}>
                💾 Guardar
              </button>
              <button className="btn btn--delete" onClick={handleCloseModal}>
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAdmin;