from django_contrib_admin_react import views
from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    path('api/', include(views.urlpatterns)),
    path('', TemplateView.as_view(template_name='django_contrib_admin_react/index.html'), name='react_admin_index_html')
]
