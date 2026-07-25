// The client-safe /directory payload (api-contract.md §4). camelCase — the API
// layer translates from the snake_case database. No drafts, PII, or availability.

export type PracticeCapacity = "prosecution" | "defence" | "both";

export interface FilterPanel {
  slug: string;
  name: string;
  type: "general" | "specialist";
}
export interface FilterGrade {
  slug: string;
  name: string;
  rank: number;
}
export interface FilterPracticeArea {
  slug: string;
  name: string;
}
export interface FilterRole {
  slug: string;
  name: string;
  abbreviation: string | null;
}

export interface DirectoryFilters {
  panels: FilterPanel[];
  grades: FilterGrade[];
  practiceAreas: FilterPracticeArea[];
  roles: FilterRole[];
  practiceCapacities: PracticeCapacity[];
}

export interface CounselPanel {
  panelSlug: string;
  panelName: string;
  type: "general" | "specialist";
  grade: string | null;
  gradeRank: number | null;
}
export interface CounselPracticeArea {
  slug: string;
  name: string;
  isPrimary: boolean;
}
export interface CounselRole {
  slug: string;
  name: string;
  abbreviation: string | null;
}
export interface CounselNotableCase {
  title: string;
  citation: string | null;
  year: number | null;
  court: string | null;
  roleInCase: string | null;
  summary: string | null;
}
export interface CounselImage {
  url: string;
  alt: string;
}

export interface DirectoryCounsel {
  id: string;
  slug: string;
  fullName: string;
  yearOfCall: number | null;
  practiceCapacity: PracticeCapacity;
  shortBio: string | null;
  roles: CounselRole[];
  practiceAreas: CounselPracticeArea[];
  panels: CounselPanel[];
  notableCases: CounselNotableCase[];
  image: CounselImage | null;
  updatedAt: string;
}

export interface DirectoryPayload {
  chambers: { name: string; slug: string };
  generatedAt: string;
  filters: DirectoryFilters;
  counsel: DirectoryCounsel[];
}
