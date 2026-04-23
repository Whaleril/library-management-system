const prisma = require("../db/prisma");
const { AppError } = require("../lib/errors");
const auditLogService = require("./auditLogService");

const CONFIG_KEY_MAP = {
  maxBooks: "MAX_BORROW_BOOKS",
  maxDays: "MAX_LOAN_DAYS",
  fineRate: "FINE_RATE_PER_DAY",
};

const DEFAULT_CONFIG = {
  maxBooks: 5,
  maxDays: 30,
  fineRate: 0.5,
};

function parseConfigValue(field, value) {
  if (field === "maxBooks" || field === "maxDays") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.trunc(parsed) : NaN;
  }
  return Number(value);
}

function normalizeConfigRecordMap(records) {
  const recordByKey = new Map(records.map((item) => [item.key, item.value]));

  return {
    maxBooks: recordByKey.has(CONFIG_KEY_MAP.maxBooks)
      ? parseConfigValue("maxBooks", recordByKey.get(CONFIG_KEY_MAP.maxBooks))
      : DEFAULT_CONFIG.maxBooks,
    maxDays: recordByKey.has(CONFIG_KEY_MAP.maxDays)
      ? parseConfigValue("maxDays", recordByKey.get(CONFIG_KEY_MAP.maxDays))
      : DEFAULT_CONFIG.maxDays,
    fineRate: recordByKey.has(CONFIG_KEY_MAP.fineRate)
      ? parseConfigValue("fineRate", recordByKey.get(CONFIG_KEY_MAP.fineRate))
      : DEFAULT_CONFIG.fineRate,
  };
}

function validateUpdatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError(400, "参数错误：请求体必须是对象");
  }

  const allowedFields = Object.keys(CONFIG_KEY_MAP);
  const providedFields = Object.keys(payload);

  if (providedFields.length === 0) {
    throw new AppError(400, "参数错误：至少需要传入一个可更新字段");
  }

  const invalidField = providedFields.find((field) => !allowedFields.includes(field));
  if (invalidField) {
    throw new AppError(400, `参数错误：不支持字段 ${invalidField}`);
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, "maxBooks") &&
    (!Number.isInteger(payload.maxBooks) || payload.maxBooks <= 0)
  ) {
    throw new AppError(400, "参数错误：maxBooks 必须为大于 0 的整数");
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, "maxDays") &&
    (!Number.isInteger(payload.maxDays) || payload.maxDays <= 0)
  ) {
    throw new AppError(400, "参数错误：maxDays 必须为大于 0 的整数");
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, "fineRate") &&
    (typeof payload.fineRate !== "number" ||
      !Number.isFinite(payload.fineRate) ||
      payload.fineRate < 0)
  ) {
    throw new AppError(400, "参数错误：fineRate 必须为大于等于 0 的数字");
  }
}

async function getConfig() {
  const keys = Object.values(CONFIG_KEY_MAP);
  const records = await prisma.config.findMany({
    where: { key: { in: keys } },
  });
  return normalizeConfigRecordMap(records);
}

async function updateConfig(operatorId, payload) {
  validateUpdatePayload(payload);

  const before = await getConfig();
  const updates = {};
  const upsertTasks = [];

  Object.keys(payload).forEach((field) => {
    const nextValue = payload[field];
    const prevValue = before[field];
    if (prevValue === nextValue) {
      return;
    }

    updates[field] = {
      from: prevValue,
      to: nextValue,
    };

    upsertTasks.push(
      prisma.config.upsert({
        where: { key: CONFIG_KEY_MAP[field] },
        update: { value: String(nextValue) },
        create: {
          key: CONFIG_KEY_MAP[field],
          value: String(nextValue),
        },
      }),
    );
  });

  if (upsertTasks.length) {
    await prisma.$transaction(upsertTasks);
    await auditLogService.record(operatorId, "CONFIG_UPDATE", "Config", null, {
      description: "config update",
      updates,
    });
  }

  return getConfig();
}

module.exports = {
  getConfig,
  updateConfig,
};
