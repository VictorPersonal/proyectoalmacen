import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaCheckCircle, 
  FaShoppingCart, 
  FaUserPlus, 
  FaTag, 
  FaCreditCard, 
  FaTruck, 
  FaShieldAlt, 
  FaCopyright, 
  FaLock, 
  FaExclamationTriangle, 
  FaSyncAlt, 
  FaEnvelope,
  FaGavel,
  FaPhoneAlt,
  FaMapMarkerAlt
} from "react-icons/fa";
import "../styles/pages/terminosycondiciones.css";

const TerminosYCondiciones = () => {
  const navigate = useNavigate();
  const [seccionesAbiertas, setSeccionesAbiertas] = useState({});

  const toggleSeccion = (index) => {
    setSeccionesAbiertas(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const secciones = [
    {
      icon: <FaGavel />,
      title: "Aceptación de los Términos",
      content: "Al acceder y utilizar esta aplicación web, usted acepta cumplir con estos Términos y Condiciones. Si no está de acuerdo, debe abstenerse de utilizar la plataforma."
    },
    {
      icon: <FaShoppingCart />,
      title: "Descripción del Servicio",
      content: "La aplicación permite visualizar, consultar disponibilidad y/o adquirir electrodomésticos y productos relacionados ofrecidos por Dulce Hogar. Nos reservamos el derecho a modificar o descontinuar cualquier producto sin previo aviso."
    },
    {
      icon: <FaUserPlus />,
      title: "Registro de Usuario",
      content: "Para acceder a ciertas funciones puede ser necesario crear una cuenta. El usuario se compromete a:",
      list: [
        "Proporcionar información veraz y actualizada.",
        "Mantener la confidencialidad de sus credenciales.",
        "Asumir la responsabilidad por las actividades realizadas con su cuenta."
      ]
    },
    {
      icon: <FaTag />,
      title: "Precios y Disponibilidad",
      content: "Los precios mostrados pueden estar sujetos a cambios sin previo aviso. La disponibilidad de productos puede variar según inventario. En caso de falta de existencias, nos comunicaremos con el usuario para ofrecer alternativas o devolución del pago."
    },
    {
      icon: <FaCreditCard />,
      title: "Pagos",
      content: "Los pagos se realizarán a través de las plataformas autorizadas por Dulce Hogar. La información de pago es procesada por terceros seguros; no almacenamos datos financieros del usuario."
    },
    {
      icon: <FaTruck />,
      title: "Entregas y Envíos",
      content: "Los tiempos de entrega son estimados y pueden variar por ubicación o condiciones externas. El usuario es responsable de proporcionar la dirección correcta."
    },
    {
      icon: <FaShieldAlt />,
      title: "Garantías y Devoluciones",
      content: "Todos los productos cuentan con garantía legal según normatividad vigente. Para devoluciones o reclamos, el usuario deberá presentar factura y cumplir las condiciones de garantía del fabricante."
    },
    {
      icon: <FaCopyright />,
      title: "Propiedad Intelectual",
      content: "Todo el contenido (imágenes, textos, marcas, diseños) pertenece a Dulce Hogar o a sus proveedores y está protegido por leyes de derechos de autor. Su uso no autorizado está prohibido."
    },
    {
      icon: <FaLock />,
      title: "Protección de Datos Personales",
      content: "La información personal recolectada será tratada conforme a la Política de Privacidad, cumpliendo la legislación vigente. El usuario puede solicitar la eliminación o actualización de sus datos cuando lo requiera."
    },
    {
      icon: <FaExclamationTriangle />,
      title: "Limitación de Responsabilidad",
      content: "Dulce Hogar no se hace responsable de daños derivados del uso indebido de la plataforma o del mal manejo de productos por parte del usuario."
    },
    {
      icon: <FaSyncAlt />,
      title: "Modificaciones de los Términos",
      content: "Nos reservamos el derecho de actualizar o modificar estos Términos y Condiciones en cualquier momento. La fecha de última actualización será publicada en esta página."
    },
    {
      icon: <FaEnvelope />,
      title: "Contacto",
      content: "Para consultas, reclamos o solicitudes relacionadas con la plataforma:",
      contact: true
    }
  ];

  return (
    <div className="terminos-container">
      <div className="terminos-inner">
        <button className="terminos-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Volver
        </button>

        <div className="terminos-header">
          <h1>
            <FaGavel />
            Términos y Condiciones
          </h1>
          <div className="terminos-last-update">
            Última actualización: {new Date().toLocaleDateString('es-CO', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>

        {secciones.map((seccion, index) => (
          <div key={index} className="terminos-section">
            <div 
              className="terminos-section-header"
              onClick={() => toggleSeccion(index)}
            >
              <h2>
                {seccion.icon}
                {seccion.title}
              </h2>
            </div>
            <div className="terminos-section-content">
              <p>{seccion.content}</p>
              {seccion.list && (
                <ul>
                  {seccion.list.map((item, i) => (
                    <li key={i}>
                      <FaCheckCircle className="list-icon" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {seccion.contact && (
                <div className="terminos-contact">
                  <p><strong><FaEnvelope className="contact-icon" /> Correo:</strong> info@dulcehogar.com</p>
                  <p><strong><FaPhoneAlt className="contact-icon" /> Teléfono:</strong> +57 1 123 4567</p>
                  <p><strong><FaMapMarkerAlt className="contact-icon" /> Dirección:</strong> Calle 123 #45-67, Bogotá, Colombia</p>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="terminos-footer">
          <p>© {new Date().getFullYear()} Dulce Hogar - Todos los derechos reservados</p>
        </div>
      </div>
    </div>
  );
};

export default TerminosYCondiciones;