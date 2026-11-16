/**
 * Regra oficial de cálculo de taxa de comissão por item da OS:
 * 1. Se `explicitRate` foi enviado explicitamente no item, utiliza-o.
 * 2. Caso contrário, se o colaborador responsável (`assignedUser.commissionRate`)
 *    possuir taxa configurada > 0, ela sobrescreve a taxa padrão do serviço.
 * 3. Caso contrário, utiliza `serviceDefaultCommission ?? 10`.
 */
export function resolveItemCommissionRate({
  explicitRate,
  userCommissionRate,
  serviceDefaultCommission,
}: {
  explicitRate?: number | null;
  userCommissionRate?: number | null;
  serviceDefaultCommission?: number | null;
}): number {
  if (explicitRate !== undefined && explicitRate !== null) {
    return explicitRate;
  }

  if (userCommissionRate !== undefined && userCommissionRate !== null && userCommissionRate > 0) {
    return userCommissionRate;
  }

  return serviceDefaultCommission ?? 10;
}
