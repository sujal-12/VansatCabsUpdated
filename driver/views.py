import json
import csv
import os
import io
from django.shortcuts import render, redirect,get_object_or_404
from .decorators import driver_login_required
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.db import models  # ✅ Add this line
from .models import DriverRegistration,DriverRemark
from admin_dashboard.models import Node,Trip, TripLocation
from django.http import HttpResponse
from django.core.files.storage import FileSystemStorage
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from decimal import Decimal
from datetime import timedelta, datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepInFrame
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import mm
from django.contrib.staticfiles.finders import find
from django.utils import timezone  # <--- NEW IMPORT


def driver_register(request):
    cities = Node.objects.all()

    if request.method == "POST":
        vehicle_number = request.POST.get('vehicleNumber')  
        vehicle_name = request.POST.get('vehicleName') # Corrected: 'vehicleName' to match HTML field name
        driverfirstname = request.POST.get('driverfirstname')
        driverlastname = request.POST.get('driverlastname')
        drivermobileno = request.POST.get('drivermobileno')
        driverpassword = request.POST.get('driverpassword')
        confirm_password = request.POST.get('driverconfirmpassword')
        city_id = request.POST.get('city') # Renamed to city_id to avoid conflict with node object

        # Validate city selection
        try:
            node = Node.objects.get(nodeID=city_id) # Use city_id to get the Node object
        except Node.DoesNotExist:
            messages.error(request, "Selected city is invalid.")
            return render(request, "driver_register.html", {"cities": cities})

        # Check if passwords match
        if driverpassword != confirm_password:
            messages.error(request, "Passwords do not match.")
            return render(request, "driver_register.html", {"cities": cities})

        # Check for existing driver by mobile number
        if DriverRegistration.objects.filter(drivermobileno=drivermobileno).exists():
            messages.error(request, "A driver with this mobile number is already registered.") # Clarified message
            return render(request, "driver_register.html", {"cities": cities})

        # Check for existing driver by vehicle number
        if DriverRegistration.objects.filter(vehicle_number=vehicle_number).exists():
            messages.error(request, "A vehicle with this Vehicle Number is already registered.") # Clarified message
            return render(request, "driver_register.html", {"cities": cities})

        # Create a new driver with is_approved set to False
        driver = DriverRegistration(
            node=node,
            vehicle_number=vehicle_number,
            vehicle_name=vehicle_name, # Added vehicle_name
            driverfirstname=driverfirstname,
            driverlastname=driverlastname,
            drivermobileno=drivermobileno,
            driverpassword=driverpassword,
            is_approved=False,  # Driver is not approved initially
        )
        driver.save()
        messages.success(request, "Driver registered successfully. Awaiting approval.")
        return redirect('driver_login')

    return render(request, "driver_register.html", {"cities": cities})


def driver_login(request):
    if request.method == "POST":
        drivermobileno = request.POST.get('driverloginnumber')
        driverpassword = request.POST.get('driverloginpassword')

        try:
            driver = DriverRegistration.objects.get(drivermobileno=drivermobileno)
            if driver.driverpassword == driverpassword:
                if not driver.is_approved:
                    messages.error(request, "Your account is pending approval. Please wait for admin approval.")
                    return redirect('driver_login')  # Redirect back to login if pending

                request.session['driver_id'] = driver.id  # Store session
                messages.success(request, "Login successful.")

                # === Add Remark Logic Here ===
                now = timezone.now()
                today_str = now.date()
                session_counter_key = f'remark_count_{driver.id}_{today_str}'
                five_days_ago = now - timedelta(days=5)

                recent_remarks = driver.remarks.filter(created_at__gte=five_days_ago).order_by('-created_at')

                show_count = request.session.get(session_counter_key, 0)
                if recent_remarks.exists() and show_count < 3:
                    latest_remark = recent_remarks.first()
                    messages.warning(request, f"Admin Remark: {latest_remark.remark_text}")
                    request.session[session_counter_key] = show_count + 1

                # === Continue with existing redirection logic ===
                ongoing_trip_exists = Trip.objects.filter(
                    driver_contact=driver.drivermobileno,
                    status='Ongoing'
                ).exists()

                if ongoing_trip_exists:
                    return redirect('complete_trip')

                if driver.is_profile_complete:
                    return redirect('mobileapp')
                else:
                    return redirect('driver_slider')

            else:
                messages.error(request, "Invalid password.")
        except DriverRegistration.DoesNotExist:
            messages.error(request, "Mobile number not registered.")

    return render(request, "driver_login.html")


