import { BadRequestError } from "../errors/bad-request.js";
import { NotFoundError } from "../errors/not-found.js";
import { Expense } from "../models/Accounting/Expenses.js";
import InventoryHistory from "../models/Inventories/InventoryHistory.js";

export default async function calculateCOGS_FIFO(period, itemId) {
  function dateIsValid(dateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;

    if (dateStr.match(regex) === null) {
      return false;
    }

    const date = new Date(dateStr);

    const timestamp = date.getTime();

    if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
      return false;
    }

    return date.toISOString().startsWith(dateStr);
  }

  if (!dateIsValid(period.from) || !dateIsValid(period.to)) {
    throw new BadRequestError(
      "One or both Dates provided are not in the correct format 'yyyy-mm-dd'"
    );
  }

  // Find expenses under InventoryItem name for the same period
  // Find last months purchases or previous to that one if no purchases found (or purchases are lower than period's begInv)
  //
  // calc period's begInv with FIFO
  // calc period's COGS with begInv and period's usedUnits and wasted with FIFO
  // HOW TO CALC UNITS USED AND wasted value for each registry
  // 4,

  // begInv porque pueden pasar meses de no atender el negocio, que el producto se pudra
  // Y entonces cuando re-abran y quieran calcular el COGS
  // Se debe calcular el COGS con el ebginnin inventory que sería 0.
  // No siempre el endInv va a ser begInv.
  // Por lo tanto se realizarán compras el mismo día que habran

  // Que pasa si hace la compra el 09 y la usan/reciben hasta el 20
  // Se actualiza el nivel de inventario el 09. Si pasa cualqueir cosa y no se utiliza, se registra como waste
  // Da igual si es endInv o begInv, si se pudre todo, del endInv de ayer, se registra como waste del nuevo registro begInv
  const dateStart = new Date(period.from);
  const dateEnd = new Date(period.from);
  dateStart.setUTCHours(0, 0, 0, 0);
  dateEnd.setUTCHours(23, 59, 59, 999);

  const item = await InventoryHistory.findOne({
    item: itemId,
    createdAt: { $gte: dateStart, $lte: dateEnd },
  })
    .select("beginningInventory item")
    .populate({ path: "item", select: "name" });

  if (!item) {
    throw new NotFoundError(
      "No registry found for that item on your start creation date provided"
    );
  }

  // console.log(
  //   "periodStart",
  //   new Date(periodStart.setUTCMonth(periodStart.getUTCMonth() - 1))
  // );
  const periodStart = new Date(period.from);
  const periodEnd = new Date(period.to);
  periodStart.setUTCHours(0, 0, 0, 0);
  periodEnd.setUTCHours(23, 59, 59, 999);

  const itemHistory = await InventoryHistory.find({
    item: itemId,
    createdAt: { $gte: periodStart, $lte: periodEnd },
  })
    .select("-item")
    .sort("createdAt");

  if (itemHistory.length === 0) {
    throw new NotFoundError(
      "No records found with name or time frame provided"
    );
  }

  let periodUnits = 0;
  for (const registry of itemHistory) {
    periodUnits += registry.wastedUnits + registry.usedUnits;
  }

  const previousDate = new Date(period.from);
  previousDate.setDate(periodStart.getDate() - 1);
  //Calc beginningInventory for period to calculate (from $lt -> yesterday)
  const beginningInventoryCost = await calculateBeginningInventoryCost_FIFO(
    periodStart,
    item.beginningInventory,
    item.item.name
  );

  const COGS = await periodCOGS(
    beginningInventoryCost,
    item.beginningInventory,
    periodUnits,
    period,
    item.item.name
  );

  async function periodCOGS(
    begInvCost,
    begInvUnits,
    periodUnits,
    period,
    itemName
  ) {
    let COGS = 0;
    let remainingUnits = periodUnits + begInvUnits;
    const start = new Date(period.from);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(period.to);
    end.setUTCHours(23, 59, 59, 999);
    const periodExpenses = await Expense.find({
      name: itemName,
      createdAt: { $gte: start, $lte: end },
    }).sort("createdAt");
    // Need to push in at beginning
    periodExpenses.unshift({ value: begInvCost, units: begInvUnits });

    for (const purchase of periodExpenses) {
      if (remainingUnits > 0) {
        if (purchase.units <= remainingUnits) {
          COGS += purchase.value;
          remainingUnits -= purchase.units;
        } else {
          COGS += remainingUnits * (purchase.value / purchase.units);
          remainingUnits = 0;
        }
      }
    }
    return COGS;
  }

  async function calculateBeginningInventoryCost_FIFO(
    calcStart /* COGS period previous date */,
    beginningInventory /* units */,
    itemName
  ) {
    let remainingUnits = beginningInventory;
    let totalCost = 0;
    calcStart.setUTCHours(0, 0, 0, 0);
    let periodStart = new Date(calcStart);
    periodStart.setUTCMonth(calcStart.getUTCMonth() - 1);
    // periodStart.setUTCMonth(new Date(periodStart.getUTCMonth() - 1)); // 2023-04-12 -> 2023-03-12
    let periodEnd = new Date();

    while (remainingUnits > 0) {
      periodEnd.setUTCMonth(periodStart.getUTCMonth() + 1);
      periodEnd.setUTCHours(23, 59, 59, 999);

      const purchases = await Expense.find({
        name: itemName,
        createdAt: {
          $gte: periodStart,
          $lte: periodEnd,
        },
      }).sort({ createdAt: 1 });
      //Such date format necessary because on next loop, we'll take another month back (2023-02-12) and query (2023-02-12 -> 2023-03-12)

      for (const purchase of purchases) {
        // if pUnits = 100 and rUnits = 300
        if (purchase.units <= remainingUnits) {
          totalCost += purchase.value;
          remainingUnits -= purchase.units;
        } else {
          totalCost += remainingUnits * (purchase.value / purchase.units);
          remainingUnits = 0;
        }
      }
      periodStart.setUTCMonth(periodStart.getUTCMonth() - 1);
      periodStart.setUTCHours(0, 0, 0, 0);
    }
    return totalCost;
  }
  return { COGS: COGS, name: item.item.name, itemHistory: itemHistory };
}
