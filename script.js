const apiUrl = 'https://www.mynotes.somee.com/api/Notes';
var localStorageNotes = JSON.parse(localStorage.getItem('notes')) || [];
var likedNotes = JSON.parse(localStorage.getItem('likedNotes')) || [];

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

// Function to fetch and display notes
const fetchAndDisplayNotes = async (page = 1, pageSize = 5) => {
    try {
        const response = await fetch(apiUrl);
        const fetchedNotes = await response.json();

        // Decode special characters in titles and contents
        const decodedNotes = fetchedNotes.map(note => ({
            ...note,
            title: decodeURIComponent(note.title),
            content: decodeURIComponent(note.content),
        }));

        // Reverse the entire array
        const reversedNotes = decodedNotes.reverse();

        const startIdx = (page - 1) * pageSize;
        const endIdx = startIdx + pageSize;
        const notesToDisplay = reversedNotes.slice(startIdx, endIdx);

        notesContainer.innerHTML = '';
        notesContainer.classList.add('fade-in-slide-down');

        notesToDisplay.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.className = 'note';
            noteElement.innerHTML = `<strong>${note.title}</strong><br>${note.content}
                <br>
                <span>Likes: ${note.likes}</span>
                <button onclick="handleLike(${note.id})">Like</button>
                <button onclick="deleteNote(${note.id})">Delete</button>
                <button onclick="updateNote(${note.id}, '${encodeURIComponent(note.title)}', '${encodeURIComponent(note.content)}')">Update</button>`;

            notesContainer.appendChild(noteElement);
        });

        // Add pagination controls
        const totalPages = Math.ceil(reversedNotes.length / pageSize);
        addPaginationControls(page, totalPages);
    } catch (error) {
        console.error('Error fetching notes:', error);
    }
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
    const searchTerm = document.getElementById('searchBar').value;
    const filteredNotes = allNotes.filter(note => note.title.toLowerCase().includes(searchTerm));

    notesContainer.innerHTML = '';
    notesContainer.classList.add('fade-in-slide-down');

    filteredNotes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note';
        noteElement.innerHTML = `<strong>${note.title}</strong><br>${note.content}
            <br>
            <button onclick="deleteNote(${note.id})">Delete</button>
            <button onclick="updateNote(${note.id}, '${note.title}', '${note.content}')">Update</button>`;

        notesContainer.appendChild(noteElement);
    });
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
    const allComments = localStorageNotes.map(comment => comment.content);

    if (allComments.length > 0) {
        alert(`All Comments:\n${allComments.join('\n')}`);
    } else {
        alert('No comments found.');
    }
};
