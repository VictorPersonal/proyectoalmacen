import React, { useState } from 'react';
import { 
  FaPhone, 
  FaWhatsapp, 
  FaStore, 
  FaTruck, 
  FaShieldAlt, 
  FaCreditCard, 
  FaTools,
  FaPlus,
  FaMinus,
  FaMapMarkerAlt,
  FaHome,
  FaArrowRight
} from 'react-icons/fa';
import './PreguntasFrecuentes.css';

const FAQPage = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const faqData = [
    {
      question: "¿En qué zonas realizan entregas?",
      answer: "Por el momento realizamos entregas únicamente en Caicedonia y ciudades/pueblos cercanos como Sevilla, Génova, Ulloa, y áreas aledañas. Puedes contactarnos para confirmar si llegamos a tu ubicación específica."
    },
    {
      question: "¿Cuál es el tiempo de entrega?",
      answer: "En Caicedonia: 1-2 días hábiles. En pueblos y ciudades cercanas: 2-4 días hábiles. Te contactaremos para coordinar la fecha y hora exacta de entrega."
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Aceptamos pagos con tarjetas débito y crédito (Visa, MasterCard). Próximamente implementaremos más métodos de pago."
    },
    {
      question: "¿Los electrodomésticos incluyen garantía?",
      answer: "¡Sí! Todos nuestros electrodomésticos incluyen garantía del fabricante. La duración varía según el producto: neveras y lavadoras (2 años), televisores y equipos de sonido (1 año), pequeños electrodomésticos (6 meses)."
    },
    {
      question: "¿Puedo devolver un producto si no me gustó?",
      answer: "No aceptamos devoluciones por cambio de opinión. Solo procesamos devoluciones cuando el producto presenta fallas de fábrica y aplica dentro del período de garantía. Todos los productos son probados antes de la entrega."
    },
    {
      question: "¿Los precios incluyen instalación?",
      answer: "¡Sí! La instalación básica está incluida en el precio para la mayoría de electrodomésticos. Para instalaciones más complejas (aires acondicionados, sistemas de audio) ofrecemos el servicio sin costo adicional."
    },
    {
      question: "¿Qué hago si mi producto tiene una falla?",
      answer: "Contacta inmediatamente a nuestro servicio al cliente. Si el producto está en garantía, coordinaremos la visita de nuestro técnico autorizado o gestionaremos el cambio según corresponda."
    },
    {
      question: "¿Tienen servicio técnico propio?",
      answer: "Sí, contamos con técnicos autorizados para la mayoría de marcas que comercializamos. El servicio técnico está disponible para productos en garantía y también para reparaciones fuera de garantía."
    },
    {
      question: "¿Puedo reservar un producto?",
      answer: "Sí, aceptamos reservas con un anticipo del 30% del valor del producto. El resto se paga al momento de la entrega. La reserva garantiza que el producto queda apartado para ti."
    },
    {
      question: "¿Los productos incluyen factura?",
      answer: "Sí, todos los productos incluyen factura de venta con toda la información necesaria para hacer válida la garantía. La factura se entrega junto con el producto."
    },
    {
      question: "¿Qué debo hacer al recibir mi electrodoméstico?",
      answer: "Verifica que el producto esté en perfectas condiciones antes de firmar el recibo. Conserva el empaque y todos los accesorios por al menos 15 días. Sigue las instrucciones de instalación y uso del manual."
    },
    {
      question: "¿Atienden pedidos por WhatsApp?",
      answer: "Sí, puedes enviarnos tus consultas y pedidos por WhatsApp. Te ayudaremos a elegir el mejor producto según tus necesidades y te guiaremos en el proceso de compra."
    }
  ];

  return (
    <div className="faq-page">
      {/* Header */}
      <header className="faq-header">
        <div className="container">
          <div className="header-content">
            <h1>Preguntas Frecuentes</h1>
            <p>Encuentra respuestas rápidas a tus dudas sobre compras y entregas</p>
            <div className="header-decoration">
              <div className="decoration-line"></div>
              <div className="decoration-dot"></div>
              <div className="decoration-line"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="breadcrumb">
        <div className="container">
          <a href="/" className="breadcrumb-link">
            <FaHome className="breadcrumb-icon" />
            Inicio
          </a>
          <FaArrowRight className="breadcrumb-arrow" />
          <span className="breadcrumb-current">Preguntas Frecuentes</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="faq-main">
        <div className="container">
          <div className="faq-content">
            {/* FAQ Section */}
            <section className="faq-section">
              <div className="section-header">
                <h2>Preguntas más comunes</h2>
                <p>Todo lo que necesitas saber sobre nuestros productos y servicios</p>
              </div>
              <div className="faq-list">
                {faqData.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <button 
                      className={`faq-question ${activeIndex === index ? 'active' : ''}`}
                      onClick={() => toggleFAQ(index)}
                    >
                      <span className="question-text">{faq.question}</span>
                      <span className="faq-icon">
                        {activeIndex === index ? <FaMinus /> : <FaPlus />}
                      </span>
                    </button>
                    {activeIndex === index && (
                      <div className="faq-answer">
                        <div className="answer-content">
                          <p>{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Contact Section */}
            <section className="contact-section">
              <div className="contact-card">
                <div className="contact-header">
                  <h3>¿No encontraste tu respuesta?</h3>
                  <p>Estamos aquí para ayudarte. Contáctanos por cualquiera de estos medios:</p>
                </div>
                
                <div className="contact-info">
                  <div className="contact-item">
                    <div className="contact-icon-wrapper">
                      <FaPhone className="contact-icon" />
                    </div>
                    <div className="contact-details">
                      <strong>Teléfono</strong>
                      <p>+57 XXX-XXX-XXXX</p>
                    </div>
                  </div>
                  
                  <div className="contact-item">
                    <div className="contact-icon-wrapper">
                      <FaWhatsapp className="contact-icon" />
                    </div>
                    <div className="contact-details">
                      <strong>WhatsApp</strong>
                      <p>+57 XXX-XXX-XXXX</p>
                    </div>
                  </div>
                  
                  <div className="contact-item">
                    <div className="contact-icon-wrapper">
                      <FaStore className="contact-icon" />
                    </div>
                    <div className="contact-details">
                      <strong>Tienda Física</strong>
                      <p>Visítanos en Caicedonia</p>
                      <small>Horario: Lunes a Sábado 8:00 AM - 7:00 PM</small>
                    </div>
                  </div>
                </div>

                <div className="delivery-info">
                  <div className="delivery-header">
                    <FaMapMarkerAlt className="delivery-icon" />
                    <h4>Zonas de Entrega</h4>
                  </div>
                  <div className="zones-list">
                    <span className="zone-tag">Caicedonia</span>
                    <span className="zone-tag">Sevilla</span>
                    <span className="zone-tag">Génova</span>
                    <span className="zone-tag">Ulloa</span>
                    <span className="zone-tag">Pueblos cercanos</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Quick Info Banner */}
      <section className="quick-info">
        <div className="container">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon-wrapper">
                <FaTruck className="info-icon" />
              </div>
              <h4>Entregas Rápidas</h4>
              <p>En Caicedonia y ciudades cercanas</p>
            </div>
            <div className="info-item">
              <div className="info-icon-wrapper">
                <FaShieldAlt className="info-icon" />
              </div>
              <h4>Garantía Incluida</h4>
              <p>En todos nuestros electrodomésticos</p>
            </div>
            <div className="info-item">
              <div className="info-icon-wrapper">
                <FaCreditCard className="info-icon" />
              </div>
              <h4>Pago con Tarjeta</h4>
              <p>Aceptamos débito y crédito</p>
            </div>
            <div className="info-item">
              <div className="info-icon-wrapper">
                <FaTools className="info-icon" />
              </div>
              <h4>Instalación Gratis</h4>
              <p>Servicio de instalación incluido</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQPage;