from django.contrib import admin
from .models import *

#admin.site.register(Book)
admin.site.register(Publisher)
admin.site.register(Author)


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    fields = (('title', 'description'), 'summary')