@driver_login_required
def mobileapp(request):
    driver_id = request.session.get('driver_id')
    if driver_id:
        try:
            driver = DriverRegistration.objects.get(id=driver_id)
            today = timezone.now().date()

            # Remarks Check
            five_days_ago = timezone.now() - timedelta(days=5)
            recent_remarks = driver.remarks.filter(created_at__gte=five_days_ago).order_by('-created_at')
            session_counter_key = f'remark_count_{driver_id}_{today}'

            if recent_remarks.exists() and driver.is_active:
                if driver.is_active:
                    driver.is_active = False
                    driver.save()
                    messages.error(request, "Your account has been deactivated due to unresolved remarks.")
                    return redirect('driver_login')
            
            show_count = request.session.get(session_counter_key, 0)
            if recent_remarks.exists() and show_count < 3:
                latest_remark = recent_remarks.first()
                messages.warning(request, f"Admin Remark: {latest_remark.remark_text}")
                request.session[session_counter_key] = show_count + 1

            # Expiry Check
            expiry_fields = {
                'Registration Expiry': driver.registration_expiry_date,
                'Insurance Expiry': driver.insurance_expiry_date,
                'Fitness Certificate Expiry': driver.fitness_certificate_expiry_date
            }
            expiry_warning_key = f'expiry_warning_shown_{driver_id}_{today}'

            for label, date_field in expiry_fields.items():
                if date_field:
                    days_left = (date_field - today).days
                    if 0 <= days_left <= 5:
                        if not request.session.get(expiry_warning_key, False):
                            messages.warning(request, f"{label} is expiring in {days_left} day(s). Please update it.")
                            request.session[expiry_warning_key] = True
                    elif date_field < today:
                        if driver.is_active:
                            driver.is_active = False
                            driver.save()
                        messages.error(request, f"Your account has been deactivated due to expired {label.lower()}.")
                        return redirect('driver_login')

            # Fetch all trips for today
            todays_trips = Trip.objects.filter(
                driver_contact=driver.drivermobileno,
                date=today
            )

            # Separate trips by status for today's metrics
            today_completed_trips = todays_trips.filter(status='Completed')
            today_pending_trips = todays_trips.filter(status='Pending')
            today_cancelled_trips = todays_trips.filter(status='Cancelled')

            # Aggregate today's earnings
            today_total_earnings = today_completed_trips.aggregate(
                total=models.Sum('driver_commission')
            )['total'] or 0
            
            today_total_earnings = round(today_total_earnings)
            
            today_trip_count = today_completed_trips.count()
            today_pending_count = today_pending_trips.count()
            today_cancelled_count = today_cancelled_trips.count()

            # Fetch all upcoming trips (not completed or cancelled) for the 'New Upcoming Ride' section
            assigned_trips = Trip.objects.filter(
                driver_contact=driver.drivermobileno,
                status__in=['Pending', 'Ongoing']
            ).exclude(status__in=['Completed', 'Cancelled']).order_by('date', 'time')

            # Fetch notifications for the modal
            pending_trips_modal = todays_trips.filter(status='Pending').order_by('-created_at')
            cancelled_trips_modal = todays_trips.filter(status='Cancelled').order_by('-created_at')
            remarks_today = DriverRemark.objects.filter(
                driver=driver,
                created_at__date=today
            ).order_by('-created_at')

            context = {
                'driver': driver,
                'assigned_trips': assigned_trips,
                'is_active': driver.is_active,
                'today_total_earnings': today_total_earnings,
                'today_trip_count': today_trip_count,
                'today_pending_count': today_pending_count,
                'today_cancelled_count': today_cancelled_count,
                'pending_trips': pending_trips_modal,
                'cancelled_trips': cancelled_trips_modal,
                'remarks': remarks_today,
            }
            return render(request, "mobileapp.html", context)

        except DriverRegistration.DoesNotExist:
            messages.error(request, "Driver not found.")
            return redirect('driver_login')
    else:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')

@csrf_exempt
@driver_login_required
def toggle_driver_status(request):
    if request.method == "POST":
        driver_id = request.session.get('driver_id')
        try:
            driver = DriverRegistration.objects.get(id=driver_id)
            driver.is_active = not driver.is_active
            driver.save()
            return JsonResponse({"status": "success", "is_active": driver.is_active})
        except DriverRegistration.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Driver not found."})
    return JsonResponse({"status": "error", "message": "Invalid request."})


@driver_login_required
def driver_profile(request):
    # Fetch the logged-in driver's information using the session ID
    driver_id = request.session.get('driver_id')
    if driver_id:
        try:
            driver = DriverRegistration.objects.get(id=driver_id)
            return render(request, 'driver_profile.html', {'driver': driver})
        except DriverRegistration.DoesNotExist:
            messages.error(request, "Driver not found.")
            return redirect('driver_login')
    else:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')
    
    
@driver_login_required
def vehicle_details(request):
    # Fetch the logged-in driver's information using the session ID
    driver_id = request.session.get('driver_id')
    if driver_id:
        try:
            driver = DriverRegistration.objects.get(id=driver_id)
            return render(request, 'vehicle_details.html', {'driver': driver})
        except DriverRegistration.DoesNotExist:
            messages.error(request, "Driver not found.")
            return redirect('driver_login')
    else:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')
    
    
