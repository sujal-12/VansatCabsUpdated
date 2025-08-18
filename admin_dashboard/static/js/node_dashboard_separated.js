let terminal = 0, surcharge = 0, baseTariff = 0, taxPercent = 0;
let extraCharges = 0, discount = 0;
let stepStarted = false;
let pendingTripMode = null;


/*
#####################################################################################################
                          Main Code
#####################################################################################################
*/

const liveTripBtn = document.getElementById("liveTripBtn");
const futureTripBtn = document.getElementById("futureTripBtn");



liveTripBtn.addEventListener("click", function () {
    if (stepStarted) {
        pendingTripMode = "live";
        showTripResetConfirmation();
    } else {
        selectedTripMode = "live";
        setActiveTripButton("live");
        clearStepOneSection();
        showTripTypes("live");
    }
});

futureTripBtn.addEventListener("click", function () {
    if (stepStarted) {
        pendingTripMode = "future";
        showTripResetConfirmation();
    } else {
        selectedTripMode = "future";
        setActiveTripButton("future");
        clearStepOneSection();
        showTripTypes("future");
    }
});

function showTripResetConfirmation() {
    const modal = new bootstrap.Modal(document.getElementById('tripResetModal'));
    modal.show();
}

function confirmTripReset() {
    const modalElement = document.getElementById('tripResetModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();

    // Reset step and go to selected mode
    stepStarted = false;
    clearStepOneSection();

    if (pendingTripMode === "live") {
        selectedTripMode = "live";
        setActiveTripButton("live");
        showTripTypes("live");
    } else if (pendingTripMode === "future") {
        selectedTripMode = "future";
        setActiveTripButton("future");
        showTripTypes("future");
    }

    pendingTripMode = null;
}

function clearStepOneSection() {
    const stepOneSection = document.getElementById("stepOneSection");
    const tripDetailsSection = document.getElementById("tripDetailsSection"); 3

    if (stepOneSection) {
        stepOneSection.style.display = "none";
        stepOneSection.innerHTML = ""; // Clear content
    }

    if (tripDetailsSection) {
        tripDetailsSection.innerHTML = ""; // Clear trip details
    }
}


function showTripTypes(type) {
    const tripTypeSection = document.getElementById("tripTypeSection");
    tripTypeSection.style.display = "flex";
    tripTypeSection.innerHTML = ""; // Clear previous buttons

    const title = document.createElement("h5");
    title.className = "w-100 text-dark mb-2 fw-bold";
    title.innerText = "Select Trip Type";
    tripTypeSection.appendChild(title);

    const tripOptions = type === "live"
        ? [
            { label: "Airport Transfer", icon: "mdi mdi-airplane-takeoff" },
            { label: "Outstation", icon: "mdi mdi-map-marker-distance" },
            { label: "Holiday Tour", icon: "mdi mdi-beach" },
            { label: "Hourly Rental", icon: "mdi mdi-clock-outline" },
        ]
        : [
            { label: "Airport Transfer", icon: "mdi mdi-airplane-takeoff" },
            { label: "Railway Transfer", icon: "mdi mdi-train" },
            { label: "Outstation", icon: "mdi mdi-map-marker-distance" },
            { label: "Holiday Tour", icon: "mdi mdi-beach" },
            { label: "Hourly Rental", icon: "mdi mdi-clock-outline" },
        ];

    tripOptions.forEach(option => {
        const btn = document.createElement("button");
        btn.className = "btn btn-outline-dark square-button text-center m-1";
        btn.innerHTML = `<i class="${option.icon}"></i><span class="fw-bold">${option.label}</span>`;
        btn.onclick = () => handleTripTypeSelection(option.label, btn);
        tripTypeSection.appendChild(btn);
    });
}


function setActiveTripButton(type) {
    if (type === "live") {
        liveTripBtn.classList.add("active-trip-button");
        futureTripBtn.classList.remove("active-trip-button");
    } else {
        futureTripBtn.classList.add("active-trip-button");
        liveTripBtn.classList.remove("active-trip-button");
    }
}

function handleTripTypeSelection(tripType, button) {
    selectedTripType = tripType;
    stepStarted = true;

    // Highlight selected trip type button
    document.querySelectorAll(".square-button").forEach(btn => {
        btn.classList.remove("active-trip-type");
    });
    button.classList.add("active-trip-type");

    console.log("Trip Mode:", selectedTripMode);
    console.log("Trip Type:", selectedTripType);

    const tripTypeSection = document.getElementById("tripTypeSection");
    const stepOneSection = document.getElementById("stepOneSection");

    if (tripType === "Airport Transfer" && selectedTripMode === "live") {
        // Hide tripTypeSection
        tripTypeSection.style.display = "none";

        // Show new step section
        stepOneSection.style.display = "flex";
        stepOneSection.innerHTML = `
            <div class="w-100">
                <div class="row col-lg-12 align-items-end mb-3">
                    <div class="col-md-10 position-relative">
                        <label for="destination">
                            <h5 class="text-dark fw-bold mb-2">Select Destination <span class="text-danger">*</span></h5>
                        </label>
                        <input type="text" id="destination" class="form-control" placeholder="Enter Destination" autocomplete="off" required>
                        
                    </div>
                    <div class="col-md-2 d-flex justify-content-center">
                        <i class="mdi mdi-close-circle-outline text-danger" 
                        onclick="clearDestination()" 
                        style="font-size: 40px; top: 50%; right: 12px; cursor: pointer;" 
                        title="Clear Destination"></i>
                    </div>
                    <div class="col-md-12 position-relative" id="nextStepContainer">
                        <button class="btn btn-dark w-100 mt-2 d-flex justify-content-between align-items-center" id="nextStepBtn" onclick="renderAirportTransferForm()" disabled>
                            <span class="fw-bold">Select Location</span>
                            <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
                        </button>
                    </div>
                    <div id="suggestionsBox" class="mt-2"></div>
                </div>
                
            </div>
            
        `;
        // Render airport transfer form
        renderAirportTransferForm();
        setTimeout(() => {
            // initAutocomplete(selectedCity);       // Your original autocomplete
            attachSuggestionBox(selectedCity);    // Our custom suggestions box

            const destinationInput = document.getElementById("destination");
            const nextStepBtn = document.getElementById("nextStepBtn");

            destinationInput.addEventListener("input", () => {
                nextStepBtn.disabled = destinationInput.value.trim() === "";
            });
        }, 300);
    }
    else if (tripType === "Outstation" && selectedTripMode === "live") {
        tripTypeSection.style.display = "none";
        stepOneSection.style.display = "flex";
        stepOneSection.innerHTML = `
            <div class="w-100">
                <div class="row col-lg-12 align-items-end mb-3">
                    <div class="col-md-10 position-relative">
                        <label for="destination">
                            <h5 class="text-dark fw-bold mb-2">Select Destination <span class="text-danger">*</span></h5>
                        </label>
                        <input type="text" id="destination" class="form-control" placeholder="Enter any destination across India" autocomplete="off" required>
                    </div>
                    <div class="col-md-2 d-flex justify-content-center">
                        <i class="mdi mdi-close-circle-outline text-danger" 
                        onclick="clearDestination()" 
                        style="font-size: 40px; top: 50%; right: 12px; cursor: pointer;" 
                        title="Clear Destination"></i>
                    </div>
                    <div class="col-md-12 position-relative" id="nextStepContainer">
                        <button class="btn btn-dark w-100 mt-2 d-flex justify-content-between align-items-center" id="nextStepBtn" onclick="calculateOutstationDistance()" disabled>
                            <span class="fw-bold">Select Location</span>
                            <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
                        </button>
                    </div>
                    <div id="suggestionsBox" class="mt-2"></div>
                </div>
            </div>
            
        `;

        setTimeout(() => {
            attachOutstationSuggestionBox(); // Enables unrestricted Google Places autocomplete
            const destinationInput = document.getElementById("destination");
            const nextStepBtn = document.getElementById("nextStepBtn");

            destinationInput.addEventListener("input", () => {
                nextStepBtn.disabled = destinationInput.value.trim() === "";
            });
        }, 300);
    }
}

function clearDestination() {
    const input = document.getElementById("destination");
    const nextStepBtn = document.getElementById("nextStepBtn");
    const mapDistanceRow = document.getElementById("mapDistanceRow");
    const nextStepContainer = document.getElementById("nextStepContainer");
    const tripDetailsCard = document.getElementById("tripDetailsCard");
    const extraFareRows = document.querySelectorAll(".fare-row-after-destination"); // Add this class to any dynamic row after destination
    const tariffDetailsRow = document.getElementById("tariffDetailsRow");
    const kmSlabSection = document.getElementById("kmSlabSection");
    const additionalChargesRow = document.getElementById("additionalChargesRow");
    const actionButtonsRow = document.getElementById("actionButtonsRow");

    // Clear destination input
    if (input) input.value = "";

    // Disable next button
    if (nextStepBtn) nextStepBtn.disabled = true;

    // Remove distance row
    if (mapDistanceRow) mapDistanceRow.remove();

    // Remove tariff details row if exists
    if (tariffDetailsRow) tariffDetailsRow.remove();

    // Remove KM slab section if exists
    if (kmSlabSection) kmSlabSection.remove();

    // Remove additional charges row if exists
    if (additionalChargesRow) additionalChargesRow.remove();

    // Remove action buttons row if exists
    if (actionButtonsRow) actionButtonsRow.remove();

    // Remove any extra rows added after destination
    extraFareRows.forEach(row => row.remove());

    // Clear the Trip Details card section
    if (tripDetailsCard) tripDetailsCard.innerHTML = "";

    // Reset the next button container
    if (nextStepContainer) {
        nextStepContainer.innerHTML = `
            <button class="btn btn-dark w-100 mt-2 d-flex justify-content-between align-items-center"
                id="nextStepBtn" onclick="renderAirportTransferForm()" disabled>
                <span class="fw-bold">Select Location</span>
                <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
            </button>
        `;
    }
}


function formatDateDDMMYYYY(date) {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function formatTime12hr(date) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12
    return `${hours}:${minutes} ${ampm}`;
}

function renderAirportTransferForm() {
    const tripDetails = document.getElementById("tripDetailsSection");
    const destination = document.getElementById("destination")?.value;
    const now = new Date();
    const currentDate = formatDateDDMMYYYY(now);
    const currentTime = formatTime12hr(now);

    if (!destination) {
        tripDetails.innerHTML = `<p class="text-danger">Destination is empty. Please Select Destination within the City Limits.</p>`;
        return;
    }

    const fromAddress = window.nodeAddress || "Not Available";
    const fromLat = parseFloat(window.nodeLatitude) || 0;
    const fromLng = parseFloat(window.nodeLongitude) || 0;
    const existingSlab = document.getElementById("kmSlabSection");

    let html = "";

    if (selectedTripMode === "live") {
        html += `
           <div class="container p-3" id="tripDetailsSection">
                <!-- Row 1: Date, Time, Trip Type -->
                <div class="row mb-3">
                    <div class="col-md-3">
                    <label class="form-label">Current Date</label>
                    <h5 class="text-primary fw-bold">${currentDate}</h5>
                    </div>
                    <div class="col-md-3">
                    <label class="form-label">Current Time</label>
                    <h5 class="text-primary fw-bold">${currentTime}</h5>
                    </div>
                    <div class="col-md-6">
                    <label class="form-label text-primary fw-bold">Trip Type</label>
                    <h5 class="text-primary fw-bold">${selectedTripType} (Live)</h5>
                    <p class="fw-bold text-muted mb-0">Trip ID: NSKAT${Date.now()}</p>
                    </div>
                </div>

                <!-- Row 2: From / To Address -->
                <div class="row mb-3" id="mapDistanceRow">
                    <div class="col-md-4">
                    <label class="form-label fw-bold">From (Node)</label>
                    <p id="fromAddress">${fromAddress}</p>
                    <small id="fromCoords" class="text-muted">Lat: ${fromLat}, Lng: ${fromLng}</small>
                    </div>
                    <div class="col-md-4">
                    <label class="form-label fw-bold">To (Destination)</label>
                    <p id="toAddress">${destination}</p>
                    <small id="toCoords" class="text-muted">Lat: ---, Lng: ---</small>
                    </div>
                    <div class="col-md-4">
                    <label class="form-label fw-bold">Estimated Distance</label>
                    <h5 id="estimatedDistance" class="text-success fw-bold">Calculating...</h5>
                    </div>
                </div>

                <!-- Row 3: Tariff Details -->
                <div class="row mt-2" id="tariffDetailsRow">
                    <div class="col-md-3">
                    <label class="form-label fw-bold">Terminal Charges</label>
                    <h4 class="text-success">₹ ${parseFloat(terminal).toFixed(2)}</h4>
                    </div>
                    <div class="col-md-3">
                    <label class="form-label fw-bold">Surcharges</label>
                    <h4 class="text-success">₹ ${parseFloat(surcharge).toFixed(2)}</h4>
                    </div>
                    <div class="col-md-3">
                    <label class="form-label fw-bold">Tax (%)</label>
                    <h4 class="text-success">${parseFloat(taxPercent).toFixed(2)}%</h4>
                    </div>
                    <div class="col-md-3">
                    <label class="form-label fw-bold">Vehicle Tariff</label>
                    <h4 class="text-primary fw-bold">₹ ${parseFloat(baseTariff).toFixed(2)}</h4>
                    </div>
                </div>

                <!-- Row 4: Extra & Discount -->
                <div class="row mt-3" id="additionalChargesRow">
                    <div class="col-md-4">
                    <label class="form-label fw-bold">Extra Charges (₹)</label>
                    <div class="input-group">
                        <span class="input-group-text fw-bold text-dark fs-4" style="cursor:pointer;" onclick="adjustCharge('extraChargesInput', -50)">−</span>
                        <input type="number" class="form-control text-center" id="extraChargesInput" value="0" min="0" />
                        <span class="input-group-text fw-bold text-dark fs-4" style="cursor:pointer;" onclick="adjustCharge('extraChargesInput', 50)">+</span>
                    </div>
                    </div>
                    <div class="col-md-4">
                    <label class="form-label fw-bold">Discount (₹)</label>
                    <div class="input-group">
                        <span class="input-group-text fw-bold text-dark fs-4" style="cursor:pointer;" onclick="adjustCharge('discountInput', -50)">−</span>
                        <input type="number" class="form-control text-center" id="discountInput" value="0" min="0" />
                        <span class="input-group-text fw-bold text-dark fs-4" style="cursor:pointer;" onclick="adjustCharge('discountInput', 50)">+</span>
                    </div>
                    </div>
                    <div class="col-md-4 d-flex align-items-end">
                    <div>
                        <label class="form-label fw-bold">Total Amount (₹)</label>
                        <h3 id="totalAmountDisplay" class="text-dark fw-bold">--</h3>
                    </div>
                    </div>
                </div>

                <!-- Row 5: Action Buttons -->
                <div class="row mt-4" id="actionButtonsRow">
                    <div class="col-md-3 col-sm-6 mb-3">
                    <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button">
                        <i class="mdi mdi-briefcase-outline action-icon"></i>
                        <span class="action-text">Book Business Trip</span>
                    </button>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                    <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button" onclick="payCashNow()">
                        <i class="mdi mdi-cash action-icon"></i>
                        <span class="action-text">Pay Cash</span>
                    </button>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                    <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button">
                        <i class="mdi mdi-truck-delivery-outline action-icon"></i>
                        <span class="action-text">Pay Cash on Delivery</span>
                    </button>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                    <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button" data-bs-toggle="modal" data-bs-target="#razorpayUserModal">
                        <i class="mdi mdi-credit-card-outline action-icon"></i>
                        <span class="action-text">Pay Online / Card</span>
                    </button>
                    </div>
                </div>
            </div>

        `;

        tripDetails.innerHTML = html;
        calculateDistanceBetweenPoints(destination);
        if (existingSlab) {
            existingSlab.remove(); // Remove existing KM slab section if present
        }
    }

    else if (selectedTripMode === "future") {
        html += `
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="futureDate" class="form-label">Select Date</label>
                    <input type="date" id="futureDate" class="form-control" min="${currentDate}">
                </div>
                <div class="col-md-6">
                    <label for="futureTime" class="form-label">Select Time</label>
                    <input type="time" id="futureTime" class="form-control">
                </div>
            </div>
        `;

        tripDetails.innerHTML = html;
    }
}


function initAutocomplete(cityName) {
    const input = document.getElementById('destination');
    console.log("Initializing autocomplete for city:", cityName);
    if (!input) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
        types: [],
        componentRestrictions: { country: "in" },
        strictBounds: true  // ✅ Restrict to inside bounds
    });

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: cityName }, function (results, status) {
        if (status === "OK" && results[0]) {
            const cityLocation = results[0].geometry.location;
            const circle = new google.maps.Circle({
                center: cityLocation,
                radius: 20000 // 20km radius
            });

            const bounds = circle.getBounds();
            if (bounds) {
                autocomplete.setBounds(bounds); // ✅ Bias and restrict to bounds
            }
        } else {
            console.warn("City geocode failed:", status);
        }
    });

    autocomplete.addListener('place_changed', function () {
        const place = autocomplete.getPlace();
        console.log("Selected place:", place);
    });
}

