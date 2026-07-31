(function () {
  "use strict";

  const TYPES = {
    attendance: {
      title: "出勤報表",
      description: "每日出勤、班別、上下班打卡與異常結果",
      color: "blue",
      icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
      headers: ["日期", "員工姓名", "員工編號", "部門", "職位", "班別", "上班", "下班", "方式", "狀態"],
    },
    overtime: {
      title: "加班報表",
      description: "核准時數、加班類型、補休與部門資料",
      color: "green",
      icon: '<svg viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/><circle cx="12" cy="12" r="9"/></svg>',
      headers: ["員工姓名", "員工編號", "部門", "職位", "加班日期", "時數", "類型", "狀態", "核准人"],
    },
    leave: {
      title: "請假報表",
      description: "假別、請假期間、天數、代理安排與核准狀態",
      color: "orange",
      icon: '<svg viewBox="0 0 24 24"><path d="M7 3v3M17 3v3M4 9h16M5 5h14v15H5z"/><path d="m9 14 2 2 4-4"/></svg>',
      headers: ["員工姓名", "員工編號", "部門", "職位", "假別", "請假期間", "天數／時數", "代理人", "狀態"],
    },
    workforce: {
      title: "人力分析報表",
      description: "現有人事主檔、部門配置、到職與帳號狀態",
      color: "pink",
      icon: '<svg viewBox="0 0 24 24"><path d="M4 20v-7M10 20V8M16 20V4M22 20H2"/></svg>',
      headers: ["員工姓名", "員工編號", "部門", "職位", "據點", "人事狀態", "到職日", "任用類型", "帳號狀態"],
    },
  };

  function esc(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
    );
  }

  function dateKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function people() {
    return getEmployeeRows().map((row) => {
      const record = getEmployeeRecord(row[1]) || {};
      return {
        ...record,
        name: row[0],
        employeeId: row[1],
        department: row[2],
        position: row[3],
        location: row[4],
        status: row[5],
      };
    });
  }

  function events() {
    return getSharedEvents();
  }

  function schedules() {
    try {
      return JSON.parse(localStorage.getItem("bombhr-schedules-v176") || "[]");
    } catch (error) {
      return [];
    }
  }

  function attendanceRows() {
    const today = dateKey();
    const allEvents = events().filter((item) => item.category === "attendance");
    const daySchedules = schedules().filter((item) => item.date === today);
    return people().map((person) => {
      const records = allEvents.filter(
        (item) =>
          item.employeeId === person.employeeId &&
          String(item.date || item.createdAt || "").slice(0, 10) === today
      );
      const clockIn = records.find((item) => item.action === "clock-in");
      const clockOut = records.find((item) => item.action === "clock-out");
      const schedule = daySchedules.find((item) => item.employeeId === person.employeeId);
      const shift =
        schedule?.start && schedule?.end
          ? `${schedule.start}–${schedule.end}`
          : schedule?.code && schedule.code !== "1"
            ? schedule.code
            : "尚未設定";
      return [
        today,
        person.name,
        person.employeeId,
        person.department,
        person.position,
        shift,
        clockIn?.time || "—",
        clockOut?.time || "—",
        clockIn?.method || clockOut?.method || "—",
        clockIn?.status || (schedule?.code && schedule.code !== "1" ? schedule.code : "未打卡"),
      ];
    });
  }

  function overtimeRows() {
    const overtime = events().filter(
      (item) => item.category === "approval" && item.subtype === "overtime"
    );
    return people().flatMap((person) => {
      const records = overtime.filter((item) => item.employeeId === person.employeeId);
      if (!records.length)
        return [[person.name, person.employeeId, person.department, person.position, "—", 0, "無加班紀錄", "—", "—"]];
      return records.map((item) => [
        person.name,
        person.employeeId,
        person.department,
        person.position,
        item.date || item.period || "—",
        Number(item.hours || parseFloat(item.duration) || 0),
        item.overtimeType || item.type || "加班",
        item.statusText || item.status || "待審核",
        item.reviewer || "—",
      ]);
    });
  }

  function leaveRows() {
    const leaves = events().filter(
      (item) => item.category === "approval" && item.subtype === "leave"
    );
    return people().flatMap((person) => {
      const records = leaves.filter((item) => item.employeeId === person.employeeId);
      if (!records.length)
        return [[person.name, person.employeeId, person.department, person.position, "無請假紀錄", "—", 0, "—", "—"]];
      return records.map((item) => [
        person.name,
        person.employeeId,
        person.department,
        person.position,
        item.leaveType || item.title || "請假",
        item.period || item.date || "—",
        Number(item.leaveDays || parseFloat(item.duration) || 0),
        item.agent || "無",
        item.statusText || item.status || "待審核",
      ]);
    });
  }

  function workforceRows() {
    return people().map((person) => [
      person.name,
      person.employeeId,
      person.department,
      person.position,
      person.location,
      person.status,
      person.hireDate || "—",
      person.employmentType || "—",
      person.accountStatus || "—",
    ]);
  }

  function reportRows(type) {
    return type === "attendance"
      ? attendanceRows()
      : type === "overtime"
        ? overtimeRows()
        : type === "leave"
          ? leaveRows()
          : workforceRows();
  }

  function producer() {
    const profile = currentProfile();
    return (
      people().find((person) => person.employeeId === profile.id) || {
        name: profile.name,
        employeeId: profile.id,
        department: profile.department,
        position: profile.label,
      }
    );
  }

  function reportHistory() {
    try {
      return JSON.parse(localStorage.getItem("bombhr-report-history-v216") || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveHistory(type) {
    const person = producer();
    const history = reportHistory();
    history.unshift({
      id: `REPORT-${Date.now()}`,
      type,
      title: TYPES[type]?.title || "綜合報表",
      period: dateKey().slice(0, 7).replace("-", "/"),
      producerName: person.name,
      producerId: person.employeeId,
      producerDepartment: person.department,
      createdAt: new Date().toLocaleString("zh-TW", { hour12: false }),
    });
    localStorage.setItem("bombhr-report-history-v216", JSON.stringify(history.slice(0, 20)));
  }

  function styleSheet(sheet, columnCount, rowCount) {
    sheet["!cols"] = Array.from({ length: columnCount }, (_, index) => ({
      wch: index < 2 ? 16 : index === 2 ? 14 : 20,
    }));
    sheet["!autofilter"] = { ref: `A5:${XLSX.utils.encode_col(columnCount - 1)}${Math.max(5, rowCount + 5)}` };
    sheet["!freeze"] = { xSplit: 0, ySplit: 5 };
    const header = Array.from({ length: columnCount }, (_, index) =>
      sheet[XLSX.utils.encode_cell({ r: 4, c: index })]
    );
    header.forEach((cell) => {
      if (!cell) return;
      cell.s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "514FE7" } },
        alignment: { vertical: "center" },
      };
    });
  }

  function addReportSheet(book, type) {
    const config = TYPES[type];
    const rows = reportRows(type);
    const person = producer();
    const data = [
      [`BOMB HR｜${config.title}`],
      [`產製時間：${new Date().toLocaleString("zh-TW", { hour12: false })}`],
      [`產製人：${person.name}（${person.employeeId}）｜${person.department || "—"}`],
      [`資料範圍：ABOMB 台中總公司｜共 ${rows.length} 筆`],
      config.headers,
      ...rows,
    ];
    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet["!merges"] = [0, 1, 2, 3].map((row) => ({
      s: { r: row, c: 0 },
      e: { r: row, c: config.headers.length - 1 },
    }));
    styleSheet(sheet, config.headers.length, rows.length);
    XLSX.utils.book_append_sheet(book, sheet, config.title.slice(0, 31));
  }

  function exportWorkbook(type = "all") {
    if (!window.XLSX) {
      toast("Excel 元件尚未載入，請重新整理後再試");
      return;
    }
    const book = XLSX.utils.book_new();
    const types = type === "all" ? Object.keys(TYPES) : [type];
    types.forEach((item) => addReportSheet(book, item));
    const personRows = workforceRows();
    if (!types.includes("workforce")) {
      const personnel = XLSX.utils.aoa_to_sheet([
        ["BOMB HR｜員工主檔參考"],
        [`資料更新：${new Date().toLocaleString("zh-TW", { hour12: false })}`],
        [],
        TYPES.workforce.headers,
        ...personRows,
      ]);
      personnel["!cols"] = TYPES.workforce.headers.map(() => ({ wch: 18 }));
      XLSX.utils.book_append_sheet(book, personnel, "員工主檔參考");
    }
    XLSX.writeFile(book, `ABOMB-${type === "all" ? "完整報表" : TYPES[type].title}-${dateKey()}.xlsx`, {
      compression: true,
    });
    types.forEach(saveHistory);
    addAudit("匯出 Excel 報表", `${types.map((item) => TYPES[item].title).join("、")}・${producer().name}`);
    toast(`已下載完整 Excel：${types.map((item) => TYPES[item].title).join("、")}`);
  }

  function detailTable(type) {
    const config = TYPES[type];
    const rows = reportRows(type);
    return `<div class="report-detail-toolbar"><div><span>ABOMB 台中總公司</span><span>${dateKey()}</span><span>${rows.length} 筆明細</span></div><b>產製人：${esc(producer().name)}・${esc(producer().employeeId)}</b></div>
      <div class="table-wrap report-detail-table"><table><thead><tr>${config.headers
        .map((header) => `<th>${esc(header)}</th>`)
        .join("")}</tr></thead><tbody>${rows.length
        ? rows
            .map(
              (row) =>
                `<tr>${row.map((cell, index) => `<td>${index === 1 ? `<b>${esc(cell)}</b>` : esc(cell)}</td>`).join("")}</tr>`
            )
            .join("")
        : `<tr><td colspan="${config.headers.length}" class="report-empty-note">目前沒有資料</td></tr>`}</tbody></table></div>`;
  }

  function openReport(type) {
    const config = TYPES[type];
    if (!config) return;
    openModal(
      `${config.title}完整明細`,
      `依現有員工主檔與系統紀錄產生・共 ${reportRows(type).length} 筆`,
      detailTable(type),
      `<button class="secondary-btn" data-modal-close>關閉</button><button class="primary-btn" data-report-excel="${type}">下載完整 Excel</button>`
    );
  }

  function recentRows() {
    const history = reportHistory();
    if (!history.length) {
      const hrPeople = people().filter(
        (person) => /人事|人力|財務/.test(`${person.department} ${person.position} ${person.roleGroup || ""}`)
      );
      const seed = (hrPeople.length ? hrPeople : [producer()]).slice(0, 2);
      return seed.map((person, index) => ({
        type: index ? "workforce" : "attendance",
        title: index ? "人力分析報表" : "出勤報表",
        period: dateKey().slice(0, 7).replace("-", "/"),
        producerName: person.name,
        producerId: person.employeeId,
        producerDepartment: person.department,
        createdAt: "尚未下載",
      }));
    }
    return history.slice(0, 6);
  }

  function reportsView() {
    const cards = Object.entries(TYPES)
      .map(
        ([type, config]) =>
          `<button class="report-entry report-entry-polished" data-report="${type}"><span class="report-symbol">${config.icon}</span><div><b>${config.title}</b><small>${config.description}</small></div><span class="report-open">完整明細 <b>→</b></span></button>`
      )
      .join("");
    const recent = recentRows()
      .map(
        (item) =>
          `<tr><td><b>${esc(item.title)}</b><small class="table-subline">${esc(item.createdAt)}</small></td><td>${esc(item.period)}</td><td>台中總公司</td><td><span class="report-producer"><i>${esc(item.producerName?.[0] || "人")}</i><span><b>${esc(item.producerName)}</b><small>${esc(item.producerId)}・${esc(item.producerDepartment || "—")}</small></span></span></td><td class="row-actions"><button data-report="${esc(item.type)}">查看完整明細</button></td></tr>`
      )
      .join("");
    return (
      head(
        "報表中心",
        "Reports",
        "ABOMB 台中總公司・資料即時連動現有員工主檔",
        ""
      ) +
      `<div class="report-hub-grid report-hub-polished">${cards}</div>` +
      panel(
        "最近產製報表",
        "產製人取自現有員工主檔；下載後保留實際操作人與時間",
        `<div class="table-wrap"><table><thead><tr><th>報表名稱</th><th>期間</th><th>範圍</th><th>產製人</th><th>操作</th></tr></thead><tbody>${recent}</tbody></table></div>`
      )
    );
  }

  views.reports = reportsView;

  document.addEventListener(
    "click",
    (event) => {
      const report = event.target.closest("[data-report]");
      const excel = event.target.closest("[data-report-excel]");
      const generic = event.target.closest("[data-export]");
      if (report) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openReport(report.dataset.report);
        return;
      }
      if (excel) {
        event.preventDefault();
        event.stopImmediatePropagation();
        exportWorkbook(excel.dataset.reportExcel);
        if (location.hash === "#reports") setTimeout(() => window.dispatchEvent(new HashChangeEvent("hashchange")), 100);
        return;
      }
      if (generic && !event.target.closest("[data-payroll-export]")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        exportWorkbook(location.hash === "#reports" ? "all" : "workforce");
      }
    },
    true
  );

  window.BOMBHR_REPORTS = { exportWorkbook, openReport, reportRows };
  window.dispatchEvent(new HashChangeEvent("hashchange"));
})();
