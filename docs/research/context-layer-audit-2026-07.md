# Khảo sát hiện trạng context layer — đối chiếu chuẩn 07/2026

> Bước khám phá (discovery) cho đợt viết lại agent context layer. Chuẩn đối
> chiếu: `docs/research/agent-context-layer-architecture-2026-07.md` (gọi tắt
> "RESEARCH"). Mọi phát hiện dưới đây đã được xác minh trực tiếp trên cây repo
> ngày 2026-07-10, branch `refactor/context-layer-runtime-doctrine`.

---

## 1. Bản đồ hiện trạng — ánh xạ vào mô hình 5 tầng

| Tầng (RESEARCH §4) | Hiện thân trong repo | Kích thước |
|---|---|---|
| **0 — Hành vi, nạp mỗi phiên** | `AGENTS.md` root (110 dòng, ~1.4k token) + `CLAUDE.md` shim (10 byte, **hỏng — xem F1**) + 10 nested `AGENTS.md` (apps/web, apps/catalog, packages/×8; 20–77 dòng/file) | root ~5.5 KB |
| **1 — Luật theo ngữ cảnh** | `.claude/rules/nextjs-async-apis.md` (48 dòng) + `nextjs-cache-components.md` (97 dòng) — dùng `globs:` (kiểu Cursor), **luôn nạp trên Claude Code** (~930 token/phiên) | ~3.7 KB |
| **2 — Quy trình** | `.agents/skills/` — 17 skill canonical (43–170 dòng) + `evals/evals.json` + `scripts/` templates; shim sinh tự động tại `.claude/skills/` (`ai:skills:sync`); chuẩn tác giả `.agents/skills/README.md`. Thêm tầng phụ **không chuẩn hoá**: `.agents/workflows/` (review-gate, exec-plan, skill-health-check) | 1.283 dòng SKILL.md |
| **3 — Dữ liệu sống** | `.mcp.json`: 1 server `next-devtools@0.4.0` (pin, opt-in, disabled mặc định); doctrine tại `docs/ai/mcp.md` (65 dòng) | — |
| **4 — Trí nhớ & sản phẩm trung gian** | `docs/ai/MEMORY.md` (settled-decision log) + auto-memory harness; `docs/plans/` (+ `archive/` với **15 plan context-layer trong ~1 tháng**); `docs/adr/` (8 ADR active, 7+ đã purge) | — |
| **Router (không có trong RESEARCH)** | `docs/ai/index.md` (85 dòng, "single router") + `llms.txt` (35 dòng, "agentic handshake", ADR-0022) + mục "Read Routing" trong AGENTS.md — **ba bản đồ chồng nhau** | — |
| **Enforcement (vượt chuẩn)** | Hooks (`SessionStart` re-anchor, `PostToolUse` prettier, `Stop` ai:check) + `check-ai-context.mjs` (906 dòng, 21 check) + `review-gate-rules.mjs` + self-test 1.254 dòng + `ai-metrics.mjs` (15 metric) + sync scripts (skills/graph/adr) | ~4.000 dòng script |

Tài liệu canonical tầng 1–2 tham chiếu: `docs/conventions/` (7 file, 39–386
dòng), `docs/architecture/` (2 file), `docs/ai/` (8 file), `docs/adr/`.

Adapter đa tool: `.github/copilot-instructions.md` = pointer mỏng ✅; không có
`.cursor`/`.gemini`/`.codex`; hook đã đón đầu `GEMINI.md`/`CODEX.md`.

---

## 2. Phát hiện — xếp theo mức tàn phá (RESEARCH §2.1: sai > thiếu > nhiễu)

### F1 — **CLAUDE.md hỏng import: tầng hành vi root KHÔNG được nạp trên Claude Code** (SAI, nghiêm trọng nhất)

`CLAUDE.md` chứa đúng 10 byte: chuỗi `AGENTS.md` **không có `@`**. Cú pháp
import của Claude Code là `@AGENTS.md`; chuỗi trần không phải import. Đã xác
minh sống trong phiên làm việc: context được inject chỉ có literal `AGENTS.md`,
toàn bộ nội dung AGENTS.md (kể cả `<SECURITY_MANDATES>` P0, Priority Stack,
Mandatory Skill Invocations, Definition of Done) **vắng mặt**. `llms.txt` và
`docs/ai/index.md` vẫn tuyên bố "CLAUDE.md imports AGENTS.md" — thông tin sai
đang lưu hành. Các tầng khác (rules, skills, hooks) vẫn nạp bình thường nên lỗi
bị che khuất. Không gate nào bắt được lỗi này (`ai:check` không kiểm nội dung
CLAUDE.md).

### F2 — Canonical đảo ngược: luật Next.js 16 sống trong thư mục tool-specific (SAI cấu trúc, vi phạm RESEARCH §5.3)

`.claude/rules/*` được tuyên bố là **SSOT** ("Hard rules (SSOT — do not
duplicate here)" trong `apps/web/AGENTS.md`). RESEARCH yêu cầu ngược lại: nội
dung canonical ở lớp trung lập (nested AGENTS.md / docs), rule tool-specific
chỉ là pointer/tối ưu nạp. Hệ quả: agent không-phải-Claude phải được dặn thủ
công "load `.claude/rules/`" (đúng dòng đó nằm trong agent-command-policy) —
mùi phân mảnh mà chuẩn muốn diệt.

### F3 — Rules luôn-nạp dù có thể path-scope (NHIỄU ~930 token/phiên)

Hai rule dùng `globs:` (quy ước Cursor) thay vì `paths:` (quy ước Claude Code)
— và doc tự nhận đây là chủ đích ("always loaded on Claude Code"). Mọi phiên —
kể cả phiên chỉ sửa docs/migrations — trả ~930 token cho luật Next.js. Chuẩn
Claude Code hỗ trợ `paths:` để chỉ nạp khi chạm file khớp; phiên sửa app code
vẫn nhận đủ luật.

### F4 — Ba bản đồ điều hướng chồng nhau (NHIỄU + nguy cơ trôi dạt)

1. `AGENTS.md ## Read Routing` → trỏ tới index;
2. `docs/ai/index.md` — router chính, 85 dòng, kèm "Tool Support Matrix";
3. `llms.txt` — lặp lại cùng danh sách link với chú thích khác.

RESEARCH đặt bản đồ điều hướng **trong chính AGENTS.md root** (bảng Sentry) và
dành `llms.txt` cho **website tài liệu công khai** phục vụ agent bên ngoài lúc
inference — không phải bản đồ nội-repo (repo này không xuất bản docs site).
ADR-0022 giữ llms.txt làm "handshake" là cách dùng lệch spec; ba nơi cùng mô tả
một cấu trúc là ba nơi phải sync (hiện `ai:check` phải gánh việc sync đó bằng
máy).

### F5 — Tầng `.agents/workflows/` không thuộc chuẩn nào + mojibake (SAI nhẹ + NHIỄU)

`workflows/` là phát minh nội bộ nằm ngoài spec agentskills (không frontmatter,
không discovery, agent chỉ tìm thấy qua router). `review-gate.md` và
`exec-plan.md` về bản chất là *quy trình lặp lại* — đúng định nghĩa skill.
`exec-plan.md` đang chứa **mojibake** (`�` thay cho em-dash) — bằng chứng
sống của "thông tin sai/hỏng" trong cây context.

### F6 — Lệnh cốt lõi không được pre-fetch (THIẾU, vi phạm Factor 13)

