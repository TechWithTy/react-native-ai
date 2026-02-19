from datetime import datetime
from app.schemas.user import UserProfile
from app.schemas.job import JobEntry
from app.schemas.onboarding import OnboardingSetup
from app.schemas.ai import AICoachSession, AtsScanResult
from app.schemas.wallet import SubscriptionTier, CreditBalance

def get_mock_user_profile():
    return UserProfile(
        id="user_123",
        name="Tyriq King",
        email="tyriq@careerlift.io",
        is_open_to_work=True,
        bio="Software Engineer passionate about AI.",
        linkedin_connected=True
    )

def get_mock_onboarding():
    return OnboardingSetup(
        role_track="Engineering",
        target_role="Senior Full Stack Engineer",
        seniority_level="Senior",
        desired_salary_min=140000,
        desired_salary_max=200000,
        working_style="Remote",
        top_skills=["React Native", "FastAPI", "TypeScript"]
    )

def get_mock_jobs():
    return [
        JobEntry(
            id="job_1",
            company="Tech Corp",
            role="Senior Engineer",
            status="Interviewing",
            next_action="Technical Round",
            next_action_date=datetime.now(),
            salary_range="$150k - $180k"
        ),
        JobEntry(
            id="job_2",
            company="Startup Inc",
            role="Founding Engineer",
            status="Applied",
            next_action="Follow up",
            next_action_date=datetime.now(),
            salary_range="$160k - $220k",
            is_overdue=True
        )
    ]

def get_mock_ai_sessions():
    return [
        AICoachSession(
            id="session_1",
            topic="Resume Review",
            messages=[{"role": "assistant", "content": "Hello! I can help you tailor your resume."}],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    ]

def get_mock_credits():
    return CreditBalance(ai_credits=120, scan_credits=10)

def get_mock_subscription():
    return SubscriptionTier(
        id="pro",
        name="Pro Plan",
        features=["Unlimited AI Coach", "50 ATS Scans/mo"],
        price_monthly=29.99,
        is_active=True
    )

def get_mock_analytics():
    return {
        "pipeline": {
            "total_jobs": 12,
            "applied": 5,
            "interviewing": 2,
            "offers": 0,
            "rejected": 1
        },
        "weekly_progress": {
            "week_start": "2023-10-23",
            "applications_sent": 3,
            "interviews_completed": 1,
            "goal_applications": 5
        }
    }

