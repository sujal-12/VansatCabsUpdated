from django.db import models
import os

# === DRIVER DOCUMENT UPLOAD UTILITIES ===
def driver_upload_path(instance, filename, folder):
    name = f"{instance.driverfirstname}_{instance.driverlastname}".replace(" ", "_")
    return os.path.join(f"drivers/{name}/{folder}/", filename)

def upload_profile_picture(instance, filename):
    return driver_upload_path(instance, filename, "profile")

def upload_license_picture(instance, filename):
    return driver_upload_path(instance, filename, "license")

def upload_aadhar_picture(instance, filename):
    return driver_upload_path(instance, filename, "aadhar")


# === VEHICLE DOCUMENT UPLOAD UTILITIES (inside driver's folder) ===
def vehicle_upload_path(instance, filename, folder):
    driver_name = f"{instance.driverfirstname}_{instance.driverlastname}".replace(" ", "_")
    vehicle_number = instance.vehicle_number.replace(" ", "_") if instance.vehicle_number else "unknown_vehicle"
    return os.path.join(f"drivers/{driver_name}/vehicles/{vehicle_number}/{folder}/", filename)

def upload_tax_receipt(instance, filename):
    return vehicle_upload_path(instance, filename, "tax_receipts")

def upload_insurance(instance, filename):
    return vehicle_upload_path(instance, filename, "insurance")

def upload_fitness(instance, filename):
    return vehicle_upload_path(instance, filename, "fitness")

def upload_puc(instance, filename):
    return vehicle_upload_path(instance, filename, "puc")


# === DRIVER REGISTRATION MODEL WITH VEHICLE DETAILS ===
class DriverRegistration(models.Model):
    node = models.ForeignKey('admin_dashboard.Node', on_delete=models.CASCADE)
    
    # Driver info
    driverfirstname = models.CharField(max_length=100)
    driverlastname = models.CharField(max_length=100)
    drivermobileno = models.CharField(max_length=10, unique=True)
    driverpassword = models.CharField(max_length=255)
    driveraddress = models.TextField()
    driverpincode = models.CharField(max_length=6)
    driverstate = models.CharField(max_length=100)
    drivercity = models.CharField(max_length=100)
    driverlicense_number = models.CharField(max_length=20, unique=True)
    driver_aadhar_number = models.CharField(max_length=12, unique=True)
    driverbank_name = models.CharField(max_length=100)
    driveraccount_number = models.CharField(max_length=20, unique=True)
    driverbranch_name = models.CharField(max_length=100)
    driverifsc_code = models.CharField(max_length=11, unique=True)

    profile_picture = models.ImageField(upload_to=upload_profile_picture, null=True, blank=True)
    license_picture = models.ImageField(upload_to=upload_license_picture, null=True, blank=True)
    aadhar_picture = models.ImageField(upload_to=upload_aadhar_picture, null=True, blank=True)

    # Vehicle info (merged)
    vehicletype = models.CharField(max_length=50, null=True, blank=True)
    vehicle_number = models.CharField(max_length=20, null=True, blank=True, unique=True)
    vehicle_name = models.CharField(max_length=100, null=True, blank=True)
    registration_date = models.DateField(null=True, blank=True)
    registration_expiry_date = models.DateField(null=True, blank=True)
    insurance_start_date = models.DateField(null=True, blank=True)
    insurance_expiry_date = models.DateField(null=True, blank=True)
    fitness_certificate_date = models.DateField(null=True, blank=True)
    fitness_certificate_expiry_date = models.DateField(null=True, blank=True)

    vehicle_tax_receipt = models.ImageField(upload_to=upload_tax_receipt, null=True, blank=True)
    vehicle_insurance = models.ImageField(upload_to=upload_insurance, null=True, blank=True)
    fitness_certificate = models.ImageField(upload_to=upload_fitness, null=True, blank=True)
    puc_certificate = models.ImageField(upload_to=upload_puc, null=True, blank=True)

    # Status
    is_approved = models.BooleanField(default=False)
    is_profile_complete = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.driverfirstname} {self.driverlastname}"


class DriverRemark(models.Model):
    driver = models.ForeignKey(DriverRegistration, on_delete=models.CASCADE, related_name='remarks')
    remark_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Remark for {self.driver.driverfirstname} {self.driver.driverlastname}"
