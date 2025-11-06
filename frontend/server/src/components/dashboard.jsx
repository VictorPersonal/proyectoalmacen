import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./dashboard.css";

function Dashboard() {
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estadosPedido, setEstadosPedido] = useState([]);

  // 🔁 Función para cargar datos (reutilizable)
  const cargarDatos = () => {
    // 🔹 Ventas mensuales
    fetch("http://localhost:4000/api/estadisticas/ventas-mensuales")
      .then((res) => res.json())
      .then((data) => setVentas(data))
      .catch((err) => console.error("Error cargando ventas:", err));

    // 🔹 Productos más vendidos
    fetch("http://localhost:4000/api/estadisticas/productos-mas-vendidos")
      .then((res) => res.json())
      .then((data) => {
        const productosConvertidos = data.map((p) => ({
          ...p,
          ventas: Number(p.ventas),
        }));
        console.log("📊 Productos más vendidos (convertidos):", productosConvertidos);
        setProductos(productosConvertidos);
      })
      .catch((err) => console.error("Error cargando productos:", err));

    // 🔹 Usuarios registrados
    fetch("http://localhost:4000/api/estadisticas/usuarios")
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch((err) => console.error("Error cargando usuarios:", err));

    // 🔹 Estados de pedidos
    fetch("http://localhost:4000/api/estadisticas/estados-pedidos")
      .then((res) => res.json())
      .then((data) => {
        const estadosConvertidos = data.map((e) => ({
          ...e,
          cantidad: Number(e.cantidad),
        }));
        console.log("📦 Estados de pedidos (convertidos):", estadosConvertidos);
        setEstadosPedido(estadosConvertidos);
      })
      .catch((err) => console.error("Error cargando estados de pedido:", err));
  };

  useEffect(() => {
    cargarDatos(); // Primera carga
    const intervalo = setInterval(cargarDatos, 10000); // 🔁 Recarga cada 30 segundos
    return () => clearInterval(intervalo); // Limpieza al desmontar
  }, []);

  const colores = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#C77DFF"];

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">📊 Dashboard de Administración</h1>

      <div className="dashboard-grid">
        {/* 🔹 Ventas Mensuales */}
        <div className="dashboard-card">
          <h2>Ventas Mensuales</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ventas}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#4D96FF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 🔹 Productos Más Vendidos */}
        <div className="dashboard-card">
          <h2>Productos Más Vendidos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productos}
                dataKey="ventas"
                nameKey="nombre"
                outerRadius={100}
                label
              >
                {productos.map((_, i) => (
                  <Cell key={i} fill={colores[i % colores.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 🔹 Usuarios Registrados */}
        <div className="dashboard-card">
          <h2>Usuarios Registrados</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usuarios}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" fill="#6BCB77" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 🔹 Estado de Pedidos */}
        <div className="dashboard-card">
          <h2>Estado de Pedidos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={estadosPedido}
                dataKey="cantidad"
                nameKey="estado"
                outerRadius={100}
                label
              >
                {estadosPedido.map((_, i) => (
                  <Cell key={i} fill={colores[i % colores.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
