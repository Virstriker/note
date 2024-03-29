const apiUrl = 'https://www.mynotes.somee.com/api/Notes';
var localStorageNotes = JSON.parse(localStorage.getItem('notes')) || [];
var likedNotes = JSON.parse(localStorage.getItem('likedNotes')) || [];
var decodedNotes = [];
// Loader elements
const loaderContainer = document.getElementById('loaderContainer');

// Function to show loader
const showLoader = () => {
    loaderContainer.style.display = 'flex';
};

// Function to hide loader
const hideLoader = () => {
    loaderContainer.style.display = 'none';
};

const startButton = document.getElementById('startButton');
const noteForm = document.getElementById('noteForm');
const notesContainer = document.getElementById('notes-container');
const notificationContainer = document.getElementById('notificationContainer');

// Function to show notification
const showNotification = (message, type = 'success') => {
    // Your existing showNotification code
};

// Function to show success notification
const showSuccessNotification = (message) => {
    showNotification(message, 'success');
};

// Function to show error notification
const showErrorNotification = (message) => {
    showNotification(message, 'error');
};

// Function to show the form and hide the button
const showForm = () => {
    startButton.style.display = 'none';
    noteForm.style.display = 'block';
};

const fetchAndDisplayNotes = async (page = 1, pageSize = 5) => {
    try {
        const response = await fetch(apiUrl);
        const fetchedNotes = await response.json();

        // Decode special characters in titles and contents
        decodedNotes = fetchedNotes.map(note => ({
            ...note,
            title: decodeURIComponent(note.title),
            content: decodeURIComponent(note.content),
        }));

        // Sort notes by the number of likes in descending order
        const sortedNotes = decodedNotes.sort((a, b) => b.likes - a.likes);

        // Reverse the entire array
        const reversedNotes = sortedNotes;

        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const notesToDisplay = reversedNotes.slice(startIdx, endIdx);

        notesContainer.innerHTML = '';
        notesContainer.classList.add('fade-in-slide-down');

        notesToDisplay.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.innerHTML = `<strong>${note.title}</strong><br>${note.content}
            <br>${note.likes}❤️
            <br>
            <button id="likeButton_${note.id}" onclick="handleLike(${note.id})">❤️</button>
            <button onclick="deleteNote(${note.id})">Delete</button>
            <button onclick="updateNote(${note.id}, '${encodeURIComponent(note.title)}', '${encodeURIComponent(note.content)}')">Update</button>`;

            notesContainer.appendChild(noteElement);
        });

        // Add pagination controls
        const totalPages = Math.ceil(sortedNotes.length / pageSize);
        addPaginationControls(page, totalPages);
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
};




const addPaginationControls = (currentPage, totalPages) => {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';

    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.onclick = () => fetchAndDisplayNotes(i);
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        paginationContainer.appendChild(pageButton);
    }

    notesContainer.appendChild(paginationContainer);
};

// Function to fetch and display notes with loader
const fetchAndDisplayNotesWithLoader = async (page = 1, pageSize = 5) => {
    try {
        showLoader();
        await fetchAndDisplayNotes(page, pageSize);
    } finally {
        hideLoader();
    }
};

// Function to add note
const addNote = async (title, content) => {
    const sanitizedTitle = title.replace(/'/g, '');
    const sanitizedContent = content.replace(/'/g, '');

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: sanitizedTitle,
                content: sanitizedContent,
                likes: 0,
            }),
        });

        if (response.ok) {
            localStorageNotes.push({ title: sanitizedTitle, content: sanitizedContent, likes: 0 });
            localStorage.setItem('notes', JSON.stringify(localStorageNotes));

            fetchAndDisplayNotes();
            noteForm.reset();
            showSuccessNotification('Note added successfully!');
        } else {
            console.error('Failed to add note:', response.statusText);
            showErrorNotification('Failed to add note');
        }
    } catch (error) {
        console.error('Error adding note:', error);
        showErrorNotification('Error adding note');
    }
};

// Function to delete note
const deleteNote = async (id) => {
    try {
        const response = await fetch(`${apiUrl}/${id}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            fetchAndDisplayNotes();
            showSuccessNotification('Note deleted successfully!');
        } else {
            console.error('Failed to delete note:', response.statusText);
            showErrorNotification('Failed to delete note');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showErrorNotification('Error deleting note');
    }
};

// Function to update note
const updateNote = async (id, title, content) => {
    const newTitle = prompt('Enter new title:', title);
    const newContent = prompt('Enter new content:', content);

    if (newTitle !== null && newContent !== null) {
        try {
            const response = await fetch(`${apiUrl}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id,
                    title: newTitle,
                    content: newContent,
                    likes: 0,
                }),
            });

            if (response.ok) {
                fetchAndDisplayNotes();
            } else {
                console.error('Failed to update note:', response.statusText);
            }
        } catch (error) {
            console.error('Error updating note:', error);
        }
    }
};