@driver_login_required
def driver_slider(request):
    driver_id = request.session.get('driver_id')
    if not driver_id:
        messages.error(request, "You must be logged in to update your details.")
        return redirect('driver_login')

    driver = get_object_or_404(DriverRegistration, id=driver_id)

    # If profile is complete, redirect to mobile app
    if driver.is_profile_complete:
        return redirect('mobileapp')

    # Ensure the driver remains inactive until profile completion
    driver.is_active = False  # Set inactive when entering slider
    driver.save(update_fields=["is_active"])

    if request.method == 'POST':
        # Vehicle Info (excluding vehicle_number)
        driver.registration_date = request.POST.get('registrationDate')
        driver.registration_expiry_date = request.POST.get('registrationExpiryDate')
        driver.insurance_start_date = request.POST.get('insuranceStartDate')
        driver.insurance_expiry_date = request.POST.get('insuranceExpiryDate')
        driver.fitness_certificate_date = request.POST.get('fitnessCertificateDate')
        driver.fitness_certificate_expiry_date = request.POST.get('fitnessCertificateExpiryDate')

        # Driver Info
        driver.driveraddress = request.POST.get('driverAddress')
        driver.driverpincode = request.POST.get('driverPincode')
        driver.driverstate = request.POST.get('driverState')
        driver.drivercity = request.POST.get('driverCity')
        driver.driverlicense_number = request.POST.get('driverLicenseNumber')
        driver.driver_aadhar_number = request.POST.get('driverAadharNumber')
        driver.driverbank_name = request.POST.get('driverBankName')
        driver.driveraccount_number = request.POST.get('driverAccountNumber')
        driver.driverbranch_name = request.POST.get('driverBranchName')
        driver.driverifsc_code = request.POST.get('driverBankIFSCCode')

        # Image/File Uploads
        if request.FILES.get('driverProfilePicture'):
            driver.profile_picture = request.FILES['driverProfilePicture']
        if request.FILES.get('driverLicensePictureUpload'):
            driver.license_picture = request.FILES['driverLicensePictureUpload']
        if request.FILES.get('driverAadharPictureUpload'):
            driver.aadhar_picture = request.FILES['driverAadharPictureUpload']
        if request.FILES.get('vehicleTaxReceiptUpload'):
            driver.vehicle_tax_receipt = request.FILES['vehicleTaxReceiptUpload']
        if request.FILES.get('vehicleInsuranceUpload'):
            driver.vehicle_insurance = request.FILES['vehicleInsuranceUpload']
        if request.FILES.get('vehicleFitnessCertificateUpload'):
            driver.fitness_certificate = request.FILES['vehicleFitnessCertificateUpload']
        if request.FILES.get('vehiclePUCCertificateUpload'):
            driver.puc_certificate = request.FILES['vehiclePUCCertificateUpload']

        # Mark profile complete and activate the driver
        driver.is_profile_complete = True
        driver.is_active = True  # Activate only after completing profile
        driver.save()

        messages.success(request, 'Driver profile updated successfully!')
        return redirect('mobileapp')

    return render(request, 'driver_slider.html', {'driver': driver})


@driver_login_required
def driver_logout(request):
    if 'driver_id' in request.session:
        del request.session['driver_id']
        messages.success(request, "You have been logged out successfully.")
    return redirect('driver_login')


@driver_login_required
@csrf_exempt
def verify_trip_otp(request, trip_id):
    trip = get_object_or_404(Trip, booking_id=trip_id)
    context = {'trip_id': trip_id}

    if request.method == 'POST':
        # Concatenate the OTP digits from the five input fields
        input_otp = (
            request.POST.get('otp1', '') +
            request.POST.get('otp2', '') +
            request.POST.get('otp3', '') +
            request.POST.get('otp4', '') +
            request.POST.get('otp5', '')
        )

        if trip.otp == input_otp:
            trip.otp_verified = True
            trip.save()
            request.session['verified_trip_id'] = trip.booking_id
            return redirect('start_trip')
        else:
            context['message'] = "Invalid OTP. Please try again."
            context['success'] = False

    return render(request, 'testotp.html', context)


# @driver_login_required
# def ongoing_trip(request):
#     driver_id = request.session.get('driver_id')
#     if not driver_id:
#         messages.error(request, "You need to login first.")
#         return redirect('driver_login')

#     try:
#         driver = DriverRegistration.objects.get(id=driver_id)
#         booking_id = request.session.get('verified_trip_id')  # Get only verified trip
#         assigned_trip = Trip.objects.filter(booking_id=booking_id, driver_contact=driver.drivermobileno).first()

