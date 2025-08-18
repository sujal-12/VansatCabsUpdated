# decorators.py
from django.shortcuts import redirect
from django.contrib import messages

def driver_login_required(view_func):
    def wrapper(request, *args, **kwargs):
        if 'driver_id' not in request.session:
            messages.error(request, "You must be logged in to access this page.")
            return redirect('driver_login')
        return view_func(request, *args, **kwargs)
    return wrapper