function attachSuggestionBox(cityName) {
    const input = document.getElementById("destination");
    const suggestionsBox = document.getElementById("suggestionsBox");

    const autocompleteService = new google.maps.places.AutocompleteService();
    const geocoder = new google.maps.Geocoder();
    const placesService = new google.maps.places.PlacesService(document.createElement("div"));

    let bounds = null;
    let cityCenter = null;

    geocoder.geocode({ address: cityName }, (results, status) => {
        if (status === "OK" && results[0]) {
            cityCenter = results[0].geometry.location;
            const circle = new google.maps.Circle({
                center: cityCenter,
                radius: 20000
            });
            bounds = circle.getBounds();
        }
    });

    input.addEventListener("input", () => {
        const query = input.value;
        if (!query || !bounds || query.length < 2) {
            suggestionsBox.innerHTML = "";
            return;
        }

        autocompleteService.getPlacePredictions({
            input: query,
            bounds: bounds,
            componentRestrictions: { country: "in" }
        }, (predictions, status) => {
            suggestionsBox.innerHTML = "";
            if (status !== "OK" || !predictions) return;

            predictions.forEach(prediction => {
                placesService.getDetails({ placeId: prediction.place_id }, (place, status) => {
                    if (status === "OK" && place.geometry && cityCenter) {
                        const dist = google.maps.geometry.spherical.computeDistanceBetween(
                            cityCenter,
                            place.geometry.location
                        );
                        if (dist <= 20000) {
                            suggestionsBox.insertAdjacentHTML("beforeend", `
                                <div class="mb-2">
                                    <div class="position-relative">
                                        <button class="btn btn-outline-dark w-100 text-start pe-5" onclick="selectDestination('${prediction.description.replace(/'/g, "\\'")}')">
                                            ${prediction.description}
                                        </button>
                                        <i class="mdi mdi-map-marker text-start position-absolute" style="bottom: 6px; right: 12px; font-size: 24px;"></i>
                                    </div>
                                </div>
                            `);
                        }
                    }
                });
            });
        });
    });
}

