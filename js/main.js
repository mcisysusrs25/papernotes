document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const notebooksGrid = document.getElementById('notebooks-grid');
    const newDiaryBtn = document.getElementById('new-diary-btn');
    const modal = document.getElementById('new-diary-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const createDiaryBtn = document.getElementById('create-diary-btn');
    const diaryNameInput = document.getElementById('diary-name');
    const themeOptions = document.querySelectorAll('.theme-option');
    const coverImageInput = document.getElementById('cover-image-input');
    const coverImageLink = document.getElementById('cover-image-link');
    const coverImagePreview = document.getElementById('cover-image-preview');
    const imageTypeOptions = document.querySelectorAll('.image-type-option');
    const coverImageSection = document.getElementById('cover-image-section');
    const coverLinkSection = document.getElementById('cover-link-section');
    const toastContainer = document.getElementById('toast-container');

    // Check if all required elements exist
    if (!notebooksGrid || !newDiaryBtn || !modal || !createDiaryBtn || !diaryNameInput || !toastContainer) {
        console.error('Some required DOM elements are missing');
        return; // Exit early to prevent errors
    }

    // App State
    let diaries = JSON.parse(localStorage.getItem('diaries')) || {};
    let selectedPageColor = '#f5f1e7';
    let selectedCoverType = 'color'; // color, image, or link
    let coverImageData = null;
    let coverImageUrl = '';

    // Initialize
    function init() {
        loadNotebooks();
    }

    // Load all notebooks
    function loadNotebooks() {
        // Clear existing items
        notebooksGrid.innerHTML = '';

        // Create a card for each notebook
        for (const id in diaries) {
            const notebook = diaries[id];
            const card = createNotebookCard(id, notebook);
            notebooksGrid.appendChild(card);
        }

        // Add "Create new notebook" card
        const createCard = document.createElement('div');
        createCard.className = 'create-notebook-card';
        createCard.innerHTML = `
            <i class="fa-solid fa-plus"></i>
            <p>Create New Notebook</p>
        `;
        createCard.addEventListener('click', function () {
            openNewNotebookModal();
        });

        notebooksGrid.appendChild(createCard);
    }

    // Open new notebook modal with defaults
    function openNewNotebookModal() {
        // Reset form
        selectedCoverType = 'color';
        selectedPageColor = '#f5f1e7';
        diaryNameInput.value = '';
        coverImageInput.value = '';
        coverImageLink.value = '';
        coverImagePreview.style.backgroundImage = '';
        coverImagePreview.style.display = 'none';
        coverImageData = null;
        coverImageUrl = '';
        
        // Update UI for selected cover type
        imageTypeOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.type === selectedCoverType);
        });
        
        // Show/hide appropriate sections
        updateCoverSectionVisibility();
        
        // Select default color
        themeOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.page === selectedPageColor);
        });
        
        // Show modal and focus input
        modal.style.display = 'flex';
        diaryNameInput.focus();
    }

    // Update cover section visibility based on selected type
    function updateCoverSectionVisibility() {
        // Get color picker element
        const colorPickerSection = document.getElementById('color-picker-section');
        
        if (coverImageSection && coverLinkSection && colorPickerSection) {
            // Hide all sections first
            coverImageSection.style.display = 'none';
            coverLinkSection.style.display = 'none';
            colorPickerSection.style.display = 'none';
            
            // Show only the relevant section based on selected type
            if (selectedCoverType === 'image') {
                coverImageSection.style.display = 'block';
            } else if (selectedCoverType === 'link') {
                coverLinkSection.style.display = 'block';
            } else {
                colorPickerSection.style.display = 'block';
            }
        }
    }

    // Create a notebook card
    function createNotebookCard(id, notebook) {
        const card = document.createElement('div');
        card.className = 'notebook-card';

        // Format the date
        const date = new Date(parseInt(id));
        const dateString = date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        // Get page count
        const pageCount = notebook.pages ? notebook.pages.length : 0;

        // Determine cover style
        let coverStyle = '';
        if (notebook.coverType === 'color' || !notebook.coverType) {
            coverStyle = `background-color: ${notebook.pageColor || '#f5f1e7'}`;
        } else if (notebook.coverType === 'image' && notebook.coverImage) {
            coverStyle = `background-image: url(${notebook.coverImage}); background-size: cover; background-position: center;`;
        } else if (notebook.coverType === 'link' && notebook.coverLink) {
            coverStyle = `background-image: url(${notebook.coverLink}); background-size: cover; background-position: center;`;
        } else {
            coverStyle = `background-color: ${notebook.pageColor || '#f5f1e7'}`;
        }

        card.innerHTML = `
            <div class="notebook-preview" style="${coverStyle}">
                <div class="notebook-actions">
                    <button class="delete-notebook-btn page-action-btn" data-id="${id}" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="notebook-info">
                <h3 class="notebook-name">${notebook.name}</h3>
                <div class="notebook-date">
                    Created: ${dateString} • ${pageCount} page${pageCount !== 1 ? 's' : ''}
                </div>
            </div>
        `;

        // Add click event to open the notebook
        card.addEventListener('click', function (e) {
            // If clicking the delete button, don't navigate
            if (e.target.closest('.delete-notebook-btn')) {
                e.stopPropagation();
                confirmDeleteNotebook(id);
                return;
            }

            window.location.href = `/papernotes/notes.html?id=${id}`;
        });

        return card;
    }

    // Confirm delete notebook
    function confirmDeleteNotebook(id) {
        if (confirm('Are you sure you want to delete this notebook?')) {
            deleteNotebook(id);
        }
    }

    // Delete a notebook
    function deleteNotebook(id) {
        delete diaries[id];
        localStorage.setItem('diaries', JSON.stringify(diaries));

        // If this was the current diary, reset current diary id
        if (localStorage.getItem('currentDiaryId') === id) {
            localStorage.removeItem('currentDiaryId');
        }

        loadNotebooks();
        showToast('Notebook deleted successfully!', 'success');
    }

    // Handle file input for cover image
    function handleCoverImageUpload(input) {
        const file = input.files[0];
        if (!file) return;
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast('Image is too large. Maximum size is 5MB.', 'error');
            input.value = '';
            return;
        }
        
        // Check file type
        if (!file.type.match('image.*')) {
            showToast('Please select an image file.', 'error');
            input.value = '';
            return;
        }
        
        // Read file as data URL
        const reader = new FileReader();
        reader.onload = function(e) {
            coverImageData = e.target.result;
            // Show a simple thumbnail preview
            if (coverImagePreview) {
                coverImagePreview.style.backgroundImage = `url(${coverImageData})`;
                coverImagePreview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
        
        // Show a toast to confirm image selection
        showToast('Image selected successfully', 'success');
    }

    // Create a new diary
    function createNewDiary(name, pageColor) {
        // Show loading animation
        showLoading();

        setTimeout(() => {
            const id = Date.now().toString();
            
            // Create notebook object
            const notebook = {
                name,
                pageColor,
                pages: [''],
                font: "'Crimson Pro', serif", // Default font
                coverType: selectedCoverType
            };
            
            // Add cover image or link if selected
            if (selectedCoverType === 'image' && coverImageData) {
                notebook.coverImage = coverImageData;
            } else if (selectedCoverType === 'link' && coverImageLink.value) {
                notebook.coverLink = coverImageLink.value;
            }
            
            diaries[id] = notebook;
            localStorage.setItem('diaries', JSON.stringify(diaries));

            // Reload notebooks
            loadNotebooks();

            // Show success toast
            showToast('Notebook created successfully!', 'success');

            // Hide loading animation
            hideLoading();

            // Redirect to the new notebook
            window.location.href = `/papernotes/notes.html?id=${id}`;
        }, 600);
    }

    // Show toast notification
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        icon.innerHTML = type === 'success'
            ? '<i class="fa-solid fa-circle-check"></i>'
            : '<i class="fa-solid fa-circle-exclamation"></i>';

        const content = document.createElement('div');
        content.className = 'toast-content';
        content.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        closeBtn.addEventListener('click', () => {
            toast.remove();
        });

        toast.appendChild(icon);
        toast.appendChild(content);
        toast.appendChild(closeBtn);
        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // Show loading animation
    function showLoading() {
        const loading = document.createElement('div');
        loading.className = 'loading';
        loading.id = 'loading-animation';

        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';

        loading.appendChild(spinner);
        document.body.appendChild(loading);
    }

    // Hide loading animation
    function hideLoading() {
        const loading = document.getElementById('loading-animation');
        if (loading) {
            loading.remove();
        }
    }

    // Setup event listeners safely
    function setupEventListeners() {
        // Footer modal links
        const termsLink = document.getElementById('terms-link');
        const privacyLink = document.getElementById('privacy-link');
        const cookieLink = document.getElementById('cookie-link');
        const dataLink = document.getElementById('data-link');
        const contactLink = document.getElementById('contact-link');

        if (termsLink) {
            termsLink.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('terms-modal').style.display = 'flex';
            });
        }

        if (privacyLink) {
            privacyLink.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('privacy-modal').style.display = 'flex';
            });
        }

        if (cookieLink) {
            cookieLink.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('cookie-modal').style.display = 'flex';
            });
        }

        if (dataLink) {
            dataLink.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('data-modal').style.display = 'flex';
            });
        }

        if (contactLink) {
            contactLink.addEventListener('click', function (e) {
                e.preventDefault();
                document.getElementById('contact-modal').style.display = 'flex';
            });
        }

        // New diary button
        if (newDiaryBtn) {
            newDiaryBtn.addEventListener('click', function () {
                openNewNotebookModal();
            });
        }

        // Close modal buttons
        if (closeModalButtons.length > 0) {
            closeModalButtons.forEach(button => {
                button.addEventListener('click', function () {
                    const modalEl = this.closest('.modal');
                    if (modalEl) {
                        modalEl.style.display = 'none';
                    }
                });
            });
        }

        // Close modal buttons (secondary)
        if (closeModalBtns.length > 0) {
            closeModalBtns.forEach(button => {
                button.addEventListener('click', function () {
                    const modalEl = this.closest('.modal');
                    if (modalEl) {
                        modalEl.style.display = 'none';
                    }
                });
            });
        }

        // Click outside modal to close
        window.addEventListener('click', function (e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Create diary button
        if (createDiaryBtn) {
            createDiaryBtn.addEventListener('click', function () {
                const name = diaryNameInput.value.trim();
                if (name) {
                    createNewDiary(name, selectedPageColor);
                    modal.style.display = 'none';
                } else {
                    diaryNameInput.classList.add('is-invalid');
                    setTimeout(() => {
                        diaryNameInput.classList.remove('is-invalid');
                    }, 1000);
                }
            });
        }

        // Theme options
        if (themeOptions.length > 0) {
            themeOptions.forEach(option => {
                option.addEventListener('click', function () {
                    themeOptions.forEach(o => o.classList.remove('selected'));
                    this.classList.add('selected');
                    selectedPageColor = this.dataset.page;
                });
            });
        }
        
        // Image type options
        if (imageTypeOptions.length > 0) {
            imageTypeOptions.forEach(option => {
                option.addEventListener('click', function() {
                    imageTypeOptions.forEach(o => o.classList.remove('selected'));
                    this.classList.add('selected');
                    selectedCoverType = this.dataset.type;
                    updateCoverSectionVisibility();
                });
            });
        }
        
        // Cover image upload
        if (coverImageInput) {
            coverImageInput.addEventListener('change', function() {
                handleCoverImageUpload(this);
            });
        }
    }

    // Initialize event listeners and the app
    setupEventListeners();
    init();
});