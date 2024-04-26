function openTab(tabName, elmnt) {
    //console.log('Switching tab:', tabName);
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    var tablinks = document.getElementsByClassName("tablink");
    for (let i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }

    document.getElementById(tabName).style.display = "block";
    elmnt.style.backgroundColor = '#003c77';

    if (tabName === 'Sorting') {
        generateArray();
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    const form = document.getElementById('reservationForm');
    form.addEventListener('submit', handleSubmit);

    function handleSubmit(event) {
        event.preventDefault(); // Prevent the default form submission behavior
        const formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            auId: document.getElementById('auId').value,
            date: document.getElementById('date').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            roomNumber: document.getElementById('roomNumber').value,
        };

        saveReservation(formData);
        event.target.reset(); // Reset the form fields
    }

    function saveReservation(data) {
        const reservationId = `reservation-${Date.now()}`; // Generate a unique ID
        localStorage.setItem(reservationId, JSON.stringify(data));
        displayConfirmation(data, reservationId); // Pass reservationId to displayConfirmation
    }

    function displayConfirmation(reservationData, reservationId) {
        const modal = document.getElementById("confirmationModal");
        modal.style.display = "block";

        const modalText = document.getElementById("modalText");
        modalText.innerHTML = `Thank you for using NoteNest! Reservation confirmed for ${reservationData.firstName} ${reservationData.lastName} on ${reservationData.date}. Keep this QR code to verify your reservation.`;

        const qrContainer = document.getElementById('qrContainer');
        qrContainer.innerHTML = ''; // Clear previous content
        new QRCode(qrContainer, {
            text: `Reservation: ${JSON.stringify(reservationData)}`,
            width: 128,
            height: 128
        });

        setupModalCloseHandlers(modal);
        setupFeedbackAndCancellationHandlers(reservationId);
    }

    function setupModalCloseHandlers(modal) {
        modal.querySelector(".close").onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    }

    function setupFeedbackAndCancellationHandlers(reservationId) {
        document.getElementById("cancelReservation").onclick = () => cancelReservation(reservationId);
        document.getElementById("Feedback").onclick = () => document.getElementById("feedbackModal").style.display = "block";
        document.getElementById("feedbackForm").addEventListener("submit", handleFeedback);
    }

    function handleFeedback(event) {
        event.preventDefault();
        const formData = {
            roomNumber: document.getElementById("feedbackRoomNumber").value,
            score: parseInt(document.getElementById("feedbackScore").value),
            pros: document.getElementById("feedbackPros").value,
            cons: document.getElementById("feedbackCons").value,
        };

        updateRoomFeedback(formData);
        document.getElementById("feedbackModal").style.display = "none";
    }

    function updateRoomFeedback({ roomNumber, score, pros, cons }) {
        let roomData = JSON.parse(localStorage.getItem(`room-${roomNumber}`)) || { scores: [], pros: [], cons: [] };
        roomData.scores.push(score);
        roomData.pros.push(pros);
        roomData.cons.push(cons);
        localStorage.setItem(`room-${roomNumber}`, JSON.stringify(roomData));
        updateRoomContent(roomNumber, roomData);
    }

    function updateRoomContent(roomNumber, roomData) {
        const avgScore = roomData.scores.reduce((a, b) => a + b, 0) / roomData.scores.length;
        const prosText = roomData.pros.join('<br>');
        const consText = roomData.cons.join('<br>');
    
        // Find the correct practice room `h2` based on room number and update its content
        const bubbles = document.querySelectorAll(".bubble h2");
        bubbles.forEach((h2) => {
            if (h2.textContent.includes(`Practice Room ${roomNumber}:`)) {
                const bubble = h2.parentElement;
                bubble.innerHTML = `
                    <h2>Practice Room ${roomNumber}:</h2>
                    <p>Score: ${avgScore.toFixed(2)} <br>
                        Pros: ${prosText} <br>
                        Cons: ${consText}</p>
                `;
            }
        });
    }

    function cancelReservation(reservationId) {
        const reservationData = JSON.parse(localStorage.getItem(reservationId));
        if (!reservationData) {
            console.log("No reservation found with ID:", reservationId);
            return;
        }
        localStorage.removeItem(reservationId);
        displayCancellation(reservationData);
    }

    function displayCancellation(reservationData) {
        const modal = document.getElementById("cancellationModal");
        modal.style.display = "block";

        const cancellationText = document.getElementById("cancellationText");
        cancellationText.innerHTML = `Reservation for ${reservationData.firstName} ${reservationData.lastName} on ${reservationData.date} has been canceled.`;

        setupModalCloseHandlers(modal);
    }
});