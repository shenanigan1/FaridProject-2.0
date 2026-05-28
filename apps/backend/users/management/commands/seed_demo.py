from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from candidates.models import Candidate
from companies.models import Company
from evaluations.models import (
    Evaluation,
    EvaluationResponse,
    EvaluationSectionAssignment,
)
from positions.models import Position
from recruitment.models import JobApplication
from templates_grid.models import (
    QuestionPool,
    SkillQuestion,
    Template,
    TemplatePoolRule,
    TemplateSection,
    TemplateVersion,
    VersionedPool,
    VersionedSection,
)
from users.models import UserRoles


DEMO_PASSWORD = "DemoPassw0rd!"


class Command(BaseCommand):
    help = "Seed an idempotent FleetFlow demo dataset for QA and product demos."

    def handle(self, *args, **options):
        users = self._seed_users()
        company, position = self._seed_position()
        candidate = self._seed_candidate(users["candidate"], position)
        template, sections, questions = self._seed_template()
        template_version, versioned_sections = self._seed_template_version(
            template, sections
        )
        application = self._seed_application(candidate, position)
        self._seed_evaluations(
            application=application,
            template_version=template_version,
            versioned_sections=versioned_sections,
            questions=questions,
            manager=users["manager"],
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"FleetFlow demo ready for {company.name} / {position.title}."
            )
        )

    def _seed_users(self):
        return {
            "admin": self._upsert_user(
                email="admin@fleetflow.demo",
                first_name="Ada",
                last_name="Admin",
                role=UserRoles.ADMIN,
                is_staff=True,
            ),
            "hr": self._upsert_user(
                email="rh@fleetflow.demo",
                first_name="Helene",
                last_name="RH",
                role=UserRoles.HR,
                is_staff=True,
            ),
            "manager": self._upsert_user(
                email="manager@fleetflow.demo",
                first_name="Marc",
                last_name="Manager",
                role=UserRoles.MANAGER,
            ),
            "candidate": self._upsert_user(
                email="candidate@fleetflow.demo",
                first_name="Jean",
                last_name="Dupont",
                role=UserRoles.CANDIDATE,
            ),
        }

    def _upsert_user(self, *, email, first_name, last_name, role, is_staff=False):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
                "is_staff": is_staff,
                "is_active": True,
            },
        )
        if created:
            user.set_password(DEMO_PASSWORD)
            user.save(update_fields=["password"])
        else:
            updated = []
            for field, value in {
                "first_name": first_name,
                "last_name": last_name,
                "role": role,
                "is_staff": is_staff,
                "is_active": True,
            }.items():
                if getattr(user, field) != value:
                    setattr(user, field, value)
                    updated.append(field)
            if updated:
                user.save(update_fields=updated)
        return user

    def _seed_position(self):
        company, _ = Company.objects.get_or_create(
            name="FleetFlow Demo Logistics",
        )
        position, _ = Position.objects.get_or_create(
            company=company,
            title="Chauffeur CDL-A Demo",
            defaults={
                "description": "Poste demo pour valider le workflow FleetFlow.",
                "department": "Logistics",
                "contract_type": "CDI",
                "location": "Lyon, France",
                "salary": 42000,
                "is_active": True,
            },
        )
        return company, position

    def _seed_candidate(self, user, position):
        candidate, _ = Candidate.objects.get_or_create(
            user=user,
            defaults={"target_position": position},
        )
        if candidate.target_position_id != position.id:
            candidate.target_position = position
            candidate.save(update_fields=["target_position"])
        return candidate

    def _seed_template(self):
        template, _ = Template.objects.get_or_create(
            name="Demo - Evaluation Chauffeur CDL-A",
            defaults={
                "difficulty": "medium",
                "duration_minutes": 45,
                "min_pass_score": 80,
                "is_active": True,
            },
        )

        section_specs = [
            (
                "Conduite de Nuit",
                "Gestion de l'eblouissement et conduite nocturne.",
                40,
            ),
            ("Securite Hazmat", "Protocoles matieres dangereuses.", 35),
            ("Inspection Mecanique", "Verification pre-depart du vehicule.", 25),
        ]
        pool_specs = [
            ("DEMO_NIGHT_DRIVING", "Pool demo conduite de nuit"),
            ("DEMO_HAZMAT", "Pool demo hazmat"),
            ("DEMO_MECHANICAL", "Pool demo inspection mecanique"),
        ]

        sections = []
        questions = []
        for order, (
            (section_name, description, weight),
            (pool_code, pool_name),
        ) in enumerate(zip(section_specs, pool_specs, strict=True)):
            section, _ = TemplateSection.objects.get_or_create(
                template=template,
                name=section_name,
                defaults={"description": description, "weight": weight, "order": order},
            )
            sections.append(section)

            pool, _ = QuestionPool.objects.get_or_create(
                code=pool_code,
                defaults={"name": pool_name, "description": description},
            )
            TemplatePoolRule.objects.get_or_create(
                template=template,
                section=section,
                pool=pool,
                defaults={"random_count": 0, "order": order},
            )
            questions.extend(self._seed_questions(pool, order))

        return template, sections, questions

    def _seed_questions(self, pool, section_order):
        specs = {
            "DEMO_NIGHT_DRIVING": [
                {
                    "format": "rating",
                    "title": "Maitrise de la trajectoire",
                    "text": "Notez la stabilite et l'anticipation en conduite de nuit.",
                    "rubric": {"min": 0, "max": 10},
                    "points": 10,
                },
                {
                    "format": "yes_no",
                    "title": "Feux controles",
                    "text": "Le conducteur controle-t-il les feux avant le depart ?",
                    "explanation": "Oui",
                    "points": 10,
                },
            ],
            "DEMO_HAZMAT": [
                {
                    "format": "mcq",
                    "title": "Equipements ADR",
                    "text": "Quels equipements sont obligatoires ?",
                    "explanation": "Gilet\nExtincteur",
                    "rubric": {"options": ["Gilet", "Extincteur", "Sandales"]},
                    "points": 10,
                },
                {
                    "format": "true_false",
                    "title": "Document ADR valide",
                    "text": "Le document ADR doit etre disponible pendant le trajet.",
                    "explanation": "Vrai",
                    "is_eliminatory": True,
                    "points": 10,
                },
            ],
            "DEMO_MECHANICAL": [
                {
                    "format": "practical",
                    "title": "Inspection pneus",
                    "text": "Controlez pression, usure et anomalies visibles.",
                    "points": 10,
                },
            ],
        }

        created_questions = []
        for order, spec in enumerate(specs[pool.code]):
            question, _ = SkillQuestion.objects.get_or_create(
                pool=pool,
                title=spec["title"],
                defaults={
                    "format": spec["format"],
                    "text": spec["text"],
                    "explanation": spec.get("explanation", ""),
                    "rubric": spec.get("rubric", {}),
                    "is_mandatory": True,
                    "is_eliminatory": spec.get("is_eliminatory", False),
                    "points": spec["points"],
                    "order": section_order * 10 + order,
                },
            )
            created_questions.append(question)
        return created_questions

    def _seed_template_version(self, template, sections):
        version, _ = TemplateVersion.objects.get_or_create(template=template, version=1)
        versioned_sections = {}
        for section in sections:
            versioned_section, _ = VersionedSection.objects.get_or_create(
                template_version=version,
                name=section.name,
                defaults={"order": section.order},
            )
            versioned_sections[section.name] = versioned_section
            for rule in section.pool_rules.select_related("pool").all():
                VersionedPool.objects.get_or_create(
                    template_version=version,
                    section=versioned_section,
                    code=rule.pool.code,
                    defaults={
                        "name": rule.pool.name,
                        "random_count": rule.random_count,
                        "order": rule.order,
                    },
                )
        return version, versioned_sections

    def _seed_application(self, candidate, position):
        application, _ = JobApplication.objects.get_or_create(
            candidate=candidate,
            position=position,
            defaults={"status": "applied"},
        )
        return application

    def _seed_evaluations(
        self,
        *,
        application,
        template_version,
        versioned_sections,
        questions,
        manager,
    ):
        in_progress, _ = Evaluation.objects.get_or_create(
            application=application,
            template_version=template_version,
            status="in_progress",
            defaults={
                "subject": application.candidate.user,
                "position": application.position,
                "assigned_to": manager,
                "internal_comment": "Evaluation demo en cours.",
            },
        )
        completed, _ = Evaluation.objects.get_or_create(
            application=application,
            template_version=template_version,
            status="completed",
            defaults={
                "subject": application.candidate.user,
                "position": application.position,
                "assigned_to": manager,
                "subject_comment": "Evaluation demo completee.",
                "internal_comment": "Candidat pret pour validation finale.",
                "completed_at": timezone.now(),
            },
        )

        for evaluation in (in_progress, completed):
            for versioned_section in versioned_sections.values():
                EvaluationSectionAssignment.objects.get_or_create(
                    evaluation=evaluation,
                    section=versioned_section,
                    defaults={
                        "assigned_to": manager,
                        "manager_comment": (
                            "Section demo completee."
                            if evaluation.status == "completed"
                            else ""
                        ),
                        "completed_at": (
                            timezone.now() if evaluation.status == "completed" else None
                        ),
                    },
                )

        for question in questions[:3]:
            EvaluationResponse.objects.get_or_create(
                evaluation=completed,
                question=question,
                defaults={
                    "candidate_answer": question.explanation or "Controle realise",
                    "manager_comment": "Reponse demo validee.",
                    "score": question.points,
                },
            )
