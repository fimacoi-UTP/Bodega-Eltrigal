import { Link } from 'react-router-dom';
import { useCarrito } from '../../context/CarritoContext';
import { Card, Boton, EstadoVacio, Input } from '../../components/ui';
import { formatearSoles } from '../../utils/formato';
import { RUTAS } from '../../routes/rutas';
import './CarritoPage.css';

/**
 * Vista de la página del Carrito (/carrito).
 * Muestra el desglose de productos, modificación de cantidad y cálculo total.
 *
 * El layout usa `.contenedor contenedor--angosto`, la misma utilidad centrada
 * que emplean el catálogo y el checkout, para que el contenido no se estire de
 * lado a lado en pantallas grandes. Los estilos propios están en
 * ./CarritoPage.css (antes eran atributos `style` sueltos en el JSX).
 *
 * La lógica del carrito vive en CarritoProvider; aquí solo se consume.
 */
export const CarritoPage = () => {
  const { items, quitar, cambiarCantidad, vaciar, total } = useCarrito();

  // Estado vacío cuando no hay ítems en el carrito
  if (items.length === 0) {
    return (
      <div className="contenedor contenedor--angosto seccion carrito__vacio">
        <figure className="carrito__ilustracion">
          <img
            src="/imagenes/carrito.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        </figure>

        <EstadoVacio
          titulo="Tu carrito está vacío"
          descripcion="Explora la tienda y añade los productos que necesitas. Te los llevamos a casa o los recoges por la bodega."
          accion={
            <Boton como={Link} to={RUTAS.INICIO} variante="primario" tamano="lg">
              Ver el catálogo
            </Boton>
          }
        />
      </div>
    );
  }

  const unidades = items.reduce((suma, item) => suma + item.cantidad, 0);

  return (
    <div className="contenedor contenedor--angosto seccion carrito-pagina">
      <header className="carrito__cabecera">
        <span className="carrito__cabecera-foto" aria-hidden="true">
          <img src="/imagenes/carrito.jpg" alt="" loading="lazy" decoding="async" />
        </span>

        <div className="carrito__cabecera-textos">
          <h1 className="carrito__titulo">Carrito de compras</h1>
          <p className="carrito__resumen-linea">
            {items.length} {items.length === 1 ? 'producto' : 'productos'} ·{' '}
            {unidades} {unidades === 1 ? 'unidad' : 'unidades'}
          </p>
        </div>
      </header>

      {/* Listado de ítems agregados */}
      <div className="carrito__lista">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="carrito__item-cabecera">
              <h3 className="carrito__nombre">{item.nombre}</h3>
              {/* Botón para remover ítem */}
              <Boton variante="peligro" tamano="sm" onClick={() => quitar(item.id)}>
                Eliminar
              </Boton>
            </div>

            <p className="carrito__precio-unitario">
              Precio unitario: {formatearSoles(item.precio)}
            </p>

            {/* Selector de cantidad y subtotal */}
            <div className="carrito__controles">
              <label
                htmlFor={`cant-${item.id}`}
                className="carrito__etiqueta-cantidad"
              >
                Cantidad:
              </label>
              <Input
                id={`cant-${item.id}`}
                className="carrito__cantidad"
                type="number"
                min="1"
                value={item.cantidad}
                onChange={(e) => cambiarCantidad(item.id, parseInt(e.target.value, 10) || 1)}
              />
              <span className="carrito__subtotal">
                Subtotal: {formatearSoles(item.precio * item.cantidad)}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Resumen del pedido y acciones globales */}
      <Card className="carrito__resumen">
        <div className="carrito__total-fila">
          <span className="carrito__total-etiqueta">Total:</span>
          <span className="carrito__total-monto">{formatearSoles(total)}</span>
        </div>

        <div className="carrito__acciones">
          <Boton como={Link} to={RUTAS.CHECKOUT} variante="primario">
            Proceder al pago
          </Boton>
          <Boton variante="contorno" onClick={vaciar}>
            Vaciar carrito
          </Boton>
        </div>
      </Card>
    </div>
  );
};

export default CarritoPage;
