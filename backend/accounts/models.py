"""
User and profile models for the accounts app.
"""

import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Custom user model extending Django's AbstractUser"""
    
    class UserType(models.TextChoices):
        FREELANCER = 'freelancer', _('Freelancer')
        CLIENT = 'client', _('Client')
        ADMIN = 'admin', _('Admin')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.FREELANCER
    )
    phone_number = models.CharField(
        max_length=20,
        blank=True,
        validators=[RegexValidator(
            regex=r'^\+?1?\d{9,15}$',
            message='Phone number must be entered in the format: "+999999999". Up to 15 digits allowed.'
        )]
    )
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'accounts_user'
        verbose_name = _('User')
        verbose_name_plural = _('Users')
    
    def __str__(self):
        return f"{self.email} ({self.get_user_type_display()})"
    
    @property
    def full_name(self):
        """Return the user's full name"""
        return f"{self.first_name} {self.last_name}".strip()


class Profile(models.Model):
    """Extended profile information for users"""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(max_length=1000, blank=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    # Professional information
    company = models.CharField(max_length=100, blank=True)
    job_title = models.CharField(max_length=100, blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    years_experience = models.PositiveIntegerField(null=True, blank=True)
    
    # Availability
    is_available = models.BooleanField(default=True)
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Stripe Connect information (for freelancers receiving payments)
    stripe_account_id = models.CharField(max_length=255, blank=True)
    stripe_onboarding_complete = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'accounts_profile'
        verbose_name = _('Profile')
        verbose_name_plural = _('Profiles')
    
    def __str__(self):
        return f"{self.user.full_name}'s Profile"


class Skill(models.Model):
    """Skills that users can have"""
    
    name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'accounts_skill'
        verbose_name = _('Skill')
        verbose_name_plural = _('Skills')
        ordering = ['category', 'name']
    
    def __str__(self):
        return self.name


class UserSkill(models.Model):
    """Through model for user skills with proficiency level"""
    
    class ProficiencyLevel(models.IntegerChoices):
        BEGINNER = 1, _('Beginner')
        INTERMEDIATE = 2, _('Intermediate')
        ADVANCED = 3, _('Advanced')
        EXPERT = 4, _('Expert')
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='user_skills')
    proficiency_level = models.IntegerField(
        choices=ProficiencyLevel.choices,
        default=ProficiencyLevel.INTERMEDIATE
    )
    years_experience = models.PositiveIntegerField(default=0)
    verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'accounts_user_skill'
        unique_together = ['user', 'skill']
        verbose_name = _('User Skill')
        verbose_name_plural = _('User Skills')
    
    def __str__(self):
        return f"{self.user.full_name} - {self.skill.name} ({self.get_proficiency_level_display()})"