// Function to handle like button click
const handleLike = async (id) => {
    var iff = false;
    var notes = likedNotes;
    notes.forEach(element => {
        if(element == id){
            iff=true;
        }
    });
    if (iff) {
        try {
            const response = await fetch(`${apiUrl}/RemoveLike/${id}`, {
                method: 'PUT',
            });

            if (response.ok) {
                likedNotes = likedNotes.filter(noteId => noteId !== id);
                localStorage.setItem('likedNotes', JSON.stringify(likedNotes));

                fetchAndDisplayNotes();
                showSuccessNotification('Like removed successfully!');
            } else {
                console.error('Failed to remove like:', response.statusText);
                showErrorNotification('Failed to remove like');
            }
            iff = false;
        } catch (error) {
            console.error('Error removing like:', error);
            showErrorNotification('Error removing like');
        }
    } else {
        try {
            const response = await fetch(`${apiUrl}/AddLike/${id}`, {
                method: 'PUT',
            });

            if (response.ok) {
                likedNotes.push(id);
                localStorage.setItem('likedNotes', JSON.stringify(likedNotes));

                fetchAndDisplayNotes();
                showSuccessNotification('Like added successfully!');
            } else {
                console.error('Failed to add like:', response.statusText);
                showErrorNotification('Failed to add like');
            }
        } catch (error) {
            console.error('Error adding like:', error);
            showErrorNotification('Error adding like');
        }
    }
};

// Your existing code for pagination, searchNotes, showComments, showAllComments, etc.

// Event listener for form submission
noteForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;

    addNote(title, content);
    startButton.style.display = 'block';
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
});

// Your existing code for modal functionality, searchNotes, showComments, showAllComments, etc.

// Initial fetch and display notes
fetchAndDisplayNotes();

const openModal = () => {
    const modal = document.getElementById('myModal');
    modal.style.display = 'flex';
};

// Function to close the modal
const closeModal = () => {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
};

// Function to add a new note from the modal
const addNoteModal = () => {
    const title = document.getElementById('titleModal').value;
    const content = document.getElementById('contentModal').value;

    addNote(title, content);

    // Close the modal after adding a note
    closeModal();
};
const handleSearchInput = () => {
    const searchTerm = document.getElementById('searchBar').value.trim();
    const searchButton = document.getElementById('searchButton');

    if (searchTerm === '') {
        // If search input is empty, display all notes with pagination
        fetchAndDisplayNotes();
        searchButton.textContent = 'Search';
    } else {
        searchButton.textContent = 'Search';
    }
};

const searchNotes = () => {
    const searchTerm = document.getElementById('searchBar').value.trim().toLowerCase();

    if (searchTerm === '') {
        // If search input is empty, display all notes with pagination
        fetchAndDisplayNotes();
        return;
    }

    const filteredNotes = decodedNotes.filter(note =>
        note.title.toLowerCase().includes(searchTerm) || note.content.toLowerCase().includes(searchTerm)
    );

    if (filteredNotes.length > 0) {
        notesContainer.innerHTML = '';
        notesContainer.classList.add('fade-in-slide-down');

        filteredNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.innerHTML = `<strong>${note.title}</strong><br>${note.content}
                <br>${note.likes}❤️
                <br>
                <button id="likeButton_${note.id}" onclick="handleLike(${note.id})">❤️</button>
                <button onclick="deleteNote(${note.id})">Delete</button>
                <button onclick="updateNote(${note.id}, '${encodeURIComponent(note.title)}', '${encodeURIComponent(note.content)}')">Update</button>`;

            notesContainer.appendChild(noteElement);
        });
    } else {
        notesContainer.innerHTML = 'No matching notes found.';
    }
};



const showComments = (title) => {
    const comments = localStorageNotes.filter(note => note.title === title);

    if (comments.length > 0) {
        alert(`Comments for ${title}:\n${comments.map(comment => comment.content).join('\n')}`);
    } else {
        alert(`No comments for ${title}`);
    }
};
const showAllComments = () => {
    const notesInLocalStorage = localStorageNotes.map(note => note.content);
    
    if (notesInLocalStorage.length > 0) {
        notesContainer.innerHTML = '';
        notesContainer.classList.add('fade-in-slide-down');

        decodedNotes.forEach(note => {
            if (notesInLocalStorage.includes(note.content)) {
                const noteElement = document.createElement('div');
                noteElement.className = 'note';
                noteElement.innerHTML = `<strong>${note.title}</strong><br>${note.content}
                    <br>${note.likes}❤️
                    <br>
                    <button id="likeButton_${note.id}" onclick="handleLike(${note.id})">❤️</button>
                    <button onclick="deleteNote(${note.id})">Delete</button>
                    <button onclick="updateNote(${note.id}, '${encodeURIComponent(note.title)}', '${encodeURIComponent(note.content)}')">Update</button>`;

                notesContainer.appendChild(noteElement);
            }
        });
    } else {
        notesContainer.innerHTML = 'No notes found in localStorage.';
    }
};

