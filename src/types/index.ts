// Person types
export type Gender = 'male' | 'female';
export type Category = 'family' | 'friend';

export interface Person {
  id: string;
  name: string;
  birthDate: string; // ISO string of birth date (solar)
  birthTime?: string; // HH:mm:ss format
  isLunar: boolean; // true = lunar birthday
  gender: Gender;
  category: Category;
  visibleTo: string[]; // IDs of users/groups who can see this person
  createdAt: string;
  updatedAt: string;
}

// User types
export type UserRole = 'admin' | 'visitor';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  createdAt: string;
}

// Birthday calculation result
export interface BirthdayInfo {
  person: Person;
  nextBirthdayDate: Date;
  daysUntilBirthday: number;
  age: number; // Will be -1 for adult females
  isToday: boolean;
}

// Detailed age info
export interface DetailedAge {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

// Life stats
export interface LifeStats {
  totalDaysLived: number;
  detailedAge: DetailedAge;
  daysUntilNextBirthday: number;
  nextBirthdayDate: Date;
  ageAtNextBirthday: number;
}
