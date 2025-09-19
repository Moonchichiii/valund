import uuid
from datetime import date, timedelta
from decimal import Decimal

import factory
from accounts.models import Profile, Skill, User, UserSkill
from bookings.models import Booking, BookingApproval, BookingAttachment, TimeLog
from competence.models import (
    CompetenceAuditLog,
    CompetenceDocument,
    CompetenceReview,
    CompetenceTemplate,
)
from contracts.models import (
    Contract,
    ContractEvent,
    ContractSignature,
    ContractTemplate,
)
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from payments.models import (
    EscrowAccount,
    Payment,
    PaymentDispute,
    PaymentMethod,
    StripeWebhookEvent,
)
from ratings.models import Rating, RatingFlag, RatingStatistics
from search.models import PopularSearch, SavedSearch, SearchProfile, SkillCategory


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    id = factory.LazyFunction(uuid.uuid4)
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    username = factory.Sequence(lambda n: f"user{n}")
    first_name = "Test"
    last_name = factory.Sequence(lambda n: f"User{n}")
    user_type = User.UserType.FREELANCER
    is_active = True
    password = factory.PostGenerationMethodCall("set_password", "password123")


class ClientFactory(UserFactory):
    user_type = User.UserType.CLIENT


class ProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Profile

    user = factory.SubFactory(UserFactory)
    bio = factory.Faker("sentence")
    job_title = "Engineer"
    company = "Acme Corp"
    hourly_rate = Decimal("100.00")


class SkillFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Skill

    name = factory.Sequence(lambda n: f"Skill{n}")
    category = "General"
    description = factory.Faker("sentence")


class UserSkillFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserSkill
        django_get_or_create = ("user", "skill")

    user = factory.SubFactory(UserFactory)
    skill = factory.SubFactory(SkillFactory)
    proficiency_level = UserSkill.ProficiencyLevel.ADVANCED
    years_experience = 5


class BookingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Booking

    client = factory.SubFactory(ClientFactory)
    freelancer = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Project {n}")
    description = factory.Faker("paragraph")
    start_date = factory.LazyFunction(lambda: timezone.now() - timedelta(days=1))
    end_date = factory.LazyFunction(lambda: timezone.now() + timedelta(days=1))
    estimated_hours = Decimal("10.0")
    hourly_rate = Decimal("50.00")
    total_budget = Decimal("500.00")

    @factory.post_generation
    def skills_required(self, create, extracted, **kwargs):
        if not create:
            return
        if extracted:
            for skill in extracted:
                self.skills_required.add(skill)
        else:
            self.skills_required.add(SkillFactory())


class TimeLogFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = TimeLog

    booking = factory.SubFactory(BookingFactory)
    freelancer = factory.SelfAttribute("booking.freelancer")
    date = factory.LazyFunction(lambda: date.today())
    start_time = timezone.now().time().replace(microsecond=0)
    end_time = (timezone.now() + timedelta(hours=2)).time().replace(microsecond=0)
    hours_worked = Decimal("2.00")
    description = "Worked on tasks"
    tasks_completed = ["Task A", "Task B"]


class BookingApprovalFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BookingApproval

    booking = factory.SubFactory(BookingFactory)
    approval_type = BookingApproval.ApprovalType.BOOKING_ACCEPTANCE
    requester = factory.SelfAttribute("booking.client")
    request_message = "Please approve"


class BookingAttachmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BookingAttachment

    booking = factory.SubFactory(BookingFactory)
    uploaded_by = factory.SelfAttribute("booking.client")
    filename = "spec.txt"
    file_size = 10
    content_type = "text/plain"
    description = "Spec file"
    file = factory.LazyFunction(lambda: SimpleUploadedFile("spec.txt", b"content"))


class CompetenceDocumentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CompetenceDocument

    user = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Certificate {n}")
    description = "Great certificate"
    document_type = CompetenceDocument.DocumentType.CERTIFICATE
    file = factory.LazyFunction(lambda: SimpleUploadedFile("doc.pdf", b"PDFDATA"))
    file_size = 7


class CompetenceReviewFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CompetenceReview

    document = factory.SubFactory(CompetenceDocumentFactory)
    reviewer = factory.SubFactory(UserFactory)
    result = CompetenceReview.ReviewResult.APPROVED
    notes = "Looks good"


class CompetenceAuditLogFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CompetenceAuditLog

    document = factory.SubFactory(CompetenceDocumentFactory)
    user = factory.SubFactory(UserFactory)
    action = CompetenceAuditLog.Action.UPLOADED
    description = "Uploaded"


class CompetenceTemplateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CompetenceTemplate

    name = factory.Sequence(lambda n: f"Template {n}")
    document_type = CompetenceDocument.DocumentType.CERTIFICATE
    description = "Template desc"


class PaymentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Payment

    booking = factory.SubFactory(BookingFactory)
    payer = factory.SelfAttribute("booking.client")
    payee = factory.SelfAttribute("booking.freelancer")
    amount = Decimal("500.00")
    currency = "USD"
    payment_type = Payment.PaymentType.ESCROW
    description = "Initial payment"


class EscrowAccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = EscrowAccount

    booking = factory.SubFactory(BookingFactory)
    payment = factory.SubFactory(PaymentFactory)
    amount_held = Decimal("500.00")
    amount_released = Decimal("100.00")
    currency = "USD"
    auto_release_date = factory.LazyFunction(lambda: timezone.now() - timedelta(days=1))


class PaymentDisputeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PaymentDispute

    payment = factory.SubFactory(PaymentFactory)
    raised_by = factory.SelfAttribute("payment.payer")
    dispute_type = PaymentDispute.DisputeType.OTHER
    description = "Issue description"


class PaymentMethodFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PaymentMethod

    user = factory.SubFactory(UserFactory)
    method_type = PaymentMethod.MethodType.CARD
    is_default = True
    display_name = "Visa **** 1111"
    last_four = "1111"
    brand = "VISA"


class StripeWebhookEventFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = StripeWebhookEvent

    stripe_id = factory.Sequence(lambda n: f"evt_{n}")
    event_type = "payment_intent.succeeded"
    data = {"object": "event"}


class RatingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Rating

    booking = factory.SubFactory(BookingFactory)
    rater = factory.SelfAttribute("booking.client")
    rated_user = factory.SelfAttribute("booking.freelancer")
    rater_type = Rating.RaterType.CLIENT
    overall_rating = 5
    communication_rating = 5
    quality_rating = 4
    timeliness_rating = 5
    professionalism_rating = 4
    review_text = "Excellent work"
    would_recommend = True


class RatingStatisticsFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = RatingStatistics

    user = factory.SubFactory(UserFactory)


class RatingFlagFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = RatingFlag

    rating = factory.SubFactory(RatingFactory)
    flagger = factory.SelfAttribute("rating.rated_user")
    reason = RatingFlag.FlagReason.SPAM
    description = "Spam content"


class SearchProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SearchProfile

    user = factory.SubFactory(UserFactory)
    skills_text = "Python, Django"
    skills_list = ["Python", "Django"]
    location = "Remote"
    is_available = True
    years_experience = 5
    average_rating = Decimal("4.50")
    total_ratings = 10
    total_completed_jobs = 15


class SkillCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SkillCategory

    name = factory.Sequence(lambda n: f"Category{n}")
    slug = factory.Sequence(lambda n: f"category{n}")


class PopularSearchFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PopularSearch

    query = factory.Sequence(lambda n: f"query {n}")


class SavedSearchFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SavedSearch

    user = factory.SubFactory(UserFactory)
    name = factory.Sequence(lambda n: f"Search {n}")
    query = "python developer"
    filters = {"rate_min": 50}


class ContractTemplateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ContractTemplate

    name = factory.Sequence(lambda n: f"Base Template {n}")
    version = "1.0"
    body = "Standard engagement terms"


class ContractFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Contract

    company = factory.SubFactory(ClientFactory)
    talent = factory.SubFactory(UserFactory)
    title = factory.Sequence(lambda n: f"Contract {n}")
    body_snapshot = "Work shall be performed"
    template = factory.SubFactory(ContractTemplateFactory)


class ContractSignatureFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ContractSignature

    contract = factory.SubFactory(ContractFactory)
    signer = factory.SelfAttribute("contract.company")
    role = ContractSignature.Role.COMPANY
    signature_type = ContractSignature.SignatureType.TYPED


class ContractEventFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ContractEvent

    contract = factory.SubFactory(ContractFactory)
    event_type = "created"
    metadata = {}
