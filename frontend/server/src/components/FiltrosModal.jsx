import React, { useState, useEffect, useRef } from "react";
import "../styles/components/FiltrosModal.css";

const PRECIO_MAX_DEFAULT = 5000000;

const FiltrosModal = ({ isOpen, onClose, onAplicar, filtrosActivos }) => {
  const [ordenar, setOrdenar] = useState(filtrosActivos?.ordenar || "recientes");
  const [precioMin, setPrecioMin] = useState(filtrosActivos?.precioMin ?? 0);
  const [precioMax, setPrecioMax] = useState(filtrosActivos?.precioMax ?? PRECIO_MAX_DEFAULT);
  const [idMarca, setIdMarca] = useState(filtrosActivos?.idMarca || "todas");
  const [marcas, setMarcas] = useState([]);
  const [cargandoMarcas, setCargandoMarcas] = useState(false);

  const overlayRef = useRef(null);

  // Cargar marcas desde el backend
  useEffect(() => {
    if (!isOpen) return;
    setCargandoMarcas(true);
    fetch("http://localhost:4000/api/marcas")
      .then((r) => r.json())
      .then((data) => setMarcas(Array.isArray(data) ? data : []))
      .catch(() => setMarcas([]))
      .finally(() => setCargandoMarcas(false));
  }, [isOpen]);

  // Sincronizar si los filtros externos cambian (ej. al limpiar)
  useEffect(() => {
    if (filtrosActivos) {
      setOrdenar(filtrosActivos.ordenar || "recientes");
      setPrecioMin(filtrosActivos.precioMin ?? 0);
      setPrecioMax(filtrosActivos.precioMax ?? PRECIO_MAX_DEFAULT);
      setIdMarca(filtrosActivos.idMarca || "todas");
    }
  }, [filtrosActivos]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleAplicar = () => {
    onAplicar({ ordenar, precioMin, precioMax, idMarca });
    onClose();
  };

  const handleLimpiar = () => {
    setOrdenar("recientes");
    setPrecioMin(0);
    setPrecioMax(PRECIO_MAX_DEFAULT);
    setIdMarca("todas");
  };

  const formatPrecio = (v) =>
    `$${Number(v).toLocaleString("es-CO")}`;

  const hayFiltrosActivos =
    ordenar !== "recientes" ||
    precioMin > 0 ||
    precioMax < PRECIO_MAX_DEFAULT ||
    idMarca !== "todas";

  if (!isOpen) return null;

  return (
    <div
      className="filtros-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="filtros-modal" role="dialog" aria-modal="true" aria-label="Filtros">
        {/* Handle de arrastre (decorativo) */}
        <div className="filtros-handle" />

        {/* Encabezado */}
        <div className="filtros-header">
          <div className="filtros-titulo-row">
            <span className="filtros-icono">⚙</span>
            <h2 className="filtros-titulo">Filtros</h2>
          </div>
          {hayFiltrosActivos && (
            <button className="filtros-limpiar-btn" onClick={handleLimpiar}>
              Limpiar
            </button>
          )}
        </div>

        {/* ── ORDENAR POR ────────────────────────────────── */}
        <section className="filtros-seccion">
          <h3 className="filtros-seccion-titulo">Ordenar por</h3>
          <div className="filtros-chips">
            {[
              { value: "recientes", label: "Más recientes" },
              { value: "precio_asc", label: "Precio: menor a mayor" },
              { value: "precio_desc", label: "Precio: mayor a menor" },
              { value: "nombre_asc", label: "Nombre A–Z" },
            ].map((op) => (
              <button
                key={op.value}
                className={`filtros-chip ${ordenar === op.value ? "activo" : ""}`}
                onClick={() => setOrdenar(op.value)}
              >
                {op.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── RANGO DE PRECIO ────────────────────────────── */}
        <section className="filtros-seccion">
          <div className="filtros-precio-header">
            <h3 className="filtros-seccion-titulo">Rango de precio</h3>
            <span className="filtros-precio-label">
              {precioMin === 0 && precioMax === PRECIO_MAX_DEFAULT
                ? "Cualquier precio"
                : `${formatPrecio(precioMin)} – ${formatPrecio(precioMax)}`}
            </span>
          </div>

          {/* Slider doble */}
          <div className="filtros-range-wrapper">
            <div
              className="filtros-range-track"
              style={{
                "--pmin": `${(precioMin / PRECIO_MAX_DEFAULT) * 100}%`,
                "--pmax": `${(precioMax / PRECIO_MAX_DEFAULT) * 100}%`,
              }}
            >
              <input
                type="range"
                min={0}
                max={PRECIO_MAX_DEFAULT}
                step={50000}
                value={precioMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v <= precioMax) setPrecioMin(v);
                }}
                className="filtros-range filtros-range-min"
              />
              <input
                type="range"
                min={0}
                max={PRECIO_MAX_DEFAULT}
                step={50000}
                value={precioMax}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (v >= precioMin) setPrecioMax(v);
                }}
                className="filtros-range filtros-range-max"
              />
            </div>
            <div className="filtros-range-labels">
              <span>$0</span>
              <span>{formatPrecio(PRECIO_MAX_DEFAULT)}</span>
            </div>
          </div>
        </section>

        {/* ── MARCA ──────────────────────────────────────── */}
        <section className="filtros-seccion">
          <h3 className="filtros-seccion-titulo">Marca</h3>
          {cargandoMarcas ? (
            <p className="filtros-cargando">Cargando marcas…</p>
          ) : (
            <div className="filtros-chips filtros-chips-marcas">
              <button
                className={`filtros-chip ${idMarca === "todas" ? "activo" : ""}`}
                onClick={() => setIdMarca("todas")}
              >
                Todas
              </button>
              {marcas.map((m) => (
                <button
                  key={m.idmarca}
                  className={`filtros-chip ${idMarca === m.idmarca ? "activo" : ""}`}
                  onClick={() => setIdMarca(m.idmarca)}
                >
                  {m.descripcionMarca}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── BOTÓN APLICAR ──────────────────────────────── */}
        <div className="filtros-footer">
          <button className="filtros-aplicar-btn" onClick={handleAplicar}>
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltrosModal;
