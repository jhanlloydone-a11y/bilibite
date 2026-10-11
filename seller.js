import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    push,
    remove,
    update,
    onValue
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";


// Firebase configuration
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
const auth = getAuth(app);
const db = getDatabase(app);


// Get elements from HTML
const sellerName = document.getElementById("sellerName");
const addFoodButton = document.getElementById("addFoodButton");
const cancelButton = document.getElementById("cancelButton");
const addProductSection = document.getElementById("addProductSection");
const productForm = document.getElementById("productForm");
const productList = document.getElementById("productList");


// Show / hide the form
addFoodButton.addEventListener("click", function() {
    addProductSection.style.display = "block";
});

cancelButton.addEventListener("click", function() {
    addProductSection.style.display = "none";
    productForm.reset();
});


// Make text safe before putting it inside HTML
function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}


// Shrink the image so it's small enough to save in the database
function resizeImage(file) {
    return new Promise(function(resolve, reject) {

        const reader = new FileReader();

        reader.onload = function() {

            const img = new Image();

            img.onload = function() {
                const maxWidth = 400;
                const scale = Math.min(1, maxWidth / img.width);

                const canvas = document.createElement("canvas");
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL("image/jpeg", 0.7));
            };

            img.onerror = reject;
            img.src = reader.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}


// Check who is logged in
onAuthStateChanged(auth, function(user) {

    // Not logged in? Go back to login
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Show seller's name
    sellerName.textContent = user.displayName || "Seller";

    // This seller's own drawer in the database
    const myProductsRef = ref(db, "products/" + user.uid);


    // ===== ADD FOOD =====
    productForm.addEventListener("submit", async function(event) {

        // Stop the page from refreshing
        event.preventDefault();

        const saveButton = productForm.querySelector(".save-button");
        saveButton.disabled = true;
        saveButton.textContent = "Saving...";

        try {
            const file = document.getElementById("productImage").files[0];
            const image = await resizeImage(file);

            // Save to products/{uid}
            await push(myProductsRef, {
                name: document.getElementById("productName").value,
                description: document.getElementById("productDescription").value,
                price: Number(document.getElementById("productPrice").value),
                image: image,
                sellerName: user.displayName || "Seller",
                sellerId: user.uid

                
            });

            productForm.reset();
            addProductSection.style.display = "none";

        } catch (error) {
            console.error(error);
            alert("May error sa pag-save. Tingnan ang console (F12).");
        }

        saveButton.disabled = false;
        saveButton.textContent = "Add Product";
    });


    // ===== SHOW MY PRODUCTS =====
    onValue(myProductsRef, function(snapshot) {

        productList.innerHTML = "";

        // No products yet
        if (!snapshot.exists()) {
            productList.innerHTML = `<p class="empty-message">Wala ka pang products. Pindutin ang "+ Add Food"!</p>`;
            return;
        }

        snapshot.forEach(function(child) {

            const product = child.val();

            if (!product.sellerName) {
        update(ref(db, "products/" + user.uid + "/" + child.key), {
            sellerName: user.displayName || "Seller"
        });
    }

            const card = document.createElement("div");
            card.className = "product-card";

            card.innerHTML = `
                <img src="${product.image}" alt="${escapeHTML(product.name)}">

                <div class="product-info">
                    <h3>${escapeHTML(product.name)}</h3>
                    <p>${escapeHTML(product.description)}</p>
                    <p class="price">₱${product.price}</p>
                    <button class="delete-button">Delete Product</button>
                </div>
            `;

            // Delete button
            card.querySelector(".delete-button").addEventListener("click", function() {
                if (confirm("Burahin ang product na ito?")) {
                    remove(ref(db, "products/" + user.uid + "/" + child.key));
                }
            });

            productList.appendChild(card);
        });
    });

});