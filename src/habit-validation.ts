type HabitPayload = {
  name: string
  color: string
  goalPeriod: 'day' | 'week' | 'month'
  goalTarget: number
}

type HabitValidationResult =
  | { ok: true, value: HabitPayload }
  | { ok: false, error: string }

export const validateHabitPayload = (payload: unknown): HabitValidationResult => {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return { ok: false, error: 'Invalid habit' }
  }

  const { name, color, goalPeriod, goalTarget } = payload as Record<string, unknown>

  if (typeof name !== 'string' || name.trim() === '') {
    return { ok: false, error: 'Habit name is required' }
  }

  if (typeof color !== 'string' || !/^#[0-9A-F]{6}$/i.test(color)) {
    return { ok: false, error: 'Invalid habit color' }
  }

  if (goalPeriod !== 'day' && goalPeriod !== 'week' && goalPeriod !== 'month') {
    return { ok: false, error: 'Invalid goal period' }
  }

  if (
    typeof goalTarget !== 'number' ||
    !Number.isInteger(goalTarget) ||
    (goalPeriod === 'day' && goalTarget !== 1) ||
    (goalPeriod === 'week' && (goalTarget < 1 || goalTarget > 7)) ||
    (goalPeriod === 'month' && (goalTarget < 1 || goalTarget > 31))
  ) {
    return { ok: false, error: 'Invalid goal target' }
  }

  return {
    ok: true,
    value: {
      name: name.trim(),
      color,
      goalPeriod,
      goalTarget,
    },
  }
}