function selectDestination(value) {
    const input = document.getElementById("destination");
    const suggestionsBox = document.getElementById("suggestionsBox");
    const nextStepBtn = document.getElementById("nextStepBtn");

    input.value = value;
    suggestionsBox.innerHTML = "";

    // Enable Next Step button after selection
    if (nextStepBtn) nextStepBtn.disabled = false;
}

// Function to calculate distance between node and destination address
function calculateDistanceBetweenPoints(destinationAddress) {
    const fromLat = parseFloat(window.nodeLatitude);
    const fromLng = parseFloat(window.nodeLongitude);
    const fromLatLng = new google.maps.LatLng(fromLat, fromLng);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: destinationAddress }, function (results, status) {
        if (status === "OK" && results[0]) {
            const destinationLoc = results[0].geometry.location;

            document.getElementById("toCoords").textContent =
                `Lat: ${destinationLoc.lat().toFixed(5)}, Lng: ${destinationLoc.lng().toFixed(5)}`;

            const service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                origins: [fromLatLng],
                destinations: [destinationLoc],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC
            }, function (response, status) {
                if (status === "OK") {
                    const distanceText = response.rows[0].elements[0].distance.text;


                    document.getElementById("estimatedDistance").textContent = distanceText;
                    const distanceKm = parseFloat(distanceText.split(" ")[0]);

                    // ✅ Replace the Next Step button with vehicle selection
                    showVehicleSelection(distanceKm);



                } else {
                    document.getElementById("estimatedDistance").textContent = "Distance unavailable";
                }
            });
        } else {
            document.getElementById("estimatedDistance").textContent = "Invalid destination";
        }
    });
}


// function showVehicleSelection() {
//     const container = document.getElementById("nextStepContainer");

//     container.innerHTML = `
//     <div class="mt-2">
//         <label class="form-label fw-bold">Select Vehicle Type</label>
//         <div class="row gx-2 gy-2"> <!-- Tight gaps between columns -->

//             <div class="col-6 col-md-3">
//                 <button class="btn btn-outline-dark grid-square-button" onclick="selectVehicle('Hatchback')">
//                     <i class="mdi mdi-car-hatchback"></i><span class="text-strong">Hatchback</span>
//                 </button>
//             </div>

//             <div class="col-6 col-md-3">
//                 <button class="btn btn-outline-dark grid-square-button" onclick="selectVehicle('Sedan')">
//                     <i class="mdi mdi-car"></i><span class="text-strong">Sedan</span>
//                 </button>
//             </div>

//             <div class="col-6 col-md-3">
//                 <button class="btn btn-outline-dark grid-square-button" onclick="selectVehicle('Premium Sedan')">
//                     <i class="mdi mdi-car-limousine"></i><span class="text-strong">Premium Sedan</span>
//                 </button>
//             </div>

//             <div class="col-6 col-md-3">
//                 <button class="btn btn-outline-dark grid-square-button" onclick="selectVehicle('MUV')">
//                     <i class="mdi mdi-van-utility"></i><span class="text-strong">MUV</span>
//                 </button>
//             </div>

//             <div class="col-6 col-md-3">
//                 <button class="btn btn-outline-dark grid-square-button" onclick="selectVehicle('SUV')">
//                     <i class="mdi mdi-car-estate"></i><span class="text-strong">SUV</span>
//                 </button>
//             </div>

//             <div class="col-6 col-md-3">
//                 <button class="btn btn-outline-dark grid-square-button" onclick="selectVehicle('Premium SUV')">
//                     <i class="mdi mdi-car-traction-control"></i><span class="text-strong">Premium SUV</span>
//                 </button>
//             </div>

//             <div class="col-6 col-md-3">
//                 <button class="btn btn-outline-dark grid-square-button" onclick="selectVehicle('AC Traveller')">
//                     <i class="mdi mdi-bus"></i><span class="text-strong">AC Traveller</span>
//                 </button>
//             </div>

//             <div class="col-6 col-md-3">
//                 <button class="btn btn-outline-dark grid-square-button" onclick="selectVehicle('Bus')">
//                     <i class="mdi mdi-bus-side"></i><span class="text-strong">Bus</span>
//                 </button>
//             </div>

//         </div>
//     </div>
//     `;
// }

function showVehicleSelection(distanceKm) {
    const nodeId = window.nodeId || 1; // Make sure nodeId is globally available

    fetch(`/fetch-vehicle-types/${nodeId}/`)
        .then(response => response.json())
        .then(data => {
            const availableVehicles = data.vehicle_types || [];
            const container = document.getElementById("nextStepContainer");

            const vehicleIconMap = {
                'hatchback': 'mdi-car-hatchback',
                'seden': 'mdi-car',
                'premiumSeden': 'mdi-car-limousine',
                'muv': 'mdi-van-utility',
                'suv': 'mdi-car-estate',
                'premiumSUV': 'mdi-car-traction-control',
                'acTraveller': 'mdi-bus',
                'buses': 'mdi-bus-side'
            };

            let html = `
                <div class="mt-2">
                    <label class="form-label fw-bold">Select Vehicle Type</label>
                    <div class="row gx-2 gy-2">
            `;

            availableVehicles.forEach(vehicle => {
                const icon = vehicleIconMap[vehicle] || 'mdi-car';
                html += `
                    <div class="col-6 col-md-3">
                        <button class="btn btn-outline-dark grid-square-button" onclick="selectVehicle('${vehicle}')">
                            <i class="mdi ${icon} fs-3"></i>
                            <span class="text-strong">${vehicle}</span>
                        </button>
                    </div>
                `;
            });

            html += `</div></div>`;
            container.innerHTML = html;
            // 👇 Then show KM ranges based on distance
            fetchKmRangesAndShowButtons(distanceKm);
        })
        .catch(err => {
            console.error("Failed to load vehicle types:", err);
            document.getElementById("nextStepContainer").innerHTML = `<p class="text-danger">Unable to load vehicle types.</p>`;
        });
}

function selectVehicle(type) {
    // Deselect all other buttons
    document.querySelectorAll(".grid-square-button").forEach(btn => {
        btn.classList.remove("selected");
    });

    // Highlight the clicked button
    event.currentTarget.classList.add("selected");

    // Optionally store the selected vehicle type for later use
    selectedVehicleType = type;
    console.log("Vehicle selected:", type);

    tryShowTariffDetails();  // ✅ New function
}



function fetchKmRangesAndShowButtons(distanceInKm) {

    const container = document.getElementById("nextStepContainer");

    fetch(`/get-km-ranges/${window.nodeId}/`)
        .then(response => response.json())
        .then(data => {
            const kmRanges = data.km_ranges || [];

            const sortedByDistance = kmRanges
                .map(range => {
                    const [min, max] = range.split('-').map(Number);
                    console.log("Range:", range, "Min:", min, "Max:", max, "Distance in KM:", distanceInKm);
                    const midPoint = (min + max) / 2;
                    const contains = distanceInKm >= min && distanceInKm <= max;
                    const distanceFromMid = Math.abs(distanceInKm - midPoint);
                    return { range, distanceFromMid, contains };
                })
                .sort((a, b) => a.distanceFromMid - b.distanceFromMid)
                .slice(0, 4); // Get top 4 closest

            const btnHtml = sortedByDistance.map(item => `
                <div class="col-6 col-md-6">
                    <button class="btn btn-md btn-outline-dark w-100 km-range-button ${item.contains ? '' : ''}" 
                        onclick="selectKmRange('${item.range}', event)">
                        ${item.range} km
                    </button>
                </div>
            `).join("");

            const slabHtml = `
                <div id="kmSlabSection" class="col-md-12 mt-3">
                    <label class="form-label fw-bold">Select KM Slab</label>
                    <div class="row gx-2 gy-2">
                        ${btnHtml}
                    </div>
                </div>
            `;

            container.insertAdjacentHTML('beforeend', slabHtml);
        })
        .catch(err => {
            console.error("Error fetching km ranges:", err);
        });
}


let selectedKmRange = null;
let selectedVehicleType = null;

function selectKmRange(kmRange, event) {
    document.querySelectorAll(".km-range-button").forEach(btn => {
        btn.classList.remove("selected");
    });

    event.currentTarget.classList.add("selected");
    selectedKmRange = kmRange;

    console.log("Selected KM Slab:", kmRange);

    tryShowTariffDetails();  // ✅ New function
}

function tryShowTariffDetails() {
    if (!selectedKmRange || !selectedVehicleType) return;

    const vehicleKeyMap = {
        'Hatchback': 'hatchback',
        'Sedan': 'seden',
        'Premium Sedan': 'premiumSeden',
        'MUV': 'muv',
        'SUV': 'suv',
        'Premium SUV': 'premiumSUV',
        'AC Traveller': 'acTravellar',
        'Bus': 'buses'
    };

    const vehicleField = vehicleKeyMap[selectedVehicleType];
    const kmRangeEncoded = encodeURIComponent(selectedKmRange);

    console.log("Fetching tariff details for:", {})
    fetch(`/get-tariff-details/${window.nodeId}/${kmRangeEncoded}/${selectedVehicleType}/`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.warn(data.error);
                return;
            }

            // Remove existing rows if any
            const tripDetails = document.getElementById("tripDetailsSection");
            const oldTariff = document.getElementById("tariffDetailsRow");
            const oldAdditional = document.getElementById("additionalChargesRow");
            const oldButtons = document.getElementById("actionButtonsRow"); // ✅ Add this

            if (oldTariff) oldTariff.remove();
            if (oldAdditional) oldAdditional.remove();
            if (oldButtons) oldButtons.remove(); // ✅ This prevents duplication


            // Build and insert HTML
            const tariffHtml = `
                <div class="row mt-2" id="tariffDetailsRow">
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Terminal Charges</label>
                        <h4 class="text-success">₹ ${parseFloat(data.fixedTerminalCharges).toFixed(2)}</h4>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Surcharges</label>
                        <h4 class="text-success">₹ ${parseFloat(data.fixedSurCharges).toFixed(2)}</h4>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Tax (%)</label>
                        <h4 class="text-success">${data.fixedTax}%</h4>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label fw-bold">Vehicle Tariff</label>
                        <h4 class="text-primary fw-bold">₹ ${parseFloat(data.vehicleTariff).toFixed(2)}</h4>
                    </div>
                </div>

                <div class="row mt-3" id="additionalChargesRow">
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Extra Charges (₹)</label>
                        <div class="input-group">
                            <span class="input-group-text fw-bold text-dark fs-4" style="cursor:pointer;" onclick="adjustCharge('extraChargesInput', -50)">−</span>
                            <input type="number" class="form-control text-center" id="extraChargesInput" value="0" min="0" />
                            <span class="input-group-text fw-bold text-dark fs-4" style="cursor:pointer;" onclick="adjustCharge('extraChargesInput', 50)">+</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label fw-bold">Discount (₹)</label>
                        <div class="input-group">
                            <span class="input-group-text fw-bold text-dark fs-4" style="cursor:pointer;" onclick="adjustCharge('discountInput', -50)">−</span>
                            <input type="number" class="form-control text-center" id="discountInput" value="0" min="0" />
                            <span class="input-group-text fw-bold text-dark fs-4" style="cursor:pointer;" onclick="adjustCharge('discountInput', 50)">+</span>
                        </div>
                    </div>
                    <div class="col-md-4 d-flex align-items-end">
                        <div>
                            <label class="form-label fw-bold">Total Amount (₹)</label>
                            <h3 id="totalAmountDisplay" class="text-dark fw-bold">--</h3>
                        </div>
                    </div>
                </div>
               <div class="row mt-4" id="actionButtonsRow">
                    <div class="col-md-3 col-sm-6 mb-3">
                        <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button">
                            <i class="mdi mdi-briefcase-outline action-icon"></i>
                            <span class="action-text">Book Business Trip</span>
                        </button>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                        <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button" onclick="payCashNow()">
                            <i class="mdi mdi-cash action-icon"></i>
                            <span class="action-text">Pay Cash</span>
                        </button>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                        <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button">
                            <i class="mdi mdi-truck-delivery-outline action-icon"></i>
                            <span class="action-text">Pay Cash on Delivery</span>
                        </button>
                    </div>
                    <div class="col-md-3 col-sm-6 mb-3">
                        <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button"
                                    data-bs-toggle="modal" data-bs-target="#razorpayUserModal">
                            <i class="mdi mdi-credit-card-outline action-icon"></i>
                            <span class="action-text">Pay Online / Card</span>
                        </button>
                    </div>
                </div>

            `;

            tripDetails.insertAdjacentHTML("beforeend", tariffHtml);

            terminal = parseFloat(data.fixedTerminalCharges);
            surcharge = parseFloat(data.fixedSurCharges);
            taxPercent = parseFloat(data.fixedTax);
            baseTariff = parseFloat(data.vehicleTariff);

            document.getElementById("extraChargesInput").addEventListener("input", calculateTotal);
            document.getElementById("discountInput").addEventListener("input", calculateTotal);

            // Expose adjustCharge globally so it's accessible from onclick
            window.adjustCharge = function (inputId, delta) {
                const input = document.getElementById(inputId);
                let current = parseFloat(input.value) || 0;
                let updated = current + delta;

                if (updated < 0) updated = 0;

                input.value = updated;
                calculateTotal();
            };

            // Initial calculation
            calculateTotal();
        })
        .catch(err => console.error("Tariff fetch error:", err));
}

function calculateTotal() {
    const extraInput = document.getElementById("extraChargesInput");
    const discountInput = document.getElementById("discountInput");

    extraCharges = parseFloat(extraInput?.value) || 0;
    discount = parseFloat(discountInput?.value) || 0;

    const subtotal = terminal + surcharge + baseTariff + extraCharges - discount;
    const taxAmount = (subtotal * taxPercent) / 100;
    const grandTotal = subtotal + taxAmount;

    const roundedTotal = grandTotal.toFixed(2);
    const displayEl = document.getElementById("totalAmountDisplay");
    if (displayEl) displayEl.textContent = `₹ ${parseInt(roundedTotal).toFixed(2)}`;
}

function getCSRFToken() {
    return document.cookie.split('; ')
        .find(row => row.startsWith('csrftoken'))
        ?.split('=')[1];
}

function startRazorpayPayment() {
    const name = document.getElementById("rzp-name").value.trim();
    const email = document.getElementById("rzp-email").value.trim();
    const contact = document.getElementById("rzp-contact").value.trim();

    if (!name || !email || !contact) {
        alert("Please fill all details.");
        return;
    }

    const totalElement = document.getElementById("totalAmountDisplay");
    if (!totalElement) {
        alert("Total amount not found.");
        return;
    }

    const amountText = totalElement.textContent.replace(/[^\d.]/g, '');
    const totalAmount = parseFloat(amountText);

    if (isNaN(totalAmount) || totalAmount <= 0) {
        alert("Invalid total amount.");
        return;
    }

    const amountInPaise = Math.round(totalAmount * 100); // Convert to paise

    const options = {
        key: "rzp_test_dJ8sSpIyrwQzyf", // Replace with your actual Razorpay key
        amount: amountInPaise.toString(),
        currency: "INR",
        name: "VANSAT CABS PVT. LTD.",
        description: "Trip Payment",

        handler: function (response) {
            console.log("✅ Payment Successful!", response);

            const payload = {
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0],
                booking_id: "NSKAT" + Date.now(),

                passenger_name: name,
                contact_number: contact,
                email_id: email,

                from_city: document.getElementById("fromAddress")?.textContent || "-",
                to_city: document.getElementById("toAddress")?.textContent || "-",
                vehicle_type: selectedVehicleType || "-",
                driver_name: selectedDriver?.driverfirstname + " " + selectedDriver?.driverlastname || "-",
                vehicle_number: selectedDriver?.vehicle_number || "-",
                driver_contact: selectedDriver?.driver_contact || "-",

                payment_type: "Online",
                base_fare: baseTariff || 0,
                discount: discount || 0,
                terminal_charges: terminal || 0,
                surcharges: surcharge || 0,
                taxes: taxPercent?.toString() || "0",
                total_amount: totalAmount || 0.0,
                extra_charges: {},
                extra_total: extraCharges || 0
            };

            fetch("/save-trip/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": getCSRFToken()
                },
                body: JSON.stringify(payload)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert("Trip saved successfully! OTP: " + data.otp);

                        // ✅ Payload is available here
                        showTripSummaryModal(payload);

                        const modalEl = document.getElementById('tripSummaryModal');
                        const summaryModal = new bootstrap.Modal(modalEl);
                        summaryModal.show();
                    } else {
                        alert("Error saving trip: " + data.error);
                    }
                })
                .catch(err => {
                    console.error("Error during save:", err);
                });
        },

        prefill: {
            name: name,
            email: email,
            contact: contact
        },

        theme: {
            color: "#5B3CC4"
        }
    };

    // Close Razorpay modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('razorpayUserModal'));
    if (modal) modal.hide();

    const rzp = new Razorpay(options);
    rzp.open();
}


function toggleGSTFields() {
    const section = document.getElementById('gstDetailsSection');
    section.style.display = document.getElementById('gstToggle').checked ? 'block' : 'none';
}


let selectedDriverId = null;

function openDriverSelectionModal(vehicleType, nodeId) {
    const modal = new bootstrap.Modal(document.getElementById('driverSelectionModal'));

    if (!modalElement) {
        console.error("❌ Modal element #driverSelectionModal not found in DOM.");
        return;
    }
    const driverContainer = document.getElementById("driverListContainer");
    const assignBtn = document.getElementById("assignDriverBtn");

    // Reset
    driverContainer.innerHTML = "<p>Loading drivers...</p>";
    assignBtn.disabled = true;
    selectedDriverId = null;

    // Fetch drivers from your backend
    fetch(`/get-active-drivers/?node_id=${nodeId}&vehicle_type=${vehicleType}`)
        .then(res => res.json())
        .then(data => {
            if (data.drivers && data.drivers.length > 0) {
                driverContainer.innerHTML = data.drivers.map(driver => `
                    <div class="form-check mb-2">
                        <input class="form-check-input" type="radio" name="driverRadio" id="driver-${driver.id}" value="${driver.id}">
                        <label class="form-check-label" for="driver-${driver.id}">
                            ${driver.name} - ${driver.contact}
                        </label>
                    </div>
                `).join('');
            } else {
                driverContainer.innerHTML = `<p class="text-danger">No active drivers found for ${vehicleType}.</p>`;
            }

            // Bind change events
            document.querySelectorAll('input[name="driverRadio"]').forEach(radio => {
                radio.addEventListener('change', function () {
                    selectedDriverId = this.value;
                    assignBtn.disabled = false;
                });
            });
        })
        .catch(err => {
            console.error("Driver fetch error:", err);
            driverContainer.innerHTML = `<p class="text-danger">Failed to load drivers.</p>`;
        });

    modal.show();
}