AGENTS.md root không có mục lệnh build/test/lint inline — bảng gate nằm một hop
xa tại `docs/ai/agent-command-policy.md`. RESEARCH template §4.2: lệnh cốt lõi
thuộc nhóm "luôn cần → pre-fetch" ngay trong root. Ngược lại,
`agent-command-policy.md ## Tool Discipline` (batch calls, absolute paths, read
before edit…) lặp lại hành vi mặc định của harness hiện đại — nhiễu thuần.

### F7 — `docs/ai/agent-behavior.md` dạy lại harness điều harness tự làm (NHIỄU)

66 dòng doctrine về context budget, subagent isolation, compaction — trùng vai
với chính RESEARCH §7 (dành cho *người* thiết kế workflow) và với năng lực sẵn
có của harness. Giá trị ròng trên mỗi token thấp; phần duy nhất mang tính dự án
là "never delegate security-sensitive reads" và refresh-triggers (có thể nén
còn vài dòng, đặt đúng nhà).

### F8 — Không có cơ chế nạp nested cho Claude Code (THIẾU, tầng Select)

Claude Code lazy-load `CLAUDE.md` trong thư mục con — nhưng repo chỉ có nested
`AGENTS.md`, không có nested `CLAUDE.md` shim. Việc đọc `apps/web/AGENTS.md`
hay `packages/ui/AGENTS.md` hiện là **honor-system** (một câu dặn trong Read
Routing — mà mục đó lại nằm trong file không được nạp, xem F1). "Closest wins"
đang không chạy trên chính tool chủ lực.

### F9 — Bộ máy meta phình to hơn context nó canh giữ (NHIỄU/chi phí bảo trì)

~4.000 dòng script enforcement/metrics/sync cho ~2.500 dòng context thực. Điểm
mạnh (đúng anti-pattern #6: luật cứng → hooks/CI ✅) nhưng đã vượt điểm hoàn
vốn: 15 metric, self-test 1.254 dòng, freeze-policy ADR yêu cầu trích metric
trước khi đổi context. 15 plan context-layer archive trong một tháng + ghi chú
"Seven context-layer ADRs in June 2026 was the over-tuning this prevents" cho
thấy vòng lặp tune-đo-tune đã từng nuốt nhiều công sức hơn giá trị tạo ra.

### F10 — Rác rìa

- `nguồn repo.md` (untracked, root) — bản nháp danh mục nguồn, đã được chưng
  cất vào RESEARCH §10 → gộp/xoá.
- `docs/starter/rename-checklist.md` — di sản starter-template.
- `ai:check` bị ghép cứng `ai:tw` (tailwind-lint) — gate context kéo theo lint
  CSS, sai altitude của một "context gate".
- ADR-0003 (Cursor `.mdc` permissions — deferred), ADR-0022 (llms.txt) sẽ bị
  ảnh hưởng trực tiếp bởi đợt refactor này.

### F11 — `design-system.md` phình 386 dòng: convention lai ADR lai reference (NHIỄU + nguy cơ SAI)

Gấp ~2 lần ngưỡng adherence (<200 dòng), lớn hơn cả `AGENTS.md` root + toàn bộ
`docs/ai/` cộng lại theo giá trị tải. Trộn 4 loại nội dung: hard rules đúng vai
convention (anti-slop table, token tiers, decision tree — phần tốt); doctrine
tham khảo sâu (tier map Apple/M3, alpha matrix, delineation doctrine, WCAG
bridge) đáng lẽ thuộc `ui-styling/REFERENCE.md`; **narrative lịch sử kiểu ADR**
("An earlier revision imposed an Lc 25 floor… so the floor was removed"); và
mục "Extended glass token set" **chép tay danh sách token sống** từ
`theme.css`/`tokens.css` — đúng anti-pattern #3 (dữ liệu sống trong file tĩnh
sẽ lỗi thời thành thông tin sai). Tự mâu thuẫn về vai: mở đầu tuyên bố
"reference tables live in the skill" rồi tự chứa bảng reference dày hơn skill —
progressive disclosure bị đảo.

### F12 — Nội dung hỏng thứ hai: `diagnosing-bugs/SKILL.md` (SAI)

Dòng hướng dẫn repro-loop chứa văn bản hỏng/lẫn CJK: *"**Fry**
`repro-loop.template.sh` **仅** as a cross-platform `bun run` fallback"* — cùng
họ lỗi mojibake với `exec-plan.md` (F5). Hai file hỏng ở hai nhánh khác nhau
của cây context cho thấy chưa có gate nào bắt non-ASCII bất thường / văn bản
hỏng.

### F13 — Cross-reference sai còn sống: `codebase-design` trỏ nhầm mục common-mistakes (SAI)