#         if not assigned_trip:
#             messages.warning(request, "No ongoing trip found or OTP not verified.")
#             return redirect('mobileapp')

#         if request.method == 'POST':
#             action = request.POST.get('action')

#             if action == 'start' and assigned_trip.status == 'Pending':
#                 assigned_trip.status = 'Ongoing'
#                 assigned_trip.save()
#                 messages.success(request, "Trip started successfully.")
#                 return redirect('ongoing_trip')

#             elif action == 'complete' and assigned_trip.status == 'Ongoing':
#                 add_charges = request.POST.get('add_extra_charges')
#                 if add_charges == 'yes':
#                     extra_keys = request.POST.getlist('extra_key[]')
#                     extra_values = request.POST.getlist('extra_value[]')
#                     extra_data = dict(zip(extra_keys, [float(v) for v in extra_values]))

#                     assigned_trip.extra_charges = extra_data
#                     extra_total = sum(extra_data.values())
#                     assigned_trip.extra_total = Decimal(extra_total)

#                     if assigned_trip.total_amount:
#                         assigned_trip.total_amount += Decimal(extra_total)
#                     else:
#                         assigned_trip.total_amount = Decimal(extra_total)

#                 assigned_trip.status = 'Completed'
#                 assigned_trip.save()

#                 # Clear the session key
#                 if 'verified_trip_id' in request.session:
#                     del request.session['verified_trip_id']

#                 driver.is_active = True
#                 driver.save()

#                 messages.success(request, "Trip marked as completed.")
#                 return redirect('mobileapp')

#         context = {
#             'driver': driver,
#             'assigned_trip': assigned_trip,
#         }
#         return render(request, "ongoing_trip.html", context)

#     except DriverRegistration.DoesNotExist:
#         messages.error(request, "Driver not found.")
#         return redirect('driver_login')

@driver_login_required
def start_trip(request):
    driver_id = request.session.get('driver_id')
    try:
        driver = DriverRegistration.objects.get(id=driver_id)
        booking_id = request.session.get('verified_trip_id')
        assigned_trip = Trip.objects.filter(booking_id=booking_id, driver_contact=driver.drivermobileno).first()

        if not assigned_trip:
            messages.warning(request, "No ongoing trip found or OTP not verified.")
            return redirect('mobileapp')

        if request.method == 'POST':
            action = request.POST.get('action')
            if action == 'start' and assigned_trip.status == 'Pending':
                assigned_trip.status = 'Ongoing'
                # Use timezone.now() to get a timezone-aware datetime
                assigned_trip.start_time = timezone.now()  # <--- CORRECTED LINE
                assigned_trip.save()

                driver.is_active = False
                driver.save()

                messages.success(request, "Trip started successfully.")
                return redirect('complete_trip')

        context = {
            'driver': driver,
            'assigned_trip': assigned_trip,
        }
        return render(request, "start_trip.html", context)

    except DriverRegistration.DoesNotExist:
        messages.error(request, "Driver not found.")
        return redirect('driver_login')
    
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="trip_tracker")

def get_place_name(lat, lng):
    try:
        location = geolocator.reverse((lat, lng), exactly_one=True, language='en')
        if location:
            return location.address  # Full precise address
        return "Unknown location"
    except Exception:
        return "Unknown location"
    

import logging
from datetime import timezone as dt_timezone  # ✅ New import for UTC

logger = logging.getLogger(__name__)