function showTripSummaryModal(payload) {
    calculateTotal(); // to update extraCharges and discount

    document.getElementById('summaryTripId').textContent = payload.booking_id || "-";
    document.getElementById('summaryPickup').textContent = payload.from_city || "-";
    document.getElementById('summaryDrop').textContent = payload.to_city || "-";
    document.getElementById('summaryVehicle').textContent = payload.vehicle_type || "-";
    document.getElementById('summaryKM').textContent = selectedKmRange || "-";

    document.getElementById('summaryCustomerName').textContent = payload.passenger_name || "-";
    document.getElementById('summaryCustomerEmail').textContent = payload.email_id || "-";
    document.getElementById('summaryCustomerContact').textContent = payload.contact_number || "-";

    const total = parseFloat(payload.total_amount || 0).toFixed(2);
    document.getElementById('summaryAmount').textContent = total;
    // Charges (read from previous values)
    // const parse = (id) => parseFloat(document.getElementById(id)?.textContent?.replace(/[^\d.]/g, '') || 0).toFixed(2);
    // const parseInput = (id) => parseFloat(document.getElementById(id)?.value || 0).toFixed(2);

    // document.getElementById('summaryTerminalCharges').textContent = parse('tariffDetailsRow').includes('₹') ? parse('tariffDetailsRow') : "0.00";
    // document.getElementById('summarySurcharges').textContent = parseInput('tariffDetailsRow') || "0.00";
    // document.getElementById('summaryTariff').textContent = parseFloat(document.getElementById('tariffDetailsRow')?.textContent?.match(/Vehicle Tariff.*?₹ ([\d.]+)/)?.[1] || 0).toFixed(2);
    // document.getElementById('summaryExtra').textContent = parseInput('extraChargesInput');
    // document.getElementById('summaryDiscount').textContent = parseInput('discountInput');
    // document.getElementById('summaryTaxPercent').textContent = taxPercent?.toFixed(2) || "0";

    const totalAmountText = document.getElementById("totalAmountDisplay")?.textContent?.replace(/[^\d.]/g, '') || "0.00";
    document.getElementById('summaryAmount').textContent = parseFloat(totalAmountText).toFixed(2);

    // Show modal
    const modalElement = document.getElementById('tripSummaryModal');
    if (!modalElement) {
        console.error("Modal element not found.");
        return;
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}


// === EVENT BINDINGS ===
document.getElementById('tripSummaryModal').addEventListener('show.bs.modal', function () {
    if (selectedVehicleType) {
        fetchDrivers(selectedVehicleType);
    }
});

let selectedDriver = null;

function fetchDrivers(vehicleType, query = '') {

    const vehicleKeyMap = {
        'Hatchback': 'hatchback',
        'Sedan': 'seden',
        'Premium Sedan': 'premiumSeden',
        'MUV': 'muv',
        'SUV': 'suv',
        'Premium SUV': 'premiumSUV',
        'AC Traveller': 'acTravellar',
        'Bus': 'buses'
    };
    const url = `/fetch-active-drivers/?vehicle_type=${encodeURIComponent(vehicleType)}&query=${encodeURIComponent(query)}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            renderDriverSuggestions(data.detailed_data);
        })
        .catch(err => console.error("Driver fetch error:", err));
}

function renderDriverSuggestions(drivers) {
    const container = document.getElementById("driverSuggestions");
    container.innerHTML = "";

    let rowDiv = null;

    drivers.forEach((driver, index) => {
        // Create a new row for every 3 drivers
        if (index % 3 === 0) {
            rowDiv = document.createElement("div");
            rowDiv.className = "row mb-2";
            container.appendChild(rowDiv);
        }

        const colDiv = document.createElement("div");
        colDiv.className = "col-md-4";

        const driverHtml = `
            <div class="position-relative">
                <button class="btn btn-outline-dark w-100 text-start pe-5" onclick='selectDriver(${JSON.stringify(driver)})'>
                    <div>
                        <strong>${driver.driverfirstname} ${driver.driverlastname}</strong><br>
                        <small>${driver.vehicle_name} - ${driver.vehicle_number}</small>
                    </div>
                </button>
                <i class="mdi mdi-account-circle position-absolute text-dark" style="bottom: 10px; right: 12px; font-size: 22px;"></i>
            </div>
        `;

        colDiv.innerHTML = driverHtml;
        rowDiv.appendChild(colDiv);
    });
}

function searchDrivers() {
    const query = document.getElementById("driverSearchInput").value;
    const vehicleType = selectedVehicleType || "";
    fetchDrivers(vehicleType, query);
}


// ###############################################################################################
// Functions of Outstation Live Trip Booking
// ###############################################################################################

function initGoogleAutocompleteForOutstation() {
    const destinationInput = document.getElementById("destination");

    const autocomplete = new google.maps.places.Autocomplete(destinationInput, {
        componentRestrictions: { country: "in" } // All over India
    });

    autocomplete.addListener("place_changed", function () {
        const place = autocomplete.getPlace();
        if (place && place.formatted_address) {
            destinationInput.value = place.formatted_address;
        }
    });
}

function renderOutstationForm() {
    const tripDetails = document.getElementById("tripDetailsSection");
    const container = document.getElementById("nextStepContainer");
    const destination = document.getElementById("destination")?.value;
    if (!destination) {
        tripDetails.innerHTML = `<p class="text-danger">Destination is empty. Please Select Destination within the City Limits.</p>`;
        return;
    }
    else {
        container.innerHTML = `
            <div class="mt-3">
                <p class="text-success">Outstation destination selected. Now continue to next step...</p>
                <!-- Add your next-step UI here -->
            </div>
        `;
    }

}

function attachOutstationSuggestionBox() {
    const input = document.getElementById("destination");
    const suggestionsBox = document.getElementById("suggestionsBox");

    const autocompleteService = new google.maps.places.AutocompleteService();

    input.addEventListener("input", () => {
        const query = input.value.trim();
        if (!query || query.length < 2) {
            suggestionsBox.innerHTML = "";
            return;
        }

        autocompleteService.getPlacePredictions({
            input: query,
            componentRestrictions: { country: "in" } // Across India
        }, (predictions, status) => {
            suggestionsBox.innerHTML = "";
            if (status !== "OK" || !predictions) return;

            predictions.forEach(prediction => {
                suggestionsBox.insertAdjacentHTML("beforeend", `
                    <div class="mb-2">
                        <div class="position-relative">
                            <button class="btn btn-outline-dark w-100 text-start pe-5"
                                    onclick="selectOutstationDestination('${prediction.description.replace(/'/g, "\\'")}')">
                                ${prediction.description}
                            </button>
                            <i class="mdi mdi-map-marker text-start position-absolute"
                               style="bottom: 6px; right: 12px; font-size: 24px;"></i>
                        </div>
                    </div>
                `);
            });
        });
    });
}

function calculateOutstationDistanceBetweenPoints(origin, destination) {
    if (!origin || !destination) {
        console.error("Origin or Destination not provided for outstation distance calculation.");
        return;
    }

    const service = new google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
        {
            origins: [origin],
            destinations: [destination],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
            if (status !== "OK") {
                console.error("Distance Matrix API Error:", status);
                return;
            }

            const result = response.rows[0].elements[0];

            if (result.status === "OK") {
                const distanceInMeters = result.distance.value;
                const distanceInKm = distanceInMeters / 1000;

                console.log("Outstation Distance (km):", distanceInKm);

                // ⬇️ Custom function for outstation flow
                handleOutstationDistanceSuccess(distanceInKm);
            } else {
                console.warn("Distance not available for given route.");
            }
        }
    );
}

function handleOutstationDistanceSuccess(distanceInKm) {
    // You can save distance globally if needed
    window.outstationDistance = distanceInKm;
    console.log("Outstation Distance Confirmed:", distanceInKm);
    const container = document.getElementById("nextStepContainer");
    container.innerHTML = `
        <div class="mt-3">
            <h5 class="text-dark fw-bold">Distance: ${distanceInKm} km</h5>
            <p class="text-success">Outstation destination confirmed. Proceed to vehicle selection.</p>

            <button class="btn btn-dark w-100 mt-2" onclick="showVehicleSelection()">Select Vehicle</button>
        </div>
    `;
}

function selectOutstationDestination(destination) {
    const input = document.getElementById("destination");
    input.value = destination;
    document.getElementById("suggestionsBox").innerHTML = "";
    document.getElementById("nextStepBtn").disabled = false;

    // Now geocode both pickup and destination to calculate distance
    const geocoder = new google.maps.Geocoder();
    const pickup = document.getElementById("fromAddress")?.textContent;

    if (pickup && destination) {
        geocoder.geocode({ address: pickup }, (pickupResults, status1) => {
            if (status1 === "OK") {
                const pickupLoc = pickupResults[0].geometry.location;

                geocoder.geocode({ address: destination }, (destResults, status2) => {
                    if (status2 === "OK") {
                        const destLoc = destResults[0].geometry.location;

                        // 🚀 Call distance calculator
                        calculateOutstationDistanceBetweenPoints(pickupLoc, destLoc);
                    }
                });
            }
        });
    }
}

function selectDriver(driver) {
    selectedDriver = driver;

    const input = document.getElementById("driverSearchInput");
    if (input) {
        input.value = `${driver.driverfirstname} ${driver.driverlastname} - ${driver.vehicle_number}`;
    }

    document.getElementById("driverSuggestions").innerHTML = "";

    // ✅ Show the Save Trip button
    document.getElementById("saveTripBtn").style.display = "block";
}

function finalizeTripWithDriver() {
    if (!selectedDriver || !selectedDriver.driverfirstname) {
        alert("No driver selected.");
        return;
    }

    // Get the latest trip ID or booking_id — if saved via Razorpay handler
    const bookingId = document.getElementById('summaryTripId').textContent;

    // Prepare payload to update trip
    const payload = {
        booking_id: bookingId,
        driver_name: selectedDriver.driverfirstname + " " + selectedDriver.driverlastname,
        vehicle_number: selectedDriver.vehicle_number,
        driver_contact: selectedDriver.driver_contact
    };

    fetch("/update-driver/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken()
        },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("✅ Trip updated with selected driver!");

                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById("tripSummaryModal"));
                if (modal) modal.hide();

                // Show receipt and redirect
                showAndPrintTripReceipt(window.nodeId);
            } else {
                alert("❌ Failed to save trip: " + data.error);
            }
        })
        .catch(err => {
            console.error("Error updating trip:", err);
        });
}

function clearDriverSelection() {
    const input = document.getElementById("driverSearchInput");
    if (input) input.value = "";

    selectedDriver = null;

    // Hide the Save Trip button
    document.getElementById("saveTripBtn").style.display = "none";

    // Reload all drivers
    fetchDrivers(selectedVehicleType || "");
}

function buildTripReceiptContent() {
    const receiptDiv = document.getElementById("tripReceiptBody");

    // Build formatted HTML
    receiptDiv.innerHTML = `
    <div class="row">
      <div class="col-md-6">
        <h6 class="fw-bold text-primary">Trip Details</h6>
        <ul class="list-unstyled">
          <li><strong>Trip ID:</strong> ${document.getElementById("summaryTripId").textContent}</li>
          <li><strong>Pickup:</strong> ${document.getElementById("summaryPickup").textContent}</li>
          <li><strong>Drop:</strong> ${document.getElementById("summaryDrop").textContent}</li>
          <li><strong>Vehicle:</strong> ${document.getElementById("summaryVehicle").textContent}</li>
            <li><strong>Distance:</strong> ${document.getElementById("summaryKM").textContent}</li>
        </ul>
      </div>
      <div class="col-md-6">
        <h6 class="fw-bold text-secondary">Customer</h6>
        <ul class="list-unstyled">
          <li><strong>Name:</strong> ${document.getElementById("summaryCustomerName").textContent}</li>
          <li><strong>Email:</strong> ${document.getElementById("summaryCustomerEmail").textContent}</li>
          <li><strong>Contact:</strong> ${document.getElementById("summaryCustomerContact").textContent}</li>
        </ul>
      </div>
    </div>
    <hr/>
    <div class="row">
      <div class="col-md-6">
        <h6 class="fw-bold text-success">Charges</h6>
        <ul class="list-unstyled">
          <li><strong>Total Amount:</strong> ₹ ${document.getElementById("summaryAmount").textContent}</li>
          <li><strong>Payment Mode:</strong> Online</li>
        </ul>
      </div>
      <div class="col-md-6">
        <h6 class="fw-bold text-dark">Driver Info</h6>
        <ul class="list-unstyled">
          <li><strong>Name:</strong> ${selectedDriver?.driverfirstname} ${selectedDriver?.driverlastname}</li>
          <li><strong>Vehicle No:</strong> ${selectedDriver?.vehicle_number}</li>
          <li><strong>Contact:</strong> ${selectedDriver?.driver_contact}</li>
        </ul>
      </div>
    </div>
  `;
}

function printTripReceipt() {
    const receiptContent = document.getElementById("tripReceiptContent").innerHTML;

    const printWindow = window.open('', '', 'height=700,width=900');

    printWindow.document.write(`
    <html>
      <head>
        <title>Trip Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h5, h6 { margin-bottom: 10px; }
          ul { padding-left: 0; list-style: none; }
          li { margin-bottom: 6px; }
          hr { margin: 20px 0; }
        </style>
      </head>
      <body>
        ${receiptContent}
        <script>
          window.onload = function () {
            window.print();
            window.onafterprint = function () {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);

    printWindow.document.close();
}
function reloadDashboard() {
    window.location.href = "/admin-dashboard/"; // Update this URL as needed
}

function showAndPrintTripReceipt(nodeId) {
    // Build the receipt structure using existing modal data
    const tripId = document.getElementById("summaryTripId").textContent;
    const pickup = document.getElementById("summaryPickup").textContent;
    const drop = document.getElementById("summaryDrop").textContent;
    const vehicle = document.getElementById("summaryVehicle").textContent;
    const km = document.getElementById("summaryKM").textContent;
    const name = document.getElementById("summaryCustomerName").textContent;
    const email = document.getElementById("summaryCustomerEmail").textContent;
    const contact = document.getElementById("summaryCustomerContact").textContent;
    const total = document.getElementById("summaryAmount").textContent;

    const driverName = selectedDriver?.driverfirstname + " " + selectedDriver?.driverlastname || "-";
    const driverContact = selectedDriver?.driver_contact || "-";
    const vehicleNumber = selectedDriver?.vehicle_number || "-";

    const receiptSection = document.getElementById("receiptSection");
    receiptSection.innerHTML = `
    <div class="card-title">Trip Receipt</div>
    <hr>
    <div class="row">
      <div class="col-6">
        <p class="receipt"><strong>Trip ID:</strong> ${tripId}</p>
        <p class="receipt"><strong>Pickup:</strong> ${pickup}</p>
        <p class="receipt"><strong>Drop:</strong> ${drop}</p>
        <p class="receipt"><strong>Vehicle:</strong> ${vehicle}</p>
        <p class="receipt"><strong>KM Range:</strong> ${km}</p>
      </div>
      <div class="col-6 text-end">
        <p class="receipt"><strong>Total:</strong> ₹ ${total}</p>
        <p class="receipt"><strong>Payment:</strong> Online</p>
      </div>
    </div>
    <div class="section-header">Customer</div>
    <div class="row">
      <div class="col-12">
        <p class="receipt"><strong>Name:</strong> ${name}</p>
        <p class="receipt"><strong>Email:</strong> ${email}</p>
        <p class="receipt"><strong>Contact:</strong> ${contact}</p>
      </div>
    </div>
    <div class="section-header">Driver</div>
    <div class="row">
      <div class="col-12">
        <p class="receipt"><strong>Name:</strong> ${driverName}</p>
        <p class="receipt"><strong>Vehicle No:</strong> ${vehicleNumber}</p>
        <p class="receipt"><strong>Contact:</strong> ${driverContact}</p>
      </div>
    </div>
    <div class="text-center text-success mt-3">
      <h4>Thank you for booking with Vansat Cabs!</h4>
    </div>
  `;

    // Open styled print window
    const printWindow = window.open('', '', 'height=800,width=600');
    printWindow.document.write(`
    <html>
    <head>
        <title>Print Receipt</title>
        <style>
            * { box-sizing: border-box; }
            body {
                font-family: "Segoe UI", sans-serif;
                background: #f7f9fc;
                padding: 40px;
                margin: 0;
            }
            .card {
                max-width: 420px;
                margin: auto;
                background: #fff;
                border-radius: 12px;
                padding: 25px;
                box-shadow: 0 0 15px rgba(0, 0, 0, 0.08);
            }
            .card-title {
                text-align: center;
                font-weight: bold;
                font-size: 18px;
                margin-bottom: 10px;
            }
            hr {
                border: none;
                border-top: 1px solid #ddd;
                margin: 10px 0;
            }
            .row {
                display: flex;
                flex-wrap: wrap;
                margin-bottom: 6px;
            }
            .col-6 {
                flex: 0 0 50%;
                max-width: 50%;
            }
            .col-12 {
                flex: 0 0 100%;
                max-width: 100%;
            }
            p.receipt {
                margin: 4px 0;
                font-size: 14px;
            }
            .text-end {
                text-align: right;
            }
            .text-center {
                text-align: center;
            }
            .text-dark {
                color: #000;
            }
            .text-success {
                color: #28a745;
            }
            h4 {
                margin: 8px 0 0;
            }
            .section-header {
                font-weight: bold;
                text-align: center;
                margin: 10px 0;
                font-size: 15px;
                border-bottom: 1px solid #ccc;
                padding-bottom: 4px;
            }
        </style>
    </head>
    <body>
        <div class="card">
            ${receiptSection.innerHTML}
        </div>
    </body>
    </html>
  `);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
        printWindow.print();
        printWindow.close();
        window.location.href = `/node_dashboard/${nodeId}`;
    }, 600);
}

