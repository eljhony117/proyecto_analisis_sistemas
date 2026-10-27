# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class Estudiante(models.Model):
    id_estudainte = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    dpi = models.CharField(unique=True, max_length=100)
    corrreo = models.CharField(unique=True, max_length=100)
    fecha_nacimiento = models.DateField()
    nivel_educativo = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'ESTUDIANTE'


class Docente(models.Model):
    id_docente = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    correo = models.CharField(unique=True, max_length=100)
    nivel_educacion = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'DOCENTE'


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    contrasena = models.CharField(max_length=100)
    correo = models.CharField(unique=True, max_length=100)
    rol = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'USUARIO'


class Universidad(models.Model):
    id_universidad = models.AutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=50)
    direccion = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'UNIVERSIDAD'


class Escuela(models.Model):
    id_escuela = models.AutoField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=50)
    direccion = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'ESCUELA'


class Institucion(models.Model):
    id_institucion = models.AutoField(primary_key=True)
    id_universidad = models.ForeignKey(Universidad, models.DO_NOTHING, db_column='id_universidad', blank=True, null=True)
    id_escuela = models.ForeignKey(Escuela, models.DO_NOTHING, db_column='id_escuela', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'INSTITUCION'


class Convocatoria(models.Model):
    id_convocatoria = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=50)
    fecha_inicio = models.DateField()
    fecha_finalizacion = models.DateField()
    estado = models.CharField(max_length=20)
    id_institucion = models.ForeignKey(Institucion, models.DO_NOTHING, db_column='id_institucion', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'CONVOCATORIA'


class SolicitudBecas(models.Model):
    id_solicitud = models.AutoField(primary_key=True)
    id_estudainte = models.ForeignKey(Estudiante, models.DO_NOTHING, db_column='id_estudainte')
    id_convocatoria = models.ForeignKey(Convocatoria, models.DO_NOTHING, db_column='id_convocatoria')
    estado_solicitud = models.CharField(max_length=20)
    departamento = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'SOLICITUD_BECAS'
        unique_together = (('id_estudainte', 'id_convocatoria'),)


class Comite(models.Model):
    id_comite = models.AutoField(primary_key=True)
    nombre_comite = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'COMITE'


class MiembroComite(models.Model):
    pk = models.CompositePrimaryKey('id_comite', 'id_docente')
    id_comite = models.ForeignKey(Comite, models.DO_NOTHING, db_column='id_comite')
    id_docente = models.ForeignKey(Docente, models.DO_NOTHING, db_column='id_docente')
    es_evaluador = models.CharField(max_length=1)
    estado_autorizacion = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'MIEMBRO_COMITE'


class Evaluacion(models.Model):
    id_evaluacion = models.AutoField(primary_key=True)
    id_comite = models.ForeignKey(Comite, models.DO_NOTHING, db_column='id_comite')
    id_docente = models.ForeignKey(Docente, models.DO_NOTHING, db_column='id_docente')
    fecha = models.DateField()
    id_solicitud = models.ForeignKey(SolicitudBecas, models.DO_NOTHING, db_column='id_solicitud')
    calificacion = models.FloatField()
    estado = models.CharField(max_length=20)
    resultado = models.CharField(max_length=20, blank=True, null=True)
    
    class Meta:
        managed = False
        db_table = 'EVALUACION'
        unique_together = (('id_comite', 'id_docente', 'id_solicitud'),)


class Documento(models.Model):
    id_documento = models.AutoField(primary_key=True)
    id_solicitud = models.ForeignKey(SolicitudBecas, models.DO_NOTHING, db_column='id_solicitud')
    tipo = models.CharField(max_length=50)
    formato = models.CharField(max_length=50)
    tamano = models.FloatField()
    archivo = models.BinaryField(blank=True, null=True)
    enlace = models.CharField(max_length=500, blank=True, null=True)
    fecha_carga = models.DateField()
    id_usuario = models.ForeignKey(Usuario, models.DO_NOTHING, db_column='id_usuario')
    id_docente = models.ForeignKey(Docente, models.DO_NOTHING, db_column='id_docente', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'DOCUMENTO'


class HistorialEstado(models.Model):
    id_historial = models.AutoField(primary_key=True)
    id_solicitud = models.ForeignKey(SolicitudBecas, models.DO_NOTHING, db_column='id_solicitud')
    fecha_cambio = models.DateTimeField()
    estado_anterior = models.CharField(max_length=50)
    estado_nuevo = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'HISTORIAL_ESTADO'
