"""
Rating and review models for feedback system.
"""

import uuid
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _


class Rating(models.Model):
    """Rating and review for completed bookings"""
    
    class RaterType(models.TextChoices):
        CLIENT = 'client', _('Client')
        FREELANCER = 'freelancer', _('Freelancer')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.CASCADE,
        related_name='ratings'
    )
    
    # Rating parties
    rater = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ratings_given'
    )
    rated_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ratings_received'
    )
    
    rater_type = models.CharField(
        max_length=10,
        choices=RaterType.choices
    )
    
    # Rating scores (1-5 scale)
    overall_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    communication_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    quality_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    timeliness_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    professionalism_rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        null=True,
        blank=True
    )
    
    # Review text
    review_title = models.CharField(max_length=200, blank=True)
    review_text = models.TextField()
    
    # Additional feedback
    would_recommend = models.BooleanField(null=True, blank=True)
    would_work_again = models.BooleanField(null=True, blank=True)
    
    # Metadata
    is_public = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Response from rated user
    response_text = models.TextField(blank=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'rating'
        verbose_name = _('Rating')
        verbose_name_plural = _('Ratings')
        ordering = ['-created_at']
        unique_together = ['booking', 'rater']
        indexes = [
            models.Index(fields=['rated_user', 'is_public']),
            models.Index(fields=['overall_rating', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.overall_rating}★ - {self.booking.title} by {self.rater.full_name}"


class RatingStatistics(models.Model):
    """Aggregated rating statistics for users"""
    
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rating_stats'
    )
    
    # Overall statistics
    total_ratings = models.PositiveIntegerField(default=0)
    average_rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00
    )
    
    # Rating breakdown (count by star rating)
    five_star_count = models.PositiveIntegerField(default=0)
    four_star_count = models.PositiveIntegerField(default=0)
    three_star_count = models.PositiveIntegerField(default=0)
    two_star_count = models.PositiveIntegerField(default=0)
    one_star_count = models.PositiveIntegerField(default=0)
    
    # Category averages
    avg_communication = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00
    )
    avg_quality = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00
    )
    avg_timeliness = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00
    )
    avg_professionalism = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00
    )
    
    # Recommendation stats
    total_recommendations = models.PositiveIntegerField(default=0)
    recommendation_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00
    )
    
    # Timestamps
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'rating_statistics'
        verbose_name = _('Rating Statistics')
        verbose_name_plural = _('Rating Statistics')
    
    def __str__(self):
        return f"{self.user.full_name} - {self.average_rating}★ ({self.total_ratings} ratings)"
    
    def update_statistics(self):
        """Recalculate rating statistics"""
        from django.db.models import Avg, Count, Case, When, IntegerField
        
        ratings = Rating.objects.filter(
            rated_user=self.user,
            is_public=True
        )
        
        # Basic stats
        stats = ratings.aggregate(
            total=Count('id'),
            avg_overall=Avg('overall_rating'),
            avg_communication=Avg('communication_rating'),
            avg_quality=Avg('quality_rating'),
            avg_timeliness=Avg('timeliness_rating'),
            avg_professionalism=Avg('professionalism_rating'),
        )
        
        # Rating breakdown
        rating_breakdown = ratings.aggregate(
            five_star=Count(Case(When(overall_rating=5, then=1), output_field=IntegerField())),
            four_star=Count(Case(When(overall_rating=4, then=1), output_field=IntegerField())),
            three_star=Count(Case(When(overall_rating=3, then=1), output_field=IntegerField())),
            two_star=Count(Case(When(overall_rating=2, then=1), output_field=IntegerField())),
            one_star=Count(Case(When(overall_rating=1, then=1), output_field=IntegerField())),
        )
        
        # Recommendation stats
        recommendations = ratings.filter(would_recommend__isnull=False)
        total_recommendations = recommendations.count()
        positive_recommendations = recommendations.filter(would_recommend=True).count()
        
        # Update fields
        self.total_ratings = stats['total'] or 0
        self.average_rating = stats['avg_overall'] or 0.00
        self.avg_communication = stats['avg_communication'] or 0.00
        self.avg_quality = stats['avg_quality'] or 0.00
        self.avg_timeliness = stats['avg_timeliness'] or 0.00
        self.avg_professionalism = stats['avg_professionalism'] or 0.00
        
        self.five_star_count = rating_breakdown['five_star']
        self.four_star_count = rating_breakdown['four_star']
        self.three_star_count = rating_breakdown['three_star']
        self.two_star_count = rating_breakdown['two_star']
        self.one_star_count = rating_breakdown['one_star']
        
        self.total_recommendations = total_recommendations
        if total_recommendations > 0:
            self.recommendation_percentage = (positive_recommendations / total_recommendations) * 100
        else:
            self.recommendation_percentage = 0.00
        
        self.save()


class RatingFlag(models.Model):
    """Flags for inappropriate ratings/reviews"""
    
    class FlagReason(models.TextChoices):
        INAPPROPRIATE = 'inappropriate', _('Inappropriate Content')
        SPAM = 'spam', _('Spam')
        FAKE = 'fake', _('Fake Review')
        HARASSMENT = 'harassment', _('Harassment')
        OTHER = 'other', _('Other')
    
    class Status(models.TextChoices):
        PENDING = 'pending', _('Pending')
        REVIEWED = 'reviewed', _('Reviewed')
        DISMISSED = 'dismissed', _('Dismissed')
        UPHELD = 'upheld', _('Upheld')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rating = models.ForeignKey(
        Rating,
        on_delete=models.CASCADE,
        related_name='flags'
    )
    
    # Flag details
    flagger = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rating_flags'
    )
    reason = models.CharField(
        max_length=15,
        choices=FlagReason.choices
    )
    description = models.TextField()
    
    # Review process
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rating_flags_reviewed'
    )
    review_notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'rating_flag'
        verbose_name = _('Rating Flag')
        verbose_name_plural = _('Rating Flags')
        ordering = ['-created_at']
        unique_together = ['rating', 'flagger']
    
    def __str__(self):
        return f"Flag: {self.rating} - {self.get_reason_display()}"
