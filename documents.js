// Check authentication
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = 'login.html';
}

// Display user info
document.getElementById('userDisplay').textContent = `Welcome, ${currentUser.fullName}`;

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// Handle file upload
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
        renderDocuments();
    };
    
    reader.readAsDataURL(file);
}

// Filter documents
function filterDocuments() {
    const searchTerm = document.getElementById('documentSearch').value.toLowerCase();
    const typeFilter = document.getElementById('documentTypeFilter').value;
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    
    const filteredDocs = documents.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchTerm) || 
                            doc.fileName.toLowerCase().includes(searchTerm);
        const matchesType = !typeFilter || doc.fileType.includes(typeFilter);
        return matchesSearch && matchesType;
    });
    
    renderFilteredDocuments(filteredDocs);
}

// Render filtered documents
function renderFilteredDocuments(documents) {
    const container = document.getElementById('documentsList');
    container.innerHTML = '';
    
    if (documents.length === 0) {
        container.innerHTML = '<p class="no-documents">No documents found.</p>';
        return;
    }

    documents.forEach((doc, index) => {
        const docElement = document.createElement('div');
        docElement.className = 'document-item';
        
        // Determine document icon and type label
        let iconClass = 'document-icon ';
        let typeLabel = '';
        let viewText = '';
        const fileExtension = doc.fileName.split('.').pop().toLowerCase();
        
        switch (fileExtension) {
            case 'pdf':
                iconClass += 'pdf-icon';
                typeLabel = 'PDF Document';
                viewText = 'Open in PDF Viewer';
                break;
            case 'doc':
            case 'docx':
                iconClass += 'word-icon';
                typeLabel = 'Word Document';
                viewText = 'Open in Word';
                break;
            case 'xls':
            case 'xlsx':
                iconClass += 'excel-icon';
                typeLabel = 'Excel Spreadsheet';
                viewText = 'Open in Excel';
                break;
            case 'txt':
                iconClass += 'file-icon';
                typeLabel = 'Text Document';
                viewText = 'Open in Text Editor';
                break;
            case 'jpg':
            case 'jpeg':
            case 'png':
                iconClass += 'image-icon';
                typeLabel = 'Image';
                viewText = 'Open in Image Viewer';
                break;
            default:
                iconClass += 'file-icon';
                typeLabel = 'Document';
                viewText = 'Open';
        }

        // Check if user can delete this document
        const canDelete = currentUser.role === 'admin' || doc.uploadedBy === currentUser.fullName;

        docElement.innerHTML = `
            <div class="${iconClass}"></div>
            <div class="document-info">
                <h4>${doc.title}</h4>
                <p><strong>Type:</strong> ${typeLabel}</p>
                <p><strong>File:</strong> ${doc.fileName}</p>
                <p><strong>Uploaded by:</strong> ${doc.uploadedBy}</p>
                <p><strong>Date:</strong> ${new Date(doc.uploadDate).toLocaleDateString()}</p>
            </div>
            <div class="document-actions">
                <button class="view-btn" onclick="viewDocument(${index})" title="${viewText}">
                    <i class="fas fa-external-link-alt"></i> ${viewText}
                </button>
                <button class="download-btn" onclick="downloadDocument(${index})" title="Download Document">
                    <i class="fas fa-download"></i> Download
                </button>
                ${canDelete ? `
                    <button class="delete-btn" onclick="deleteDocument(${index})" title="Delete Document">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                ` : ''}
            </div>
        `;
        container.appendChild(docElement);
    });
}