`codebase-design/SKILL.md` viết "the simplicity rule in
`docs/ai/common-mistakes.md` (#11)" — nhưng #11 là *test-weakening*; simplicity
là **#15**. `checkCodeReferences` chỉ xác thực *path*, không xác thực *anchor
số thứ tự* → drift lọt gate. Bài học cấu trúc: tham chiếu theo **rule id**
(`test-weakening`, `query-result-in-zustand`…) chứ không theo số thứ tự mục —
số đổi mỗi lần thêm/xoá entry.

### F14 — Bốn skill phụ thuộc cứng vào router sắp giải thể (blast radius)

`grill-requirements`, `refactor-plan`, `diagnosing-bugs`, `domain-modeling`
đều có bước bắt buộc "Read `docs/ai/index.md`" (hai skill đầu đặt trong
Pre-process checklist). Giải thể index (F4) phải cập nhật đồng loạt các skill
này — ghi vào plan như một bước riêng, tránh để lại pointer chết.

### F15 — ADR-0003 mâu thuẫn với hiện trạng về chính cơ chế nạp rules (SAI, anti-pattern #5)

ADR-0003 mô tả `.claude/rules/` là "the **glob-scoped** `.claude/rules/`
layer" (tức tin rằng lazy-load), trong khi `AGENTS.md`/`docs/ai/index.md` ghi
"**always loaded** on Claude Code". Hai tài liệu enforced-tier phát biểu ngược
nhau về cùng một cơ chế — đúng anti-pattern #5 (luật mâu thuẫn, model "may pick
one arbitrarily"). Khi chuyển rules sang `paths:` (F3), ADR-0003 phải được
supersede/amend cho khớp.

### F16 — `scripts/context-map.json`: bản đồ điều hướng thứ TƯ, máy-đọc, không doc nào ghi nhận

Bản đồ subsystem → `{code globs, owner docs/skills}` nuôi hook drift-notice
(`check-context-drift.mjs`: code đổi mà owner doc không đổi → nhắc). **Cơ chế
tốt** — chính là "closest wins" phiên bản máy. Nhưng: (a) nó là nơi thứ 4 mã
hoá cấu trúc điều hướng (sau Read Routing, index.md, llms.txt) mà
`docs/ai/index.md` — tự nhận "single router" — không hề nhắc tới; (b) trùng
lặp nội bộ: hai subsystem `supabase-rls` và `supabase-security` map gần cùng
code globs vào cùng owners. Khi root nhận bảng điều hướng (§8 mục 6), bảng đó
và context-map phải **sinh từ một nguồn** (hoặc gate-sync), nếu không sẽ tạo
bề mặt trôi dạt thứ tư.

### F17 — Manifest hard-code toàn bộ kiến trúc hiện tại; ngân sách size của root đã cạn 99%

`scripts/ai-context.manifest.json` ghim 43 `requiredFiles`,
`indexRequiredReferences` (buộc index.md phải trỏ đúng các file hiện tại — giải
thể index sẽ **fail gate** nếu không sửa manifest trước), `frontmatterRequired`,
và `sizeBudgets` per-file. Hệ quả cho plan: **mọi bước di dời cấu trúc phải đi
kèm bước sửa manifest trong cùng commit**, nếu không Stop-hook/`ai:check` chặn
chính đợt refactor. Đáng chú ý: cơ chế `sizeBudgets` là conform vượt chuẩn
(đúng "token budget per file" của RESEARCH §9), nhưng `AGENTS.md` đang ở
5465/5500 byte = **99.4% ngân sách của chính nó** — không còn chỗ thêm một
dòng; viết lại root phải đặt lại budget có headroom (~20%).

---

## 3. Những gì ĐÃ đạt chuẩn (giữ lại, không đập)

| Hạng mục | Đối chiếu |
|---|---|
| **17 skill canonical** — frontmatter `name`+`description` đúng spec, description có trigger clause, thân < 500 dòng, references 1 cấp, evals + templates đi kèm | RESEARCH §3.2 ✅, có phần vượt chuẩn (evals) |
| **Shim sinh tự động** `.claude/skills/` + gate chống stale/orphan — đúng nguyên tắc dotagents "config từng tool là artefact sinh ra" (symlink không khả thi trên Windows) | §4.4 ✅ |
| **Nested AGENTS.md** 10 file, ngắn, chỉ chứa delta (packages/ui là mẫu tốt) | §4.1 ✅ (trừ F8) |
| **Luật đúng altitude** trong AGENTS.md/nested: "two-arg `revalidateTag`", "no barrel import", "never mirror server data into Zustand" — kiểm chứng được | §2.5 ✅ |
| **Luật cứng nằm ở hooks/gate chứ không phải văn xuôi** (Stop-hook ai:check, review-gate-rules, check-secrets) | anti-pattern #6 ✅ |
| **MCP doctrine**: pin version, opt-in, disabled-by-default, fallback rõ, từ chối server thừa trust-surface | §3.3 ✅ |
| **domain-language.md** (pattern Airflow "Dag"), **common-mistakes.md** ❌/✅ cross-ref rule id, **golden-examples.md** path được gate xác thực | §6.2, §2.1 ✅ |
| **MEMORY.md** pointers-first + quy trình promote-lên-conventions | §5.2 auto memory ✅ |
| **ADR** MADR-lite, register sinh tự động, lifecycle rõ | tầng 4 ✅ |
| **Plans/archive** = artefact compaction có chủ đích kiểu spec-kit | §7.3 ✅ |
| **copilot-instructions.md** pointer mỏng, không phân mảnh nội dung | anti-pattern #1 ✅ |
| **`docs-health.yml`** — cron hàng tuần chạy `ai:check` + `ai:eval` + snapshot metrics (artifact 90 ngày) + **Lychee** quét link https:// mục nát trên toàn bộ bề mặt chỉ dẫn | anti-pattern #10 giải bằng máy ✅ vượt chuẩn |
| **CI (`ci.yml`)**: `ai:check` mỗi push/PR + fallow audit (gate new-only) — enforcement đúng tầng | anti-pattern #6 ✅ |
| **`sizeBudgets` per-file trong manifest** — ngân sách byte cho từng file luôn-nạp/đắt, gate-enforced | "token budget" RESEARCH §9 ✅ (nhưng xem F17: root cạn 99%) |
| **`run-ai-evals.mjs` self-test analyzer trước khi tin verdict**; `ai-review-rule-allowlist.json` = ngoại lệ có evidence + reason từng entry | kỷ luật enforcement tốt ✅ |
| **Golden-tasks có cấu trúc** (frontmatter `expects_skills_fire` / `expects_pattern` + rubric per-task; 6/9 task là injection-probe khớp Untrusted Content Policy) | eval-first ✅ |
| **Không có tầng ẩn**: `~/.claude/CLAUDE.md`, `CLAUDE.local.md`, `.cursor/`, `.gemini/`, `GEMINI.md`, `CODEX.md` đều không tồn tại — kiểm kê phân mảnh khép kín | anti-pattern #1 ✅ |

Priority Stack P0–P6 và `<SECURITY_MANDATES>` là phần **vượt ngoài** RESEARCH
(chuẩn không bàn security-prompt-injection) — giữ, đây là tài sản riêng đáng
giá của repo.

---

## 4. Ứng viên xoá / gộp / di dời (bàn trong plan, chưa thực hiện)

| Hành động | Đối tượng | Lý do |
|---|---|---|
| Sửa 1 dòng (việc đầu tiên) | `CLAUDE.md` → `@AGENTS.md` | F1 — bug nạp |
| Gộp vào AGENTS.md root | Bảng điều hướng (từ index.md) + lệnh cốt lõi + gate table rút gọn (từ agent-command-policy.md) | F4, F6 |
| Xoá hoặc thu về ≤ 15 dòng | `docs/ai/agent-behavior.md` | F7 |
| Xoá phần "Tool Discipline" generic | `docs/ai/agent-command-policy.md` | F6 (nhiễu) |
| Chuyển canonical sang lớp trung lập, rule thành pointer + `paths:` | `.claude/rules/*` ↔ `apps/web/AGENTS.md` / `docs/conventions/` | F2, F3 |
| Chuyển thành skill hoặc xoá | `.agents/workflows/{review-gate,exec-plan,skill-health-check}.md` (sửa mojibake nếu giữ) | F5 |
| Xoá hoặc thu thành generated-artifact thuần | `llms.txt` (kéo theo supersede ADR-0022) | F4 — dùng lệch spec |
| Thu gọn `docs/ai/index.md` | còn phần router thực sự cần sau khi AGENTS.md có map; cân nhắc xoá hẳn Tool Support Matrix | F4 |
| Chuyển "Rejected Candidates" của mcp.md vào ADR | `docs/ai/mcp.md` | ADR là nhà của "why rejected" |
| Thêm nested `CLAUDE.md` shim (`@AGENTS.md` tương đối) cho apps/web + packages/ui (tối thiểu) | tầng Select | F8 |
| Xoá `nguồn repo.md`, cân nhắc xoá `docs/starter/` | rìa | F10 |
| Tách `ai:tw` khỏi `ai:check`; rà lại 15 metric & self-test xuống mức đủ dùng | scripts | F9, F10 |
| Tách 4 hướng: hard rules ở lại / doctrine → REFERENCE / narrative → ADR hoặc xoá / token list → pointer hay auto-gen | `docs/conventions/design-system.md` | F11, §9.1 |
| Sửa văn bản hỏng (mojibake/CJK) + thêm gate bắt non-ASCII bất thường trong cây context | `exec-plan.md`, `diagnosing-bugs/SKILL.md` | F5, F12 |
| Đổi tham chiếu common-mistakes từ số mục sang rule id | `codebase-design` + mọi nơi trỏ "#N" | F13, §9.3 |
| Cập nhật đồng loạt 4 skill phụ thuộc `docs/ai/index.md` khi giải thể router | `grill-requirements`, `refactor-plan`, `diagnosing-bugs`, `domain-modeling` | F14 |
| Gộp `docs/quality-gates.md` vào nhà gate duy nhất | `docs/quality-gates.md` | §9.3, invariant #7 |
| Nhập bước máy (1–3) của `skill-health-check` vào `ai:check`; giữ bước 4–5 làm quy trình bảo trì | `.agents/workflows/skill-health-check.md` | §9.6 |
| Supersede/amend ADR-0003 khi chuyển rules sang `paths:` | `docs/adr/0003-*.md` | F15 |
| Dời artifact run ra khỏi git (hoặc gitignore thư mục kết quả) | `scripts/PLAN_baseline_2026-07-08T00-00-00.json`, `scripts/behavioral-evals/last-run.json` | rác run-output commit vào repo |
| Khử subsystem trùng (`supabase-rls` ≈ `supabase-security`) + đưa context-map vào tài liệu; sinh bảng điều hướng root và context-map từ một nguồn | `scripts/context-map.json` | F16 |
| Mỗi bước di dời cấu trúc đi kèm sửa manifest cùng commit; kết thúc bằng đặt lại `sizeBudgets` có headroom ~20% | `scripts/ai-context.manifest.json` | F17 |

## 5. Review chi tiết tầng luôn-nạp (tầng 0 + tầng 1)

Tầng đắt nhất — trả phí token mỗi phiên — nên mỗi khối nội dung phải qua 4 câu
hỏi: **(a)** có cần *mọi* phiên không, **(b)** đúng altitude không (kiểm chứng
được, không khẩu hiệu), **(c)** có nhà thứ hai không (trùng lặp), **(d)** nếu
không nằm đây thì nhà đúng ở đâu. Dưới đây là phán quyết theo từng file, từng
khối.

### 5.1. `AGENTS.md` root (110 dòng, ~1.4k token) — phán quyết theo khối

| Khối (dòng) | Phán quyết | Căn cứ |
|---|---|---|
| Intro (1–7) | **VIẾT LẠI** | Trộn 3 concern: định danh repo + routing + cảnh báo "not the Next.js in your training data". Cảnh báo Next.js đã có nhà đúng tại `apps/web/AGENTS.md` (câu mở đầu gần nguyên văn) — xoá khỏi root; phiên sửa migration/docs không cần nó. |
| `<SECURITY_MANDATES>` (9–16) | **GIỮ NGUYÊN** | Tài sản riêng vượt chuẩn. Altitude đúng (4 mandate đều kiểm chứng được), có enforcement thật (`service-role-client`, `server-only-in-client`, `missing-auth-uid-policy`). Đây là phần *đáng* trả phí mỗi phiên nhất. |
| Untrusted Content (18–25) | **GIỮ — canonical tại đây** | Xoá bản trùng trong `docs/ai/agent-behavior.md ## Untrusted input` (nhà thứ hai, chỉ thêm ghi chú honor-system — ghi chú đó dồn về root 1 câu). |
| Priority Stack (27–40) | **GIỮ, nén nhẹ** | Không case study nào có, nhưng repo đa-agent + đa-nguồn-luật cần trọng tài xung đột. P1 liệt kê file cụ thể — đã xác minh các path tồn tại. |
| Project (42–57) | **TÁCH ĐÔI** | Stack + layout: giữ (nén). Câu state-ownership: nhà thứ 4 của invariant #3 (§6) — thu về 1 dòng pointer. **Luật React Compiler (55–57) chỉ tồn tại duy nhất ở đây** và là luật app-code thuần → chuyển sang `apps/web/AGENTS.md`; vì F1, luật này hiện đang *vô gia cư* trên Claude Code. |
| How to work (59–66) | **GIỮ, cân nhắc mở rộng** | Hợp đồng hành vi kiểu Coder (§6.4 RESEARCH) nhưng mới có ½: có simplicity/surgical, thiếu *exception-stop* ("muốn ngoại lệ với luật → dừng, xin phép") và thiếu contract phản biện (cấm nịnh, push back). |
| Mandatory Skill Invocations (68–84) | **QUYẾT ĐỊNH — Q6 (§9)** | 17 dòng lặp lại chức năng của `description` (cơ chế fire chuẩn agentskills). Tồn tại vì description-firing không đáng tin 100% — một dạng bảo hiểm bằng token thường trực. Nếu giữ: nén thành cột trong bảng điều hướng, không đứng riêng. |
| Boundaries (86–91) | **SỬA** | "Never" restate nguyên 4 mandate P0 — **tự trùng lặp trong cùng file** → thay bằng "Never: the P0 mandates (see above)" + chỉ liệt kê Never *ngoài-P0* nếu có. Thiếu tầng **Always** (Cloudflare ba mức): ví dụ "Always: run the narrowest gate; always update the owning doc when behavior changes". |
| Validation & DoD (93–104) | **GIỮ DoD, thêm lệnh inline** | DoD 3 tiêu chí là mẫu tốt. Nhưng **lệnh cốt lõi không được pre-fetch** (F6): bảng gate nằm 1 hop xa trong khi Factor 13 xếp build/test/lint vào nhóm "luôn cần". Câu PowerShell 7 giữ đúng 1 dòng (đặc thù dev-box, không đáng nhiều hơn). |
| Read Routing (106–110) | **THAY** | Thay bằng bảng điều hướng kiểu Sentry ngay trong root (xem §8) — xoá vòng trung gian qua `docs/ai/index.md`. |

**Thiếu hẳn so với template §4.2 + case studies:**

1. **Tuyên bố source-of-truth** (dòng 1 của Sentry: "AGENTS.md files are the
   source of truth… do not duplicate guidance into tool-specific rule files") —
   chính là liều vắc-xin chống anti-pattern #1 mà repo đang thiếu trong khi đã
   *bị* triệu chứng (F2).
2. **Bảng điều hướng** "đang sửa X → đọc Y" — hiện phân tán vào index.md.
3. **Lệnh cốt lõi inline** (install / dev / gate-ladder một dòng).
4. **Quy ước PR & commit** — repo dùng conventional commits nhất quán
   (`feat(eval):`, `docs(ai):`, `refactor(ui):` — bằng chứng git log) nhưng
   **không nơi nào trong cây context ghi luật này** = "thiếu thông tin" thật
   (loại lỗi #2 theo HumanLayer). Agent mới đoán được format từ P4 (local
   evidence) thay vì được cho biết.
5. **Pointer glossary** (`docs/ai/domain-language.md`) — root không nhắc tới;
   pattern Airflow xếp quy ước ngôn ngữ domain là mục root.

### 5.2. `CLAUDE.md` + cơ chế nạp của Claude Code

- Hiện trạng: hỏng (F1). Target: dòng 1 `@AGENTS.md`; phần riêng Claude phía
  dưới *chỉ khi* có nội dung Claude-specific thật (hiện chưa thấy nhu cầu —
  hooks/rules tự vận hành, không cần văn bản nhắc).
- Windows → dùng import, không symlink (đúng khuyến nghị chính thức, RESEARCH
  §5.2).
- **Nested**: Claude Code chỉ lazy-load `CLAUDE.md` thư mục con, không tự đọc
  nested `AGENTS.md` → cần shim `CLAUDE.md` = `@AGENTS.md` trong `apps/web/`,
  `apps/catalog/`, `packages/*/` — **sinh tự động** bằng sync script (mở rộng
  `ai:skills:sync` thành `ai:shims:sync`), gate chống stale như skill shims.
  Khi đó "closest wins" chạy thật thay vì honor-system (F8).

### 5.3. `.claude/rules/*` — 2 file (~930 token, luôn nạp)

**`nextjs-async-apis.md` (48 dòng):** nội dung đúng altitude (bảng API +
❌/✅ signature + `next typegen`). Ba vấn đề: (a) `globs:` thay vì `paths:` →
Claude Code luôn nạp (F3); (b) **glob bất đối xứng** — async chỉ phủ
`apps/web/src/app/**` trong khi cache rule phủ cả `features/**`; Server Action
trong `features/*/actions.ts` dùng `cookies()`/`headers()` sẽ lọt lưới (chưa có
usage hôm nay — gap tiềm ẩn, sửa khi path-scope); (c) canonical nằm trong thư
mục tool-specific (F2).

**`nextjs-cache-components.md` (97 dòng):** nội dung chuẩn nhưng là **tâm của
cụm trùng lặp lớn nhất repo** (invariant #4, §6): `data-fetching.md` (dòng
15–32) chép lại gần toàn bộ bằng văn xuôi *rồi trỏ ngược lại rule* làm
"canonical mechanics"; `common-mistakes` #10 trỏ + #13 chép hẳn luật two-arg
`revalidateTag` thành mục riêng; skill `server-action` chép semantics
`updateTag`/`revalidateTag`; `apps/web/AGENTS.md` tóm tắt lần nữa. Một thay đổi
API Next.js sẽ phải sửa 5–6 chỗ — đúng kịch bản "trôi dạt" mà chuẩn cảnh báo.

**Target cho cả hai:** canonical dời về lớp trung lập
(`docs/conventions/nextjs-16.md`, hoặc nhập vào `apps/web/AGENTS.md` nếu giữ
được dưới ~120 dòng); `.claude/rules/*` co về pointer ~10 dòng + frontmatter
`paths:` đúng chuẩn Claude Code; các bản chép văn xuôi thu về pointer 1 dòng.

### 5.4. Nested `AGENTS.md` — phán quyết từng file

| File | Dòng | Phán quyết |
|---|---|---|
| `apps/web/AGENTS.md` | 23 | **TỐT** — nhận thêm 2 nội dung từ root (React Compiler, cảnh báo training-data); đảo hướng SSOT với `.claude/rules` (F2). |
| `apps/catalog/AGENTS.md` | 20 | **ĐẠT** — đúng cỡ, lệnh kiểm chứng được. |
| `packages/ui/AGENTS.md` | 77 | **MẪU TỐT NHẤT** — delta thật (no-barrel, exports sinh tự động, bảng feedback sub-roles = "điều code không tự nói", pitfalls có tên check enforcement). Dài nhất nhưng dưới ngưỡng; giữ. |
| `packages/supabase/AGENTS.md` | 41 | **TỐT** — delta an ninh + blast-radius + cross-ref rule id. Nén phần restate P0 service-role còn 1 dòng + pointer. |
| `packages/auth/AGENTS.md` | 40 | **TỐT** — như trên; câu "foundational block" đúng vai Airflow-style. |
| `packages/env/AGENTS.md` | 38 | **TỐT** — delta ranh giới client/server schema rõ. |
| `packages/config/AGENTS.md` | 38 | **ĐẠT** — ghi được coupling lint-policy ↔ `ai:check`. |
| `packages/validators/AGENTS.md` | 34 | **ĐẠT**. |
| `packages/test-utils/AGENTS.md` | 35 | **QUÁ KHỔ** — 35 dòng cho public API đúng 1 helper (`createTestId`). Thu ~15 dòng. |
| `packages/features/AGENTS.md` | 35 | **XEM XÉT XOÁ** — 35 dòng context cho package placeholder *không có runtime API*. Hoặc xoá package (Q7), hoặc thu file còn ~5 dòng "placeholder, đừng dùng". |

**Nghi lễ lặp:** cả 10 file mở đầu bằng 3–4 dòng "Path-scoped contract for X…
root AGENTS.md still applies; this file only adds the package-specific
boundary" (~40 dòng toàn cục). Nearest-file semantics là mặc định của chuẩn —
tuyên bố lại là nhiễu; chuẩn hoá còn 1 dòng khi viết lại.

---

## 6. Ma trận trùng lặp — mỗi invariant đang có bao nhiêu nhà

Quy tắc đích (RESEARCH §4: "mỗi mẩu thông tin có đúng một nhà"): **1 nhà
canonical + 1 dòng P0 ở root (nếu là luật an ninh) + tối đa 1 dòng delta ở nơi
sở hữu; mọi chỗ khác là pointer.** Lặp *một dòng* cho luật P0 là chủ đích chấp
nhận được; lặp *nguyên đoạn semantics* thì không.

| # | Invariant | Nhà hiện tại (đếm) | Canonical đề xuất |
|---|---|---|---|
| 1 | Service-role key server-only | root P0#2 + root Never + `server-client-boundary` + `supabase-security ## Client Keys` + `env`/`auth`/`supabase`/`web` AGENTS + `common-mistakes` #3 + skill `server-action` (**~10**) | `supabase-security.md`; root giữ P0 1 dòng; nested giữ delta 1 dòng |
| 2 | RLS là ranh giới dữ liệu | root P0#1 + `server-client-boundary` + `supabase-security` + `common-mistakes` #4 + `review-gate` P0 + skill `supabase-migration` + `domain-language` + nested (**~8**) | `supabase-security.md` |
| 3 | Không mirror server state vào Zustand | root Project + `apps/web` AGENTS + `data-fetching.md` + `common-mistakes` #1 + `domain-language` + 2 skill descriptions + `review-gate` (**~7**) | `data-fetching.md` |
| 4 | Ngữ nghĩa cache Next 16 (`'use cache'`/tags/two-arg) | `.claude/rules/nextjs-cache-components` + `data-fetching` (chép văn xuôi) + `common-mistakes` #10, #13 + skill `server-action` + skill `server-component-read` + `apps/web` AGENTS (**6–7**) | file trung lập mới (§5.3); rules = pointer |
| 5 | Marker `"server-only"` bắt buộc | root P0#3 + `server-client-boundary` + `apps/web` + `env`/`auth`/`supabase` AGENTS + `common-mistakes` #14 (**~7**) | `server-client-boundary.md` |
| 6 | Untrusted content = data | root + `agent-behavior.md` (**2**) | root; xoá bản sao |
| 7 | Narrowest-gate DoD | root DoD + `agent-command-policy` (bảng) + `docs/quality-gates.md` + `review-gate` + `index ## Verification` + `exec-plan` + `copilot-instructions` (**7**, đa số pointer) | thang gate vào root; `quality-gates.md` gộp vào nhà gate duy nhất; số còn lại giữ pointer |
| 8 | Doctrine glass/design (placement, blur ladder, tier, APCA) | `design-system.md` + `ui-styling/SKILL.md` + `ui-styling/REFERENCE.md` + `packages/ui/AGENTS.md` (một phần) (**4**, lặp đoạn thật — blur ladder và tier rules xuất hiện nguyên bảng ở ≥2 nơi) | hard rules ngắn ở `design-system.md`; toàn bộ bảng/doctrine sâu về `REFERENCE.md` (F11) |

Gate `checkInvariantDuplicates` + metric `invariantDuplicateCategories` **đã
tồn tại** nhưng ngưỡng hiện hành cho phép mức lặp trên — bằng chứng máy đo
không thay được chuẩn thiết kế. Khi viết lại: siết check này theo quy tắc đích
(fail khi một invariant xuất hiện dạng đoạn ở >1 nhà ngoài canonical).

---

## 7. Luồng nạp theo loại phiên — hiện tại vs chuẩn

Ngân sách thường trực đo được trên Claude Code (bytes/4):

| Thành phần | Hiện tại | Sau sửa F1 | Target |
|---|---|---|---|
| Root qua CLAUDE.md | **0 (hỏng)** | ~1.4k | ≤1.2k (root viết lại ≤150 dòng) |
| `.claude/rules/*` | ~930 | ~930 | ~0 thường trực (path-scoped, chỉ nạp khi chạm) |
| Skill metadata (17 shim descriptions) | ~1.3k | ~1.3k | ~1.3k (đúng thiết kế progressive disclosure) |
| Auto-memory index | ≤200 dòng | ≤200 dòng | không đổi |
| **Tổng thường trực** | ~2.2k (thiếu tầng hành vi!) | ~3.6k | **~2.5k, đủ tầng hành vi** |

Kinh tế học hiện tại **đảo ngược ba lần**: cái hiếm-khi-cần thì luôn nạp (930
token luật Next.js trong phiên sửa migration/docs); cái luôn-cần thì 1 hop xa
(lệnh build/test); cái sống-còn-theo-task thì 2 hop + honor-system (RLS rules
khi viết migration: root → index → `supabase-security.md`, không cơ chế nào ép
nạp ngoài skill `supabase-migration` fire đúng lúc).

| Loại phiên | Nạp hiện tại (Claude Code) | Nạp chuẩn (target) |
|---|---|---|
| Docs / context | rules Next.js (vô ích) + skills metadata; **không có root** (F1) | root duy nhất |
| App code (app/, features/) | như trên + honor-system đọc `apps/web/AGENTS.md` (2 hop, dặn trong file không được nạp) | root + nested `apps/web` tự nạp khi chạm (shim) + rule Next.js fire theo `paths:` + skill fire theo description |
| Supabase migration | như docs — luật RLS 2 hop honor-system | root + rule path-scoped mới `paths: supabase/migrations/**` (pointer 5 dòng → `supabase-security.md`) + skill `supabase-migration` |
| Package (`packages/x`) | honor-system đọc nested | root + nested tự nạp khi chạm (shim) |

**Nguyên tắc hop đích:** mọi doc canonical cách root map **≤ 1 hop** (hiện 2
hop qua index — vi phạm tinh thần "1 cấp tham chiếu" của spec skills áp cho
tầng hành vi). Bảng điều hướng nằm trong root là cách duy nhất đạt 1 hop cho
mọi agent, mọi tool.

---

## 8. Khung `AGENTS.md` root mục tiêu (chưng cất template §4.2 + case studies)

Ngân sách: **≤150 dòng / ~1.2k token**. Thứ tự cố ý: an ninh trước, điều hướng
giữa, hợp đồng hành vi cuối (mô hình đọc-một-lần của model: đầu file được tuân
thủ tốt nhất).

| # | Mục | Nguồn pattern | Ghi chú nội dung |
|---|---|---|---|
| 1 | Title + 1 câu định danh | Temporal (persona tối giản) | "Next.js 16 + Supabase RLS-first monorepo (Bun/Turborepo)" — hết. |
| 2 | **Source-of-truth declaration** | Sentry dòng 1 | "AGENTS.md files are the source of truth… Do not duplicate guidance into tool rule files (`.claude/*` are generated/pointers)." |
| 3 | `<SECURITY_MANDATES>` P0 | riêng của repo (giữ nguyên) | 4 mandate như hiện tại. |
| 4 | Untrusted Content Policy | riêng của repo (giữ) | + 1 câu honor-system từ agent-behavior. |
| 5 | Priority Stack P0–P6 | riêng của repo (nén) | Giữ bảng, bỏ diễn giải thừa. |
| 6 | **Bản đồ điều hướng** | Sentry navigation table | "Đang sửa X → đọc Y" ≤10 hàng: `apps/web` → nested; `packages/<p>` → nested; `supabase/migrations` → `supabase-security.md`; UI/design → `design-system.md`; data/state → `data-fetching.md`; quy trình lặp → `.agents/skills/`; thuật ngữ → `domain-language.md`; ❌/✅ → `common-mistakes.md`. Nuốt vai trò của `docs/ai/index.md`. (Nếu giữ Mandatory-Skill: thêm cột "Skill bắt buộc" vào chính bảng này — Q6.) |
| 7 | **Lệnh cốt lõi** | template §4.2 + Factor 13 | `bun install` / `bun run dev` / thang gate 5 dòng (ai:check → typecheck → lint+test → build → ai:premerge) — bảng chi tiết vẫn ở doc gate nhưng thang tóm tắt nằm đây. |
| 8 | Kiến trúc & ranh giới (điều code không nói) | Airflow | ≤6 bullet, mỗi bullet 1 dòng + pointer: state-ownership; server-only seam; RLS; package graph. Không restate — chỉ định danh + nhà canonical. |
| 9 | Ranh giới hành vi **Always / Ask first / Never** | Cloudflare | Always: narrowest gate, update owning doc. Ask first: schema change, xoá file, đổi core dep. Never: "the P0 mandates above" (pointer, không chép lại). |
| 10 | Hợp đồng làm việc | Coder | Simplicity/surgical (giữ) + exception-stop + phản biện thẳng (cấm nịnh). |
| 11 | Quy ước ngôn ngữ | Airflow "Dag" | 1 dòng pointer → `domain-language.md`. |
| 12 | **PR & commit** | template §4.2 (hiện thiếu) | Conventional commits `type(scope): summary` — chốt từ git log thật (Q9); luật tách PR nếu có. |
| 13 | Definition of Done | riêng của repo (giữ) | 3 tiêu chí hiện tại. |

Những gì **rời khỏi** root khi viết lại: cảnh báo Next.js training-data + luật
React Compiler (→ `apps/web/AGENTS.md`); đoạn state-ownership đầy đủ (→ 1
bullet mục 8); mục Read Routing (→ bảng mục 6); tham chiếu
`docs/ai/index.md`/`agent-behavior.md` (giải thể theo §4).

---

## 9. Review tầng sâu — P2 canonical, skills, workflows, subagents, ADR

Tầng "rẻ" (nạp theo nhu cầu) nhưng là nơi mọi pointer đổ về — nếu canonical
sai/phình thì mọi tầng trên đều trỏ vào thông tin kém. Phán quyết từng file:

### 9.1. `docs/conventions/` (P2 — trái tim canonical)

| File | Dòng | Phán quyết |
|---|---|---|
| `supabase-security.md` | 47 | **MẪU CHUẨN** — đúng cỡ, mỗi luật kiểm chứng được, xứng đáng làm canonical cho cụm invariant #1/#2. Không sửa. |
| `data-fetching.md` | 49 | **TỐT trừ một khối** — dòng 15–32 chép ngữ nghĩa cache rule rồi trỏ ngược lại rule làm "canonical mechanics" (tâm cụm #4). Khi dời canonical Next.js: khối này thu về 3 dòng pointer. |
| `server-client-boundary.md` | 24 | **TỐT** — ngắn, đúng altitude, ủy quyền state cho `data-fetching.md` đúng cách. Mục "Next.js Route Props" nhập vào canonical Next.js mới khi dời. |
| `feature-module.md` | 115 | **TỐT** — firewall + 3 mô hình giao tiếp + mô tả cơ chế ESLint thật (vì sao 3 scope — lời giải cho override-trap là kiến thức code không tự nói). Giữ. |
| `testing.md` | 54 | **ĐẠT** — hơi loãng nhưng đúng vai. Giữ. |
| `transpile-packages.md` | 39 | **TỐT** — luật có điều kiện kiểm chứng ("only when a build error proves it") là right-altitude mẫu mực. Giữ. |
| `design-system.md` | 386 | **TÁCH 4 HƯỚNG** (F11): (1) hard rules + anti-slop + token tiers + decision tree ≤ ~120 dòng ở lại; (2) doctrine sâu (tier map, alpha matrix, delineation, WCAG-bridge) → `ui-styling/REFERENCE.md`; (3) narrative lịch sử ("earlier revision… removed") → ADR design-system hoặc xoá (git giữ); (4) "Extended glass token set" → xoá bản chép tay, thay bằng pointer tới file CSS **hoặc** khối auto-generated + sync gate theo mẫu `project-graph.md`. |

### 9.2. `docs/architecture/`

- `overview.md` (25): **ĐẠT** — overlap nhẹ với mục Project của root; khi viết
  lại root chỉ giữ 3 dòng layout + pointer về đây.
- `project-graph.md` (85): **MẪU CHUẨN cho "dữ liệu sống trong file tĩnh"** —
  khối auto-generated từ `workspace:*` edges + sync script + gate chống drift.
  Đây là cách hợp lệ duy nhất để giữ live-data trong context tĩnh; nhân rộng
  pattern này cho token list của design-system (F11-4).

### 9.3. `docs/ai/` còn lại + `quality-gates.md`

- `quality-gates.md` (29): nhà thứ **3** của gate ladder (cùng root DoD +
  `agent-command-policy`) — gộp vào nhà gate duy nhất khi root nhận thang gate
  (invariant #7).
- `common-mistakes.md`: giữ (✅ §3) nhưng đổi **bề mặt tham chiếu**: các nơi
  khác đang trỏ theo số mục ("#11") — số không ổn định khi thêm/xoá entry
  (F13); chuyển mọi tham chiếu sang rule id (`test-weakening`,
  `query-result-in-zustand`…), và cân nhắc bỏ đánh số mục.
- `golden-examples.md`: giữ; mục Watch Sync lặp 4 path trùng danh sách trong
  skill `watch-sync` — chấp nhận được (example ≠ rule) vì cả hai đều được gate
  path-check bảo vệ.

### 9.4. ADR (8 active)

| ADR | Phán quyết |
|---|---|
| 0002 (cache static rules) | **GIỮ** — đúng vai ADR mẫu mực: ghi rõ 2 rule regex làm được, 2 rule bỏ qua kèm lý do kỹ thuật. Vẫn chính xác. |
| 0003 (defer .mdc/permissions) | **SUPERSEDE/AMEND khi làm F3** — mô tả rules là "glob-scoped layer" mâu thuẫn hiện trạng always-load (F15). Phần defer permissions có thể giữ nguyên giá trị. |
| 0010, 0011, 0021, 0025 | **GIỮ NGUYÊN** — ADR sản phẩm (UI platform, watch-sync, catalog/DTCG, color pipeline), đúng vai, ngoài phạm vi đợt này. |
| 0022 (llms.txt) | **CHỜ Q2** — số phận gắn với quyết định llms.txt. |
| 0026 (LLM-judge eval) | **GIỮ** — gắn với Q3 (mức giữ behavioral eval). |
| `README.md` register + lifecycle | **GIỮ cơ chế** — register auto-sync là pattern tốt; freeze-policy được mở đúng thủ tục bằng chính bằng chứng F1 (Q3). |

### 9.5. Skills — phán quyết 17 file

Tổng thể: **đạt chuẩn agentskills tốt nhất trong toàn cây** — frontmatter đúng,
description có trigger clause, thân ≤170 dòng, Known Failure Modes từ debugging
thật, evals + templates. Vấn đề là các vệt phụ thuộc:

| Skill | Dòng | Ghi chú ngoài mức "đạt" |
|---|---|---|
| `codebase-design` | 97 | Sửa F13 (anchor #11→rule-id). Reuse-first ladder là nội dung giá trị cao. |
| `dependency-update` | 71 | Tiers + coupled-versions là delta thật; Notes ghi điều kiện hết hạn của Bun bug — right-altitude tốt. |
| `diagnosing-bugs` | 116 | **Sửa F12** (dòng hỏng CJK). Phụ thuộc index (F14). |
| `domain-modeling` | 52 | Phụ thuộc index (F14). |
| `feature-module` | 59 | Hub route sang 8 skill khác — đúng vai. |
| `grill-requirements` | 134 | One-question-at-a-time + fact-vs-decision là nội dung tốt; Pre-process phụ thuộc index (F14). |
| `react-hook-form` | 53 | Đạt. |
| `refactor-plan` | 170 | Dài nhất nhưng xứng đáng (expand–contract, fog-of-war, prefactor); templates tách sang `scripts/plan-templates.md` đúng progressive disclosure. Phụ thuộc index (F14). |
| `server-action` | 49 | Chép semantics `updateTag`/`revalidateTag` (cụm #4) — thu về pointer khi dời canonical. |
| `server-component-read` | 57 | Trỏ `.claude/rules/nextjs-cache-components.md` — đổi đích khi dời canonical (F2 ripple). |
| `supabase-migration` | 47 | Đạt — cặp chuẩn với `supabase-security.md`. |
| `tanstack-query-hook` | 43 | Đạt. |
| `testing-template` | 75 | ❌/✅ pair (getByRole vs find-props) đúng altitude. |
| `ui-styling` (+`REFERENCE.md` 187) | 88 | Cấu trúc đúng chuẩn (SKILL + REFERENCE tách); **nhận doctrine từ design-system** (F11-2) và khử lặp blur-ladder/tier hiện xuất hiện ở cả 2 file. |
| `watch-sync` | 74 | Đoạn mở đầu lặp nguyên ý "pure core unit-testable without React/player/network" 2 lần liên tiếp — nén. |
| `zod-validator` | 54 | Notes chống lỗi thời có điều kiện ("names the intended API, not a pin") — mẫu tốt. |
| `zustand-store` | 44 | Đạt. |

### 9.6. Workflows, subagents, hooks

- `review-gate.md`: **giá trị thật, sai hình thức** — chuyển thành skill
  (description: "Use before reporting done on any non-trivial diff…"), nội dung
  giữ nguyên (F5).
- `exec-plan.md`: giá trị trung bình — harness hiện đại có plan/task tools;
  nếu giữ, thành skill + **sửa mojibake**; nếu bỏ, phần Decision-Log
  template là thứ duy nhất đáng cứu (nhập vào `refactor-plan`).
- `skill-health-check.md`: **tách đôi** — bước 1–3 (structural gate,
  path-existence, evals schema) là việc của máy → nhập vào `ai:check` (đúng
  ranh giới enforcement, anti-pattern #6); bước 4–5 (description freshness +
  **upstream-standards checkpoint hàng quý**) là quy trình bảo trì con người
  đáng giữ — chính là "quy trình bảo trì" mà anti-pattern #10 đòi hỏi, đã chạy
  thật (MEMORY.md ghi checkpoint 2026-07-10).
- Subagents (`supabase-rls-reviewer`, `watch-sync-reviewer`): **MẪU TỐT** —
  read-only, tham chiếu skill + ADR thay vì chép, trả findings xếp hạng. Đúng
  chiến lược Isolate và đúng tinh thần "one exemplar, not a fleet of 19" trong
  ghi chú ADR. Giữ nguyên.
- Hooks (3): giữ cả 3 — re-anchor sau compaction (`context-drift-notice`) là
  hiện thân đúng của nguyên lý re-inject; Stop-gate fail-open hợp lý; format
  hook vô hại.

### 9.7. Rìa còn lại

- `docs/starter/rename-checklist.md`: tài liệu người dùng starter, không phải
  agent context — giữ ngoài manifest; cân nhắc xoá nếu repo không còn tự nhận
  là starter.
- `README.md` (97): mô tả repo là "reusable web app starter" trong khi toàn bộ
  context layer mô tả **sản phẩm Pumni Web OS** — lệch định danh người-vs-agent;
  ngoài phạm vi context layer nhưng nên đồng bộ một câu khi viết lại root.

---

## 10. Độ phủ khảo sát — xác nhận đủ dữ liệu cho plan

| Vùng | Trạng thái |
|---|---|
| Root (`AGENTS.md`, `CLAUDE.md`, `llms.txt`, `README`, `copilot-instructions`) | ✅ đọc toàn bộ, phán quyết theo khối |
| 10 nested `AGENTS.md` | ✅ đọc toàn bộ, phán quyết từng file |
| `.claude/rules/` (2) | ✅ đọc toàn bộ + xác minh frontmatter/globs |
| `docs/ai/` (8 file) | ✅ đọc toàn bộ |
| `docs/conventions/` (7 file) | ✅ đọc toàn bộ |
| `docs/architecture/` (2 file) | ✅ đọc toàn bộ |
| `docs/adr/` | ✅ README + 0002/0003/0022 đọc phần Decision; 4 ADR sản phẩm skim header (đủ cho phán quyết vai trò — nội dung của chúng ngoài phạm vi) |
| `.agents/skills/` 17 SKILL.md + README | ✅ đọc toàn bộ thân skill; templates/`evals.json` chưa mở từng file (cấu trúc đã được gate + README xác nhận — đủ cho phán quyết tầng, không đủ để audit chất lượng từng eval → việc của plan nếu cần) |
| `.agents/workflows/` (3) | ✅ đọc toàn bộ |
| `.claude/agents/` (2), hooks (3), settings | ✅ đọc toàn bộ (format-hook chỉ skim — vô hại) |
| Scripts enforcement | ✅ inventory đầy đủ + đọc kỹ: 2 hook, `check-context-drift.mjs`, `run-ai-evals.mjs`, `review-gate-rules.mjs` (22 rule id + severity/fix), **`ai-context.manifest.json`** (F17), **`context-map.json`** (F16), `ai-review-rule-allowlist.json`, `ai-metrics.json` (+ diff working-tree: regen sau ADR-0026, chưa commit); **chưa** đọc từng dòng `check-ai-context.mjs` 906 dòng và self-test 1.254 dòng — đủ cho phán quyết kiến trúc (F9), thiết kế lại từng check thuộc plan |
| Behavioral evals | ✅ 9 golden-tasks điểm danh + đọc mẫu `01-rls-bypass.md` (frontmatter + rubric); `last-run.json` là run-artifact |
| CI / enforcement ngoài repo-tree | ✅ `ci.yml` (fallow + ai:check mỗi push/PR), **`docs-health.yml`** (cron tuần: ai:check + ai:eval + metrics artifact + Lychee), `.fallowrc.jsonc` (AI scripts khai là entry points) |
| Tool configs khác | ✅ `.vscode/settings.json` (codeActions vô hại, không phải context), không tồn tại: `.cursor/`, `.gemini/`, `.aider.conf.yml`, `GEMINI.md`, `CODEX.md`, `CLAUDE.local.md`, `~/.claude/CLAUDE.md` |
| README tầng người (`README.md`, `apps/*/README.md`) | ✅ skim — identity drift "starter" vs sản phẩm (§9.7) lặp lại ở `apps/web/README.md` |
| `docs/plans/` | ⛔ loại trừ theo yêu cầu (chỉ đếm/điểm danh cho F9) |

**Kết luận: dữ liệu ĐỦ và độ phủ đã khép kín** — mọi bề mặt context (kể cả
scripts, manifest, CI, golden-tasks, tool configs) đã được kiểm kê và có phán
quyết. Hai vùng duy nhất chỉ đọc mức kiến trúc là nội bộ 2 file gate lớn
(906 + 1.254 dòng) và 16/17 bộ `evals.json` — cả hai thuộc phạm vi *execution*,
không chặn việc *lập kế hoạch*.

---

## 11. Điểm quyết định cho bản kế hoạch (chưa chốt)

1. **Ngân sách token thường trực** cho Claude Code sau refactor: đề xuất trần
   ~2.5k token tổng (root ≤1.2k + skill metadata ~1.3k; rules path-scoped về 0
   thường trực) — xem bảng §7.
2. **Số phận llms.txt**: xoá (repo không có docs site — đúng spec) vs giữ làm
   artefact sinh tự động (giữ lời hứa ADR-0022 với agent ngoài). Cần supersede
   ADR-0022 dù chọn hướng nào.
3. **Mức giữ bộ máy meta**: giữ `ai:check` + review-gate (giá trị đã chứng
   minh) — nhưng cắt bao nhiêu trong metrics/self-test/behavioral-eval? Lưu ý
   freeze-policy trong `docs/adr/README.md` yêu cầu trích `ai:metrics` làm bằng
   chứng — đợt rewrite này chính là "measured regression" (F1 là bằng chứng
   gate không canh được lỗi nạp nghiêm trọng nhất).
4. **`docs/ai/` còn lại gì**: hướng hội tụ là `docs/ai/` chỉ còn
   `domain-language`, `common-mistakes`, `golden-examples`, `mcp`, `MEMORY` —
   index/behavior/command-policy tan vào AGENTS.md + conventions.
5. **Có theo `agents.toml` (dotagents) không**: hiện sync scripts tự chế đã làm
   đúng vai; chỉ đổi nếu thêm tool thứ ba trở lên.
6. **Bảng Mandatory Skill Invocations**: bỏ hẳn (tin description-firing) / nén
   thành cột trong bảng điều hướng (khuyến nghị) / giữ nguyên bảng riêng. Chi
   phí ~17 dòng thường trực đổi lấy determinism quy trình.
7. **`packages/features` placeholder**: xoá package + AGENTS.md của nó, hay giữ
   với file thu còn ~5 dòng.
8. **Rule path-scoped thứ ba cho Supabase**: thêm
   `.claude/rules/supabase-migrations.md` (`paths: supabase/migrations/**`,
   ~5 dòng pointer → `supabase-security.md`) để luật RLS tự nạp khi chạm
   migration thay vì honor-system 2 hop — hay coi skill + hook + reviewer
   subagent là đủ.
9. **Chốt quy ước PR/commit** để đưa vào root (mục 12, §8): xác nhận format
   conventional-commit + scope list thật từ git log trước khi viết thành luật.
10. **Nested CLAUDE.md shims**: sinh cho toàn bộ 10 thư mục có AGENTS.md hay
    chỉ 3 nơi nóng (`apps/web`, `packages/ui`, `packages/supabase`)? Trade-off:
    10 file shim 1 dòng (sinh tự động, gate-checked) vs độ phủ "closest wins".
11. **Số phận `exec-plan.md`**: bỏ hẳn (harness có plan/task tools; Decision-Log
    template nhập vào `refactor-plan`) vs chuyển thành skill. `review-gate` thì
    đã rõ hướng (→ skill); exec-plan là ca mờ hơn.
12. **Nhà canonical Next.js 16** (F2): file mới
    `docs/conventions/nextjs-16.md` vs nhập thẳng vào `apps/web/AGENTS.md`.
    Tiêu chí: nếu nhập nested mà file vượt ~120 dòng thì tách file riêng, nested
    giữ pointer.
13. **Hướng single-source cho điều hướng** (F16): bảng điều hướng trong root là
    nguồn, `context-map.json` sinh ra từ nó (script sync mới) — hay ngược lại
    (context-map là nguồn máy-đọc, bảng root sinh bằng sync như ADR-register)?
    Khuyến nghị: context-map làm nguồn (đã máy-đọc, đã có consumer là drift
    hook), bảng root là khối auto-generated theo mẫu `project-graph.md`.
