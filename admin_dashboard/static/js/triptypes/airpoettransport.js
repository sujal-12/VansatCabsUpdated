
let driverDetailsList = []; // Global variable to store driver details
    //function to fetch charges based on vehicle type and km range
        function fetchChargesIfReady() {

             const vehicleTypeInput = document.getElementById("vehicleTypeInput");
        const kmRangeInput = document.getElementById("kmRangeInput");
        const nodeIdInput = document.getElementById("nodeIdInput"); // Assuming this is a hidden input field
        const chargesInput = document.getElementById("chargesInput");
            const vehicleType = vehicleTypeInput.value.trim();
            const kmRange = kmRangeInput.value.trim();
            const nodeId = nodeIdInput.value.trim();

            if (vehicleType && kmRange && nodeId) {
                fetch(`/fetch_airport_charges/${nodeId}/?vehicle_type=${encodeURIComponent(vehicleType)}&km_range=${encodeURIComponent(kmRange)}`)
                    .then(response => response.json())
                    .then(data => {
                        console.log("Fetched data:", data);
                        if (data.charges !== undefined) {
                            chargesInput.value = data.charges;
                            updateReceipt(gatherReceiptData());

                        } else if (data.error) {
                            chargesInput.value = data.error;
                            updateReceipt(gatherReceiptData());

                        } else {
                            chargesInput.value = "Charges information not available.";
                            updateReceipt(gatherReceiptData());

                        }
                    })
                    .catch(() => {
                        chargesInput.value = "Error fetching charges.";
                        updateReceipt(gatherReceiptData());

                    });
            } else {
                chargesInput.value = "";
                updateReceipt(gatherReceiptData());

            }
        }

     //event listner for all fields
    document.addEventListener("DOMContentLoaded", function () {
        const liveBtn = document.getElementById("liveTripBtn");
        const futureBtn = document.getElementById("futureTripBtn");
        const dateInput = document.getElementById("datePicker");
        const timeInput = document.getElementById("timePicker");
        const dateTimeSection = document.getElementById("dateTimeSection");
        const tripSection = document.getElementById("tripTypeSection");
        const detailsSection = document.getElementById("tripDetailsSection");
        const containerId = document.getElementById("locationSuggestions");
        const kmRangeInput = document.getElementById("kmRangeInput");
        const autocompleteService = new google.maps.places.AutocompleteSuggestion();
        const vehicleTypeInput = document.getElementById("vehicleTypeInput");
        const nodeIdInput = document.getElementById("nodeIdInput"); // Assuming this is a hidden input field
        const chargesInput = document.getElementById("chargesInput");


        let currentTripType = "";


        // Set date and time defaults
        function setDateTimeDefaults(type) {
            const now = new Date();
           

        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const yyyy = now.getFullYear();

        const formattedDate = `${yyyy}-${mm}-${dd}`; // for input type="date"
        const formattedTime = now.toTimeString().slice(0, 5); // still HH:MM

        dateInput.value = formattedDate;
        timeInput.value = formattedTime;
            dateTimeSection.style.display = "flex";
            dateInput.readOnly = timeInput.readOnly = (type === "live");
        }

        // Highlight selected trip type button
        function setActiveButton(type) {
            [liveBtn, futureBtn].forEach(btn => {
                btn.classList.remove("active", "btn-primary");
                btn.classList.add("btn-outline-primary");
            });

            const activeBtn = (type === "live") ? liveBtn : futureBtn;
            activeBtn.classList.add("active", "btn-primary");
            activeBtn.classList.remove("btn-outline-primary");
        }

        // Load trip options and attach click handlers
        function loadTripTypeOptions(type) {
            tripSection.innerHTML = "";
            detailsSection.innerHTML = "";

            const buttons = type === "live"
                ? ["Airport Transfer", "Outstation", "Holiday Tour", "Hourly Rental"]
                : ["Airport Transfer", "Railway Transfer", "Outstation", "Holiday Tour", "Hourly Rental"];

            const tripHandlers = {
                "Airport Transfer": showAirportTransferRow,
                "Outstation": showOutstationRow,
                "Holiday Tour": showHolidayTourRow,
                "Hourly Rental": showHourlyRentalRow,
                "Railway Transfer": showRailwayTransferRow,
            };

            buttons.forEach(name => {
                const btn = document.createElement("button");
                btn.className = "col-lg-2 col-md-2 col-sm-6 btn btn-outline-dark m-1";
                btn.textContent = name;

                btn.addEventListener("click", () => {
                     selectedTripType = name.toLowerCase().replace(" ", "");
                    // Unselect all buttons
                    const allButtons = tripSection.querySelectorAll("button");
                    allButtons.forEach(button => {
                        button.classList.remove("btn-dark");
                        button.classList.add("btn-outline-dark");
                    });

                    // Highlight selected button
                    btn.classList.remove("btn-outline-dark");
                    btn.classList.add("btn-dark");

                    // Call appropriate function
                    if (tripHandlers[name]) {
                        tripHandlers[name]();
                    } else {
                        detailsSection.innerHTML = "";
                    }

                    detailsSection.style.display = "block";
                });

                tripSection.appendChild(btn);
            });

            tripSection.style.display = "flex";
        }

        // Handle trip selection (live or future)
        function handleTripSelection(type) {
            currentTripType = type;
            setActiveButton(type);
            setDateTimeDefaults(type);
            loadTripTypeOptions(type);
        }

        
        // Common trip details HTML
        function getCommonTripDetailsHtml() {
            return `
                <div class="row mt-2">
                    <div class="col-md-3">
                        <input type="text" id="vehicleTypeInput" class="form-control" placeholder="Vehicle Type">
                        <input type="hidden" id="nodeIdInput" value="{{ node.nodeID }}">
                    </div>
                    <div class="col-md-4">
                        <input type="text" id="selectVehicleInput" class="form-control" placeholder="Select Vehicle">
                        <input type="text" id="vehicleNumberInput" placeholder="Vehicle Number" hidden>
                        <input type="text" id="driverContactInput" placeholder="Driver Contact" hidden>
                        <input type="text" id="vehicleNameInput" placeholder="Vehicle Name" hidden>
                        <input type="text" id="driverLastNameInput" placeholder="Driver Last Name"  hidden>
                        <input type="text" id="driverfirstname"placeholder="driver first name" hidden> <!-- Optional -->

                    </div>
                    <div class="col-md-3">
                        <input type="text" id="chargesInput" class="form-control" placeholder="Charges" >
                        
                    </div>
                    <div class="col-md-2">
                        <input type="text" id="extraChargesInput" class="form-control" placeholder="Extra Charges">
                    </div>
                </div>
                <div class="mt-2" id="vehicleTypeSuggestions"></div>
                <div id="selectVehicleSuggestions" class="suggestions-container"></div>
                <div class="mt-2" id="chargesDisplay"></div>

                <div class="row mt-3">
                    <div class="col-md-3">
                        <input type="text" id="customerContact" class="form-control" placeholder="Customer Contact">
                    </div>
                    <div class="col-md-4">
                        <input type="text" id="customerName" class="form-control" placeholder="Customer Name">
                    </div>
                    <div class="col-md-3">
                        <input type="text" id="discountInput" class="form-control" placeholder="Discount (in ₹)">
                    </div>
                    <div class="col-md-2 position-relative">
                       <input type="text" id="paymentMethodInput" class="form-control" list="paymentMethods" placeholder="Payment Method" autocomplete="off">

                            <datalist id="paymentMethods">
                            <option value="Cash">
                            <option value="Credit Card">
                            <option value="Debit Card">
                            <option value="UPI">
                            <option value="Net Banking">
                            </datalist>
                        
                    </div>

                </div>
                <div id="paymentSuggestions" class="row mt-2"></div>

                <div class="row mt-3">
                    <div class="col-md-12">
                        <input type="email" id="customerEmail" class="form-control" placeholder="Customer Email">
                    </div>
                </div>
            `;
        }

        // Airport Trip handler functions
        function showAirportTransferRow() {
            const fromValue = currentTripType === "live" ? "{{ node.nodeName }}" : "";
            const headerRow = `
                <div class="row mt-3 align-items-center">
                    <div class="col-md-3">
                        <input type="text" id="fromInput" class="form-control" value="${fromValue}" placeholder="From" readonly>
                    </div>
                    <div class="col-md-1 text-center d-flex justify-content-center align-items-center">
                        <button class="btn btn-outline-secondary" id="swapBtn">&#x21c4;</button>
                    </div>
                    <div class="col-md-3">
                        <input type="text" id="toInput" class="form-control" placeholder="To" value="">
                    </div>
                    <div class="col-md-2">
                        <input type="text" id="distanceInput" class="form-control" placeholder="Distance" readonly>
                    </div>
                    <div class="col-md-3">
                        <input type="text" id="kmRangeInput" class="form-control" placeholder="Click to load KM Ranges" list="kmRangeList">
                        <datalist id="kmRangeList"></datalist>
                    </div>
                </div>
                <div id="locationSuggestions" class="mt-2"></div>
                <div id="particularsSuggestions" class="mt-2"></div>
                <div id="kmRangeSuggestions" class="mt-2"></div>
            `;

            detailsSection.innerHTML = headerRow + getCommonTripDetailsHtml();
            initializeTripForm(currentTripType, {
                nodeName: "{{ node.nodeName }}",
                city: "{{ node.nodeCity|escapejs }}"
            });

            
            // Attach event listener for KM Range input
            $(document).ready(function () {
                $('#kmRangeInput').click(function () {
                    var nodeId = {{ node.nodeID }}; // Dynamically set this based on your logic
                    var distance = parseFloat($('#distanceInput').val());

                    if (isNaN(distance)) {
                        alert('Please enter a valid distance first.');
                        return;
                    }

                    // Make AJAX request to fetch KM Ranges
                    $.ajax({
                        url: '/fetch_kmrange/' + nodeId + '/',  // URL to fetch KM Ranges
                        method: 'GET',
                        success: function (response) {
                            if (response.tariffs.length > 0) {
                                // Extract and parse KM Ranges
                                var kmRanges = response.tariffs.map(function (tariff) {
                                    return tariff.kmRange;
                                });

                                // Process the KM Ranges
                                var processedRanges = kmRanges.map(function (rangeStr) {
                                    var parts = rangeStr.split('-');
                                    return {
                                        rangeStr: rangeStr,
                                        start: parseFloat(parts[0]),
                                        end: parseFloat(parts[1])
                                    };
                                });

                                // Sort the ranges based on proximity to the entered distance
                                processedRanges.sort(function (a, b) {
                                    var aDistance = Math.abs((a.start + a.end) / 2 - distance);
                                    var bDistance = Math.abs((b.start + b.end) / 2 - distance);
                                    return aDistance - bDistance;
                                });

                                // Select the top 4 closest KM Ranges
                                var closestRanges = processedRanges.slice(0, 4).map(function (range) {
                                    return range.rangeStr;
                                });

                                // Render suggestions using the renderSuggestionRow function
                                renderSuggestionRow('kmRangeSuggestions', $('#kmRangeInput')[0], closestRanges);
                            } else {
                                // If no KM Ranges are available
                                renderSuggestionRow('kmRangeSuggestions', $('#kmRangeInput')[0], ['No tariffs available']);
                            }
                        },
                        error: function (xhr, status, error) {
                            console.log("Error: " + error);
                        }
                    });
                    console.log("Hello");
                    fetchChargesIfReady();
                });
            });

            // Attach event listener for vehicle type input
            $(document).ready(function () {
                $('#vehicleTypeInput').focus(function () {
                    var nodeId = {{ node.nodeID }}; // Replace with the appropriate context variable

                    $.ajax({
                        url: '/fetch_vehicle_types/' + nodeId + '/',
                        method: 'GET',
                        success: function (response) {
                            var suggestions = response.vehicle_types;
                            if (suggestions.length > 0) {
                                renderSuggestionRow('vehicleTypeSuggestions', $('#vehicleTypeInput')[0], suggestions);
                                
                            } else {
                                renderSuggestionRow('vehicleTypeSuggestions', $('#vehicleTypeInput')[0], ['No vehicle types available']);
                                
                            }
                        },
                        error: function (xhr, status, error) {
                            console.error("Error fetching vehicle types: " + error);
                        }
                    });
                    fetchChargesIfReady();
                });
            });
            
            // Attach event listener for vehicle selection
                         $(document).ready(function () {
                    const inputElement = document.getElementById('selectVehicleInput');
                    const suggestionsContainerId = 'selectVehicleSuggestions';

                    function fetchSuggestions(query = '') {
                        const selectedVehicleType = $('#vehicleTypeInput').val();

                        if (selectedVehicleType) {
                            $.ajax({
                                url: '/fetch_active_drivers/',
                                method: 'GET',
                                data: {
                                    vehicle_type: selectedVehicleType,
                                    query: query
                                },
                                success: function (response) {
                                    const suggestions = response.drivers;
                                    driverDetailsList = response.detailed_data; 
                                    renderSuggestionRow(suggestionsContainerId, inputElement, suggestions);
                                },
                                error: function (xhr, status, error) {
                                    console.error("Error fetching drivers: " + error);
                                }
                            });
                        } else {
                            document.getElementById(suggestionsContainerId).innerHTML = '';
                        }
                    }

                    $('#vehicleTypeInput').on('focus', function () {
                        $('#selectVehicleInput').val(''); // Clear the input field
                        $('#selectVehicleSuggestions').empty(); // Clear any existing suggestions
                    });

                    $('#selectVehicleInput').on('focus', function () {
                        fetchSuggestions();
                    });

                    $('#selectVehicleInput').on('input', function () {
                        const query = $(this).val();
                        fetchSuggestions(query);
                    });
                });

                            if (vehicleTypeInput) {
                        vehicleTypeInput.addEventListener("input", fetchChargesIfReady);
                    }
                    if (kmRangeInput) {
                        kmRangeInput.addEventListener("input", fetchChargesIfReady);
                    }
                                // Initial call on page load in case values are pre-filled
                                fetchChargesIfReady();   
                }
    

        // Outstation Trip handler function
        function showOutstationRow() {
            const fromValue = currentTripType === "live" ? "{{ node.nodeName }}" : "";
            const headerRow = `
                <div class="row mt-3 align-items-center">
                    <div class="col-md-3">
                        <input type="text" id="fromInput" class="form-control" value="${fromValue}" placeholder="From" readonly>
                    </div>
                    <div class="col-md-1 text-center d-flex justify-content-center align-items-center">
                        <button class="btn btn-outline-secondary" id="swapBtn">&#x21c4;</button>
                    </div>
                    <div class="col-md-3">
                        <input type="text" id="toInput" class="form-control" placeholder="To" value="">
                    </div>
                    <div class="col-md-2">
                        <input type="text" id="distanceInput" class="form-control" placeholder="Distance" readonly>
                    </div>
                    <div class="col-md-3">
                        <input type="text" id="kmRangeInput" class="form-control" placeholder="Click to load KM Ranges" list="kmRangeList">
                        <datalist id="kmRangeList"></datalist>
                    </div>
                </div>
                <div id="locationSuggestions" class="mt-2"></div>
                <div id="kmRangeSuggestions" class="mt-2"></div>
            `;

            detailsSection.innerHTML = headerRow + getCommonTripDetailsHtml();
            initializeTripForm(currentTripType, {
                nodeName: "{{ node.nodeName }}",
                city: "{{ node.nodeCity|escapejs }}"
            });

            $(document).ready(function () {
                $('#kmRangeInput').click(function () {
                    var nodeId = {{ node.nodeID }}; // Dynamically set this based on your logic
                    var distance = parseFloat($('#distanceInput').val());

                    if (isNaN(distance)) {
                        alert('Please enter a valid distance first.');
                        return;
                    }

                    // Make AJAX request to fetch KM Ranges
                    $.ajax({
                        url: '/fetch_outstation/' + nodeId + '/',  // URL to fetch KM Ranges
                        method: 'GET',
                        success: function (response) {
                            if (response.tariffs.length > 0) {
                                // Extract and parse KM Ranges
                                var kmRanges = response.tariffs.map(function (tariff) {
                                    return tariff.kmRange;
                                });

                                // Process the KM Ranges
                                var processedRanges = kmRanges.map(function (rangeStr) {
                                    var parts = rangeStr.split('-');
                                    return {
                                        rangeStr: rangeStr,
                                        start: parseFloat(parts[0]),
                                        end: parseFloat(parts[1])
                                    };
                                });

                                // Sort the ranges based on proximity to the entered distance
                                processedRanges.sort(function (a, b) {
                                    var aDistance = Math.abs((a.start + a.end) / 2 - distance);
                                    var bDistance = Math.abs((b.start + b.end) / 2 - distance);
                                    return aDistance - bDistance;
                                });

                                // Select the top 4 closest KM Ranges
                                var closestRanges = processedRanges.slice(0, 4).map(function (range) {
                                    return range.rangeStr;
                                });

                                // Render suggestions using the renderSuggestionRow function
                                renderSuggestionRow('kmRangeSuggestions', $('#kmRangeInput')[0], closestRanges);
                            } else {
                                // If no KM Ranges are available
                                renderSuggestionRow('kmRangeSuggestions', $('#kmRangeInput')[0], ['No tariffs available']);
                            }
                        },
                        error: function (xhr, status, error) {
                            console.log("Error: " + error);
                        }
                    });
                    fetchChargesIfReady();
                });
            });
            
        }

        // Holiday Tour Trip handler function
        function showHolidayTourRow() {
            const fromValue = currentTripType === "live" ? "{{ node.nodeName }}" : "";
            const headerRow = `
                <div class="row mt-3 align-items-center">
                    <div class="col-md-5">
                        <input type="text" id="fromInput" class="form-control" value="${fromValue}" placeholder="From Location" readonly>
                    </div>
                    <div class="col-md-2 text-center d-flex justify-content-center align-items-center">
                        <button class="btn btn-outline-secondary" id="swapBtn">&#x21c4;</button>
                    </div>
                    <div class="col-md-5">
                        <input type="text" id="toInput" class="form-control" placeholder="To Location">
                    </div>
                </div>
                <div id="locationSuggestions" class="mt-2"></div>
            `;

            detailsSection.innerHTML = headerRow + getCommonTripDetailsHtml();
            initializeTripForm(currentTripType, {
                nodeName: "{{ node.nodeName }}",
                city: "{{ node.nodeCity|escapejs }}"
            });
        }

        // Hourly Rental Trip handler function
        function showHourlyRentalRow() {
            const fromValue = currentTripType === "live" ? "{{ node.nodeName }}" : "";
            const headerRow = `
                <div class="row mt-3 align-items-center">
                    <div class="col-md-12">
                        <input type="text" id="kmRangeInput" class="form-control" placeholder="Click to load KM Ranges" list="kmRangeList">
                        <datalist id="kmRangeList"></datalist>
                    </div>
                </div>
                <div id="locationSuggestions" class="mt-2"></div>
            `;

            detailsSection.innerHTML = headerRow + getCommonTripDetailsHtml();
            initializeTripForm(currentTripType, {
                nodeName: "{{ node.nodeName }}",
                city: "{{ node.nodeCity|escapejs }}"
            });
        }

        // Railway Transfer Trip handler function
        function showRailwayTransferRow() {
            const fromValue = currentTripType === "live" ? "{{ node.nodeName }}" : "";
            const headerRow = `
                <div class="row mt-3 align-items-center">
                    <div class="col-md-5">
                        <input type="text" id="fromInput" class="form-control" value="${fromValue}" placeholder="From Location" readonly>
                    </div>
                    <div class="col-md-2 text-center d-flex justify-content-center align-items-center">
                        <button class="btn btn-outline-secondary" id="swapBtn">&#x21c4;</button>
                    </div>
                    <div class="col-md-5">
                        <input type="text" id="toInput" class="form-control" placeholder="To Location">
                    </div>
                </div>
                <div id="locationSuggestions" class="mt-2"></div>
            `;

            detailsSection.innerHTML = headerRow + getCommonTripDetailsHtml();
            initializeTripForm(currentTripType, {
                nodeName: "{{ node.nodeName }}",
                city: "{{ node.nodeCity|escapejs }}"
            });
        }

        // Attach click handlers to Live and Future buttons
        liveBtn.addEventListener("click", () => handleTripSelection("live"));
        futureBtn.addEventListener("click", () => handleTripSelection("future"));

        // // Set default selection to "Live Trip" on page load
        // handleTripSelection("live");
    });

 
    // Initialize Google Places Autocomplete
    function initializeTripForm(tripType, node) {
        const city = node.city;
        const fromInput = document.getElementById("fromInput");
        const toInput = document.getElementById("toInput");
        const swapBtn = document.getElementById("swapBtn");
        const autocompleteService = new google.maps.places.AutocompleteService();


        // Set fromInput based on trip type
        if (tripType === "live") {
            fromInput.value = node.nodeName;
            fromInput.readOnly = true;
        } else {
            fromInput.value = "";
            fromInput.readOnly = false;
        }

        
        

        // Attach Google Places Autocomplete to input fields
   function attachGooglePlaces(inputElement, containerId) {
    const city = "{{ node.nodeCity|default:''|escapejs }}"; // e.g., "Mumbai"
    const autocompleteService = new google.maps.places.AutocompleteService();
    let cityLatLng = null;

    // First geocode the city name to get its coordinates
    if (city) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: city }, (results, status) => {
            if (status === "OK" && results[0]) {
                cityLatLng = results[0].geometry.location;
            }
        });
    }

    inputElement.addEventListener("input", () => {
        const inputVal = inputElement.value.trim();
        const container = document.getElementById(containerId);
        container.innerHTML = "";

        if (!inputVal) return;

        const options = {
            input: inputVal,
            types: ["geocode"],
            componentRestrictions: { country: "in" }
        };

        if (cityLatLng) {
            options.location = cityLatLng;
            options.radius = 50000; // Bias to 50 km around city
        }

        autocompleteService.getPlacePredictions(options, (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                // Prioritize predictions with city first
                const cityMatches = [];
                const otherMatches = [];

                predictions.forEach(pred => {
                    if (pred.description.toLowerCase().includes(city.toLowerCase())) {
                        cityMatches.push(pred);
                    } else {
                        otherMatches.push(pred);
                    }
                });

                const filtered = [...cityMatches, ...otherMatches].slice(0, 5);

                const row = document.createElement("div");
                row.className = "d-flex flex-wrap gap-2";

                filtered.forEach(prediction => {
                    const btn = document.createElement("button");
                    btn.className = "btn btn-outline-primary flex-fill";
                    btn.textContent = prediction.description;
                    btn.addEventListener("click", () => {
                        inputElement.value = prediction.description;
                        container.innerHTML = "";
                        calculateDistance(); // Call your distance calculation
                    });
                    row.appendChild(btn);
                });

                container.appendChild(row);
            } else {
                const msg = document.createElement("div");
                msg.className = "text-muted";
                msg.textContent = "No suggestions found.";
                container.appendChild(msg);
            }
        });
    });
}



        
        // Distance calculation
        function calculateDistance() {
            const origin = fromInput.value.trim();
            const destination = toInput.value.trim();
            const distanceInput = document.getElementById("distanceInput");
            console.log("Calculating distance from:", origin, "to:", destination);

            if (!origin || !destination) {
                distanceInput.value = "";
                return;
            }

            const service = new google.maps.DistanceMatrixService();
            service.getDistanceMatrix({
                origins: [origin],
                destinations: [destination],
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.METRIC,
            }, (response, status) => {
                if (status === "OK") {
                    const result = response.rows[0].elements[0];
                    if (result.status === "OK") {
                        distanceInput.value = result.distance.text;
                    } else {
                        distanceInput.value = "Distance not available";
                    }
                } else {
                    distanceInput.value = "Error calculating distance";
                }
            });
        }

        function toggleReadonlyState() {
            const fromInput = document.getElementById("fromInput");
            const toInput = document.getElementById("toInput");
            const nodeAddress = "{{ node.nodeAddress }}";

            fromInput.readOnly = fromInput.value === nodeAddress;
            toInput.readOnly = toInput.value === nodeAddress;
            if (fromInput.value.trim() && toInput.value.trim()) {
                setTimeout(() => {
                    calculateDistance();  // <-- Trigger distance calculation AFTER value is set
                }, 100);
            }
        }

        // Listen for changes on `toInput`
        toInput.addEventListener("change", () => {
            if (fromInput.value.trim() && toInput.value.trim()) {
                calculateDistance();
            }
        });

        // Swap button logic
        swapBtn.addEventListener("click", () => {
            const tempValue = fromInput.value;
            fromInput.value = toInput.value;
            toInput.value = tempValue;

            const tempReadOnly = fromInput.readOnly;
            fromInput.readOnly = toInput.readOnly;
            toInput.readOnly = tempReadOnly;

            document.getElementById("locationSuggestions").innerHTML = "";

            attachGooglePlaces(fromInput, "locationSuggestions");
            attachGooglePlaces(toInput, "locationSuggestions");

            calculateDistance();
        });

        attachGooglePlaces(fromInput, "locationSuggestions");
        attachGooglePlaces(toInput, "locationSuggestions");

    }
       function toggleReadonlyState() {
            const fromInput = document.getElementById("fromInput");
            const toInput = document.getElementById("toInput");
            const nodeAddress = "{{ node.nodeAddress }}";

            fromInput.readOnly = fromInput.value === nodeAddress;
            toInput.readOnly = toInput.value === nodeAddress;
            if (fromInput.value.trim() && toInput.value.trim()) {
                setTimeout(() => {
                    calculateDistance();  // <-- Trigger distance calculation AFTER value is set
                }, 100);
            }
        }
   function renderSuggestionRow(containerId, inputElement, suggestions) {
    const container = document.getElementById(containerId);
    const usedValue = inputElement.value.trim();

    // Prioritize used suggestions
    const prioritized = [...suggestions];
    if (usedValue && suggestions.includes(usedValue)) {
        prioritized.splice(prioritized.indexOf(usedValue), 1);
        prioritized.unshift(usedValue);
    }

    container.innerHTML = `
        <div class="col-md-12 d-flex flex-wrap gap-2">
            ${prioritized
                .map(
                    (s) => `
                        <button type="button" class="btn btn-lg btn-outline-info btn-sm">${s}</button>
                    `
                )
                .join('')}
        </div>
    `;

    Array.from(container.querySelectorAll('button')).forEach((btn) => {
        btn.addEventListener('click', () => {
            inputElement.value = btn.textContent; // Set selected value
            container.innerHTML = '';

            // Extract vehicle number from button text (e.g., "John - MH12AB1234")
            const parts = btn.textContent.split(' - ');
            const vehicleNumber = parts[1]?.trim();

            // Find full driver details from global list
            const matchedDriver = driverDetailsList.find(
                driver => driver.vehicle_number === vehicleNumber
            );

            if (matchedDriver) {
                $('#vehicleNumberInput').val(matchedDriver.vehicle_number);
                $('#driverContactInput').val(matchedDriver.drivermobileno);
                $('#vehicleNameInput').val(matchedDriver.vehicle_name);
                $('#driverLastNameInput').val(matchedDriver.driverlastname);
                $('#driverfirstname').val(matchedDriver.driverfirstname);
            }

            toggleReadonlyState();   // your custom function
            fetchChargesIfReady();   // your custom function
        });
    });
}

