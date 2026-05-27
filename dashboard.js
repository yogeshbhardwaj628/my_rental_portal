let allFlats = JSON.parse(localStorage.getItem('localFlats')) || [];
let allBookings = JSON.parse(localStorage.getItem('localBookings')) || [];
let allMessages = JSON.parse(localStorage.getItem('localMessages')) || [];
let activeUser = JSON.parse(localStorage.getItem('activePortalUser'));

let activeChatRoomId = null;
let chatInterval = null;
let selectedUserRole = null;

const searchFilter = document.getElementById('searchFilter');
const priceFilter = document.getElementById('priceFilter');
const priceValue = document.getElementById('priceValue');

const roleScreen = document.getElementById('roleScreen');
const mainWorkspace = document.getElementById('mainWorkspace');
const ownerSection = document.getElementById('ownerSection');
const customerBookingsPanel = document.getElementById('customerBookingsPanel');
const galleryTitle = document.getElementById('galleryTitle');
const changeRoleBtn = document.getElementById('changeRoleBtn');

const chatBubbleIcon = document.getElementById('chatBubbleIcon');
const chatBoxWindow = document.getElementById('chatBoxWindow');
const chatHistoryWindow = document.getElementById('chatHistoryWindow');
const chatInputMessage = document.getElementById('chatInputMessage');
const chatTitleName = document.getElementById('chatTitleName');

// Security Check & User Account Meta Loader
window.addEventListener('DOMContentLoaded', () => {
    if (!activeUser) {
        alert("Access Denied. Please log in first.");
        window.location.href = "index.html";
        return;
    }
    
    // Bind current user object fields straight into layout text nodes
    document.getElementById('displayAccountName').textContent = activeUser.userName || "Not Assigned";
    document.getElementById('displayAccountEmail').textContent = activeUser.email;
    document.getElementById('displayAccountPhone').textContent = activeUser.mobileNo || "Not Assigned";
    
    initializeRoleSelectors();
    loadFlats();
    loadUserBookings();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('activePortalUser');
    window.location.href = "index.html";
});

function initializeRoleSelectors() {
    document.getElementById('chooseCustomer').addEventListener('click', () => { setDashboardRole('customer'); });
    document.getElementById('chooseOwner').addEventListener('click', () => { setDashboardRole('owner'); });
    changeRoleBtn.addEventListener('click', () => {
        roleScreen.style.display = "flex";
        mainWorkspace.style.display = "none";
        changeRoleBtn.style.display = "none";
        selectedUserRole = null;
    });
}

function setDashboardRole(role) {
    selectedUserRole = role;
    roleScreen.style.display = "none";
    mainWorkspace.style.display = "block";
    changeRoleBtn.style.display = "inline-block";

    if (role === 'owner') {
        ownerSection.style.display = "block";
        customerBookingsPanel.style.display = "none";
        galleryTitle.textContent = "My Posted Properties Catalog";
    } else {
        ownerSection.style.display = "none";
        customerBookingsPanel.style.display = "block";
        galleryTitle.textContent = "Available Flats For Booking";
    }
    applyFilters();
}

document.getElementById('flatForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('flatTitle').value;
    const price = document.getElementById('flatPrice').value;
    const address = document.getElementById('flatAddress').value;
    const photoFile = document.getElementById('flatPhoto').files[0];

    if (!photoFile) { alert("Please select a photo!"); return; }

    const reader = new FileReader();
    reader.onload = function(event) {
        const newFlat = {
            id: 'flat_' + Date.now(),
            title: title,
            price: Number(price),
            address: address,
            imageUrl: event.target.result,
            uploadedBy: activeUser.id,
            createdAt: new Date()
        };
        allFlats.push(newFlat);
        localStorage.setItem('localFlats', JSON.stringify(allFlats));
        alert("Success! Flat listing has been saved locally.");
        document.getElementById('flatForm').reset();
        loadFlats(); 
    };
    reader.readAsDataURL(photoFile);
});

function loadFlats() { applyFilters(); }