// View document
function viewDocument(index) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents[index];
    if (!doc) return;

    try {
        // Convert base64 to blob
        const arr = doc.data.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        const u8arr = new Uint8Array(bstr.length);
        for (let i = 0; i < bstr.length; i++) {
            u8arr[i] = bstr.charCodeAt(i);
        }
        
        // Create blob with specific mime type
        const fileExtension = doc.fileName.split('.').pop().toLowerCase();
        let mimeType;
        
        // Set specific mime types to force native application opening
        switch (fileExtension) {
            case 'pdf':
                mimeType = 'application/pdf';
                break;
            case 'doc':
                mimeType = 'application/msword';
                break;
            case 'docx':
                mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                break;
            case 'xls':
                mimeType = 'application/vnd.ms-excel';
                break;
            case 'xlsx':
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                break;
            case 'jpg':
            case 'jpeg':
                mimeType = 'image/jpeg';
                break;
            case 'png':
                mimeType = 'image/png';
                break;
            case 'txt':
                mimeType = 'text/plain';
                break;
            default:
                mimeType = mime;
        }

        const blob = new Blob([u8arr], { type: mimeType });
        const url = URL.createObjectURL(blob);

        // Create and trigger download with specific attributes
        const link = document.createElement('a');
        link.href = url;
        link.type = mimeType;
        link.target = '_self'; // Force same window
        link.setAttribute('download', ''); // Remove download attribute to prevent direct download
        link.style.display = 'none';
        
        // For PDFs and images, try to force opening in native viewer
        if (fileExtension === 'pdf' || ['jpg', 'jpeg', 'png'].includes(fileExtension)) {
            const newWindow = window.open(url, '_blank');
            if (!newWindow) {
                showMessage('Popup blocked. Opening in current window...', 'info');
                window.location.href = url;
            }
        } else {
            // For other files, trigger click in current window
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        // Clean up
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

        showMessage(`Opening ${doc.fileName} in default application...`, 'info');
    } catch (error) {
        console.error('Error opening document:', error);
        showMessage('Error opening document. Please try downloading instead.', 'error');
    }
}

// Download document
function downloadDocument(index) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents[index];
    if (!doc) return;

    try {
        // Create download link
        const link = document.createElement('a');
        link.href = doc.data;
        link.download = doc.fileName; // Force download
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage(`Downloading ${doc.fileName}...`, 'info');
    } catch (error) {
        console.error('Error downloading document:', error);
        showMessage('Error downloading document.', 'error');
    }
}

// Print document
function printDocument(index) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents[index];
    if (!doc) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print - ${doc.fileName}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .print-header { margin-bottom: 20px; }
                .print-header h2 { margin: 0; color: #333; }
                .print-header p { margin: 5px 0; color: #666; }
                .print-content { margin-top: 20px; }
                @media print {
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="print-header">
                <h2>${doc.title}</h2>
                <p><strong>File:</strong> ${doc.fileName}</p>
                <p><strong>Uploaded by:</strong> ${doc.uploadedBy}</p>
                <p><strong>Date:</strong> ${new Date(doc.uploadDate).toLocaleDateString()}</p>
            </div>
            <div class="print-content">
                <iframe src="${doc.data}" style="width:100%; height:calc(100vh - 200px);" frameborder="0"></iframe>
            </div>
            <div class="no-print" style="margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Print Document
                </button>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Delete document
function deleteDocument(index) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents[index];
    
    // Check if user has permission to delete
    if (currentUser.role !== 'admin' && doc.uploadedBy !== currentUser.fullName) {
        showMessage('You can only delete documents that you uploaded', 'error');
        return;
    }

    // Create confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <h3>Delete Document</h3>
        <p>Are you sure you want to delete "${doc.fileName}"?</p>
        <p>This action cannot be undone.</p>
        <div class="dialog-buttons">
            <button class="cancel" onclick="this.closest('.confirm-dialog').remove()">Cancel</button>
            <button class="confirm" onclick="confirmDelete(${index}, this)">Delete</button>
        </div>
    `;
    document.body.appendChild(dialog);
}

// Confirm delete action
function confirmDelete(index, button) {
    const documents = JSON.parse(localStorage.getItem('documents') || '[]');
    const doc = documents[index];
    
    // Double check permission before deleting
    if (currentUser.role !== 'admin' && doc.uploadedBy !== currentUser.fullName) {
        showMessage('You can only delete documents that you uploaded', 'error');
        button.closest('.confirm-dialog').remove();
        return;
    }
    
    documents.splice(index, 1);
    localStorage.setItem('documents', JSON.stringify(documents));
    
    // Remove the confirmation dialog
    button.closest('.confirm-dialog').remove();
    
    // Show success message and refresh the list
    showMessage('Document deleted successfully', 'success');
    renderDocuments();
}

// Show message with auto-dismiss
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    Object.assign(messageDiv.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 24px',
        borderRadius: '4px',
        backgroundColor: type === 'error' ? '#dc3545' : 
                       type === 'success' ? '#28a745' : '#17a2b8',
        color: 'white',
        zIndex: '1000',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        transition: 'opacity 0.3s ease-in-out'
    });
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
}

// Initial render
renderDocuments();
