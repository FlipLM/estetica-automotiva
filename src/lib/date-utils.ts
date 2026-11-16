export type FinancialPeriod =
  | "current_month"
  | "last_month"
  | "7_days"
  | "year"
  | "all";

const DATE_ONLY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Faz o parse de uma string de data ("YYYY-MM-DD" ou ISO) sem o bug de fuso UTC-3
 * onde `new Date("YYYY-MM-DD")` cria meia-noite UTC e vira dia anterior às 21h BRT.
 * Para datas sem horário ("YYYY-MM-DD"), fixa 12:00:00 no horário local para garantir
 * que o dia do calendário seja preservado na leitura e na exibição.
 */
export function parseDateInput(value: string): Date {
  const trimmed = value.trim();
  const match = DATE_ONLY_REGEX.exec(trimmed);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return new Date(year, month, day, 12, 0, 0, 0);
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Data inválida.");
  }
  return parsed;
}

/**
 * Converte string de data para o início do dia (00:00:00.000) no fuso local.
 */
export function parseRangeStart(value: string): Date {
  const trimmed = value.trim();
  const match = DATE_ONLY_REGEX.exec(trimmed);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      0,
      0,
      0,
      0
    );
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Data inicial inválida.");
  }
  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    0,
    0,
    0,
    0
  );
}

/**
 * Converte string de data para o fim do dia (23:59:59.999) no fuso local.
 */
export function parseRangeEnd(value: string): Date {
  const trimmed = value.trim();
  const match = DATE_ONLY_REGEX.exec(trimmed);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      23,
      59,
      59,
      999
    );
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Data final inválida.");
  }
  return new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    23,
    59,
    59,
    999
  );
}

/**
 * Formata uma Date ou ISO string para "YYYY-MM-DD" no fuso local (ideal para <input type="date">).
 */
export function formatDateInputValue(date?: Date | string | null): string {
  const d = date ? (typeof date === "string" ? new Date(date) : date) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayStart(reference = new Date()): Date {
  return new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
    0,
    0,
    0,
    0
  );
}

export function getTodayEnd(reference = new Date()): Date {
  return new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
    23,
    59,
    59,
    999
  );
}

export function getDaysFromTodayEnd(days: number, reference = new Date()): Date {
  return new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate() + days,
    23,
    59,
    59,
    999
  );
}

/**
 * Soma meses preservando o dia original do calendário (ex: 31/01 + 1 mês = 28/02),
 * fixando 12:00:00 no fuso local para evitar deslocamentos em UTC-3.
 */
export function addMonthsPreservingDay(baseDate: Date, monthsToAdd: number): Date {
  const originalDay = baseDate.getDate();
  const targetYear = baseDate.getFullYear();
  const targetMonth = baseDate.getMonth() + monthsToAdd;
  // Último dia do mês alvo
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(originalDay, lastDayOfTargetMonth);
  return new Date(targetYear, targetMonth, clampedDay, 12, 0, 0, 0);
}

/**
 * Monta intervalo consistente [startDate (00:00:00.000), endDate (23:59:59.999)]
 * a partir de `period`, `startDate`/`endDate` explícitos ou `month` ("YYYY-MM").
 */
export function getPeriodDateRange(options: {
  period?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  month?: string | null;
  reference?: Date;
}): { startDate: Date; endDate: Date; period: string } {
  const now = options.reference ?? new Date();

  if (options.startDate || options.endDate) {
    const startDate = options.startDate
      ? parseRangeStart(options.startDate)
      : new Date(2020, 0, 1, 0, 0, 0, 0);
    const endDate = options.endDate
      ? parseRangeEnd(options.endDate)
      : getTodayEnd(now);
    return { startDate, endDate, period: "custom" };
  }

  if (options.month && /^\d{4}-\d{2}$/.test(options.month)) {
    const [yearStr, monthStr] = options.month.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    return {
      startDate: new Date(year, monthIndex, 1, 0, 0, 0, 0),
      endDate: new Date(year, monthIndex + 1, 0, 23, 59, 59, 999),
      period: "month",
    };
  }

  const period = options.period || "current_month";

  switch (period) {
    case "last_month":
      return {
        startDate: new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0),
        endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
        period: "last_month",
      };
    case "7_days":
      return {
        startDate: new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - 6,
          0,
          0,
          0,
          0
        ),
        endDate: getTodayEnd(now),
        period: "7_days",
      };
    case "year":
      return {
        startDate: new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0),
        endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
        period: "year",
      };
    case "all":
      return {
        startDate: new Date(2020, 0, 1, 0, 0, 0, 0),
        endDate: new Date(now.getFullYear() + 10, 11, 31, 23, 59, 59, 999),
        period: "all",
      };
    case "current_month":
    default:
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
        period: "current_month",
      };
  }
}