//generate booking ID
function generateBookingId() {
    const now = new Date();

    // Format date
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const yyyy = now.getFullYear();
    const formattedDate = dd + mm + yyyy;

    // Format time
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedTime = hours + minutes; // HHMM

    // Set prefix based on selected trip type
    let prefix = "BK"; // default
    if (selectedTripType.includes("airport")) {
        prefix = "AT";
    } else if (selectedTripType.includes("railway")) {
        prefix = "RT";
    } else if (selectedTripType.includes("outstation")) {
        prefix = "OS";
    } else if (selectedTripType.includes("holiday")) {
        prefix = "HT";
    } else if (selectedTripType.includes("hourly")) {
        prefix = "HR";
    }

    return prefix + formattedDate + formattedTime;
}

function updateReceipt(data) {
    // Date, Time, Booking ID
    document.getElementById('date').innerHTML = ` ${data.date}`;
    document.getElementById('time').innerHTML = ` ${data.time}`;
    document.getElementById('bookingId').innerHTML = ` ${data.bookingId}`;

    // Passenger Info
    document.getElementById('passengerName').innerHTML = ` ${data.passengerName}`;
    document.getElementById('contactNumber').innerHTML = ` ${data.contactNumber}`;
    document.getElementById('emailId').innerHTML = ` ${data.email}`;
    

    

    // Journey Info
    document.getElementById('fromCity').innerText = `${data.fromCity} `;
    document.getElementById('vehicleType').innerHTML = ` ${data.vehicleType}`;
    document.getElementById('driverName').innerHTML = `${data.driverName}`;

    document.getElementById('toCity').innerText = data.toCity;
    document.getElementById('vehicleNumber').innerHTML = `${data.vehicleNumber}`;
    document.getElementById('driverContact').innerHTML = ` ${data.driverContact}`;

    // Payment Details
    document.getElementById('paymentType').innerHTML = ` ${data.paymentType}`;
    document.getElementById('baseFare').innerHTML = ` ${data.baseFare}`;
    document.getElementById('discount').innerHTML = `${data.discount}`;
    document.getElementById('terminalCharges').innerHTML = ` ${data.terminalCharges}`;
    document.getElementById('surcharges').innerHTML = ` ${data.surcharges}`;
    document.getElementById('taxes').innerHTML = ` ${data.taxes}%`;

    // Total Amount
    document.getElementById('totalAmount').innerText = `${data.totalAmount}`;
}



