// Define initial data required by template literals
let currentDate = formatDateDDMMYYYY(new Date());
let currentTime = formatTime12hr(new Date());
let selectedTripType; // No default selection
let fromAddress = "";
let fromLat = "";
let fromLng = "";
let destination = "";
let tripID = "";

let terminal = 0, surcharge = 0, baseTariff = 0, taxPercent = 0;
let extraCharges = 0, discount = 0;
let stepStarted = false;
let pendingTripMode = null;
let selectedKmRange = null;
let selectedVehicleType = null;
let bookingFormData = {}; // store all inputs before payment
// Global variable to store trip ID
let generatedTripId = "";
let lastFetchedTripHTML = ""; // store HTML for printing later


function fetchTripId(nodeId, tripType) {
  fetch(`/api/generate-trip-id/?node_id=${nodeId}&trip_type=${encodeURIComponent(tripType)}`)
    .then(res => res.json())
    .then(data => {
      if (data.trip_id) {
        generatedTripId = data.trip_id;
        document.getElementById("tripId").textContent = generatedTripId; // for display if needed
      }
    })
    .catch(err => console.error("Error fetching trip ID:", err));
}

function fetchFutureTripId(nodeId, tripType, date, fromAddress, destination, time) {
  if (!nodeId || !date || date === "--") {
    console.error("Missing node ID or date for trip ID generation.");
    return;
  }

  fetch(`/api/generate-future-trip-id/?node_id=${nodeId}&trip_type=${encodeURIComponent(tripType)}&trip_date=${date}`)
    .then(res => res.json())
    .then(data => {
      if (data.trip_id) {
        const tripDetailsSection = document.getElementById("tripDetailsSection");
        if (tripDetailsSection) {
          tripDetailsSection.innerHTML = getFutureTripDetailsRow(tripType, {
            date,
            time,
            tripID: data.trip_id,
            fromAddress,
            destination,
            estimatedDistance: "--"
          });
        }
      } else {
        console.error("Error generating trip ID:", data.error || "Unknown error");
      }
    })
    .catch(err => console.error("Error fetching future trip ID:", err));
}

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

  stepStarted = false;
  clearStepOneSection();

  if (pendingTripMode === "live") {
    selectedTripMode = "live";
    setActiveTripButton("live");
    showTripTypes("live");
  } 
  else if (pendingTripMode === "future") {
    selectedTripMode = "future";
    setActiveTripButton("future");
    showTripTypes("future");
  }

  pendingTripMode = null;
}


function clearStepOneSection() {
  const stepOneSection = document.getElementById("stepOneSection");
  const tripDetailsSection = document.getElementById("tripDetailsSection");
  if (stepOneSection) {
    stepOneSection.style.display = "none";
    stepOneSection.innerHTML = "";
  }
  if (tripDetailsSection) {
    tripDetailsSection.innerHTML = "";
  }
}

function setActiveTripButton(type) {
  if (type === "live") {
    liveTripBtn.classList.add("active-trip-button");
    futureTripBtn.classList.remove("active-trip-button");
  } 
  else {
    futureTripBtn.classList.add("active-trip-button");
    liveTripBtn.classList.remove("active-trip-button");
  }
}

// function showTripTypes(type) {
//   const tripTypeSection = document.getElementById("tripTypeSection");
//   tripTypeSection.style.display = "flex";
//   tripTypeSection.innerHTML = "";

//   const title = document.createElement("h5");
//   title.className = "w-100 text-dark mb-2 fw-bold";
//   title.innerText = "Select Trip Type";
//   tripTypeSection.appendChild(title);

//   const tripOptions = type === "live"
//     ? [
//       { label: "Airport Transfer", icon: "mdi mdi-airplane-takeoff" },
//       { label: "Outstation", icon: "mdi mdi-map-marker-distance" },
//       { label: "Holiday Tour", icon: "mdi mdi-beach" },
//       { label: "Hourly Rental", icon: "mdi mdi-clock-outline" },
//     ]
//     : [
//       { label: "Airport Transfer", icon: "mdi mdi-airplane-takeoff" },
//       { label: "Outstation", icon: "mdi mdi-map-marker-distance" },
//       { label: "Holiday Tour", icon: "mdi mdi-beach" },
//       { label: "Hourly Rental", icon: "mdi mdi-clock-outline" },
//       { label: "Railway Transfer", icon: "mdi mdi-train" },
//     ];

//   tripOptions.forEach(option => {
//     const btn = document.createElement("button");
//     btn.className = "btn btn-outline-dark square-button text-center m-1";
//     btn.innerHTML = `<i class="${option.icon}"></i><span class="fw-bold">${option.label}</span>`;
//     btn.onclick = () => handleTripTypeSelection(option.label, btn);
//     tripTypeSection.appendChild(btn);
//   });
// }

function showTripTypes(type) {
  const tripTypeSection = document.getElementById("tripTypeSection");
  tripTypeSection.style.display = "flex";
  tripTypeSection.innerHTML = "";

  const title = document.createElement("h5");
  title.className = "w-100 text-dark mb-2 fw-bold";
  title.innerText = "Select Trip Type";
  tripTypeSection.appendChild(title);

  // 🔹 If Future Trip clicked → only show "Coming Soon"
  if (type === "future") {
    const comingSoon = document.createElement("p");
    comingSoon.className = "text-danger fw-bold fs-5 mt-2";
    comingSoon.innerText = "Feature Coming Soon...";
    tripTypeSection.appendChild(comingSoon);
    return; // stop here, don't render buttons
  }

  // 🔹 Otherwise show Live Trip buttons
  const tripOptions = [
    { label: "Airport Transfer", icon: "mdi mdi-airplane-takeoff" },
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

const rowLiveAirportDestinationSelection = `
  <div class="row col-md-12" id="rowLiveAirportDestinationSelection">
    <div class="col-md-10 position-relative">
      <label for="destination">
        <h5 class="text-dark fw-bold mb-2">Select Destination <span class="text-danger">*</span></h5>
      </label>
      <input type="text" id="destination" class="form-control" placeholder="Enter Destination" autocomplete="off" required>
    </div>

    <div class="col-md-2 d-flex justify-content-center align-items-end">
      <i class="mdi mdi-close-circle-outline text-danger"
         onclick="clearDestination()"
         style="font-size: 40px; cursor: pointer;"
         title="Clear Destination"></i>
    </div>

    <div class="col-md-12 position-relative mt-2" id="nextStepContainer">
      <button class="btn btn-dark w-100 d-flex justify-content-between align-items-center"
              id="nextStepBtn"
              onclick="handleLiveAirportNextStep()"
              disabled>
        <span class="fw-bold">Select Location</span>
        <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
      </button>
    </div>
    <div class="col-md-12 my-2" id="destinationSuggestionsBox"></div>
  </div>
`;

const rowLiveOutstationDestinationSelection = `
  <div class="row col-md-12 toggle-wrapper d-flex justify-content-between align-items-center">
    <button class="btn btn-md fw-bold w-50 text-dark bg-white" id="btnOneWay" onclick="toggleOutstationTripType('oneway')">
        <i class="mdi mdi-arrow-right-bold me-2"></i>One Way
      </button>
      <button class="btn btn-md fw-bold w-50 text-dark bg-white" id="btnRoundTrip" onclick="toggleOutstationTripType('roundtrip')">
        <i class="mdi mdi-repeat me-2"></i>Round Trip
      </button>
    </div>
  </div>

  <!-- 🚩 Message container -->
  <div id="outstationTripMessage" class="text-dark fw-bold mt-2"></div>

  <div class="row col-md-12" id="rowLiveOutstationDestinationSelection" style="display: none;">
    <div class="row col-md-12">
      <div class="col-md-10 position-relative">
        <label for="destination">
          <h5 class="text-dark fw-bold mb-2">Enter Outstation Destination <span class="text-danger">*</span></h5>
        </label>
        <input type="text" id="destination" class="form-control" placeholder="Enter Destination City / Address" autocomplete="off" required>
      </div>

      <div class="col-md-2 d-flex justify-content-center align-items-end">
        <i class="mdi mdi-close-circle-outline text-danger"
          onclick="clearDestination()"
          style="font-size: 40px; cursor: pointer;"
          title="Clear Destination"></i>
      </div>
    </div>

    <div class="col-md-12 position-relative mt-2" id="nextStepContainer">
      <button class="btn btn-dark w-100 d-flex justify-content-between align-items-center"
              id="nextStepBtn"
              onclick="handleLiveOutstationNextStep()"
              disabled>
        <span class="fw-bold">Get Distance</span>
        <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
      </button>
    </div>
    <div class="col-md-12 mt-1" id="outstationSuggestionsBox"></div>
  </div>
`;

const rowLiveHolidayTourPackageSelection = `
  <div class="row col-md-12" id="rowLiveHolidayTourPackageSelection">
    <div class="col-md-10 position-relative">
      <label for="holidayPackageInput">
        <h5 class="text-dark fw-bold mb-2">Select Holiday Package <span class="text-danger">*</span></h5>
      </label>
      <input type="text" id="holidayPackageInput" class="form-control" placeholder="Select Package" autocomplete="off" required />
    </div>

    <div class="col-md-2 d-flex justify-content-center align-items-end">
      <i class="mdi mdi-close-circle-outline text-danger"
         onclick="clearDestination()"
         style="font-size: 40px; cursor: pointer;"
         title="Clear Holiday Package"></i>
    </div>

    <div class="col-md-12 position-relative my-2" id="nextStepContainer">
      <button class="btn btn-dark w-100 d-flex justify-content-between align-items-center"
              id="nextStepBtn"
              onclick="handleLiveHolidayTourNextStep()"
              disabled>
        <span class="fw-bold">Proceed to Details</span>
        <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
      </button>
    </div>
    <div id="holidayPackageSuggestions"></div>
  </div>
`;


const rowLiveHourlyRentalPackageSelection = `
  <div class="row col-md-12" id="rowLiveHourlyRentalPackageSelection">
    <div class="col-md-10 position-relative">
      <label for="hourlyPackage">
        <h5 class="text-dark fw-bold mb-2">Select Hourly Rental Package <span class="text-danger">*</span></h5>
      </label>
      <input type="text" id="hourlyPackageInput" class="form-control" placeholder="Select Hour-KM Package" autocomplete="off" required />
    </div>

    <div class="col-md-2 d-flex justify-content-center align-items-end">
      <i class="mdi mdi-close-circle-outline text-danger"
         onclick="clearDestination()"
         style="font-size: 40px; cursor: pointer;"
         title="Clear Hourly Package"></i>
    </div>

    <div class="col-md-12 position-relative mt-2" id="nextStepContainer">
      <button class="btn btn-dark w-100 d-flex justify-content-between align-items-center"
              id="nextStepBtn"
              onclick="handleLiveHourlyRentalNextStep()"
              disabled>
        <span class="fw-bold">Proceed to Package Details</span>
        <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
      </button>
    </div>
    <div id="hourlyPackageSuggestions"></div>
  </div>
`;


const rowFutureAirportDestinationSelection = `
<div class="row col-md-12 toggle-wrapper d-flex justify-content-between align-items-center">
  <button class="btn btn-md fw-bold w-50 text-dark bg-white" id="btnFromAirport" onclick="toggleFutureAirportFields('from')"> <i class="mdi mdi-airplane-takeoff me-2"></i>From Airport</button>
  <button class="btn btn-md fw-bold w-50 text-dark bg-white" id="btnToAirport" onclick="toggleFutureAirportFields('to')"> <i class="mdi mdi-airplane-landing me-2"></i>To Airport</button>
</div>
<div class="mt-3" id="futureAirportDetails" style="display: none;">
  <div class="row col-md-12 form-group mb-3 position-relative">
    <label for="futureAirportFrom" class="form-label fw-bold">From <span class="text-danger">*</span></label>
    <div class="input-group">
      <input type="text" id="futureAirportFrom" class="form-control" placeholder="Enter Pickup Location" required>
      <span class="input-group-text bg-white">
        <i class="mdi mdi-close-circle-outline text-danger" style="font-size: 24px; cursor: pointer;" onclick="clearInput('futureAirportFrom')" title="Clear From"></i>
      </span>
    </div>
    <div id="fromAirportSuggestionsBox" class="w-100 mt-2"></div>
  </div>

  <div class="row col-md-12 form-group mb-3 position-relative">
    <label for="futureAirportTo" class="form-label fw-bold">To <span class="text-danger">*</span></label>
    <div class="input-group">
      <input type="text" id="futureAirportTo" class="form-control" placeholder="Enter Drop Location" required>
      <span class="input-group-text bg-white">
        <i class="mdi mdi-close-circle-outline text-danger" style="font-size: 24px; cursor: pointer;" onclick="clearInput('futureAirportTo')" title="Clear To"></i>
      </span>
    </div>
    <div id="toAirportSuggestionsBox" class="w-100 mt-2"></div>
  </div>

  <div class="row col-md-12">
    <div class="col-md-6 mb-3">
      <label for="futureAirportDate" class="form-label fw-bold">Date <span class="text-danger">*</span></label>
      <input type="date" id="futureAirportDate" class="form-control" required>
    </div>
    <div class="col-md-6 mb-3">
      <label for="futureAirportTime" class="form-label fw-bold">Time <span class="text-danger">*</span></label>
      <input type="time" id="futureAirportTime" class="form-control" required>
    </div>
  </div>

  <div class="row col-md-12 position-relative mt-2" id="nextStepContainer">
    <button class="btn btn-dark w-100 d-flex justify-content-between align-items-center"
            id="nextStepBtn"
            onclick="handleFutureTripNextStep('Airport Transfer')"
            disabled>
      <span class="fw-bold">Continue Booking</span>
      <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
    </button>
  </div>
</div>
`;


const rowFutureOutstationDestinationSelection = `
<div class="row col-md-12 toggle-wrapper d-flex justify-content-between align-items-center">
  <button class="btn btn-md fw-bold w-50 text-dark bg-white" id="btnOneWay" onclick="toggleOutstationTripType('oneway')">
    <i class="mdi mdi-arrow-right-bold me-2"></i>One Way
  </button>
  <button class="btn btn-md fw-bold w-50 text-dark bg-white" id="btnRoundTrip" onclick="toggleOutstationTripType('roundtrip')">
    <i class="mdi mdi-repeat me-2"></i>Round Trip
  </button>
</div>

<!-- 🚩 Message container -->
<div id="outstationTripMessage" class="text-dark fw-bold mt-2"></div>

<div class="mt-3" id="futureOutstationDetails" style="display: none;">
  <div class="row col-md-12 form-group mb-3">
    <label for="futureOutstationFrom" class="form-label fw-bold">From <span class="text-danger">*</span></label>
    <div class="input-group">
      <input type="text" id="futureOutstationFrom" class="form-control" placeholder="Enter Pickup Location from City" required>
      <span class="input-group-text bg-white">
        <i class="mdi mdi-close-circle-outline text-danger" style="font-size: 24px; cursor: pointer;" onclick="clearInput('futureOutstationFrom')" title="Clear From"></i>
      </span>
    </div>
  </div>
  <div class="row col-md-12 form-group mb-3">
    <label for="futureOutstationTo" class="form-label fw-bold">To <span class="text-danger">*</span></label>
    <div class="input-group">
      <input type="text" id="futureOutstationTo" class="form-control" placeholder="Enter Drop Location" required>
      <span class="input-group-text bg-white">
        <i class="mdi mdi-close-circle-outline text-danger" style="font-size: 24px; cursor: pointer;" onclick="clearInput('futureOutstationTo')" title="Clear To"></i>
      </span>
    </div>
  </div>
  <div class="row col-md-12">
    <div class="col-md-6 mb-3">
      <label for="futureOutstationDate" class="form-label fw-bold">Date <span class="text-danger">*</span></label>
      <input type="date" id="futureOutstationDate" class="form-control" required>
    </div>
    <div class="col-md-6 mb-3">
      <label for="futureOutstationTime" class="form-label fw-bold">Time <span class="text-danger">*</span></label>
      <input type="time" id="futureOutstationTime" class="form-control" required>
      
    </div>
  </div>
  <div class="row col-md-12 position-relative mt-2" id="nextStepContainer">
      <button class="btn btn-dark w-100 d-flex justify-content-between align-items-center"
              id="nextStepBtn"
              onclick="handleFutureTripNextStep('Outstation')"
              disabled>
        <span class="fw-bold">Continue Booking</span>
        <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
      </button>
    </div>
  </div>
</div>
`;

const rowFutureHolidayTourPackageSelection = `
<div class="row col-md-12 mt-3">
  <div class="form-group mb-3">
    <label for="futureHolidayPickup" class="form-label fw-bold">Pickup Point <span class="text-danger">*</span></label>
    <div class="input-group">
      <input type="text" id="futureHolidayPickup" class="form-control" placeholder="Enter Pickup Location" required>
      <span class="input-group-text bg-white">
        <i class="mdi mdi-close-circle-outline text-danger" style="font-size: 24px; cursor: pointer;" onclick="clearInput('futureHolidayPickup')" title="Clear"></i>
      </span>
    </div>
  </div>
  
  <div class="form-group mb-3">
    <label for="futureHolidayPackage" class="form-label fw-bold">Select Holiday Package <span class="text-danger">*</span></label>
    <div class="input-group">
      <input type="text" id="futureHolidayPackage" class="form-control" placeholder="Choose Holiday Package" required>
      <span class="input-group-text bg-white">
        <i class="mdi mdi-close-circle-outline text-danger" style="font-size: 24px; cursor: pointer;" onclick="clearInput('futureHolidayPackage')" title="Clear"></i>
      </span>
    </div>
  </div>
  <div class="row col-md-12">
    <div class="col-md-6 mb-3">
      <label for="futureAirportDate" class="form-label fw-bold">Date <span class="text-danger">*</span></label>
      <input type="date" id="futureAirportDate" class="form-control" required>
    </div>
    <div class="col-md-6 mb-3">
      <label for="futureAirportTime" class="form-label fw-bold">Time <span class="text-danger">*</span></label>
      <input type="time" id="futureAirportTime" class="form-control" required>
    </div>
  </div>
  <div class="row col-md-12 position-relative mt-2" id="nextStepContainer">
    <button class="btn btn-dark w-100 d-flex justify-content-between align-items-center"
            id="nextStepBtn"
            onclick="handleFutureTripNextStep('Holiday Tour')"
            disabled>
      <span class="fw-bold">Continue Booking</span>
      <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
    </button>
  </div>
</div>
`;


const rowFutureHourlyRentalPackageSelection = `
<div class="row col-md-12 mt-3">
  <div class="form-group mb-3">
    <label for="futureHourlyPickup" class="form-label fw-bold">Pickup Point <span class="text-danger">*</span></label>
    <div class="input-group">
      <input type="text" id="futureHourlyPickup" class="form-control" placeholder="Enter Pickup Location" required>
      <span class="input-group-text bg-white">
        <i class="mdi mdi-close-circle-outline text-danger" style="font-size: 24px; cursor: pointer;" onclick="clearInput('futureHourlyPickup')" title="Clear"></i>
      </span>
    </div>
  </div>
  
  <div class="form-group mb-3">
    <label for="futureHourlyPackage" class="form-label fw-bold">Select Hourly Package <span class="text-danger">*</span></label>
    <div class="input-group">
      <input type="text" id="futureHourlyPackage" class="form-control" placeholder="Choose Hourly Rental Package" required>
      <span class="input-group-text bg-white">
        <i class="mdi mdi-close-circle-outline text-danger" style="font-size: 24px; cursor: pointer;" onclick="clearInput('futureHourlyPackage')" title="Clear"></i>
      </span>
    </div>
  </div>
  <div class="row col-md-12">
    <div class="col-md-6 mb-3">
      <label for="futureAirportDate" class="form-label fw-bold">Date <span class="text-danger">*</span></label>
      <input type="date" id="futureAirportDate" class="form-control" required>
    </div>
    <div class="col-md-6 mb-3">
      <label for="futureAirportTime" class="form-label fw-bold">Time <span class="text-danger">*</span></label>
      <input type="time" id="futureAirportTime" class="form-control" required>
    </div>
  </div>

  <div class="row col-md-12 position-relative mt-2" id="nextStepContainer">
    <button class="btn btn-dark w-100 d-flex justify-content-between align-items-center"
            id="nextStepBtn"
            onclick="handleFutureTripNextStep('Hourly Rental')"
            disabled>
      <span class="fw-bold">Continue Booking</span>
      <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
    </button>
  </div>
</div>
`;


const rowFutureRailwayTransferStationSelection = `
<div class="row col-md-12 toggle-wrapper d-flex justify-content-between align-items-center">
  <button class="btn btn-md fw-bold w-50 text-dark bg-white" id="btnFromRailway" onclick="toggleFutureRailwayFields('from')">
    <i class="mdi mdi-train-variant me-2"></i>From Railway Station
  </button>
  <button class="btn btn-md fw-bold w-50 text-dark bg-white" id="btnToRailway" onclick="toggleFutureRailwayFields('to')">
    <i class="mdi mdi-train me-2"></i>To Railway Station
  </button>
</div>

<div class="mt-3" id="futureRailwayDetails" style="display: none;">
  <div class="row col-md-12 form-group mb-3">
    <label for="futureRailwayFrom" class="form-label fw-bold">From <span class="text-danger">*</span></label>
    <div class="input-group">
      <input type="text" id="futureRailwayFrom" class="form-control" placeholder="Enter Pickup Location" required>
      <span class="input-group-text bg-white">
        <i class="mdi mdi-close-circle-outline text-danger" style="font-size: 24px; cursor: pointer;" onclick="clearInput('futureRailwayFrom')" title="Clear From"></i>
      </span>
    </div>
  </div>
  <div class="row col-md-12 form-group mb-3">
    <label for="futureRailwayTo" class="form-label fw-bold">To <span class="text-danger">*</span></label>
    <div class="input-group">
      <input type="text" id="futureRailwayTo" class="form-control" placeholder="Enter Drop Location" required>
      <span class="input-group-text bg-white">
        <i class="mdi mdi-close-circle-outline text-danger" style="font-size: 24px; cursor: pointer;" onclick="clearInput('futureRailwayTo')" title="Clear To"></i>
      </span>
    </div>
  </div>
  <div class="row col-md-12">
    <div class="col-md-6 mb-3">
      <label for="futureRailwayDate" class="form-label fw-bold">Date <span class="text-danger">*</span></label>
      <input type="date" id="futureRailwayDate" class="form-control" required>
    </div>
    <div class="col-md-6 mb-3">
      <label for="futureRailwayTime" class="form-label fw-bold">Time <span class="text-danger">*</span></label>
      <input type="time" id="futureRailwayTime" class="form-control" required>
    </div>
  </div>
  <div class="row col-md-12 position-relative mt-2" id="nextStepContainer">
    <button class="btn btn-dark w-100 d-flex justify-content-between align-items-center"
            id="nextStepBtn"
            onclick="handleFutureTripNextStep('Railway Transfer')"
            disabled>
      <span class="fw-bold">Continue Booking</span>
      <i class="mdi mdi-arrow-right" style="font-size: 24px;"></i>
    </button>
  </div>
</div>
`;



function getTripTemplate(mode, type) {
  if (mode === "live") {
    if (type === "Airport Transfer") return rowLiveAirportDestinationSelection;
    if (type === "Outstation") return rowLiveOutstationDestinationSelection;
    if (type === "Holiday Tour") return rowLiveHolidayTourPackageSelection;
    if (type === "Hourly Rental") return rowLiveHourlyRentalPackageSelection;
  }

  if (mode === "future") {
    if (type === "Airport Transfer") return rowFutureAirportDestinationSelection;
    if (type === "Outstation") return rowFutureOutstationDestinationSelection;
    if (type === "Holiday Tour") return rowFutureHolidayTourPackageSelection;
    if (type === "Hourly Rental") return rowFutureHourlyRentalPackageSelection;
    if (type === "Railway Transfer") return rowFutureRailwayTransferStationSelection;
  }
}

function handleTripTypeSelection(tripType, button) {
  selectedTripType = tripType;
  stepStarted = true;

  // Highlight the selected button
  document.querySelectorAll(".square-button").forEach(btn => {
    btn.classList.remove("active-trip-type");
  });
  button.classList.add("active-trip-type");

  const tripTypeSection = document.getElementById("tripTypeSection");
  const stepOneSection = document.getElementById("stepOneSection");

  // Hide trip type buttons and clear the section
  tripTypeSection.innerHTML = "";
  tripTypeSection.style.display = "none";

  // Get the corresponding template
  const currentTemplate = getTripTemplate(selectedTripMode, tripType);

  if (currentTemplate) {
    stepOneSection.style.display = "block";
    stepOneSection.innerHTML = `<div class="w-100">${currentTemplate}</div>`;

    // Enable the next button only when input has value
    setTimeout(() => {
      const stepOneContainer = document.getElementById("stepOneSection");
      const nextBtn = document.getElementById("nextStepBtn");

      // ✅ Inject DateTime row into the Trip Details section (only for Live)
      if (selectedTripMode === "live") {
        fetch(`/api/generate-trip-id/?node_id=${window.nodeId}&trip_type=${encodeURIComponent(tripType)}`)
          .then(res => res.json())
          .then(data => {
            if (data.trip_id) {
              const tripDetailsSection = document.getElementById("tripDetailsSection");
              const tripID = data.trip_id;
              if (tripDetailsSection) {
                tripDetailsSection.innerHTML = getRowDateTimeType(tripType, data.trip_id);
              }
            } else {
              console.error("Trip ID generation failed:", data.error);
            }
          })
          .catch(err => console.error("API error:", err));
      }

      if (selectedTripMode === "future") {
        const tripDetailsSection = document.getElementById("tripDetailsSection");
        if (tripDetailsSection) {
          tripDetailsSection.innerHTML = getFutureTripDetailsRow(tripType);
        }
      }

      if (tripType === "Airport Transfer" && selectedTripMode === "live") {
        attachLocationSuggestionsCity({
          inputId: "destination",
          suggestionsBoxId: "destinationSuggestionsBox",
          cityName: selectedCity,
          onSelect: function (description) {
            document.getElementById("destination").value = description;
            document.getElementById("destinationSuggestionsBox").innerHTML = "";
            validateRequiredFieldsAndToggleButton();
          },
          maxResults: 4
        });
        document.getElementById("tripDetailsSection").innerHTML += rowLocationDetails;
      }

      if (tripType === "Outstation" && selectedTripMode === "live") {
        attachLocationSuggestions({
          inputId: "destination",
          suggestionsBoxId: "outstationSuggestionsBox",
          onSelect: function (description) {
            document.getElementById("destination").value = description;
            document.getElementById("outstationSuggestionsBox").innerHTML = "";
            validateRequiredFieldsAndToggleButton();
          },
          country: "in", // India-wide
          useBounds: false
        });
      }

      if (tripType === "Holiday Tour") {
        fetch(`/api/holiday-packages/?node_id=${window.nodeId}`)
          .then(res => res.json())
          .then(data => {
            if (data.packages && Array.isArray(data.packages)) {
              attachTextSuggestions({
                inputId: "holidayPackageInput",
                suggestionsBoxId: "holidayPackageSuggestions",
                suggestions: data.packages,
                onSelect: (pkg) => {
                  document.getElementById("holidayPackageInput").value = pkg;
                  document.getElementById("holidayPackageSuggestions").innerHTML = "";
                  validateRequiredFieldsAndToggleButton();
                }
              });
            }
          })
          .catch(err => console.error("Holiday Package API error:", err));
      }

      if (tripType === "Hourly Rental") {
        fetch(`/api/hourly-rental-options/?node_id=${window.nodeId}`)
          .then(res => res.json())
          .then(data => {
            if (data.options && Array.isArray(data.options)) {
              attachTextSuggestions({
                inputId: "hourlyPackageInput",
                suggestionsBoxId: "hourlyPackageSuggestions",
                suggestions: data.options,
                onSelect: (option) => {
                  document.getElementById("hourlyPackageInput").value = option;
                  document.getElementById("hourlyPackageSuggestions").innerHTML = "";
                  validateRequiredFieldsAndToggleButton();
                }
              });
            }
          })
          .catch(err => console.error("Hourly Rental API error:", err));
      }

      if (selectedTripType === "future" && selectedCategory === "Airport Transfer") {
        document.getElementById("stepOneContainer").innerHTML = rowFutureAirportDestinationSelection;

        // Now attach focus listeners for airport suggestions
        initFutureAirportSuggestions();
      }

      if (!stepOneContainer || !nextBtn) return;

      // Set today's date as minimum for all date inputs
      const todayStr = new Date().toISOString().split("T")[0];
      stepOneContainer.querySelectorAll("input[type='date']").forEach(input => {
        input.setAttribute("min", todayStr);
      });

      // Add event listeners to all required inputs (From, To, Date, Time)
      const requiredInputs = stepOneContainer.querySelectorAll("input[required]");
      requiredInputs.forEach(input => {
        input.addEventListener("input", () => {
          validateRequiredFieldsAndToggleButton();
        });
      });

      // Initial check in case of autofill or pre-populated inputs
      validateRequiredFieldsAndToggleButton();

      // // Attach trip-specific suggestion boxes
      // if (tripType === "Outstation") {
      //   attachOutstationSuggestionBox();
      // } else if (tripType === "Airport Transfer") {
      //   attachSuggestionBox(selectedCity);
      // }

    }, 300);

    setupExclusiveToggle("btnFromAirport", "btnToAirport");

  }
}


function formatDateDDMMYYYY(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function formatTime12hr(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function formatTimeTo12Hour(timeValue) {
  if (!timeValue) return "--";

  let [hours, minutes] = timeValue.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // Convert 0 → 12
  return `${hours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function validateRequiredFieldsAndToggleButton() {
  const container = document.getElementById("stepOneSection");
  const button = document.getElementById("nextStepBtn");

  if (!container || !button) return;

  const requiredInputs = container.querySelectorAll("input[required]");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let allValid = true;

  for (const input of requiredInputs) {
    const value = input.value.trim();

    // Empty field → invalid
    if (!value) {
      allValid = false;
      break;
    }

    // Date validation → must be today or later
    if (input.type === "date") {
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        allValid = false;
        break;
      }
    }
  }

  // Enable/disable button
  button.disabled = !allValid;
}

/**
 * Call this AFTER rendering the form template in stepOneSection
 * It ensures validation runs when ANY required field changes or is cleared.
 */
function attachValidationEvents() {
  const container = document.getElementById("stepOneSection");
  if (!container) return;

  const requiredInputs = container.querySelectorAll("input[required]");
  requiredInputs.forEach(input => {
    input.addEventListener("input", validateRequiredFieldsAndToggleButton);
    input.addEventListener("change", validateRequiredFieldsAndToggleButton); // ensures date/time updates
  });

  // Run initial check in case some fields are pre-filled
  validateRequiredFieldsAndToggleButton();
}

function attachLocationSuggestionsCity({ inputId, suggestionsBoxId, cityName, onSelect, maxResults = 4 }) {
  const input = document.getElementById(inputId);
  const suggestionsBox = document.getElementById(suggestionsBoxId);

  if (!input || !suggestionsBox) return;

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
    const query = input.value.trim();
    suggestionsBox.innerHTML = "";

    if (!query || !bounds || query.length < 2) return;

    autocompleteService.getPlacePredictions({
      input: query,
      bounds: bounds,
      componentRestrictions: { country: "in" }
    }, (predictions, status) => {
      if (status !== "OK" || !predictions) return;

      let count = 0;

      predictions.forEach(prediction => {
        if (count >= maxResults) return;

        placesService.getDetails({ placeId: prediction.place_id }, (place, status) => {
          if (status === "OK" && place.geometry && cityCenter) {
            const dist = google.maps.geometry.spherical.computeDistanceBetween(
              cityCenter,
              place.geometry.location
            );
            if (dist <= 20000) {
              const div = document.createElement("div");
              div.className = "mb-2";

              const wrapper = document.createElement("div");
              wrapper.className = "position-relative";

              const btn = document.createElement("button");
              btn.className = "btn btn-outline-dark w-100 text-start pe-5";
              btn.innerText = prediction.description;
              btn.onclick = () => onSelect(prediction.description);

              const icon = document.createElement("i");
              icon.className = "mdi mdi-map-marker text-start position-absolute";
              icon.style = "bottom: 6px; right: 12px; font-size: 24px;";

              wrapper.appendChild(btn);
              wrapper.appendChild(icon);
              div.appendChild(wrapper);
              suggestionsBox.appendChild(div);

              count++; // increment only if added
            }
          }
        });
      });
    });
  });
}



function attachLocationSuggestions({
  inputId,
  suggestionsBoxId,
  cityName = "",
  onSelect,
  maxResults = 4,
  country = "in",
  useBounds = true
}) {
  const input = document.getElementById(inputId);
  const suggestionsBox = document.getElementById(suggestionsBoxId);

  if (!input || !suggestionsBox) return;

  const autocompleteService = new google.maps.places.AutocompleteService();
  const geocoder = new google.maps.Geocoder();
  const placesService = new google.maps.places.PlacesService(document.createElement("div"));

  let bounds = null;
  let cityCenter = null;

  if (useBounds && cityName) {
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
  }

  input.addEventListener("input", () => {
    const query = input.value.trim();
    console.log("Typing:", query, "on inputId:", inputId);
    suggestionsBox.innerHTML = "";
    if (!query || query.length < 2) return;

    const request = {
      input: query,
      componentRestrictions: { country }
    };

    if (useBounds && bounds) {
      request.bounds = bounds;
    }

    autocompleteService.getPlacePredictions(request, (predictions, status) => {
      if (status !== "OK" || !predictions) return;

      let count = 0;

      predictions.forEach(prediction => {
        if (count >= maxResults) return;

        placesService.getDetails({ placeId: prediction.place_id }, (place, status) => {
          if (status === "OK" && (!useBounds || (place.geometry && cityCenter && google.maps.geometry.spherical.computeDistanceBetween(cityCenter, place.geometry.location) <= 20000))) {
            const div = document.createElement("div");
            div.className = "mb-2";

            const wrapper = document.createElement("div");
            wrapper.className = "position-relative";

            const btn = document.createElement("button");
            btn.className = "btn btn-outline-dark w-100 text-start pe-5";
            btn.innerText = prediction.description;
            btn.onclick = () => onSelect(prediction.description);

            const icon = document.createElement("i");
            icon.className = "mdi mdi-map-marker text-start position-absolute";
            icon.style = "bottom: 6px; right: 12px; font-size: 24px;";

            wrapper.appendChild(btn);
            wrapper.appendChild(icon);
            div.appendChild(wrapper);
            suggestionsBox.appendChild(div);

            count++;
          }
        });
      });
    });
  });
}


// --- small util
function debounce(fn, ms = 400) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), ms);
  };
}

// --- call DistanceMatrix only when both fields have values
function safeRecalcDistance() {
  try {
    const fromEl = document.getElementById("futureAirportFrom");
    const toEl   = document.getElementById("futureAirportTo");
    if (!fromEl || !toEl) return;

    const from = (fromEl.value || "").trim();
    const to   = (toEl.value || "").trim();
    if (!from || !to) return;

    if (typeof calculateDistance === "function") {
      calculateDistance("futureAirportFrom", "futureAirportTo");
    } else {
      console.warn("[attachTextSuggestions] calculateDistance() not found");
    }
  } catch (e) {
    console.error("[attachTextSuggestions] safeRecalcDistance error:", e);
  }
}

// --- UPDATED function
function attachTextSuggestions({ inputId, suggestionsBoxId, suggestions = [], onSelect }) {
  const input = document.getElementById(inputId);
  const box   = document.getElementById(suggestionsBoxId);

  // We must always wire events even if suggestions are empty
  if (!input || !box) return;

  const debouncedRecalc = debounce(safeRecalcDistance, 500);

  function renderSuggestions(query = "") {
    box.innerHTML = "";

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return; // nothing to render, but listeners remain wired
    }

    const filtered = query
      ? suggestions.filter(item => (item || "").toLowerCase().includes(query.toLowerCase()))
      : suggestions;

    const top = filtered.slice(0, 10);

    top.forEach(item => {
      const div = document.createElement("div");
      div.className = "my-2";

      const wrapper = document.createElement("div");
      wrapper.className = "position-relative";

      const btn = document.createElement("button");
      btn.type = "button"; // prevent form submit
      btn.className = "btn btn-outline-dark w-100 text-start pe-5";
      btn.innerText = item;

      btn.onclick = () => {
        input.value = item;
        box.innerHTML = "";

        // Always recalc on selection
        safeRecalcDistance();

        if (typeof onSelect === "function") onSelect(item);
      };

      const icon = document.createElement("i");
      icon.className = "mdi mdi-map-marker text-start position-absolute";
      icon.style = "bottom: 6px; right: 12px; font-size: 24px;";

      wrapper.appendChild(btn);
      wrapper.appendChild(icon);
      div.appendChild(wrapper);
      box.appendChild(div);
    });
  }

  // Show all suggestions on focus (if any)
  input.addEventListener("focus", () => renderSuggestions());

  // Filter list as user types, and debounce distance recalculation
  input.addEventListener("input", () => {
    renderSuggestions(input.value);
    debouncedRecalc();
  });

  // Hide after blur (allow click), also recalc distance
  input.addEventListener("blur", () => {
    setTimeout(() => {
      box.innerHTML = "";
      safeRecalcDistance();
    }, 200);
  });
}

// (Optional) ensure distance recalculates even if user types without using suggestions:
["futureAirportFrom", "futureAirportTo"].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener("change", safeRecalcDistance);
    el.addEventListener("blur",   safeRecalcDistance);
    el.addEventListener("input",  debounce(safeRecalcDistance, 500));
  }
});


function getRowDateTimeType(tripType, tripId) {
  const currentDate = formatDateDDMMYYYY(new Date());
  const currentTime = formatTime12hr(new Date());

  return `
    <div class="row mb-3" id="rowDateTimeType">
      <div class="col-md-3">
        <label class="form-label">Current Date</label>
        <h5 class="text-primary fw-bold" id="tripDate">${currentDate}</h5>
      </div>
      <div class="col-md-3">
        <label class="form-label">Current Time</label>
        <h5 class="text-primary fw-bold" id="tripTime">${currentTime}</h5>
      </div>
      <div class="col-md-6">
        <label class="form-label text-primary fw-bold" id="tripType">Trip Type : ${tripType}</label>
        <p class="fw-bold text-muted mb-0" id="tripId">Trip ID: ${tripId}</p>
      </div>
    </div>
  `;
}


function getFutureTripDetailsRow(tripType, tripData = {}) {
  const {
    date = "--",
    time = "--",
    tripID = "--",
    fromAddress = "--",
    fromLat = "--",
    fromLng = "--",
    destination = "--",
    toLat = "---",
    toLng = "---",
    estimatedDistance = "--"
  } = tripData;

  return `
    <!-- Row 1: Date, Time, Trip Type -->
    <div class="row mb-3" id="rowDateTimeType">
      <div class="col-md-3">
        <label class="form-label">Date</label>
        <h5 class="text-primary fw-bold" id="tripDate">${date}</h5>
      </div>
      <div class="col-md-3">
        <label class="form-label">Time</label>
        <h5 class="text-primary fw-bold" id="tripTime">${time}</h5>
      </div>
      <div class="col-md-6">
        <label class="form-label text-primary fw-bold" id="tripType">Trip Type : ${tripType}</label>
        <p class="fw-bold text-muted mb-0" id="tripId">Trip ID: ${tripID}</p>
      </div>
    </div>

    <!-- Row 2: From & To Location -->
    <div class="row mb-3" id="rowLocationDetails">
      <div class="col-md-4">
        <label class="form-label fw-bold">From</label>
        <p id="fromAddress">${fromAddress}</p>
        <small id="fromCoords" class="text-muted d-none">Lat: ${fromLat}, Lng: ${fromLng}</small>
      </div>
      <div class="col-md-4">
        <label class="form-label fw-bold">To (Destination)</label>
        <p id="toAddress">${destination}</p>
        <small id="toCoords" class="text-muted d-none">Lat: ${toLat}, Lng: ${toLng}</small>
      </div>
      <div class="col-md-4">
        <label class="form-label fw-bold">Estimated Distance</label>
        <h5 id="estimatedDistance" class="text-success fw-bold">${estimatedDistance}</h5>
      </div>
    </div>
  `;
}

function handleLiveAirportNextStep() {

  const nextStepBtn = document.getElementById("nextStepBtn");
  const destination = document.getElementById("destination").value;
  const fromLat = parseFloat(window.nodeLatitude);
  const fromLng = parseFloat(window.nodeLongitude);
  const fromAddress = window.nodeAddress;
  const geocoder = new google.maps.Geocoder();

  if (!destination) {
    alert("Please enter destination.");
    return;
  }

  if (nextStepBtn) {
    nextStepBtn.style.display = "d-none";
  }

  geocoder.geocode({ address: destination }, (results, status) => {
    if (status === "OK" && results[0]) {
      const toLatLng = results[0].geometry.location;
      const toLat = toLatLng.lat();
      const toLng = toLatLng.lng();

      if (google.maps.geometry && google.maps.geometry.spherical) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(fromLat, fromLng),
          toLatLng
        );
        const kmDistance = (distance / 1000).toFixed(2);

        // Add trip details section
        const locationRowHTML = getRowLocationDetails({
          fromAddress,
          fromLat,
          fromLng,
          destination,
          toLat,
          toLng,
          kmDistance
        });

        const tripDetailsSection = document.getElementById("tripDetailsSection");
        if (tripDetailsSection) {
          const existingRow = document.getElementById("rowLocationDetails");
          if (existingRow) existingRow.remove();
          tripDetailsSection.insertAdjacentHTML("beforeend", locationRowHTML);
        }

        // ✅ Instead of hiding, load vehicle selection
        showVehicleSelectionAfterLocation(window.nodeId, kmDistance, selectedTripType);

      } else {
        console.error("Google Maps Geometry library not loaded.");
        alert("Distance calculation failed. Please reload the page.");
      }

    } else {
      alert("Failed to find destination location.");
      console.error("Geocoding error:", status);
    }
  });
}

function handleFutureTripNextStep(tripType) {
  let fromAddress = "";
  let destination = "";
  let date = "";
  let time = "";
  let currentNodeId = window.nodeId;

  if (tripType === "Airport Transfer") {
    fromAddress = document.getElementById("futureAirportFrom")?.value.trim() || "--";
    destination = document.getElementById("futureAirportTo")?.value.trim() || "--";
    date = document.getElementById("futureAirportDate")?.value || "--";
    time = formatTimeTo12Hour(document.getElementById("futureAirportTime")?.value || "");
    calculateDistance("futureAirportFrom", "futureAirportTo");
  }
  else if (tripType === "Outstation") {
    fromAddress = document.getElementById("futureOutstationFrom")?.value.trim() || "--";
    destination = document.getElementById("futureOutstationTo")?.value.trim() || "--";
    date = document.getElementById("futureOutstationDate")?.value || "--";
    time = formatTimeTo12Hour(document.getElementById("futureOutstationTime")?.value || "");
  }
  else if (tripType === "Holiday Tour") {
    fromAddress = document.getElementById("futureHolidayPickup")?.value.trim() || "--";
    destination = document.getElementById("futureHolidayPackage")?.value.trim() || "--";
    date = document.getElementById("futureAirportDate")?.value || "--";
    time = formatTimeTo12Hour(document.getElementById("futureAirportTime")?.value || "");
  }
  else if (tripType === "Hourly Rental") {
    fromAddress = document.getElementById("futureHourlyPickup")?.value.trim() || "--";
    destination = document.getElementById("futureHourlyPackage")?.value.trim() || "--";
    date = document.getElementById("futureAirportDate")?.value || "--";
    time = formatTimeTo12Hour(document.getElementById("futureAirportTime")?.value || "");
  }
  else if (tripType === "Railway Transfer") {
    fromAddress = document.getElementById("futureRailwayFrom")?.value.trim() || "--";
    destination = document.getElementById("futureRailwayTo")?.value.trim() || "--";
    date = document.getElementById("futureRailwayDate")?.value || "--";
    time = formatTimeTo12Hour(document.getElementById("futureRailwayTime")?.value || "");
  }
  
  // ✅ Just call the separate trip ID fetch function
  fetchFutureTripId(currentNodeId, tripType, date, fromAddress, destination, time);
}

function initCityRestrictedAutocomplete(inputId, nodeCity) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["geocode"],
    componentRestrictions: { country: "in" } // Change if needed
  });

  autocomplete.addListener("place_changed", function () {
    const place = autocomplete.getPlace();

    if (place.address_components) {
      const inCity = place.address_components.some(c =>
        c.long_name.toLowerCase() === nodeCity.toLowerCase()
      );

      if (!inCity) {
        alert(`Please select a location inside ${nodeCity}`);
        input.value = "";
      }
    }
  });
}

async function fetchAirportSuggestions(nodeId = null) {
  const url = nodeId ? `/api/airport-suggestions/?node_id=${nodeId}` : `/api/airport-suggestions/`;
  const resp = await fetch(url);
  const data = await resp.json();
  return data.suggestions || [];
}

async function initAirportInputSuggestions(which) {
  const nodeId = window.nodeId || null;
  const suggestions = await fetchAirportSuggestions(nodeId);

  if (which === "from") {
    // From Airport → attach to TO input
    attachTextSuggestions({
      inputId: "futureAirportTo",
      suggestionsBoxId: "fromAirportSuggestionsBox",
      suggestions: suggestions,
      onSelect: (description) => {
        document.getElementById("futureAirportTo").value = description;
        document.getElementById("fromAirportSuggestionsBox").innerHTML = "";

        // If airport chosen → calculate distance
        if (description.includes("Airport")) {
          calculateDistance("futureAirportFrom", "futureAirportTo");
        }

        validateRequiredFieldsAndToggleButton();
      }
    });
  } else {
    // To Airport → attach to FROM input
    attachTextSuggestions({
      inputId: "futureAirportFrom",
      suggestionsBoxId: "fromAirportSuggestionsBox",
      suggestions: suggestions,
      onSelect: (description) => {
        document.getElementById("futureAirportFrom").value = description;
        document.getElementById("fromAirportSuggestionsBox").innerHTML = "";

        // If airport chosen → calculate distance
        if (description.includes("Airport")) {
          calculateDistance("futureAirportFrom", "futureAirportTo");
        }

        validateRequiredFieldsAndToggleButton();
      }
    });
  }
}


function showVehicleSelectionAfterLocation(nodeId, distanceInKm, tripType) {
  selectedTripType = tripType; // store trip type for later tariff calls
  const nextStepContainer = document.getElementById("nextStepContainer");

  // Hide the Select Location button
  const nextStepBtn = document.getElementById("nextStepBtn");
  if (nextStepBtn) nextStepBtn.style.display = "none";

  // Remove old sections
  document.getElementById("vehicleTypeSelection")?.remove();
  document.getElementById("kmSlabSection")?.remove();

  // Fetch vehicle types for this trip type
  fetch(`/api/active-vehicle-types/${nodeId}/?trip_type=${tripType}`)
    .then(res => res.json())
    .then(data => {
      const vehicleTypes = data.vehicle_types || [];
      if (!vehicleTypes.length) {
        nextStepContainer.insertAdjacentHTML(
          "beforeend",
          `<p class="text-danger fw-bold mt-2">No active vehicles available for this trip type.</p>`
        );
        return;
      }

      nextStepContainer.insertAdjacentHTML(
        "beforeend",
        getVehicleTypeSelectionHTML(vehicleTypes)
      );

      // Only call KM range selection for trips that require it
      if (tripType !== "Hourly Rental" && tripType !== "Holiday Tour") {
        fetchKmRangesAndShowButtons(distanceInKm, tripType);
      }
    })
    .catch(err => {
      console.error("Error fetching vehicle types:", err);
      nextStepContainer.insertAdjacentHTML(
        "beforeend",
        `<p class="text-danger fw-bold mt-2">Error loading vehicle types.</p>`
      );
    });
}

function getVehicleTypeSelectionHTML(availableVehicles) {
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
  return `
        <div id="vehicleTypeSelection" class="mt-2">
            <label class="form-label fw-bold">Select Vehicle Type</label>
            <div class="row gx-2 gy-2">
                ${availableVehicles.map(vehicle => `
                    <div class="col-6 col-md-3">
                        <button class="btn btn-outline-dark grid-square-button" 
                            onclick="selectVehicleType('${vehicle}')">
                            <i class="mdi ${vehicleIconMap[vehicle] || 'mdi-car'} fs-3"></i>
                            <span class="text-strong">${vehicle}</span>
                        </button>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function fetchKmRangesAndShowButtons(distanceInKm, tripType) {
  const container = document.getElementById("nextStepContainer");
  document.getElementById("kmSlabSection")?.remove();

  fetch(`/get-km-ranges/${window.nodeId}/?trip_type=${tripType}`)
    .then(res => res.json())
    .then(data => {
      const kmRanges = data.km_ranges || [];
      const sortedByDistance = kmRanges
        .map(range => {
          const [min, max] = range.split('-').map(Number);
          const midPoint = (min + max) / 2;
          return {
            range,
            contains: distanceInKm >= min && distanceInKm <= max,
            distanceFromMid: Math.abs(distanceInKm - midPoint)
          };
        })
        .sort((a, b) => a.distanceFromMid - b.distanceFromMid)
        .slice(0, 4);

      const btnHtml = sortedByDistance.map(item => `
                <div class="col-6 col-md-6">
                    <button class="btn btn-md btn-outline-dark w-100 km-range-button ${item.contains ? 'selected' : ''}" 
                        onclick="selectKmRange('${item.range}', event)">
                        ${item.range} km
                    </button>
                </div>
            `).join("");

      container.insertAdjacentHTML('beforeend', `
                <div id="kmSlabSection" class="col-md-12 mt-3">
                    <label class="form-label fw-bold">Select KM Slab</label>
                    <div class="row gx-2 gy-2">
                        ${btnHtml}
                    </div>
                </div>
            `);
    })
    .catch(err => console.error("Error fetching km ranges:", err));
}

function selectVehicleType(vehicle) {
  document.querySelectorAll("#vehicleTypeSelection button").forEach(btn => {
    btn.classList.remove("active", "btn-dark", "text-white");
    btn.classList.add("btn-outline-dark", "text-dark");
  });
  const clickedBtn = [...document.querySelectorAll("#vehicleTypeSelection button")]
    .find(btn => btn.innerText.trim() === vehicle);
  if (clickedBtn) {
    clickedBtn.classList.add("active", "btn-dark", "text-white");
    clickedBtn.classList.remove("btn-outline-dark", "text-dark");
  }
  selectedVehicleType = vehicle;
  tryShowTariffDetails();
}

function selectKmRange(kmRange, event) {
  document.querySelectorAll(".km-range-button").forEach(btn => {
    btn.classList.remove("active", "btn-dark", "text-white");
    btn.classList.add("btn-outline-dark", "text-dark");
  });
  event.currentTarget.classList.add("active", "btn-dark", "text-white");
  event.currentTarget.classList.remove("btn-outline-dark", "text-dark");
  selectedKmRange = kmRange;
  tryShowTariffDetails();
}

function tryShowTariffDetails() {
  // For trip types that require KM range
  if (selectedTripType !== "Holiday Tour" && selectedTripType !== "Hourly Rental") {
    if (!selectedKmRange || !selectedVehicleType || !selectedTripType) {
      console.log("Waiting for all selections...");
      return;
    }
  } else {
    // For Holiday Tour / Hourly Rental, skip km range check
    if (!selectedVehicleType || !selectedTripType) {
      console.log("Waiting for selections...");
      return;
    }
  }

  let apiUrl = "";

  if (selectedTripType === "Holiday Tour") {
    const holidayPackage = document.getElementById("holidayPackageInput")?.value;
    if (!holidayPackage) {
      alert("Please select a Holiday Package first.");
      return;
    }
    apiUrl = `/get-tariff-details/${window.nodeId}/${encodeURIComponent(holidayPackage)}/${selectedVehicleType}/?trip_type=${selectedTripType}`;
  }
  else if (selectedTripType === "Hourly Rental") {
    const hourlyPackage = document.getElementById("hourlyPackageInput")?.value;
    if (!hourlyPackage) {
      alert("Please select an Hourly Rental package first.");
      return;
    }
    apiUrl = `/get-tariff-details/${window.nodeId}/${encodeURIComponent(hourlyPackage)}/${selectedVehicleType}/?trip_type=${selectedTripType}`;
  }
  else {
    apiUrl = `/get-tariff-details/${window.nodeId}/${encodeURIComponent(selectedKmRange)}/${selectedVehicleType}/?trip_type=${selectedTripType}`;
  }

  fetch(apiUrl)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        console.warn(data.error);
        return;
      }

      // Tariff calculation based on trip type
      if (selectedTripType === "Airport Transfer") {
        vehicleTariff = parseFloat(data.ratePerKm);
      }
      else if (selectedTripType === "Outstation") {
        let estimatedDistance = 0;
        const distElem = document.getElementById("estimatedDistance");
        if (distElem) {
          const match = distElem.textContent.match(/([\d.]+)/);
          if (match) {
            estimatedDistance = parseFloat(match[1]);
          }
        }
        vehicleTariff = estimatedDistance * 2 * parseFloat(data.ratePerKm);
      }
      else if (selectedTripType === "Holiday Tour" || selectedTripType === "Hourly Rental") {
        vehicleTariff = parseFloat(data.ratePerKm);
      }
      else {
        vehicleTariff = parseFloat(data.ratePerKm);
      }

      terminal = parseFloat(data.fixedTerminalCharges);
      surcharge = parseFloat(data.fixedSurCharges);
      taxPercent = parseFloat(data.fixedTax);
      baseTariff = vehicleTariff;

      const tripDetails = document.getElementById("tripDetailsSection");
      ["tariffDetailsRow", "additionalChargesRow", "rowActionButtons"].forEach(id => {
        document.getElementById(id)?.remove();
      });

      tripDetails.insertAdjacentHTML("beforeend", buildTariffHTML(data, vehicleTariff));
      if (!document.getElementById("rowActionButtons")) {
        tripDetails.insertAdjacentHTML("beforeend", buildActionButtonsHTML());
      }

      document.getElementById("extraChargesInput").addEventListener("input", calculateTotal);
      document.getElementById("discountInput").addEventListener("input", calculateTotal);
      calculateTotal();
    })
    .catch(err => console.error("Tariff fetch error:", err));
}

function buildTariffHTML(data, vehicleTariff) {
  return `
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
                <h4 class="text-primary fw-bold">₹ ${parseInt(vehicleTariff)}.00</h4>
            </div>
        </div>
        <div class="row mt-3" id="additionalChargesRow">
            <div class="col-md-4">
                <label class="form-label fw-bold">Extra Charges (₹)</label>
                <div class="input-group">
                    <span class="input-group-text fw-bold text-dark fs-4" onclick="adjustCharge('extraChargesInput', -50)">−</span>
                    <input type="number" class="form-control text-center" id="extraChargesInput" value="0" min="0" />
                    <span class="input-group-text fw-bold text-dark fs-4" onclick="adjustCharge('extraChargesInput', 50)">+</span>
                </div>
            </div>
            <div class="col-md-4">
                <label class="form-label fw-bold">Discount (₹)</label>
                <div class="input-group">
                    <span class="input-group-text fw-bold text-dark fs-4" onclick="adjustCharge('discountInput', -50)">−</span>
                    <input type="number" class="form-control text-center" id="discountInput" value="0" min="0" />
                    <span class="input-group-text fw-bold text-dark fs-4" onclick="adjustCharge('discountInput', 50)">+</span>
                </div>
            </div>
            <div class="col-md-4 d-flex align-items-end">
                <div>
                    <label class="form-label fw-bold">Total Amount (₹)</label>
                    <h3 id="totalAmountDisplay" class="text-dark fw-bold">--</h3>
                </div>
            </div>
        </div>
    `;
}

function adjustCharge(inputId, delta) {
  const input = document.getElementById(inputId);
  let current = parseFloat(input.value) || 0;
  input.value = Math.max(0, current + delta);
  calculateTotal();
}

function toggleGSTFields() {
  const section = document.getElementById('gstDetailsSection');
  section.style.display = document.getElementById('gstToggle').checked ? 'block' : 'none';
}

function calculateTotal() {
  extraCharges = parseFloat(document.getElementById("extraChargesInput")?.value) || 0;
  discount = parseFloat(document.getElementById("discountInput")?.value) || 0;

  const subtotal = terminal + surcharge + baseTariff + extraCharges - discount;
  const taxAmount = (subtotal * taxPercent) / 100;
  const grandTotal = subtotal + taxAmount;

  document.getElementById("totalAmountDisplay").textContent = `₹ ${grandTotal.toFixed(2)}`;
}


function handleLiveOutstationNextStep() {
  const destination = document.getElementById("destination").value;
  const fromLat = parseFloat(window.nodeLatitude);
  const fromLng = parseFloat(window.nodeLongitude);
  const fromAddress = window.nodeAddress || "Your Node"; // fallback
  const geocoder = new google.maps.Geocoder();

  if (!destination) {
    alert("Please enter destination.");
    return;
  }

  geocoder.geocode({ address: destination }, (results, status) => {
    if (status === "OK" && results[0]) {
      const toLatLng = results[0].geometry.location;
      const toLat = toLatLng.lat();
      const toLng = toLatLng.lng();

      if (google.maps.geometry && google.maps.geometry.spherical) {
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(fromLat, fromLng),
          toLatLng
        );

        const kmDistance = (distance / 1000).toFixed(2);

        const tripDetailsSection = document.getElementById("tripDetailsSection");

        if (tripDetailsSection) {
          const existingRow = document.getElementById("rowLocationDetails");
          if (existingRow) existingRow.remove();

          const locationRowHTML = getRowLocationDetails({
            fromAddress,
            fromLat,
            fromLng,
            destination,
            toLat,
            toLng,
            kmDistance
          });

          tripDetailsSection.insertAdjacentHTML("beforeend", locationRowHTML);

          // 🔹 Hide "Select Location" button
          const nextStepBtn = document.getElementById("nextStepBtn");
          if (nextStepBtn) nextStepBtn.style.display = "none";

          // 🔹 Show vehicle type selection for Outstation
          showVehicleTypeSelection("outstation");

          // 🔹 Fetch KM Slabs for Outstation
          fetchOutstationKmRangesAndShowButtons(kmDistance);
        }
      } else {
        console.error("Google Maps Geometry library not loaded.");
        alert("Distance calculation failed. Please reload the page.");
      }

    } else {
      alert("Failed to locate the destination.");
      console.error("Geocoder failed:", status);
    }
  });
}

function showVehicleTypeSelection(tripType) {
  const container = document.getElementById("nextStepContainer");

  // Remove if already exists
  const existing = document.getElementById("vehicleTypeSelection");
  if (existing) existing.remove();

  fetch(`/fetch-vehicle-types/${tripType}/${window.nodeId}/`)
    .then(response => response.json())
    .then(data => {
      const availableVehicles = data.vehicle_types || [];
      if (!availableVehicles.length) return;

      const vehicleIconMap = {
        'hatchback': 'mdi-car-hatchback',
        'seden': 'mdi-car',
        'premiumSeden': 'mdi-car-limousine',
        'muv': 'mdi-van-utility',
        'suv': 'mdi-car-estate',
        'premiumSUV': 'mdi-car-traction-control',
        'acTravellar': 'mdi-bus',
        'buses': 'mdi-bus-side'
      };

      let html = `
                <div id="vehicleTypeSelection" class="mt-2">
                    <label class="form-label fw-bold">Select Vehicle Type</label>
                    <div class="row gx-2 gy-2">
            `;

      availableVehicles.forEach(vehicle => {
        const icon = vehicleIconMap[vehicle] || 'mdi-car';
        html += `
                    <div class="col-6 col-md-3">
                        <button class="btn btn-outline-dark grid-square-button"
                            onclick="selectVehicleType('${vehicle}')">
                            <i class="mdi ${icon} fs-3"></i>
                            <span class="text-strong">${vehicle}</span>
                        </button>
                    </div>
                `;
      });

      html += `</div></div>`;
      container.insertAdjacentHTML("beforeend", html);
    })
    .catch(err => console.error("Error fetching vehicle types:", err));
}

function fetchOutstationKmRangesAndShowButtons(distanceInKm) {
  const container = document.getElementById("nextStepContainer");

  // Remove existing KM Slab section if present
  const existingKmSlabSection = document.getElementById("kmSlabSection");
  if (existingKmSlabSection) existingKmSlabSection.remove();

  fetch(`/get-outstation-km-ranges/${window.nodeId}/`)
    .then(response => response.json())
    .then(data => {
      const kmRanges = data.km_ranges || [];

      const sortedByDistance = kmRanges
        .map(range => {
          const [min, max] = range.split('-').map(Number);
          const midPoint = (min + max) / 2;
          const contains = distanceInKm >= min && distanceInKm <= max;
          const distanceFromMid = Math.abs(distanceInKm - midPoint);
          return { range, distanceFromMid, contains };
        })
        .sort((a, b) => a.distanceFromMid - b.distanceFromMid)
        .slice(0, 4);

      const btnHtml = sortedByDistance.map(item => `
                <div class="col-6 col-md-6">
                    <button class="btn btn-md btn-outline-dark w-100 km-range-button ${item.contains ? 'selected' : ''}" 
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

function handleLiveHolidayTourNextStep() {
  const destination = document.getElementById("holidayPackageInput").value;
  const fromAddress = window.nodeAddress || "Node Address";
  const fromLat = window.nodeLatitude || "--";
  const fromLng = window.nodeLongitude || "--";

  if (!destination) {
    alert("Please select a Holiday Package.");
    return;
  }

  const tripDetailsSection = document.getElementById("tripDetailsSection");

  if (tripDetailsSection) {
    // Remove previous location row if exists
    const existingRow = document.getElementById("rowLocationDetails");
    if (existingRow) existingRow.remove();

    const locationRowHTML = getRowLocationDetails({
      fromAddress,
      fromLat,
      fromLng,
      destination,
      toLat: "--",
      toLng: "--",
      kmDistance: "--"
    });

    tripDetailsSection.insertAdjacentHTML("beforeend", locationRowHTML);

    // Now show vehicle selection
    selectedTripType = "Holiday Tour";
    showVehicleSelectionAfterLocation(window.nodeId, 0, selectedTripType);
  }
}

function handleLiveHourlyRentalNextStep() {
  const input = document.getElementById("hourlyPackageInput");
  const destination = input ? input.value.trim() : "";
  const fromLat = parseFloat(window.nodeLatitude);
  const fromLng = parseFloat(window.nodeLongitude);
  const fromAddress = window.nodeAddress || "Your Node";

  if (!destination) {
    alert("Please select a valid Hourly Rental package.");
    return;
  }

  const kmDistance = "--";
  const toLat = "--";
  const toLng = "--";

  const locationRowHTML = getRowLocationDetails({
    fromAddress,
    fromLat,
    fromLng,
    destination,
    toLat,
    toLng,
    kmDistance
  });

  const tripDetailsSection = document.getElementById("tripDetailsSection");
  if (tripDetailsSection) {
    const existingRow = document.getElementById("rowLocationDetails");
    if (existingRow) existingRow.remove();

    tripDetailsSection.insertAdjacentHTML("beforeend", locationRowHTML);

    // Now show vehicle selection
    selectedTripType = "Hourly Rental";
    showVehicleSelectionAfterLocation(window.nodeId, 0, selectedTripType);
  }
}

// Row 1: Date, Time, Trip Type
const rowDateTimeType = `
  <div class="row mb-3" id="rowDateTimeType">
    <div class="col-md-3">
      <label class="form-label">Current Date</label>
      <h5 class="text-primary fw-bold" id="tripDate">${currentDate}</h5>
    </div>
    <div class="col-md-3">
      <label class="form-label">Current Time</label>
      <h5 class="text-primary fw-bold" id="tripTime">${currentTime}</h5>
    </div>
    <div class="col-md-6">
      <label class="form-label text-primary fw-bold">Trip Type</label>
      <h5 class="text-primary fw-bold" id="tripType">${selectedTripType} (Live)</h5>
      <p class="fw-bold text-muted mb-0" id="tripId">Trip ID: ${tripID}</p>
    </div>
  </div>
`;

// Row 2: From & To Location
function getRowLocationDetails({ fromAddress, fromLat, fromLng, destination, toLat, toLng, kmDistance }) {
  return `
    <div class="row mb-3" id="rowLocationDetails">
      <div class="col-md-4">
        <label class="form-label fw-bold">From (Node)</label>
        <p id="fromAddress">${fromAddress}</p>
        <small id="fromCoords" class="text-muted d-none">Lat: ${fromLat}, Lng: ${fromLng}</small>
      </div>
      <div class="col-md-4">
        <label class="form-label fw-bold">To (Destination)</label>
        <p id="toAddress">${destination}</p>
        <small id="toCoords" class="text-muted d-none">Lat: ${toLat}, Lng: ${toLng}</small>
      </div>
      <div class="col-md-4">
        <label class="form-label fw-bold">Estimated Distance</label>
        <h5 id="estimatedDistance" class="text-success fw-bold">${kmDistance} km</h5>
      </div>
    </div>
  `;
}

// Row 3: Tariff Details
const rowTariffDetails = `
  <div class="row mt-2" id="rowTariffDetails">
    <div class="col-md-3">
      <label class="form-label fw-bold">Terminal Charges</label>
      <h4 class="text-success" id="terminalCharges">₹ --</h4>
    </div>
    <div class="col-md-3">
      <label class="form-label fw-bold">Surcharges</label>
      <h4 class="text-success" id="surcharges">₹ --</h4>
    </div>
    <div class="col-md-3">
      <label class="form-label fw-bold">Tax (%)</label>
      <h4 class="text-success" id="taxPercent">--%</h4>
    </div>
    <div class="col-md-3">
      <label class="form-label fw-bold">Vehicle Tariff</label>
      <h4 class="text-primary fw-bold" id="vehicleTariff">₹ --</h4>
    </div>
  </div>
`;

// Row 4: Charges Adjustments
const rowChargesAdjustments = `
  <div class="row mt-3" id="rowChargesAdjustments">
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
`;

// Row 5: Action Buttons
// const rowActionButtons = `
//   <div class="row mt-4" id="rowActionButtons">
//     <div class="col-md-3 col-sm-6 mb-3">
//       <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button">
//         <i class="mdi mdi-briefcase-outline action-icon"></i>
//         <span class="action-text">Book Business Trip</span>
//       </button>
//     </div>
//     <div class="col-md-3 col-sm-6 mb-3">
//       <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button" onclick="payCashNow()">
//         <i class="mdi mdi-cash action-icon"></i>
//         <span class="action-text">Pay Cash</span>
//       </button>
//     </div>
//     <div class="col-md-3 col-sm-6 mb-3">
//       <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button">
//         <i class="mdi mdi-truck-delivery-outline action-icon"></i>
//         <span class="action-text">Pay Cash on Delivery</span>
//       </button>
//     </div>
//     <div class="col-md-3 col-sm-6 mb-3">
//       <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button" data-bs-toggle="modal" data-bs-target="#razorpayUserModal">
//         <i class="mdi mdi-credit-card-outline action-icon"></i>
//         <span class="action-text">Pay Online / Card</span>
//       </button>
//     </div>
//   </div>
// `;


/*
##########################################################################
                   For Container Elements
##########################################################################
*/





/*
#####################################################################################################
                          Main Code
#####################################################################################################
*/

function setupExclusiveToggle(btn1Id, btn2Id, activeClasses = ["text-white", "bg-primary"], inactiveClasses = ["text-dark", "bg-white"]) {
  const btn1 = document.getElementById(btn1Id);
  const btn2 = document.getElementById(btn2Id);

  function toggle(activeBtn, inactiveBtn) {
    activeBtn.classList.add(...activeClasses);
    activeBtn.classList.remove(...inactiveClasses);

    inactiveBtn.classList.add(...inactiveClasses);
    inactiveBtn.classList.remove(...activeClasses);
  }

  if (btn1 && btn2) {
    btn1.addEventListener("click", () => toggle(btn1, btn2));
    btn2.addEventListener("click", () => toggle(btn2, btn1));
  }
}

function toggleFutureAirportFields(which) {
  const details = document.getElementById("futureAirportDetails");
  const fromBtn = document.getElementById("btnFromAirport");
  const toBtn = document.getElementById("btnToAirport");
  let fromInput = document.getElementById("futureAirportFrom");
  let toInput = document.getElementById("futureAirportTo");

  if (!fromBtn || !toBtn || !fromInput || !toInput) return;

  // Show details section
  details.style.display = "block";

  // 🔄 Swap values
  const temp = fromInput.value;
  fromInput.value = toInput.value;
  toInput.value = temp;

  // 🔘 Button highlight states
  fromBtn.classList.toggle("btn-dark", which === "from");
  fromBtn.classList.toggle("bg-white", which !== "from");
  toBtn.classList.toggle("btn-dark", which === "to");
  toBtn.classList.toggle("bg-white", which !== "to");

  // 📝 Update placeholders
  if (which === "from") {
    fromInput.placeholder = "Select Airport";
    toInput.placeholder = "Enter Drop Location";
    initAirportInputSuggestions("to");
  } else {
    toInput.placeholder = "Select Airport";
    fromInput.placeholder = "Enter Pickup Location";
    initAirportInputSuggestions("from");
  }

  // ❌ Remove old listeners by cloning inputs
  fromInput.replaceWith(fromInput.cloneNode(true));
  toInput.replaceWith(toInput.cloneNode(true));
  fromInput = document.getElementById("futureAirportFrom");
  toInput = document.getElementById("futureAirportTo");

  // ✅ Attach suggestions only on the city-side input
  const cityName = window.selectedCity || window.nodeCityName || "";

  if (which === "from") {
    // From Airport → city suggestions only for TO
    attachLocationSuggestionsCity({
      inputId: "futureAirportTo",
      suggestionsBoxId: "toAirportSuggestionsBox",
      cityName,
      maxResults: 6,
      onSelect(description) {
        toInput.value = description;
        document.getElementById("toAirportSuggestionsBox").innerHTML = "";
        validateRequiredFieldsAndToggleButton();
      }
    });
  } else {
    // To Airport → city suggestions only for FROM
    attachLocationSuggestionsCity({
      inputId: "futureAirportFrom",
      suggestionsBoxId: "fromAirportSuggestionsBox",
      cityName,
      maxResults: 6,
      onSelect(description) {
        fromInput.value = description;
        document.getElementById("fromAirportSuggestionsBox").innerHTML = "";
        validateRequiredFieldsAndToggleButton();
      }
    });
  }

  // ✅ Revalidate after toggle
  if (typeof validateRequiredFieldsAndToggleButton === "function") {
    validateRequiredFieldsAndToggleButton();
  }
}

function toggleOutstationTripType(type) {
  const oneWayBtn = document.getElementById("btnOneWay");
  const roundTripBtn = document.getElementById("btnRoundTrip");
  const messageBox = document.getElementById("outstationTripMessage");

  let details;
  if (selectedTripMode === "live") {
    details = document.getElementById("rowLiveOutstationDestinationSelection");
  } else {
    details = document.getElementById("futureOutstationDetails");
  }

  // Reset styles
  oneWayBtn.classList.remove("text-white", "bg-primary");
  oneWayBtn.classList.add("text-dark", "bg-white");

  roundTripBtn.classList.remove("text-white", "bg-primary");
  roundTripBtn.classList.add("text-dark", "bg-white");

  if (type === 'oneway') {
    oneWayBtn.classList.add("text-white", "bg-primary");
    oneWayBtn.classList.remove("text-dark", "bg-white");

    if (details) details.style.display = "block";
    messageBox.innerHTML = "";
  } else {
    roundTripBtn.classList.add("text-white", "bg-primary");
    roundTripBtn.classList.remove("text-dark", "bg-white");

    if (details) details.style.display = "none";
    messageBox.innerHTML = "Feature Coming Soon...";
  }
}

function toggleFutureRailwayFields(type) {
  const fromBtn = document.getElementById("btnFromRailway");
  const toBtn = document.getElementById("btnToRailway");
  const details = document.getElementById("futureRailwayDetails");
  const fromInput = document.getElementById("futureRailwayFrom");
  const toInput = document.getElementById("futureRailwayTo");

  if (!fromInput || !toInput) return;

  // 🔄 Swap the values of From and To fields
  const tempValue = fromInput.value;
  fromInput.value = toInput.value;
  toInput.value = tempValue;

  // 🎨 Keep your existing styling and placeholder logic
  if (type === 'from') {
    fromBtn.classList.add("text-white", "bg-primary");
    fromBtn.classList.remove("text-dark", "bg-white");
    toBtn.classList.remove("text-white", "bg-primary");
    toBtn.classList.add("text-dark", "bg-white");

    fromInput.placeholder = "Select Railway Station";
    toInput.placeholder = "Enter Drop Location";
  } else {
    toBtn.classList.add("text-white", "bg-primary");
    toBtn.classList.remove("text-dark", "bg-white");
    fromBtn.classList.remove("text-white", "bg-primary");
    fromBtn.classList.add("text-dark", "bg-white");

    toInput.placeholder = "Select Railway Station";
    fromInput.placeholder = "Enter Pickup Location";
  }

  details.style.display = "block";

  // ✅ Revalidate after swap so the Continue button updates
  validateRequiredFieldsAndToggleButton();
}


function clearInput(inputId) {
  const input = document.getElementById(inputId);
  const toAirportSuggestionsBox = document.getElementById("toAirportSuggestionsBox");
  const fromAirportSuggestionsBox = document.getElementById("fromAirportSuggestionsBox");
  if (input) {
    input.value = "";
  }
  // Clear suggestion boxes (keep the element nodes so attach functions still target them)
  [toAirportSuggestionsBox, fromAirportSuggestionsBox].forEach(box => {
    if (box) box.innerHTML = "";
  });

  // Re-run validation (in case some inputs are auto-filled)
  if (typeof validateRequiredFieldsAndToggleButton === "function") {
    validateRequiredFieldsAndToggleButton();
  }
}


function clearDestination() {
  let input;

  if (selectedTripType === "Holiday Tour") {
    input = document.getElementById("holidayPackageInput");
  } else if (selectedTripType === "Hourly Rental") {
    input = document.getElementById("hourlyPackageInput");
  } else {
    input = document.getElementById("destination");
  }

  const nextStepBtn = document.getElementById("nextStepBtn");
  const tripDetailsSection = document.getElementById("tripDetailsSection");
  const destinationSuggestionsBox = document.getElementById("destinationSuggestionsBox");
  const outstationSuggestionsBox = document.getElementById("outstationSuggestionsBox");
  const hourlyPackageSuggestions = document.getElementById("hourlyPackageSuggestions");
  const vehicleTypeSelection = document.getElementById("vehicleTypeSelection");
  const kmSlabSection = document.getElementById("kmSlabSection");

  // Reset input field
  if (input) {
    input.value = "";
    // put cursor back into input so user can type again
    input.focus();
  }

  // Show the Select Location (nextStep) button again and set it to initial disabled state
  if (nextStepBtn) {
    nextStepBtn.style.display = "";   // restore default (empty string lets CSS decide; use "block" if you prefer)
    nextStepBtn.disabled = true;      // keep it disabled until validation passes
  }

  // Remove all children of tripDetailsSection except #rowDateTimeType
  if (tripDetailsSection) {
    [...tripDetailsSection.children].forEach(child => {
      if (child.id !== "rowDateTimeType") {
        child.remove();
      }
    });
  }

  // Clear suggestion boxes (keep the element nodes so attach functions still target them)
  [destinationSuggestionsBox, outstationSuggestionsBox, hourlyPackageSuggestions, vehicleTypeSelection, kmSlabSection].forEach(box => {
    if (box) box.innerHTML = "";
  });

  // Re-run validation (in case some inputs are auto-filled)
  if (typeof validateRequiredFieldsAndToggleButton === "function") {
    validateRequiredFieldsAndToggleButton();
  }
}

function handleSelectLocationClick(buttonId) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.style.display = "none"; // hide the select location button
  }
}

function buildActionButtonsHTML() {
  return `
        <div class="row mt-4" id="rowActionButtons">
            <div class="col-md-3 col-sm-6 mb-3">
                <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button" onclick="showRazorpayModal('Business')">
                    <i class="mdi mdi-briefcase-outline action-icon"></i>
                    <span class="action-text">Book Business Trip</span>
                </button>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button" onclick="showRazorpayModal('Cash')">
                    <i class="mdi mdi-cash action-icon"></i>
                    <span class="action-text">Pay Cash</span>
                </button>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button" onclick="showRazorpayModal('COD')">
                    <i class="mdi mdi-truck-delivery-outline action-icon"></i>
                    <span class="action-text">Pay Cash on Delivery</span>
                </button>
            </div>
            <div class="col-md-3 col-sm-6 mb-3">
                <button class="btn btn-primary w-100 h-100 d-flex align-items-center gap-3 action-button"
                        onclick="showRazorpayModal('Online')">
                    <i class="mdi mdi-credit-card-outline action-icon"></i>
                    <span class="action-text">Pay Online / Card</span>
                </button>
            </div>
        </div>
    `;
}

function buildRazorpayUserModalHTML(type) {
  // If Business → checkbox checked + disabled
  const gstChecked = type === "Business" ? "checked" : "";
  const gstDisabled = type === "Business" ? "disabled" : "";

  return `
<div class="modal fade" id="razorpayUserModal" tabindex="-1" aria-labelledby="razorpayUserModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">

      <div class="modal-header">
        <h5 class="modal-title" id="razorpayUserModalLabel">Enter Customer Details</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body">
        <div class="container-fluid">
          <div class="row">
            <!-- Customer Name -->
            <div class="col-md-6 mb-3">
              <label for="rzp-name" class="form-label fw-bold">Customer Name <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="rzp-name" placeholder="Enter your name" required>
              <small id="error-name" class="text-danger d-none"></small>
            </div>

            <!-- Contact Number -->
            <div class="col-md-6 mb-3">
              <label for="rzp-contact" class="form-label fw-bold">Contact Number <span class="text-danger">*</span></label>
              <input type="tel" class="form-control" id="rzp-contact" placeholder="9876543210" required>
              <small id="error-contact" class="text-danger d-none"></small>
            </div>
          </div>

          <div class="row">
            <!-- Email -->
            <div class="col-md-6 mb-3">
              <label for="rzp-email" class="form-label fw-bold">Email</label>
              <input type="email" class="form-control" id="rzp-email" placeholder="example@domain.com">
              <small id="error-email" class="text-danger d-none"></small>
            </div>

            <!-- GST Toggle -->
            <div class="col-md-6 mb-3 d-flex align-items-end">
              <div>
                <label for="gstToggle" class="form-label fw-bold d-block">Need GST Bill?</label>
                <div class="form-check p-0">
                  <div class="form-switch fs-4">
                    <input class="form-check-input" type="checkbox" id="gstToggle" onchange="toggleGSTFields()" 
                           style="width: 3em; height: 1.5em;" ${gstChecked} ${gstDisabled}>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- GST Fields Section -->
          <div id="gstDetailsSection" style="display: ${type === "Business" ? "block" : "none"};">
            <div class="row">
              <div class="col-md-6 mb-3">
                <label for="gstNumber" class="form-label">GST Number <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="gstNumber" placeholder="22AAAAA0000A1Z5"
                      oninput="this.value = this.value.toUpperCase()">
                <small id="error-gst" class="text-danger d-none"></small>
              </div>
              <div class="col-md-6 mb-3">
                <label for="companyName" class="form-label">Company Name <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="companyName" placeholder="Your Company Name">
                <small id="error-company" class="text-danger d-none"></small>
              </div>
              <div class="col-md-12 mb-3">
                <label for="companyAddress" class="form-label">Company Address <span class="text-danger">*</span></label>
                <textarea class="form-control" id="companyAddress" rows="2" placeholder="Company full address"></textarea>
                <small id="error-address" class="text-danger d-none"></small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer: Button Row -->
      <div class="modal-footer justify-content-end gap-2">
        <button class="btn btn-outline-secondary fw-bold d-flex align-items-center gap-2" data-bs-dismiss="modal">
          <i class="mdi mdi-close-circle-outline fs-5"></i> Cancel
        </button>
        <button onclick="validateAndPay('${type}')" id="payNowBtn"
                class="btn btn-primary fw-bold d-flex align-items-center gap-2">
          <i class="mdi mdi-credit-card-outline fs-5"></i> Pay ₹<span id="payAmountPreview">0.00</span>
        </button>
      </div>

    </div>
  </div>
</div>
    `;
}

function validateAndPay(type) {
  let isValid = true;

  // Clear errors
  document.querySelectorAll("#razorpayUserModal small").forEach(el => {
    el.classList.add("d-none");
    el.textContent = "";
  });

  const name = document.getElementById("rzp-name").value.trim();
  if (!name) { showError("error-name", "Name is required"); isValid = false; }

  const contact = document.getElementById("rzp-contact").value.trim();
  if (!/^[6-9]\d{9}$/.test(contact)) {
    showError("error-contact", "Enter valid Indian mobile number");
    isValid = false;
  }

  const email = document.getElementById("rzp-email").value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showError("error-email", "Enter a valid email (must contain @ and .)");
    isValid = false;
  }

  let gst = "", companyName = "", companyAddress = "";
  if (document.getElementById("gstToggle").checked) {
    gst = document.getElementById("gstNumber").value.trim().toUpperCase();
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z0-9]{1}Z{1}[A-Z0-9]{1}$/.test(gst)) {
      showError("error-gst", "Enter a valid GST number"); isValid = false;
    }
    companyName = document.getElementById("companyName").value.trim();
    if (!companyName) { showError("error-company", "Company name is required"); isValid = false; }

    companyAddress = document.getElementById("companyAddress").value.trim();
    if (!companyAddress) { showError("error-address", "Company address is required"); isValid = false; }
  }

  if (!isValid) return;

  // ✅ Close Razorpay User Modal before proceeding
  const rzpModal = bootstrap.Modal.getInstance(document.getElementById('razorpayUserModal'));
  if (rzpModal) {
    rzpModal.hide();
  }

  // Store form data for later
  bookingFormData = {
    passenger_name: name,
    contact_number: contact,
    email_id: email,
    gst_number: gst,
    company_name: companyName,
    company_address: companyAddress
  };

  console.log('Payment Type:', type);

  if (type === "Online") {
    startRazorpayPayment();
  } else if (type === "Cash") {
    startCashPayment("Cash");
  } else if (type === "Business") {
    startCashPayment("Business");
  } else if (type === "COD") {
    startCashPayment("COD");
  }
}


function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.classList.remove("d-none");
}

function showRazorpayModal(type) {
  // Remove existing modal if already present
  document.getElementById("razorpayUserModal")?.remove();

  // Append modal HTML
  document.body.insertAdjacentHTML("beforeend", buildRazorpayUserModalHTML(type));

  // Fetch total amount from your existing total calculation
  const totalElement = document.getElementById("totalAmountDisplay"); // or whatever your total display ID is
  let totalAmount = 0;
  if (totalElement) {
    const match = totalElement.textContent.match(/([\d.]+)/);
    if (match) {
      totalAmount = parseFloat(match[1]);
    }
  }

  // Update Pay button preview
  document.getElementById("payAmountPreview").textContent = totalAmount.toFixed(2);

  // Show the modal using Bootstrap API
  const modal = new bootstrap.Modal(document.getElementById("razorpayUserModal"));
  modal.show();
}


function startRazorpayPayment() {
  const name = document.getElementById("rzp-name")?.value.trim();
  const email = document.getElementById("rzp-email")?.value.trim();
  const contact = document.getElementById("rzp-contact")?.value.trim();

  // GST details fields
  const companyName = document.getElementById("companyName")?.value.trim() || "";
  const companyAddress = document.getElementById("companyAddress")?.value.trim() || "";
  const gstNumber = document.getElementById("gstNumber")?.value.trim() || "";

  // Trip ID from global var or p tag
  let tripId = generatedTripId;
  if (!tripId) {
    const tripIdElem = document.getElementById("tripId")?.textContent || "";
    tripId = tripIdElem.replace("Trip ID:", "").trim();
  }

  if (!tripId) {
    alert("Trip ID not generated yet.");
    return;
  }

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

  const amountInPaise = Math.round(totalAmount * 100);

  const options = {
    key: "rzp_test_dJ8sSpIyrwQzyf",
    amount: amountInPaise.toString(),
    currency: "INR",
    name: "VANSAT CABS PVT. LTD.",
    description: "Trip Payment",

    handler: function (response) {
      console.log("✅ Payment Successful!", response);

      const tripDate = document.getElementById("tripDate")?.textContent || "";
      const tripTime = document.getElementById("tripTime")?.textContent || "";
      const tripTypeText = document.getElementById("tripType")?.textContent.replace("Trip Type :", "").trim() || "";

      const payload = {
        date: tripDate,
        time: tripTime,
        trip_type: tripTypeText,
        tripId: tripId,

        passenger_name: name,
        contact_number: contact,
        email_id: email,

        from_city: document.getElementById("fromAddress")?.textContent || "-",
        to_city: document.getElementById("toAddress")?.textContent || "-",
        vehicle_type: selectedVehicleType || "-",
        driver_name: "-",
        vehicle_number: "-",
        driver_contact: "-",

        payment_type: "Online",
        base_fare: baseTariff || 0,
        discount: discount || 0,
        terminal_charges: terminal || 0,
        surcharges: surcharge || 0,
        taxes: taxPercent?.toString() || "0",
        total_amount: totalAmount || 0.0,
        payment_status: "Paid",
        extra_charges: {},
        extra_total: extraCharges || 0,

        // GST fields
        company_name: companyName,
        company_address: companyAddress,
        gst_number: gstNumber
      };

      fetch("/save-trip-after-payment/", {
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
            payload.otp = data.otp;
            payload.booking_id = data.booking_id;
            showTripSummaryModal(payload);
            new bootstrap.Modal(document.getElementById('tripSummaryModal')).show();
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

  const modal = bootstrap.Modal.getInstance(document.getElementById('razorpayUserModal'));
  if (modal) modal.hide();

  const rzp = new Razorpay(options);
  rzp.open();
}

function startCashPayment(type) {
  const name = document.getElementById("rzp-name")?.value.trim();
  const email = document.getElementById("rzp-email")?.value.trim();
  const contact = document.getElementById("rzp-contact")?.value.trim();

  const companyName = document.getElementById("companyName")?.value.trim() || "";
  const companyAddress = document.getElementById("companyAddress")?.value.trim() || "";
  const gstNumber = document.getElementById("gstNumber")?.value.trim() || "";

  let tripId = generatedTripId;
  if (!tripId) {
    const tripIdElem = document.getElementById("tripId")?.textContent || "";
    tripId = tripIdElem.replace("Trip ID:", "").trim();
  }

  if (!tripId) {
    alert("Trip ID not generated yet.");
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

  const tripDate = document.getElementById("tripDate")?.textContent || "";
  const tripTime = document.getElementById("tripTime")?.textContent || "";
  const tripTypeText = document.getElementById("tripType")?.textContent.replace("Trip Type :", "").trim() || "";

  // 🔹 Default values
  let paymentType = "-";
  let paymentStatus = "Unpaid";

  if (type === "Cash") {
    paymentType = "Cash";
    paymentStatus = "Paid";
  } else if (type === "COD") {
    paymentType = "COD";
    paymentStatus = "Unpaid";
  } else if (type === "Business") {
    paymentType = "-";
    paymentStatus = "Unpaid";
  }

  const payload = {
    date: tripDate,
    time: tripTime,
    trip_type: tripTypeText,
    tripId: tripId,

    passenger_name: name,
    contact_number: contact,
    email_id: email,

    from_city: document.getElementById("fromAddress")?.textContent || "-",
    to_city: document.getElementById("toAddress")?.textContent || "-",
    vehicle_type: selectedVehicleType || "-",
    driver_name: "-",
    vehicle_number: "-",
    driver_contact: "-",

    payment_type: paymentType,
    base_fare: baseTariff || 0,
    discount: discount || 0,
    terminal_charges: terminal || 0,
    surcharges: surcharge || 0,
    taxes: taxPercent?.toString() || "0",
    total_amount: totalAmount || 0.0,
    payment_status: paymentStatus,
    extra_charges: {},
    extra_total: extraCharges || 0,

    company_name: companyName,
    company_address: companyAddress,
    gst_number: gstNumber
  };

  fetch("/save-trip-after-payment/", {
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
        payload.otp = data.otp;
        payload.booking_id = data.booking_id;
        showTripSummaryModal(payload);
        new bootstrap.Modal(document.getElementById('tripSummaryModal')).show();
      } else {
        alert("Error saving trip: " + data.error);
      }
    })
    .catch(err => {
      console.error("Error during save:", err);
    });
}


// Call before payment
function prepareTripAndPay() {
  // tripId = generateTripId();
  // otp = generateOtp();
  startRazorpayPayment();
}

// // Payment success handler
// function onPaymentSuccess(paymentDetails) {
//     const tripData = {
//         booking_id: tripId,
//         ...bookingFormData, // use stored form data
//         from_city: document.getElementById("fromAddressDisplay")?.textContent || "",
//         to_city: document.getElementById("toAddressDisplay")?.textContent || "",
//         vehicle_type: selectedVehicleType || "",
//         driver_name: "",
//         vehicle_number: "",
//         driver_contact: "",
//         payment_type: "Online",
//         base_fare: baseTariff?.toFixed(2) || "0.00",
//         discount: parseFloat(document.getElementById("discountInput")?.value || 0),
//         terminal_charges: terminal || 0,
//         surcharges: surcharge || 0,
//         taxes: taxPercent + "%",
//         total_amount: parseFloat(document.getElementById("totalAmountDisplay")?.textContent.replace("₹", "") || 0),
//         payment_status: "Paid",
//         extra_charges: {},
//         extra_total: null
//     };

//     fetch("/save-trip-after-payment/", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             "X-CSRFToken": getCSRFToken()
//         },
//         body: JSON.stringify(payload)
//     })
//     .then(res => res.json())
//     .then(data => {
//         if (data.success) {
//             showTripSummaryModal(tripData);
//         } else {
//             alert("Error saving trip: " + data.error);
//         }
//     })
//     .catch(err => console.error("Save trip error:", err));
// }

function getCSRFToken() {
  let csrfToken = null;
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith("csrftoken=")) {
      csrfToken = cookie.substring("csrftoken=".length, cookie.length);
      break;
    }
  }
  return csrfToken;
}

// Show trip summary modal
function showTripSummaryModal(tripData) {
  document.getElementById("tripSummaryModal")?.remove();
  document.body.insertAdjacentHTML("beforeend", buildTripSummaryModalHTML(tripData));
  new bootstrap.Modal(document.getElementById("tripSummaryModal")).show();
}

function buildTripSummaryModalHTML(trip) {
  const hasGstDetails = (trip.gst_number && trip.gst_number.trim()) ||
    (trip.company_name && trip.company_name.trim()) ||
    (trip.company_address && trip.company_address.trim());

  const html = `
    <div class="modal fade" id="tripSummaryModal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          
          <div class="modal-header bg-primary text-white py-2">
            <h5 class="modal-title mb-0">Trip Confirmed - ${trip.booking_id}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>

          <div class="modal-body py-3">
            <div class="row me-2 p-2">
              
              <!-- Left: Trip Details -->
              <div class="col-md-4 pe-2">
                <h6 class="fw-bold mb-1">Trip ID : ${trip.booking_id}</h6>
                
                <h6 class="fw-bold text-primary mb-1 mt-2">Passenger Details</h6>
                <div class="row small">
                  <div class="col-md-6"><p><strong>Name:</strong> ${trip.passenger_name}</p></div>
                  <div class="col-md-6"><p><strong>Contact:</strong> ${trip.contact_number}</p></div>
                  <div class="col-12"><p><strong>Email:</strong> ${trip.email_id}</p></div>
                  ${hasGstDetails ? `
                    ${trip.company_name ? `<div class="col-12"><p><strong>Company Name:</strong> ${trip.company_name}</p></div>` : ""}
                    ${trip.company_address ? `<div class="col-12"><p><strong>Company Address:</strong> ${trip.company_address}</p></div>` : ""}
                    ${trip.gst_number ? `<div class="col-12"><p><strong>GST Number:</strong> ${trip.gst_number}</p></div>` : ""}
                  ` : ""}
                </div>

                <hr class="my-2">
                <h6 class="fw-bold text-primary mb-1">Trip Details</h6>
                <div class="row small">
                  <div class="col-md-6"><p><strong>Date:</strong> ${trip.date}</p></div>
                  <div class="col-md-6"><p><strong>Time:</strong> ${trip.time}</p></div>
                  <div class="col-12"><p><strong>Trip Type:</strong> ${trip.trip_type || "-"}</p></div>
                </div>
                <hr class="my-2">

                <h6 class="fw-bold text-primary mb-1">Route</h6>
                <div class="row small">
                  <div class="col-md-6"><p><strong>From:</strong> ${trip.from_city}</p></div>
                  <div class="col-md-6"><p><strong>To:</strong> ${trip.to_city}</p></div>
                </div>
                <hr class="my-2">

                <h6 class="fw-bold text-primary mb-1">Vehicle & Driver</h6>
                <div id="driverDetails" class="row small">
                  <div class="col-md-6">
                    <p><strong>Vehicle Type:</strong> ${trip.vehicle_type}</p>
                    <p><strong>Vehicle No.:</strong> ${trip.vehicle_number || "-"}</p>
                  </div>
                  <div class="col-md-6">
                    <p><strong>Driver:</strong> ${trip.driver_name || "-"}</p>
                    <p><strong>Driver Contact:</strong> ${trip.driver_contact || "-"}</p>
                  </div>
                </div>

                <hr class="my-2">
                <h6 class="fw-bold text-primary mb-1">Payment Details</h6>
                <div class="row small">
                  <div class="col-md-6">
                    <p><strong>Type:</strong> ${trip.payment_type}</p>
                    <p><strong>Payment Status:</strong> ${trip.payment_status}</p>
                  </div>
                  <div class="col-md-6">
                    <div class="row small">
                      <div class="col-md-8">
                        <p><strong>Base Fare:</strong></p>
                        <p><strong>Discount:</strong></p>
                        <p><strong>Terminal Charges:</strong></p>
                        <p><strong>Surcharges:</strong></p>
                        <p><strong>Taxes:</strong></p>
                      </div> 
                      <div class="col-md-4">
                        <p>₹${parseInt(trip.base_fare)}</p>
                        <p>₹${trip.discount}</p>
                        <p>₹${trip.terminal_charges}</p>
                        <p>₹${trip.surcharges}</p>
                        <p>${trip.taxes}%</p>
                      </div> 
                    </div>
                  </div>
                </div>
                <hr class="my-2">

                <h5 class="fw-bold text-primary text-center mb-2">Total Amount : ₹${trip.total_amount}</h5>
                <hr class="my-2">
                <h6 class="text-center"><strong>OTP:</strong> ${trip.otp}</h6>
                <hr class="my-2">
              </div>

              <!-- Right: Driver Search -->
              <div class="col-md-8">
                <h6 class="fw-bold text-primary mb-1">Assign Driver</h6>
                <div class="input-group">
                  <input type="text" id="driverSearch" class="form-control" placeholder="Search driver by name or vehicle number">
                  <button class="btn btn-outline-secondary" type="button" id="clearDriverSearch"><i class="mdi mdi-close-circle-outline text-danger"
                    style="font-size: 20px; cursor: pointer;"></i>
                  </button>
                </div>
                <div id="driverSuggestions" class="list-group mt-2"></div>
              </div>
              <!-- Footer -->
              <div class="modal-footer">
                  <button type="button" class="btn btn-primary" id="saveTripBtn" disabled>
                  <i class="mdi mdi-content-save me-2"></i> Save Trip</button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
    `;

  document.body.insertAdjacentHTML("beforeend", html);

  function loadDriverSuggestions(vehicleType, searchTerm = "") {
    fetch(`/get-available-drivers/?vehicle_type=${encodeURIComponent(vehicleType)}&search=${encodeURIComponent(searchTerm)}`)
      .then(res => res.json())
      .then(drivers => {
        const suggestionsBox = document.getElementById("driverSuggestions");
        suggestionsBox.innerHTML = "";

        if (!drivers || drivers.length === 0) {
          suggestionsBox.innerHTML = `<p class="text-muted">No drivers found</p>`;
          toggleSaveButtons(true); // ✅ Enable if no driver suggestions
          return;
        }

        let html = `<div class="row g-2">`;
        let addedDrivers = 0;

        drivers.forEach((driver, index) => {
          const searchLower = searchTerm.toLowerCase();
          const driverName = `${driver.driverfirstname} ${driver.driverlastname}`.toLowerCase();
          const vehicleNumber = (driver.vehicle_number || "").toLowerCase();

          // Filter by search term
          if (searchTerm &&
            !driverName.includes(searchLower) &&
            !vehicleNumber.includes(searchLower)) {
            return;
          }

          addedDrivers++;

          html += `
                    <div class="col-3">
                        <button class="btn btn-outline-primary w-100 d-flex align-items-center driver-btn" 
                            data-name="${driver.driverfirstname} ${driver.driverlastname}" 
                            data-contact="${driver.drivermobileno}" 
                            data-vehicleno="${driver.vehicle_number || "-"}"
                            style="height: 100%;">
                            
                            <i class="mdi mdi-account-circle me-2" style="font-size: 2.5rem;"></i>
                            <div class="text-start">
                                <div class="fw-bold">${driver.driverfirstname} ${driver.driverlastname}</div>
                                <small class="text-muted">${driver.vehicle_number || "-"}</small>
                            </div>
                        </button>
                    </div>
                `;

          if ((index + 1) % 4 === 0) {
            html += `</div><div class="row g-2">`;
          }
        });

        html += `</div>`;
        suggestionsBox.innerHTML = html;

        // ✅ Enable if there are no driver buttons in filtered results
        toggleSaveButtons(addedDrivers === 0);

        // Attach click event for each driver button
        suggestionsBox.querySelectorAll(".driver-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            document.getElementById("driverSearch").value = btn.dataset.name;

            document.querySelector("#driverDetails .col-md-6:nth-child(1) p:nth-child(2)").innerHTML = `<strong>Vehicle No.:</strong> ${btn.dataset.vehicleno}`;
            document.querySelector("#driverDetails .col-md-6:nth-child(2) p:nth-child(1)").innerHTML = `<strong>Driver:</strong> ${btn.dataset.name}`;
            document.querySelector("#driverDetails .col-md-6:nth-child(2) p:nth-child(2)").innerHTML = `<strong>Driver Contact:</strong> ${btn.dataset.contact}`;

            toggleSaveButtons(true); // ✅ Enable after selection
            suggestionsBox.innerHTML = "";
          });
        });
      })
      .catch(err => console.error("Error fetching drivers:", err));
  }

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + "=")) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Reference buttons
  const saveTripBtn = document.getElementById("saveTripBtn");

  // Helper function to enable/disable save buttons
  function toggleSaveButtons(enable) {
    saveTripBtn.disabled = !enable;
  }

  // Search input listener
  const driverSearchInput = document.getElementById("driverSearch");
  driverSearchInput.addEventListener("input", () => {
    loadDriverSuggestions(trip.vehicle_type, driverSearchInput.value.trim());
  });

  // Clear button listener
  document.getElementById("clearDriverSearch").addEventListener("click", () => {
    driverSearchInput.value = "";
    loadDriverSuggestions(trip.vehicle_type, ""); // Reload all drivers

    // Reset driver details to "-"
    document.querySelector("#driverDetails .col-md-6:nth-child(1) p:nth-child(2)").innerHTML = "<strong>Vehicle No.:</strong> -";
    document.querySelector("#driverDetails .col-md-6:nth-child(2) p:nth-child(1)").innerHTML = "<strong>Driver:</strong> -";
    document.querySelector("#driverDetails .col-md-6:nth-child(2) p:nth-child(2)").innerHTML = "<strong>Driver Contact:</strong> -";

    toggleSaveButtons(false); // ❌ Disable save buttons
  });

  document.getElementById("saveTripBtn").addEventListener("click", function () {
    const tripId = trip.booking_id; // from your modal trip object
    const driverName = document.querySelector("#driverDetails .col-md-6:nth-child(2) p:nth-child(1)").textContent.replace("Driver:", "").trim();
    const driverContact = document.querySelector("#driverDetails .col-md-6:nth-child(2) p:nth-child(2)").textContent.replace("Driver Contact:", "").trim();
    const vehicleNo = document.querySelector("#driverDetails .col-md-6:nth-child(1) p:nth-child(2)").textContent.replace("Vehicle No.:", "").trim();

    console.log(tripId);
    if (driverName === "-" || driverContact === "-" || vehicleNo === "-") {
      alert("Please select a driver before saving.");
      return;
    }

    fetch("/update-trip-driver/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken")
      },
      body: JSON.stringify({
        trip_id: tripId,
        driver_name: driverName,
        driver_contact: driverContact,
        vehicle_number: vehicleNo
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          alert("Driver assigned successfully!");
          fetchTripDetails(tripId);
          // printTripReceipt(tripId)

          // Close the existing Trip Summary modal
          const summaryModalEl = document.getElementById("tripSummaryModal");
          const summaryModal = bootstrap.Modal.getInstance(summaryModalEl);
          if (summaryModal) {
            document.activeElement.blur(); // prevent aria-hidden focus issue
            summaryModal.hide();
          }

          // Create small centered modal if it doesn't exist
          if (!document.getElementById("printReceiptModal")) {
            const printModalHTML = `
                    <div class="modal fade" id="printReceiptModal" tabindex="-1" aria-hidden="true" 
                        data-bs-backdrop="static" data-bs-keyboard="false">
                      <div class="modal-dialog modal-dialog-centered modal-md">
                        <div class="modal-content">

                          <div class="modal-header bg-primary text-white py-2">
                            <h5 class="modal-title mb-0">Print Receipt</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close" id="closeModalBtn"></button>
                          </div>

                          <div class="modal-body py-3" style="max-height: 300px; overflow-y: auto;">
                            <div id="receiptTripDetails" class="small">
                              <!-- Trip details will be filled dynamically -->
                            </div>
                          </div>

                          <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-outline-primary" id="printReceiptBtn">Print</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="closeModalBtnFooter">Close</button>
                          </div>

                        </div>
                      </div>
                    </div>`;
            document.body.insertAdjacentHTML("beforeend", printModalHTML);
          }

          // Print Receipt
          document.getElementById("printReceiptBtn").addEventListener("click", function () {
            printTripReceipt();
          });

          // CLOSE buttons
          document.getElementById("closeModalBtn").onclick = function () {
            location.reload();
          };
          document.getElementById("closeModalBtnFooter").onclick = function () {
            location.reload();
          };



          // Show modal
          const printModal = new bootstrap.Modal(document.getElementById("printReceiptModal"));
          printModal.show();
        }
      })
      .catch(err => console.error("Error updating trip:", err));
  });

  // Initial load
  loadDriverSuggestions(trip.vehicle_type);
  toggleSaveButtons(false); // Make sure they're disabled on modal open
}

function fetchTripDetails(tripId) {
  console.log("Fetching Trip ID:", tripId);
  fetch(`/get_trip_details/${tripId}/`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch trip details");
      return response.json();
    })
    .then(updatedTrip => {
      // Build receipt HTML (same as before but without print logic)
      lastFetchedTripHTML = `
        <div style="text-align: center; margin-bottom: 3px;">
          <img src="${logoUrl}" alt="Company Logo" style="height: 50px;">
          <h4 style="margin: 2px 0; font-weight: bold;">Vansat Cabs Pvt. Ltd.</h4>
          <p style="margin: 0;">${window.nodeAddress}</p>
          <p style="margin: 0;">Ph: 7262-025-025 / 7263-025-025</p>
          <p style="margin: 0;">www.vansatcabs.com</p>
          <p style="margin: 0;">GSTIN : 27ARBPG2111L1Z6 </p>
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="fw-bold">Trip ID : ${updatedTrip.booking_id}</h6>
        <h6 class="fw-bold text-primary">Passenger Details</h6>
        <div class="row small">
          <div class="col-6"><p><strong>Name:</strong> ${updatedTrip.passenger_name}</p></div>
          <div class="col-6"><p><strong>Contact:</strong> ${updatedTrip.contact_number}</p></div>
          <div class="col-12"><p><strong>Email:</strong> ${updatedTrip.email_id}</p></div>
          ${updatedTrip.company_name ? `<div class="col-12"><p><strong>Company Name:</strong> ${updatedTrip.company_name}</p></div>` : ""}
          ${updatedTrip.company_address ? `<div class="col-12"><p><strong>Company Address:</strong> ${updatedTrip.company_address}</p></div>` : ""}
          ${updatedTrip.gst_number ? `<div class="col-12"><p><strong>GST Number:</strong> ${updatedTrip.gst_number}</p></div>` : ""}
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="fw-bold text-primary">Trip Details</h6>
        <div class="row small">
          <div class="col-6"><p><strong>Date:</strong> ${updatedTrip.date}</p></div>
          <div class="col-6"><p><strong>Time:</strong> ${updatedTrip.time}</p></div>
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="fw-bold text-primary">Route</h6>
        <div class="row small">
          <div class="col-6"><p><strong>From:</strong> ${updatedTrip.from_city}</p></div>
          <div class="col-6"><p><strong>To:</strong> ${updatedTrip.to_city}</p></div>
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="fw-bold text-primary">Vehicle & Driver</h6>
        <div class="row small">
          <div class="col-6">
            <p><strong>Vehicle Type:</strong> ${updatedTrip.vehicle_type}</p>
            <p><strong>Vehicle No.:</strong> ${updatedTrip.vehicle_number || "-"}</p>
          </div>
          <div class="col-6">
            <p><strong>Driver:</strong> ${updatedTrip.driver_name || "-"}</p>
            <p><strong>Driver Contact:</strong> ${updatedTrip.driver_contact || "-"}</p>
          </div>
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="fw-bold text-primary">Payment Details</h6>
        <div class="row small">
          <div class="col-4">
            <p><strong>Type:</strong> ${updatedTrip.payment_type}</p>
            <p><strong>Payment Status:</strong> ${updatedTrip.payment_status}</p>
          </div>
          <div class="col-5">
            <p><strong>Base Fare:</strong></p>
            <p><strong>Discount:</strong></p>
            <p><strong>Terminal Charges:</strong></p>
            <p><strong>Surcharges:</strong></p>
            <p><strong>Taxes:</strong></p>
          </div> 
          <div class="col-3">
            <p>₹${parseInt(updatedTrip.base_fare)}</p>
            <p>₹${updatedTrip.discount}</p>
            <p>₹${updatedTrip.terminal_charges}</p>
            <p>₹${updatedTrip.surcharges}</p>
            <p>${updatedTrip.taxes}%</p>
          </div> 
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h5 class="fw-bold text-primary text-center">Total Amount : ₹${updatedTrip.total_amount}</h5>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="text-center"><strong>OTP:</strong> ${updatedTrip.otp}</h6>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
      `;

      // Show in the modal/container
      document.getElementById("receiptTripDetails").innerHTML = lastFetchedTripHTML;
    })
    .catch(err => {
      console.error("Error fetching trip details:", err);
      alert("Unable to fetch latest trip details.");
    });
}

