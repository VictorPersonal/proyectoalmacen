import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../styles/components/dashboard.css";

const Dashboard = () => {
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [usuariosPorTipo, setUsuariosPorTipo] = useState([]);
  const [estadosPedidos, setEstadosPedidos] = useState([]);
  const [error, setError] = useState(null);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#B71C1C"];

  // 🔹 Función genérica para obtener datos con token y sin cache
  const fetchData = async (url, setState) => {
    try {
      const res = await fetch(`${url}?_=${Date.now()}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json(); // ✅ solo una vez

      if (!res.ok) throw new Error(data.error || "Error de autenticación");

      if (Array.isArray(data)) {
        setState(data);
      } else {
        console.warn(`⚠️ Respuesta inesperada en ${url}:`, data);
        setState([]);
      }
    } catch (err) {
      console.error(`Error cargando ${url}:`, err);
      setError(`Error al cargar datos: ${err.message}`);
      setState([]);
    }
  };

  // 🔹 Cargar todos los datos
  const actualizarDatos = () => {
    fetchData("http://localhost:4000/api/estadisticas/ventas-mensuales", setVentasMensuales);
    fetchData("http://localhost:4000/api/estadisticas/productos-mas-vendidos", setProductosMasVendidos);
    fetchData("http://localhost:4000/api/estadisticas/usuarios", setUsuariosPorTipo);
    fetchData("http://localhost:4000/api/estadisticas/estados-pedidos", setEstadosPedidos);
  };

  // 🔁 Refrescar cada 10 segundos
  useEffect(() => {
    actualizarDatos();
    const interval = setInterval(actualizarDatos, 5000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return <div className="dashboard-error">⚠️ {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Panel de Dashboard</h1>

      <div className="dashboard-grid">
        {/* === Ventas Mensuales === */}
        <div className="dashboard-card">
          <h2>Ventas Mensuales</h2>
          {ventasMensuales.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={ventasMensuales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8884d8"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>No hay datos disponibles</p>
          )}
        </div>

        {/* === Productos Más Vendidos === */}
        <div className="dashboard-card">
          <h2>Productos Más Vendidos</h2>
          {productosMasVendidos.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={productosMasVendidos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nombre" tick={false} /> {/* 🔸 Sin labels */}
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No hay datos disponibles</p>
          )}
        </div>

        {/* === Usuarios por Rol === */}
        <div className="dashboard-card">
          <h2>Usuarios por Rol</h2>
          {usuariosPorTipo.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={usuariosPorTipo}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="tipo" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad">
                  {usuariosPorTipo.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p>No hay datos disponibles</p>
          )}
        </div>

        {/* === Estados de Pedido === */}
        <div className="dashboard-card">
          <h2>Estados de Pedidos</h2>
          {estadosPedidos.length > 0 ? (
            <div
              style={{
                width: "100%",
                height: 250,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <PieChart width={250} height={250}>
                <Pie
                  data={estadosPedidos}
                  dataKey="cantidad"
                  nameKey="estado"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                >
                  {estadosPedidos.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </div>
          ) : (
            <p>No hay datos disponibles</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

