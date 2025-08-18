from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.views.decorators.cache import cache_control
from .models import *
from django.shortcuts import get_object_or_404, redirect
from django.views.decorators.http import require_POST
from driver.models import DriverRegistration, DriverRemark
from django.http import HttpResponse,JsonResponse
from django.db.models import Q
import random
import json
from django.views.decorators.csrf import csrf_exempt
import requests
import logging
from .fetchdata import *
import string
from django.utils.timezone import now
from django.db.models import Count
from django.shortcuts import render
from .models import Trip, Node
import csv
from datetime import datetime, timedelta
from .models import Node, Employee
from django.utils.dateparse import parse_date


logger = logging.getLogger(__name__)

# Create your views here.
def index(request):
    return render(request, "index.html")

def sign_in(request):
    context = {
        'page' : 'sign_in'
    }
    if request.method == "POST":
        # return HttpResponse("This is Home page")  
        username = request.POST['username']
        password = request.POST['password']

        user = authenticate(username = username, password = password)

        if user is not None:
            if user.username == "admin@gmail.com":
                login(request, user)
                messages.success(request, "Log In Successful...!")
                return redirect("admin_dashboard")
            else:
                emp = get_object_or_404(Employee, employeeMobile=username)
                node = Node.objects.get(nodeID=emp.empNodeID.nodeID)
                login(request, user)
                messages.success(request, "Log In Successful...!")
                return redirect("node_dashboard", node.nodeID)

        else:
            context['error'] = "Invalid Credentials...!"
            return render(request, "sign_in.html", context)
    return render(request, "sign_in.html")


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def admin_dashboard(request):

    if request.user.username == "admin@gmail.com":
        nodes = Node.objects.all()
        
        # Get selected date from query params or default to today
        selected_date_str = request.GET.get("date")
        if selected_date_str:
            try:
                selected_date = datetime.strptime(selected_date_str, "%Y-%m-%d").date()
            except ValueError:
                selected_date = now().date()
        else:
            selected_date = now().date()

        # Filter trips by selected date
        trips_today = Trip.objects.filter(date=selected_date)

        completed_count = trips_today.filter(status='Completed').count()
        ongoing_count = trips_today.filter(status='Ongoing').count()
        pending_count = trips_today.filter(status='Pending').count()
        cancelled_count = trips_today.filter(status='Cancelled').count()
        total_count = trips_today.count()

        context = {
            'page': 'admin_dashboard',
            'user': request.user,
            'nodes': nodes,
            'completed_count': completed_count,
            'ongoing_count': ongoing_count,
            'pending_count': pending_count,
            'cancelled_count': cancelled_count,
            'total_count': total_count,
            'selected_date': selected_date.strftime('%Y-%m-%d'),
        }
    
    else:

        emp = get_object_or_404(Employee, employeeMobile=request.user.username)
        node = Node.objects.get(nodeID=emp.empNodeID.nodeID)
        print(node)
        
        # Get selected date from query params or default to today
        selected_date_str = request.GET.get("date")
        if selected_date_str:
            try:
                selected_date = datetime.strptime(selected_date_str, "%Y-%m-%d").date()
            except ValueError:
                selected_date = now().date()
        else:
            selected_date = now().date()

        # Filter trips by selected date
        trips_today = Trip.objects.filter(date=selected_date)

        completed_count = trips_today.filter(status='Completed').count()
        ongoing_count = trips_today.filter(status='Ongoing').count()
        pending_count = trips_today.filter(status='Pending').count()
        cancelled_count = trips_today.filter(status='Cancelled').count()
        total_count = trips_today.count()

        context = {
            'page': 'admin_dashboard',
            'user': request.user,
            'node': node,
            'completed_count': completed_count,
            'ongoing_count': ongoing_count,
            'pending_count': pending_count,
            'cancelled_count': cancelled_count,
            'total_count': total_count,
            'selected_date': selected_date.strftime('%Y-%m-%d'),
        }

    return render(request, "admin_dashboard.html", context)


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def trips_by_status_view(request):
    status = request.GET.get("status")
    selected_date_str = request.GET.get("date")
    
    try:
        selected_date = datetime.strptime(selected_date_str, "%Y-%m-%d").date()
    except:
        selected_date = now().date()
    
    if status == 'All':
        trips = Trip.objects.filter(date=selected_date)
    else:
        trips = Trip.objects.filter(status=status, date=selected_date)

    context = {
        "trips": trips,
        "status": status,
        "selected_date": selected_date.strftime('%Y-%m-%d'),
    }
    return render(request, "trips_by_status.html", context)


def edit_trip(request, trip_id):
    trip = get_object_or_404(Trip, pk=trip_id)

    if request.method == 'POST':
        trip.passenger_name = request.POST['passenger_name']
        trip.contact_number = request.POST['contact_number']
        trip.email_id = request.POST['email_id']
        trip.from_city = request.POST['from_city']
        trip.to_city = request.POST['to_city']
        trip.date = request.POST['date']
        trip.time = request.POST['time']
        trip.vehicle_type = request.POST['vehicle_type']
        trip.vehicle_number = request.POST['vehicle_number']
        trip.driver_name = request.POST['driver_name']
        trip.driver_contact = request.POST['driver_contact']
        trip.payment_type = request.POST['payment_type']
        trip.base_fare = request.POST['base_fare']
        trip.discount = request.POST['discount']
        trip.terminal_charges = request.POST['terminal_charges']
        trip.surcharges = request.POST['surcharges']
        trip.taxes = request.POST['taxes']
        trip.total_amount = request.POST['total_amount']
        trip.status = request.POST['status']
        trip.otp = request.POST['otp']
        trip.otp_verified = request.POST.get('otp_verified') == 'True'

        trip.save()
        return redirect('trips')  # replace with your view name

    # For safety
    return redirect('trips')


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def add_node(request):
    nodes = Node.objects.all()
    context = {
        'page' : 'add_node',
        'user' : request.user,
        'nodes' : nodes
    }
    if 'node_add' in request.POST:
        nodeInitials = request.POST['nodeInitials']
        nodeAddress = request.POST['nodeAddress']
        nodeName = request.POST['nodeName']
        nodeLatitude = request.POST['nodeLatitude']
        nodeLongitude = request.POST['nodeLongitude']
        nodeCity = request.POST['nodeCity']
        nodeState = request.POST['nodeState']
        nodePincode = request.POST['nodePincode']
        coordinatorName = request.POST['coordinatorName']
        helplineNumber = request.POST['helplineNumber']

        if Node.objects.filter(nodeInitials=nodeInitials).exists():
            messages.error(request, "Node Already Exists...!")
            return redirect("add_node")

        new_node = Node(
            nodeInitials=nodeInitials,
            nodeAddress=nodeAddress,
            nodeName=nodeName,
            nodeLatitude=nodeLatitude,
            nodeLongitude=nodeLongitude,
            nodeCity=nodeCity,
            nodeState=nodeState,
            nodePincode=nodePincode,
            coordinatorName=coordinatorName,
            helplineNumber=helplineNumber
        )
        new_node.save()
        messages.success(request, "Node Added Successfully...!")
        return redirect("add_node")
    return render(request, "add_node.html", context)


@require_POST
def edit_node(request):
    node_id = request.POST['node_id']
    coordinator_name = request.POST['coordinatorName']
    helpline_number = request.POST['helplineNumber']

    node = get_object_or_404(Node, nodeID=node_id)
    node.coordinatorName = coordinator_name
    node.helplineNumber = helpline_number
    node.save()

    return redirect('add_node')


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def delete_node(request, node_id):
    node = get_object_or_404(Node, nodeID=node_id)
    node.delete()
    messages.success(request, "Node Deleted Successfully...!")
    return redirect("add_node")


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def node_dashboard(request, node_id):
    node = get_object_or_404(Node, nodeID=node_id)
    nodes = Node.objects.all()
    today = now().date()

    live_trips = Trip.objects.filter(booking_id__icontains=node.nodeInitials,status='Ongoing', date=today)
    pending_trips = Trip.objects.filter(booking_id__icontains=node.nodeInitials,status='Pending', date=today)
    completed_trips = Trip.objects.filter(booking_id__icontains=node.nodeInitials,status='Completed', date=today)
    cancelled_trips = Trip.objects.filter(booking_id__icontains=node.nodeInitials,status='Cancelled', date=today)
    
    context = {
        'page' : 'node_dashboard/' + str(node_id),
        'user' : request.user,
        'node' : node,
        'nodes' : nodes,
        'live_trips_count': len(live_trips),
        'pending_trips_count': len(pending_trips),
        'completed_trips_count': len(completed_trips),
        'cancelled_trips_count': len(cancelled_trips),
    }
    
    return render(request, "node_dashboard.html", context)


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def node_tariff(request, node_id):
    node = get_object_or_404(Node, nodeID=node_id)
    nodes = Node.objects.all()
    airport_tariff = AirportTariff.objects.filter(node=node)
    railway_tariff = RailwayTariff.objects.filter(node=node)
    outstation_tariff = OutstationTariff.objects.filter(node=node)
    holiday_tariff = HolidayTourTariff.objects.filter(node=node)
    hourly_rental_tariff = HourlyRentalTariff.objects.filter(node=node)

    if request.method == 'POST' and 'copy_from_node' in request.POST:
            source_node_id = request.POST.get('copy_from_node')

            try:
                source_node = Node.objects.get(nodeID=source_node_id)

                # 1. Copy FixedTariff
                FixedTariff.objects.filter(node=node).delete()
                for tariff in FixedTariff.objects.filter(node=source_node):
                    FixedTariff.objects.create(
                        node=node,
                        fixedTerminalCharges=tariff.fixedTerminalCharges,
                        fixedSurCharges=tariff.fixedSurCharges,
                        fixedTax=tariff.fixedTax,
                        vansatCommission=tariff.vansatCommission,
                        driverCommission=tariff.driverCommission
                    )

                # 2. Copy AirportTariff
                AirportTariff.objects.filter(node=node).delete()
                for t in AirportTariff.objects.filter(node=source_node):
                    t.pk = None
                    t.node = node
                    t.save()

                # 3. Copy RailwayTariff
                RailwayTariff.objects.filter(node=node).delete()
                for t in RailwayTariff.objects.filter(node=source_node):
                    t.pk = None
                    t.node = node
                    t.save()

                # 4. Copy OutstationTariff
                OutstationTariff.objects.filter(node=node).delete()
                for t in OutstationTariff.objects.filter(node=source_node):
                    t.pk = None
                    t.node = node
                    t.save()

                # 5. Copy HolidayTourTariff
                HolidayTourTariff.objects.filter(node=node).delete()
                for t in HolidayTourTariff.objects.filter(node=source_node):
                    t.pk = None
                    t.node = node
                    t.save()

                # 6. Copy HourlyRentalTariff
                HourlyRentalTariff.objects.filter(node=node).delete()
                for t in HourlyRentalTariff.objects.filter(node=source_node):
                    t.pk = None
                    t.node = node
                    t.save()

                messages.success(request, f"All tariff structures copied from node {source_node.nodeInitials}.")

            except Node.DoesNotExist:
                messages.error(request, "Source node not found.")
            except Exception as e:
                messages.error(request, f"Error copying tariff data: {str(e)}")


    try:
        fixed_tariff = FixedTariff.objects.get(node=node)
    except FixedTariff.DoesNotExist:
        fixed_tariff = None
    context = {
        'page': 'node_tariff/' + str(node_id),
        'user': request.user,
        'node': node,
        'nodes': nodes,
        'fixed_tariff': fixed_tariff,
        'airport_tariff': airport_tariff,
        'railway_tariff': railway_tariff,
        'outstation_tariff': outstation_tariff,
        'holiday_tariff': holiday_tariff,
        'hourly_rental_tariff': hourly_rental_tariff,
    }

    if 'save_fixed_tariff' in request.POST:
        fixedTerminalCharges = request.POST['fixedTerminalCharges']
        fixedSurCharges = request.POST['fixedSurCharges']
        fixedTax = request.POST['fixedTax']
        vansatCommission = request.POST['vansatCommission']
        driverCommission = request.POST['driverCommission']

        # Check if FixedTariff exists
        try:
            fixed_tariff = FixedTariff.objects.get(node=node)
            # Update existing record
            fixed_tariff.fixedTerminalCharges = fixedTerminalCharges
            fixed_tariff.fixedSurCharges = fixedSurCharges
            fixed_tariff.fixedTax = fixedTax
            fixed_tariff.vansatCommission = vansatCommission
            fixed_tariff.driverCommission = driverCommission
            fixed_tariff.save()
            messages.success(request, "Tariff Updated Successfully...!")
        except FixedTariff.DoesNotExist:
            # Create new record
            new_fixed_tariff = FixedTariff(
                node=node,
                fixedTerminalCharges=fixedTerminalCharges,
                fixedSurCharges=fixedSurCharges,
                fixedTax=fixedTax,
                vansatCommission=vansatCommission,
                driverCommission=driverCommission
            )
            new_fixed_tariff.save()
            messages.success(request, "Tariff Added Successfully...!")

        return redirect("node_tariff", node_id=node_id)
    
    elif 'add_airport_tariff' in request.POST:
        name = request.POST['name']
        kmRange = request.POST['kmRange']
        hatchback = request.POST['hatchback']
        seden = request.POST['seden']
        premiumSeden = request.POST['premiumSeden']
        muv = request.POST['muv']
        suv = request.POST['suv']
        premiumSUV = request.POST['premiumSUV']
        acTravellar = request.POST['acTravellar']
        buses = request.POST['buses']
        hatchbackWatingCharges = request.POST['hatchbackWatingCharges']
        sedenWatingCharges = request.POST['sedenWatingCharges']
        premiumSedenWatingCharges = request.POST['premiumSedenWatingCharges']
        muvWatingCharges = request.POST['muvWatingCharges']
        suvWatingCharges = request.POST['suvWatingCharges']
        premiumSUVWatingCharges = request.POST['premiumSUVWatingCharges']
        acTravellarWatingCharges = request.POST['acTravellarWatingCharges']
        busesWatingCharges = request.POST['busesWatingCharges']
        cancellationCharges = request.POST['cancellationCharges']
        misleniousCharges = request.POST['misleniousCharges']

        # Convert kmRange to min and max for checking overlaps
        try:
            new_km_min, new_km_max = map(int, kmRange.replace(' ', '').split('-'))
        except:
            messages.error(request, "Invalid KM Range format. Use 'min-max'.")
            return redirect("node_tariff", node_id=node_id)

        # Check for existing overlapping range
        existing = AirportTariff.objects.filter(node=node, name=name)
        overlap = None
        for record in existing:
            try:
                rec_min, rec_max = map(int, record.kmRange.replace(' ', '').split('-'))
                if not (new_km_max < rec_min or new_km_min > rec_max):
                    overlap = record
                    break
            except:
                continue

        if overlap:
            # Update existing overlapping record
            overlap.kmRange = kmRange
            overlap.hatchback = hatchback
            overlap.seden = seden
            overlap.premiumSeden = premiumSeden
            overlap.muv = muv
            overlap.suv = suv
            overlap.premiumSUV = premiumSUV
            overlap.acTravellar = acTravellar
            overlap.buses = buses
            overlap.hatchbackWatingCharges = hatchbackWatingCharges
            overlap.sedenWatingCharges = sedenWatingCharges
            overlap.premiumSedenWatingCharges = premiumSedenWatingCharges
            overlap.muvWatingCharges = muvWatingCharges
            overlap.suvWatingCharges = suvWatingCharges
            overlap.premiumSUVWatingCharges = premiumSUVWatingCharges
            overlap.acTravellarWatingCharges = acTravellarWatingCharges
            overlap.busesWatingCharges = busesWatingCharges
            overlap.cancellationCharges = cancellationCharges
            overlap.misleniousCharges = misleniousCharges
            overlap.save()
            messages.success(request, "Airport Tariff Updated Successfully...!")
        else:
            # No overlapping range – safe to add new
            new_airport_tariff = AirportTariff(
                node=node,
                name=name,
                kmRange=kmRange,
                hatchback=hatchback,
                seden=seden,
                premiumSeden=premiumSeden,
                muv=muv,
                suv=suv,
                premiumSUV=premiumSUV,
                acTravellar=acTravellar,
                buses=buses,
                hatchbackWatingCharges=hatchbackWatingCharges,
                sedenWatingCharges=sedenWatingCharges,
                premiumSedenWatingCharges=premiumSedenWatingCharges,
                muvWatingCharges=muvWatingCharges,
                suvWatingCharges=suvWatingCharges,
                premiumSUVWatingCharges=premiumSUVWatingCharges,
                acTravellarWatingCharges=acTravellarWatingCharges,
                busesWatingCharges=busesWatingCharges,
                cancellationCharges=cancellationCharges,
                misleniousCharges=misleniousCharges
            )
            new_airport_tariff.save()
            messages.success(request, "Airport Tariff Added Successfully...!")
    
    elif 'add_railway_tariff' in request.POST:
        name = request.POST['name']
        railwayStationName = request.POST['railwayStationName']
        hatchback = request.POST['railhatchback']
        seden = request.POST['railseden']
        premiumSeden = request.POST['railpremiumSeden']
        muv = request.POST['railmuv']
        suv = request.POST['railsuv']
        premiumSUV = request.POST['railpremiumSUV']
        acTravellar = request.POST['railacTravellar']
        buses = request.POST['railbuses']
        hatchbackWatingCharges = request.POST['railhatchbackWatingCharges']
        sedenWatingCharges = request.POST['railsedenWatingCharges']
        premiumSedenWatingCharges = request.POST['railpremiumSedenWatingCharges']
        muvWatingCharges = request.POST['railmuvWatingCharges']
        suvWatingCharges = request.POST['railsuvWatingCharges']
        premiumSUVWatingCharges = request.POST['railpremiumSUVWatingCharges']
        acTravellarWatingCharges = request.POST['railacTravellarWatingCharges']
        busesWatingCharges = request.POST['railbusesWatingCharges']
        cancellationCharges = request.POST['railcancellationCharges']
        misleniousCharges = request.POST['railmisleniousCharges']

        # Check if a record with same node, name, and railwayStationName exists
        try:
            existing_tariff = RailwayTariff.objects.get(
                node=node,
                name=name,
                railwayStationName=railwayStationName
            )
            # Update the existing record
            existing_tariff.hatchback = hatchback
            existing_tariff.seden = seden
            existing_tariff.premiumSeden = premiumSeden
            existing_tariff.muv = muv
            existing_tariff.suv = suv
            existing_tariff.premiumSUV = premiumSUV
            existing_tariff.acTravellar = acTravellar
            existing_tariff.buses = buses
            existing_tariff.hatchbackWatingCharges = hatchbackWatingCharges
            existing_tariff.sedenWatingCharges = sedenWatingCharges
            existing_tariff.premiumSedenWatingCharges = premiumSedenWatingCharges
            existing_tariff.muvWatingCharges = muvWatingCharges
            existing_tariff.suvWatingCharges = suvWatingCharges
            existing_tariff.premiumSUVWatingCharges = premiumSUVWatingCharges
            existing_tariff.acTravellarWatingCharges = acTravellarWatingCharges
            existing_tariff.busesWatingCharges = busesWatingCharges
            existing_tariff.cancellationCharges = cancellationCharges
            existing_tariff.misleniousCharges = misleniousCharges
            existing_tariff.save()
            messages.success(request, "Railway Tariff Updated Successfully...!")

        except RailwayTariff.DoesNotExist:
            # Create new record if no match found
            new_railway_tariff = RailwayTariff(
                node=node,
                name=name,
                railwayStationName=railwayStationName,
                hatchback=hatchback,
                seden=seden,
                premiumSeden=premiumSeden,
                muv=muv,
                suv=suv,
                premiumSUV=premiumSUV,
                acTravellar=acTravellar,
                buses=buses,
                hatchbackWatingCharges=hatchbackWatingCharges,
                sedenWatingCharges=sedenWatingCharges,
                premiumSedenWatingCharges=premiumSedenWatingCharges,
                muvWatingCharges=muvWatingCharges,
                suvWatingCharges=suvWatingCharges,
                premiumSUVWatingCharges=premiumSUVWatingCharges,
                acTravellarWatingCharges=acTravellarWatingCharges,
                busesWatingCharges=busesWatingCharges,
                cancellationCharges=cancellationCharges,
                misleniousCharges=misleniousCharges
            )
            new_railway_tariff.save()
            messages.success(request, "Railway Tariff Added Successfully...!")

        return redirect("node_tariff", node_id=node_id)
    
    elif 'add_outstation_tariff' in request.POST:
        name = request.POST['name']
        kmRange = request.POST['outkmRange']
        hatchback = request.POST['outhatchback']
        seden = request.POST['outseden']
        premiumSeden = request.POST['outpremiumSeden']
        muv = request.POST['outmuv']
        suv = request.POST['outsuv']
        premiumSUV = request.POST['outpremiumSUV']
        acTravellar = request.POST['outacTravellar']
        buses = request.POST['outbuses']
        hatchbackWatingCharges = request.POST['outhatchbackWatingCharges']
        sedenWatingCharges = request.POST['outsedenWatingCharges']
        premiumSedenWatingCharges = request.POST['outpremiumSedenWatingCharges']
        muvWatingCharges = request.POST['outmuvWatingCharges']
        suvWatingCharges = request.POST['outsuvWatingCharges']
        premiumSUVWatingCharges = request.POST['outpremiumSUVWatingCharges']
        acTravellarWatingCharges = request.POST['outacTravellarWatingCharges']
        busesWatingCharges = request.POST['outbusesWatingCharges']
        cancellationCharges = request.POST['outcancellationCharges']
        misleniousCharges = request.POST['outmisleniousCharges']

        # Check if a record with same node and name exists
        try:
            existing_tariff = OutstationTariff.objects.get(
                node=node,
                name=name,
                kmRange=kmRange
            )
            # Update the existing record
            existing_tariff.hatchback = hatchback
            existing_tariff.seden = seden
            existing_tariff.premiumSeden = premiumSeden
            existing_tariff.muv = muv
            existing_tariff.suv = suv
            existing_tariff.premiumSUV = premiumSUV
            existing_tariff.acTravellar = acTravellar
            existing_tariff.buses = buses
            existing_tariff.hatchbackWatingCharges = hatchbackWatingCharges
            existing_tariff.sedenWatingCharges = sedenWatingCharges
            existing_tariff.premiumSedenWatingCharges = premiumSedenWatingCharges
            existing_tariff.muvWatingCharges = muvWatingCharges
            existing_tariff.suvWatingCharges = suvWatingCharges
            existing_tariff.premiumSUVWatingCharges = premiumSUVWatingCharges
            existing_tariff.acTravellarWatingCharges = acTravellarWatingCharges
            existing_tariff.busesWatingCharges = busesWatingCharges
            existing_tariff.cancellationCharges = cancellationCharges
            existing_tariff.misleniousCharges = misleniousCharges
            existing_tariff.save()
            messages.success(request, "Outstation Tariff Updated Successfully...!")
        
        except OutstationTariff.DoesNotExist:
            # Create new record if no match found
            new_outstation_tariff = OutstationTariff(
                node=node,
                name=name,
                kmRange=kmRange,
                hatchback=hatchback,
                seden=seden,
                premiumSeden=premiumSeden,
                muv=muv,
                suv=suv,
                premiumSUV=premiumSUV,
                acTravellar=acTravellar,
                buses=buses,
                hatchbackWatingCharges=hatchbackWatingCharges,
                sedenWatingCharges=sedenWatingCharges,
                premiumSedenWatingCharges=premiumSedenWatingCharges,
                muvWatingCharges=muvWatingCharges,
                suvWatingCharges=suvWatingCharges,
                premiumSUVWatingCharges=premiumSUVWatingCharges,
                acTravellarWatingCharges=acTravellarWatingCharges,
                busesWatingCharges=busesWatingCharges,
                cancellationCharges=cancellationCharges,
                misleniousCharges=misleniousCharges
            )
            new_outstation_tariff.save()
            messages.success(request, "Outstation Tariff Added Successfully...!")
        return redirect("node_tariff", node_id=node_id)
    
    elif 'add_holiday_tour_tariff' in request.POST:
        name = request.POST['name']
        packageName = request.POST['packageName']
        hatchback = request.POST['holidayhatchback']
        seden = request.POST['holidayseden']
        premiumSeden = request.POST['holidaypremiumSeden']
        muv = request.POST['holidaymuv']
        suv = request.POST['holidaysuv']
        premiumSUV = request.POST['holidaypremiumSUV']
        acTravellar = request.POST['holidayacTravellar']
        buses = request.POST['holidaybuses']
        hatchbackWatingCharges = request.POST['holidayhatchbackWatingCharges']
        sedenWatingCharges = request.POST['holidaysedenWatingCharges']
        premiumSedenWatingCharges = request.POST['holidaypremiumSedenWatingCharges']
        muvWatingCharges = request.POST['holidaymuvWatingCharges']
        suvWatingCharges = request.POST['holidaysuvWatingCharges']
        premiumSUVWatingCharges = request.POST['holidaypremiumSUVWatingCharges']
        acTravellarWatingCharges = request.POST['holidayacTravellarWatingCharges']
        busesWatingCharges = request.POST['holidaybusesWatingCharges']
        cancellationCharges = request.POST['holidaycancellationCharges']
        misleniousCharges = request.POST['holidaymisleniousCharges']

        # Check if a record with same node and name exists
        try:
            existing_tariff = HolidayTourTariff.objects.get(
                node=node,
                name=name,
                packageName=packageName
            )
            # Update the existing record
            existing_tariff.hatchback = hatchback
            existing_tariff.seden = seden
            existing_tariff.premiumSeden = premiumSeden
            existing_tariff.muv = muv
            existing_tariff.suv = suv
            existing_tariff.premiumSUV = premiumSUV
            existing_tariff.acTravellar = acTravellar
            existing_tariff.buses = buses
            existing_tariff.hatchbackWatingCharges = hatchbackWatingCharges
            existing_tariff.sedenWatingCharges = sedenWatingCharges
            existing_tariff.premiumSedenWatingCharges = premiumSedenWatingCharges
            existing_tariff.muvWatingCharges = muvWatingCharges
            existing_tariff.suvWatingCharges = suvWatingCharges
            existing_tariff.premiumSUVWatingCharges = premiumSUVWatingCharges
            existing_tariff.acTravellarWatingCharges = acTravellarWatingCharges
            existing_tariff.busesWatingCharges = busesWatingCharges
            existing_tariff.cancellationCharges = cancellationCharges
            existing_tariff.misleniousCharges = misleniousCharges
            existing_tariff.save()
            messages.success(request, "Holiday Tour Tariff Updated Successfully...!")
        
        except HolidayTourTariff.DoesNotExist:
            # Create new record if no match found
            new_holiday_tariff = HolidayTourTariff(
                node=node,
                name=name,
                packageName=packageName,
                hatchback=hatchback,
                seden=seden,
                premiumSeden=premiumSeden,
                muv=muv,
                suv=suv,
                premiumSUV=premiumSUV,
                acTravellar=acTravellar,
                buses=buses,
                hatchbackWatingCharges=hatchbackWatingCharges,
                sedenWatingCharges=sedenWatingCharges,
                premiumSedenWatingCharges=premiumSedenWatingCharges,
                muvWatingCharges=muvWatingCharges,
                suvWatingCharges=suvWatingCharges,
                premiumSUVWatingCharges=premiumSUVWatingCharges,
                acTravellarWatingCharges=acTravellarWatingCharges,
                busesWatingCharges=busesWatingCharges,
                cancellationCharges=cancellationCharges,
                misleniousCharges=misleniousCharges
            )
            new_holiday_tariff.save()
            messages.success(request, "Holiday Tour Tariff Added Successfully...!")
        return redirect("node_tariff", node_id=node_id)
    
    elif 'add_hr_tariff' in request.POST:
        name = request.POST['name']
        hours = request.POST['hours']
        kms = request.POST['kms']
        hatchback = request.POST['hrhatchback']
        seden = request.POST['hrseden']
        premiumSeden = request.POST['hrpremiumSeden']
        muv = request.POST['hrmuv']
        suv = request.POST['hrsuv']
        premiumSUV = request.POST['hrpremiumSUV']
        acTravellar = request.POST['hracTravellar']
        buses = request.POST['hrbuses']
        hatchbackWatingCharges = request.POST['hrhatchbackWatingCharges']
        sedenWatingCharges = request.POST['hrsedenWatingCharges']
        premiumSedenWatingCharges = request.POST['hrpremiumSedenWatingCharges']
        muvWatingCharges = request.POST['hrmuvWatingCharges']
        suvWatingCharges = request.POST['hrsuvWatingCharges']
        premiumSUVWatingCharges = request.POST['hrpremiumSUVWatingCharges']
        acTravellarWatingCharges = request.POST['hracTravellarWatingCharges']
        busesWatingCharges = request.POST['hrbusesWatingCharges']
        extraMin = request.POST['extraMin']
        extraKms = request.POST['extraKms']
        cancellationCharges = request.POST['hrcancellationCharges']
        misleniousCharges = request.POST['hrmisleniousCharges']

        # Check if a record with same node and name exists
        try:
            existing_tariff = HourlyRentalTariff.objects.get(
                node=node,
                name=name,
                hours=hours,
                kms=kms
            )
            # Update the existing record
            existing_tariff.hatchback = hatchback
            existing_tariff.seden = seden
            existing_tariff.premiumSeden = premiumSeden
            existing_tariff.muv = muv
            existing_tariff.suv = suv
            existing_tariff.premiumSUV = premiumSUV
            existing_tariff.acTravellar = acTravellar
            existing_tariff.buses = buses
            existing_tariff.hatchbackWatingCharges = hatchbackWatingCharges
            existing_tariff.sedenWatingCharges = sedenWatingCharges
            existing_tariff.premiumSedenWatingCharges = premiumSedenWatingCharges
            existing_tariff.muvWatingCharges = muvWatingCharges
            existing_tariff.suvWatingCharges = suvWatingCharges
            existing_tariff.premiumSUVWatingCharges = premiumSUVWatingCharges
            existing_tariff.acTravellarWatingCharges = acTravellarWatingCharges
            existing_tariff.busesWatingCharges = busesWatingCharges
            existing_tariff.extraMin = extraMin
            existing_tariff.extraKms = extraKms
            existing_tariff.cancellationCharges = cancellationCharges
            existing_tariff.misleniousCharges = misleniousCharges
            existing_tariff.save()
            messages.success(request, "Hourly Rental Tariff Updated Successfully...!")
        except HourlyRentalTariff.DoesNotExist:
            # Create new record if no match found
            new_hourly_rental_tariff = HourlyRentalTariff(
                node=node,
                name=name,
                hours=hours,
                kms=kms,
                hatchback=hatchback,
                seden=seden,
                premiumSeden=premiumSeden,
                muv=muv,
                suv=suv,
                premiumSUV=premiumSUV,
                acTravellar=acTravellar,
                buses=buses,
                hatchbackWatingCharges=hatchbackWatingCharges,
                sedenWatingCharges=sedenWatingCharges,
                premiumSedenWatingCharges=premiumSedenWatingCharges,
                muvWatingCharges=muvWatingCharges,
                suvWatingCharges=suvWatingCharges,
                premiumSUVWatingCharges=premiumSUVWatingCharges,
                acTravellarWatingCharges=acTravellarWatingCharges,
                busesWatingCharges=busesWatingCharges,
                extraMin=extraMin,
                extraKms=extraKms,
                cancellationCharges=cancellationCharges,
                misleniousCharges=misleniousCharges
            )
            new_hourly_rental_tariff.save()
            messages.success(request, "Hourly Rental Tariff Added Successfully...!")
        return redirect("node_tariff", node_id=node_id)
    
    return render(request, "node_tariff.html", context)


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def delete_airport_tariff(request, node_id, airport_tariff_id):
    airport_tariff = get_object_or_404(AirportTariff, id=airport_tariff_id)
    airport_tariff.delete()
    messages.success(request, "Airport Tariff Deleted Successfully...!")
    return redirect("node_tariff", node_id=node_id)


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def delete_railway_tariff(request, node_id, railway_tariff_id):
    railway_tariff = get_object_or_404(RailwayTariff, id=railway_tariff_id)
    railway_tariff.delete()
    messages.success(request, "Railway Tariff Deleted Successfully...!")
    return redirect("node_tariff", node_id=node_id)


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def delete_outstation_tariff(request, node_id, outstation_tariff_id):
    outstation_tariff = get_object_or_404(OutstationTariff, id=outstation_tariff_id)
    outstation_tariff.delete()
    messages.success(request, "Outstation Tariff Deleted Successfully...!")
    return redirect("node_tariff", node_id=node_id)


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def delete_holiday_tariff(request, node_id, holiday_tariff_id):
    holiday_tariff = get_object_or_404(HolidayTourTariff, id=holiday_tariff_id)
    holiday_tariff.delete()
    messages.success(request, "Holiday Tour Tariff Deleted Successfully...!")
    return redirect("node_tariff", node_id=node_id)


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def delete_hr_tariff(request, node_id, hr_tariff_id):
    hr_tariff = get_object_or_404(HourlyRentalTariff, id=hr_tariff_id)
    hr_tariff.delete()
    messages.success(request, "Hourly Rental Tariff Deleted Successfully...!")
    return redirect("node_tariff", node_id=node_id)


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def sign_out(request):
    logout(request)
    messages.success(request, "Log Out Successful...!")
    return redirect("sign_in")


def get_km_ranges(request, node_id):
    km_ranges = AirportTariff.objects.filter(node_id=node_id).values_list('kmRange', flat=True).distinct()
    return JsonResponse({'km_ranges': list(km_ranges)})

# -------------- Driver Details ------------------
@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def node_driver(request, node_id):
    node = get_object_or_404(Node, nodeID=node_id)
    nodes = Node.objects.all()
    # Unapproved drivers from this node
    drivers = DriverRegistration.objects.filter(node=node, is_approved=False)

    # All drivers (approved and unapproved) from this node
    all_drivers = DriverRegistration.objects.filter(node=node)

    context = {
        'page': 'node_driver/' + str(node_id),
        'user': request.user,
        'node': node,
        'nodes': nodes,
        'drivers': drivers,
        'all_drivers': all_drivers,  # filtered by same node
    }
    return render(request, "node_driver.html", context)


@login_required(login_url="")
def download_driver_report(request, driver_id):
    driver = get_object_or_404(DriverRegistration, id=driver_id)
    period = request.GET.get('period', '1month') # Default to 1 month

    end_date = datetime.now().date()
    if period == '15days':
        start_date = end_date - timedelta(days=15)
    elif period == '1month':
        start_date = end_date - timedelta(days=30)
    elif period == '3months':
        start_date = end_date - timedelta(days=90)
    elif period == '6months':
        start_date = end_date - timedelta(days=180)
    elif period == '1year':
        start_date = end_date - timedelta(days=365)
    else:
        start_date = end_date - timedelta(days=30) # Fallback

    # Filter completed trips for the specific driver within the selected period
    trips = Trip.objects.filter(
        driver_name=f"{driver.driverfirstname} {driver.driverlastname}",
        status='Completed',
        date__range=[start_date, end_date]
    ).order_by('date', 'time')

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="driver_{driver.driverfirstname}_{driver.driverlastname}_trips_{period}_report.csv"'

    writer = csv.writer(response)
    writer.writerow([
        'Booking ID', 'Date', 'Time', 'Passenger Name', 
        'From City', 'To City', 
        'Payment Type',
        'Total Amount', 
        'Extra Charges', 'Extra Total'
    ])

    for trip in trips:
        extra_charges_str = str(trip.extra_charges) if trip.extra_charges else ''
        writer.writerow([
            trip.booking_id, trip.date, trip.time, trip.passenger_name,
            trip.from_city, trip.to_city,
            trip.payment_type, 
            trip.total_amount, 
            extra_charges_str, trip.extra_total
        ])
    return response


