document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");
    
    // DOM Elements
    const notebookTitle = document.getElementById('notebook-title');
    const notesContainer = document.getElementById('notes-container');
    const deleteDiaryBtn = document.getElementById('delete-diary-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const confirmDeleteModal = document.getElementById('confirm-delete-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const colorOptions = document.querySelectorAll('.color-option');
    const fontOptions = document.querySelectorAll('.font-option');
    const toastContainer = document.getElementById('toast-container');
    const exportBtn = document.getElementById('export-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const exportDocxBtn = document.getElementById('export-docx-btn');
    const focusModeBtn = document.getElementById('focus-mode-btn');
    const helpBtn = document.getElementById('help-btn');
    const formattingHelpModal = document.getElementById('formatting-help-modal');
    const mainToolbar = document.getElementById('main-toolbar');
    const mainContent = document.querySelector('.main-content');
    const fontBtn = document.getElementById('font-btn');
    
    // Debug which elements are missing
    console.log({
        notebookTitle: !!notebookTitle,
        notesContainer: !!notesContainer,
        deleteDiaryBtn: !!deleteDiaryBtn,
        confirmDeleteBtn: !!confirmDeleteBtn,
        confirmDeleteModal: !!confirmDeleteModal,
        closeModalButtons: closeModalButtons.length,
        closeModalBtns: closeModalBtns.length,
        colorOptions: colorOptions.length,
        fontOptions: fontOptions.length,
        toastContainer: !!toastContainer,
        exportBtn: !!exportBtn,
        exportPdfBtn: !!exportPdfBtn,
        exportDocxBtn: !!exportDocxBtn,
        focusModeBtn: !!focusModeBtn,
        helpBtn: !!helpBtn,
        formattingHelpModal: !!formattingHelpModal,
        mainToolbar: !!mainToolbar,
        mainContent: !!mainContent,
        fontBtn: !!fontBtn
    });
    
    // Check if essential elements exist
    if (!notebookTitle || !notesContainer || !toastContainer || !mainContent) {
        console.error('Essential DOM elements are missing');
        return; // Exit to prevent further errors
    }
    
    // App State
    let diaries = JSON.parse(localStorage.getItem('diaries')) || {};
    let currentDiaryId = null;
    let currentColor = '#000000';
    let focusMode = localStorage.getItem('focusMode') === 'true';
    let currentFont = "'Crimson Pro', serif";
    
    // Initialize
    function init() {
        console.log("Initializing app");
        
        try {
            // Get notebook ID from URL
            const params = new URLSearchParams(window.location.search);
            currentDiaryId = params.get('id');
            
            if (currentDiaryId && diaries[currentDiaryId]) {
                console.log(`Loading diary with ID: ${currentDiaryId}`);
                loadDiary(currentDiaryId);
            } else {
                console.log("No valid ID, redirecting to list page");
                window.location.href = 'dashboard.html';
            }
            
            // Apply focus mode if enabled
            if (focusMode && mainToolbar && focusModeBtn) {
                console.log("Applying focus mode");
                toggleFocusMode(true);
            }
        } catch (error) {
            console.error("Error in initialization:", error);
            // Display a visible error message on the page
            if (notesContainer) {
                notesContainer.innerHTML = `
                    <div style="padding: 20px; background-color: #fff; border-radius: 8px; margin: 20px auto; max-width: 600px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                        <h2 style="color: #dc3545;"><i class="fa-solid fa-triangle-exclamation"></i> Something went wrong</h2>
                        <p>There was an error loading the notebook. Please try refreshing the page or go back to the notebooks list.</p>
                        <a href="dashboard.html" style="display: inline-block; margin-top: 20px; padding: 8px 16px; background-color: #2a3f54; color: white; text-decoration: none; border-radius: 4px;">
                            <i class="fa-solid fa-arrow-left"></i> Back to Notebooks
                        </a>
                    </div>
                `;
            }
        }
    }
    
    // Load a diary
    function loadDiary(diaryId) {
        if (!diaries[diaryId]) return;
        
        // Show loading animation
        showLoading();
        
        setTimeout(() => {
            // Update notebook title
            notebookTitle.textContent = diaries[diaryId].name;
            
            // Clear existing pages
            notesContainer.innerHTML = '';
            
            // Update document styles
            const diary = diaries[diaryId];
            document.documentElement.style.setProperty('--page-color', diary.pageColor);
            
            // Get font from diary or use default
            currentFont = diary.font || "'Crimson Pro', serif";
            
            // Create pages
            if (diary.pages.length === 0) {
                // If no pages exist, create one
                diary.pages.push('');
                saveDiary();
            }
            
            diary.pages.forEach((pageContent, index) => {
                const page = createPage(index + 1, pageContent);
                notesContainer.appendChild(page);
            });
            
            // Add "Add Page" button
            const addPageBtn = document.createElement('button');
            addPageBtn.className = 'add-page-btn';
            addPageBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add New Page';
            addPageBtn.addEventListener('click', addNewPage);
            notesContainer.appendChild(addPageBtn);
            
            // Hide loading animation
            hideLoading();
        }, 300); // Short delay for loading animation
    }
    
    // Create a new page
    function createPage(pageNum, content = '') {
        const page = document.createElement('div');
        page.className = 'page';
        page.dataset.pageNum = pageNum;
        page.style.fontFamily = currentFont;
        
        // Create page header
        const pageHeader = document.createElement('div');
        pageHeader.className = 'page-header';
        
        const pageNumber = document.createElement('div');
        pageNumber.className = 'page-number';
        pageNumber.textContent = `Page ${pageNum}`;
        
        const pageDate = document.createElement('div');
        pageDate.className = 'page-date';
        pageDate.textContent = new Date().toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        pageHeader.appendChild(pageNumber);
        pageHeader.appendChild(pageDate);
        
        // Add page actions (copy to clipboard)
        const pageActions = document.createElement('div');
        pageActions.className = 'page-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'page-action-btn';
        copyBtn.title = 'Copy to clipboard';
        copyBtn.innerHTML = '<i class="fa-solid fa-clipboard"></i>';
        copyBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            copyPageToClipboard(pageNum - 1); // Adjust for zero-based index
        });
        
        pageActions.appendChild(copyBtn);
        
        // Create page content area
        const pageContent = document.createElement('div');
        pageContent.className = 'page-content';
        pageContent.contentEditable = true;
        pageContent.innerHTML = content;
        pageContent.style.fontFamily = currentFont;
        
        // Create page shadows for realistic effect
        const pageShadows = document.createElement('div');
        pageShadows.className = 'page-shadows';
        
        const shadowLeft = document.createElement('div');
        shadowLeft.className = 'shadow-left';
        
        const shadowBottom = document.createElement('div');
        shadowBottom.className = 'shadow-bottom';
        
        pageShadows.appendChild(shadowLeft);
        pageShadows.appendChild(shadowBottom);
        
        page.appendChild(pageActions);
        page.appendChild(pageHeader);
        page.appendChild(pageContent);
        page.appendChild(pageShadows);
        
        // Add event listeners to page content
        pageContent.addEventListener('input', handleContentChange);
        
        return page;
    }
    
    // Add a new page
    function addNewPage() {
        if (!currentDiaryId) return;
        
        const diary = diaries[currentDiaryId];
        diary.pages.push('');
        
        // Create and add the new page
        const newPageNum = diary.pages.length;
        const newPage = createPage(newPageNum, '');
        
        // Add page before the "Add Page" button
        const addPageBtn = document.querySelector('.add-page-btn');
        notesContainer.insertBefore(newPage, addPageBtn);
        
        // Save the diary
        saveDiary();
        
        // Scroll to the new page
        newPage.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Save the current diary
    function saveDiary() {
        if (!currentDiaryId) return;
        
        // Get all page contents
        const pages = document.querySelectorAll('.page-content');
        diaries[currentDiaryId].pages = Array.from(pages).map(page => page.innerHTML);
        
        // Save font selection
        diaries[currentDiaryId].font = currentFont;
        
        // Save to local storage
        localStorage.setItem('diaries', JSON.stringify(diaries));
    }
    
    // Delete the current diary
    function deleteDiary() {
        if (!currentDiaryId) return;
        
        // Show loading animation
        showLoading();
        
        setTimeout(() => {
            delete diaries[currentDiaryId];
            localStorage.setItem('diaries', JSON.stringify(diaries));
            
            // Redirect to list page
            window.location.href = 'dashboard.html';
            
            // Hide loading animation
            hideLoading();
        }, 500);
    }
    
    // Handle editable content changes
    function handleContentChange(e) {
        // Save the current cursor position
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const container = range.startContainer;
        const offset = range.startOffset;
        
        // For normal text entry, create a new span
        // but only if this is actual content being added (not a deletion)
        if (e.inputType && e.inputType.startsWith('insert')) {
            // Get the inserted text
            const text = e.data || '';
            if (!text) return;
            
            // Create a styled span for the text
            const span = document.createElement('span');
            span.style.color = currentColor;
            span.style.fontFamily = currentFont;
            span.className = 'pen-text';
            span.contentEditable = true;
            span.textContent = text;
            
            // Delete the plain text that was inserted
            range.setStart(container, offset - text.length);
            range.setEnd(container, offset);
            range.deleteContents();
            
            // Insert our styled span
            range.insertNode(span);
            
            // Move cursor after the span
            range.setStartAfter(span);
            range.setEndAfter(span);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Create ink drop effect
            createInkEffect(e);
        }
        
        // Save changes after a short delay
        setTimeout(saveDiary, 300);
    }
    
    // Create ink drop effect
    function createInkEffect(e) {
        const ink = document.createElement('div');
        ink.className = 'pen-ink-effect';
        ink.style.left = (e.clientX || e.pageX) + 'px';
        ink.style.top = (e.clientY || e.pageY) + 'px';
        ink.style.backgroundColor = currentColor;
        document.body.appendChild(ink);
        
        // Animate the ink drop
        requestAnimationFrame(() => {
            ink.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
            ink.style.transform = 'scale(10)';
            ink.style.opacity = '0.1';
            
            // Remove the ink drop element after animation
            setTimeout(() => {
                ink.remove();
            }, 500);
        });
    }
    
    // Copy page content to clipboard
    function copyPageToClipboard(pageIndex) {
        if (!currentDiaryId) return;
        
        const diary = diaries[currentDiaryId];
        if (pageIndex >= diary.pages.length) return;
        
        const pageContent = diary.pages[pageIndex];
        
        // Create a temporary element to extract text
        const temp = document.createElement('div');
        temp.innerHTML = pageContent;
        const textContent = temp.textContent || temp.innerText || '';
        
        // Use the clipboard API
        navigator.clipboard.writeText(textContent).then(() => {
            showToast('Page content copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            showToast('Failed to copy to clipboard', 'error');
        });
    }
    
    // Change the font for the current notebook
    function changeFont(fontFamily) {
        currentFont = fontFamily;
        
        // Update all pages with the new font
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => {
            page.style.fontFamily = fontFamily;
            
            // Also update the content area
            const content = page.querySelector('.page-content');
            if (content) {
                content.style.fontFamily = fontFamily;
            }
        });
        
        // Save the changes
        saveDiary();
        showToast('Font updated!', 'success');
    }
    
    // Toggle focus mode
    function toggleFocusMode(setActive = null) {
        // If setActive is provided, use it, otherwise toggle
        const newState = setActive !== null ? setActive : !focusMode;
        
        focusMode = newState;
        localStorage.setItem('focusMode', focusMode);
        
        // Add/remove focus mode classes
        mainToolbar.classList.toggle('hidden', focusMode);
        mainContent.classList.toggle('focus-mode', focusMode);
        focusModeBtn.classList.toggle('active', focusMode);
        
        // Update icon
        focusModeBtn.innerHTML = focusMode ? 
            '<i class="fa-solid fa-eye-slash"></i>' : 
            '<i class="fa-solid fa-eye"></i>';
            
        // Show toast
        showToast(focusMode ? 'Focus mode activated' : 'Focus mode deactivated', 'success');
    }
    
    // Export notebook as PDF
    function exportAsPDF() {
        if (!currentDiaryId) {
            showToast('Please select a notebook first', 'error');
            return;
        }
        
        // Show loading animation
        showLoading();
        
        const diary = diaries[currentDiaryId];
        
        // Create a temporary container for PDF export
        const pdfContainer = document.createElement('div');
        pdfContainer.className = 'pdf-export-container';
        pdfContainer.style.width = '100%';
        pdfContainer.style.padding = '20px';
        
        // Add title
        const title = document.createElement('h1');
        title.textContent = diary.name;
        title.style.textAlign = 'center';
        title.style.marginBottom = '30px';
        title.style.fontFamily = diary.font || "'Crimson Pro', serif";
        pdfContainer.appendChild(title);
        
        // Add each page
        diary.pages.forEach((content, index) => {
            const pageElement = document.createElement('div');
            pageElement.className = 'pdf-page';
            pageElement.style.marginBottom = '30px';
            pageElement.style.padding = '20px';
            pageElement.style.backgroundColor = diary.pageColor;
            pageElement.style.borderRadius = '8px';
            pageElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
            pageElement.style.fontFamily = diary.font || "'Crimson Pro', serif";
            
            // Page header
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.marginBottom = '15px';
            header.style.paddingBottom = '10px';
            header.style.borderBottom = '1px solid rgba(0, 0, 0, 0.1)';
            
            const pageNumber = document.createElement('div');
            pageNumber.textContent = `Page ${index + 1}`;
            pageNumber.style.fontStyle = 'italic';
            pageNumber.style.color = '#666';
            
            header.appendChild(pageNumber);
            pageElement.appendChild(header);
            
            // Page content
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = content;
            pageElement.appendChild(contentDiv);
            
            pdfContainer.appendChild(pageElement);
        });
        
        // Temporarily add to document for PDF conversion
        document.body.appendChild(pdfContainer);
        
        // Configure PDF options
        const options = {
            margin: 10,
            filename: `${diary.name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Generate PDF
        html2pdf().from(pdfContainer).set(options).save().then(() => {
            // Remove temporary element
            document.body.removeChild(pdfContainer);
            hideLoading();
            showToast('PDF exported successfully!', 'success');
        }).catch(error => {
            console.error('Error exporting PDF:', error);
            document.body.removeChild(pdfContainer);
            hideLoading();
            showToast('Failed to export PDF', 'error');
        });
    }
    
    // Export notebook as DOCX
    function exportAsDocx() {
        if (!currentDiaryId) {
            showToast('Please select a notebook first', 'error');
            return;
        }
        
        // Show loading animation
        showLoading();
        
        try {
            const diary = diaries[currentDiaryId];
            
            // Create a new document
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: [
                        new docx.Paragraph({
                            text: diary.name,
                            heading: docx.HeadingLevel.HEADING_1,
                            alignment: docx.AlignmentType.CENTER,
                            spacing: { after: 400 }
                        })
                    ]
                }]
            });
            
            // Add each page content
            diary.pages.forEach((content, index) => {
                // Add page header
                doc.addSection({
                    children: [
                        new docx.Paragraph({
                            text: `Page ${index + 1}`,
                            style: "pageHeader",
                            spacing: { after: 200 }
                        }),
                        
                        // Extract text from HTML content
                        new docx.Paragraph({
                            text: extractTextFromHtml(content),
                            spacing: { after: 200 }
                        }),
                        
                        // Add page break if not the last page
                        ...(index < diary.pages.length - 1 ? [new docx.Paragraph({
                            text: "",
                            pageBreakBefore: true
                        })] : [])
                    ]
                });
            });
            
            // Generate and save the document
            docx.Packer.toBlob(doc).then(blob => {
                saveAs(blob, `${diary.name.replace(/\s+/g, '_')}.docx`);
                hideLoading();
                showToast('DOCX exported successfully!', 'success');
            });
        } catch (error) {
            console.error('Error exporting DOCX:', error);
            hideLoading();
            showToast('Failed to export DOCX', 'error');
        }
    }
    
    // Helper function to extract text from HTML
    function extractTextFromHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
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
    
    // Toggle dropdown menu
    function toggleDropdown(dropdown) {
        dropdown.classList.toggle('show');
        
        // Close dropdown when clicking outside
        if (dropdown.classList.contains('show')) {
            function closeDropdown(e) {
                if (!e.target.matches('.dropdown-toggle') && !e.target.closest('.dropdown-menu')) {
                    dropdown.classList.remove('show');
                    document.removeEventListener('click', closeDropdown);
                }
            }
            
            // Add the event listener after a short delay to avoid immediate trigger
            setTimeout(() => {
                document.addEventListener('click', closeDropdown);
            }, 10);
        }
    }
    
    // Show formatting help modal
    function showFormattingHelp() {
        formattingHelpModal.style.display = 'flex';
    }
    
    // Setup event listeners safely
    function setupEventListeners() {
        // Delete button
        if (deleteDiaryBtn) {
            deleteDiaryBtn.addEventListener('click', function() {
                if (confirmDeleteModal) {
                    confirmDeleteModal.style.display = 'flex';
                } else {
                    // Fallback if modal isn't available
                    if (confirm('Are you sure you want to delete this notebook?')) {
                        deleteDiary();
                    }
                }
            });
        }
        
        // Confirm delete button
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', function() {
                deleteDiary();
                if (confirmDeleteModal) {
                    confirmDeleteModal.style.display = 'none';
                }
            });
        }
        
        // Close modal buttons
        if (closeModalButtons.length > 0) {
            closeModalButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
                });
            });
        }
        
        // Close modal buttons (secondary)
        if (closeModalBtns.length > 0) {
            closeModalBtns.forEach(button => {
                button.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
                });
            });
        }
        
        // Click outside modal to close
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
        
        // Color options
        if (colorOptions.length > 0) {
            colorOptions.forEach(color => {
                color.addEventListener('click', function() {
                    colorOptions.forEach(c => c.classList.remove('active'));
                    this.classList.add('active');
                    currentColor = this.dataset.color;
                });
            });
        }
        
        // Font options
        if (fontOptions.length > 0) {
            fontOptions.forEach(option => {
                option.addEventListener('click', function() {
                    changeFont(this.dataset.font);
                });
            });
        }
        
        // Focus mode toggle
        if (focusModeBtn) {
            focusModeBtn.addEventListener('click', () => toggleFocusMode());
        }
        
        // Help button
        if (helpBtn && formattingHelpModal) {
            helpBtn.addEventListener('click', () => {
                formattingHelpModal.style.display = 'flex';
            });
        }
        
        // Export functionality
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const dropdown = document.querySelector('#export-btn + .dropdown-menu');
                if (dropdown) toggleDropdown(dropdown);
            });
        }
        
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', exportAsPDF);
        }
        
        if (exportDocxBtn) {
            exportDocxBtn.addEventListener('click', exportAsDocx);
        }
        
        // Font dropdown
        if (fontBtn) {
            fontBtn.addEventListener('click', () => {
                const dropdown = document.querySelector('#font-btn + .dropdown-menu');
                if (dropdown) toggleDropdown(dropdown);
            });
        }
    }
    
    // Auto save every 10 seconds
    setInterval(saveDiary, 10000);
    
    // Initialize the app
    setupEventListeners();
    init();
});