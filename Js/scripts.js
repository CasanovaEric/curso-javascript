// 1. Variables globales y selectores del DOM
let productos = [];
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

const contenedorProductos = document.getElementById("contenedor-productos");
const itemsCarrito = document.getElementById("items-carrito");
const precioTotal = document.getElementById("precio-total");
const btnVaciar = document.getElementById("vaciar-carrito");
const btnFinalizar = document.getElementById("finalizar-compra");

// 2. Inicialización de la App
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarInterfazCarrito();
});

// 3. Petición Asíncrona (Fetch)
async function cargarProductos() {
    try {
        const response = await fetch("productos.json");
        productos = await response.json();
        renderizarProductos(productos);
    } catch (error) {
        Swal.fire("Error", "No se pudieron cargar los productos.", "error");
    }
}

// 4. Renderizar productos en la tienda
function renderizarProductos(listaProductos) {
    contenedorProductos.innerHTML = "";
    listaProductos.forEach(prod => {
        const div = document.createElement("div");
        div.classList.add("producto-tarjeta");
        div.innerHTML = `
    <img src="${prod.imagen}" alt="${prod.nombre}">
    <h3>${prod.nombre}</h3>
    <p class="tamano">${prod.tamano}</p> <!-- Nueva línea -->
    <p class="precio">$${prod.precio}</p>
    <button class="btn-agregar" data-id="${prod.id}">Agregar al carrito</button>
`;
        contenedorProductos.appendChild(div);
    });
    
    // Asignar eventos a los botones de agregar
    const botonesAgregar = document.querySelectorAll(".btn-agregar");
    botonesAgregar.forEach(boton => {
        boton.addEventListener("click", agregarAlCarrito);
    });
}

// 5. Lógica del Carrito (Agregar, Restar, Eliminar)
function agregarAlCarrito(e) {
    const idProducto = parseInt(e.target.dataset.id);
    const productoExiste = carrito.find(prod => prod.id === idProducto);

    if (productoExiste) {
        productoExiste.cantidad++;
    } else {
        const productoBase = productos.find(prod => prod.id === idProducto);
        carrito.push({ ...productoBase, cantidad: 1 });
    }

    // Librería: Notificación flotante al agregar
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
    const producto = carrito.find(prod => prod.id === id);
    
    if (accion === "sumar") {
        producto.cantidad++;
    } else if (accion === "restar") {
        producto.cantidad--;
        if (producto.cantidad === 0) {
            carrito = carrito.filter(prod => prod.id !== id);
        }
    }
    guardarYActualizar();
}

// 6. Sincronización, Render del Carrito y Totales
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

    // Asignar eventos a los botones dentro del carrito
    document.querySelectorAll(".btn-sumar").forEach(btn => {
        btn.addEventListener("click", (e) => modificarCantidad(parseInt(e.target.dataset.id), "sumar"));
    });

    document.querySelectorAll(".btn-restar").forEach(btn => {
        btn.addEventListener("click", (e) => modificarCantidad(parseInt(e.target.dataset.id), "restar"));
    });

    // Calcular e inyectar el total
    const total = carrito.reduce((acc, prod) => acc + (prod.precio * prod.cantidad), 0);
    precioTotal.innerText = total;
}

// 7. Eventos de Control de Compra (Librerías incorporadas)
btnVaciar.addEventListener("click", () => {
    if (carrito.length === 0) return;
    
    carrito = [];
    guardarYActualizar();
    Swal.fire("Carrito vaciado", "Se eliminaron todos los productos.", "info");
});

btnFinalizar.addEventListener("click", () => {
    if (carrito.length === 0) {
        Swal.fire("Carrito vacío", "No tienes productos para comprar.", "warning");
        return;
    }

    Swal.fire({
        title: "¡Compra exitosa!",
        text: "Gracias por tu simulación de compra.",
        icon: "success",
        confirmButtonText: "Genial"
    });

    carrito = [];
    guardarYActualizar();
});