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
        event.target.reset();
    }

    function saveReservation(data) {
        const reservationId = `reservation-${Date.now()}`; // Generate a unique ID
        localStorage.setItem(reservationId, JSON.stringify(data));
        displayConfirmation(data, reservationId); // Pass reservationId to displayConfirmation
    }

    function displayConfirmation(reservationData, reservationId) {
        const modal = document.getElementById("confirmationModal");
        const span = document.getElementsByClassName("close")[0];
        const modalText = document.getElementById("modalText");
    
        // Update modal text with reservation details
        modalText.innerHTML = `Thank you for using NoteNest! Reservation confirmed for ${reservationData.firstName} ${reservationData.lastName} on ${reservationData.date}. Keep this QR code to verify your reservation.`;

        // Generate the QR content based on reservation data
        let qrContainer = document.getElementById('qrContainer');
        qrContainer.innerHTML = ''; // Clear previous content
        new QRCode(qrContainer, {
            text: `Reservation: ${JSON.stringify(reservationData)}`,
            width: 128,
            height: 128
        });

        modal.style.display = "block";

        span.onclick = function() {
            modal.style.display = "none";
        };

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };

        const cancelBtn = document.getElementById("cancelReservation");
        cancelBtn.onclick = function() {
            cancelReservation(reservationId);
            modal.style.display = "none";
        };

        const feedbackBtn = document.getElementById("Feedback");
        feedbackBtn.onclick = function() {
            document.getElementById("feedbackModal").style.display = "block";
        };
    
        const closeFeedback = document.getElementsByClassName("closeFeedback")[0];
        closeFeedback.onclick = function() {
        document.getElementById("feedbackModal").style.display = "none";
        };

    // Add the following code to close the modal when clicking outside of it
        window.onclick = function(event) {
            const feedbackModal = document.getElementById("feedbackModal");
            if (event.target == feedbackModal) {
                feedbackModal.style.display = "none";
            }
        };

        document.getElementById("feedbackForm").addEventListener("submit", function(event) {
            event.preventDefault();
        
            const roomNumber = document.getElementById("feedbackRoomNumber").value;
            const score = parseInt(document.getElementById("feedbackScore").value);
            const pros = document.getElementById("feedbackPros").value;
            const cons = document.getElementById("feedbackCons").value;
        
            // Retrieve existing data for the room or initialize it
            let roomData = JSON.parse(localStorage.getItem(`room-${roomNumber}`)) || {
                scores: [],
                pros: [],
                cons: []
            };
        
            // Update the room data
            roomData.scores.push(score);
            roomData.pros.push(pros);
            roomData.cons.push(cons);
        
            // Save updated data back to storage
            localStorage.setItem(`room-${roomNumber}`, JSON.stringify(roomData));
        
            updateRoomContent(roomNumber, roomData);
            document.getElementById("feedbackModal").style.display = "none";
        });
        
        function updateRoomContent(roomNumber, roomData) {
            const avgScore = roomData.scores.reduce((a, b) => a + b, 0) / roomData.scores.length;
            const prosText = roomData.pros.join('<br>');
            const consText = roomData.cons.join('<br>');
        
            // Find all practice room elements and update the correct one
            const bubbles = document.querySelectorAll(".bubble h2");
            bubbles.forEach((h2) => {
                if (h2.textContent.trim() === `Practice Room ${roomNumber}:`) {
                    const bubble = h2.parentElement;
                    bubble.innerHTML = `
                        <H2>Practice Room ${roomNumber}:</H2>
                        <P>Score: ${avgScore.toFixed(2)} <br>
                            Pros: ${prosText} <br>
                            Cons: ${consText}
                        </P>`;
                }
            });
        }}  
            

    function displayCancellation(reservationData) {
        const modal = document.getElementById("cancellationModal");
        const span = document.getElementsByClassName("closeCancellation")[0];
        const cancellationText = document.getElementById("cancellationText");
    
        // Update modal text with detailed cancellation info
        cancellationText.innerHTML = `Reservation for ${reservationData.firstName} ${reservationData.lastName} on ${reservationData.date} has been canceled.`;

        modal.style.display = "block";
    
        span.onclick = function() {
            modal.style.display = "none";
        };
    
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };
    }
    
    function cancelReservation(reservationId) {
        const reservationData = JSON.parse(localStorage.getItem(reservationId));
        if (!reservationData) {
            console.log("No reservation found with ID:", reservationId);
            return;
        }
    
        localStorage.removeItem(reservationId);
        console.log("Reservation cancelled: " + reservationId);
        displayCancellation(reservationData); // Call to display the cancellation modal with the reservation data
    }
    
});

