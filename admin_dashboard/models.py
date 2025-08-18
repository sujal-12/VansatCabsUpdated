from django.db import models
from django.utils import timezone
import io
import os
from reportlab.lib.pagesizes import A4, letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepInFrame
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch, mm
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.core.mail import EmailMessage
from django.conf import settings
from reportlab.lib.utils import simpleSplit
from django.templatetags.static import static
from decimal import Decimal
from django.core.mail import send_mail
import json # Import json to handle JSONField data

# Create your models here.
class Node(models.Model):
    nodeID = models.AutoField(primary_key=True)
    nodeInitials = models.CharField(max_length=50)
    nodeName = models.CharField(max_length=50)
    nodeAddress = models.TextField()
    nodeCity = models.CharField(max_length=50)
    nodeState = models.CharField(max_length=50)
    nodePincode = models.CharField(max_length=50)
    coordinatorName = models.CharField(max_length=50)
    helplineNumber = models.CharField(max_length=50)
    nodeLatitude = models.CharField(max_length=100)  # Latitude, Longitude
    nodeLongitude = models.CharField(max_length=100)  # Latitude, Longitude

    def __str__(self):
        return str(self.nodeID)
    
class FixedTariff(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    fixedTerminalCharges = models.FloatField()
    fixedSurCharges = models.FloatField()
    fixedTax = models.FloatField()
    vansatCommission = models.FloatField()
    driverCommission = models.FloatField()

    def __str__(self):
        return str(self.node.nodeID)
    
class AirportTariff(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    kmRange = models.CharField(max_length=50)
    hatchback = models.FloatField()
    seden = models.FloatField()
    premiumSeden = models.FloatField()
    muv = models.FloatField()
    suv = models.FloatField()
    premiumSUV = models.FloatField()
    acTravellar = models.FloatField()
    buses = models.FloatField()
    hatchbackWatingCharges = models.FloatField()
    sedenWatingCharges = models.FloatField()
    premiumSedenWatingCharges = models.FloatField()
    muvWatingCharges = models.FloatField()
    suvWatingCharges = models.FloatField()
    premiumSUVWatingCharges = models.FloatField()
    acTravellarWatingCharges = models.FloatField()
    busesWatingCharges = models.FloatField()
    cancellationCharges = models.FloatField()
    misleniousCharges = models.FloatField()
    
    def __str__(self):
        return f"Node ID: {self.node.nodeID}, KM Range: {self.kmRange}"

    
class RailwayTariff(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    railwayStationName = models.CharField(max_length=50)
    hatchback = models.FloatField()
    seden = models.FloatField()
    premiumSeden = models.FloatField()
    muv = models.FloatField()
    suv = models.FloatField()
    premiumSUV = models.FloatField()
    acTravellar = models.FloatField()
    buses = models.FloatField()
    hatchbackWatingCharges = models.FloatField()
    sedenWatingCharges = models.FloatField()
    premiumSedenWatingCharges = models.FloatField()
    muvWatingCharges = models.FloatField()
    suvWatingCharges = models.FloatField()
    premiumSUVWatingCharges = models.FloatField()
    acTravellarWatingCharges = models.FloatField()
    busesWatingCharges = models.FloatField()
    cancellationCharges = models.FloatField()
    misleniousCharges = models.FloatField()

    def __str__(self):
        return str(self.node.nodeID)

class OutstationTariff(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    kmRange = models.CharField(max_length=50)
    hatchback = models.FloatField()
    seden = models.FloatField()
    premiumSeden = models.FloatField()
    muv = models.FloatField()
    suv = models.FloatField()
    premiumSUV = models.FloatField()
    acTravellar = models.FloatField()
    buses = models.FloatField()
    hatchbackWatingCharges = models.FloatField()
    sedenWatingCharges = models.FloatField()
    premiumSedenWatingCharges = models.FloatField()
    muvWatingCharges = models.FloatField()
    suvWatingCharges = models.FloatField()
    premiumSUVWatingCharges = models.FloatField()
    acTravellarWatingCharges = models.FloatField()
    busesWatingCharges = models.FloatField()
    cancellationCharges = models.FloatField()
    misleniousCharges = models.FloatField()

    def __str__(self):
        return str(self.node.nodeID)
    
class HolidayTourTariff(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    packageName = models.CharField(max_length=50)
    hatchback = models.FloatField()
    seden = models.FloatField()
    premiumSeden = models.FloatField()
    muv = models.FloatField()
    suv = models.FloatField()
    premiumSUV = models.FloatField()
    acTravellar = models.FloatField()
    buses = models.FloatField()
    hatchbackWatingCharges = models.FloatField()
    sedenWatingCharges = models.FloatField()
    premiumSedenWatingCharges = models.FloatField()
    muvWatingCharges = models.FloatField()
    suvWatingCharges = models.FloatField()
    premiumSUVWatingCharges = models.FloatField()
    acTravellarWatingCharges = models.FloatField()
    busesWatingCharges = models.FloatField()
    cancellationCharges = models.FloatField()
    misleniousCharges = models.FloatField()

    def __str__(self):
        return str(self.node.nodeID)
    

class HourlyRentalTariff(models.Model):
    node = models.ForeignKey(Node, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    hours = models.CharField(max_length=50)
    kms = models.CharField(max_length=50)
    hatchback = models.FloatField()
    seden = models.FloatField()
    premiumSeden = models.FloatField()
    muv = models.FloatField()
    suv = models.FloatField()
    premiumSUV = models.FloatField()
    acTravellar = models.FloatField()
    buses = models.FloatField()
    hatchbackWatingCharges = models.FloatField()
    sedenWatingCharges = models.FloatField()
    premiumSedenWatingCharges = models.FloatField()
    muvWatingCharges = models.FloatField()
    suvWatingCharges = models.FloatField()
    premiumSUVWatingCharges = models.FloatField()
    acTravellarWatingCharges = models.FloatField()
    busesWatingCharges = models.FloatField()
    extraMin = models.FloatField()
    extraKms = models.FloatField()
    cancellationCharges = models.FloatField()
    misleniousCharges = models.FloatField()

    def __str__(self):
        return str(self.node.nodeID)
    
class Employee(models.Model):
    empNodeID = models.ForeignKey(Node, on_delete=models.CASCADE)
    employeeName = models.CharField(max_length=50)
    employeeEmail = models.EmailField()
    employeeMobile = models.CharField(max_length=10)
    employeeRole = models.CharField(max_length=50)
    employeeAddress = models.TextField()
    password = models.CharField(max_length=100)
    empSalary = models.DecimalField(max_digits=10, decimal_places=2)
    empJoiningDate = models.DateField()
    employeeAadhar = models.CharField(max_length=12)

    # Add this line
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.employeeName


# Helper function to convert numbers to words (Indian system)
def numbers_to_words(number):
    """
    Converts a number to Indian currency words.
    """
    number = int(number)
    if number == 0:
        return "Zero Rupees Only"

    def get_words(n):
        units = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
        tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
        
        words = []
        if n // 10000000 > 0:
            words.append(get_words(n // 10000000) + ' crore')
            n %= 10000000
        if n // 100000 > 0:
            words.append(get_words(n // 100000) + ' lakh')
            n %= 100000
        if n // 1000 > 0:
            words.append(get_words(n // 1000) + ' thousand')
            n %= 1000
        if n // 100 > 0:
            words.append(units[n // 100] + ' hundred')
            n %= 100
        if n > 0:
            if n < 20:
                words.append(units[n])
            else:
                words.append(tens[n // 10])
                if n % 10 > 0:
                    words.append(units[n % 10])
        
        return ' '.join(words)

    amount_in_words = get_words(number)
    return amount_in_words.strip().capitalize() + " Rupees Only"


# Assuming you have a `numbers_to_words` function defined somewhere
# and Node and FixedTariff models defined as well.

class Trip(models.Model):
    date = models.DateField()
    time = models.TimeField()
    booking_id = models.CharField(max_length=100, unique=True)
    
    passenger_name = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=15)
    email_id = models.EmailField()
    otp = models.CharField(max_length=5, unique=True)
    otp_verified = models.BooleanField(default=False)

    from_city = models.CharField(max_length=100)
    to_city = models.CharField(max_length=100)
    vehicle_type = models.CharField(max_length=50)
    driver_name = models.CharField(max_length=100)
    vehicle_number = models.CharField(max_length=20)
    driver_contact = models.CharField(max_length=15)
    
    payment_type = models.CharField(max_length=20)
    base_fare = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2)
    terminal_charges = models.DecimalField(max_digits=10, decimal_places=2)
    surcharges = models.DecimalField(max_digits=10, decimal_places=2)
    taxes = models.CharField(max_length=10)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    payment_status = models.CharField(max_length=100)
    gst_number = models.CharField(max_length=15)
    company_name = models.CharField(max_length=100)

    # New fields for commissions
    vansat_commission = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    driver_commission = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='Pending')

    extra_charges = models.JSONField(null=True, blank=True)
    extra_total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # New fields for trip timing
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_time = models.DurationField(null=True, blank=True)

    def __str__(self):
        return f"Trip {self.booking_id}"

    def save(self, *args, **kwargs):
        if self.extra_charges and 'payment_method' in self.extra_charges:
            self.payment_type = self.extra_charges['payment_method']
        
        is_new_trip = not self.pk
        original_status = None
        if not is_new_trip:
            try:
                original_trip = Trip.objects.get(pk=self.pk)
                original_status = original_trip.status
            except Trip.DoesNotExist:
                pass # This should not happen, but as a safeguard

        super().save(*args, **kwargs)

        if not is_new_trip and original_status != 'Completed' and self.status == 'Completed':
            if self.start_time and self.end_time:
                self.total_time = self.end_time - self.start_time
                self.save(update_fields=['total_time'])
            self.calculate_commissions()
            self.send_completion_email()
            
    def calculate_commissions(self):
        """
        Calculates and updates Vansat's and the driver's commission based on the total amount.
        Assumes there's a FixedTariff entry linked to the trip's start city node.
        """
        try:
            node = Node.objects.get(nodeName=self.from_city)
            tariff = FixedTariff.objects.get(node=node)

            vansat_rate = Decimal(tariff.vansatCommission) / 100
            driver_rate = Decimal(tariff.driverCommission) / 100

            self.vansat_commission = self.total_amount * vansat_rate
            self.driver_commission = self.total_amount * driver_rate

            self.save(update_fields=['vansat_commission', 'driver_commission'])
            print(f"Commissions calculated for Trip {self.booking_id}: Vansat: {self.vansat_commission}, Driver: {self.driver_commission}")
        except (Node.DoesNotExist, FixedTariff.DoesNotExist) as e:
            print(f"Could not find commission rates for trip {self.booking_id}: {e}")
            self.vansat_commission = Decimal('0.00')
            self.driver_commission = Decimal('0.00')
            self.save(update_fields=['vansat_commission', 'driver_commission'])

    def generate_invoice_pdf(self):
        """Generate a PDF invoice for the trip with the specified format."""
        buffer = io.BytesIO()

        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5 * inch, bottomMargin=0.5 * inch,
                                leftMargin=0.75 * inch, rightMargin=0.75 * inch)

        styles = getSampleStyleSheet()
        doc_width = letter[0] - doc.leftMargin - doc.rightMargin

        # Custom styles for better alignment
        title_style = ParagraphStyle(name='Title', fontSize=14, leading=18, alignment=1, fontName='Helvetica-Bold')
        subtitle_style = ParagraphStyle(name='Subtitle', fontSize=15, leading=16, alignment=1, spaceAfter=10, fontName='Helvetica-Bold')
        heading_style = ParagraphStyle(name='Heading', fontSize=10, leading=12, spaceAfter=5, fontName='Helvetica-Bold')
        normal_style = ParagraphStyle(name='Normal', fontSize=9, leading=11, spaceAfter=3, fontName='Helvetica')
        bold_style = ParagraphStyle(name='Bold', fontSize=9, leading=11, spaceAfter=3, fontName='Helvetica-Bold')
        contact_style = ParagraphStyle(name='Contact', fontSize=11, leading=13, spaceAfter=6, alignment=1, fontName='Helvetica-Bold')
        footer_style = ParagraphStyle(name='Footer', fontSize=8, leading=10, alignment=1, spaceBefore=8, fontName='Helvetica')
        
        # New style for the total amount to increase font size
        total_amount_style = ParagraphStyle(name='TotalAmountStyle', fontSize=13, leading=15, fontName='Helvetica-Bold')
        
        # New style for the total amount label to align right
        total_label_style = ParagraphStyle(name='TotalLabelStyle', fontSize=11, leading=13, spaceAfter=3, fontName='Helvetica-Bold', alignment=4) # Alignment 4 is for RIGHT
        
        # Style for the amount in words to be a part of the table
        amount_in_words_table_style = ParagraphStyle(name='AmountInWordsTable', fontSize=9, leading=11, fontName='Helvetica', alignment=4)
        
        elements = []

        # Header Section (Logo and Title)
        logo_path_eng = "driver/static/images/vansateng.png"
        logo_path_hindi = "driver/static/images/vansathindi.png"

        header_table = Table([[
            Image(logo_path_eng, width=1.8 * inch, height=0.9 * inch),
            Paragraph("NASHIK AIRPORT TAXI", title_style),
            Image(logo_path_hindi, width=1.8 * inch, height=0.9 * inch)                                             
        ]], colWidths=[doc_width / 3, doc_width / 3, doc_width / 3])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(header_table)
        elements.append(Paragraph("INVOICE", subtitle_style))
        elements.append(Spacer(1, 0.1 * inch))

        # Two-Column Details Section
        details_table = Table([
            [
                Paragraph("<b>Vansat Cabs - Nashik Airport Taxi</b>", heading_style),
                Paragraph(f"<b>Date:</b> {self.date.strftime('%d/%m/%Y')}", normal_style)
            ],
            [
                Paragraph(f"<b>A Vansat Technologies' Initiative</b><br/>"
                          f"Office no. 1-2, Krishnakamal Building, 4403, Nath Lane,<br/>"
                          f"nr. Panchavati Karanja, Panchavati,<br/>"
                          f"Nashik - 422003 (MH, India)<br/>"
                          f"Contact: 7262025025/7263025025<br/>"
                          f"<b>GSTIN: 27ARBPG2111L1Z6</b>", normal_style),
                Paragraph(f"<b>Invoice No.:</b> {self.booking_id}<br/>"
                          f"<b>Booking ID:</b> {self.booking_id}<br/>"
                          f"<b>Vehicle Type:</b> {self.vehicle_type}<br/>"
                          f"<b>Vehicle No.:</b> {self.vehicle_number}<br/>"
                          f"<b>Driver Name:</b> {self.driver_name}<br/>"
                          f"<b>Driver Contact:</b> {self.driver_contact}", normal_style)
            ],
            [
                Paragraph("<b>Bill To:</b>", heading_style),
                ''
            ],
            [
                Paragraph(f"<b>Customer Name:</b> {self.passenger_name}<br/>"
                          f"<b>Contact:</b> {self.contact_number}<br/>"
                          f"<b>Email:</b> {self.email_id}", normal_style),
                ''
            ],
            [
                Paragraph(f"<b>From:</b> {self.from_city}", bold_style),
                Paragraph(f"<b>To:</b> {self.to_city}", bold_style)
            ]
        ], colWidths=[doc_width/2, doc_width/2])
        details_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 1), 'RIGHT'),
            ('ALIGN', (0, 4), (1, 4), 'CENTER'),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 0.1 * inch))

        # Invoice Table
        table_data = [
            [
                Paragraph("<b>Sr. No.</b>", bold_style),
                Paragraph("<b>Description</b>", bold_style),
                Paragraph("<b>Amount (INR)</b>", bold_style)
            ],
            [1, Paragraph("Base Fare", normal_style), f"{self.base_fare:.2f}"],
            [2, Paragraph("Terminal Charges", normal_style), f"{self.terminal_charges:.2f}"],
            [3, Paragraph("Surcharges", normal_style), f"{self.surcharges:.2f}"],
            [4, Paragraph("Taxes", normal_style), f"{self.taxes} %"],
        ]

        sr_no = 5
        if self.extra_charges:
            for key, value in self.extra_charges.items():
                if key != 'payment_method':
                    charge_description = key.replace('_', ' ').title()
                    charge_amount = Decimal(str(value))
                    table_data.append([
                        sr_no,
                        Paragraph(charge_description, normal_style),
                        f"{charge_amount:.2f}"
                    ])
                    sr_no += 1
        
        total_payable = self.total_amount
        rounded_total = total_payable.quantize(Decimal('1'))

        # Combine total amount and amount in words in one row, aligned right in their respective cells
        table_data.append([
            '', 
            Paragraph(f"Total Payable (Rounded Off)<br/><font size=8><i>(Amount in Words: {numbers_to_words(rounded_total)})</i></font>", amount_in_words_table_style), 
            Paragraph(f"{rounded_total:.2f}", total_amount_style)
        ])

        # Updated TableStyle
        table_style = TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('ALIGN', (2, 1), (2, -1), 'RIGHT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('FONTNAME', (1, -1), (1, -1), 'Helvetica-Bold'), 
            ('FONTNAME', (2, -1), (2, -1), 'Helvetica-Bold'), 
            ('ALIGN', (1, -1), (1, -1), 'RIGHT'),  # Align the 'Total Payable' label and words to the right
            ('ALIGN', (2, -1), (2, -1), 'RIGHT'), # Align the total amount to the right
        ])

        invoice_table = Table(table_data, colWidths=[doc_width * 0.06, doc_width * 0.62, doc_width * 0.32])
        invoice_table.setStyle(table_style)
        elements.append(invoice_table)
        elements.append(Spacer(1, 0.1 * inch))

        # Footer section
        footer_elements = [
            Paragraph("<b>Bank Details</b>", heading_style),
            Paragraph("<b>A/c Holder Name:</b> Vansat Technologies", normal_style),
            Paragraph("<b>Bank:</b> Axis Bank Ltd. Branch: Nashik", normal_style),
            Paragraph("<b>Current A/c No.:</b> 918020091547318", normal_style),
            Paragraph("<b>IFSC Code:</b> UTIB0000115", normal_style),
            Spacer(0, 0.1 * inch),
            Paragraph("• Please mention invoice number on your cheques.", normal_style),
            Paragraph("• Payment due in 15 days.", normal_style),
            Paragraph("<i>This is an electronically generated invoice; hence need not to be signed.</i>", normal_style),
            Spacer(0, 0.1 * inch),
            Paragraph("If you have any queries related to this invoice, please contact", footer_style),
            Paragraph("<b>Vansat Cabs, +91-7262025025/+91-7263025025, vansatcabs@gmail.com</b>", contact_style),
            Paragraph("<b>Visit us at:</b> www.vansatcabs.com", contact_style),
            Paragraph("<i>Thank you for your business!</i>", footer_style),
            Paragraph("<i>Ask for e-invoice, please rethink before printing this document. Save Earth!</i>", footer_style),
        ]
        elements.extend(footer_elements)
        
        doc.build(elements)
        buffer.seek(0)
        return buffer

    def send_completion_email(self):
        """Send completion email with PDF invoice attached."""
        subject = f"Your Trip {self.booking_id} is Completed - Invoice"
        
        context = {
            'trip': self,
            'extra_charges_display': {},
            'SITE_DOMAIN': settings.SITE_DOMAIN,
            'STATIC_URL': settings.STATIC_URL,
        }

        if self.extra_charges:
            for key, value in self.extra_charges.items():
                if key != 'payment_method':
                    context['extra_charges_display'][key.replace('_', ' ').title()] = value

        html_message = render_to_string('trip_completion_email.html', context)
        plain_message = strip_tags(html_message)

        from_email = settings.EMAIL_HOST_USER
        recipient_list = [self.email_id]

        pdf_buffer = self.generate_invoice_pdf()
        
        email = EmailMessage(
            subject,
            plain_message,
            from_email,
            recipient_list
        )
        email.attach(f'invoice_{self.booking_id}.pdf', pdf_buffer.getvalue(), 'application/pdf')
        email.content_subtype = 'html'
        email.body = html_message

        try:
            email.send()
            print(f"Email with invoice sent successfully for trip {self.booking_id} to {self.email_id}")
        except Exception as e:
            print(f"Failed to send email for trip {self.booking_id}: {e}")

class TripLocation(models.Model):
    trip = models.OneToOneField(Trip, on_delete=models.CASCADE, related_name="locations")
    locations = models.JSONField(default=dict)  # {timestamp: {"lat": ..., "lng": ..., "place": ...}}
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.trip.booking_id} - {len(self.locations)} locations"