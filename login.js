let isLoginMode = true;

const formTitle = document.getElementById('formTitle');
const authSubtitle = document.getElementById('authSubtitle');
const submitBtn = document.getElementById('submitBtn');
const switchMode = document.getElementById('switchMode');
const toggleContainer = document.getElementById('toggleContainer');

// Selection references for our newly injected components
const signupFields = document.querySelectorAll('.signup-only');
const authNameInput = document.getElementById('authName');
const authPhoneInput = document.getElementById('authPhone');

// 1. SESSION CHECK
const checkActiveSession = () => {
    const activeUser = localStorage.getItem('activePortalUser');
    if (activeUser) {
        window.location.href = "dashboard.html";
    }
};
checkActiveSession();

// 2. UI TOGGLE ENGINE WITH COMPONENT EXTENSIONS
function bindToggleUI() {
    isLoginMode = !isLoginMode;
    
    if (isLoginMode) {
        formTitle.innerText = "Login to Portal";
        authSubtitle.innerText = "Log in to manage your rental listings";
        submitBtn.innerText = "Login";
        toggleContainer.innerHTML = `Don't have an account? <span id="switchMode">Sign Up</span>`;
        
        // Hide name and mobile options
        signupFields.forEach(el => el.style.display = 'none');
        authNameInput.removeAttribute('required');
        authPhoneInput.removeAttribute('required');
    } else {
        formTitle.innerText = "Create Account";
        authSubtitle.innerText = "Get started with your localized workspace";
        submitBtn.innerText = "Register Now";
        toggleContainer.innerHTML = `Already have an account? <span id="switchMode">Login</span>`;
        
        // Reveal name and mobile options
        signupFields.forEach(el => el.style.display = 'block');
        authNameInput.setAttribute('required', 'true');
        authPhoneInput.setAttribute('required', 'true');
    }
    
    document.getElementById('switchMode').addEventListener('click', bindToggleUI);
}

switchMode.addEventListener('click', bindToggleUI);

// 3. STORAGE TRANSFORMATION CORE SYSTEM
document.getElementById('authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    
    let users = JSON.parse(localStorage.getItem('portalUsers')) || [];

    if (isLoginMode) {
        const verifiedUser = users.find(u => u.email === email && u.password === password);
        
        if (verifiedUser) {
            alert("Login Successful! Redirecting...");
            localStorage.setItem('activePortalUser', JSON.stringify(verifiedUser));
            window.location.href = "dashboard.html";
        } else {
            alert("Login Error: Invalid email or password credentials. Please try again.");
        }
    } else {
        const userExists = users.some(u => u.email === email);
        if (userExists) {
            alert("Signup Error: An account with this email address already exists!");
            return;
        }
        
        const newUser = {
            id: 'usr_' + Date.now(),
            userName: authNameInput.value.trim(),
            mobileNo: authPhoneInput.value.trim(),
            email: email,
            password: password
        };
        
        users.push(newUser);
        localStorage.setItem('portalUsers', JSON.stringify(users));
        localStorage.setItem('activePortalUser', JSON.stringify(newUser));
        
        alert("Account Created Successfully! Welcome to Portal.");
        window.location.href = "dashboard.html";
    }
});