function applyFilters() {
    const container = document.getElementById('flatsContainer');
    const keyword = searchFilter.value.toLowerCase().trim();
    const maxRent = Number(priceFilter.value);

    let visibleFlats = allFlats;
    if (selectedUserRole === 'owner') {
        visibleFlats = allFlats.filter(flat => flat.uploadedBy === activeUser.id);
    }

    const filteredFlats = visibleFlats.filter(flat => {
        const matchesKeyword = (flat.title || "").toLowerCase().includes(keyword) || (flat.address || "").toLowerCase().includes(keyword);
        return matchesKeyword && Number(flat.price || 0) <= maxRent;
    });

    container.innerHTML = "";
    if (filteredFlats.length === 0) {
        container.innerHTML = "<p style='color: #94a3b8; font-size: 14px; padding: 10px;'>No flats found matching configuration options.</p>";
        return;
    }

    filteredFlats.forEach((flat) => {
        const card = document.createElement('div');
        card.className = 'flat-card';
        const isSoldOut = allBookings.some(b => b.flatId === flat.id);

        let actionHTML = '';
        if (selectedUserRole === 'customer') {
            if (isSoldOut) {
                actionHTML = `<button style="background-color: #ef4444; margin-top: 5px; width: 100%; color:white; font-weight:700; padding:10px; border:none; border-radius:8px; cursor:not-allowed;" disabled>🛑 SOLD OUT</button>`;
            } else {
                actionHTML = `
                    <div style="margin-top: 8px;">
                        <label style="font-size:11px; font-weight:600; color:#94a3b8;">Check-In / Out</label>
                        <div style="display:flex; gap:5px; margin-top:4px;">
                            <input type="date" id="start-${flat.id}" required style="margin:0; padding:6px; font-size:12px;">
                            <input type="date" id="end-${flat.id}" required style="margin:0; padding:6px; font-size:12px;">
                        </div>
                    </div>
                    <button id="book-btn-${flat.id}" style="background-color: #3b82f6; margin-top: 8px; width: 100%; color:white; font-weight:600; padding:10px; border:none; border-radius:8px; cursor:pointer;">Book This Flat</button>
                `;
            }
        } else {
            actionHTML = `<div style="padding: 6px; border-radius: 6px; background: #0f172a; text-align: center; font-size:12px; color:${isSoldOut ? '#ef4444' : '#10b981'}; font-weight:700;">
                ${isSoldOut ? '📆 Status: Booked Out' : '🟢 Status: Active Market'}
            </div>`;
        }

        // Injected 3-Dots Action Button and Context Menu List
        card.innerHTML = `
            <div class="card-menu-dots" id="dots-trigger-${flat.id}">⋮</div>
            <div class="dots-dropdown" id="dropdown-menu-${flat.id}">
                <div id="opt-view-${flat.id}">👁️ View Details</div>
                <div id="opt-share-${flat.id}">🔗 Share Link</div>
            </div>
            <img src="${flat.imageUrl}" alt="Flat Image">
            <div style="display:flex; flex-direction:column; gap:6px; margin-top:5px;">
                <h4>${flat.title}</h4>
                <p><strong>Rent:</strong> ₹${flat.price}/month</p>
                <p><strong>Location:</strong> ${flat.address}</p>
            </div>
            ${actionHTML}
            <button id="chat-btn-${flat.id}" style="background-color: #10b981; margin-top: 5px; width: 100%; color:white; font-weight:600; padding:10px; border:none; border-radius:8px; cursor:pointer;">💬 Chat Room</button>
        `;
        container.appendChild(card);

        // Bind interactive events for 3-dots actions menu
        const dotsTrigger = document.getElementById(`dots-trigger-${flat.id}`);
        const dropdownMenu = document.getElementById(`dropdown-menu-${flat.id}`);
        
        dotsTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentDisplay = dropdownMenu.style.display;
            // Close all active open option elements first
            document.querySelectorAll('.dots-dropdown').forEach(menu => menu.style.display = 'none');
            dropdownMenu.style.display = currentDisplay === 'block' ? 'none' : 'block';
        });

        document.getElementById(`opt-view-${flat.id}`).addEventListener('click', () => { alert(`Property: ${flat.title}\nRent rate: ₹${flat.price}/mo\nLocation details: ${flat.address}`); dropdownMenu.style.display = 'none'; });
        document.getElementById(`opt-share-${flat.id}`).addEventListener('click', () => { alert(`Copied Listing ID to Clipboard: ${flat.id}`); dropdownMenu.style.display = 'none'; });

        if (selectedUserRole === 'customer' && !isSoldOut) {
            document.getElementById(`book-btn-${flat.id}`).addEventListener('click', () => { executeBooking(flat.id, flat.title, flat.price); });
        }
        document.getElementById(`chat-btn-${flat.id}`).addEventListener('click', () => { openChatRoom(flat.id, flat.title); });
    });
}

// Close dropdowns if user clicks anywhere else on the document frame page
document.addEventListener('click', () => {
    document.querySelectorAll('.dots-dropdown').forEach(menu => menu.style.display = 'none');
});

