export const obtenerPromocionAplicable = (producto, promociones = []) => {
  const ahora = new Date();

  const vigentes = promociones.filter((promo) => {
    const inicio = new Date(promo.fecha_inicio);
    const fin = new Date(promo.fecha_fin);

    return (
      promo.activo_manual === true &&
      ahora >= inicio &&
      ahora <= fin
    );
  });

  const aplicables = vigentes.filter((promo) => {
    if (promo.scope === "producto") {
      return String(promo.idproducto) === String(producto.idproducto);
    }

    if (promo.scope === "categoria") {
      return String(promo.idcategoria) === String(producto.idcategoria);
    }

    if (promo.scope === "global") {
      return true;
    }

    return false;
  });

  if (aplicables.length === 0) return null;

  const prioridad = {
    producto: 3,
    categoria: 2,
    global: 1,
  };

  aplicables.sort((a, b) => {
    const prioridadA = prioridad[a.scope] || 0;
    const prioridadB = prioridad[b.scope] || 0;

    if (prioridadB !== prioridadA) {
      return prioridadB - prioridadA;
    }

    return Number(b.valor_descuento) - Number(a.valor_descuento);
  });

  return aplicables[0];
};

export const calcularPrecioPromocional = (producto, promociones = []) => {
  const promo = obtenerPromocionAplicable(producto, promociones);

  const precioOriginal = Number(producto.precio);

  if (!promo) {
    return {
      ...producto,
      precio_original: precioOriginal,
      descuento_porcentaje: 0,
      precio_final: precioOriginal,
      tiene_promocion: false,
      promocion_nombre: null,
    };
  }

  const descuento = Number(promo.valor_descuento);
  const precioFinal = Number(
    (precioOriginal * (1 - descuento / 100)).toFixed(2)
  );

  return {
    ...producto,
    precio_original: precioOriginal,
    descuento_porcentaje: descuento,
    precio_final: precioFinal,
    tiene_promocion: true,
    promocion_nombre: promo.nombre,
  };
};