import { Lunar, Solar } from 'lunar-javascript';
import { Person, BirthdayInfo, DetailedAge, LifeStats } from '@/types';

// Parse stored birthDate which may be lunar or solar.
// If `isLunar` is true, `birthDateStr` is expected to be a YYYY-MM-DD lunar date.
// Returns lunar components and the corresponding solar Date for that lunar Y-M-D.
function parseBirthDateAsLunar(birthDateStr: string, isLunar: boolean): { lunarYear: number; lunarMonth: number; lunarDay: number; solarDate: Date } {
  if (isLunar) {
    const parts = birthDateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    const solar = Lunar.fromYmd(y, m, d).getSolar();
    const solarDate = new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay());
    return { lunarYear: y, lunarMonth: m, lunarDay: d, solarDate };
  } else {
    const sd = new Date(birthDateStr);
    const lunar = Solar.fromYmd(sd.getFullYear(), sd.getMonth() + 1, sd.getDate()).getLunar();
    return { lunarYear: lunar.getYear(), lunarMonth: lunar.getMonth(), lunarDay: lunar.getDay(), solarDate: sd };
  }
}

// Get the next birthday date for a person
export function getNextBirthday(person: Person, referenceDate: Date = new Date()): Date {
  const birthDate = new Date(person.birthDate);
  const reference = new Date(referenceDate);

  let nextBirthday: Date;

  if (person.isLunar) {
    // Lunar birthday calculation - following Python logic
    // 1. Get reference date's lunar year
    const lunarRef = Solar.fromYmd(reference.getFullYear(), reference.getMonth() + 1, reference.getDate()).getLunar();
    const lunarYear = lunarRef.getYear();

    // 2. Get birth lunar month and day from stored birthDate (may be lunar)
    const parsedBirth = parseBirthDateAsLunar(person.birthDate, person.isLunar);
    const { lunarMonth, lunarDay } = parsedBirth;

    // 3. Calculate this year's lunar birthday
    let solarNext = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay).getSolar();
    let solarNextDate = new Date(solarNext.getYear(), solarNext.getMonth() - 1, solarNext.getDay());

    // 4. If this year's birthday has passed, calculate next year's
    // Compare dates only (ignore time)
    const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
    const birthdayThisYear = new Date(solarNextDate.getFullYear(), solarNextDate.getMonth(), solarNextDate.getDate());

    if (birthdayThisYear < today) {
      // Day has passed, go to next year
      solarNext = Lunar.fromYmd(lunarYear + 1, lunarMonth, lunarDay).getSolar();
      solarNextDate = new Date(solarNext.getYear(), solarNext.getMonth() - 1, solarNext.getDay());
    }

    nextBirthday = solarNextDate;
  } else {
    // Solar birthday calculation - compare dates only
    const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
    nextBirthday = new Date(reference.getFullYear(), birthDate.getMonth(), birthDate.getDate());

    // If this year's birthday has already passed (date only comparison), use next year
    const nextBirthdayDate = new Date(nextBirthday.getFullYear(), nextBirthday.getMonth(), nextBirthday.getDate());
    if (nextBirthdayDate < today) {
      nextBirthday.setFullYear(reference.getFullYear() + 1);
    }
  }

  // Add time if specified
  if (person.birthTime) {
    const [hours, minutes, seconds = 0] = person.birthTime.split(':').map(Number);
    nextBirthday.setHours(hours, minutes, seconds);
  }

  return nextBirthday;
}