@require_POST
def approve_driver(request, driver_id):
    driver = get_object_or_404(DriverRegistration, id=driver_id)

    vehicle_type = request.POST.get("vehicletype")
    if not vehicle_type:
        messages.error(request, "Vehicle type is required.")
        return redirect('node_driver', node_id=driver.node.nodeID)

    # Save vehicle type, mark as approved, and make inactive
    driver.vehicletype = vehicle_type
    driver.is_approved = True
    driver.is_active = False  # Make inactive after approval
    driver.save()

    messages.success(request, f"{driver.driverfirstname} approved.")
    return redirect('node_driver', node_id=driver.node.nodeID)



def reject_driver(request, driver_id):
    driver = get_object_or_404(DriverRegistration, id=driver_id)
    
    # Delete the rejected driver
    driver.delete()

    messages.warning(request, "Driver rejected and removed from database.")
    return redirect('node_driver', node_id=driver.node.nodeID)


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def view_driver(request, node_id, driver_id):
    node = get_object_or_404(Node, nodeID=node_id)
    nodes = Node.objects.all()
    driver = get_object_or_404(DriverRegistration, id=driver_id)

    # Add Remark
    if request.method == 'POST' and 'remark_text' in request.POST:
        remark_text = request.POST.get('remark_text').strip()
        if remark_text:
            DriverRemark.objects.create(driver=driver, remark_text=remark_text)
            messages.success(request, "Remark added successfully.")
        return redirect('view_driver', node_id=node_id, driver_id=driver_id)

    # Delete Remark
    if request.method == 'POST' and 'delete_remark_id' in request.POST:
        remark_id = request.POST.get('delete_remark_id')
        remark = get_object_or_404(DriverRemark, id=remark_id, driver=driver)
        remark.delete()
        messages.success(request, "Remark deleted successfully.")
        return redirect('view_driver', node_id=node_id, driver_id=driver_id)

    remarks = driver.remarks.order_by('-created_at')

    context = {
        'page': 'node_driver/' + str(node_id),
        'user': request.user,
        'node': node,
        'nodes': nodes,
        'driver': driver,
        'remarks': remarks,
    }
    return render(request, 'driver_view.html', context)


