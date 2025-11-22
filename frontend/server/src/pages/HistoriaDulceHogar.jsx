import React from "react";
import "./Historia.css";

import historiaImg from "../assets/almacen.png";

const HistoriaDulceHogar = () => {
  // Datos reutilizables
  const secciones = {
    hero: {
      titulo: "Dulce Hogar",
      subtitulo: "Almacen de electrodomesticos.",
      imagen: historiaImg
    },
    historia: {
      titulo: "Nuestra Historia",
      parrafos: [
        "Dulce Hogar nació en 1998 como un pequeño local familiar dedicado a la venta y reparación de electrodomésticos en el corazón de Caicedonia. Sus fundadores iniciaron con un objetivo claro: ofrecer productos de calidad a precios accesibles, acompañados de un servicio cercano y confiable.",
        "Con los años, la tienda creció y se convirtió en un referente local, expandiéndose a muebles, tecnología y marcas reconocidas sin perder su esencia familiar."
      ],
      imagen: historiaImg  // ✅ Misma imagen para la sección de historia
    },
    misionVision: [
      {
        titulo: "Misión",
        contenido: "Brindar soluciones para el hogar con productos modernos, funcionales y duraderos, acompañados de un servicio humano y honesto.",
        imagen: "" // misionImg (cuando esté disponible)
      },
      {
        titulo: "Visión",
        contenido: "Ser el almacén más confiable del norte del Valle, destacándonos por la innovación, servicio al cliente y compromiso social.",
        imagen: "" // visionImg (cuando esté disponible)
      }
    ],
    valores: {
      titulo: "Valores",
      items: [
        { nombre: "Honestidad", descripcion: "Transparencia en cada venta y servicio." },
        { nombre: "Compromiso", descripcion: "Acompañamos al cliente antes, durante y después." },
        { nombre: "Calidad", descripcion: "Selección de productos confiables y duraderos." },
        { nombre: "Cercanía", descripcion: "Crecemos junto a nuestra comunidad." }
      ]
    },
    cierre: {
      contenido: "Hoy, Dulce Hogar continúa evolucionando, integrando nuevas tecnologías y expandiendo su inventario, sin perder su esencia familiar y el deseo de ayudar a cada hogar a ser un lugar más cómodo, seguro y feliz."
    }
  };

  // Componentes reutilizables
  const HeroSection = () => (
    <section className="hero-historia">
      <img src={secciones.hero.imagen} alt="Dulce Hogar" />
      <div className="hero-text">
        <h1>{secciones.hero.titulo}</h1>
        <p>{secciones.hero.subtitulo}</p>
      </div>
    </section>
  );

  const HistoriaSection = () => (
    <section className="historia-bloque">
      <div className="bloque-imagen">
        <img src={secciones.historia.imagen} alt="Historia Dulce Hogar" /> {/* ✅ QUITÉ EL COMENTARIO AQUÍ TAMBIÉN */}
      </div>
      <div className="bloque-texto">
        <h2>{secciones.historia.titulo}</h2>
        {secciones.historia.parrafos.map((parrafo, index) => (
          <p key={index}>{parrafo}</p>
        ))}
      </div>
    </section>
  );

  const MisionVisionSection = () => (
    <section className="mision-vision">
      {secciones.misionVision.map((item, index) => (
        <div key={index} className="mv-card">
          {/* <img src={item.imagen} alt={item.titulo} /> */}
          <h3>{item.titulo}</h3>
          <p>{item.contenido}</p>
        </div>
      ))}
    </section>
  );

  const ValoresSection = () => (
    <section className="valores-seccion">
      <h2>{secciones.valores.titulo}</h2>
      <ul>
        {secciones.valores.items.map((valor, index) => (
          <li key={index}>
            <b>{valor.nombre}:</b> {valor.descripcion}
          </li>
        ))}
      </ul>
    </section>
  );

  const CierreSection = () => (
    <section className="historia-cierre">
      <p>{secciones.cierre.contenido}</p>
    </section>
  );

  return (
    <div className="historia-wrapper">
      <HeroSection />
      <HistoriaSection />
      <MisionVisionSection />
      <ValoresSection />
      <CierreSection />
    </div>
  );
};

export default HistoriaDulceHogar;