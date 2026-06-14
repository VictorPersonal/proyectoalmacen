import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaPaperPlane, 
  FaCheckCircle,
  FaEdit,
  FaTrash,
  FaSpinner
} from "react-icons/fa";
import "../styles/pages/SupportChatScreen.css";
import API_URL from "../config/api.js";

const SupportChatScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { asunto, esAdmin } = location.state || {};
  const idreclamo = location.pathname.split("/").pop();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    cargarTicket();
  }, [idreclamo]);

  useEffect(() => {
    scrollToBottom();
  }, [ticket?.mensajes]);

  const cargarTicket = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/soporte/${idreclamo}`, {
        credentials: "include"
      });
      
      if (!response.ok) throw new Error("Error al cargar ticket");
      
      const data = await response.json();
      setTicket(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const enviarMensajeHandler = async () => {
    if (!mensaje.trim() || enviando) return;
    
    setEnviando(true);
    try {
      const response = await fetch(`${API_URL}/api/soporte/${idreclamo}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ mensaje: mensaje.trim() })
      });
      
      if (!response.ok) throw new Error("Error al enviar mensaje");
      
      setMensaje("");
      await cargarTicket();
    } catch (err) {
      alert(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensajeHandler();
    }
  };

  const handleCerrarTicket = async () => {
    if (window.confirm("¿Cerrar este ticket? El cliente ya no podrá responder.")) {
      try {
        const response = await fetch(`${API_URL}/api/soporte/${idreclamo}/cerrar`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        });
        
        if (!response.ok) throw new Error("Error al cerrar ticket");
        
        await cargarTicket();
        alert("Ticket cerrado correctamente");
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const formatHora = (fecha) => {
    if (!fecha) return "";
    try {
      const d = new Date(fecha);
      return d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="spinner"></div>
        <p>Cargando conversación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-error">
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Volver</button>
      </div>
    );
  }

  const cerrado = ticket?.cerrado;

  return (
    <div className="chat-screen">
      {/* Header */}
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div className="chat-header-info">
          <h2>{ticket?.asunto || asunto}</h2>
          <span className={`chat-status ${cerrado ? "status-closed" : "status-open"}`}>
            {cerrado ? "Cerrado" : "Abierto"}
          </span>
        </div>
        {esAdmin && !cerrado && (
          <button className="close-ticket-btn" onClick={handleCerrarTicket}>
            <FaCheckCircle /> Cerrar ticket
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div className="messages-container">
        {ticket?.mensajes?.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.esMio ? "message-right" : "message-left"}`}
          >
            <div className="message-bubble">
              <div className="message-text">{msg.mensaje}</div>
              <div className="message-meta">
                <span className="message-time">{formatHora(msg.fechaenvio)}</span>
                {msg.editado && <span className="message-edited">· editado</span>}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!cerrado && (
        <div className="chat-input-area">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Escribe un mensaje..."
            rows={1}
          />
          <button onClick={enviarMensajeHandler} disabled={enviando || !mensaje.trim()}>
            {enviando ? <FaSpinner className="small-spinner" /> : <FaPaperPlane />}
          </button>
        </div>
      )}
    </div>
  );
};

export default SupportChatScreen;