function fetchTripDetails(tripId) {
  console.log("Fetching Trip ID:", tripId);
  fetch(`/get_trip_details/${tripId}/`)
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch trip details");
      return response.json();
    })
    .then(updatedTrip => {
      // Build receipt HTML (same as before but without print logic)
      lastFetchedTripHTML = `
        <div style="text-align: center; margin-bottom: 3px;">
          <img src="${logoUrl}" alt="Company Logo" style="height: 50px;">
          <h4 style="margin: 2px 0; font-weight: bold;">Vansat Cabs Pvt. Ltd.</h4>
          <p style="margin: 0;">${window.nodeAddress}</p>
          <p style="margin: 0;">Ph: 7262-025-025 / 7263-025-025</p>
          <p style="margin: 0;">www.vansatcabs.com</p>
          <p style="margin: 0;">GSTIN : 27ARBPG2111L1Z6 </p>
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="fw-bold">Trip ID : ${updatedTrip.booking_id}</h6>
        <h6 class="fw-bold text-primary">Passenger Details</h6>
        <div class="row small">
          <div class="col-6"><p><strong>Name:</strong> ${updatedTrip.passenger_name}</p></div>
          <div class="col-6"><p><strong>Contact:</strong> ${updatedTrip.contact_number}</p></div>
          <div class="col-12"><p><strong>Email:</strong> ${updatedTrip.email_id}</p></div>
          ${updatedTrip.company_name ? `<div class="col-12"><p><strong>Company Name:</strong> ${updatedTrip.company_name}</p></div>` : ""}
          ${updatedTrip.company_address ? `<div class="col-12"><p><strong>Company Address:</strong> ${updatedTrip.company_address}</p></div>` : ""}
          ${updatedTrip.gst_number ? `<div class="col-12"><p><strong>GST Number:</strong> ${updatedTrip.gst_number}</p></div>` : ""}
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="fw-bold text-primary">Trip Details</h6>
        <div class="row small">
          <div class="col-6"><p><strong>Date:</strong> ${updatedTrip.date}</p></div>
          <div class="col-6"><p><strong>Time:</strong> ${updatedTrip.time}</p></div>
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="fw-bold text-primary">Route</h6>
        <div class="row small">
          <div class="col-6"><p><strong>From:</strong> ${updatedTrip.from_city}</p></div>
          <div class="col-6"><p><strong>To:</strong> ${updatedTrip.to_city}</p></div>
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="fw-bold text-primary">Vehicle & Driver</h6>
        <div class="row small">
          <div class="col-6">
            <p><strong>Vehicle Type:</strong> ${updatedTrip.vehicle_type}</p>
            <p><strong>Vehicle No.:</strong> ${updatedTrip.vehicle_number || "-"}</p>
          </div>
          <div class="col-6">
            <p><strong>Driver:</strong> ${updatedTrip.driver_name || "-"}</p>
            <p><strong>Driver Contact:</strong> ${updatedTrip.driver_contact || "-"}</p>
          </div>
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="fw-bold text-primary">Payment Details</h6>
        <div class="row small">
          <div class="col-4">
            <p><strong>Type:</strong> ${updatedTrip.payment_type}</p>
            <p><strong>Payment Status:</strong> ${updatedTrip.payment_status}</p>
          </div>
          <div class="col-5">
            <p><strong>Base Fare:</strong></p>
            <p><strong>Discount:</strong></p>
            <p><strong>Terminal Charges:</strong></p>
            <p><strong>Surcharges:</strong></p>
            <p><strong>Taxes:</strong></p>
          </div> 
          <div class="col-3">
            <p>₹${parseInt(updatedTrip.base_fare)}</p>
            <p>₹${updatedTrip.discount}</p>
            <p>₹${updatedTrip.terminal_charges}</p>
            <p>₹${updatedTrip.surcharges}</p>
            <p>${updatedTrip.taxes}%</p>
          </div> 
        </div>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h5 class="fw-bold text-primary text-center">Total Amount : ₹${updatedTrip.total_amount}</h5>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
        <h6 class="text-center"><strong>OTP:</strong> ${updatedTrip.otp}</h6>
        <p style="font-family: monospace; text-align: center;">--------------------------------------------</p>
      `;

      // Show in the modal/container
      document.getElementById("receiptTripDetails").innerHTML = lastFetchedTripHTML;
    })
    .catch(err => {
      console.error("Error fetching trip details:", err);
      alert("Unable to fetch latest trip details.");
    });
}