function payCashNow() {
    const name = document.getElementById("rzp-name").value.trim();
    const email = document.getElementById("rzp-email").value.trim();
    const contact = document.getElementById("rzp-contact").value.trim();

    if (!name || !email || !contact) {
        alert("Please fill all details.");
        return;
    }

    const totalElement = document.getElementById("totalAmountDisplay");
    if (!totalElement) {
        alert("Total amount not found.");
        return;
    }

    const amountText = totalElement.textContent.replace(/[^\d.]/g, '');
    const totalAmount = parseFloat(amountText);
    if (isNaN(totalAmount) || totalAmount <= 0) {
        alert("Invalid total amount.");
        return;
    }

    const payload = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0],
        booking_id: "NSKAT" + Date.now(),

        passenger_name: name,
        contact_number: contact,
        email_id: email,

        from_city: document.getElementById("fromAddress")?.textContent || "-",
        to_city: document.getElementById("toAddress")?.textContent || "-",
        vehicle_type: selectedVehicleType || "-",
        driver_name: selectedDriver?.driverfirstname + " " + selectedDriver?.driverlastname || "Pending",
        vehicle_number: selectedDriver?.vehicle_number || "Pending",
        driver_contact: selectedDriver?.driver_contact || "Pending",

        payment_type: "Cash",
        base_fare: baseTariff || 0,
        discount: discount || 0,
        terminal_charges: terminal || 0,
        surcharges: surcharge || 0,
        taxes: taxPercent || "0%",
        total_amount: totalAmount || 0,
        extra_charges: {},
        extra_total: extraCharges || 0,
        status: "Cash Paid"
    };

    // Close Razorpay modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('razorpayUserModal'));
    modal.hide();

    fetch("/save-trip/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken()
        },
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("💵 Trip saved successfully with Cash Payment! OTP: " + data.otp);

                // Show summary modal with trip data
                document.getElementById("summaryPickup").textContent = payload.from_city;
                document.getElementById("summaryDrop").textContent = payload.to_city;
                document.getElementById("summaryVehicle").textContent = payload.vehicle_type;
                document.getElementById("summaryKM").textContent = `${payload.extra_total || 0} km`;
                document.getElementById("summaryTripId").textContent = payload.booking_id;

                document.getElementById("summaryCustomerName").textContent = payload.passenger_name;
                document.getElementById("summaryCustomerEmail").textContent = payload.email_id;
                document.getElementById("summaryCustomerContact").textContent = payload.contact_number;

                document.getElementById("summaryAmount").textContent = payload.total_amount;

                const summaryModal = new bootstrap.Modal(document.getElementById("tripSummaryModal"));
                summaryModal.show();
            } else {
                alert("Failed to save trip: " + data.error);
            }
        })
        .catch(err => {
            console.error("Error during save:", err);
            alert("Network or server error.");
        });
}


