// Initialize local storage with some sample data if empty
if (!localStorage.getItem('inventory')) {
    const sampleData = [
        {
            itemCode: 'MIS-SCALPEL-001',
            itemName: 'Laparoscopic Scalpel, 5mm',
            category: 'Scalpels',
            uom: 'Each',
            supplier: 'Medical Supplies Co',
            reorderPoint: 20,
            leadTime: 5,
            location: 'Shelf A, Room 2',
            currentStock: 50,
            pricePerUnit: 15000,
            lastUpdated: new Date().toISOString()
        }
    ];
    localStorage.setItem('inventory', JSON.stringify(sampleData));
}

// Initialize transaction log if empty
if (!localStorage.getItem('transactionLog')) {
    localStorage.setItem('transactionLog', JSON.stringify([]));
}

// Initialize users if empty
if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([]));
}

// Initialize documents if empty
if (!localStorage.getItem('documents')) {
    localStorage.setItem('documents', JSON.stringify([]));
}

// Check authentication
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'login.html';
}

// Display user info and setup admin features
document.getElementById('userDisplay').textContent = `Welcome, ${currentUser.fullName}`;
if (currentUser.role === 'admin') {
    document.getElementById('adminSection').style.display = 'block';
    loadUsers();
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// User Management Functions
function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const usersList = document.getElementById('usersList');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    usersList.innerHTML = '';

    users.forEach(user => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        const roleClass = user.role === 'admin' ? 'admin' : 'regular';
        const roleDisplay = user.role === 'admin' ? 'Administrator' : 'Regular User';
        
        userDiv.innerHTML = `
            <div class="user-info">
                <strong>${user.fullName}</strong>
                <span class="user-role ${roleClass}">${roleDisplay}</span>
                <br>
                <small>${user.email}</small>
            </div>
            <div class="user-actions">
                ${user.id !== currentUser.id ? `
                    <button onclick="editUserRole(${user.id})" class="edit-role-btn">Change Role</button>
                    <button onclick="deleteUser(${user.id})" class="delete-btn">Delete</button>
                ` : '<small>(Current User)</small>'}
            </div>
        `;
        usersList.appendChild(userDiv);
    });
}

// Edit user role
function editUserRole(userId) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    const newRole = user.role === 'admin' ? 'regular' : 'admin';
    const confirmMessage = `Are you sure you want to change ${user.fullName}'s role from ${user.role} to ${newRole}?`;
    
    if (confirm(confirmMessage)) {
        user.role = newRole;
        localStorage.setItem('users', JSON.stringify(users));
        loadUsers();
    }
}

// Show Add User Modal
function showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    modal.style.display = 'block';
}

// Close Add User Modal when clicking (X) or outside
window.onclick = function(event) {
    const modal = document.getElementById('addUserModal');
    if (event.target == modal || event.target.className == 'close') {
        modal.style.display = 'none';
        document.getElementById('addUserForm').reset();
    }
}

// Add User Form Handler
document.getElementById('addUserForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newUser = {
        id: Date.now(),
        fullName: document.getElementById('newUserFullName').value,
        email: document.getElementById('newUserEmail').value,
        password: document.getElementById('newUserPassword').value,
        role: document.getElementById('newUserRole').value,
        dateCreated: new Date().toISOString()
    };

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if email already exists
    if (users.some(user => user.email === newUser.email)) {
        showMessage('A user with this email already exists!', 'error');
        return;
    }

    // Validate role selection
    if (!newUser.role) {
        showMessage('Please select a user role!', 'error');
        return;
    }

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    showMessage(`New ${newUser.role} user added successfully!`, 'success');
    document.getElementById('addUserModal').style.display = 'none';
    document.getElementById('addUserForm').reset();
    loadUsers();
});

// Show message function
function showMessage(message, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = message;

    const modal = document.querySelector('.modal-content');
    modal.insertAdjacentElement('afterbegin', messageDiv);

    setTimeout(() => messageDiv.remove(), 3000);
}

function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter(user => user.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        loadUsers();
    }
}

// DOM Elements
const itemForm = document.getElementById('itemForm');
const inventoryList = document.getElementById('inventoryList');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');

