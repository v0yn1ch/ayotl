import { obtenerCarrito } from "./pages/carrito/carrito.js";
import { cargarCarritoDesdeLocalStorage } from "./pages/carrito/carrito.js";
import { renderizarCarritoEnNavbar } from "./components/navbar/navbar.js";
import { initWishlist } from "./pages/wishlist/wishlist.js";

// Función para cargar CSS específico de una página
function cargarEstilos(id, url) {
  if (document.getElementById(id)) return; // Si ya existe, no lo cargues de nuevo

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

// Función para cargar JS específico de una página como script estándar
function cargarScript(id, url) {
  if (document.getElementById(id)) return; // Si ya existe, no lo cargues de nuevo

  const script = document.createElement("script");
  script.defer = true;
  script.id = id;
  script.src = url;
  document.head.appendChild(script);
}

// Función para cargar un módulo dinámicamente y ejecutar su contenido si es necesario
async function cargarYEjecutarFuncion(url) {
  try {
    console.log(`Cargando módulo desde URL: ${url}`);

    const modulo = await import(url); // Cargar el módulo dinámicamente

    if (modulo.default) {
      console.log("Ejecutando exportación predeterminada del módulo.");
      modulo.default(); // Ejecutar la función predeterminada si existe
    } else if (modulo.init) {
      console.log("Ejecutando función 'init' del módulo.");
      modulo.init(); // Ejecutar una función específica opcional como 'init'
    } else {
      console.log(
        "El módulo no tiene funciones específicas para ejecutar. Solo cargado.",
      );
    }
  } catch (error) {
    console.error("Error al cargar o ejecutar el módulo:", error);
  }
}

// Función para limpiar CSS y JS específicos al cambiar de página
function limpiarRecursosPagina() {
  const css = document.getElementById("estilos-pagina");
  const js = document.getElementById("script-pagina");
  if (css) css.remove();
  if (js) js.remove();
}

// Función para cargar el contenido principal, CSS y JS de cada página
async function cargarPagina(pagina, module = true) {
  try {
    limpiarRecursosPagina(); // Limpia recursos de la página anterior

    const respuesta = await fetch(`./pages/${pagina}/${pagina}.html`);
    if (!respuesta.ok) {
      document.getElementById("main-content").innerHTML =
        "<p>Página no encontrada.</p>";
      window.scrollTo(0, 0); // Desplaza al inicio incluso en caso de error
      return;
    }

    const contenido = await respuesta.text();
    document.getElementById("main-content").innerHTML = contenido;

    // Actualiza el historial
    window.history.pushState({ pagina }, "", `#${pagina}`);

    // Asegúrate de cargar estilos y scripts
    cargarEstilos("estilos-pagina", `./pages/${pagina}/${pagina}.css`);
    if (module) {
      await cargarYEjecutarFuncion(`./pages/${pagina}/${pagina}.js`);
    } else {
      cargarScript("script-pagina", `./pages/${pagina}/${pagina}.js`);
    }

    // Forzar scroll al inicio
    window.scrollTo(0, 0);
  } catch (error) {
    document.getElementById("main-content").innerHTML =
      "<p>Error al cargar la página.</p>";
    window.scrollTo(0, 0); // En caso de error también fuerza el scroll
    console.error("Error al cargar la página:", error);
  }
}

// Inicializa la página principal
function iniciarEnrutador() {
  const paginaInicial = window.location.hash.substring(1) || "inicio";

  let flagModule = true;
  switch (paginaInicial) {
    case "inicio":
    case "contactenos":
      flagModule = false; // Estas páginas no usan módulos
      break;

    default:
      flagModule = true; // Otras páginas sí usan módulos
      break;
  }
  cargarPagina(paginaInicial, flagModule);
}

// Función asíncrona para obtener productos de una API
async function fetchProducts(apiEndpoint) {
  try {
    // Llamada a la API
    const response = await fetch(apiEndpoint);

    // Verifica si la respuesta es exitosa
    if (!response.ok) {
      throw new Error(
        `Error en la solicitud: ${response.status} - ${response.statusText}`,
      );
    }

    // Convierte la respuesta a JSON
    const products = await response.json();

    // Imprime o retorna los productos
    console.log("Productos obtenidos:", products);
    return products;
  } catch (error) {
    // Manejo de errores
    console.error("Error al obtener los productos:", error);
  }
}

// Ejemplo de uso
const apiEndpoint = "http://localhost:8080/api/v1/product"; // Reemplaza con tu API real
fetchProducts(apiEndpoint);

function renderizarCarritoPagina() {
  const carrito = obtenerCarrito();
  const lista = document.getElementById("carrito-list");
  const total = document.getElementById("carrito-total-precio");

  // Limpiar contenido actual
  lista.innerHTML = "";

  let totalPrecio = 0;

  // Renderizar productos
  carrito.forEach((producto) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <div class="carrito-item">
        <img src="./assets/imgs/${producto.img}" alt="${producto.title}" width="50" />
        <span>${producto.title}</span>
        <span>${producto.price} x ${producto.cantidad}</span>
        <button data-id="${producto.id}" class="btn-remove">Eliminar</button>
      </div>
    `;
    lista.appendChild(item);
    totalPrecio +=
      parseFloat(producto.price.replace("$", "")) * producto.cantidad;
  });

  // Actualizar precio total
  total.innerText = `$${totalPrecio.toFixed(2)}`;

  // Escuchar clics en botones de eliminar
  lista.addEventListener("click", (event) => {
    if (event.target.classList.contains("btn-remove")) {
      eliminarDelCarrito(event.target.dataset.id);
      renderizarCarritoPagina();
      renderizarCarritoEnNavbar();
    }
  });
}

function loadPage(page) {
  const app = document.getElementById("main-content");

  if (page === "wishlist") {
    fetch("./pages/wishlist/wishlist.html")
      .then((response) => response.text())
      .then((html) => {
        app.innerHTML = html; // Cargar el HTML
        initWishlist(); // Inicializar la lógica de la wishlist
      })
      .catch((error) => console.error("Error al cargar la página:", error));
  }

  if (page === "catalogo") {
    fetch("./pages/catalogo/catalogo.html")
      .then((response) => response.text())
      .then((html) => {
        app.innerHTML = html; // Cargar el HTML del catálogo
        initCatalogo(); // Inicializar la lógica del catálogo
      })
      .catch((error) => console.error("Error al cargar el catálogo:", error));
  }
}

// Escuchar cambios en el hash de la URL
window.addEventListener("hashchange", () => {
  const page = window.location.hash.slice(1);
  loadPage(page);
});

// Cargar la página inicial
document.addEventListener("DOMContentLoaded", () => {
  const page = window.location.hash.slice(1) || "catalogo"; // Página inicial
  loadPage(page);
});

document.addEventListener("DOMContentLoaded", () => {
  cargarCarritoDesdeLocalStorage();
  renderizarCarritoEnNavbar();
});

// Maneja clics en elementos con data-link para navegación
document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-link]");
  if (!link) return;

  event.preventDefault();

  const dataLink = link.getAttribute("data-link");
  if (!dataLink) {
    console.error("El atributo data-link está vacío o no válido.");
    return;
  }

  const [pagina, opcion] = dataLink.split(" ");
  const flagModule = !(opcion === "noModule");

  cargarPagina(pagina, flagModule);
});

// Maneja el historial para navegación hacia atrás y adelante
window.addEventListener("popstate", (e) => {
  const pagina = e.state?.pagina || "inicio";
  cargarPagina(pagina)
    .then(() => {
      window.scrollTo(0, 0); // Forzar el scroll al inicio
    })
    .catch((error) => console.error(error));
});

// Ejecuta el enrutador cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", iniciarEnrutador);

// Exportación opcional para usar en otros scripts
export const bodyContainer = document.querySelector("body");
export const navContainer = document.querySelector("nav");

AOS.init({
  offset: 1,
});
