
export enum Category {
  ENGINEERING = 'Engineering',
  MATHEMATICS = 'Mathematics',
  COMPUTER_SCIENCE = 'Computer Science',
  ARTS_UI = 'Arts & UI',
  ETHICS = 'Ethics & Governance',
  MANAGEMENT = 'Management',
  DESIGN = 'Design',
  HUMANITIES = 'Humanities',
  COMMUNICATION = 'Communication'
}

export enum Difficulty {
  FOUNDATIONAL = 'Foundational (01)',
  INTERMEDIATE = 'Intermediate (02)',
  ADVANCED = 'Advanced (03)',
  EXPERT = 'Expert (04)'
}

export interface CurricularUnit {
  id: string;
  name: string;
  description: string;
  content?: string; 
  contentUrl?: string; 
  syllabusUrl?: string; 
  ects: number;
  semester: number;
  year: number;
  category: Category;
  difficulty: Difficulty;
  duration: string;
  contributor: string;
  tags: string[];
  courseId: string;
  prerequisites?: string[]; // IDs of required previous units
}

export interface Course {
  id: string;
  title: string;
  description: string;
  ects: number;
  semesters: number;
  institution: string;
  school: string;
  degreeType: 'bachelor' | 'master' | 'other';
  language: string;
  longDescription: string;
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  units: string[]; 
  estimatedHours: number;
  creator: string;
}

export interface FilterState {
  category: Category | 'All';
  difficulty: Difficulty | 'All';
  search: string;
  onlySaved: boolean;
  courseId: string | 'All';
  year: number | 'All';
  semester: number | 'All';
}