@csrf_exempt
@driver_login_required
def update_location(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            driver_id = request.session.get('driver_id')
            driver = DriverRegistration.objects.get(id=driver_id)
            trip = Trip.objects.filter(driver_contact=driver.drivermobileno, status='Ongoing').first()
            if not trip:
                return JsonResponse({"status": "error", "message": "No ongoing trip found"}, status=400)

            latitude = Decimal(str(data.get("latitude")))
            longitude = Decimal(str(data.get("longitude")))
            timestamp = data.get("timestamp")

            if not all([latitude, longitude, timestamp]):
                return JsonResponse({"status": "error", "message": "Missing required fields"}, status=400)

            # Get detailed place name
            place_name = get_place_name(latitude, longitude)

            # Convert timestamp to readable local time
            dt = timezone.datetime.fromtimestamp(timestamp / 1000, tz=dt_timezone.utc)
            local_time_str = timezone.localtime(dt).strftime("%I:%M %p")  # e.g. "12:09 AM"

            # Get or create TripLocation record
            trip_location, created = TripLocation.objects.get_or_create(trip=trip)

            # Save in format: timestamp: {lat, lng, place, time}
            trip_location.locations[str(timestamp)] = {
                "lat": float(latitude),
                "lng": float(longitude),
                "place": place_name,
                "time": local_time_str
            }
            trip_location.save()

            return JsonResponse({"status": "success"})
        except Exception as e:
            logger.exception("Error in update_location")
            return JsonResponse({"status": "error", "message": str(e)}, status=400)

        

def get_trip_locations(request, trip_id):
    trip_location = TripLocation.objects.filter(trip_id=trip_id).first()
    if not trip_location:
        return JsonResponse({"status": "error", "message": "No locations found"}, status=404)
    return JsonResponse(trip_location.locations)

@driver_login_required
def complete_trip(request):
    driver_id = request.session.get('driver_id')
    try:
        driver = DriverRegistration.objects.get(id=driver_id)
        # Find the ongoing trip for this specific driver
        assigned_trip = Trip.objects.filter(driver_contact=driver.drivermobileno, status='Ongoing').first()

        if not assigned_trip:
            messages.warning(request, "No ongoing trip found.")
            return redirect('mobileapp')

        if request.method == 'POST':
            action = request.POST.get('action')
            if action == 'complete' and assigned_trip.status == 'Ongoing':
                add_charges = request.POST.get('add_extra_charges')
                
                extra_data = {}
                extra_total = Decimal('0.00')
                extra_data_decimal = {} # New dictionary to hold Decimal values

                if add_charges == 'yes':
                    extra_keys = request.POST.getlist('extra_key[]')
                    extra_values = request.POST.getlist('extra_value[]')
                    
                    for key, value in zip(extra_keys, extra_values):
                        try:
                            # Convert value to Decimal for calculations
                            decimal_value = Decimal(value)
                            extra_data_decimal[key] = decimal_value # Store as Decimal
                            extra_data[key] = str(decimal_value) # Convert to string for JSONField
                        except (ValueError, TypeError):
                            messages.error(request, "Invalid extra charge amount provided.")
                            return redirect('complete_trip')

                    # Calculate sum from the new dictionary with Decimal values
                    extra_total = sum(extra_data_decimal.values(), Decimal('0.00'))

                payment_method = request.POST.get('payment_method')
                if payment_method:
                    extra_data['payment_method'] = payment_method

                assigned_trip.extra_charges = extra_data
                assigned_trip.extra_total = extra_total

                if assigned_trip.total_amount:
                    assigned_trip.total_amount += extra_total
                else:
                    assigned_trip.total_amount = assigned_trip.base_fare if assigned_trip.base_fare is not None else Decimal('0.00')
                    assigned_trip.total_amount += extra_total

                # Use timezone.now() to get a timezone-aware datetime
                assigned_trip.end_time = timezone.now()
                assigned_trip.status = 'Completed'
                assigned_trip.save()

                if 'verified_trip_id' in request.session:
                    del request.session['verified_trip_id']

                # Update driver's status to active
                driver.is_active = True
                driver.save()
                messages.success(request, "Trip marked as completed and your status is now active.")
                return redirect('mobileapp')

        context = {
            'driver': driver,
            'assigned_trip': assigned_trip,
        }
        return render(request, "complete_trip.html", context)

    except DriverRegistration.DoesNotExist:
        messages.error(request, "Driver not found.")
        return redirect('driver_login')


# views.py

@driver_login_required
def completedtrips(request):
    driver_id = request.session.get('driver_id')
    if driver_id:
        try:
            driver = DriverRegistration.objects.get(id=driver_id)

            # Get date from query string or fallback to today
            date_str = request.GET.get('date')
            if date_str:
                try:
                    filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                except ValueError:
                    # Handle invalid date format by defaulting to today
                    filter_date = timezone.now().date()
            else:
                filter_date = timezone.now().date()

            # Filter completed trips for that date
            completed_trips = Trip.objects.filter(
                driver_contact=driver.drivermobileno,
                status='Completed',
                date=filter_date
            )

            # Calculate total commission for the day
            total_commission = sum(trip.driver_commission for trip in completed_trips)

            context = {
                'driver': driver,
                'completed_trips': completed_trips,
                'total_commission': total_commission,
            }
            return render(request, "completedtrips.html", context)

        except DriverRegistration.DoesNotExist:
            messages.error(request, "Driver not found.")
            return redirect('driver_login')
    else:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')


@driver_login_required
def cancelledtrips(request):
    driver_id = request.session.get('driver_id')
    if driver_id:
        try:
            driver = DriverRegistration.objects.get(id=driver_id)

            # Use date from query string or fallback to today
            date_str = request.GET.get('date')
            if date_str:
                try:
                    filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                except ValueError:
                    filter_date = timezone.now().date()
            else:
                filter_date = timezone.now().date()

            cancelled_trips = Trip.objects.filter(
                driver_contact=driver.drivermobileno,
                status='Cancelled',
                date=filter_date
            )

            context = {
                'driver': driver,
                'cancelled_trips': cancelled_trips
            }
            return render(request, "cancelledtrips.html", context)

        except DriverRegistration.DoesNotExist:
            messages.error(request, "Driver not found.")
            return redirect('driver_login')
    else:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')
    

@driver_login_required
def report(request):
    driver_id = request.session.get('driver_id')
    if not driver_id:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')

    try:
        driver = DriverRegistration.objects.get(id=driver_id)
    except DriverRegistration.DoesNotExist:
        messages.error(request, "Driver not found.")
        return redirect('driver_login')

    completed_trips = []
    month_range = 1  # Default to last 1 month if no POST request or invalid value

    if request.method == 'POST':
        try:
            month_range = float(request.POST.get('month_range', 1))
            if month_range not in [0.5, 1, 3, 6, 12]:
                month_range = 1  # Fallback to default if an invalid value is sent
        except (ValueError, TypeError):
            month_range = 1  # Handle cases where conversion to float fails

        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=month_range * 30)

        completed_trips = Trip.objects.filter(
            driver_contact=driver.drivermobileno,
            status='Completed',
            date__range=(start_date, end_date)
        ).order_by('-date')

    return render(request, "report.html", {
        'driver': driver,
        'completed_trips': completed_trips,
        'selected_month_range': month_range,
    })


