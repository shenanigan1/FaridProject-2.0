import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, forkJoin, expand, map, reduce } from 'rxjs';

export type AdminTestStatus = 'in_progress' | 'completed' | 'validated' | 'rejected' | string;
export type AdminTemplateDifficulty = 'easy' | 'medium' | 'hard' | string;

interface Paginated<T> {
  results: T[];
  next?: string | null;
}

interface EvaluationDto {
  id: number;
  subject: number;
  application: number | null;
  status: AdminTestStatus;
  template_name?: string;
  subject_full_name?: string;
  subject_email?: string;
  position_title?: string;
  assigned_to_full_name?: string;
  updated_at?: string;
  created_at?: string;
  progress_percent?: number | null;
  completed_sections_count?: number | null;
  total_sections_count?: number | null;
}

interface TemplateDto {
  id: number;
  name: string;
  description?: string | null;
  difficulty?: AdminTemplateDifficulty;
  duration_minutes?: number | null;
  points_total?: number | null;
  min_pass_score?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  sections?: TemplateSectionDto[];
}

interface TemplateSectionDto {
  id: number | string;
  title?: string;
  name?: string;
  description?: string;
  weight?: number;
  questions?: { points?: number }[];
  pools?: unknown[];
}

interface QuestionnaireQuestionDto {
  question_id: number;
  section_id?: number;
  section_title?: string;
  format?: string;
  title?: string;
  text?: string;
  explanation?: string;
  is_mandatory?: boolean;
  is_eliminatory?: boolean;
  points: number;
  max_score?: number;
  difficulty?: string;
  rubric?: unknown;
  candidate_answer?: string;
  manager_comment?: string;
  score: number | null;
}

interface QuestionnaireSectionDto {
  section_id: number;
  title: string;
  description: string;
  weight: number;
  assigned_to: number | null;
  assigned_to_full_name: string;
  manager_comment: string;
  completed_at: string | null;
  questions: QuestionnaireQuestionDto[];
}

interface QuestionnaireDto {
  evaluation_id: number;
  template_name: string;
  test_manager_comment: string;
  sections: QuestionnaireSectionDto[];
  questions: QuestionnaireQuestionDto[];
}

export interface AdminValidationQueueItem {
  evaluationId: number;
  candidateId: number;
  applicationId: number | null;
  candidateName: string;
  candidateEmail: string;
  templateName: string;
  positionTitle: string;
  managerName: string;
  status: AdminTestStatus;
  statusLabel: string;
  receivedAt: string;
}

export interface AdminTestListItem extends AdminValidationQueueItem {
  progressPercent: number;
  completedSectionsCount: number;
  totalSectionsCount: number;
}

export interface AdminTemplateCard {
  id: number;
  name: string;
  description: string;
  difficulty: AdminTemplateDifficulty;
  durationMinutes: number;
  pointsTotal: number;
}

export interface LaunchSectionVm {
  id: number;
  title: string;
  weight: number;
  points: number;
  durationMinutes: number;
}

export interface ManagerOption {
  id: number;
  full_name: string;
  email: string;
}

export interface LaunchContext {
  applicationId: number;
  templateId: number;
  templateName: string;
  sections: LaunchSectionVm[];
  managers: ManagerOption[];
}

export interface AdminAssessmentModule {
  sectionId: number;
  title: string;
  score: number;
  maxScore: number;
}

export interface AdminAssessmentQuestion {
  questionId: number;
  title: string;
  text: string;
  format: string;
  candidateAnswer: string;
  correctAnswer: string;
  managerComment: string;
  score: number | null;
  maxScore: number;
  isMandatory: boolean;
  isEliminatory: boolean;
}

export interface AdminAssessmentSection {
  sectionId: number;
  title: string;
  description: string;
  score: number;
  maxScore: number;
  assignedToFullName: string;
  managerComment: string;
  completedAt: string | null;
  questions: AdminAssessmentQuestion[];
}

export interface AdminAssessment {
  evaluationId: number;
  candidateId: number;
  applicationId: number | null;
  candidateName: string;
  templateName: string;
  positionTitle: string;
  score: number;
  maxScore: number;
  status: AdminTestStatus;
  feedback: string;
  evaluatorName: string;
  modules: AdminAssessmentModule[];
  sections: AdminAssessmentSection[];
}

export interface LaunchEvaluationResult {
  id: number;
  application: number;
  status: string;
}

function isPaginatedPayload<T>(value: unknown): value is Paginated<T> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    && Array.isArray((value as Paginated<T>).results);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringifyAnswer(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => stringifyAnswer(item)).filter(Boolean).join(', ');
  }
  if (isRecord(value)) {
    return stringifyAnswer(value['label'] ?? value['text'] ?? value['value'] ?? value['answer']);
  }
  return '';
}

