# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class AprobacionSolicitud(models.Model):
    id_aprobacion = models.IntegerField(primary_key=True)
    id_solicitud = models.ForeignKey('SolicitudBecas', models.DO_NOTHING, db_column='id_solicitud')
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    nivel_aprobacion = models.FloatField()
    resultado = models.CharField(max_length=20)
    fecha_aprobacion = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'aprobacion_solicitud'
        unique_together = (('id_solicitud', 'nivel_aprobacion'),)


class Auditoria(models.Model):
    id_auditoria = models.IntegerField(primary_key=True)
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario', blank=True, null=True)
    tabla_afectada = models.CharField(max_length=50)
    id_registro = models.FloatField()
    operacion = models.CharField(max_length=20)
    resultado = models.CharField(max_length=100, blank=True, null=True)
    fecha_evento = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auditoria'


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128, blank=True, null=True)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150, blank=True, null=True)
    first_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150, blank=True, null=True)
    email = models.CharField(max_length=254, blank=True, null=True)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class Comite(models.Model):
    id_comite = models.IntegerField(primary_key=True)
    nombre_comite = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'comite'


class Convocatoria(models.Model):
    id_convocatoria = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=50)
    fecha_inicio = models.DateField()
    fecha_finalizacion = models.DateField()
    estado = models.CharField(max_length=20)
    id_institucion = models.ForeignKey('Institucion', models.DO_NOTHING, db_column='id_institucion', blank=True, null=True)
    descripcion = models.CharField(max_length=500, blank=True, null=True)
    cupos = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'convocatoria'


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200, blank=True, null=True)
    action_flag = models.IntegerField()
    change_message = models.TextField(blank=True, null=True)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100, blank=True, null=True)
    model = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField(blank=True, null=True)
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'


class Docente(models.Model):
    id_docente = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    correo = models.CharField(unique=True, max_length=100)
    nivel_educacion = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'docente'


class Documento(models.Model):
    id_documento = models.IntegerField(primary_key=True)
    id_solicitud = models.ForeignKey('SolicitudBecas', models.DO_NOTHING, db_column='id_solicitud')
    tipo = models.CharField(max_length=50)
    formato = models.CharField(max_length=50)
    tamano = models.FloatField()
    archivo = models.BinaryField(blank=True, null=True)
    enlace = models.CharField(max_length=500, blank=True, null=True)
    fecha_carga = models.DateField()
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario')
    id_docente = models.ForeignKey(Docente, models.DO_NOTHING, db_column='id_docente', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'documento'


class Escuela(models.Model):
    id_escuela = models.IntegerField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=50)
    direccion = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'escuela'


class Estudiante(models.Model):
    id_estudiante = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=50)
    apellido = models.CharField(max_length=50)
    dpi = models.CharField(unique=True, max_length=100)
    corrreo = models.CharField(unique=True, max_length=100)
    fecha_nacimiento = models.DateField()
    nivel_educativo = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'estudiante'


class Evaluacion(models.Model):
    id_evaluacion = models.IntegerField(primary_key=True)
    id_comite = models.ForeignKey(Comite, models.DO_NOTHING, db_column='id_comite')
    id_docente = models.ForeignKey(Docente, models.DO_NOTHING, db_column='id_docente')
    fecha = models.DateField()
    id_solicitud = models.ForeignKey('SolicitudBecas', models.DO_NOTHING, db_column='id_solicitud')
    calificacion = models.FloatField()
    estado = models.CharField(max_length=20)
    resultado = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'evaluacion'
        unique_together = (('id_comite', 'id_docente', 'id_solicitud'),)


class HistorialEstado(models.Model):
    id_historial = models.IntegerField(primary_key=True)
    id_solicitud = models.ForeignKey('SolicitudBecas', models.DO_NOTHING, db_column='id_solicitud')
    fecha_cambio = models.DateTimeField()
    estado_anterior = models.CharField(max_length=50)
    estado_nuevo = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'historial_estado'


class Institucion(models.Model):
    id_institucion = models.IntegerField(primary_key=True)
    id_universidad = models.ForeignKey('Universidad', models.DO_NOTHING, db_column='id_universidad', blank=True, null=True)
    id_escuela = models.ForeignKey(Escuela, models.DO_NOTHING, db_column='id_escuela', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'institucion'


class MiembroComite(models.Model):
    pk = models.CompositePrimaryKey('id_comite', 'id_docente')
    id_comite = models.ForeignKey(Comite, models.DO_NOTHING, db_column='id_comite')
    id_docente = models.ForeignKey(Docente, models.DO_NOTHING, db_column='id_docente')
    es_evaluador = models.CharField(max_length=1)
    estado_autorizacion = models.CharField(max_length=20)

    class Meta:
        managed = False
        db_table = 'miembro_comite'


class Notificacion(models.Model):
    id_notificacion = models.IntegerField(primary_key=True)
    id_estudiante = models.ForeignKey(Estudiante, models.DO_NOTHING, db_column='id_estudiante')
    id_solicitud = models.ForeignKey('SolicitudBecas', models.DO_NOTHING, db_column='id_solicitud')
    mensaje = models.CharField(max_length=300)
    fecha_envio = models.DateTimeField()
    leida = models.CharField(max_length=1, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'notificacion'


class SolicitudBecas(models.Model):
    id_solicitud = models.IntegerField(primary_key=True)
    id_estudiante = models.ForeignKey(Estudiante, models.DO_NOTHING, db_column='id_estudiante')
    id_convocatoria = models.ForeignKey(Convocatoria, models.DO_NOTHING, db_column='id_convocatoria')
    estado_solicitud = models.CharField(max_length=20)
    departamento = models.CharField(max_length=50)
    monto_solicitado = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'solicitud_becas'
        unique_together = (('id_estudiante', 'id_convocatoria'),)


class Universidad(models.Model):
    id_universidad = models.IntegerField(primary_key=True)
    nombre = models.CharField(unique=True, max_length=50)
    direccion = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'universidad'


class Usuario(models.Model):
    id_usuario = models.IntegerField(primary_key=True)
    nombre = models.CharField(max_length=50)
    contrasena = models.CharField(max_length=100)
    correo = models.CharField(unique=True, max_length=100)
    rol = models.CharField(max_length=20)
    id_estudiante = models.OneToOneField('Estudiante', models.DO_NOTHING, db_column='id_estudiante', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'usuario'
