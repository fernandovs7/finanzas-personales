import { useMemo } from "react";
import {
  attachBagFortnight,
  buildGeneratedSaving,
  getActiveBagFortnight,
  isPlanActiveInPeriod,
  monthlyLiabilityAmount,
  reservePerFortnightAmount,
  savingsReservePerFortnight,
  splitFixed,
  sumLiabilitiesForFortnight,
  totalLiabilityAmount
} from "../domain/finance.js";
import {
  activeHousingItems,
  effectiveFixedExpenses,
  findHousingStatus,
  housingFundFortnightAmount,
  housingMonthlyTotal,
  housingPersonFortnightAmount,
  housingPersonMonthlyTotal,
  housingTransferredAmount,
  isHousingTransferComplete
} from "../domain/housingFund.js";
import {
  TODAY,
  historyGroupLabel,
  sortByDate,
  toFortnight,
  toPeriod
} from "../utils/date.js";
import { money } from "../utils/money.js";

export function useFinanceSelectors({
  state,
  salaryDraft,
  movementDraft,
  summaryMode,
  historyFilter,
  historySearch
}) {
  const periods = useMemo(() => {
    const all = [
      ...state.incomes.map((item) => toPeriod(item.date)),
      ...state.liabilities.map((item) => toPeriod(item.date)),
      ...state.savings.map((item) => toPeriod(item.date)),
      ...state.savingPlans.map((item) => toPeriod(item.startDate || item.date))
    ];
    return [...new Set(all)].sort();
  }, [state]);

  const periodData = useMemo(() => {
    const period = state.selectedPeriod;
    const incomes = state.incomes.filter((item) => toPeriod(item.date) === period);
    const liabilities = state.liabilities.filter((item) => toPeriod(item.date) === period);
    const movements = state.movements
      .filter((item) => toPeriod(item.date) === period)
      .map((item) => attachBagFortnight(item, incomes));
    const explicitSavings = state.savings.filter((item) => toPeriod(item.date) === period);
    const generatedSavings = state.savingPlans
      .filter((item) => isPlanActiveInPeriod(item, period))
      .filter((plan) => !explicitSavings.some((item) => item.planId === plan.id))
      .map((plan) => buildGeneratedSaving(plan, period));
    const savings = sortByDate([...explicitSavings, ...generatedSavings]);
    const fixedExpenses = effectiveFixedExpenses(
      state.fixedExpenses,
      state.housingItems
    ).filter((item) => item.active);

    const incomeUsdTotal = incomes.reduce((sum, item) => sum + item.totalUsd, 0);

    const reservedPaymentsUsd = incomes.reduce((sum, item) => {
      const fortnight = toFortnight(item.date);
      return sum + sumLiabilitiesForFortnight(liabilities, fortnight, "USD");
    }, 0);

    const reservedSavingsUsd = incomes.reduce(
      (sum, item) => sum + (item.reserveSavingsUsd || 0),
      0
    );

    const reservedFixedUsd = incomes.reduce((sum, item) => {
      const fortnight = toFortnight(item.date);
      return sum + splitFixed(fixedExpenses, fortnight, "USD");
    }, 0);

    const incomeUsdConverted = incomes.reduce((sum, item) => {
      const fortnight = toFortnight(item.date);
      const paymentsUsd = sumLiabilitiesForFortnight(liabilities, fortnight, "USD");
      const fixedUsdForFortnight = splitFixed(fixedExpenses, fortnight, "USD");
      return (
        sum +
        Math.max(
          item.totalUsd - paymentsUsd - fixedUsdForFortnight - (item.reserveSavingsUsd || 0),
          0
        )
      );
    }, 0);

    const incomeCrc = incomes.reduce((sum, item) => {
      const fortnight = toFortnight(item.date);
      const paymentsUsd = sumLiabilitiesForFortnight(liabilities, fortnight, "USD");
      const fixedUsdForFortnight = splitFixed(fixedExpenses, fortnight, "USD");
      const convertedUsd = Math.max(
        item.totalUsd - paymentsUsd - fixedUsdForFortnight - (item.reserveSavingsUsd || 0),
        0
      );
      return sum + convertedUsd * item.rate;
    }, 0);

    const fixedUsd = fixedExpenses
      .filter((item) => item.currency === "USD")
      .reduce((sum, item) => sum + item.amount, 0);
    const fixedCrc = fixedExpenses
      .filter((item) => item.currency === "CRC")
      .reduce((sum, item) => sum + item.amount, 0);

    const liabilitiesUsd = liabilities
      .filter((item) => item.currency === "USD")
      .reduce((sum, item) => sum + item.amount, 0);
    const liabilitiesCrc = liabilities
      .filter((item) => item.currency === "CRC")
      .reduce((sum, item) => sum + item.amount, 0);

    const savingsTargetUsd = savings
      .filter((item) => item.currency === "USD")
      .reduce((sum, item) => sum + item.target, 0);
    const savingsTargetCrc = savings
      .filter((item) => item.currency === "CRC")
      .reduce((sum, item) => sum + item.target, 0);
    const savingsActualCrc = savings
      .filter((item) => item.currency === "CRC")
      .reduce((sum, item) => sum + item.actual, 0);
    const movementCrc = movements
      .filter((item) => item.currency === "CRC")
      .reduce((sum, item) => sum + item.amount, 0);
    const movementUsd = movements
      .filter((item) => item.currency === "USD")
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      incomes,
      liabilities,
      movements,
      savings,
      explicitSavings,
      generatedSavings,
      fixedExpenses,
      incomeUsdTotal,
      reservedPaymentsUsd,
      reservedFixedUsd,
      reservedSavingsUsd,
      incomeUsdConverted,
      incomeCrc,
      fixedUsd,
      fixedCrc,
      liabilitiesUsd,
      liabilitiesCrc,
      savingsTargetUsd,
      savingsTargetCrc,
      savingsActualCrc,
      movementCrc,
      movementUsd,
      availableCrcBudget: incomeCrc - fixedCrc - liabilitiesCrc - savingsTargetCrc,
      availableCrcActual: incomeCrc - fixedCrc - liabilitiesCrc - savingsActualCrc - movementCrc
    };
  }, [state]);

  const fixedTotals = useMemo(() => {
    const activeFixed = effectiveFixedExpenses(
      state.fixedExpenses,
      state.housingItems
    ).filter((item) => item.active);
    const monthlyCRC = activeFixed
      .filter((item) => item.currency === "CRC")
      .reduce((sum, item) => sum + item.amount, 0);
    const monthlyUSD = activeFixed
      .filter((item) => item.currency === "USD")
      .reduce((sum, item) => sum + item.amount, 0);
    const q1CRC = splitFixed(activeFixed, "Q1", "CRC");
    const q2CRC = splitFixed(activeFixed, "Q2", "CRC");
    const q1USD = splitFixed(activeFixed, "Q1", "USD");
    const q2USD = splitFixed(activeFixed, "Q2", "USD");
    return { monthlyCRC, monthlyUSD, q1CRC, q2CRC, q1USD, q2USD };
  }, [state.fixedExpenses, state.housingItems]);

  const fortnightStats = useMemo(() => {
    return ["Q1", "Q2"].map((fortnight) => {
      const incomes = periodData.incomes.filter((item) => toFortnight(item.date) === fortnight);
      const totalUsd = incomes.reduce((sum, item) => sum + item.totalUsd, 0);
      const liabilitiesUsd = sumLiabilitiesForFortnight(periodData.liabilities, fortnight, "USD");
      const liabilitiesCrc = sumLiabilitiesForFortnight(periodData.liabilities, fortnight, "CRC");
      const savingsCrc = periodData.savings
        .filter((item) => toFortnight(item.date) === fortnight && item.currency === "CRC")
        .reduce((sum, item) => sum + item.actual, 0);
      const movementCrc = periodData.movements
        .filter((item) => item.bagFortnight === fortnight && item.currency === "CRC")
        .reduce((sum, item) => sum + item.amount, 0);
      const movementUsd = periodData.movements
        .filter((item) => item.bagFortnight === fortnight && item.currency === "USD")
        .reduce((sum, item) => sum + item.amount, 0);

      const fixedUsd = splitFixed(periodData.fixedExpenses, fortnight, "USD");
      const fixedCrc = splitFixed(periodData.fixedExpenses, fortnight, "CRC");
      const reservedSavingsUsd = incomes.reduce(
        (sum, item) => sum + (item.reserveSavingsUsd || 0),
        0
      );
      const reservedFixedUsd = fixedUsd;
      const convertedUsd = incomes.reduce(
        (sum, item) =>
          sum +
          Math.max(
            item.totalUsd - liabilitiesUsd - fixedUsd - (item.reserveSavingsUsd || 0),
            0
          ),
        0
      );
      const incomeCrc = incomes.reduce(
        (sum, item) =>
          sum +
          Math.max(
            item.totalUsd - liabilitiesUsd - fixedUsd - (item.reserveSavingsUsd || 0),
            0
          ) *
            item.rate,
        0
      );

      return {
        fortnight,
        totalUsd,
        convertedUsd,
        incomeCrc,
        fixedUsd,
        fixedCrc,
        liabilitiesUsd,
        liabilitiesCrc,
        fixedAndLiabilitiesUsd: fixedUsd + liabilitiesUsd,
        fixedAndLiabilitiesCrc: fixedCrc + liabilitiesCrc,
        savingsCrc,
        movementCrc,
        movementUsd,
        reservedFixedUsd,
        reservedSavingsUsd,
        availableCrc: incomeCrc - fixedCrc - liabilitiesCrc - savingsCrc - movementCrc
      };
    });
  }, [periodData]);

  const salaryPreview = useMemo(() => {
    const rate = Number(salaryDraft.rate || 0);
    const fortnight = toFortnight(salaryDraft.date || `${state.selectedPeriod}-15`);
    const periodLiabilities = state.liabilities
      .filter((item) => toPeriod(item.date) === state.selectedPeriod);
    const reservePaymentsUsd = sumLiabilitiesForFortnight(periodLiabilities, fortnight, "USD");
    const effectiveFixed = effectiveFixedExpenses(
      state.fixedExpenses,
      state.housingItems
    );
    const reserveFixedUsd = splitFixed(effectiveFixed, fortnight, "USD");
    const reserveSavingsUsd = Number(salaryDraft.reserveSavingsUsd || 0);
    const usdToConvert = Math.max(
      Number(salaryDraft.totalUsd || 0) -
        reservePaymentsUsd -
        reserveFixedUsd -
        reserveSavingsUsd,
      0
    );
    const convertedCrc = rate > 0 ? usdToConvert * rate : 0;
    return {
      fortnight,
      reservePaymentsUsd,
      reserveFixedUsd,
      reserveSavingsUsd,
      usdToConvert,
      convertedCrc
    };
  }, [salaryDraft.date, salaryDraft.rate, salaryDraft.reserveSavingsUsd, salaryDraft.totalUsd, state.fixedExpenses, state.housingItems, state.liabilities, state.selectedPeriod]);

  const housingSummary = useMemo(() => {
    const items = activeHousingItems(state.housingItems).sort(
      (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)
    );
    const monthlyTotal = housingMonthlyTotal(items);
    const personMonthly = housingPersonMonthlyTotal(items);
    const personFortnight = personMonthly / 2;
    const fortnights = ["Q1", "Q2"].map((fortnight) => {
      const status = findHousingStatus(
        state.housingStatuses,
        state.selectedPeriod,
        fortnight
      );
      const ownerContributed = status?.ownerContributed === true;
      const partnerContributed = status?.partnerContributed === true;
      const gathered =
        (ownerContributed ? personFortnight : 0) +
        (partnerContributed ? personFortnight : 0);
      const transferred = housingTransferredAmount(
        items,
        state.housingTransfers,
        state.selectedPeriod,
        fortnight
      );

      return {
        fortnight,
        ownerContributed,
        partnerContributed,
        gathered,
        expected: personFortnight * 2,
        transferred,
        pendingTransfer: Math.max(gathered - transferred, 0),
        completedTransfers: items.filter((item) =>
          isHousingTransferComplete(
            state.housingTransfers,
            item.clientId,
            state.selectedPeriod,
            fortnight
          )
        ).length
      };
    });

    return {
      items,
      monthlyTotal,
      personMonthly,
      personFortnight,
      fundFortnight: monthlyTotal / 2,
      fortnights,
      gatheredMonth: fortnights.reduce((sum, item) => sum + item.gathered, 0),
      transferredMonth: fortnights.reduce(
        (sum, item) => sum + item.transferred,
        0
      ),
      getPersonFortnightAmount: housingPersonFortnightAmount,
      getFundFortnightAmount: housingFundFortnightAmount
    };
  }, [state.housingItems, state.housingStatuses, state.housingTransfers, state.selectedPeriod]);

  const movementPreview = useMemo(() => {
    const periodIncomes = state.incomes.filter(
      (item) => toPeriod(item.date) === toPeriod(movementDraft.date || TODAY)
    );

    return {
      bagFortnight: getActiveBagFortnight(periodIncomes, movementDraft.date || TODAY)
    };
  }, [movementDraft.date, state.incomes]);

  const movementPresets = useMemo(() => {
    const uniqueByLabel = new Map();
    const recentMovements = sortByDate(state.movements).reverse();

    recentMovements.forEach((item) => {
      const key = item.label.trim().toLowerCase();
      if (!key || uniqueByLabel.has(key)) return;

      uniqueByLabel.set(key, {
        label: item.label,
        category: item.category,
        payment: item.payment,
        amount: item.amount,
        date: item.date
      });
    });

    return [...uniqueByLabel.values()].slice(0, 6);
  }, [state.movements]);

  const amountPresets = useMemo(() => {
    const seen = new Set();
    return sortByDate(state.movements)
      .reverse()
      .filter((item) => item.currency === "CRC")
      .map((item) => item.amount)
      .filter((amount) => {
        const key = String(amount);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 6);
  }, [state.movements]);

  const matchedMovementPreset = useMemo(() => {
    const label = movementDraft.label.trim().toLowerCase();
    if (!label) return null;
    return (
      movementPresets.find((item) => item.label.trim().toLowerCase() === label) || null
    );
  }, [movementDraft.label, movementPresets]);

  const currentFortnight = useMemo(() => {
    if (state.selectedPeriod === toPeriod(TODAY)) {
      return getActiveBagFortnight(periodData.incomes, TODAY);
    }

    if (periodData.incomes.length > 0) {
      return getActiveBagFortnight(periodData.incomes, `${state.selectedPeriod}-31`);
    }

    const periodFortnights = [
      ...periodData.liabilities.map((item) => toFortnight(item.date)),
      ...periodData.savings.map((item) => toFortnight(item.date))
    ];

    if (periodFortnights.includes("Q2")) return "Q2";
    return "Q1";
  }, [periodData.incomes, periodData.liabilities, periodData.savings, state.selectedPeriod]);

  const activeFortnightStats = useMemo(
    () => fortnightStats.find((item) => item.fortnight === currentFortnight) || fortnightStats[0],
    [currentFortnight, fortnightStats]
  );

  const summaryContext = useMemo(() => {
    if (summaryMode === "monthly" || !activeFortnightStats) {
      return {
        label: "Vista mensual",
        available: periodData.availableCrcActual,
        reservedPaymentsUsd: periodData.reservedPaymentsUsd,
        reservedSavingsUsd: periodData.reservedSavingsUsd,
        reservedFixedUsd: periodData.reservedFixedUsd,
        convertedCrc: periodData.incomeCrc,
        salaryUsd: periodData.incomeUsdTotal,
        convertedUsd: periodData.incomeUsdConverted
      };
    }

    return {
      label: `Bolsa activa: ${activeFortnightStats.fortnight}`,
      available: activeFortnightStats.availableCrc,
      reservedPaymentsUsd: activeFortnightStats.liabilitiesUsd,
      reservedSavingsUsd: activeFortnightStats.reservedSavingsUsd,
      reservedFixedUsd: activeFortnightStats.reservedFixedUsd,
      convertedCrc: activeFortnightStats.incomeCrc,
      salaryUsd: activeFortnightStats.totalUsd,
      convertedUsd: activeFortnightStats.convertedUsd,
      spentCrc: activeFortnightStats.movementCrc
    };
  }, [activeFortnightStats, periodData, summaryMode]);


  const displayedMovements = useMemo(() => {
    if (summaryMode === "monthly") {
      return sortByDate(periodData.movements).reverse();
    }

    return sortByDate(
      periodData.movements.filter((item) => item.bagFortnight === currentFortnight)
    ).reverse();
  }, [currentFortnight, periodData.movements, summaryMode]);

  const summaryCards = [
    {
      title: "Disponible real",
      value: money(summaryContext.available, "CRC"),
      hint:
        summaryMode === "fortnight"
          ? `Lo que te queda libre en ${summaryContext.label.toLowerCase()} después de registrar gastos.`
          : "Lo que realmente te queda libre después de apartar todo y registrar gastos.",
      icon: "available"
    },
    {
      title: "Pagos en USD",
      value: money(summaryContext.reservedPaymentsUsd, "USD"),
      hint: "Ya tiene destino. No cuenta como dinero libre.",
      icon: "liabilities"
    },
    {
      title: "Ahorro en USD",
      value: money(summaryContext.reservedSavingsUsd, "USD"),
      hint: "Lo que decidiste dejar guardado antes de convertir.",
      icon: "savings"
    },
    {
      title: "Fijos en USD",
      value: money(summaryContext.reservedFixedUsd, "USD"),
      hint: "Tus gastos fijos en dólares se reservan antes de pasar a colones.",
      icon: "fixed"
    },
    {
      title: "Pasado a colones",
      value: money(summaryContext.convertedCrc, "CRC"),
      hint: `${money(summaryContext.convertedUsd, "USD")} fue lo que terminaste pasando a colones.`,
      icon: "convert"
    }
  ];

  const latestIncome = useMemo(
    () => sortByDate(periodData.incomes).at(-1),
    [periodData.incomes]
  );

  const latestMovement = useMemo(
    () => sortByDate(periodData.movements).at(-1),
    [periodData.movements]
  );

  const savingsSummary = useMemo(() => {
    const targetUsd = periodData.savings
      .filter((item) => item.currency === "USD")
      .reduce((sum, item) => sum + item.target, 0);
    const actualUsd = periodData.savings
      .filter((item) => item.currency === "USD")
      .reduce((sum, item) => sum + item.actual, 0);
    const targetCrc = periodData.savings
      .filter((item) => item.currency === "CRC")
      .reduce((sum, item) => sum + item.target, 0);
    const actualCrc = periodData.savings
      .filter((item) => item.currency === "CRC")
      .reduce((sum, item) => sum + item.actual, 0);
    const reservePerFortnightUsd = periodData.savings
      .filter((item) => item.currency === "USD")
      .reduce((sum, item) => sum + savingsReservePerFortnight(item), 0);
    const reservePerFortnightCrc = periodData.savings
      .filter((item) => item.currency === "CRC")
      .reduce((sum, item) => sum + savingsReservePerFortnight(item), 0);
    const completedGoals = periodData.savings.filter(
      (item) => Number(item.actual || 0) >= Number(item.target || 0) && Number(item.target || 0) > 0
    ).length;
    const recurringGoals = periodData.savings.filter((item) => item.planId || item.generated).length;
    const totalGoals = periodData.savings.length;

    return {
      targetUsd,
      actualUsd,
      targetCrc,
      actualCrc,
      reservePerFortnightUsd,
      reservePerFortnightCrc,
      remainingUsd: Math.max(targetUsd - actualUsd, 0),
      remainingCrc: Math.max(targetCrc - actualCrc, 0),
      completedGoals,
      recurringGoals,
      totalGoals,
      inProgressGoals: Math.max(totalGoals - completedGoals, 0)
    };
  }, [periodData.savings]);

  const historyItems = useMemo(() => {
    const items = [
      ...periodData.incomes.map((item) => ({
        ...item,
        section: "incomes",
        type: "income",
        typeLabel: "Ingreso",
        pillClass: "blue",
        title: item.note,
        subtitle: `TC ${item.rate} • ${toFortnight(item.date)}`,
        amountPrimary: money(item.totalUsd, "USD"),
        amountSecondary: `Ahorro USD ${money(item.reserveSavingsUsd, "USD")}`
      })),
      ...periodData.liabilities.map((item) => ({
        ...item,
        section: "liabilities",
        type: "liability",
        typeLabel: "Pago planeado",
        pillClass: "orange",
        title: item.label,
        subtitle:
          item.kind === "installment"
            ? `${item.category} • ${toFortnight(item.date)} • Cuota ${item.installmentCurrent}/${item.installmentTotal} • Total financiado ${money(totalLiabilityAmount(item), item.currency)}`
            : `${item.category} • ${toFortnight(item.date)} • Pago único`,
        amountPrimary:
          item.kind === "installment"
            ? `Cuota mensual ${money(monthlyLiabilityAmount(item), item.currency)}`
            : money(item.amount, item.currency),
        amountSecondary:
          item.kind === "installment"
            ? `Reserva quincenal ${money(reservePerFortnightAmount(item), item.currency)}`
            : item.currency
      })),
      ...periodData.movements.map((item) => ({
        ...item,
        section: "movements",
        type: "movement",
        typeLabel: "Gasto",
        pillClass: "green",
        title: item.label,
        subtitle: `${item.category} • ${item.payment || "Sin medio"} • Bolsa ${item.bagFortnight}`,
        amountPrimary: money(item.amount, item.currency),
        amountSecondary: item.currency
      })),
      ...periodData.savings.map((item) => ({
        ...item,
        section: "savings",
        type: "saving",
        typeLabel: "Ahorro",
        pillClass: "red",
        title: item.note,
        subtitle: `${toFortnight(item.date)} • ${item.currency}${item.planId || item.generated ? " • Meta recurrente" : ""}`,
        amountPrimary: `Meta ${money(item.target, item.currency)}`,
        amountSecondary: `Real ${money(item.actual, item.currency)}`,
        canDelete: true
      }))
    ];

    const filtered = historyFilter === "all"
      ? items
      : items.filter((item) => item.type === historyFilter);
    const search = historySearch.trim().toLowerCase();
    const searched = search
      ? filtered.filter((item) =>
          [
            item.title,
            item.subtitle,
            item.typeLabel,
            item.amountPrimary,
            item.amountSecondary,
            item.date
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search)
        )
      : filtered;

    return sortByDate(searched).reverse();
  }, [historyFilter, historySearch, periodData.incomes, periodData.liabilities, periodData.movements, periodData.savings]);

  const historySummary = useMemo(() => {
    const movementCount = periodData.movements.length;
    const movementCrc = periodData.movements.reduce(
      (sum, item) => sum + (item.currency === "CRC" ? item.amount : 0),
      0
    );
    const paymentUsage = periodData.movements.reduce((acc, item) => {
      const key = item.payment || "Sin medio";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const categoryUsage = periodData.movements.reduce((acc, item) => {
      const key = item.category || "Otros";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const topPayment = Object.entries(paymentUsage).sort((a, b) => b[1] - a[1])[0];
    const topCategory = Object.entries(categoryUsage).sort((a, b) => b[1] - a[1])[0];

    return {
      recordCount: historyItems.length,
      movementCount,
      movementCrc,
      topPayment: topPayment?.[0] || "Sin datos",
      topPaymentCount: topPayment?.[1] || 0,
      topCategory: topCategory?.[0] || "Sin datos",
      topCategoryCount: topCategory?.[1] || 0
    };
  }, [historyItems.length, periodData.movements]);

  const groupedHistoryItems = useMemo(() => {
    const groups = historyItems.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {});

    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({
        date,
        label: historyGroupLabel(date),
        items
      }));
  }, [historyItems]);

  const viewMeta = {
    dashboard: {
      eyebrow: "Resumen del periodo",
      title: "Agosto con bolsa activa y gastos",
      description:
        "Acá ves cómo se mueve tu plata entre lo que apartás, lo que pasás a colones y lo que realmente te queda disponible."
    },
    fixed: {
      eyebrow: "Configuración base",
      title: "Gastos fijos",
      description:
        "Acá administrás los gastos que registrás una sola vez y que la app reparte entre quincenas."
    },
    housing: {
      eyebrow: "Fondo compartido",
      title: "Vivienda",
      description:
        "Acá controlás tu aporte, el depósito de Fabi y las transferencias a cada cuenta sin mezclarlos con tu saldo personal."
    },
    liabilities: {
      eyebrow: "Planeación del periodo",
      title: "Pagos planeados",
      description:
        "Acá definís lo que ya sabés que tenés que cubrir antes de gastar libremente."
    },
    savings: {
      eyebrow: "Meta separada del gasto",
      title: "Ahorro",
      description:
        "Acá revisás lo que querés apartar y lo que realmente terminaste guardando."
    },
    history: {
      eyebrow: "Revisión y corrección",
      title: "Transacciones",
      description:
        "Acá revisás todo lo que registraste en el periodo y podés editarlo o borrarlo si hace falta."
    }
  };

  const currentView = viewMeta[state.activeView] || viewMeta.dashboard;

  return { periods, periodData, fixedTotals, housingSummary, fortnightStats, salaryPreview, movementPreview, movementPresets, amountPresets, matchedMovementPreset, currentFortnight, summaryContext, displayedMovements, summaryCards, latestIncome, latestMovement, savingsSummary, historySummary, groupedHistoryItems, currentView };
}
