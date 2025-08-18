
from django.http import JsonResponse
from .models import *

def get_tariff_details(request, node_id, km_range, vehicle_type):
    try:
        fixed = FixedTariff.objects.get(node_id=node_id)
        airport_tariff = AirportTariff.objects.get(node_id=node_id, kmRange=km_range)

        # Use getattr to get the dynamic field name like 'suv', 'seden', etc.
        tariff_value = getattr(airport_tariff, vehicle_type, None)

        return JsonResponse({
            'fixedTerminalCharges': fixed.fixedTerminalCharges,
            'fixedSurCharges': fixed.fixedSurCharges,
            'fixedTax': fixed.fixedTax,
            'vehicleTariff': tariff_value,
        })
    except (FixedTariff.DoesNotExist, AirportTariff.DoesNotExist):
        return JsonResponse({'error': 'Tariff data not found.'}, status=404)
    
def get_active_drivers(request):
    node_id = request.GET.get('node_id')
    vehicle_type = request.GET.get('vehicle_type')
    drivers = Driver.objects.filter(
        node_id=node_id,
        vehicleType=vehicle_type,
        isActive=True
    ).values('id', 'name', 'contact')
    return JsonResponse({'drivers': list(drivers)})