function printTripReceipt() {
  if (!lastFetchedTripHTML) {
    alert("No trip details available to print.");
    return;
  }

  const printWindow = window.open("", "_blank", "width=800,height=900");
  printWindow.document.write(`
    <html>
    <head>
        <title>Trip Receipt</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700&display=swap" rel="stylesheet">
        <style>
          @page {
              size: 80mm auto;
              margin: 0;
          }
          html, body {
              width: 80mm;
              margin: 0 !important;
              padding-right: 9px !important;
              font-family: "MS Reference Sans Serif", sans-serif;
              font-weight: bold;
              font-size: 10px;
              letter-spacing: 0.8px;
              color: black;
          }
          h5, h6 {
              font-weight: bold;
              margin: 0;
              padding: 0;
              text-align: center;
          }
          p { margin: 0; padding: 0; }
          .container-fluid, .row, .col-6, .col-12 {
              padding: 0 !important;
              margin: 0 !important;
          }
        </style>
    </head>
    <body>
        <div class="container-fluid">
          ${lastFetchedTripHTML}
        </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.onload = function () {
    printWindow.print();
    printWindow.close();
  };
}

function calculateDistance(fromInputId, toInputId) {
  const from = document.getElementById(fromInputId).value;
  const to = document.getElementById(toInputId).value;

  if (!from || !to) return;

  const service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [from],
      destinations: [to],
      travelMode: google.maps.TravelMode.DRIVING
    },
    (response, status) => {
      if (status === "OK") {
        const element = response.rows[0].elements[0];
        if (element.status === "OK") {
          const distanceText = element.distance.text;
          const durationText = element.duration.text;

          console.log("✅ Distance:", distanceText, "Duration:", durationText);

          const estimatedBox = document.getElementById("estimatedDistance");
          if (estimatedBox) {
            estimatedBox.innerText = `Estimated Distance: ${distanceText} (Approx. ${durationText})`;
          }
        }
      } else {
        console.error("DistanceMatrix failed:", status);
      }
    }
  );
}