let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const contenedorProductos = document.getElementById("contenedor-productos");
const itemsCarrito = document.getElementById("items-carrito");
const precioTotal = document.getElementById("precio-total");
const btnVaciar = document.getElementById("vaciar-carrito");
const btnFinalizar = document.getElementById("finalizar-compra");

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
});

async function cargarProductos() {
    try {
        const response = await fetch("data/productos.json");
        productos = await response.json();
        renderizarProductos(productos);
        actualizarInterfazCarrito();
    } catch (error) {
        Swal.fire("Error", "No se pudieron cargar los productos.", "error");
    }
}

function renderizarProductos(listaProductos) {
    contenedorProductos.innerHTML = "";
    listaProductos.forEach(prod => {
        const div = document.createElement("div");
        div.classList.add("producto-tarjeta");
        
        const sinStock = prod.stock <= 0;
        const textoBoton = sinStock ? "Sin Stock" : "Agregar al carrito";
        const claseBoton = sinStock ? "btn-agregar agotado" : "btn-agregar";
        const atributoDeshabilitado = sinStock ? "disabled" : "";

        div.innerHTML = `
            <img src="${prod.imagen}" alt="${prod.nombre}">
            <h3>${prod.nombre}</h3>
            <p class="tamano">${prod.tamano}</p>
            <p class="stock">Disponibles: ${prod.stock}</p>
            <p class="precio">$${prod.precio}</p>
            <button class="${claseBoton}" data-id="${prod.id}" ${atributoDeshabilitado}>${textoBoton}</button>
        `;
        contenedorProductos.appendChild(div);
    });
    
    const botonesAgregar = document.querySelectorAll(".btn-agregar:not([disabled])");
    botonesAgregar.forEach(boton => {
        boton.addEventListener("click", agregarAlCarrito);
    });
}

function agregarAlCarrito(e) {
    const idProducto = parseInt(e.target.dataset.id);
    const productoBase = productos.find(prod => prod.id === idProducto);
    const productoExiste = carrito.find(prod => prod.id === idProducto);

    if (productoBase.stock <= 0) {
        Swal.fire("Agotado", "Lo sentimos, no queda stock de este producto.", "warning");
        return;
    }

    if (productoExiste) {
        if (productoExiste.cantidad >= productoBase.stock) {
            Swal.fire("Límite alcanzado", `Solo quedan ${productoBase.stock} unidades disponibles de este producto.`, "warning");
            return;
        }
        productoExiste.cantidad++;
    } else {
        carrito.push({ ...productoBase, cantidad: 1 });
    }

    Swal.fire({
        text: "Producto añadido al carrito",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500
    });

    guardarYActualizar();
}

function modificarCantidad(id, accion) {
    const productoCarrito = carrito.find(prod => prod.id === id);
    const productoBase = productos.find(prod => prod.id === id);
    
    if (accion === "sumar") {
        if (productoCarrito.cantidad >= productoBase.stock) {
            Swal.fire("Límite alcanzado", "No puedes agregar más unidades de las disponibles en stock.", "warning");
            return;
        }
        productoCarrito.cantidad++;
    } else if (accion === "restar") {
        productoCarrito.cantidad--;
        if (productoCarrito.cantidad === 0) {
            carrito = carrito.filter(prod => prod.id !== id);
        }
    }
    guardarYActualizar();
}

function guardarYActualizar() {
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarInterfazCarrito();
}

