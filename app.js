import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, onChildAdded } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBft_9j0yQ0jYY8znpEYXAf7yVZaM_KaXo",
    authDomain: "bigbrain-jar.firebaseapp.com",
    databaseURL: "https://bigbrain-jar-default-rtdb.firebaseio.com",
    projectId: "bigbrain-jar",
    storageBucket: "bigbrain-jar.appspot.com",
    messagingSenderId: "983264354765",
    appId: "1:983264354765:web:e35c227cb2f21d3d6b6484",
    measurementId: "G-R9VCMR79X1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth();

let currentUser = null;

// DOM content loaded event
document.addEventListener('DOMContentLoaded', function () {
    const postForm = document.getElementById('postForm');
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const logoutButton = document.getElementById('logoutButton');
    const usernameInput = document.getElementById('username');
    const postsDiv = document.getElementById('posts');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordButton = document.getElementById('resetPasswordButton');
    const forgotPasswordEmail = document.getElementById('forgotPasswordEmail');
    const forgotPasswordButton = document.getElementById('forgotPasswordButton');

    // Check for logged-in user
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            document.getElementById('welcomeMessage').textContent = `Welcome, ${user.email}`;
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('logoutButton').style.display = 'block';
            postForm.style.display = 'block';
        } else {
            currentUser = null;
            document.getElementById('welcomeMessage').textContent = '';
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'block';
            document.getElementById('logoutButton').style.display = 'none';
            postForm.style.display = 'none';
        }
    });

    // Register new user
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const username = document.getElementById('registerUsername').value;

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                sendEmailVerification(user).then(() => {
                    alert("Verification email sent!");
                    set(ref(database, 'users/' + user.uid), {
                        username: username,
                        email: email
                    });
                }).catch(error => {
                    alert(error.message);
                });
            })
            .catch(error => {
                alert(error.message);
            });
    });

    // Login user
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                alert("Logged in successfully!");
            })
            .catch(error => {
                alert(error.message);
            });
    });

    // Forgot password toggle
    forgotPasswordButton.addEventListener('click', () => {
        forgotPasswordForm.style.display = forgotPasswordForm.style.display === 'block' ? 'none' : 'block';
    });

    // Forgot password functionality
    resetPasswordButton.addEventListener('click', () => {
        const email = forgotPasswordEmail.value;
        if (email) {
            sendPasswordResetEmail(auth, email)
                .then(() => {
                    alert("Password reset email sent!");
                })
                .catch((error) => {
                    alert(error.message);
                });
        } else {
            alert("Please enter an email.");
        }
    });

    // Logout user
    logoutButton.addEventListener('click', () => {
        auth.signOut().then(() => {
            alert("Logged out successfully!");
        }).catch(error => {
            alert(error.message);
        });
    });

    // Post form submission
    postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = document.getElementById('content').value;
        if (content && currentUser && content.length >= 5) {
            const postsRef = ref(database, 'posts');
            const newPostRef = push(postsRef);

            // Fetch the username from the database
            const userRef = ref(database, 'users/' + currentUser.uid);
            onValue(userRef, (snapshot) => {
                const user = snapshot.val();
                const username = user ? user.username : 'Anonymous';

                // Save post with 12-hour formatted time
                const timestamp = Date.now();
                const postDate = new Date(timestamp);
                const formattedTime = postDate.toLocaleString('en-US', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                });

                set(newPostRef, {
                    content: content,
                    timestamp: timestamp,
                    username: username,
                    formattedTime: formattedTime, // Store formatted time
                    likes: 0,
                    dislikes: 0
                });
            });

            document.getElementById('content').value = ''; // Clear the textarea
        } else {
            alert("Post content must be at least 5 characters.");
        }
    });

    // Load posts from Firebase in descending order by timestamp
    const postsRef = ref(database, 'posts');
    onChildAdded(postsRef, (snapshot) => {
        const post = snapshot.val();
        const postsDiv = document.getElementById('posts');
        
        // Create a new div for the post
        const div = document.createElement('div');
        div.className = 'post';
        const formattedDate = new Date(post.timestamp);
        const formattedTime = post.formattedTime; // Use stored formatted time
        div.innerHTML = `
            <strong>${post.username} (Posted on ${formattedDate.toLocaleDateString()} at ${formattedTime})</strong><br>
            ${post.content}<br>
            <button class="likeButton" data-id="${snapshot.key}">Like (${post.likes})</button>
            <button class="dislikeButton" data-id="${snapshot.key}">Dislike (${post.dislikes})</button>
        `;
        
        // Prepend the new post to the top of the posts div
        postsDiv.insertBefore(div, postsDiv.firstChild);

        // Add like/dislike functionality
        const likeButton = div.querySelector('.likeButton');
        likeButton.addEventListener('click', (e) => {
            const postId = e.target.dataset.id;
            const postRef = ref(database, 'posts/' + postId);
            postRef.once('value', (snapshot) => {
                const post = snapshot.val();
                set(postRef, {
                    ...post,
                    likes: post.likes + 1
                });
            });
        });

        const dislikeButton = div.querySelector('.dislikeButton');
        dislikeButton.addEventListener('click', (e) => {
            const postId = e.target.dataset.id;
            const postRef = ref(database, 'posts/' + postId);
            postRef.once('value', (snapshot) => {
                const post = snapshot.val();
                set(postRef, {
                    ...post,
                    dislikes: post.dislikes + 1
                });
            });
        });
    });
});