function gatherReceiptData() {
  // read your inputs:
  const date = document.getElementById('datePicker')?.value || new Date().toLocaleDateString();
  const time = document.getElementById('timePicker')?.value || new Date().toLocaleTimeString();
  const bookingId = document.getElementById('bookingIdInput')?.value || generateBookingId();
                    // ('C' + Date.now().toString().slice(-8));

  const passengerName = document.getElementById('customerName')?.value || 'CUSTOMER NAME';
  const contactNumber = document.getElementById('customerContact')?.value || '+91 0000000000';
    const email = document.getElementById('customerEmail')?.value || 'CUSTOMER EMAIL';
    console.log(email);
 

  const fromCity = document.getElementById('fromInput')?.value || '{{ node.nodeCity }}';
  const toCity = document.getElementById('toInput')?.value || 'SHIRDI AIRPORT';

  const vehicleType = document.getElementById('vehicleTypeInput')?.value || 'SEDEN CAR';
  const driverName  = document.getElementById('driverfirstname')?.value || 'Driver Name';
  const vehicleNumber  = document.getElementById('vehicleNumberInput')?.value || 'MH 00 AA 0000';
  const driverContact  = document.getElementById('driverContactInput')?.value || '0000000000';

  const paymentType     = document.getElementById('paymentMethodInput')?.value || 'CASH';
  const baseFare        = parseFloat(document.getElementById('chargesInput')?.value) || 0;
  const discount        = parseFloat(document.getElementById('discountInput')?.value) || 0;
  const terminalCharges = parseFloat(document.getElementById('terminalChargesInput')?.value) || 0;
  const surcharges      = parseFloat(document.getElementById('extraChargesInput')?.value) || 0;
  const taxes           = parseFloat(document.getElementById('taxInput')?.value) || 0;

  const totalAmount = (baseFare - discount + terminalCharges + surcharges) 
                      * (1 + taxes/100);

  return {
    email,
    date,
    time,
    bookingId,
    passengerName,
    contactNumber,
    fromCity,
    toCity,
    vehicleType,
    driverName,
    vehicleNumber,
    driverContact,
    paymentType,

    baseFare: baseFare.toFixed(2),
    discount: discount.toFixed(2),
    terminalCharges: terminalCharges.toFixed(2),
    surcharges: surcharges.toFixed(2),
    taxes: taxes.toFixed(0),
    totalAmount: totalAmount.toFixed(2),
  };
}

