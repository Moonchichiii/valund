"""
Search models for skills, location, and availability indexing.
"""

import uuid
from django.db import models
from django.conf import settings
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.indexes import GinIndex
from django.utils.translation import gettext_lazy as _


class SearchProfile(models.Model):
    """Optimized search profile for users"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='search_profile'
    )
    
    # Searchable fields
    search_vector = SearchVectorField(null=True, blank=True)
    
    # Skills (denormalized for faster search)
    skills_text = models.TextField(blank=True)
    skills_list = models.JSONField(default=list)
    
    # Location data
    location = models.CharField(max_length=200, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    # Availability
    is_available = models.BooleanField(default=True)
    hourly_rate_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    hourly_rate_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Experience level
    years_experience = models.PositiveIntegerField(null=True, blank=True)
    
    # Rating info for search ranking
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_ratings = models.PositiveIntegerField(default=0)
    
    # Activity metrics
    total_completed_jobs = models.PositiveIntegerField(default=0)
    last_active = models.DateTimeField(auto_now=True)
    
    # Search ranking score
    search_score = models.FloatField(default=0.0)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'search_profile'
        verbose_name = _('Search Profile')
        verbose_name_plural = _('Search Profiles')
        indexes = [
            GinIndex(fields=['search_vector']),
            models.Index(fields=['is_available', 'search_score']),
            models.Index(fields=['location', 'is_available']),
            models.Index(fields=['hourly_rate_min', 'hourly_rate_max']),
            models.Index(fields=['average_rating', 'total_ratings']),
        ]
    
    def __str__(self):
        return f"Search Profile - {self.user.full_name}"
    
    def update_search_vector(self):
        """Update the search vector with latest user data"""
        from django.contrib.postgres.search import SearchVector
        
        # Combine searchable text
        searchable_text = ' '.join(filter(None, [
            self.user.first_name,
            self.user.last_name,
            self.user.profile.bio if hasattr(self.user, 'profile') else '',
            self.skills_text,
            self.location,
            self.user.profile.job_title if hasattr(self.user, 'profile') else '',
            self.user.profile.company if hasattr(self.user, 'profile') else '',
        ]))
        
        # Update search vector
        SearchProfile.objects.filter(id=self.id).update(
            search_vector=SearchVector('skills_text', 'location', weight='A') +
                         SearchVector('user__first_name', 'user__last_name', weight='B')
        )
    
    def calculate_search_score(self):
        """Calculate search ranking score based on various factors"""
        score = 0.0
        
        # Rating score (0-5 scale, weight: 30%)
        if self.total_ratings > 0:
            score += float(self.average_rating) * 0.3
        
        # Experience score (weight: 20%)
        if self.years_experience:
            experience_score = min(self.years_experience / 10, 1.0) * 5  # Cap at 10 years
            score += experience_score * 0.2
        
        # Activity score (weight: 20%)
        activity_score = min(self.total_completed_jobs / 20, 1.0) * 5  # Cap at 20 jobs
        score += activity_score * 0.2
        
        # Availability bonus (weight: 10%)
        if self.is_available:
            score += 0.5
        
        # Profile completeness (weight: 20%)
        completeness = 0
        if self.skills_text:
            completeness += 0.25
        if self.location:
            completeness += 0.25
        if self.hourly_rate_min and self.hourly_rate_max:
            completeness += 0.25
        if hasattr(self.user, 'profile') and self.user.profile.bio:
            completeness += 0.25
        
        score += completeness * 5 * 0.2
        
        self.search_score = score
        self.save(update_fields=['search_score'])
        
        return score


class SkillCategory(models.Model):
    """Categories for organizing skills"""
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subcategories'
    )
    
    # Display order and hierarchy
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    # SEO and search
    meta_description = models.CharField(max_length=200, blank=True)
    search_keywords = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'skill_category'
        verbose_name = _('Skill Category')
        verbose_name_plural = _('Skill Categories')
        ordering = ['order', 'name']
    
    def __str__(self):
        if self.parent:
            return f"{self.parent.name} → {self.name}"
        return self.name


class PopularSearch(models.Model):
    """Track popular search terms for analytics and suggestions"""
    
    query = models.CharField(max_length=200, unique=True)
    search_count = models.PositiveIntegerField(default=1)
    
    # Filters commonly used with this query
    common_locations = models.JSONField(default=list)
    common_skills = models.JSONField(default=list)
    common_rate_ranges = models.JSONField(default=list)
    
    last_searched = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'popular_search'
        verbose_name = _('Popular Search')
        verbose_name_plural = _('Popular Searches')
        ordering = ['-search_count', '-last_searched']
    
    def __str__(self):
        return f"{self.query} ({self.search_count} searches)"


class SearchAnalytics(models.Model):
    """Analytics for search behavior"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Search details
    query = models.CharField(max_length=500)
    filters_applied = models.JSONField(default=dict)
    results_count = models.PositiveIntegerField()
    
    # User context
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='search_analytics'
    )
    session_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Geographic data
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    # Engagement metrics
    clicked_results = models.JSONField(default=list)
    time_spent = models.PositiveIntegerField(default=0)  # seconds
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'search_analytics'
        verbose_name = _('Search Analytics')
        verbose_name_plural = _('Search Analytics')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['query', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['country', 'city']),
        ]
    
    def __str__(self):
        return f"Search: {self.query[:50]}... ({self.results_count} results)"


class SavedSearch(models.Model):
    """User's saved search queries and alerts"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_searches'
    )
    
    # Search details
    name = models.CharField(max_length=200)
    query = models.CharField(max_length=500)
    filters = models.JSONField(default=dict)
    
    # Alert settings
    email_alerts = models.BooleanField(default=False)
    alert_frequency = models.CharField(
        max_length=20,
        choices=[
            ('daily', _('Daily')),
            ('weekly', _('Weekly')),
            ('monthly', _('Monthly')),
        ],
        default='weekly'
    )
    last_alert_sent = models.DateTimeField(null=True, blank=True)
    
    # Activity
    is_active = models.BooleanField(default=True)
    search_count = models.PositiveIntegerField(default=0)
    last_used = models.DateTimeField(auto_now=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'saved_search'
        verbose_name = _('Saved Search')
        verbose_name_plural = _('Saved Searches')
        ordering = ['-last_used']
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.user.full_name}"