@driver_login_required
def download_report(request):
    driver_id = request.session.get('driver_id')
    if not driver_id:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')

    try:
        driver = DriverRegistration.objects.get(id=driver_id)
    except DriverRegistration.DoesNotExist:
        messages.error(request, "Driver not found.")
        return redirect('driver_login')

    try:
        month_range = float(request.GET.get('month_range', 1))
        if month_range not in [0.5, 1, 3, 6, 12]:
            month_range = 1
    except (ValueError, TypeError):
        month_range = 1

    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=int(month_range * 30)) # Ensure days is an integer

    completed_trips = Trip.objects.filter(
        driver_contact=driver.drivermobileno,
        status='Completed',
        date__range=(start_date, end_date)
    ).order_by('-date')

    # Create PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=15 * mm,
        bottomMargin=15 * mm
    )
    elements = []

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name='Title',
        fontSize=16,
        leading=18,
        alignment=1,
        spaceAfter=10
    )
    normal_style = ParagraphStyle(
        name='Normal',
        fontSize=10,
        leading=12,
        spaceAfter=4
    )
    table_cell_style = ParagraphStyle(
        name='TableCell',
        fontSize=9,
        leading=10,
        wordWrap='CJK',
    )

    # Add logo
    logo_path = find('images/vansateng.png')
    if logo_path and os.path.exists(logo_path):
        logo = Image(logo_path, width=60 * mm, height=19 * mm)
        logo_frame = KeepInFrame(50 * mm, 20 * mm, [logo], hAlign='CENTER')
        elements.append(logo_frame)
    else:
        elements.append(Paragraph("Logo not found", normal_style))
    elements.append(Spacer(1, 6 * mm))

    # Title and driver info
    period_text = {
        0.5: "Last 15 Days",
        1: "Last 1 Month",
        3: "Last 3 Months",
        6: "Last 6 Months",
        12: "Last 1 Year"
    }
    elements.append(Paragraph(f"Driver Trip Report - {period_text[month_range]}", title_style))
    elements.append(Spacer(1, 4 * mm))
    elements.append(Paragraph(f"<b>Driver:</b> {driver.driverfirstname} {driver.driverlastname}", normal_style))
    elements.append(Paragraph(f"<b>Mobile:</b> {driver.drivermobileno}", normal_style))
    elements.append(Spacer(1, 8 * mm))

    if completed_trips:
        # Table data and totals
        # Removed 'Total Amount (₹)' column
        data = [['Date', 'From City', 'To City', 'Payment (INR)']]
        total_driver_commission = Decimal('0.00') # Use Decimal for sum to maintain precision

        for trip in completed_trips:
            driver_comm = trip.driver_commission if trip.driver_commission is not None else Decimal('0.00')
            
            data.append([
                Paragraph(trip.date.strftime('%d %b %Y'), table_cell_style),
                Paragraph(trip.from_city, table_cell_style),
                Paragraph(trip.to_city, table_cell_style),
                Paragraph(f"{driver_comm:.2f}", table_cell_style) # Format to 2 decimal places
            ])
            total_driver_commission += driver_comm

        # Add total row
        # Adjusted column span for 'Total' and alignment
        data.append([
            '', Paragraph('<b>Total Amount</b>', table_cell_style), '', # Empty cell for 'From City' and 'To City'
            Paragraph(f"<b>{total_driver_commission:.2f}</b>", table_cell_style)
        ])

        # Adjusted column widths for 4 columns
        col_widths = [40 * mm, 50 * mm, 50 * mm, 35 * mm] # Adjusted to 4 columns

        table = Table(data, colWidths=col_widths)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('ALIGN', (0, 1), (2, -2), 'LEFT'), # Align Date, From City, To City to left
            ('ALIGN', (3, 1), (3, -2), 'RIGHT'), # Align Driver Commission to right
            ('ALIGN', (-1, -1), (-1, -1), 'RIGHT'), # Align total commission to right
            ('BACKGROUND', (0, 1), (-1, -2), colors.white),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.4, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 1), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
            # Span 'Total Commission' across the first two columns (Date, From City)
            ('SPAN', (1, -1), (2, -1)), # Spans 'Total Commission' over 'From City' and 'To City' columns
            ('ALIGN', (1, -1), (2, -1), 'LEFT'), # Align the spanned 'Total Commission' text to left
        ]))
        elements.append(table)
    else:
        elements.append(Paragraph("No completed trip data available for the selected period.", normal_style))

    # Build PDF
    doc.build(elements)

    # Return PDF
    buffer.seek(0)
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="trip_report_{month_range}m.pdf"'
    response.write(buffer.getvalue())
    buffer.close()
    return response



