import React, { useState } from "react";
import { FaTimes, FaCommentDots } from "react-icons/fa";
import "../styles/components/NuevoTicketModal.css";

const NuevoTicketModal = ({ isOpen, onClose, onCreado }) => {
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asunto.trim() || !descripcion.trim()) {
      alert("Completa todos los campos");
      return;
    }
    
    setEnviando(true);
    
    try {
      // ✅ URL CORRECTA - sin /soporte duplicado
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/soporte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          asunto: asunto.trim(),
          descripcion: descripcion.trim()
        })
      });

      if (response.ok) {
        onCreado();
        onClose();
        setAsunto("");
        setDescripcion("");
        alert("Ticket creado correctamente");
      } else {
        const error = await response.json();
        alert(error.message || "Error al crear el ticket");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="nuevo-ticket-modal-overlay" onClick={onClose}>
      <div className="nuevo-ticket-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><FaCommentDots /> Nueva consulta</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Asunto"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            maxLength={100}
            disabled={enviando}
          />
          <textarea
            placeholder="Descripción detallada de tu consulta..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            maxLength={500}
            disabled={enviando}
          />
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar consulta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoTicketModal;