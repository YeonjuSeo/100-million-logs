/**
 * 100-million-logs ? Next.js action API
 * Deploy as Web App (POST). Run setupSheets once from editor.
 * Set APPS_SCRIPT_SECRET in Script Properties or APPS_SCRIPT_SECRET_VALUE below.
 */

var APPS_SCRIPT_SECRET_VALUE = "";

var TAB = {
  GOAL: "Goal",
  ASSETS: "Assets",
  EXPENSES: "Expenses",
  CATEGORIES: "Categories",
  MONTHLY: "MonthlyAssets",
  ASSET_CATEGORIES: "AssetCategories",
};

function getSecret_() {
  var p = PropertiesService.getScriptProperties().getProperty(
    "APPS_SCRIPT_SECRET"
  );
  if (p) return p;
  return APPS_SCRIPT_SECRET_VALUE;
}

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("SPREADSHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function setupSheets() {
  var ss = getSpreadsheet_();

  var sheetConfigs = [
    {
      name: TAB.GOAL,
      headers: [
        "startAmount",
        "startDate",
        "targetAmount",
        "targetDate",
        "monthlyIncome",
        "monthlyExpense",
        "monthlyBudget",
      ],
    },
    { name: TAB.ASSETS, headers: ["id", "name", "amount", "type"] },
    {
      name: TAB.EXPENSES,
      headers: ["id", "date", "category", "amount", "description"],
    },
    { name: TAB.CATEGORIES, headers: ["id", "name", "color"] },
    { name: TAB.MONTHLY, headers: ["id", "month", "assets", "totalAmount"] },
    { name: TAB.ASSET_CATEGORIES, headers: ["id", "name", "color"] },
  ];

  sheetConfigs.forEach(function (config) {
    var sheet = ss.getSheetByName(config.name);
    if (!sheet) sheet = ss.insertSheet(config.name);
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    sheet.getRange(1, 1, 1, config.headers.length).setFontWeight("bold");
  });

  var categoriesSheet = ss.getSheetByName(TAB.CATEGORIES);
  if (categoriesSheet.getLastRow() <= 1) {
    var defaultCategories = [
      ["1", "\uc2dd\ube44", "#ef4444"],
      ["2", "\uad50\ud1b5\ube44", "#3b82f6"],
      ["3", "\uc0dd\ud65c\uc6a9\ud488", "#10b981"],
      ["4", "\uc758\ub8cc\ube44", "#f59e0b"],
      ["5", "\ubb38\ud654\uc0dd\ud65c", "#8b5cf6"],
      ["6", "\uae30\ud0c0", "#6b7280"],
    ];
    categoriesSheet
      .getRange(2, 1, defaultCategories.length, 3)
      .setValues(defaultCategories);
  }

  var ac = ss.getSheetByName(TAB.ASSET_CATEGORIES);
  if (ac.getLastRow() <= 1) {
    var defAc = [
      ["1", "\uc608\uae08", "#3182F6"],
      ["2", "\uc8fc\uc2dd", "#10b981"],
      ["3", "\uc801\uae08", "#f59e0b"],
      ["4", "\uae30\ud0c0", "#6b7280"],
    ];
    ac.getRange(2, 1, defAc.length, 3).setValues(defAc);
  }

  var goalSheet = ss.getSheetByName(TAB.GOAL);
  if (goalSheet.getLastRow() < 2) {
    goalSheet
      .getRange(2, 1, 1, 7)
      .setValues([[0, "2025-01", 100000000, "2026-12", 0, 0, 0]]);
  }

  // getUi().alert 는 확인 창이 '스프레드시트' 탭에만 떠서, 편집기에서는 무한 대기처럼 보일 수 있음.
  Logger.log("setupSheets done ? 스프레드시트 탭에서 시트·헤더를 확인하세요.");
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var body = JSON.parse(e.postData.contents);
    var expected = getSecret_();
    if (!expected) {
      return jsonOut({
        error: "Set APPS_SCRIPT_SECRET or APPS_SCRIPT_SECRET_VALUE",
        ok: false,
      });
    }
    if (!body.secret || body.secret !== expected) {
      return jsonOut({ error: "Unauthorized", ok: false });
    }

    var ss = getSpreadsheet_();
    var action = body.action;

    switch (action) {
      case "getGoal":
        return jsonOut({ goal: readGoal_(ss), ok: true });
      case "updateGoal":
        updateGoal_(ss, body.goal);
        return jsonOut({ ok: true });
      case "getAssets":
        return jsonOut({ assets: readAssets_(ss), ok: true });
      case "appendAsset":
        return jsonOut({ id: appendAsset_(ss, body.asset), ok: true });
      case "updateAsset":
        updateAsset_(ss, body.asset);
        return jsonOut({ ok: true });
      case "getCategories":
        return jsonOut({ categories: readCategories_(ss), ok: true });
      case "getExpenses":
        return jsonOut({ expenses: readExpenses_(ss), ok: true });
      case "appendExpense":
        return jsonOut({ id: appendExpense_(ss, body.expense), ok: true });
      case "getMonthlyAssets":
        return jsonOut({ monthlyAssets: readMonthlyAssets_(ss), ok: true });
      case "appendMonthlyAsset":
        return jsonOut({ id: appendMonthly_(ss, body.payload), ok: true });
      case "getAssetCategories":
        return jsonOut({ assetCategories: readAssetCategories_(ss), ok: true });
      case "appendAssetCategory":
        return jsonOut({
          id: appendAssetCategory_(ss, body.category),
          ok: true,
        });
      case "setAssetMonthAmount":
        setAssetMonthAmount_(ss, body.assetId, body.month, body.amount);
        return jsonOut({ ok: true });
      default:
        return jsonOut({ error: "Unknown action: " + action, ok: false });
    }
  } catch (err) {
    return jsonOut({
      error: String(err && err.message ? err.message : err),
      ok: false,
    });
  } finally {
    lock.releaseLock();
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function readGoal_(ss) {
  var sh = ss.getSheetByName(TAB.GOAL);
  if (!sh) return null;
  var rows = sh.getRange("A1:G2").getValues();
  if (rows.length < 2) return null;
  var r = rows[1];
  return {
    startAmount: Number(r[0]) || 0,
    startDate: String(r[1] || ""),
    targetAmount: Number(r[2]) || 0,
    targetDate: String(r[3] || ""),
    monthlyIncome: Number(r[4]) || 0,
    monthlyExpense: Number(r[5]) || 0,
    monthlyBudget: Number(r[6]) || 0,
  };
}

function updateGoal_(ss, goal) {
  var sh = ss.getSheetByName(TAB.GOAL);
  if (!sh) throw new Error("Goal sheet missing");
  sh.getRange("A2:G2").setValues([
    [
      goal.startAmount,
      goal.startDate,
      goal.targetAmount,
      goal.targetDate,
      goal.monthlyIncome,
      goal.monthlyExpense,
      goal.monthlyBudget,
    ],
  ]);
}

function readAssets_(ss) {
  var sh = ss.getSheetByName(TAB.ASSETS);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] && !r[1]) continue;
    out.push({
      id: String(r[0]),
      name: String(r[1] || ""),
      amount: Number(r[2]) || 0,
      type: String(r[3] || "other"),
    });
  }
  return out;
}

function nextId_(ids) {
  var m = 0;
  for (var i = 0; i < ids.length; i++) {
    var n = Number(ids[i]);
    if (!isNaN(n) && n > m) m = n;
  }
  return String(m + 1);
}

function appendAsset_(ss, asset) {
  var sh = ss.getSheetByName(TAB.ASSETS);
  if (!sh) throw new Error("Assets sheet missing");
  var list = readAssets_(ss);
  var ids = list.map(function (a) {
    return a.id;
  });
  var nid = nextId_(ids);
  sh.appendRow([nid, asset.name, asset.amount, asset.type]);
  return nid;
}

function updateAsset_(ss, asset) {
  var sh = ss.getSheetByName(TAB.ASSETS);
  if (!sh) throw new Error("Assets sheet missing");
  var data = sh.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(asset.id)) {
      sh.getRange(i + 1, 2, i + 1, 4).setValues([
        [asset.name, asset.amount, asset.type],
      ]);
      return;
    }
  }
  throw new Error("asset row not found");
}

function readAssetCategories_(ss) {
  var sh = ss.getSheetByName(TAB.ASSET_CATEGORIES);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] && !r[1]) continue;
    out.push({
      id: String(r[0]),
      name: String(r[1] || ""),
      color: String(r[2] || "#6b7280"),
    });
  }
  return out;
}

function appendAssetCategory_(ss, cat) {
  var sh = ss.getSheetByName(TAB.ASSET_CATEGORIES);
  if (!sh) throw new Error("AssetCategories sheet missing");
  var list = readAssetCategories_(ss);
  var ids = list.map(function (c) {
    return c.id;
  });
  var nid = nextId_(ids);
  sh.appendRow([nid, cat.name, cat.color || "#6b7280"]);
  return nid;
}

function readCategories_(ss) {
  var sh = ss.getSheetByName(TAB.CATEGORIES);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] && !r[1]) continue;
    out.push({
      id: String(r[0]),
      name: String(r[1] || ""),
      color: String(r[2] || "#6b7280"),
    });
  }
  return out;
}

function readExpenses_(ss) {
  var sh = ss.getSheetByName(TAB.EXPENSES);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] && !r[2] && !r[3]) continue;
    out.push({
      id: String(r[0]),
      date: String(r[1] || ""),
      category: String(r[2] || ""),
      amount: Number(r[3]) || 0,
      description: String(r[4] || ""),
    });
  }
  return out;
}

function appendExpense_(ss, expense) {
  var sh = ss.getSheetByName(TAB.EXPENSES);
  if (!sh) throw new Error("Expenses sheet missing");
  var list = readExpenses_(ss);
  var ids = list.map(function (e) {
    return e.id;
  });
  var nid = nextId_(ids);
  sh.appendRow([
    nid,
    expense.date,
    expense.category,
    expense.amount,
    expense.description,
  ]);
  return nid;
}

function normalizeMonthStr_(s) {
  var t = String(s || "").trim();
  if (t.length >= 7 && /^\d{4}-\d{2}/.test(t)) return t.slice(0, 7);
  var d = new Date(t);
  if (!isNaN(d.getTime())) {
    var y = d.getFullYear();
    var mo = d.getMonth() + 1;
    return y + "-" + (mo < 10 ? "0" : "") + mo;
  }
  return t;
}

function readMonthlyAssets_(ss) {
  var sh = ss.getSheetByName(TAB.MONTHLY);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (!r[0] && !r[2]) continue;
    var assets = [];
    try {
      assets = JSON.parse(String(r[2] || "[]"));
    } catch (e) {
      assets = [];
    }
    var monthCell = String(r[1] || "");
    var month = normalizeMonthStr_(monthCell);
    out.push({
      id: String(r[0]),
      month: month,
      assets: assets,
      totalAmount: Number(r[3]) || 0,
    });
  }
  return out;
}

function appendMonthly_(ss, payload) {
  var sh = ss.getSheetByName(TAB.MONTHLY);
  if (!sh) throw new Error("MonthlyAssets sheet missing");
  var list = readMonthlyAssets_(ss);
  var ids = list.map(function (x) {
    return x.id;
  });
  var nid = nextId_(ids);
  var json = JSON.stringify(payload.assets || []);
  sh.appendRow([nid, payload.month, json, payload.totalAmount]);
  return nid;
}

function setAssetMonthAmount_(ss, assetId, monthRaw, amountNum) {
  var monthNorm = normalizeMonthStr_(monthRaw);
  var masterList = readAssets_(ss);
  var master = null;
  for (var i = 0; i < masterList.length; i++) {
    if (String(masterList[i].id) === String(assetId)) {
      master = masterList[i];
      break;
    }
  }
  if (!master) throw new Error("asset not found");

  var sh = ss.getSheetByName(TAB.MONTHLY);
  var data = sh.getDataRange().getValues();
  var sheetRow = -1;
  for (var r = 1; r < data.length; r++) {
    if (normalizeMonthStr_(data[r][1]) === monthNorm) {
      sheetRow = r + 1;
      break;
    }
  }

  var amt = Number(amountNum) || 0;
  var assets;
  var total = 0;

  if (sheetRow === -1) {
    assets = [
      {
        id: master.id,
        name: master.name,
        amount: amt,
        type: master.type,
      },
    ];
    total = amt;
    var list = readMonthlyAssets_(ss);
    var ids = list.map(function (x) {
      return x.id;
    });
    var nid = nextId_(ids);
    sh.appendRow([nid, monthNorm, JSON.stringify(assets), total]);
    return;
  }

  try {
    assets = JSON.parse(String(data[sheetRow - 1][2] || "[]"));
  } catch (e) {
    assets = [];
  }
  var found = false;
  for (var j = 0; j < assets.length; j++) {
    if (String(assets[j].id) === String(assetId)) {
      assets[j].amount = amt;
      assets[j].name = master.name;
      assets[j].type = master.type;
      found = true;
      break;
    }
  }
  if (!found) {
    assets.push({
      id: master.id,
      name: master.name,
      amount: amt,
      type: master.type,
    });
  }
  for (var k = 0; k < assets.length; k++) {
    total += Number(assets[k].amount) || 0;
  }
  sh.getRange(sheetRow, 3, sheetRow, 4).setValues([[JSON.stringify(assets), total]]);
}