@driver_login_required
def notifications(request):
    driver_id = request.session.get('driver_id')
    if driver_id:
        try:
            driver = DriverRegistration.objects.get(id=driver_id)

            # Get today's date and the date 5 days from now
            today = timezone.now().date()
            five_days_from_now = today + timedelta(days=5)

            # Fetch trips assigned to this driver with today's date only
            trips_today = Trip.objects.filter(
                driver_contact=driver.drivermobileno,
                date=today
            ).order_by('-created_at')

            # Filter by status (Only Pending and Cancelled)
            pending_trips = trips_today.filter(status='Pending')
            cancelled_trips = trips_today.filter(status='Cancelled')

            # Fetch only today's remarks
            remarks_today = DriverRemark.objects.filter(
                driver=driver,
                created_at__date=today
            ).order_by('-created_at')

            # --- NEW: Fetch Expiring Documents ---
            expiring_documents = []

            # Check vehicle registration expiry
            # Ensure driver.registration_expiry_date is specifically for vehicle registration
            if driver.vehicle_number and driver.vehicle_number != '' and driver.registration_expiry_date:
                if today <= driver.registration_expiry_date <= five_days_from_now:
                    expiring_documents.append({
                        'type': 'Vehicle Registration Expiry',
                        'message': f"Vehicle registration ({driver.vehicle_number}) is expiring on {driver.registration_expiry_date.strftime('%d %b %Y')}.",
                        'expiry_date': driver.registration_expiry_date,
                        'priority': 1
                    })
                elif driver.registration_expiry_date < today:
                    expiring_documents.append({
                        'type': 'Vehicle Registration Expired',
                        'message': f"Vehicle registration ({driver.vehicle_number}) expired on {driver.registration_expiry_date.strftime('%d %b %Y')}. Please renew immediately.",
                        'expiry_date': driver.registration_expiry_date,
                        'priority': 0
                    })

            # Check insurance expiry
            if driver.vehicle_insurance and driver.vehicle_insurance.name and driver.insurance_expiry_date:
                if today <= driver.insurance_expiry_date <= five_days_from_now:
                    expiring_documents.append({
                        'type': 'Insurance Expiry',
                        'message': f"Vehicle insurance is expiring on {driver.insurance_expiry_date.strftime('%d %b %Y')}.",
                        'expiry_date': driver.insurance_expiry_date,
                        'priority': 1
                    })
                elif driver.insurance_expiry_date < today:
                    expiring_documents.append({
                        'type': 'Insurance Expired',
                        'message': f"Vehicle insurance expired on {driver.insurance_expiry_date.strftime('%d %b %Y')}. Please renew immediately.",
                        'expiry_date': driver.insurance_expiry_date,
                        'priority': 0
                    })

            # Check fitness certificate expiry
            if driver.fitness_certificate and driver.fitness_certificate.name and driver.fitness_certificate_expiry_date:
                if today <= driver.fitness_certificate_expiry_date <= five_days_from_now:
                    expiring_documents.append({
                        'type': 'Fitness Certificate Expiry',
                        'message': f"Fitness certificate is expiring on {driver.fitness_certificate_expiry_date.strftime('%d %b %Y')}.",
                        'expiry_date': driver.fitness_certificate_expiry_date,
                        'priority': 1
                    })
                elif driver.fitness_certificate_expiry_date < today:
                    expiring_documents.append({
                        'type': 'Fitness Certificate Expired',
                        'message': f"Fitness certificate expired on {driver.fitness_certificate_expiry_date.strftime('%d %b %Y')}. Please renew immediately.",
                        'expiry_date': driver.fitness_certificate_expiry_date,
                        'priority': 0
                    })

            # Check PUC certificate expiry
            # Assuming 'puc_certificate_expiry_date' exists in your DriverRegistration model
            if hasattr(driver, 'puc_certificate_expiry_date') and driver.puc_certificate and driver.puc_certificate.name and driver.puc_certificate_expiry_date:
                if today <= driver.puc_certificate_expiry_date <= five_days_from_now:
                    expiring_documents.append({
                        'type': 'PUC Certificate Expiry',
                        'message': f"PUC certificate is expiring on {driver.puc_certificate_expiry_date.strftime('%d %b %Y')}.",
                        'expiry_date': driver.puc_certificate_expiry_date,
                        'priority': 1
                    })
                elif driver.puc_certificate_expiry_date < today:
                    expiring_documents.append({
                        'type': 'PUC Certificate Expired',
                        'message': f"PUC certificate expired on {driver.puc_certificate_expiry_date.strftime('%d %b %Y')}. Please renew immediately.",
                        'expiry_date': driver.puc_certificate_expiry_date,
                        'priority': 0
                    })

            # Sort expiring documents by priority (expired first, then expiring soonest)
            expiring_documents.sort(key=lambda x: (x['priority'], x['expiry_date']))

            context = {
                'driver': driver,
                'pending_trips': pending_trips,
                'cancelled_trips': cancelled_trips,
                'remarks': remarks_today,
                'expiring_documents': expiring_documents, # Add to context
                'selected_date': today,
            }
            return render(request, 'notifications.html', context)

        except DriverRegistration.DoesNotExist:
            messages.error(request, "Driver not found.")
            return redirect('driver_login')
    else:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')



