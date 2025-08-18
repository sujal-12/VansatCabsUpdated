from django.contrib import admin
from django.urls import path
from driver import views


urlpatterns = [
    path("driver_register", views.driver_register, name= "driver_register"),
    path("driver_login", views.driver_login, name= "driver_login"),
    path("mobileapp", views.mobileapp, name= "mobileapp"),
    path("driver_profile", views.driver_profile, name= "driver_profile"),
    path("driver_slider", views.driver_slider, name= "driver_slider"),
    path('logout', views.driver_logout, name='driver_logout'),
    path("vehicle_details", views.vehicle_details, name= "vehicle_details"),
    path('verify-otp/<str:trip_id>/', views.verify_trip_otp, name='verify_trip_otp'),
    # path("ongoing_trip", views.ongoing_trip, name= "ongoing_trip"),
    path("completedtrips", views.completedtrips, name= "completedtrips"),
    path('toggle-status', views.toggle_driver_status, name='toggle_driver_status'),
    path("cancelledtrips", views.cancelledtrips, name= "cancelledtrips"),
    path("report", views.report, name= "report"),
    path("start_trip", views.start_trip, name= "start_trip"),
    path("complete_trip", views.complete_trip, name= "complete_trip"),
    path("notifications", views.notifications, name= "notifications"),
    path("settings", views.settings, name= "settings"),
    path("pendingtrips", views.pendingtrips, name= "pendingtrips"),
    path('alltrips', views.alltrips, name='alltrips'),
    path('download-report', views.download_report, name='download_report'),
    path('update_location', views.update_location, name="update_location"),
]