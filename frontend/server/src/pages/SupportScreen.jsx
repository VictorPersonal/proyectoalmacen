import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaHeadset, 
  FaPlus, 
  FaChevronRight,
  FaCommentDots,
  FaCheckCircle,
  FaSpinner
} from "react-icons/fa";
import NuevoTicketModal from "../components/NuevoTicketModal";
import "../styles/pages/SupportScreen.css";
import API_URL from "../config/api.js";

const SupportScreen = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [showNuevoModal, setShowNuevoModal] = useState(false);

  useEffect(() => {
    const usuarioInfo = localStorage.getItem("usuarioInfo");
    if (usuarioInfo) {
      try {
        const usuario = JSON.parse(usuarioInfo);
        setEsAdmin(usuario.rol === "administrador");
      } catch (e) {}
    }
    cargarTickets();
  }, []);

  const cargarTickets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = esAdmin 
        ? `${API_URL}/api/soporte/admin/todos`
        : `${API_URL}/api/soporte/mis-tickets`;
      
      const response = await fetch(url, {
        credentials: "include"
      });
      
      if (!response.ok) throw new Error("Error al cargar tickets");
      
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nuevosCount = tickets.filter(t => t.tieneNuevos).length;

  const formatFecha = (fecha) => {
    if (!fecha) return "";
    try {
      const d = new Date(fecha);
      const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
      return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return fecha;
    }
  };

  const handleTicketClick = (ticket) => {
    navigate(`/soporte/${ticket.idreclamo}`, {
      state: { asunto: ticket.asunto, esAdmin }
    });
  };

  const handleNuevoTicket = () => {
    setShowNuevoModal(true);
  };

  const handleTicketCreado = () => {
    cargarTickets();
  };

  return (
    <div className="support-screen">
      {/* Header */}
      <div className="support-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div className="header-title">
          <FaHeadset className="header-icon" />
          <div>
            <h1>{esAdmin ? "Consultas de clientes" : "Soporte y consultas"}</h1>
            {nuevosCount > 0 && (
              <span className="nuevos-count">{nuevosCount} con mensajes nuevos</span>
            )}
          </div>
        </div>
      </div>

      {/* Lista de tickets */}
      <div className="tickets-container">
        {loading ? (
          <div className="loading-state">
            <FaSpinner className="spinner" />
            <p>Cargando consultas...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={cargarTickets}>Reintentar</button>
          </div>
        ) : tickets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaCommentDots />
            </div>
            <h3>{esAdmin ? "Sin consultas de clientes" : "Sin consultas todavía"}</h3>
            <p>
              {esAdmin 
                ? "Aquí verás los mensajes de tus clientes"
                : "Toca el botón para hacer una consulta"}
            </p>
          </div>
        ) : (
          <div className="tickets-list">
            {tickets.map((ticket) => (
              <div
                key={ticket.idreclamo}
                className={`ticket-card ${ticket.tieneNuevos ? "has-new" : ""}`}
                onClick={() => handleTicketClick(ticket)}
              >
                <div className="ticket-icon">
                  {ticket.estado === "Abierto" ? (
                    <FaCommentDots />
                  ) : (
                    <FaCheckCircle />
                  )}
                  {ticket.tieneNuevos && <span className="new-dot" />}
                </div>
                
                <div className="ticket-info">
                  <div className="ticket-header">
                    <h3>{ticket.asunto}</h3>
                    <span className={`ticket-status ${ticket.estado === "Abierto" ? "status-open" : "status-closed"}`}>
                      {ticket.estado}
                    </span>
                  </div>
                  <div className="ticket-meta">
                    <span className="ticket-fecha">{formatFecha(ticket.fecha)}</span>
                    <span className="ticket-mensajes">
                      <FaCommentDots /> {ticket.totalMensajes || 0}
                    </span>
                    {ticket.tieneNuevos && <span className="new-badge">Nuevo</span>}
                  </div>
                </div>
                
                <FaChevronRight className="chevron-icon" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón flotante (solo para clientes) */}
      {!esAdmin && (
        <button className="fab-btn" onClick={handleNuevoTicket}>
          <FaPlus /> Nueva consulta
        </button>
      )}

      {/* Modal nuevo ticket */}
      <NuevoTicketModal
        isOpen={showNuevoModal}
        onClose={() => setShowNuevoModal(false)}
        onCreado={handleTicketCreado}
      />
    </div>
  );
};

export default SupportScreen;