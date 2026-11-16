// With Vite running on port 5173, pass a Playwright Page to checkMenuList(page).
export async function checkMenuList(page) {
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const path = "/quan-ly/dia-diem-poi/poi-test/mon-an";
  let permissions = ["menu:read", "menu:review", "menu:create"];
  const items = [
    { id: "pending", name: "Cơm tấm", is_active: false, is_available: false },
    { id: "approved", name: "Phở bò", is_active: true, is_available: true },
  ];
  let approvalRequests = 0;
  let failApproval = false;
  let releaseApproval;
  await page.addInitScript(() => localStorage.setItem("PWA_SESSION", "{}"));
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    const pathname = url.split("?")[0];
    let data = null;
    if (pathname.endsWith("/authorize/about-me")) {
      data = { user_id: "test", full_name: "Kiểm thử", role: { name: "test", permissions } };
    } else if (pathname.endsWith("/summary")) {
      data = { id: "poi-test", name: "Bến Nhà Rồng", address: "Quận 4" };
    } else if (pathname.endsWith("/approve")) {
      approvalRequests++;
      await new Promise((resolve) => { releaseApproval = resolve; });
      if (failApproval) {
        await route.fulfill({ status: 403, json: { success: false, message: "Không có quyền duyệt món ăn." } });
        return;
      }
      items[0].is_active = true;
      data = items[0];
    } else if (pathname.endsWith("/menu-items")) {
      const active = /[?&]is_active=(true|false)/.exec(url)?.[1] ?? null;
      const rows = items.filter((item) => active === null || item.is_active === (active === "true"));
      data = { data: rows, page: 1, page_size: 20, total_item: rows.length, total_page: rows.length ? 1 : 0 };
    } else if (pathname.endsWith("/admin/pois")) {
      data = { data: [{ id: "poi-test", name: "Bến Nhà Rồng", address: "Quận 4" }], page: 1, page_size: 20, total_item: 1, total_page: 1 };
    }
    await route.fulfill({ json: { success: true, data } });
  });

  await page.goto(`http://127.0.0.1:5173${path}/yeu-cau`);
  const approve = page.getByRole("button", { name: "Duyệt món Cơm tấm", exact: true });
  await approve.waitFor();
  check(page.url().endsWith("?status=pending"), "Old review links must select pending dishes");

  // Two clicks in the same event turn must still issue only one mutation.
  await approve.evaluate((button) => { button.click(); button.click(); });
  await page.getByText("Đang duyệt...", { exact: true }).waitFor();
  check(approvalRequests === 1, "Duplicate approval request");
  check(await page.getByLabel("Trạng thái duyệt").isDisabled(), "Filter must lock during approval");
  releaseApproval();
  await page.getByText("Không có món ăn phù hợp", { exact: true }).waitFor();
  await page.getByText("Duyệt thành công", { exact: true }).waitFor();
  check(page.url().includes(`${path}?`), "Approval must stay on the list");

  await page.getByLabel("Trạng thái duyệt").selectOption("all");
  const row = page.getByRole("row").filter({ hasText: "Cơm tấm" });
  await row.getByText("Đã duyệt", { exact: true }).waitFor();
  check(await row.getByRole("cell").nth(2).innerText() === "Chưa dịch xong", "Approval must not imply translation is complete");
  check(await row.getByRole("button").count() === 0, "Approved dishes must not have an approve button");

  items[0].is_active = false;
  failApproval = true;
  await page.getByRole("button", { name: "Làm mới", exact: true }).click();
  await approve.click();
  await page.getByText("Đang duyệt...", { exact: true }).waitFor();
  releaseApproval();
  await page.getByText("Không có quyền duyệt món ăn.", { exact: true }).waitFor();
  await approve.waitFor();
  check(!items[0].is_active && approvalRequests === 2, "Failure must preserve the pending dish and allow retry");

  await page.setViewportSize({ width: 390, height: 844 });
  check(await approve.isVisible(), "Quick approval must be accessible on mobile");
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Mobile layout overflows the viewport");

  permissions = ["menu:read"];
  await page.reload();
  await page.getByRole("row").filter({ hasText: "Cơm tấm" }).waitFor();
  check(await page.getByRole("button", { name: /^Duyệt món / }).count() === 0, "Read-only users must not approve");
  check(await page.getByRole("link", { name: "Thêm món ăn", exact: true }).count() === 0, "Read-only users must not create");

  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("http://127.0.0.1:5173/quan-ly/danh-sach-thuc-don");
  await page.getByRole("heading", { name: "Thực đơn tại POI", exact: true }).waitFor();
  check(await page.getByRole("link", { name: "Thực đơn tại POI", exact: true }).count() === 1, "Sidebar entry is missing");
  check(await page.getByRole("main").getByRole("link", { name: "Tiến trình dịch món ăn", exact: true }).count() === 1, "Translation navigation is missing from the list");
  check(await page.getByRole("link", { name: "Tiến trình dịch món ăn", exact: true }).count() === 2, "Translation navigation must remain in the sidebar");
  check(await page.getByRole("link", { name: "Thêm thực đơn", exact: true }).count() === 0, "Read-only users must not see create navigation");
  await page.getByRole("link", { name: "Xem thực đơn", exact: true }).click();
  await page.getByRole("heading", { name: "Món ăn tại Bến Nhà Rồng", exact: true }).waitFor();
  return "Passed: inline approval, duplicate guard, errors, filters, permissions, legacy link, sidebar, navigation, mobile.";
}
