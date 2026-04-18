/**
 * 100-million-logs — Next.js 와 동일한 action API (A 방식)
 *
 * [최초 1회]
 * 1) 이 파일 전체를 Apps Script 편집기에 붙여 넣습니다.
 * 2) 아래 APPS_SCRIPT_SECRET_VALUE 에 Next.js .env 의 APPS_SCRIPT_SECRET 과 같은 값을 넣거나,
 *    프로젝트 설정 > 스크립트 속성 에 키 APPS_SCRIPT_SECRET 을 추가합니다.
 * 3) 편집기에서 setupSheets 를 선택 후 실행 → 권한 승인 (시트/헤더/기본 카테고리 생성)
 * 4) 배포 > 새 배포 > 유형: 웹 앱
 *    - 실행: 나
 *    - 액세스: 모든 사용자 (Next 서버가 POST 하므로)
 * 5) 웹 앱 URL 을 .env 의 GOOGLE_APPS_SCRIPT_WEB_APP_URL 에 넣습니다.
 *
 * [독립 스크립트인 경우] 스크립트 속성 SPREADSHEET_ID 에 시트 ID 를 넣으면 openById 로 엽니다.
 * 그렇지 않으면 스프레드시트에 바인딩된 스크립트로 사용합니다 (권장).
 */

/** Next.js APPS_SCRIPT_SECRET 과 동일하게 설정. 비어 있으면 스크립트 속성 APPS_SCRIPT_SECRET 사용 */
var APPS_SCRIPT_SECRET_VALUE = "yeonjuice.west_20240409";

var TAB = {
  GOAL: "Goal",
  ASSETS: "Assets",
  EXPENSES: "Expenses",
  CATEGORIES: "Categories",
  MONTHLY: "MonthlyAssets",
};

function getSecret_() {
  var p =
    PropertiesService.getScriptProperties().getProperty("APPS_SCRIPT_SECRET");
  if (p) return p;
  return APPS_SCRIPT_SECRET_VALUE;
}

function getSpreadsheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("SPREADSHEET_ID");
  if (id) return SpreadsheetApp.openById(id);
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * 최초 1회 실행: 탭 생성, 헤더 행, Categories 기본 데이터
 * 편집기 상단에서 함수 선택 후 ▶ 실행
 */
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
    {
      name: TAB.ASSETS,
      headers: ["id", "name", "amount", "type"],
    },
    {
      name: TAB.EXPENSES,
      headers: ["id", "date", "category", "amount", "description"],
    },
    {
      name: TAB.CATEGORIES,
      headers: ["id", "name", "color"],
    },
    {
      name: TAB.MONTHLY,
      headers: ["id", "month", "assets", "totalAmount"],
    },
  ];

  sheetConfigs.forEach(function (config) {
    var sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
    }
    sheet.getRange(1, 1, 1, config.headers.length).setValues([config.headers]);
    sheet.getRange(1, 1, 1, config.headers.length).setFontWeight("bold");
  });

  var categoriesSheet = ss.getSheetByName(TAB.CATEGORIES);
  if (categoriesSheet.getLastRow() <= 1) {
    var defaultCategories = [
      ["1", "식비", "#ef4444"],
      ["2", "교통비", "#3b82f6"],
      ["3", "생활용품", "#10b981"],
      ["4", "의료비", "#f59e0b"],
      ["5", "문화생활", "#8b5cf6"],
      ["6", "기타", "#6b7280"],
    ];
    categoriesSheet
      .getRange(2, 1, defaultCategories.length, 3)
      .setValues(defaultCategories);
  }

  var goalSheet = ss.getSheetByName(TAB.GOAL);
  if (goalSheet.getLastRow() < 2) {
    goalSheet
      .getRange(2, 1, 1, 7)
      .setValues([[0, "2025-01", 100000000, "2026-12", 0, 0, 0]]);
  }

  try {
    SpreadsheetApp.getUi().alert("setupSheets 완료");
  } catch (ignore) {
    Logger.log("setupSheets 완료 (UI 없음)");
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var body = JSON.parse(e.postData.contents);

    var expected = getSecret_();
    if (!expected) {
      return jsonOut({
        error:
          "스크립트에 비밀키가 없습니다. APPS_SCRIPT_SECRET_VALUE 또는 스크립트 속성 APPS_SCRIPT_SECRET 을 설정하세요.",
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
        return jsonOut({
          id: appendAsset_(ss, body.asset),
          ok: true,
        });
      case "getCategories":
        return jsonOut({ categories: readCategories_(ss), ok: true });
      case "getExpenses":
        return jsonOut({ expenses: readExpenses_(ss), ok: true });
      case "appendExpense":
        return jsonOut({
          id: appendExpense_(ss, body.expense),
          ok: true,
        });
      case "getMonthlyAssets":
        return jsonOut({ monthlyAssets: readMonthlyAssets_(ss), ok: true });
      case "appendMonthlyAsset":
        return jsonOut({
          id: appendMonthly_(ss, body.payload),
          ok: true,
        });
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
    ContentService.MimeType.JSON,
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
  if (!sh) throw new Error("Goal 시트 없음");
  var row = [
    goal.startAmount,
    goal.startDate,
    goal.targetAmount,
    goal.targetDate,
    goal.monthlyIncome,
    goal.monthlyExpense,
    goal.monthlyBudget,
  ];
  sh.getRange("A2:G2").setValues([row]);
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
  if (!sh) throw new Error("Assets 시트 없음");
  var list = readAssets_(ss);
  var ids = list.map(function (a) {
    return a.id;
  });
  var nid = nextId_(ids);
  sh.appendRow([nid, asset.name, asset.amount, asset.type]);
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
  if (!sh) throw new Error("Expenses 시트 없음");
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
    var month = monthCell;
    if (monthCell.length >= 7 && /^\d{4}-\d{2}/.test(monthCell)) {
      month = monthCell.slice(0, 7);
    } else {
      var d = new Date(monthCell);
      if (!isNaN(d.getTime())) {
        var y = d.getFullYear();
        var mo = d.getMonth() + 1;
        month = y + "-" + (mo < 10 ? "0" : "") + mo;
      }
    }
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
  if (!sh) throw new Error("MonthlyAssets 시트 없음");
  var list = readMonthlyAssets_(ss);
  var ids = list.map(function (x) {
    return x.id;
  });
  var nid = nextId_(ids);
  var json = JSON.stringify(payload.assets || []);
  sh.appendRow([nid, payload.month, json, payload.totalAmount]);
  return nid;
}