function actualizarInterfazCarrito() {
    itemsCarrito.innerHTML = "";

    if (carrito.length === 0) {
        itemsCarrito.innerHTML = "<p>El carrito está vacío.</p>";
        precioTotal.innerText = "0";
        return;
    }

    carrito.forEach(prod => {
        const div = document.createElement("div");
        div.classList.add("item-carrito");
        div.innerHTML = `
            <h4>${prod.nombre}</h4>
            <p>Precio: $${prod.precio} x ${prod.cantidad}</p>
            <div class="controles-cantidad">
                <button class="btn-restar" data-id="${prod.id}">-</button>
                <span>${prod.cantidad}</span>
                <button class="btn-sumar" data-id="${prod.id}">+</button>
            </div>
            <hr>
        `;
        itemsCarrito.appendChild(div);
    });

    document.querySelectorAll(".btn-sumar").forEach(btn => {
        btn.addEventListener("click", (e) => modificarCantidad(parseInt(e.target.dataset.id), "sumar"));
    });

    document.querySelectorAll(".btn-restar").forEach(btn => {
        btn.addEventListener("click", (e) => modificarCantidad(parseInt(e.target.dataset.id), "restar"));
    });

    const total = carrito.reduce((acc, prod) => acc + (prod.precio * prod.cantidad), 0);
    precioTotal.innerText = total;
}

btnVaciar.addEventListener("click", () => {
    if (carrito.length === 0) return;
    
    carrito = [];
    guardarYActualizar();
    Swal.fire("Carrito vaciado", "Se eliminaron todos los productos.", "info");
});

btnFinalizar.addEventListener("click", async () => {
    if (carrito.length === 0) {
        Swal.fire("Carrito vacío", "No tienes productos para comprar.", "warning");
        return;
    }

    const { value: datosPersonales } = await Swal.fire({
        title: "Paso 1: Datos Personales",
        html: `
            <input id="swal-nombre" class="swal2-input" placeholder="Nombre">
            <input id="swal-apellido" class="swal2-input" placeholder="Apellido">
            <input id="swal-email" type="email" class="swal2-input" placeholder="Correo Electrónico">
        `,
        focusConfirm: false,
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        confirmButtonText: "Siguiente ➔",
        preConfirm: () => {
            const nombre = document.getElementById("swal-nombre").value.trim();
            const apellido = document.getElementById("swal-apellido").value.trim();
            const email = document.getElementById("swal-email").value.trim();

            if (!nombre || !apellido || !email) {
                Swal.showValidationMessage("Por favor, completa todos los campos");
                return false;
            }
            return { nombre, apellido, email };
        }
    });

    if (!datosPersonales) return;

    const { value: datosPago } = await Swal.fire({
        title: "Paso 2: Datos de Pago",
        text: `Monto a abonar: $${precioTotal.innerText}`,
        html: `
            <input id="swal-tarjeta" class="swal2-input" placeholder="Número de Tarjeta (16 dígitos)" maxlength="16">
            <div style="display: flex; gap: 10px; max-width: 280px; margin: 0 auto;">
                <input id="swal-vence" class="swal2-input" placeholder="MM/AA" maxlength="5" style="width: 50%;">
                <input id="swal-cvv" type="password" class="swal2-input" placeholder="CVV" maxlength="3" style="width: 50%;">
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        cancelButtonText: "Atrás",
        confirmButtonText: "Finalizar Compra ✔",
        preConfirm: () => {
            const tarjeta = document.getElementById("swal-tarjeta").value.trim();
            const vence = document.getElementById("swal-vence").value.trim();
            const cvv = document.getElementById("swal-cvv").value.trim();

            if (!tarjeta || !vence || !cvv) {
                Swal.showValidationMessage("Por favor, completa los datos de tu tarjeta");
                return false;
            }
            if (tarjeta.length < 16) {
                Swal.showValidationMessage("El número de tarjeta debe tener 16 dígitos");
                return false;
            }
            return { tarjeta, vence, cvv };
        }
    });

    if (!datosPago) return;

    carrito.forEach(itemCarrito => {
        const prodOriginal = productos.find(p => p.id === itemCarrito.id);
        if (prodOriginal) {
            prodOriginal.stock -= itemCarrito.cantidad;
        }
    });

    renderizarProductos(productos);

    Swal.fire({
        title: "¡Compra realizada con éxito!",
        text: `¡Gracias por tu compra, ${datosPersonales.nombre}! Enviamos el comprobante a ${datosPersonales.email}.`,
        icon: "success",
        confirmButtonText: "Genial"
    });

    carrito = [];
    guardarYActualizar();
});