@driver_login_required
def settings(request):
    driver_id = request.session.get('driver_id')
    if driver_id:
        try:
            driver = DriverRegistration.objects.get(id=driver_id)
            # Get today's date
            today = timezone.now().date()
            # Calculate today's total earnings
            today_completed_trips = Trip.objects.filter(
                driver_contact=driver.drivermobileno,
                status='Completed',
                date=today
            )
            today_total_earnings = today_completed_trips.aggregate(
                total=models.Sum('driver_commission')
            )['total'] or 0
            
            # This is a better way to handle Decimal objects, ensuring precision
            if today_total_earnings:
                today_total_earnings = today_total_earnings.quantize(Decimal('0.01'))
            

            context = {
                'driver': driver,
                'today_total_earnings': today_total_earnings
            }
            return render(request, 'settings.html', context)
        except DriverRegistration.DoesNotExist:
            messages.error(request, "Driver not found.")
            return redirect('driver_login')
    else:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')
    

@driver_login_required
def pendingtrips(request):
    driver_id = request.session.get('driver_id')
    if driver_id:
        try:
            driver = DriverRegistration.objects.get(id=driver_id)

            # Use date from query string or fallback to today
            date_str = request.GET.get('date')
            if date_str:
                try:
                    filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                except ValueError:
                    filter_date = timezone.now().date()
                    messages.error(request, "Invalid date format. Showing trips for today.")
            else:
                filter_date = timezone.now().date()

            pending_trips = Trip.objects.filter(
                driver_contact=driver.drivermobileno,
                status='Pending',
                date=filter_date
            ).order_by('time')

            context = {
                'driver': driver,
                'pending_trips': pending_trips,
                'today': filter_date.strftime('%Y-%m-%d')  # Format date for template
            }
            return render(request, "pendingtrips.html", context)

        except DriverRegistration.DoesNotExist:
            messages.error(request, "Driver not found.")
            return redirect('driver_login')
    else:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')
    
    
@driver_login_required
def alltrips(request): # Renamed function to alltrips for clarity
    driver_id = request.session.get('driver_id')
    if driver_id:
        try:
            driver = DriverRegistration.objects.get(id=driver_id)

            # Use date from query string or fallback to today
            date_str = request.GET.get('date')
            if date_str:
                try:
                    filter_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                except ValueError:
                    # If date_str is invalid, default to today
                    filter_date = timezone.now().date()
            else:
                # Default to today's date if no date_str in query
                filter_date = timezone.now().date()

            # Fetch all trips for the logged-in driver for the selected date
            # Assuming 'driver_name' in Trip model links to DriverRegistration's name
            # and 'from_location', 'to_location', 'amount', 'status' are fields in Trip model.
            # You might need to adjust field names based on your actual Trip model.
            trips = Trip.objects.filter(
                driver_contact=driver.drivermobileno, # Or driver_id if you link by ID
                date=filter_date
            ).order_by('time') # Order by time for better display

            context = {
                'driver': driver,
                'trips': trips, # Renamed from cancelled_trips to all_trips or just trips
                'selected_date': filter_date, # Pass the date back to pre-fill the input
                'today_date': timezone.now().date(), # For any other use if needed
            }
            return render(request, "alltrips.html", context)

        except DriverRegistration.DoesNotExist:
            messages.error(request, "Driver not found.")
            return redirect('driver_login')
    else:
        messages.error(request, "You need to login first.")
        return redirect('driver_login')