// Load and display inventory
function loadInventory() {
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    const searchTerm = searchInput.value.toLowerCase();
    const categoryValue = categoryFilter.value;

    inventoryList.innerHTML = '';
    
    inventory.filter(item => {
        const matchesSearch = item.itemName.toLowerCase().includes(searchTerm) || 
                            item.itemCode.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryValue || item.category === categoryValue;
        return matchesSearch && matchesCategory;
    }).forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.itemCode}</td>
            <td>${item.itemName}</td>
            <td>${item.category}</td>
            <td>${item.currentStock}</td>
            <td>${formatCurrency(item.pricePerUnit)}</td>
            <td>${formatCurrency(item.pricePerUnit * item.currentStock)}</td>
            <td>${item.reorderPoint}</td>
            <td>
                <button onclick="editItem('${item.itemCode}')">Edit</button>
                <button onclick="deleteItem('${item.itemCode}')">Delete</button>
                <button onclick="adjustStock('${item.itemCode}')">Adjust Stock</button>
            </td>
        `;
        inventoryList.appendChild(row);
    });
}

// Format currency in RWF
function formatCurrency(amount) {
    return new Intl.NumberFormat('rw-RW', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Save or update item
itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const item = {
        itemCode: document.getElementById('itemCode').value,
        itemName: document.getElementById('itemName').value,
        category: document.getElementById('category').value,
        uom: document.getElementById('uom').value,
        supplier: document.getElementById('supplier').value,
        reorderPoint: parseInt(document.getElementById('reorderPoint').value),
        leadTime: parseInt(document.getElementById('leadTime').value),
        location: document.getElementById('location').value,
        currentStock: parseInt(document.getElementById('currentStock').value),
        pricePerUnit: parseFloat(document.getElementById('pricePerUnit').value),
        lastUpdated: new Date().toISOString()
    };

    const inventory = JSON.parse(localStorage.getItem('inventory'));
    const existingItemIndex = inventory.findIndex(i => i.itemCode === item.itemCode);

    if (existingItemIndex >= 0) {
        inventory[existingItemIndex] = item;
    } else {
        inventory.push(item);
    }

    localStorage.setItem('inventory', JSON.stringify(inventory));
    itemForm.reset();
    loadInventory();
});

// Edit item
function editItem(itemCode) {
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    const item = inventory.find(i => i.itemCode === itemCode);
    
    if (item) {
        document.getElementById('itemCode').value = item.itemCode;
        document.getElementById('itemName').value = item.itemName;
        document.getElementById('category').value = item.category;
        document.getElementById('uom').value = item.uom;
        document.getElementById('supplier').value = item.supplier;
        document.getElementById('reorderPoint').value = item.reorderPoint;
        document.getElementById('leadTime').value = item.leadTime;
        document.getElementById('location').value = item.location;
        document.getElementById('currentStock').value = item.currentStock;
        document.getElementById('pricePerUnit').value = item.pricePerUnit;
    }
}

// Delete item
function deleteItem(itemCode) {
    if (confirm('Are you sure you want to delete this item?')) {
        const inventory = JSON.parse(localStorage.getItem('inventory'));
        const updatedInventory = inventory.filter(i => i.itemCode !== itemCode);
        localStorage.setItem('inventory', JSON.stringify(updatedInventory));
        loadInventory();
    }
}

// Adjust stock
function adjustStock(itemCode) {
    const adjustment = prompt('Enter adjustment amount (positive for addition, negative for subtraction):');
    if (adjustment !== null) {
        const inventory = JSON.parse(localStorage.getItem('inventory'));
        const item = inventory.find(i => i.itemCode === itemCode);
        
        if (item) {
            const newStock = item.currentStock + parseInt(adjustment);
            if (newStock < 0) {
                alert('Error: Stock cannot be negative');
                return;
            }
            
            item.currentStock = newStock;
            item.lastUpdated = new Date().toISOString();
            
            // Log transaction
            const transactionLog = JSON.parse(localStorage.getItem('transactionLog'));
            transactionLog.push({
                itemCode: item.itemCode,
                itemName: item.itemName,
                adjustment: parseInt(adjustment),
                newStock: newStock,
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('inventory', JSON.stringify(inventory));
            localStorage.setItem('transactionLog', JSON.stringify(transactionLog));
            loadInventory();
        }
    }
}

// Generate Low Stock Report
function generateLowStockReport() {
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    const lowStockItems = inventory.filter(item => item.currentStock <= item.reorderPoint);
    
    let report = '<h4>Low Stock Report</h4>';
    if (lowStockItems.length === 0) {
        report += '<p>No items are currently low in stock.</p>';
    } else {
        report += '<table><tr><th>Item Code</th><th>Item Name</th><th>Current Stock</th><th>Price/Unit (RWF)</th><th>Total Value (RWF)</th><th>Reorder Point</th></tr>';
        lowStockItems.forEach(item => {
            report += `<tr>
                <td>${item.itemCode}</td>
                <td>${item.itemName}</td>
                <td>${item.currentStock}</td>
                <td>${formatCurrency(item.pricePerUnit)}</td>
                <td>${formatCurrency(item.pricePerUnit * item.currentStock)}</td>
                <td>${item.reorderPoint}</td>
            </tr>`;
        });
        report += '</table>';
    }
    
    document.getElementById('reportOutput').innerHTML = report;
}

// Generate Inventory Summary
function generateInventorySummary() {
    const inventory = JSON.parse(localStorage.getItem('inventory'));
    let report = '<h4>Inventory Summary Report</h4>';
    
    // Group by category
    const categories = {};
    inventory.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = [];
        }
        categories[item.category].push(item);
    });
    
    for (const [category, items] of Object.entries(categories)) {
        report += `<h5>${category}</h5>`;
        report += '<table><tr><th>Item Code</th><th>Item Name</th><th>Current Stock</th><th>Price/Unit (RWF)</th><th>Total Value (RWF)</th></tr>';
        let categoryTotal = 0;
        items.forEach(item => {
            const totalValue = item.currentStock * item.pricePerUnit;
            categoryTotal += totalValue;
            report += `<tr>
                <td>${item.itemCode}</td>
                <td>${item.itemName}</td>
                <td>${item.currentStock}</td>
                <td>${formatCurrency(item.pricePerUnit)}</td>
                <td>${formatCurrency(totalValue)}</td>
            </tr>`;
        });
        report += `<tr><td colspan="4"><strong>Category Total:</strong></td><td><strong>${formatCurrency(categoryTotal)}</strong></td></tr>`;
        report += '</table>';
    }
    
    document.getElementById('reportOutput').innerHTML = report;
}

// Event listeners for search and filter
searchInput.addEventListener('input', loadInventory);
categoryFilter.addEventListener('change', loadInventory);

// Initial load
loadInventory();

// Show General Report
function showGeneralReport() {
    alert('Displaying General Report...');
}

// Show Upload Document
function showUploadDocument() {
    const modal = document.getElementById('uploadDocumentModal');
    modal.style.display = 'block';
}

// Close Upload Document Modal
function closeUploadDocumentModal() {
    const modal = document.getElementById('uploadDocumentModal');
    modal.style.display = 'none';
    document.getElementById('uploadForm').reset();
}

// Handle Upload Document Form Submission
document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('documentTitle').value;
    const type = document.getElementById('documentType').value;
    const description = document.getElementById('documentDescription').value;
    const file = document.getElementById('documentFile').files[0];
    
    if (!file) {
        showMessage('Please select a file to upload', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const documents = JSON.parse(localStorage.getItem('documents') || '[]');
        const newDocument = {
            id: Date.now(),
            title: title,
            type: type,
            description: description,
            fileName: file.name,
            fileType: file.type,
            uploadDate: new Date().toISOString(),
            uploadedBy: currentUser.fullName,
            data: event.target.result
        };
        
        documents.push(newDocument);
        localStorage.setItem('documents', JSON.stringify(documents));
        
        closeUploadDocumentModal();
        showMessage('Document uploaded successfully!', 'success');
        renderDocuments();
    };
    
    reader.readAsDataURL(file);
});

// Handle direct file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Create a default title from the filename
    const title = file.name.split('.')[0];
    const type = file.type;

    const reader = new FileReader();
    reader.onload = function(event) {
        const documents = JSON.parse(localStorage.getItem('documents') || '[]');
        const newDocument = {
            id: Date.now(),
            title: title,
            type: type,
            fileName: file.name,
            fileType: file.type,
            uploadDate: new Date().toISOString(),
            uploadedBy: currentUser.fullName,
            data: event.target.result
        };
        
        documents.push(newDocument);
        localStorage.setItem('documents', JSON.stringify(documents));
        
        showMessage('Document uploaded successfully!', 'success');
        // Reset the file input
        document.getElementById('fileUpload').value = '';
        // If documents list is visible, refresh it
        if (document.getElementById('documentsListSection').style.display === 'block') {
            renderDocuments();
        }
    };
    
    reader.readAsDataURL(file);
}

// Show documents list
function showDocumentsList() {
    document.getElementById('documentsListSection').style.display = 'block';
    // Hide other sections
    document.getElementById('adminSection').style.display = 'none';
    document.getElementById('reportSection').style.display = 'none';
    renderDocuments();
}

// Render Uploaded Documents
function renderDocuments() {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const container = document.getElementById('documentsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (documents.length === 0) {
        container.innerHTML = '<p>No documents uploaded yet.</p>';
        return;
    }

    documents.forEach((doc, index) => {
        const docElement = document.createElement('div');
        docElement.className = 'document-item';
        docElement.innerHTML = `
            <div class="document-info">
                <h4>${doc.title}</h4>
                <p><strong>File:</strong> ${doc.fileName}</p>
                <p><strong>Uploaded by:</strong> ${doc.uploadedBy}</p>
                <p><strong>Date:</strong> ${new Date(doc.uploadDate).toLocaleDateString()}</p>
            </div>
            <div class="document-actions">
                <button onclick="viewDocument(${index})">View</button>
                <button onclick="downloadDocument(${index})">Download</button>
                ${currentUser.role === 'admin' ? `<button onclick="deleteDocument(${index})">Delete</button>` : ''}
            </div>
        `;
        container.appendChild(docElement);
    });
}

// View Document
function viewDocument(index) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents[index];
    if (!doc) return;
    
    const win = window.open();
    win.document.write(`
        <iframe src="${doc.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>
    `);
}

// Download Document
function downloadDocument(index) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents[index];
    if (!doc) return;
    
    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Delete Document (Admin only)
function deleteDocument(index) {
    if (currentUser.role !== 'admin') {
        showMessage('Only administrators can delete documents', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this document?')) {
        const documents = JSON.parse(localStorage.getItem('documents') || '[]');
        documents.splice(index, 1);
        localStorage.setItem('documents', JSON.stringify(documents));
        renderDocuments();
        showMessage('Document deleted successfully', 'success');
    }
}

// Show View Documents
function showViewDocuments() {
    document.getElementById('viewDocumentsSection').style.display = 'block';
    renderDocuments();
}

// Toggle dropdown visibility
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}