// Calculate age using relativedelta-like logic
// skipPrivacyCheck: if true, returns actual age even for adult females (used in admin panel)
export function calculateAge(person: Person, referenceDate: Date = new Date(), skipPrivacyCheck: boolean = false): number {
  const birthDate = new Date(person.birthDate);
  const reference = new Date(referenceDate);

  let years: number;
  let months: number;
  let days: number;

  if (person.isLunar) {
    // For lunar birthdays, calculate age based on lunar calendar
    const parsedBirth = parseBirthDateAsLunar(person.birthDate, person.isLunar);
    const { lunarMonth, lunarDay, lunarYear: birthLunarYear } = parsedBirth;

    // Get lunar reference date
    const lunarRef = Solar.fromYmd(reference.getFullYear(), reference.getMonth() + 1, reference.getDate()).getLunar();
    const lunarYear = lunarRef.getYear();

    // Calculate this year's lunar birthday
    const thisYearBirthdayLunar = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay);
    const thisYearBirthdaySolar = thisYearBirthdayLunar.getSolar();
    const thisYearBirthday = new Date(thisYearBirthdaySolar.getYear(), thisYearBirthdaySolar.getMonth() - 1, thisYearBirthdaySolar.getDay());

    // Compare dates only (ignore time) to determine if birthday has passed
    const today = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
    const birthdayDate = new Date(thisYearBirthday.getFullYear(), thisYearBirthday.getMonth(), thisYearBirthday.getDate());
    const hasHadBirthday = birthdayDate <= today;
    years = lunarYear - birthLunarYear;
    if (!hasHadBirthday) {
      years--;
    }

    // Calculate months and days for relativedelta-like precision
    let refForCalc = new Date(reference);
    if (!hasHadBirthday) {
      // Use last year's birthday as reference
      const lastYearBirthdayLunar = Lunar.fromYmd(lunarYear - 1, lunarMonth, lunarDay);
      const lastYearBirthdaySolar = lastYearBirthdayLunar.getSolar();
      refForCalc = new Date(lastYearBirthdaySolar.getYear(), lastYearBirthdaySolar.getMonth() - 1, lastYearBirthdaySolar.getDay());
    } else {
      refForCalc = thisYearBirthday;
    }

    // Calculate months and days since last birthday
    months = reference.getMonth() - refForCalc.getMonth();
    days = reference.getDate() - refForCalc.getDate();

    if (days < 0) {
      const prevMonth = new Date(reference.getFullYear(), reference.getMonth(), 0);
      days += prevMonth.getDate();
      months--;
    }
    if (months < 0) {
      months += 12;
    }
  } else {
    // Solar birthday calculation using relativedelta-like logic
    years = reference.getFullYear() - birthDate.getFullYear();
    months = reference.getMonth() - birthDate.getMonth();
    days = reference.getDate() - birthDate.getDate();

    if (days < 0) {
      const prevMonth = new Date(reference.getFullYear(), reference.getMonth(), 0);
      days += prevMonth.getDate();
      months--;
    }
    if (months < 0) {
      months += 12;
      years--;
    }
  }

  const actualAge = years;

  // Adult female privacy protection (skip if admin panel)
  if (!skipPrivacyCheck && person.gender === 'female' && actualAge >= 18) {
    return -1;
  }

  return actualAge;
}

// Calculate days until next birthday - following Python lunar_age logic
export function getDaysUntilBirthday(person: Person, referenceDate: Date = new Date()): number {
  const birthDate = new Date(person.birthDate);
  const reference = new Date(referenceDate);

  if (person.isLunar) {
    // For lunar birthdays, calculate based on lunar calendar
    const parsedBirth = parseBirthDateAsLunar(person.birthDate, person.isLunar);
    const { lunarMonth, lunarDay } = parsedBirth;

    // Get today's lunar date
    const lunarRef = Solar.fromYmd(reference.getFullYear(), reference.getMonth() + 1, reference.getDate()).getLunar();
    const lunarYear = lunarRef.getYear();

    // Calculate next lunar birthday
    let nextBirthdayLunar = Lunar.fromYmd(lunarYear, lunarMonth, lunarDay);
    let nextBirthdaySolar = nextBirthdayLunar.getSolar();
    let nextBirthdayDate = new Date(nextBirthdaySolar.getYear(), nextBirthdaySolar.getMonth() - 1, nextBirthdaySolar.getDay());

    // Create datetime objects for comparison (similar to Python)
    const todayTime = new Date(reference);
    todayTime.setHours(0, 0, 0, 0);

    // Calculate days until next birthday
    let leftDays = Math.ceil((nextBirthdayDate.getTime() - todayTime.getTime()) / (1000 * 60 * 60 * 24));

    // If already passed, calculate next year's
    if (leftDays < 0) {
      nextBirthdayLunar = Lunar.fromYmd(lunarYear + 1, lunarMonth, lunarDay);
      nextBirthdaySolar = nextBirthdayLunar.getSolar();
      nextBirthdayDate = new Date(nextBirthdaySolar.getYear(), nextBirthdaySolar.getMonth() - 1, nextBirthdaySolar.getDay());
      leftDays = Math.ceil((nextBirthdayDate.getTime() - todayTime.getTime()) / (1000 * 60 * 60 * 24));
    }

    return leftDays;
  } else {
    // Solar birthday calculation - compare dates only, ignore time
    const nextBirthday = getNextBirthday(person, referenceDate);
    const todayDate = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
    const birthdayDate = new Date(nextBirthday.getFullYear(), nextBirthday.getMonth(), nextBirthday.getDate());
    const diffTime = birthdayDate.getTime() - todayDate.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }
}

// Check if today is the person's birthday
export function isBirthdayToday(person: Person, referenceDate: Date = new Date()): boolean {
  return getDaysUntilBirthday(person, referenceDate) === 0;
}

