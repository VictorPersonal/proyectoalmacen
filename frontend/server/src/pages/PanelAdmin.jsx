import React, { useState, useEffect } from "react";
import "./PanelAdmin.css"; 
import axios from "axios";

// 🚨 CORRECCIÓN 1: Asegura que el puerto coincida con tu backend (3000 o 4000)
const API_URL = "http://localhost:4000/api/productos";

const PanelAdmin = () => {
    
  // Estados para la gestión de datos y UI
  const [products, setProducts] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  
  // 🚨 CORRECCIÓN 3: Inicialización segura para los campos numéricos del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    precio: "", // Inicializado como string vacío para React
    stock: "",  // Inicializado como string vacío para React
    categoria: "", // Inicializado como string vacío para React
  });
  
  const [currentId, setCurrentId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Función de Carga Principal (Llamada GET)
  const fetchProducts = () => {
    setCargando(true);
    axios.get(API_URL) 
      .then((res) => {
        setProducts(res.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error al cargar productos:", err);
        setError(`Error de conexión. Asegúrate de que el backend esté activo en ${API_URL}`);
        setProducts([]);
      })
      .finally(() => {
        setCargando(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtro y Paginación (sin cambios)
  const filteredProducts = products.filter((p) =>
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);


  // Manejo de Modal
  const handleCloseModal = () => {
    setShowModal(false);
    // Reinicializamos con valores seguros
    setFormData({ nombre: "", precio: "", stock: "", categoria: "" }); 
    setCurrentId(null);
  };
  
  const handleShowModal = (product = null) => {
    // 🚨 CORRECCIÓN 2: Aseguramos que currentId siempre se asigne a product.id
    setCurrentId(product?.id || null);
    
    // Al cargar, convertimos los números (precio, stock, categoria) a String para el input type="number"
    const initialFormData = product ? {
        ...product,
        precio: String(product.precio || ""),
        stock: String(product.stock || ""),
        categoria: String(product.categoria || ""),
    } : { nombre: "", precio: "", stock: "", categoria: "" };

    setFormData(initialFormData);
    setShowModal(true);
  };

  // Guardar (POST/PUT)
  const handleSave = () => {
    if (!formData.nombre || !formData.precio || !formData.stock || !formData.categoria) {
      alert("Por favor completa todos los campos.");
      return;
    }

    const payload = {
      nombre: formData.nombre,
      precio: parseFloat(formData.precio),
      stock: parseInt(formData.stock),
      categoria: parseInt(formData.categoria), 
    };

    const request = currentId
      ? axios.put(`${API_URL}/${currentId}`, payload) 
      : axios.post(API_URL, payload); 

    request
      .then(() => {
        fetchProducts(); 
        handleCloseModal();
      })
      .catch((err) => console.error("Error al guardar producto:", err));
  };

  // Eliminar (DELETE)
  const handleDelete = (id) => {
    // 🚨 CORRECCIÓN 2: Verificamos que el ID no sea undefined
    if (!id) {
        console.error("Error: ID de producto no definido para eliminar.");
        return;
    }
    
    if (window.confirm("¿Seguro que deseas eliminar este producto?")) {
      axios.delete(`${API_URL}/${id}`)
        .then(() => {
          fetchProducts(); 
        })
        .catch((err) => console.error("Error al eliminar:", err));
    }
  };


  // --- Renderizado ---
  return (
    <div className="admin-panel">
      {/* ... Sidebar ... */}
      <aside className="sidebar">
        <div className="admin-profile">
          <div className="admin-avatar">👤</div>
          <span className="admin-name">Admin Enrique</span>
        </div>
        <nav className="sidebar-nav">
          <a href="#" className="nav-item active">
            <span className="nav-icon">📦</span> Productos
          </a>
          <a href="#" className="nav-item">
            <span className="nav-icon">📊</span> Dashboard
          </a>
        </nav>
      </aside>

      <main className="main-content">
        {/* ... (Controles de búsqueda y botón) ... */}
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

        {error && <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
        
        <div className="table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Id</th>
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
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>Cargando datos...</td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((product) => (
                  // Prop 'key' obligatoria en <tr>
                  <tr key={product.id}>
                    <td>{product.id}</td> 
                    <td>{product.nombre}</td>
                    <td>${parseFloat(product.precio || 0).toFixed(2)}</td> 
                    <td>{product.stock}</td>
                    <td>{product.categoria || "N/A"}</td>
                    <td className="actions-cell">
                      <button className="btn btn--edit" onClick={() => handleShowModal(product)}>
                        ✏️
                      </button>
                      {/* 🚨 CORRECCIÓN 2: Aseguramos el paso de product.id */}
                      <button className="btn btn--delete" onClick={() => handleDelete(product.id)}>
                        🗑
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>
                    No se encontraron productos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
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
            onClick={() => setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      </main>

      {/* Modal para agregar/editar */}
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
            {/* 🚨 CORRECCIÓN 3: El valor del input ya viene como string desde handleShowModal */}
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