def add_driver(request, node_id):
    if request.method == 'POST':
        node = get_object_or_404(Node, nodeID=node_id)
        vehicle_number = request.POST.get('vehicle_number')
        vehicle_name = request.POST.get('vehicle_name')
        firstname = request.POST.get('driverfirstname')
        lastname = request.POST.get('driverlastname')
        mobile = request.POST.get('drivermobileno')
        city = node.nodeCity  # Automatically get city from node
        password = request.POST.get('driverpassword')
        confirm_password = request.POST.get('driverconfirmpassword')
        vehicletype = request.POST.get('vehicletype')

        # Optional: Add password confirmation validation
        if password != confirm_password:
            # Handle error appropriately (e.g., redirect back with error)
            return redirect('node_driver', node_id=node_id)
        
        # Check for existing driver by mobile number
        if DriverRegistration.objects.filter(drivermobileno=mobile).exists():
            messages.error(request, "A Vehicle with this mobile number is already registered.")
            return redirect('node_driver', node_id=node_id)

        # Check for existing driver by vehicle number
        if DriverRegistration.objects.filter(vehicle_number=vehicle_number).exists():
            messages.error(request, "A Vehicle Number is already registered.")
            return redirect('node_driver', node_id=node_id)

        # Create the new driver and automatically approve them
        DriverRegistration.objects.create(
            vehicle_number=vehicle_number,
            vehicle_name=vehicle_name,
            driverfirstname=firstname,
            driverlastname=lastname,
            drivermobileno=mobile,
            drivercity=city,
            driverpassword=password,
            node=node,
            vehicletype=vehicletype,
            is_approved=True  # Set driver as approved by default
        )

        # Redirect back to the node driver's page
        return redirect('node_driver', node_id=node_id)
    