// Calculate detailed age (years, months, days, hours, minutes, seconds) using relativedelta-like logic
export function calculateDetailedAge(person: Person, referenceDate: Date = new Date()): DetailedAge {
  const reference = new Date(referenceDate);

  // Parse birth time
  let birthHours = 0, birthMinutes = 0, birthSeconds = 0;
  if (person.birthTime) {
    const [h, m, s = 0] = person.birthTime.split(':').map(Number);
    birthHours = h;
    birthMinutes = m;
    birthSeconds = s;
  }

  // Get birth date as solar calendar date and time
  let birthYear: number, birthMonth: number, birthDay: number;

  if (person.isLunar) {
    // For lunar birthdays, convert to solar
    const parsed = parseBirthDateAsLunar(person.birthDate, person.isLunar);
    birthYear = parsed.solarDate.getFullYear();
    birthMonth = parsed.solarDate.getMonth() + 1; // JavaScript months are 0-11
    birthDay = parsed.solarDate.getDate();
  } else {
    const bd = new Date(person.birthDate);
    birthYear = bd.getFullYear();
    birthMonth = bd.getMonth() + 1;
    birthDay = bd.getDate();
  }

  // Create birth datetime
  const birthDateTime = new Date(birthYear, birthMonth - 1, birthDay, birthHours, birthMinutes, birthSeconds);

  // Create reference datetime
  const refDateTime = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), reference.getHours(), reference.getMinutes(), reference.getSeconds());

  // Calculate relativedelta: refDateTime - birthDateTime
  let years = refDateTime.getFullYear() - birthDateTime.getFullYear();
  let months = refDateTime.getMonth() - birthDateTime.getMonth();
  let days = refDateTime.getDate() - birthDateTime.getDate();
  let hours = refDateTime.getHours() - birthDateTime.getHours();
  let minutes = refDateTime.getMinutes() - birthDateTime.getMinutes();
  let seconds = refDateTime.getSeconds() - birthDateTime.getSeconds();

  // Normalize seconds
  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }

  // Normalize minutes
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }

  // Normalize hours
  if (hours < 0) {
    hours += 24;
    days--;
  }

  // Normalize days
  if (days < 0) {
    // Get days in previous month
    const prevMonth = new Date(refDateTime.getFullYear(), refDateTime.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }

  // Normalize months
  if (months < 0) {
    months += 12;
    years--;
  }

  return { years, months, days, hours, minutes, seconds };
}

// Calculate total days lived - following Python lunar_age logic
export function calculateTotalDaysLived(person: Person, referenceDate: Date = new Date()): number {
  const birthDate = new Date(person.birthDate);
  const reference = new Date(referenceDate);

  let actualBirthDate: Date;

  if (person.isLunar) {
    // For lunar birthdays, parse the stored lunar birth date and get its solar equivalent
    const parsed = parseBirthDateAsLunar(person.birthDate, person.isLunar);
    actualBirthDate = parsed.solarDate;
  } else {
    actualBirthDate = birthDate;
  }

  // Create birth datetime with time if specified
  const birth = person.birthTime
    ? new Date(
        actualBirthDate.getFullYear(),
        actualBirthDate.getMonth(),
        actualBirthDate.getDate(),
        ...person.birthTime.split(':').map(Number) as [number, number, number]
      )
    : new Date(actualBirthDate);

  // Reset time part of reference to compare dates only
  const referenceDateOnly = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const birthDateOnly = new Date(birth.getFullYear(), birth.getMonth(), birth.getDate());

  const diffTime = referenceDateOnly.getTime() - birthDateOnly.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// Get birthday info object
export function getBirthdayInfo(person: Person, referenceDate: Date = new Date()): BirthdayInfo {
  const nextBirthday = getNextBirthday(person, referenceDate);
  const daysUntil = getDaysUntilBirthday(person, referenceDate);
  const age = calculateAge(person, nextBirthday);

  return {
    person,
    nextBirthdayDate: nextBirthday,
    daysUntilBirthday: daysUntil,
    age,
    isToday: isBirthdayToday(person, referenceDate),
  };
}

// Get life stats for a person (admin panel - no privacy restrictions)
export function getLifeStats(person: Person, referenceDate: Date = new Date()): LifeStats {
  const nextBirthday = getNextBirthday(person, referenceDate);
  const daysUntil = getDaysUntilBirthday(person, referenceDate);
  const totalDays = calculateTotalDaysLived(person, referenceDate);
  const detailedAge = calculateDetailedAge(person, referenceDate);
  const ageAtNextBirthday = calculateAge(person, nextBirthday, true);

  return {
    totalDaysLived: totalDays,
    detailedAge,
    daysUntilNextBirthday: daysUntil,
    nextBirthdayDate: nextBirthday,
    ageAtNextBirthday,
  };
}

// Get upcoming birthdays within specified days
export function getUpcomingBirthdays(
  people: Person[],
  daysAhead: number = 90,
  referenceDate: Date = new Date()
): BirthdayInfo[] {
  return people
    .map(person => getBirthdayInfo(person, referenceDate))
    .filter(info => info.daysUntilBirthday <= daysAhead)
    .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
}

// Format duration in a readable format
export function formatDetailedAge(age: DetailedAge): string {
  const parts: string[] = [];

  if (age.years > 0) parts.push(`${age.years}岁`);
  if (age.months > 0) parts.push(`${age.months}个月`);
  if (age.days > 0) parts.push(`${age.days}天`);
  if (age.hours > 0) parts.push(`${age.hours}小时`);
  if (age.minutes > 0) parts.push(`${age.minutes}分钟`);
  if (age.seconds > 0) parts.push(`${age.seconds}秒`);

  return parts.join(' ') || '0天';
}

// Check if date is within the next 3 months
export function isWithinThreeMonths(date: Date, referenceDate: Date = new Date()): boolean {
  const threeMonthsLater = new Date(referenceDate);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  return date <= threeMonthsLater;
}