function executeBooking(flatId, flatTitle, flatPrice) {
    const startInput = document.getElementById(`start-${flatId}`).value;
    const endInput = document.getElementById(`end-${flatId}`).value;
    if (!startInput || !endInput) { alert("Please select check-in and check-out dates!"); return; }

    const newBooking = {
        id: 'bk_' + Date.now(),
        flatId: flatId,
        flatTitle: flatTitle,
        price: flatPrice,
        startDate: startInput,
        endDate: endInput,
        userId: activeUser.id,
        status: "Upcoming"
    };
    allBookings.push(newBooking);
    localStorage.setItem('localBookings', JSON.stringify(allBookings));
    alert(`🎉 Success! Your trip to "${flatTitle}" is booked.`);
    loadFlats(); 
    loadUserBookings();
}

function loadUserBookings() {
    const bookingContainer = document.getElementById('bookingsContainer');
    bookingContainer.innerHTML = "";
    const myBookings = allBookings.filter(b => b.userId === activeUser.id);

    if (myBookings.length === 0) {
        bookingContainer.innerHTML = "<p style='color: #94a3b8; font-size: 14px; padding:10px;'>You haven't reserved any flat units inside this workspace yet.</p>";
        return;
    }
    myBookings.forEach(booking => {
        bookingContainer.innerHTML += `
            <div class="flat-card" style="border-left: 4px solid #10b981; background: #0f172a;">
                <h4 style="font-size:15px;">${booking.flatTitle}</h4>
                <p style="font-size:12px;"><strong>Check-In:</strong> ${booking.startDate}</p>
                <p style="font-size:12px;"><strong>Check-Out:</strong> ${booking.endDate}</p>
                <span style="background:#10b981; color:white; font-size:10px; padding:2px 6px; border-radius:4px; font-weight:700; width:fit-content; margin-top:2px;">${booking.status}</span>
            </div>`;
    });
}

function openChatRoom(flatId, title) {
    activeChatRoomId = flatId;
    chatTitleName.textContent = `Room Inquiry: ${title}`;
    chatBoxWindow.style.display = "flex";
    renderMessages();
    if (chatInterval) clearInterval(chatInterval);
    chatInterval = setInterval(renderMessages, 1000);
}

// FIXED Left-vs-Right Chat Render Engine Logic Matrix
function renderMessages() {
    chatHistoryWindow.innerHTML = "";
    const currentRoomMessages = allMessages.filter(m => m.flatId === activeChatRoomId);

    if (currentRoomMessages.length === 0) {
        chatHistoryWindow.innerHTML = "<p style='font-size:12px; text-align:center; color:#94a3b8; margin:auto 0;'>Send a message to start conversation!</p>";
        return;
    }

    currentRoomMessages.forEach(msg => {
        const messageElement = document.createElement('div');
        
        // CRITICAL UPDATE: Checks if the message sender matches the current viewer's ID
        if (msg.senderId === activeUser.id) {
            messageElement.className = "msg sent";       // ALWAYS ON THE RIGHT SIDE
        } else {
            messageElement.className = "msg received";   // ALWAYS ON THE LEFT SIDE
        }
        
        messageElement.textContent = msg.text;
        chatHistoryWindow.appendChild(messageElement);
    });
    chatHistoryWindow.scrollTop = chatHistoryWindow.scrollHeight;
}

document.getElementById('chatForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const msgText = chatInputMessage.value.trim();
    if (!msgText || !activeChatRoomId) return;

    allMessages.push({
        flatId: activeChatRoomId,
        senderId: activeUser.id,
        text: msgText,
        timestamp: new Date()
    });
    localStorage.setItem('localMessages', JSON.stringify(allMessages));
    chatInputMessage.value = "";
    renderMessages();
});

chatBubbleIcon.addEventListener('click', () => {
    const isHidden = chatBoxWindow.style.display === "none" || chatBoxWindow.style.display === "";
    chatBoxWindow.style.display = isHidden ? "flex" : "none";
    if (!isHidden) renderMessages();
});

document.getElementById('closeChatBtn').addEventListener('click', () => {
    chatBoxWindow.style.display = "none";
    if (chatInterval) clearInterval(chatInterval);
});

searchFilter.addEventListener('input', applyFilters);
priceFilter.addEventListener('input', (e) => { priceValue.textContent = e.target.value; applyFilters(); });
document.getElementById('refreshFlatsBtn').addEventListener('click', loadFlats);