// any time a form input changes, re-gather data and update receipt:
document.querySelectorAll(
  '#datePicker, #timePicker, #bookingIdInput, ' +
  '#customerName, #customerContact,#customerEmail ' +
  '#fromInput, #toInput, ' +
  '#vehicleTypeInput, #selectVehicleInput, ' +
  '#chargesInput, #discountInput, #terminalChargesInput, #extraChargesInput, #taxInput, #paymentMethodInput'
).forEach(el => {
  el.addEventListener('input', () => {
    updateReceipt(gatherReceiptData());
  });
});



// also call it once at page‐load
// Function to update receipt on page load and on any input change
document.addEventListener("DOMContentLoaded", function () {
        // List all relevant input field IDs
        const fieldIds = [
            'vehicleTypeInput',
            'selectVehicleInput',
            'vehicleNumberInput',
            'driverContactInput',
            'vehicleNameInput',
            'driverLastNameInput',
            'driverfirstname',
            'chargesInput',
            'extraChargesInput',
            'customerContact',
            'customerName',
            'discountInput',
            'paymentMethodInput',
            'customerEmail'
        ];

        fieldIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => {
                    updateReceipt(gatherReceiptData());
                });
            }
        });
    });

// Function to save trip data and print receipt
function saveAndPrint() {
    const data = gatherReceiptData();

    const button = event.target;
    button.disabled = true;
    // button.innerText = 'Saving...';

    fetch('/save-trip/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(res => {
                throw new Error(res.message || 'Server error');
            });
        }
        return response.json();
    })
    .then(res => {
        if (res.status === 'success') {
            const receipt = document.getElementById("receiptSection");

            const printWindow = window.open('', '', 'height=800,width=600');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Print Receipt</title>
                    <style>
                        * {
                            box-sizing: border-box;
                        }
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
                        ${receipt.innerHTML}
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 600);
        } else {
            alert("Failed to save trip: " + res.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Error saving trip: " + err.message);
    })
    .finally(() => {
        button.disabled = false;
        button.innerText = 'Save & Print';
    });
}




// CSRF helper (from Django docs)
function getCSRFToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const c = cookies[i].trim();
        if (c.startsWith(name + '=')) {
            return decodeURIComponent(c.substring(name.length + 1));
        }
    }
    return '';
}



