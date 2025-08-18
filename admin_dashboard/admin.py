from django.contrib import admin
from .models import *
# Register your models here.
admin.site.register(Node)
admin.site.register(FixedTariff)
admin.site.register(AirportTariff)
admin.site.register(RailwayTariff)
admin.site.register(OutstationTariff)
admin.site.register(HolidayTourTariff)
admin.site.register(HourlyRentalTariff)
admin.site.register(Employee)
admin.site.register(Trip)
admin.site.register(TripLocation)