def delete_driver(request,node_id, driver_id):
    driver = get_object_or_404(DriverRegistration, id=driver_id)
    node_id = node_id  # Get the node ID before deleting the driver
    driver.delete()
    messages.success(request, "Driver Deleted Successfully...!")
    return redirect('node_driver', node_id=node_id)


VEHICLE_TYPES = [
    "hatchback",
    "seden",
    "premiumSeden",
    "muv",
    "suv",
    "premiumSUV",
    "acTravellar",
    "buses",
]

@login_required(login_url="/")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def edit_driver(request, node_id, driver_id):
    node = get_object_or_404(Node, nodeID=node_id)
    driver = get_object_or_404(DriverRegistration, id=driver_id)

    if request.method == 'POST':
        # Basic Info
        driver.driverfirstname = request.POST.get('driverfirstname')
        driver.driverlastname = request.POST.get('driverlastname')
        driver.drivermobileno = request.POST.get('drivermobileno')
        driver.driverpassword = request.POST.get('driverpassword')
        driver.driveraddress = request.POST.get('driveraddress')
        driver.driverpincode = request.POST.get('driverpincode')
        driver.driverstate = request.POST.get('driverstate')
        driver.drivercity = request.POST.get('drivercity')
        driver.driverlicense_number = request.POST.get('driverlicense_number')
        driver.driver_aadhar_number = request.POST.get('driver_aadhar_number')

        # Bank Info
        driver.driverbank_name = request.POST.get('driverbank_name')
        driver.driveraccount_number = request.POST.get('driveraccount_number')
        driver.driverbranch_name = request.POST.get('driverbranch_name')
        driver.driverifsc_code = request.POST.get('driverifsc_code')

        # Vehicle Info
        driver.vehicletype = request.POST.get('vehicletype')
        driver.vehicle_number = request.POST.get('vehicle_number')
        driver.vehicle_name = request.POST.get('vehicle_name')

        # Vehicle Document Dates
        driver.registration_date = request.POST.get('registration_date') or None
        driver.registration_expiry_date = request.POST.get('registration_expiry_date') or None
        driver.insurance_start_date = request.POST.get('insurance_start_date') or None
        driver.insurance_expiry_date = request.POST.get('insurance_expiry_date') or None
        driver.fitness_certificate_date = request.POST.get('fitness_certificate_date') or None
        driver.fitness_certificate_expiry_date = request.POST.get('fitness_certificate_expiry_date') or None

        # File uploads
        if 'profile_picture' in request.FILES:
            driver.profile_picture = request.FILES['profile_picture']
        if 'license_picture' in request.FILES:
            driver.license_picture = request.FILES['license_picture']
        if 'aadhar_picture' in request.FILES:
            driver.aadhar_picture = request.FILES['aadhar_picture']
        if 'vehicle_insurance' in request.FILES:
            driver.vehicle_insurance = request.FILES['vehicle_insurance']
        if 'vehicle_tax_receipt' in request.FILES:
            driver.vehicle_tax_receipt = request.FILES['vehicle_tax_receipt']
        if 'fitness_certificate' in request.FILES:
            driver.fitness_certificate = request.FILES['fitness_certificate']
        if 'puc_certificate' in request.FILES:
            driver.puc_certificate = request.FILES['puc_certificate']

        driver.save()
        messages.success(request, "Driver details updated successfully.")
        return redirect('view_driver', node_id=node_id, driver_id=driver.id)

    context = {
        'node': node,
        'driver': driver,
        'vehicle_types': VEHICLE_TYPES,
    }
    return render(request, 'edit_driver.html', context)


def fetch_kmrange(request, node_id):
    try:
        # Fetch the Node by its nodeID field
        node = Node.objects.get(nodeID=node_id)

        # Fetch the tariffs related to that Node
        tariffs = AirportTariff.objects.filter(node=node)

        # Prepare the data to send back in JSON format
        km_ranges = [{'kmRange': tariff.kmRange} for tariff in tariffs]

        # Return the data as JSON
        return JsonResponse({'tariffs': km_ranges})
    
    except Node.DoesNotExist:
        # Return an empty response if the node does not exist
        return JsonResponse({'tariffs': []}, status=404)


def get_outstation_km_ranges(request):
    ranges = OutstationTariff.objects.values_list('km_range', flat=True).distinct()
    return JsonResponse({"km_ranges": list(ranges)})
    

