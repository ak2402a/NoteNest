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
    populateTimeLabels();
    const confirmationModal = document.getElementById('confirmationModal');
    const feedbackModal = document.getElementById('feedbackModal');
    const cancellationModal = document.getElementById('cancellationModal');

    if (confirmationModal) setupModalCloseHandlers(confirmationModal);
    if (feedbackModal) setupModalCloseHandlers(feedbackModal);
    if (cancellationModal) setupModalCloseHandlers(cancellationModal);

    const form = document.getElementById('reservationForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error('reservationForm element not found');
    }

    const dateElement = document.getElementById('date');
    if (dateElement) {
        dateElement.addEventListener('change', function() {
            displayRoomAvailability(this.value);
        });
    } else {
        console.error('date element not found');
    }

    function handleSubmit(event) {
        event.preventDefault(); // Prevent default form submission
    
        // Gather form data
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            auId: document.getElementById('auId').value.trim(),
            date: document.getElementById('date').value.trim(),
            startTime: document.getElementById('startTime').value.trim(),
            endTime: document.getElementById('endTime').value.trim(),
            roomNumber: document.getElementById('roomNumber').value.trim(),
        };
    
        // Validate form data
        if (!isValidReservation(formData)) {
            return; // Stop processing if data is invalid
        }
    
        saveReservation(formData);
        event.target.reset(); // Reset form fields after processing
    }
    
    function isValidReservation(data) {
        return data.firstName && data.lastName && data.auId && data.date && data.startTime && data.endTime && data.roomNumber;
    }

    function saveReservation(data) {
        if (isRoomAvailable(data.roomNumber, data.date, convertTimeToMinutes(data.startTime), convertTimeToMinutes(data.endTime))) {
            const reservationId = `reservation-${Date.now()}`; // Unique ID for the reservation
            data.id = reservationId; // Ensure this is the only place the reservation ID is set
            let roomReservations = JSON.parse(localStorage.getItem(`reservations-room-${data.roomNumber}`)) || [];
            roomReservations.push(data);
            localStorage.setItem(`reservations-room-${data.roomNumber}`, JSON.stringify(roomReservations));
            console.log('Reservation data saved:', data);
            displayConfirmation(data, reservationId);
            displayRoomAvailability(data.date);
        } else {
            alert("The room is already booked for the specified time. Please select another time or room.");
        }
    }
    
    function isRoomAvailable(roomNumber, date, startTime, endTime) {
        const reservations = JSON.parse(localStorage.getItem(`reservations-room-${roomNumber}`)) || [];
        return !reservations.some(reservation => {
            const reservationStart = convertTimeToMinutes(reservation.startTime);
            const reservationEnd = convertTimeToMinutes(reservation.endTime);
            return reservation.date === date && (startTime < reservationEnd && endTime > reservationStart);
        });
    }

    function displayConfirmation(reservationData, reservationId) {
        const modal = document.getElementById("confirmationModal");
        if (modal) { // Check if modal exists before setting up handlers
            setupModalCloseHandlers(modal);
        } else {
            console.error("Modal element not found!");
        }
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

        setupFeedbackAndCancellationHandlers(reservationId);
    }

    function setupFeedbackAndCancellationHandlers(reservationId) {
        document.getElementById("cancelReservation").onclick = () => cancelReservation(reservationId);
        document.getElementById("Feedback").onclick = () => {
            document.getElementById("feedbackModal").style.display = "block";
            const feedbackForm = document.getElementById("feedbackForm");
            if (feedbackForm) {
                feedbackForm.addEventListener("submit", handleFeedback);
            } else {
                console.error("feedbackForm element not found");
            }
        };
    }

    function handleFeedback(event) {
        event.preventDefault();
        const feedbackData = {
            roomNumber: document.getElementById("feedbackRoomNumber").value,
            score: parseInt(document.getElementById("feedbackScore").value),
            pros: document.getElementById("feedbackPros").value,
            cons: document.getElementById("feedbackCons").value,
        };

        updateRoomFeedback(feedbackData);
        document.getElementById("feedbackModal").style.display = "none";
        document.getElementById("feedbackForm").reset(); // Reset the form fields
        alert("Thank you for your feedback!");
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

        const bubbles = document.querySelectorAll(".bubble h2");
        bubbles.forEach((h2) => {
            if (h2.textContent.includes(`Practice Room ${roomNumber}:`)) {
                const bubble = h2.parentElement;
                bubble.innerHTML = `
                    <h2>Practice Room ${roomNumber}:</h2>
                    <p>Score: ${avgScore.toFixed(2)} <br> Pros: ${prosText} <br> Cons: ${consText}</p>
                `;
            }
        });
    }

    function cancelReservation(reservationId) {
        let found = false;
        // Check all rooms for the reservation ID
        for (let roomNumber = 1; roomNumber <= 10; roomNumber++) {
            let roomReservations = JSON.parse(localStorage.getItem(`reservations-room-${roomNumber}`)) || [];
            const index = roomReservations.findIndex(reservation => reservation.id === reservationId);
            if (index !== -1) {
                roomReservations.splice(index, 1); // Remove the reservation
                localStorage.setItem(`reservations-room-${roomNumber}`, JSON.stringify(roomReservations));
                console.log("Reservation cancelled with ID:", reservationId);
                displayCancellation(); // Assuming displayCancellation handles the UI update
                found = true;
                break;
            }
        }
        if (!found) {
            console.error("No reservation found with ID:", reservationId);
            alert("No reservation found with ID: " + reservationId);
        }
    }

    function displayCancellation(reservationData) {
        const modal = document.getElementById("cancellationModal");
        if (modal) { // Check if modal exists before setting up handlers
            setupModalCloseHandlers(modal);
        } else {
            console.error("Modal element not found!");
        }
        modal.style.display = "block";

        const cancellationText = document.getElementById("cancellationText");
        cancellationText.innerHTML = `Reservation for ${reservationData.firstName} ${reservationData.lastName} on ${reservationData.date} has been canceled.`;
    }

    function isBooked(roomNumber, date, startTime) {
        const reservations = JSON.parse(localStorage.getItem(`reservations-room-${roomNumber}`)) || [];
        //console.log('Checking reservations for room', roomNumber, 'on', date, 'at', startTime);
        // Assuming startTime is a number like 540 (for 9:00 AM), 570 (for 9:30 AM), etc.
        return reservations.some(reservation => {
            const reservationStart = convertTimeToMinutes(reservation.startTime);
            const reservationEnd = convertTimeToMinutes(reservation.endTime);
            return reservation.date === date && startTime >= reservationStart && startTime < reservationEnd;
        });
    }
    
    function convertTimeToMinutes(timeStr) {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    }
    
    function displayRoomAvailability(date) {
        console.log('Updating room availability for date:', date);
        const roomsAvailability = document.getElementById('roomsAvailability');
        roomsAvailability.innerHTML = ''; // Clear previous entries
    
        // Loop through each room
        for (let roomNumber = 1; roomNumber <= 10; roomNumber++) {
            const roomElement = document.createElement('div');
            roomElement.className = 'roomAvailability';
            roomElement.innerHTML = `<h3>Room ${roomNumber}</h3>`;
            const daySchedule = document.createElement('div');
            daySchedule.className = 'daySchedule';
    
            // Create blocks for each 30 minutes from 9 AM to 5 PM
            for (let time = 540; time < 1020; time += 30) {
                const timeBlock = document.createElement('div');
                timeBlock.className = 'timeBlock';
                if (isBooked(roomNumber, date, time)) {
                    timeBlock.style.backgroundColor = 'grey'; // Mark as booked
                    //console.log(`Booking found: Room ${roomNumber}, Time ${time}`);
                }
                daySchedule.appendChild(timeBlock);
            }
    
            roomElement.appendChild(daySchedule);
            roomsAvailability.appendChild(roomElement);
        }
    }
    

    function populateTimeLabels() {
        const labelContainer = document.querySelector('.time-labels');
        labelContainer.innerHTML = ''; // Clear existing labels
    
        const startTime = 540; // 9 AM in minutes
        const endTime = 1020; // 5 PM in minutes
    
        for (let time = startTime; time <= endTime; time += 30) { // changed from 15 to 30 for a less cluttered display
            const hours = Math.floor(time / 60);
            const minutes = time % 60;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 === 0 ? 12 : hours % 12;
            const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')}`;
            
            const timeLabel = document.createElement('div');
            timeLabel.className = 'time-block-label';
            timeLabel.innerHTML = `<span class="time">${timeString}</span><br><span class="ampm">${ampm}</span>`; // Display time and AM/PM on separate lines
            labelContainer.appendChild(timeLabel);
        }
    }
});

//After DOM Loaded to prevent errors
function setupModalCloseHandlers(modal) {
    // Close button for the modal
    const closeButton = modal.querySelector('.closeCancellation, .closeFeedback');

    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Close the modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}