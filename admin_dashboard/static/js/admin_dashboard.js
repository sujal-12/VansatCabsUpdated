 // Get today's date
 const today = new Date();
 const yyyy = today.getFullYear();
 const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
 const dd = String(today.getDate()).padStart(2, '0');

 const formattedDate = `${yyyy}-${mm}-${dd}`; // format for input[type="date"]

 // Set the value to the input
 document.getElementById('today').value = formattedDate;