from django.shortcuts import render


def login_view(request):
    return render(request, "usuarios/login.html")


def panel_view(request):
    return render(request, "usuarios/panel.html")


def convocatorias_view(request):
    return render(request, "usuarios/convocatorias.html")


def solicitudes_view(request):
    return render(request, "usuarios/solicitudes.html")


def evaluaciones_view(request):
    return render(request, "usuarios/evaluaciones.html")


def comites_view(request):
    return render(request, "usuarios/comites.html")


def reportes_view(request):
    return render(request, "usuarios/reportes.html")