def fetch_vehicle_types(request, node_id):
    # Retrieve distinct vehicle types for the given node_id
    vehicle_types = DriverRegistration.objects.filter(node=node_id).values_list('vehicletype', flat=True).distinct()
    return JsonResponse({'vehicle_types': list(vehicle_types)})


def fetch_active_drivers(request):
    vehicle_type = request.GET.get('vehicle_type', '')
    query = request.GET.get('query', '')

    if vehicle_type:
        driver_filter = Q(vehicletype__iexact=vehicle_type) & Q(is_active=True)

        # If query is given, add it to the filter
        if query:
            driver_filter &= Q(driverfirstname__icontains=query) | Q(vehicle_number__icontains=query)

        drivers = DriverRegistration.objects.filter(driver_filter).values(
            'driverfirstname', 'driverlastname', 'drivermobileno', 'vehicle_number', 'vehicle_name'
        )[:10]  # ⬅️ Limit result if needed

        suggestions = [f"{driver['driverfirstname']} - {driver['vehicle_number']}" for driver in drivers]
        detailed_data = list(drivers)

        return JsonResponse({
            'drivers': suggestions,
            'detailed_data': detailed_data
        })

    return JsonResponse({'drivers': [], 'detailed_data': []})

    
def fetch_airport_charges(request, node_id):
    vehicle_type = request.GET.get('vehicle_type')
    km_range = request.GET.get('km_range')

    if vehicle_type and km_range:
        try:
            tariff = AirportTariff.objects.get(node_id=node_id, kmRange=km_range)
            charges = getattr(tariff, vehicle_type, None)
            if charges is not None:
                print(node_id, vehicle_type, km_range, charges)
                return JsonResponse({'charges': charges})
            else:
                return JsonResponse({'error': f'Charges not found for vehicle type: {vehicle_type}'}, status=404)
        except AirportTariff.DoesNotExist:
            return JsonResponse({'error': 'No matching tariff found.'}, status=404)
    else:
        return JsonResponse({'error': 'Invalid parameters.'}, status=400)


def fetch_outstation_charges(request, node_id):
    vehicle_type = request.GET.get("vehicle_type")
    km_range = request.GET.get("km_range")

    try:
        tariff = OutstationTariff.objects.get(node_id=node_id, kmRange=km_range)
        rate = getattr(tariff, vehicle_type, None)

        if rate is not None:
            return JsonResponse({"charges": rate})
        else:
            print(vehicle_type, km_range, "No rate found")
            return JsonResponse({"error": f"No rate found for vehicle type '{vehicle_type}'."})
    except OutstationTariff.DoesNotExist:
        return JsonResponse({"error": "Tariff not found for given node and km range."})
    except Exception as e:
        return JsonResponse({"error": str(e)})
    

def fetch_extra_charges(request, node_id):
    node = get_object_or_404(Node, nodeID=node_id)

    try:
        fixed_tariff = FixedTariff.objects.get(node=node)
        terminalCharges = fixed_tariff.fixedTerminalCharges
        surcharges = fixed_tariff.fixedSurCharges
        taxes = fixed_tariff.fixedTax
    except FixedTariff.DoesNotExist:
        terminalCharges = 0
        surcharges = 0
        taxes = 0

    return JsonResponse({
        'terminalCharges': terminalCharges,
        'surcharges': surcharges,
        'taxes': taxes,
    })


def fetch_holidaytour_packages(request, node_id):
    query = request.GET.get('query', '')
    print(f"Fetching holiday tour packages for node {node_id} with query '{query}'")
    packages = HolidayTourTariff.objects.filter(node__nodeID=node_id)

    if query:
        packages = packages.filter(packageName__icontains=query)

    suggestions = list(packages.values_list('packageName', flat=True).distinct())
    return JsonResponse({'packages': suggestions})

    
def fetch_holidaytour_charges(request, node_id):
    vehicle_type = request.GET.get('vehicle_type')
    try:
        tariff = HolidayTourTariff.objects.get(node__nodeID=node_id)
        charges = getattr(tariff, vehicle_type.lower())  # e.g., 'suv'
        return JsonResponse({'charges': charges})
    except Exception as e:
        return JsonResponse({'error': str(e)})


def fetch_hourly_options(request, node_id):
    tariffs = HourlyRentalTariff.objects.filter(node__nodeID=node_id)
    options = list(tariffs.values_list('hours', 'kms'))
    combined = [f"{h} - {k} KM" for h, k in options]
    return JsonResponse({'options': combined})


def fetch_hourly_charges(request, node_id):
    vehicle_type = request.GET.get('vehicle_type')
    hours = request.GET.get('hours')
    kms = request.GET.get('kms')

    try:
        record = HourlyRentalTariff.objects.get(
            node__nodeID=node_id,
            hours=hours,
            kms=kms
        )
        charge = getattr(record, vehicle_type.lower())  # dynamic field access
        return JsonResponse({'charges': charge})
    except Exception as e:
        return JsonResponse({'error': str(e)})
    
    
def fetch_railway_transfer_packages(request, node_id):
    query = request.GET.get('query', '').strip().lower()
    packages = RailwayTariff.objects.filter(node_id=node_id)

    if query:
        packages = packages.filter(railwayStationName__icontains=query)
        print(f"Filtered packages for query '{query}': {packages}")

    suggestions = list(packages.values_list('railwayStationName', flat=True))
    return JsonResponse({'packages': suggestions})


def fetch_railway_charges(request, node_id):
    vehicle_type = request.GET.get('vehicle_type', '').strip()

    try:
        tariff = RailwayTariff.objects.get(node=node_id)
        print(tariff, vehicle_type)
        charges = getattr(tariff, vehicle_type.lower())  # e.g., 'suv'
        return JsonResponse({'charges': charges})
    
    except Exception as e:
        return JsonResponse({'error': str(e)})


def generate_booking_id(request):
    base_id = request.GET.get('base_id', '')
    if not base_id:
        return JsonResponse({'status': 'error', 'message': 'Base ID missing'}, status=400)

    count = Trip.objects.filter(booking_id__startswith=base_id).count() + 1
    counter = str(count).zfill(3)  # e.g., 001
    booking_id = base_id + counter

    return JsonResponse({'status': 'success', 'booking_id': booking_id})


#----------------- Trip and OTP Management -----------------

def send_sms_fast2sms(phone_number, message):
    if not isinstance(phone_number, str):
        phone_number = str(phone_number)

    if not phone_number.isdigit() or len(phone_number) != 10:
        return {"error": "Invalid phone number format. Use 10-digit Indian number only."}

    url = "https://www.fast2sms.com/dev/bulkV2"
    headers = {
        'authorization': '2Xor5ze4MOasblRcf7HEmvCdUxQG1nLyi6BZuj9wW0Y3NKqtkAbKND0TtjC73oHYs5QOS9hRJnvB468Z',
        'Content-Type': 'application/json'
    }

    payload = {
        "route": "q",
        "sender_id": "TXTIND",
        "message": message,
        "language": "english",
        "flash": 0,
        "numbers": phone_number
    }

    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# def send_sms_fast2sms(phone_number, otp_message):
#     if not isinstance(phone_number, str):
#         phone_number = str(phone_number)

#     if not phone_number.isdigit() or len(phone_number) != 10:
#         return {"error": "Invalid phone number format. Use 10-digit Indian number only."}