function fetchOutstationKmRanges() {
    fetch('/api/outstation/km-ranges/')
        .then(res => res.json())
        .then(data => {
            const rangeContainer = document.getElementById("kmRangeContainer");
            rangeContainer.innerHTML = ""; // Clear old

            data.km_ranges.forEach(range => {
                const btn = document.createElement("button");
                btn.className = "btn btn-outline-secondary m-1";
                btn.innerText = range;
                btn.onclick = () => handleKmRangeSelection(range);
                rangeContainer.appendChild(btn);
            });
        })
        .catch(err => {
            console.error("Failed to fetch KM ranges:", err);
        });
}

function calculateOutstationDistance() {
    const destination = document.getElementById("destination")?.value;
    if (!destination || !window.nodeLatitude || !window.nodeLongitude) {
        alert("Missing destination or pickup coordinates.");
        return;
    }

    const fromLatLng = new google.maps.LatLng(parseFloat(window.nodeLatitude), parseFloat(window.nodeLongitude));
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: destination }, (results, status) => {
        if (status === "OK" && results[0]) {
            const toLatLng = results[0].geometry.location;

            const service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                origins: [fromLatLng],
                destinations: [toLatLng],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC
            }, (response, status) => {
                if (status === "OK") {
                    const distanceText = response.rows[0].elements[0].distance.text;
                    const distanceKm = parseFloat(distanceText.split(" ")[0]);

                    // ✅ Call the original handler with proper value
                    handleOutstationDistanceSuccess(distanceKm);
                } else {
                    alert("Unable to calculate distance.");
                }
            });
        } else {
            alert("Failed to geocode destination.");
        }
    });
}
