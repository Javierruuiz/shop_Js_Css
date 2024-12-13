window.onload = () => {
    loadCartFromLocalStorage();
    updateCartView();

    let cart = document.getElementById("categories");
    cartCategories(cart);

    const cartButton = document.querySelector(".user-actions a:nth-child(2)");

    // Abre el carrito al hacer clic en el botón
    cartButton.addEventListener("click", (e) => {
        e.preventDefault();
        showCart();
    });

    const overlay = document.getElementById("overlay");
    overlay.style.display = "none"; 
    const closeOverlay = document.getElementById("close-overlay");

    // Cierra el overlay
    closeOverlay.addEventListener("click", () => {
        overlay.style.display = "none";
    });

    // Detecta el scroll para cargar más productos
    window.addEventListener("scroll", () => {
        if (!peticion) autoScroll();
    });

    document.getElementById("cerrarCarrito").addEventListener("click", () => {
        const cartWindow = document.getElementById("ventanaCarrito");
        cartWindow.style.display = "none"; 
        document.getElementById("overlay").style.display = "none"; 
    });
};

const imagenPorDefecto = './fotos/errorCarga.png';

// Función para mostrar el spinner de carga
function mostrarSpinner() {
    document.getElementById("loadingSpinner").style.display = "block";
}

// Función para ocultar el spinner de carga
function ocultarSpinner() {
    document.getElementById("loadingSpinner").style.display = "none";
}

// Función para alternar la visibilidad del login
function toggleLogin() {
    const loginLayer = document.getElementById("login-layer");
    loginLayer.classList.toggle("hidden");
}

// Función para cargar las categorías
function cartCategories(cart) {
    mostrarSpinner();
    const url = "https://api.escuelajs.co/api/v1/categories";

    fetch(url, { method: "GET" })
        .then((res) => res.json())
        .then((datos) => {
            ocultarSpinner();
            Object.entries(datos).slice(0, 5).forEach(category => {
                const div = document.createElement("div");
                div.setAttribute("class", "category-item");
                div.dataset.id = category[1].id;

                const img = document.createElement("img");
                if (category[1].image !== "N/A" && category[1].image !== "") {
                    img.src = category[1].image;
                    img.alt = category[1].name;
                } else {
                    img.src = imagenPorDefecto;
                }

                const name = document.createElement("p");
                name.textContent = category[1].name;

                div.appendChild(img);
                div.appendChild(name);

                div.addEventListener("click", () => {
                    showProducts(category[1].id);
                });

                cart.appendChild(div);
            });
        })
        .catch((err) => console.log("Error: " + err));
}

let currentPage = 1; 
let totalPages = 0; 
let peticion = false;

// Función para cargar productos de una categoría
function showProducts(categoryId) {
    const overlay = document.getElementById("overlay");
    const overlayProducts = document.getElementById("overlay-products");

    overlayProducts.innerHTML = "";
    mostrarSpinner();

    // Asegurarse de que el botón de cerrar solo se agregue una vez
    const existingCloseButton = overlay.querySelector(".close-button");
    if (!existingCloseButton) {
        const closeButton = document.createElement("button");
        closeButton.textContent = "Cerrar";
        closeButton.setAttribute("class", "close-button");

        closeButton.addEventListener("click", () => {
            overlay.style.display = "none"; 
            overlay.removeEventListener("scroll", handleScroll); 
        });

        overlay.appendChild(closeButton); 
    }

    if (!categoryId) return;

    let offset = 0; 
    const limit = 10; 
    let loading = false; 
    let hasMoreProducts = true; 

    // Función para cargar productos en la vista
    function loadProducts() {
        if (loading || !hasMoreProducts) return;
        loading = true;
        mostrarSpinner();

        fetch(`https://api.escuelajs.co/api/v1/products/?categoryId=${categoryId}&offset=${offset}&limit=${limit}`)
            .then((res) => res.json())
            .then((products) => {
                ocultarSpinner();

                if (products.length > 0) {
                    products.forEach(product => {
                        let productDiv = document.createElement("div");
                        productDiv.setAttribute("class", "product-item");
                        productDiv.dataset.id = product.id;

                        let img = document.createElement("img");
                        img.src = product.images[0] || imagenPorDefecto;
                        img.alt = product.title;

                        let title = document.createElement("p");
                        title.textContent = product.title;

                        let price = document.createElement("p");
                        price.textContent = `$${product.price}`;
                        price.setAttribute("class", "product-price");

                        productDiv.appendChild(img);
                        productDiv.appendChild(title);
                        productDiv.appendChild(price);

                        productDiv.addEventListener("click", () => {
                            showProductDetails(product.id);
                        });

                        overlayProducts.appendChild(productDiv);
                    });

                    offset += limit;
                }

                // Si no se obtienen productos, significa que llegamos al final
                if (products.length < limit) {
                    hasMoreProducts = false;
                    console.log("No hay más productos para cargar.");
                }

                loading = false;
            })
            .catch((err) => {
                console.log("Error: " + err);
                ocultarSpinner();
                loading = false;
            });
    }

    // Función que se ejecuta cuando se hace scroll en el overlay
    function handleScroll() {
        const { scrollTop, scrollHeight, clientHeight } = overlay;
        if (scrollTop + clientHeight >= scrollHeight - 200) { 
            loadProducts();
        }
    }

    loadProducts(); 
    overlay.style.display = "flex"; 
    overlay.addEventListener("scroll", handleScroll);
}