function splitAnswers(raw: unknown): string[] {
  if (raw === null || raw === undefined || raw === '') return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => stringifyAnswer(item)).filter(Boolean);
  }
  if (typeof raw !== 'string') {
    return [String(raw)];
  }

  const trimmed = raw.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) return splitAnswers(parsed);
    if (parsed !== null && parsed !== undefined && typeof parsed !== 'object') return [String(parsed)];
  } catch {
    // Plain text answers are split below.
  }

  return trimmed.split(/[\n;,|]+/).map((entry) => entry.trim()).filter(Boolean);
}

@Injectable({ providedIn: 'root' })
export class TestsAdminBffService {
  private readonly http = inject(HttpClient);

  listValidationQueue(): Observable<AdminValidationQueueItem[]> {
    return this.fetchAll<EvaluationDto>('/api/evaluations/').pipe(
      map((evaluations) =>
        evaluations
          .map((evaluation) => this.toQueueItem(evaluation))
          .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt)),
      ),
    );
  }

  listActiveTests(): Observable<AdminTestListItem[]> {
    return this.fetchAll<EvaluationDto>('/api/evaluations/').pipe(
      map((evaluations) =>
        evaluations
          .map((evaluation) => this.toTestListItem(evaluation))
          .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt)),
      ),
    );
  }

  listTemplates(): Observable<AdminTemplateCard[]> {
    return this.fetchAll<TemplateDto>('/api/templates/').pipe(
      map((templates) => templates.map((template) => this.toTemplateCard(template))),
    );
  }

  getLaunchContext(applicationId: number, templateId: number): Observable<LaunchContext> {
    return forkJoin({
      template: this.http.get<TemplateDto>(`/api/templates/${templateId}/`),
      managers: this.http.get<ManagerOption[]>('/api/evaluations/managers/'),
    }).pipe(
      map(({ template, managers }) => ({
        applicationId,
        templateId,
        templateName: template.name,
        sections: (template.sections ?? []).map((section) => this.toLaunchSection(section, template)),
        managers,
      })),
    );
  }

  launchEvaluation(
    applicationId: number,
    templateId: number,
    sectionAssignments: { section_id: number; manager_id: number }[],
  ): Observable<LaunchEvaluationResult[]> {
    return this.http
      .post<LaunchEvaluationResult | LaunchEvaluationResult[]>('/api/evaluations/launch/', {
        application_id: applicationId,
        template_id: templateId,
        section_assignments: sectionAssignments,
      })
      .pipe(map((payload) => (Array.isArray(payload) ? payload : [payload])));
  }

  getAssessment(evaluationId: number): Observable<AdminAssessment> {
    return forkJoin({
      evaluation: this.http.get<EvaluationDto>(`/api/evaluations/${evaluationId}/`),
      questionnaire: this.http.get<QuestionnaireDto>(`/api/evaluations/${evaluationId}/questionnaire/`),
    }).pipe(map(({ evaluation, questionnaire }) => this.toAssessment(evaluation, questionnaire)));
  }

  validateAssessment(evaluationId: number): Observable<{ ok: true }> {
    return this.http
      .patch<EvaluationDto>(`/api/evaluations/${evaluationId}/`, { status: 'validated' })
      .pipe(map(() => ({ ok: true as const })));
  }

  rejectAssessment(evaluationId: number): Observable<{ ok: true }> {
    return this.http
      .patch<EvaluationDto>(`/api/evaluations/${evaluationId}/`, { status: 'rejected' })
      .pipe(map(() => ({ ok: true as const })));
  }

  private fetchAll<T>(url: string): Observable<T[]> {
    return this.http.get<T[] | Paginated<T>>(url).pipe(
      expand((payload) => {
        if (!isPaginatedPayload<T>(payload) || !payload.next) {
          return EMPTY;
        }
        return this.http.get<T[] | Paginated<T>>(payload.next);
      }),
      map((payload) => (isPaginatedPayload<T>(payload) ? payload.results : payload)),
      reduce((allRows, rows) => [...allRows, ...rows], [] as T[]),
    );
  }

  private statusLabel(status: AdminTestStatus): string {
    if (status === 'in_progress') return 'En cours';
    if (status === 'completed') return 'Score sous revue';
    if (status === 'validated') return 'Valide';
    if (status === 'rejected') return 'Refuse';
    return status;
  }

  private toQueueItem(evaluation: EvaluationDto): AdminValidationQueueItem {
    return {
      evaluationId: evaluation.id,
      candidateId: evaluation.subject,
      applicationId: evaluation.application,
      candidateName: evaluation.subject_full_name || evaluation.subject_email || 'Non renseigne',
      candidateEmail: evaluation.subject_email ?? '',
      templateName: evaluation.template_name || 'Non renseigne',
      positionTitle: evaluation.position_title ?? '',
      managerName: evaluation.assigned_to_full_name ?? '',
      status: evaluation.status,
      statusLabel: this.statusLabel(evaluation.status),
      receivedAt: evaluation.updated_at ?? evaluation.created_at ?? '',
    };
  }

  private toTestListItem(evaluation: EvaluationDto): AdminTestListItem {
    const totalSectionsCount = Math.max(0, evaluation.total_sections_count ?? 0);
    const completedSectionsCount = Math.max(0, evaluation.completed_sections_count ?? 0);
    const progressFromSections =
      totalSectionsCount > 0 ? Math.round((completedSectionsCount / totalSectionsCount) * 100) : 0;

    return {
      ...this.toQueueItem(evaluation),
      progressPercent: this.clampPercent(evaluation.progress_percent ?? progressFromSections),
      completedSectionsCount,
      totalSectionsCount,
    };
  }

  private clampPercent(value: number): number {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  private toTemplateCard(template: TemplateDto): AdminTemplateCard {
    const sectionPoints = (template.sections ?? []).reduce(
      (sum, section) =>
        sum + (section.questions ?? []).reduce((questionSum, question) => questionSum + (question.points ?? 0), 0),
      0,
    );

    return {
      id: template.id,
      name: template.name,
      description: template.description?.trim() || '',
      difficulty: template.difficulty ?? 'medium',
      durationMinutes: template.duration_minutes ?? 0,
      pointsTotal: template.points_total ?? sectionPoints,
    };
  }

  private toLaunchSection(section: TemplateSectionDto, template: TemplateDto): LaunchSectionVm {
    const sectionPoints = (section.questions ?? []).reduce((sum, question) => sum + (question.points ?? 0), 0);
    return {
      id: Number(section.id),
      title: section.title || section.name || 'Section non renseignee',
      weight: section.weight ?? 0,
      points: sectionPoints,
      durationMinutes: template.duration_minutes ?? 0,
    };
  }

  private toAssessment(evaluation: EvaluationDto, questionnaire: QuestionnaireDto): AdminAssessment {
    const sections = questionnaire.sections.map((section) => {
      const maxScore = section.questions.reduce((sum, question) => sum + question.points, 0);
      const score = section.questions.reduce((sum, question) => sum + (question.score ?? 0), 0);
      return {
        sectionId: section.section_id,
        title: section.title,
        description: section.description ?? '',
        score: maxScore === 0 ? 0 : Math.round((score / maxScore) * 100),
        maxScore: 100,
        assignedToFullName: section.assigned_to_full_name ?? '',
        managerComment: section.manager_comment ?? '',
        completedAt: section.completed_at,
        questions: section.questions.map((question) => this.toAssessmentQuestion(question)),
      };
    });
    const maxRaw = questionnaire.questions.reduce((sum, question) => sum + question.points, 0);
    const rawScore = questionnaire.questions.reduce((sum, question) => sum + (question.score ?? 0), 0);

    return {
      evaluationId: evaluation.id,
      candidateId: evaluation.subject,
      applicationId: evaluation.application,
      candidateName: evaluation.subject_full_name || evaluation.subject_email || 'Non renseigne',
      templateName: evaluation.template_name || questionnaire.template_name,
      positionTitle: evaluation.position_title ?? '',
      score: maxRaw === 0 ? 0 : Math.round((rawScore / maxRaw) * 100),
      maxScore: 100,
      status: evaluation.status,
      feedback:
        questionnaire.test_manager_comment ||
        questionnaire.sections.map((section) => section.manager_comment).find(Boolean) ||
        '',
      evaluatorName:
        questionnaire.sections.map((section) => section.assigned_to_full_name).find(Boolean) ||
        evaluation.assigned_to_full_name ||
        '',
      modules: sections.map((section) => ({
        sectionId: section.sectionId,
        title: section.title,
        score: section.score,
        maxScore: section.maxScore,
      })),
      sections,
    };
  }

  private toAssessmentQuestion(question: QuestionnaireQuestionDto): AdminAssessmentQuestion {
    const maxScore = question.max_score ?? question.points;
    return {
      questionId: question.question_id,
      title: question.title?.trim() || question.text?.trim() || `Question ${question.question_id}`,
      text: question.text ?? '',
      format: question.format ?? '',
      candidateAnswer: this.formatAnswer(question.candidate_answer),
      correctAnswer: this.correctAnswer(question),
      managerComment: question.manager_comment ?? '',
      score: question.score,
      maxScore,
      isMandatory: question.is_mandatory ?? false,
      isEliminatory: question.is_eliminatory ?? false,
    };
  }

  private correctAnswer(question: QuestionnaireQuestionDto): string {
    const rubric = isRecord(question.rubric) ? question.rubric : {};
    const candidates = [
      rubric['correct_answers'],
      rubric['correct_answer'],
      rubric['answer'],
      question.explanation,
    ];
    for (const candidate of candidates) {
      const answers = splitAnswers(candidate);
      if (answers.length > 0) {
        return answers.join(', ');
      }
    }
    return '';
  }

  private formatAnswer(value: unknown): string {
    return splitAnswers(value).join(', ');
  }
}
