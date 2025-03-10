// Check if admin exists
function checkAdminExists() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.some(user => user.role === 'admin');
}

// Update signup link visibility
function updateSignupLink() {
    const signupLink = document.getElementById('signupLink');
    if (signupLink) {
        if (!checkAdminExists()) {
            signupLink.innerHTML = 'No admin account exists. <a href="signup.html">Create admin account</a>';
        } else {
            signupLink.innerHTML = 'Contact administrator for account creation.';
        }
    }
}

// Handle signup form
if (document.getElementById('signupForm')) {
    const signupForm = document.getElementById('signupForm');
    
    // If admin exists, redirect to login
    if (checkAdminExists()) {
        window.location.href = 'login.html';
    }

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fullName = document.getElementById('fullName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showMessage('Passwords do not match!', 'error');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Check if admin already exists
        if (users.some(user => user.role === 'admin')) {
            showMessage('Admin account already exists!', 'error');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        // Create admin user
        const adminUser = {
            id: Date.now(),
            fullName,
            email,
            password, // In a real application, this should be hashed
            role: 'admin',
            dateCreated: new Date().toISOString()
        };

        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        showMessage('Admin account created successfully!', 'success');
        setTimeout(() => window.location.href = 'login.html', 2000);
    });
}

// Handle login form
if (document.getElementById('loginForm')) {
    const loginForm = document.getElementById('loginForm');
    
    updateSignupLink();

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Store current user info (except password)
            const { password, ...userInfo } = user;
            localStorage.setItem('currentUser', JSON.stringify(userInfo));
            
            window.location.href = 'index.html';
        } else {
            showMessage('Invalid email or password!', 'error');
        }
    });
}

// Show message function
function showMessage(message, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;

    const form = document.querySelector('form');
    form.insertAdjacentElement('beforebegin', messageDiv);

    setTimeout(() => messageDiv.remove(), 3000);
}

// Check authentication on protected pages
if (window.location.pathname.endsWith('index.html')) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
    }
}