// Función para mostrar los detalles de un producto
function showProductDetails(productId) {
    const productDetailOverlay = document.createElement("div");
    productDetailOverlay.setAttribute("class", "product-detail-overlay");

    mostrarSpinner();

    fetch(`https://api.escuelajs.co/api/v1/products/${productId}`)
        .then((res) => res.json())
        .then((product) => {
            ocultarSpinner();

            productDetailOverlay.innerHTML = `
                <div class="product-detail">
                    <button class="close-detail">X</button>
                    <img src="${product.images[0] || imagenPorDefecto}" alt="${product.title}" class="product-detail-img">
                    <h2>${product.title}</h2>
                    <p>${product.description}</p>
                    <p class="product-detail-price">$${product.price}</p>
                    <button class="add-to-cart">Añadir al carrito</button>
                </div>
            `;

            const closeDetail = productDetailOverlay.querySelector(".close-detail");
            closeDetail.addEventListener("click", () => {
                productDetailOverlay.remove();
            });

            const addToCartButton = productDetailOverlay.querySelector(".add-to-cart");
            addToCartButton.addEventListener("click", () => {
                addToCart({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.images[0] || imagenPorDefecto,
                });
            });
            document.body.appendChild(productDetailOverlay);
        })
        .catch((err) => {
            ocultarSpinner();
            console.log("Error al cargar detalles del producto: " + err);
        });
}

let cart = [];

// Función para actualizar la vista del carrito
function updateCartView() {
    const cartList = document.getElementById("listadoCarrito");
    const cartTotal = document.getElementById("carritoTotal");

    cartList.innerHTML = "";

    cart.forEach((item, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <img src="${item.image}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
            <div>
                <span>${item.title} (${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}</span>
                <div>
                    <button class="cart-add" data-index="${index}">+</button>
                    <button class="cart-subtract" data-index="${index}">-</button>
                    <button class="cart-remove" data-index="${index}">Eliminar</button>
                </div>
            </div>
        </div>
    `;

        cartList.appendChild(li);
    });

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartTotal.textContent = total.toFixed(2);

    document.querySelectorAll(".cart-add").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            cart[index].quantity++;
            updateCartView();
            saveCartToLocalStorage();
        })
    );

    document.querySelectorAll(".cart-subtract").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            if (cart[index].quantity > 1) {
                cart[index].quantity--;
            } else {
                cart.splice(index, 1);
            }
            updateCartView();
            saveCartToLocalStorage(); 
        })
    );

    document.querySelectorAll(".cart-remove").forEach((btn) =>
        btn.addEventListener("click", (e) => {
            const index = e.target.dataset.index;
            cart.splice(index, 1);
            updateCartView();
            saveCartToLocalStorage(); 
        })
    );
}

// Función para agregar productos al carrito
function addToCart(product) {
    const existingProduct = cart.find((item) => item.id === product.id);

    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartView();
    saveCartToLocalStorage(); // Guardar cambios
}


// Función para mostrar el carrito
function showCart() {
    const cartWindow = document.getElementById("ventanaCarrito");
    cartWindow.style.display = "block";
}

// Función para cerrar el carrito
function closeCart() {
    const cartWindow = document.getElementById("ventanaCarrito");
    cartWindow.style.display = "none";
}

// Función para vaciar el carrito después de realizar un pedido
function realizarPedido() {
    if (cart.length === 0) {
        alert("El carrito está vacío. No puedes realizar una compra.");
        return;
    }

    alert("¡Artículos comprados con éxito!");
    cart = []; // Vaciar el carrito
    updateCartView(); // Actualizar la vista
    closeCart(); // Cerrar el carrito
}

// Asignar eventos
document.getElementById("cerrarCarrito").addEventListener("click", closeCart);
document.getElementById("realizarPedido").addEventListener("click", realizarPedido);
// Almacena el carrito en localStorage
function saveCartToLocalStorage() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Carga el carrito desde localStorage
function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}