#     url = "https://www.fast2sms.com/dev/bulkV2"
#     params = {
#         "authorization": "2M0yKwGzcBqdfe5nmEVPXiolp1D9IWuv6abQHA4Jr3LSOkjTCsNsaBLO8GjtATvC3yFxoIic5qESXbmw",
#         "route": "otp",
#         "variables_values": otp_message,  # Plain message or values for your template
#         "numbers": phone_number,
#         "flash": "0"
#     }

#     response = requests.get(url, params=params)
#     return response.json()


def safe_value(value, default="-"):
    return value if value not in [None, "", "undefined"] else default


def generate_otp():
    return ''.join(random.choices(string.digits, k=5))


@csrf_exempt
def save_trip_after_payment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            otp = generate_otp()
            trip = Trip.objects.create(
                date=data['date'],
                time=data['time'],
                booking_id=safe_value(data.get('booking_id')),
                passenger_name=safe_value(data.get('passenger_name')),
                contact_number=safe_value(data.get('contact_number')),
                email_id=safe_value(data.get('email_id')),
                otp=otp,
                from_city=safe_value(data.get('from_city')),
                to_city=safe_value(data.get('to_city')),
                vehicle_type=safe_value(data.get('vehicle_type')),
                driver_name=safe_value(data.get('driver_name')),
                vehicle_number=safe_value(data.get('vehicle_number')),
                driver_contact=safe_value(data.get('driver_contact')),
                payment_type=safe_value(data.get('payment_type')),
                base_fare=data.get('base_fare') or 0,
                discount=data.get('discount') or 0,
                terminal_charges=data.get('terminal_charges') or 0,
                surcharges=data.get('surcharges') or 0,
                taxes=safe_value(data.get('taxes')),
                total_amount=data.get('total_amount') or 0,
                status="Pending",
                extra_charges=data.get('extra_charges') or {},
                extra_total=data.get('extra_total') or 0,
                
            )

            return JsonResponse({'success': True, 'trip_id': trip.id, 'otp': otp})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})


# from django.shortcuts import render, get_object_or_404, redirect
# from django.views.decorators.csrf import csrf_exempt

# @csrf_exempt
# def verify_trip_otp(request, trip_id):
#     context = {'trip_id': trip_id}
    
#     if request.method == 'POST':
#         input_otp = request.POST.get('otp')
#         trip = get_object_or_404(Trip, booking_id=trip_id)
        
#         if trip.otp == input_otp:
#             trip.otp_verified = True
#             trip.save()
#             # Redirect to ongoing_trip page after success
#             return redirect('ongoing_trip')  # Make sure 'ongoing_trip' is the name of your URL pattern
#         else:
#             context['message'] = "Invalid OTP. Please try again."
#             context['success'] = False

#         return render(request, 'testotp.html', context)
    
#     # GET request - show form
#     return render(request, 'testotp.html', context)



#----------------- Employee Management -----------------


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def add_employee(request):
    if request.method == 'POST':
        try:
            node_id = request.POST.get('empNodeID')
            employee = Employee(
                empNodeID=Node.objects.get(pk=node_id),
                employeeName=request.POST.get('employeeName'),
                employeeEmail=request.POST.get('employeeEmail'),
                employeeMobile=request.POST.get('employeeMobile'),
                employeeRole=request.POST.get('employeeRole'),
                employeeAddress=request.POST.get('employeeAddress'),
                password=request.POST.get('password'),
                empSalary=request.POST.get('empSalary'),
                empJoiningDate=request.POST.get('empJoiningDate'),
                employeeAadhar=request.POST.get('employeeAadhar')
            )
            employee.save()
            add_emp = User.objects.create_user(
                username=employee.employeeMobile,
                password=employee.password,
                first_name=employee.employeeName,
                last_name=employee.employeeRole
            )
            add_emp.save()
            messages.success(request, "Employee added successfully!")
            return redirect('employee')
        except Exception as e:
            messages.error(request, f"Error: {e}")
    
    nodes = Node.objects.all()
    return render(request, "add_employee.html", {'nodes': nodes})


@login_required(login_url="")
@cache_control(no_cache=True, must_revalidate=True, no_store=True)
def employee(request):
    nodes = Node.objects.all()
    employees = Employee.objects.select_related('empNodeID').all()

    context = {
        'page' : 'admin_dashboard',
        'user' : request.user,
        'nodes' : nodes,
        'employees': employees,
    }
    return render(request, "employee.html", context)


def delete_employee(request, emp_id):
    employee = get_object_or_404(Employee, id=emp_id)
    employee.delete()
    messages.success(request, "Employee deleted successfully.")
    return redirect('employee')  # Replace with your actual redirect view

@require_POST
def edit_employee(request):
    emp_id = request.POST.get('emp_id')
    employee = get_object_or_404(Employee, id=emp_id)

    # Update fields from POST data
    employee.employeeName = request.POST.get('employeeName')
    employee.employeeEmail = request.POST.get('employeeEmail')
    employee.employeeMobile = request.POST.get('employeeMobile')
    employee.employeeRole = request.POST.get('employeeRole')
    employee.employeeAddress = request.POST.get('employeeAddress')
    employee.empSalary = request.POST.get('empSalary')
    employee.empJoiningDate = request.POST.get('empJoiningDate')
    employee.employeeAadhar = request.POST.get('employeeAadhar')

    employee.save()
    messages.success(request, "Employee details updated successfully.")
    return redirect('employee')  # Replace with your redirect URL name


@csrf_exempt
def update_availability(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        emp_id = data.get('emp_id')
        new_status = data.get('is_available')

        try:
            emp = Employee.objects.get(id=emp_id)
            emp.is_available = new_status
            emp.save()
            return JsonResponse({'status': 'success'})
        except Employee.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Employee not found'}, status=404)

    return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


def trips(request):
    all_trips = Trip.objects.all().order_by('-date', '-time')
    nodes = Node.objects.all()
    context = {
        'page' : 'admin_dashboard',
        'user' : request.user,
        'nodes' : nodes,
        'trips' : all_trips
    }
    return render(request, "trips.html", context)


@csrf_exempt
def cancel_trip(request, trip_id):
    if request.method == "POST":
        try:
            trip = Trip.objects.get(id=trip_id)
            if trip.status == 'Pending':
                trip.status = 'Cancelled'
                trip.save()
                return JsonResponse({'success': True})
            else:
                return JsonResponse({'success': False, 'error': 'Trip cannot be cancelled.'})
        except Trip.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Trip not found.'})
    return JsonResponse({'success': False, 'error': 'Invalid request method.'})


def trip_list_view(request, node_id, status):
    node = get_object_or_404(Node, nodeID=node_id)

    selected_date_str = request.GET.get('date')
    if selected_date_str:
        try:
            selected_date = parse_date(selected_date_str)
        except ValueError:
            selected_date = now().date()
    else:
        selected_date = now().date()

    trips = Trip.objects.filter(
        Q(booking_id__icontains=node.nodeInitials),
        status__iexact=status,
        date=selected_date
    )

    context = {
        'node': node,
        'status': status.capitalize(),
        'trips': trips,
        'selected_date': selected_date,
        'user': request.user,
    }
    return render(request, "trip_list.html", context)


@csrf_exempt
def update_trip_driver(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            booking_id = data.get('booking_id')
            trip = Trip.objects.get(booking_id=booking_id)

            trip.driver_name = data.get('driver_name', '-')
            trip.vehicle_number = data.get('vehicle_number', '-')
            trip.driver_contact = data.get('driver_contact', '-')
            trip.save()

            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})