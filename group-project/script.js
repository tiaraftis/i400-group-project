document.addEventListener('DOMContentLoaded', () => {
    const loginBox = document.getElementById('loginBox');
    const signupBox = document.getElementById('signupBox');
    const showSignupBtn = document.getElementById('showSignup');
    const showLoginBtn = document.getElementById('showLogin');
    
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    const signupPassword = document.getElementById('signupPassword');
    const confirmPassword = document.getElementById('confirmPassword');
    const errorMsg = document.getElementById('errorMsg');

    // Toggle to Sign Up
    showSignupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginBox.classList.remove('active');
        // Clear errors
        errorMsg.classList.remove('show');
        errorMsg.textContent = "";
        
        // Wait for simple transition duration
        setTimeout(() => {
            signupBox.classList.add('active');
        }, 300);
    });

    // Toggle to Log In
    showLoginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        signupBox.classList.remove('active');
        
        setTimeout(() => {
            loginBox.classList.add('active');
        }, 300); 
    });

    // Form Validation for Sign Up (Ensures password double-typing matches)
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page reload
        
        const pwd = signupPassword.value;
        const confirmPwd = confirmPassword.value;
        const name = document.getElementById('signupName').value;

        // Validation for matching passwords
        if (pwd !== confirmPwd) {
            errorMsg.textContent = "Passwords do not match. Please try again.";
            
            // Remove animation class after it plays to allow re-trigger on multiple clicks
            errorMsg.classList.remove('show');
            // Force browser reflow to reset animation
            void errorMsg.offsetWidth;
            errorMsg.classList.add('show');
            return;
        }

        // Hide error message if validation passed
        errorMsg.classList.remove('show');
        errorMsg.textContent = "";

        // Simulated success state for UI feedback
        const btn = signupForm.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = "Creating Account...";
        btn.style.opacity = "0.7";
        btn.style.pointerEvents = "none";

        setTimeout(() => {
            const email = document.getElementById('signupEmail').value;
            localStorage.setItem('registeredEmail', email.toLowerCase());
            localStorage.setItem('registeredName', name);
            localStorage.setItem('registeredPassword', pwd);

            alert(`Account created successfully!\nWelcome to the Bloomington Figure Skating Club, ${name}.`);
            btn.textContent = originalText;
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
            signupForm.reset();
            showLoginBtn.click(); // redirect back to login visually
        }, 1500);
    });

    // Form Simulation for Log In
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById('loginEmail').value.toLowerCase();
        const pwdInput = document.getElementById('loginPassword').value;
        const registeredEmail = localStorage.getItem('registeredEmail');
        const registeredPassword = localStorage.getItem('registeredPassword');
        
        if (!registeredEmail || emailInput !== registeredEmail) {
            alert("Account not found. Please sign up first.");
            return;
        }

        if (pwdInput !== registeredPassword) {
            alert("Incorrect password. Please try again.");
            return;
        }

        const btn = loginForm.querySelector('button');
        const originalText = btn.textContent;
        btn.textContent = "Logging In...";
        btn.style.opacity = "0.7";
        btn.style.pointerEvents = "none";

        setTimeout(() => {
            const userName = localStorage.getItem('registeredName') || "Skater";
            window.location.href = `welcome.html?name=${encodeURIComponent(userName)}`;
        }, 1200);
    });
});
