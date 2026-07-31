(function () {
  "use strict";

  const livePeople = () =>
    getEmployeeRows()
      .map((row) => ({
        name: row[0],
        employeeId: row[1],
        department: row[2],
        position: row[3],
        location: row[4],
        status: row[5],
        ...(getEmployeeRecord(row[1]) || {}),
      }))
      .filter((person) => !["停用", "離職"].includes(person.status));

  const attendanceEvents = () =>
    getSharedEvents().filter((event) => event.category === "attendance");

  const leaveEvents = () =>
    getSharedEvents().filter(
      (event) =>
        event.category === "approval" &&
        event.subtype === "leave" &&
        ["approved", "review"].includes(event.status)
    );

  function personById(id) {
    return livePeople().find((person) => person.employeeId === id);
  }

  function displayName(event) {
    const person = personById(event.employeeId);
    return person?.name || event.employee || event.employeeId || "未知員工";
  }

  function liveDashboard() {
    const people = livePeople();
    const events = attendanceEvents();
    const clockedIds = new Set(
      events
        .filter((event) => event.action === "clock-in")
        .map((event) => event.employeeId)
        .filter(Boolean)
    );
    const normal = people.filter((person) => clockedIds.has(person.employeeId)).length;
    const leave = leaveEvents();
    const leaveIds = new Set(leave.map((event) => event.employeeId).filter(Boolean));
    const pending = pendingApprovalCounts();
    const notClocked = Math.max(0, people.length - clockedIds.size - leaveIds.size);
    const attendanceRate = people.length
      ? ((normal / people.length) * 100).toFixed(1)
      : "0.0";
    const leaveNames = leave.slice(0, 3).map(displayName).join("、");
    const recentPeople = people.slice(0, 7);
    const bars = recentPeople.length
      ? recentPeople
          .map(
            (person, index) =>
              `<i style="height:${48 + ((index * 11) % 42)}%" data-value="${person.name}"></i>`
          )
          .join("")
      : '<i style="height:8%" data-value="尚無員工資料"></i>';

    return (
      head(
        "營運總覽",
        "Dashboard",
        `${new Date().toLocaleDateString("zh-TW")}・人事主檔即時連動`,
        '<button class="secondary-btn" data-export>匯出摘要</button><button class="primary-btn" data-route-go="approvals">處理待簽核</button>'
      ) +
      `<div class="stat-grid">
        ${stat("今日在職人數", String(people.length), "依人事主檔即時計算", "trend up")}
        ${stat("今日正常出勤", String(normal), `出勤率 ${attendanceRate}%`, normal ? "trend up" : "")}
        ${stat("今日請假人數", String(leaveIds.size), leaveNames ? `目前：${leaveNames}` : "目前無請假人員", leaveIds.size ? "trend warn" : "trend up")}
        ${stat("待處理事項", String(pending.total), pending.total ? `${pending.total} 件簽核需要處理` : "簽核案件已全部完成", pending.total ? "trend warn" : "trend up")}
      </div>
      <div class="dashboard-grid">
        <div>
          ${panel(
            "今日出勤狀況",
            "依員工打卡與人事主檔即時統計",
            `<div class="attendance-bar"><i style="width:${attendanceRate}%"></i><i style="width:0%"></i><i style="width:0%"></i><i style="width:${100 - Number(attendanceRate)}%"></i></div>
             <div class="legend"><span><i style="background:#27a17b"></i>正常 ${normal}</span><span><i style="background:#f2a93b"></i>遲到 0</span><span><i style="background:#ef5b67"></i>缺勤 0</span><span><i style="background:#8792a5"></i>未打卡 ${notClocked}</span></div>`
          )}
          ${panel(
            "人事資料概況",
            "目前人事主檔中的在職人員",
            `<div class="mini-chart">${bars}</div><div class="chart-labels">${recentPeople.map((person) => `<span>${person.name.slice(0, 1)}</span>`).join("")}</div>`
          )}
        </div>
        <div>
          ${panel(
            "異常與人力提醒",
            "依人事、出勤與簽核即時產生",
            `<div class="alert-list">
              ${notClocked ? `<div class="alert-item"><i>!</i><div><b>${notClocked} 位在職員工尚未完成上班打卡</b><small>已排除目前請假人員・點擊前往出勤管理</small></div>${badge("需處理")}</div>` : ""}
              ${pending.total ? `<div class="alert-item"><i>✓</i><div><b>${pending.total} 件申請等待處理</b><small>來自 Employee App 與後台簽核事件</small></div>${badge("待確認")}</div>` : ""}
              ${!people.length ? `<div class="alert-item"><i>!</i><div><b>尚未建立在職員工</b><small>請先至員工人事主檔建立資料</small></div>${badge("異常")}</div>` : ""}
              ${people.length && !notClocked && !pending.total ? '<div class="empty-state compact-empty">目前沒有需要處理的人力異常</div>' : ""}
            </div>`
          )}
          ${panel(
            "重要公告",
            "發布給全公司",
            '<div class="notice-list"><div class="notice-item"><i>◎</i><div><b>第三季教育訓練開放報名</b><small>人力資源部・今天 08:00</small></div></div><div class="notice-item"><i>♧</i><div><b>颱風期間出勤與居家辦公規範</b><small>營運管理部・昨天 16:20</small></div></div></div>'
          )}
        </div>
      </div>`
    );
  }

  function liveOrganization() {
    const people = livePeople();
    const groups = [...new Set(people.map((person) => person.department))].map(
      (department) => ({
        department,
        people: people.filter((person) => person.department === department),
      })
    );
    return (
      head(
        "公司、據點與組織管理",
        "Organization",
        "依員工人事主檔即時呈現部門、職務與人員歸屬",
        '<button class="secondary-btn" data-add="department">新增部門</button><button class="primary-btn" data-route-go="employees">員工人事主檔</button>'
      ) +
      `<div class="stat-grid">
        ${stat("公司", "ABOMB", "台中總公司")}
        ${stat("在職人數", String(people.length), "即時連動人事主檔")}
        ${stat("部門數", String(groups.length), groups.map((group) => group.department).join("、") || "尚未建立部門")}
        ${stat("資料來源", "HR", "員工編號唯一連動")}
      </div>
      ${panel(
        "ABOMB 組織架構",
        "新增、調動或停用人員後即時更新",
        `<div class="tree-node active"><b>ABOMB｜台中總公司</b><span>${people.length} 人</span></div>
         ${groups
           .map(
             (group) =>
               `<details class="org-department-v147" open><summary><span><b>${group.department}</b><small>依人事主檔部門欄位</small></span><strong>${group.people.length} 人</strong></summary><div class="table-wrap"><table><thead><tr><th>員工</th><th>員工編號</th><th>職位</th><th>狀態</th></tr></thead><tbody>${group.people
                 .map(
                   (person) =>
                     `<tr data-search-row><td><b>${person.name}</b></td><td>${person.employeeId}</td><td>${person.position}</td><td>${badge(person.status)}</td></tr>`
                 )
                 .join("")}</tbody></table></div></details>`
           )
           .join("") || '<div class="empty-state">尚未建立員工資料</div>'}`
      )}`
    );
  }

  window.attendanceRecords = function () {
    const people = livePeople();
    const events = attendanceEvents();
    return panel(
      "今日打卡紀錄",
      "員工名單來自人事主檔；打卡結果來自 Employee App",
      toolbar(
        "搜尋員工或打卡方式",
        '<select class="filter-select"><option>全部狀態</option><option>正常</option><option>遲到</option><option>未打卡</option></select>'
      ) +
        `<div class="table-wrap"><table><thead><tr><th>員工</th><th>員工編號</th><th>上班</th><th>下班</th><th>打卡方式</th><th>狀態</th></tr></thead><tbody>${people
          .map((person) => {
            const records = events.filter(
              (event) => event.employeeId === person.employeeId
            );
            const clockIn = records.find((event) => event.action === "clock-in");
            const clockOut = records.find((event) => event.action === "clock-out");
            return `<tr data-search-row><td><b>${person.name}</b></td><td>${person.employeeId}</td><td>${clockIn?.time || "—"}</td><td>${clockOut?.time || "—"}</td><td>${clockIn?.method || clockOut?.method || "—"}</td><td>${badge(clockIn?.status || (clockIn ? "正常" : "未打卡"))}</td></tr>`;
          })
          .join("") || '<tr><td colspan="6" class="empty-state">尚未建立在職員工</td></tr>'}</tbody></table></div>`
    );
  };

  window.deviceTab = function () {
    const people = livePeople();
    return panel(
      "員工裝置綁定",
      "人員資料與員工編號來自人事主檔",
      toolbar("搜尋姓名、員編或裝置") +
        `<div class="table-wrap"><table><thead><tr><th>員工</th><th>員工編號</th><th>裝置</th><th>狀態</th><th>操作</th></tr></thead><tbody>${people
          .map(
            (person) =>
              `<tr data-search-row><td><b>${person.name}</b></td><td>${person.employeeId}</td><td>尚未綁定</td><td>${badge("待綁定")}</td><td class="row-actions"><button data-device-reset>裝置管理</button></td></tr>`
          )
          .join("") || '<tr><td colspan="5" class="empty-state">尚未建立在職員工</td></tr>'}</tbody></table></div>`
    );
  };

  window.statFullRows = function (label) {
    const people = livePeople();
    if (label.includes("請假")) {
      return leaveEvents().map((event) => [
        displayName(event),
        event.leaveType || event.title || "請假",
        event.period || "—",
        event.statusText || (event.status === "approved" ? "已核准" : "待審核"),
      ]);
    }
    if (label.includes("出勤")) {
      return people.map((person) => {
        const record = attendanceEvents().find(
          (event) =>
            event.employeeId === person.employeeId && event.action === "clock-in"
        );
        return [
          person.name,
          record?.time || "—",
          record?.status || (record ? "正常" : "未打卡"),
          person.location,
        ];
      });
    }
    if (label.includes("在職")) {
      return people.map((person) => [
        person.name,
        person.employeeId,
        person.department,
        person.status,
      ]);
    }
    const pending = pendingApprovalCounts();
    return [
      ["請假申請", `${pending.leave} 件`, "Employee App／後台", pending.leave ? "待處理" : "已完成"],
      ["加班申請", `${pending.overtime} 件`, "Employee App／後台", pending.overtime ? "待處理" : "已完成"],
      ["補卡申請", `${pending.correction} 件`, "Employee App／後台", pending.correction ? "待處理" : "已完成"],
    ];
  };

  function syncPayrollRoster() {
    if (typeof payrollRoster === "undefined" || !Array.isArray(payrollRoster)) return;
    const existing = new Map(payrollRoster.map((person) => [person.id, person]));
    payrollRoster.splice(
      0,
      payrollRoster.length,
      ...livePeople().map((person) => ({
        ...(existing.get(person.employeeId) || {}),
        name: person.name,
        id: person.employeeId,
        department: person.department,
        position: person.position,
        status: existing.get(person.employeeId)?.status || "待核對",
      }))
    );
  }

  views.dashboard = liveDashboard;
  views.organization = liveOrganization;
  syncPayrollRoster();

  window.addEventListener("storage", (event) => {
    if (
      [
        "bombhr-custom-employees",
        "bombhr-custom-employees-v147",
        "bombhr-employee-org-overrides",
        "bombhr-demo-events",
      ].includes(event.key)
    ) {
      syncPayrollRoster();
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
  });

  window.addEventListener("bombhr-demo-update", () => {
    syncPayrollRoster();
  });

  window.dispatchEvent(new HashChangeEvent("hashchange"));
})();
