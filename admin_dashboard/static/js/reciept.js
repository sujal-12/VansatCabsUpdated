
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
  '#customerName, #customerContact,#customerEmail, ' +
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
             updateReceipt(gatherReceiptData());
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


