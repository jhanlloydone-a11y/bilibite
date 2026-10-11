
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getDatabase,
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAQ0h4nVny5sBeEB0rlK81Kl2-c_XcsXGM",
    authDomain: "bilibite.firebaseapp.com",
    databaseURL: "https://bilibite-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "bilibite",
    storageBucket: "bilibite.firebasestorage.app",
    messagingSenderId: "980005954292",
    appId: "1:980005954292:web:68dff460d469d78f1c34a1",
    measurementId: "G-7G80NDJ7CM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const foodList = document.getElementById("foodList");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

let allProducts = [];

onAuthStateChanged(auth, function(user) {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("clientName").textContent =
        user.displayName || "Client";
});

function displayProducts(products) {
    foodList.innerHTML = "";

    if (products.length === 0) {
        foodList.innerHTML =
            "<p class='empty-message'>Walang food na tumutugma sa iyong search.</p>";
        return;
    }

    products.forEach(function(product) {
        const card = document.createElement("div");
        card.className = "product-card";

        const image = document.createElement("img");
        image.alt = product.name;
        image.src = product.image || "";
        image.onerror = function() {
            image.style.display = "none";
        };

        const name = document.createElement("h3");
        name.textContent = product.name || "Unnamed Food";

        const description = document.createElement("p");
        description.textContent = product.description || "";

        const price = document.createElement("p");
        price.className = "price";
        price.textContent = "₱" + (product.price ?? 0);

        const seller = document.createElement("p");
        seller.className = "seller";
        seller.textContent = "Sold by " + (product.sellerName || "Seller");

        card.append(image, name, description, price, seller);
        foodList.appendChild(card);
    });
}

// Load products from all sellers
onValue(
    ref(db, "products"),
    function(snapshot) {
        allProducts = [];

        if (snapshot.exists()) {
            snapshot.forEach(function(sellerSnapshot) {
                sellerSnapshot.forEach(function(productSnapshot) {
                    const product = productSnapshot.val();

                    if (product && product.name) {
                        allProducts.push(product);
                    }
                });
            });
        }

        displayProducts(allProducts);
    },
    function(error) {
        console.error("Error loading products:", error);
        foodList.textContent =
            "Hindi ma-load ang food products. Tingnan ang Firebase Rules at Console.";
    }
);

// Search food name or seller name
function searchProducts() {
    const keyword = searchInput.value.trim().toLowerCase();

    const filteredProducts = allProducts.filter(function(product) {
        return (
            (product.name || "").toLowerCase().includes(keyword) ||
            (product.sellerName || "").toLowerCase().includes(keyword) ||
            (product.description || "").toLowerCase().includes(keyword)
        );
    });

    displayProducts(filteredProducts);
}

searchButton.addEventListener("click", searchProducts);

searchInput.addEventListener("input", searchProducts);
