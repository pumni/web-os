# Kiến trúc Context Layer cho dự án đa agent — Nghiên cứu độc lập & Blueprint chuẩn (07/2026)

> Tài liệu nghiên cứu độc lập, tổng hợp từ nguồn gốc chính thức (spec, repo, tài liệu kỹ thuật của Anthropic, OpenAI, Linux Foundation, GitHub, LangChain, HumanLayer, Sentry, Apache, Cloudflare, Coder, Temporal) — **không** tham chiếu hay dựa trên hệ thống context hiện có của dự án này. Mọi khẳng định đều được fetch trực tiếp từ nguồn trong tháng 7/2026. Danh mục nguồn đầy đủ ở cuối tài liệu.

---

## 1. Tóm tắt điều hành

Tính đến 7/2026, việc xây dựng "context layer" cho dự án phần mềm dùng nhiều coding agent (Claude Code, Codex CLI, Cursor, Copilot, Gemini CLI…) đã hội tụ về một kiến trúc chuẩn gồm **4 chuẩn mở + 1 tầng vận hành**:

| Tầng | Chuẩn/Cơ chế | Vai trò | Trạng thái chuẩn hoá |
|---|---|---|---|
| Hành vi (behavior) | **AGENTS.md** | "README cho agent" — luật, lệnh, quy ước, nạp mỗi phiên | Chuẩn mở, Agentic AI Foundation (Linux Foundation), 30+ tool, 60.000+ repo |
| Quy trình (procedure) | **Agent Skills** (`SKILL.md`) | Gói kỹ năng nạp theo tác vụ, progressive disclosure | Spec mở agentskills.io (Anthropic khởi xướng) |
| Dữ liệu/công cụ (data & tools) | **MCP** | Giao thức agent truy cập dữ liệu, tool, prompt ngoài | Spec 2025-11-25, Linux Foundation, JSON-RPC 2.0 |
| Tài liệu web (docs) | **llms.txt** | Bản đồ tài liệu curated cho LLM ở cấp website | Đề xuất AnswerDotAI, hệ sinh thái plugin rộng |
| Vận hành (workflow) | Research → Plan → Implement, intentional compaction, sub-agent, memory | Cách con người + agent dùng các tầng trên | Best practice (Anthropic, HumanLayer, GitHub spec-kit) |

Nguyên tắc xuyên suốt: **một nguồn sự thật (single source of truth) độc lập với tool, các tool-adapter chỉ là lớp mỏng ở rìa**; và **context là tài nguyên hữu hạn — mục tiêu là tập token tín-hiệu-cao nhỏ nhất đủ tạo ra kết quả mong muốn**.

---

## 2. Nguyên lý nền tảng: Context Engineering

### 2.1. Context là tài nguyên hữu hạn, không phải kho chứa

Theo tài liệu kỹ thuật của Anthropic (*Effective context engineering for AI agents*):

- **Context rot**: khi số token trong context tăng, khả năng recall chính xác của model giảm — "một gradient suy giảm, không phải vách đá" (performance gradient rather than a hard cliff).
- **Attention budget**: kiến trúc transformer tạo quan hệ n² giữa các cặp token; mỗi token mới đều tiêu hao "ngân sách chú ý". Model được huấn luyện chủ yếu trên chuỗi ngắn nên yếu hơn với phụ thuộc trải dài toàn context.
- Hệ quả thiết kế: **"tìm tập token tín-hiệu-cao nhỏ nhất tối đa hoá xác suất đạt kết quả mong muốn"** — đây là tiêu chí đánh giá mọi quyết định về context layer.

HumanLayer (ACE-FCA) bổ sung công thức chất lượng context, xếp theo mức độ tàn phá:

1. **Thông tin sai** — làm hỏng mọi quyết định phía sau (tệ nhất);
2. **Thiếu thông tin** — tạo lỗ hổng phải làm lại;
3. **Nhiễu** — lãng phí token nhưng ít hại hơn sai.

Tức là: `chất lượng context ∝ (độ đúng × độ đủ) ÷ kích thước`. Một context layer lỗi thời (sai) còn tệ hơn không có context layer.

### 2.2. Bốn chiến lược kinh điển (LangChain): Write / Select / Compress / Isolate

Repo chính thức `langchain-ai/context_engineering` định hình 4 chiến lược mà mọi kiến trúc context layer nên ánh xạ vào:

| Chiến lược | Định nghĩa | Hiện thân trong context layer dự án |
|---|---|---|
| **Write** | Ghi thông tin ra ngoài context window để tồn tại qua các bước/phiên | AGENTS.md, memory files, research/plan documents, scratchpad |
| **Select** | Chỉ kéo vào context đúng thứ cần, đúng lúc | Nested AGENTS.md ("file gần nhất thắng"), path-scoped rules, skill activation theo description, MCP resources |
| **Compress** | Giữ lại tối thiểu token cần thiết | Compaction, tóm tắt tool output, giới hạn độ dài file chỉ dẫn |
| **Isolate** | Chia context ra nhiều "ngăn" để tránh nhiễm bẩn | Sub-agents với context window riêng, sandbox, tách skill khỏi file luật chung |

### 2.3. 12-Factor Agents — hai factor trực tiếp chi phối context layer

Từ `humanlayer/12-factor-agents`:

- **Factor 3 — Own your context window**: chủ động quyết định cái gì vào context, không phó mặc cho framework/tool tự nhặt. Context layer của repo chính là cách "own" phần context tĩnh của dự án.
- **Factor 13 (appendix) — Pre-fetch all the context you might need**: những gì chắc chắn cần (lệnh build/test, quy ước đặt tên, ranh giới kiến trúc) thì đưa sẵn vào tầng nạp-mỗi-phiên; đừng để agent phải tự khám phá lại mỗi lần.

Hai factor này tạo thế cân bằng với nguyên lý **just-in-time** của Anthropic (mục 2.4): cái *luôn cần* thì pre-fetch (AGENTS.md); cái *thỉnh thoảng cần* thì để agent tự kéo khi cần (skills, references, MCP).

### 2.4. Progressive disclosure & Just-in-time — nguyên lý thống nhất toàn kiến trúc

Anthropic đối chiếu hai chiến lược cung cấp context:

- **Pre-computed**: nhét sẵn mọi thứ (kiểu RAG truyền thống) — nhanh nhưng phình context, dễ nhiễu.
- **Just-in-time**: agent giữ **định danh nhẹ** (đường dẫn file, tên skill, query) và tự load dữ liệu lúc runtime — giống con người dùng hệ thống file/bookmark thay vì thuộc lòng cả kho. Metadata (tên thư mục, naming convention, timestamp) tự nó đã là tín hiệu hành vi.

Chuẩn Agent Skills chuẩn hoá nguyên lý này thành **3 mức nạp**:

1. **Metadata** (~100 token): chỉ `name` + `description` của mọi skill nạp lúc khởi động;
2. **Instructions** (khuyến nghị < 5.000 token): toàn bộ thân `SKILL.md` nạp khi skill được kích hoạt;
3. **Resources** (theo nhu cầu): `scripts/`, `references/`, `assets/` chỉ load khi thật sự dùng.

**Đây là mô hình tư duy đúng cho toàn bộ context layer**: tầng nào cũng nên có "mục lục rẻ" nạp thường trực và "nội dung đắt" nạp theo yêu cầu.

### 2.5. "Right altitude" — độ cao đúng của chỉ dẫn

Chỉ dẫn cho agent thất bại theo hai hướng:

- **Quá cụ thể (brittle hardcoding)**: nhồi logic if-else vào văn bản → giòn, khó bảo trì, nhanh lỗi thời (→ vi phạm "thông tin sai là tệ nhất");
- **Quá mơ hồ**: "format code properly" — không có tín hiệu hành động, giả định sai rằng model chia sẻ ngữ cảnh ngầm với người viết.

Vùng tối ưu: **cụ thể đủ để kiểm chứng được, linh hoạt đủ để làm heuristic mạnh**. Tài liệu Claude Code minh hoạ: "Use 2-space indentation" thay vì "Format code properly"; "Run `npm test` before committing" thay vì "Test your changes". Bắt đầu tối thiểu, chỉ thêm luật khi quan sát thấy failure mode thực tế — "minimal không đồng nghĩa với ngắn".

---

## 3. Bốn chuẩn mở của stack — chi tiết spec (hiện trạng 7/2026)

### 3.1. AGENTS.md — tầng hành vi, chuẩn chung mọi agent

Nguồn: agents.md (Agentic AI Foundation / Linux Foundation), repo `agentsmd/agents.md`.

- **Định nghĩa**: "a README for agents — a dedicated, predictable place to provide context and instructions to help AI coding agents work on your project". Bổ trợ README.md (cho người), chứa những thứ "clutter" với người nhưng thiết yếu với agent: lệnh build/test, quy ước, ranh giới.
- **Format**: Markdown thuần, **không có trường bắt buộc** — "use any headings you like; the agent simply parses the text you provide".
- **Quy tắc ưu tiên (precedence)**:
  1. Prompt trực tiếp của người dùng thắng tất cả;
  2. **File AGENTS.md gần nhất trong cây thư mục thắng** — monorepo đặt AGENTS.md lồng nhau ở từng sub-project, "the closest one takes precedence and every subproject can ship tailored instructions".
- **Hệ sinh thái**: 60.000+ repo dùng; hỗ trợ bởi Codex, Jules, Gemini CLI, Devin, Windsurf, Junie, Copilot Coding Agent, Aider, goose, opencode, Zed, Warp, VS Code, Factory, Amp, Cursor, RooCode… Ra đời từ hợp tác OpenAI–Amp–Google–Cursor–Factory, nay do Agentic AI Foundation quản trị.
- **Lệnh kiểm tra tự chạy**: nếu liệt kê lệnh test/lint trong AGENTS.md, agent hỗ trợ chuẩn này "will attempt to execute relevant programmatic checks and fix failures before finishing the task".
- **Di trú từ file cũ**: đổi tên file chỉ dẫn cũ thành AGENTS.md và tạo symlink ngược cho tương thích.
- **Triết lý bảo trì**: "Treat AGENTS.md as living documentation" — sửa bất cứ lúc nào, review như code.

**Điểm quan trọng cho đa agent**: Claude Code đọc `CLAUDE.md`, không tự đọc `AGENTS.md`. Tài liệu chính thức của Claude Code khuyến nghị hai cách hợp nhất (chi tiết mục 5.2): `CLAUDE.md` chỉ chứa một dòng import `@AGENTS.md` (có thể kèm phần chỉ dẫn riêng cho Claude phía dưới), hoặc symlink `CLAUDE.md → AGENTS.md`. Với Gemini CLI: `.gemini/settings.json` → `{ "context": { "fileName": "AGENTS.md" } }`. Với Aider: `.aider.conf.yml` → `read: AGENTS.md`.

### 3.2. Agent Skills — tầng quy trình, nạp theo tác vụ

Nguồn: spec đầy đủ tại agentskills.io/specification, repo `agentskills/agentskills`, ví dụ thực tế `anthropics/skills`.

**Cấu trúc thư mục** (tối thiểu chỉ cần `SKILL.md`):

```
skill-name/
├── SKILL.md          # Bắt buộc: metadata + chỉ dẫn
├── scripts/          # Tuỳ chọn: code chạy được
├── references/       # Tuỳ chọn: tài liệu đọc thêm theo nhu cầu
└── assets/           # Tuỳ chọn: template, schema, dữ liệu tĩnh
```

**Frontmatter YAML** (spec chính xác):

| Trường | Bắt buộc | Ràng buộc |
|---|---|---|
| `name` | Có | ≤ 64 ký tự; chỉ `a-z`, `0-9`, `-`; không bắt đầu/kết thúc bằng `-`; không `--`; **phải trùng tên thư mục cha** |
| `description` | Có | 1–1024 ký tự; mô tả **cả** skill làm gì **và** khi nào dùng, kèm từ khoá giúp agent nhận diện tác vụ |
| `license` | Không | Tên license hoặc trỏ file license đi kèm |
| `compatibility` | Không | ≤ 500 ký tự; chỉ khai khi có yêu cầu môi trường đặc thù (đa số skill không cần) |
| `metadata` | Không | Map key-value tự do (author, version…) |
| `allowed-tools` | Không | Chuỗi tool pre-approved, cách nhau bằng dấu cách — *experimental*, hỗ trợ khác nhau giữa các agent |

Ví dụ `description` tốt vs kém (nguyên văn spec):

> Tốt: "Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction."
> Kém: "Helps with PDFs."

**Ràng buộc kích thước & tham chiếu**:

- Thân `SKILL.md` khuyến nghị **< 5.000 token, < 500 dòng**; nội dung chi tiết tách sang `references/` (mỗi file một chủ đề, nhỏ, vì "agents load these on demand, so smaller files mean less use of context").
- Tham chiếu file bằng đường dẫn tương đối từ gốc skill; **giữ tham chiếu tối đa 1 cấp sâu** từ SKILL.md, tránh chuỗi tham chiếu lồng nhau.
- Validate bằng thư viện chuẩn: `skills-ref validate ./my-skill`.

**Phân biệt vai trò với AGENTS.md** (bài học từ Sentry, mục 6.1): AGENTS.md = *kiến thức tĩnh luôn đúng* (kiến trúc, quy ước, lệnh); Skills = *quy trình lặp lại được, chỉ cần khi làm đúng loại việc đó* (commit, review, tạo migration…).

### 3.3. MCP — tầng dữ liệu & công cụ

Nguồn: spec chính thức modelcontextprotocol.io (bản hiện hành dựa schema **2025-11-25**), repos `modelcontextprotocol/*`.

- **Bản chất**: giao thức mở trên JSON-RPC 2.0, stateful, có capability negotiation; lấy cảm hứng từ Language Server Protocol — chuẩn hoá cách "cắm" context và tool vào mọi ứng dụng AI.
- **Ba vai**: **Host** (ứng dụng LLM khởi tạo kết nối) → **Client** (connector trong host) → **Server** (dịch vụ cung cấp context/khả năng).
- **Server cung cấp 3 primitive**:
  - **Resources**: context và dữ liệu (cho người hoặc model dùng);
  - **Prompts**: template thông điệp/workflow cho người dùng;
  - **Tools**: hàm cho model thực thi.
- **Client cung cấp**: **Sampling** (server yêu cầu LLM suy luận đệ quy), **Roots** (ranh giới filesystem/URI được phép), **Elicitation** (hỏi thêm người dùng).
- **Reference servers** đang duy trì: Everything, **Fetch** (lấy web cho LLM), **Filesystem** (thao tác file có kiểm soát truy cập), **Git**, **Memory** (bộ nhớ dạng knowledge graph), Sequential Thinking, Time. Lưu ý: 13 server cũ (GitHub, GitLab, Postgres, Slack…) đã **archived** — hệ sinh thái chuyển sang server do chính vendor duy trì.
- **An toàn** (nguyên tắc spec): user consent & control cho mọi truy cập dữ liệu/tool; tool description từ server lạ phải coi là **untrusted**; host phải xin phép trước khi gọi tool.
- SDK chính thức 10 ngôn ngữ; TypeScript SDK: `McpServer` + `registerTool()/resource/prompt`, transport `stdio` và `Streamable HTTP`, có OAuth helpers.

**Vai trò trong context layer**: MCP là lớp *runtime* — cho agent đọc dữ liệu sống (DB schema, ticket, dashboard) thay vì chép dữ liệu đó vào file tĩnh (nơi nó sẽ lỗi thời và trở thành "thông tin sai"). Quy tắc: **cái gì thay đổi thường xuyên → MCP; cái gì ổn định → file tĩnh**.

### 3.4. llms.txt — tầng tài liệu web

Nguồn: llmstxt.org, `AnswerDotAI/llms-txt`.

- File `/llms.txt` ở gốc website: bản đồ tài liệu **curated** cho LLM dùng lúc inference (không phải cho crawler huấn luyện — khác hẳn robots.txt/sitemap.xml).
- Format bắt buộc theo thứ tự: **H1** (tên dự án — phần bắt buộc duy nhất) → blockquote tóm tắt → các đoạn tự do → các mục **H2** chứa danh sách link `[tên](url): ghi chú` → mục đặc biệt **`## Optional`** cho nội dung thứ cấp có thể bỏ khi context ngắn.
- Kèm bản `.md` cho từng trang tài liệu (thêm hậu tố `.md` vào URL); tooling `llms_txt2ctx` sinh file context tổng hợp.
- Liên quan dự án phần mềm: nếu dự án xuất bản docs site/SDK公開, cung cấp llms.txt giúp *agent của người khác* (và chính agent của bạn khi fetch docs) đọc tài liệu hiệu quả. Các trang spec lớn (modelcontextprotocol.io, agentskills.io, code.claude.com) đều đã tự cung cấp `llms.txt`.

---

## 4. Kiến trúc mẫu: mô hình 5 tầng cho repo đa agent

Tổng hợp toàn bộ nguồn ở trên, kiến trúc chuẩn mực 7/2026 cho một repo dùng nhiều agent như sau. Nguyên tắc tổ chức: **mỗi mẩu thông tin có đúng một nhà; tầng càng thấp càng đắt (nạp mỗi phiên), tầng càng cao càng rẻ (nạp theo nhu cầu)**.

```
Tầng 0 — HÀNH VI, nạp mỗi phiên (đắt nhất, phải nhỏ nhất)
│   AGENTS.md (root, ngắn: bản đồ + luật bất biến + lệnh cốt lõi)
│   AGENTS.md lồng theo khu vực (backend/, frontend/, tests/…) — "gần nhất thắng"
│
Tầng 1 — LUẬT THEO NGỮ CẢNH, nạp khi chạm file khớp pattern
│   Rules path-scoped (cơ chế tuỳ tool; nội dung canonical đặt ở docs/, rule chỉ trỏ tới)
│
Tầng 2 — QUY TRÌNH, nạp khi làm đúng loại việc
│   .agents/skills/<name>/SKILL.md (+ references/, scripts/, assets/)
│   → metadata thường trực ~100 token/skill; thân chỉ nạp khi kích hoạt
│
Tầng 3 — DỮ LIỆU & CÔNG CỤ SỐNG, truy vấn lúc runtime
│   MCP servers (khai báo tập trung, phân phối ra config từng tool)
│
Tầng 4 — TRÍ NHỚ & SẢN PHẨM TRUNG GIAN, ghi/đọc qua phiên
    Memory của agent (tự tích luỹ), research/plan documents, ADR
```

### 4.1. Blueprint thư mục cụ thể

```
repo/
├── AGENTS.md                     # Nguồn sự thật hành vi, ≤ ~150 dòng
├── CLAUDE.md                     # CHỈ 1 dòng: @AGENTS.md (+ phần riêng Claude nếu cần)
├── backend/AGENTS.md             # Luật riêng backend (nested, gần nhất thắng)
├── frontend/AGENTS.md            # Luật riêng frontend
├── tests/AGENTS.md               # Quy ước test
│
├── .agents/                      # Lớp context độc lập tool (pattern Sentry dotagents)
│   ├── agents.toml               # Khai báo tập trung: skills, MCP servers, hooks, subagents
│   └── skills/
│       ├── commit/SKILL.md
│       ├── code-review/SKILL.md
│       └── db-migration/
│           ├── SKILL.md
│           ├── references/rls-patterns.md
│           └── scripts/validate.sh
│
├── docs/
│   ├── architecture/…            # Kiến thức sâu, agent đọc theo link từ AGENTS.md
│   └── adr/…                     # Quyết định kiến trúc — "why" mà code không nói được
│
└── (config từng tool = artefact sinh ra/symlink, không phải nguồn sự thật)
    ├── .claude/   .cursor/   .codex/   .gemini/   .vscode/  …
```

### 4.2. Nội dung AGENTS.md root — template chưng cất từ các case study tốt nhất

```markdown
# <Tên dự án> — Agent Guide

<!-- Tuyên bố nguồn sự thật (pattern Sentry) -->
AGENTS.md files are the source of truth for AI agent instructions.
Do not duplicate guidance into tool-specific rule files.

## Bản đồ điều hướng (pattern Sentry — bảng trỏ file gần nhất)
| Bạn đang sửa | Đọc thêm |
|---|---|
| Backend | backend/AGENTS.md |
| Frontend | frontend/AGENTS.md |
| Tests | tests/AGENTS.md |
| Quy trình lặp lại (commit, review, migration) | .agents/skills/ |

## Lệnh cốt lõi (kiểm chứng được — right altitude)
- Cài đặt: <lệnh>
- Test nhanh (ưu tiên selective): <lệnh>
- Lint/format một cửa: <lệnh>

## Kiến trúc & ranh giới (điều code không tự nói — pattern Airflow)
- <Thành phần A> không bao giờ truy cập trực tiếp <tài nguyên B>; phải qua <API C>.
- Phân biệt: vi phạm mô hình = lỗ hổng thật; hạn chế đã ghi nhận = known limitation.

## Ranh giới hành vi (pattern Cloudflare: Always / Ask first / Never)
- Always: <việc luôn làm>
- Ask first: <việc phải hỏi trước — xoá/tái cấu trúc lớn, ngoại lệ với luật>
- Never: <việc cấm — hardcode secret, đưa dữ liệu khách hàng vào git history>

## Quy ước ngôn ngữ & domain (pattern Airflow "Dag")
- <Thuật ngữ>: viết thế nào trong văn xuôi vs trong code token.

## PR & commit
- <Format tiêu đề, quy tắc tách PR — ví dụ Sentry: FE/BE deploy độc lập → tách PR, backend land trước>
```

Những mục **không** đưa vào AGENTS.md root: hướng dẫn dài từng bước (→ skill), luật chỉ áp cho một loại file (→ nested AGENTS.md hoặc rule path-scoped), kiến thức nền dài (→ `docs/` + link), dữ liệu thay đổi liên tục (→ MCP).

### 4.3. Bảng quyết định "thông tin này đặt ở đâu"

| Loại thông tin | Đặt ở | Vì sao |
|---|---|---|
| Lệnh build/test/lint, luật bất biến toàn repo | `AGENTS.md` root | Luôn cần → pre-fetch (Factor 13); phải trả phí token mỗi phiên nên giữ ngắn |
| Quy ước riêng một khu vực code | `<khu-vực>/AGENTS.md` | "Closest wins" — chỉ nạp khi làm việc trong khu vực đó (Select) |
| Luật gắn với pattern file (vd `**/*.sql`) | Rule path-scoped của tool, **nội dung canonical trong docs** | Lazy-load; giữ portable bằng cách rule chỉ trỏ về nguồn chung |
| Quy trình nhiều bước, lặp lại (commit, review, scaffold, migration) | Skill (`SKILL.md`) | Progressive disclosure — chỉ tốn ~100 token metadata khi không dùng |
| Kiến thức nền, thiết kế sâu, ADR | `docs/` + link từ AGENTS.md | Agent đọc just-in-time theo định danh nhẹ (đường dẫn) |
| Dữ liệu sống: schema DB, ticket, log, dashboard | MCP server | Tránh chép dữ liệu sẽ lỗi thời vào file tĩnh (thông tin sai = tệ nhất) |
| Bài học agent tự rút ra qua phiên làm việc | Memory của agent (vd auto memory: `MEMORY.md` index + topic files) | Write strategy; con người audit được vì là markdown thuần |
| Trạng thái một feature đang làm | `specs/<feature>/` (spec.md, plan.md, tasks.md — pattern spec-kit) hoặc research/plan docs | Sản phẩm compaction có chủ đích, sống theo feature rồi archive |
| Sở thích cá nhân dev | File local gitignored (vd `CLAUDE.local.md`) / config user-level | Không ép cả team trả token cho preference cá nhân |

### 4.4. Quản lý đa tool tập trung — pattern `dotagents`

Vấn đề thực tế: mỗi tool có thư mục config riêng (`.claude/`, `.cursor/`, `.codex/`, `.vscode/`, `.opencode/`) → nguy cơ **phân mảnh context** (mỗi tool một bản luật, trôi dạt dần). Sentry giải bằng `getsentry/dotagents`:

- **`agents.toml` là nguồn khai báo duy nhất** cho skills, MCP servers, hooks, subagents;
- Skills đặt tại `.agents/skills/`, **symlink** vào thư mục của từng agent;
- MCP server khai một lần → ghi ra file config MCP của từng tool;
- Subagent định nghĩa portable bằng Markdown + YAML frontmatter;
- Dev mới clone repo chỉ chạy `dotagents install`.

Kể cả không dùng đúng tool này, **nguyên tắc** cần giữ: *thư mục config của từng agent là artefact được sinh ra/symlink, không bao giờ là nơi soạn nội dung*. Sentry ghi thẳng vào đầu AGENTS.md: "Do not add to CLAUDE.md or Cursor rules".

---

## 5. Tương thích đa agent — cách từng tool tiêu thụ context layer (7/2026)

### 5.1. Ma trận

| Tool | Cách đọc tầng hành vi | Ghi chú |
|---|---|---|
| **Codex CLI** | Đọc `AGENTS.md` native (chuẩn khởi phát từ đây) | Hỗ trợ nested |
| **Claude Code** | Đọc `CLAUDE.md`; hợp nhất bằng import `@AGENTS.md` hoặc symlink | Chi tiết 5.2 |
| Gemini CLI | `.gemini/settings.json`: `{"context": {"fileName": "AGENTS.md"}}` | |
| Aider | `.aider.conf.yml`: `read: AGENTS.md` | |
| Cursor, Copilot, Devin, Windsurf, Zed, Warp, Amp, goose, opencode, Jules, Junie… | Hỗ trợ AGENTS.md (danh sách chính thức tại agents.md) | 30+ tool |

### 5.2. Chi tiết cơ chế Claude Code (đại diện cho tool có hệ context riêng phong phú)

Theo tài liệu chính thức code.claude.com (7/2026):

- **Thứ tự nạp CLAUDE.md**: managed policy (org) → user (`~/.claude/CLAUDE.md`) → project (`./CLAUDE.md` hoặc `./.claude/CLAUDE.md`) → `CLAUDE.local.md` (gitignored). Đi **từ gốc filesystem xuống working directory, nối tiếp nhau chứ không ghi đè** — file gần nơi làm việc được đọc sau cùng.
- **CLAUDE.md trong thư mục con**: không nạp lúc khởi động, chỉ nạp khi agent đọc file trong thư mục đó — đúng tinh thần "closest wins" + lazy load của AGENTS.md nested.
- **Hợp nhất với AGENTS.md** (khuyến nghị chính thức): `CLAUDE.md` chứa `@AGENTS.md` (import, tối đa 4 cấp đệ quy) rồi thêm phần riêng cho Claude nếu cần; hoặc symlink. Trên Windows, dùng import thay symlink (symlink cần quyền admin).
- **Khuyến nghị kích thước**: **< 200 dòng/file**; file dài giảm adherence. Lưu ý quan trọng: tách bằng `@import` giúp *tổ chức* chứ **không giảm context** — file import vẫn nạp lúc khởi động; muốn giảm thật phải dùng rule path-scoped hoặc skill.
- **Rules** (`.claude/rules/*.md`): mỗi file một chủ đề; có `paths:` frontmatter (glob) thì chỉ nạp khi agent chạm file khớp; không có thì nạp mỗi phiên như CLAUDE.md. Hỗ trợ symlink để chia sẻ rules giữa các repo.
- **Phân định context vs enforcement**: CLAUDE.md/AGENTS.md là *ngữ cảnh, không phải cấu hình cưỡng chế* — "Claude treats them as context, not enforced configuration". Muốn **chặn cứng** một hành động (cấm lệnh, cấm path) phải dùng hooks/permission settings của tool, không phải văn bản. Đây là ranh giới thiết kế quan trọng: *luật mềm → context layer; luật cứng → cơ chế enforcement của từng tool*.
- **Auto memory**: agent tự ghi bài học vào `MEMORY.md` (index, nạp 200 dòng đầu mỗi phiên) + topic files (đọc theo nhu cầu) — hiện thân của "structured note-taking". Con người audit/sửa được vì là markdown thuần.
- **Compaction**: sau `/compact`, CLAUDE.md gốc project được re-inject tự động; file nested chỉ nạp lại khi chạm thư mục. Nghĩa là chỉ dẫn quan trọng phải nằm trong file, đừng chỉ nói trong hội thoại.

### 5.3. Hệ quả thiết kế cho tính di động (portability)

1. **Soạn mọi nội dung ở lớp trung lập** (AGENTS.md, `.agents/skills/`, docs) — lớp tool chỉ là import/symlink/config trỏ về.
2. **Không dựa vào tính năng chỉ một tool có** cho nội dung cốt lõi (vd đừng giấu luật quan trọng trong rule path-scoped của riêng Claude — hãy đặt bản canonical trong nested AGENTS.md/docs, rule chỉ là tối ưu nạp cho tool hỗ trợ).
3. **Skill viết theo spec agentskills.io thuần** (frontmatter tối thiểu `name` + `description`) để mọi agent hỗ trợ spec đọc được; trường `allowed-tools` là experimental, không được phụ thuộc.

---

## 6. Case studies — bài học đã kiểm chứng từ repo thật

### 6.1. Sentry — case study mẫu mực nhất về "một lớp context, nhiều agent"

(Django + React quy mô lớn; đã fetch trực tiếp `AGENTS.md` root và `static/AGENTS.md`.)

- **Chống phân mảnh chủ động**, dòng đầu tiên: *"AGENTS.md files are the source of truth for AI agent instructions. Always update the relevant AGENTS.md file when adding or modifying agent guidance"* — cấm chép luật vào editor-specific rules.
- **Bảng điều hướng** root → nested: backend → `src/AGENTS.md`, tests → `tests/AGENTS.md`, frontend → `static/AGENTS.md`, quy trình → `.agents/skills/`.
- **Nested file chứa luật thao tác được ngay**, đúng "right altitude": "NO new Reflux stores", "NO class components", "`staleTime` is required", "NEVER Pass Call-Site Generics", thứ tự ưu tiên query trong test (`getByRole` → `getByLabelText` → `getByText` → `getByTestId`).
- **Luật quy trình có lý do hệ thống**: FE/BE deploy độc lập → PR chạm cả hai phải tách, backend land trước.
- **Luật quản trị cứng**: cấm dữ liệu khách hàng (org slug, email thật) trong git history công khai.
- **Tách kiến thức tĩnh khỏi quy trình**: `getsentry/skills` (30+ skill: commit, code-review, find-bugs, pr-writer…) với nguyên tắc phân tầng: *đa số kỹ sư dùng → skills chung; một team dùng → plugin domain; một repo dùng → để trong repo đó*.
- **Công cụ hoá đồng bộ đa tool**: `getsentry/dotagents` (mục 4.4).

### 6.2. Apache Airflow — context cho *ý định thiết kế*, không chỉ cú pháp

- **Quy ước ngôn ngữ domain**: "Dag" (title case) trong văn xuôi, giữ nguyên token code (`DAG`, `dag_id`); cấm viết "Directed Acyclic Graph" trừ ngữ cảnh lịch sử. Đây là loại luật *không thể suy ra từ code*.
- **Ranh giới an ninh kiến trúc viết tường minh**: Scheduler "never runs user code"; Workers "never access the metadata DB directly" — chỉ qua Execution API với "short-lived JWT token scoped to its task instance ID".
- **Dạy agent phân loại đánh giá bảo mật**: phân biệt *vulnerability thật* (code vi phạm mô hình đã ghi) vs *known limitation* (đã ghi nhận) vs *deployment hardening* — giúp agent review đúng khung, không báo động giả.
- Luật kiểm chứng được: "No `assert` in production code", "use `time.monotonic()` for durations", "Never add new direct `raise AirflowException(...)`", target "exactly 100% coverage of what the PR changes".

### 6.3. OpenAI Codex — giới hạn trên (bài học về kích thước)

AGENTS.md của `openai/codex` cực kỳ chi tiết (hàng nghìn dòng hướng dẫn Rust workspace: từng Clippy lint, quy ước snapshot test, API naming, giới hạn "≤800 dòng/change"). Giá trị của nó:

- Là "menu" phong phú các *loại* luật có thể viết (style, API design, test organization, change-size);
- Nhưng **không nên copy mô hình này**: file quá dài vượt khả năng tuân thủ ổn định của model trong một phiên (chính tài liệu Claude Code xác nhận: file dài giảm adherence). Repo lớn nên giải bằng **nested + rules + skills**, không phải bằng một file khổng lồ.
- Điểm sáng đáng học từ nội dung của nó: quy tắc quản trị context nội bộ của chính Codex ("no history rewrites — build context incrementally", "hard cap everything", "items must not exceed 10K tokens") — cùng triết lý context-là-tài-nguyên.

### 6.4. Coder — "hợp đồng hành vi" (behavioral contract)

- **Rule #1** ngay đầu file: *"If you want exception to ANY rule, YOU MUST STOP and get explicit permission first. BREAKING THE LETTER OR SPIRIT OF THE RULES IS FAILURE."* — tạo cổng dừng bắt buộc cho mọi ngoại lệ.
- **Cấm ngôn ngữ nịnh**: cấm "You're absolutely right!"; yêu cầu "Act as a critical peer reviewer", "YOU MUST call out bad ideas… When you disagree with my approach, YOU MUST push back".
- Nguyên tắc nhịp độ: "Doing it right is better than doing it fast. You are not in a rush."
- Khung *khi nào dừng hỏi vs cứ làm*: tiến thẳng trừ khi (nhiều approach khác nhau đáng kể / hành động xoá-tái cấu trúc / yêu cầu mơ hồ / người dùng đang hỏi — trả lời trước, code sau).
- Bài học: context layer không chỉ chứa *facts kỹ thuật* mà cả **hợp đồng tương tác** — điều đặc biệt quan trọng khi nhiều model/agent khác nhau cùng làm việc trên repo.

### 6.5. Cloudflare `agents` — cấu trúc ranh giới ba mức

Phân loại mọi luật thành **"Always" / "Ask first" / "Never"** — cấu trúc dễ tuân thủ cho model hơn văn xuôi. Kèm mục "Learned Facts" (kiến thức tích luỹ theo package) và "User Preferences" (triết lý thiết kế) — cho thấy AGENTS.md có thể tiến hoá như một bộ nhớ dài hạn được curate bởi con người.

### 6.6. Temporal (sdk-java) — persona + tiêu chuẩn tối thiểu sạch

Gán persona/bối cảnh cho agent trước khi liệt kê lệnh; luật API ngắn gọn đúng trọng tâm: "Avoid changing public API signatures. Anything under an `internal` directory is not part of the public API and may change freely." — ví dụ tốt cho SDK/library repo: ít luật, nhưng đúng những ranh giới sống còn.

---

## 7. Tầng vận hành: workflow để context layer thực sự tạo giá trị

Context layer tĩnh chỉ là một nửa. Nửa còn lại là **cách làm việc** — tổng hợp từ HumanLayer ACE-FCA, Anthropic long-horizon techniques, GitHub spec-kit.

### 7.1. Research → Plan → Implement (ACE-FCA)

- **Research**: hiểu kiến trúc, luồng dữ liệu, nguồn vấn đề — dùng sub-agent để thăm dò, trả về bản chưng cất (không phải raw search results).
- **Plan**: tài liệu bước-từng-bước, nêu đúng file sẽ sửa và cách verify — trở thành *văn bản có thẩm quyền* cho phần implement.
- **Implement**: thực thi tuần tự, sau mỗi mốc verify thì **compact tiến độ ngược vào plan document**.

**Đòn bẩy review của con người** (điểm sâu sắc nhất của ACE-FCA): một dòng code sai gây hại cục bộ; một dòng *plan* sai nhân lỗi ra hàng trăm dòng; một dòng *research* sai làm hỏng hàng nghìn dòng. → Tập trung effort người vào research & plan: "đọc 200 dòng plan giá trị hơn review 2.000 dòng code sinh ra". Kết quả thực nghiệm được báo cáo: fix bug trong 1 giờ trên codebase Rust 300k LOC lạ; ship 35k LOC (cancellation + WASM) trong 7 giờ so với ước tính 3–5 ngày/feature. Kèm cảnh báo nguyên văn: "you have to engage with your task when you're doing this or it WILL NOT WORK".

### 7.2. Intentional compaction & ba kỹ thuật long-horizon (Anthropic)

- **Compaction**: giữ context utilization chủ động (ACE-FCA khuyến nghị vùng 40–60%); khi compact, giữ quyết định kiến trúc, bug chưa giải, chi tiết implement; bỏ tool output trùng lặp. Rủi ro: compact quá tay làm mất ngữ cảnh tinh tế mà về sau mới thấy quan trọng.
- **Structured note-taking (agentic memory)**: agent ghi chú ra ngoài context (NOTES/MEMORY), đọc lại sau reset — "persistent memory with minimal overhead".
- **Sub-agent architectures**: agent con có context window sạch, làm việc thăm dò/chuyên sâu, trả về tóm tắt cô đọng (điển hình 1.000–2.000 token) cho agent điều phối.

Chọn kỹ thuật theo đặc tính việc: hội thoại dài nhiều vòng → compaction; phát triển lặp có mốc rõ → note-taking; nghiên cứu/phân tích song song → multi-agent.

### 7.3. Spec-Driven Development (GitHub spec-kit) — chuẩn hoá sản phẩm trung gian

Spec-kit chuẩn hoá chính các *artefact compaction* thành cấu trúc: `constitution` (nguyên tắc dự án) → `specify` (what/why, không tech) → `plan` (kiến trúc, stack) → `tasks` (việc nhỏ có thứ tự, đánh dấu chạy song song) → `implement` (+ `clarify`, `converge` tuỳ chọn). Scaffold `specs/<feature>/{spec,plan,tasks}.md` + `.specify/memory/constitution.md`; hỗ trợ 30+ agent qua slash-command hoặc skills mode. Không bắt buộc dùng tool này, nhưng **hình dạng artefact** (constitution/spec/plan/tasks per-feature, sống trong repo, review được) là pattern nên theo.

---

## 8. Anti-patterns — những lỗi đã được hệ sinh thái xác nhận

1. **Phân mảnh nguồn sự thật**: mỗi tool một bản luật (`.cursorrules`, CLAUDE.md riêng nội dung, copilot-instructions…) → trôi dạt. Chuẩn: một AGENTS.md, tool-adapter mỏng (Sentry).
2. **Một file khổng lồ**: AGENTS.md 500+ dòng giảm adherence; giải bằng nested + rules + skills, không phải bằng nhồi thêm (bài học Codex, xác nhận bởi docs Claude Code: target < 200 dòng).
3. **Chép dữ liệu sống vào file tĩnh**: schema DB, danh sách endpoint… sẽ lỗi thời → thành "thông tin sai" (loại tệ nhất). Dữ liệu sống đi qua MCP hoặc lệnh cho agent tự tra.
4. **Luật mơ hồ không kiểm chứng được**: "viết code sạch", "test kỹ" — sai altitude. Mọi luật phải cụ thể đến mức verify được.
5. **Luật mâu thuẫn giữa các file**: model "may pick one arbitrarily" — phải review định kỳ toàn bộ cây context như review code.
6. **Dùng context layer làm cơ chế cưỡng chế**: văn bản là *ngữ cảnh*, không phải *enforcement*; luật cứng (cấm lệnh, chặn path, bắt buộc chạy check) phải nằm ở hooks/permissions/CI.
7. **Skill description nghèo**: "Helps with PDFs" — agent không bao giờ kích hoạt đúng lúc. Description phải nêu *làm gì + khi nào dùng + từ khoá*.
8. **Chuỗi tham chiếu sâu**: SKILL.md → ref A → ref B → ref C; spec yêu cầu giữ 1 cấp.
9. **Nhầm tách-file với tiết-kiệm-context**: import/`@` chỉ giúp tổ chức; file import vẫn nạp đủ token lúc khởi động. Muốn giảm chi phí thật phải chuyển sang cơ chế lazy (nested/rules path-scoped/skills).
10. **Không có quy trình bảo trì**: context layer là "living documentation" — mỗi lần agent mắc lỗi lặp lại hoặc review bắt lỗi lẽ-ra-phải-biết, đó là tín hiệu cập nhật đúng một file trong cây.

---

## 9. Checklist triển khai từ số 0

**Giai đoạn 1 — Nền (tầng hành vi):**
- [ ] Viết `AGENTS.md` root ≤ ~150 dòng theo template mục 4.2 (tuyên bố source-of-truth, bản đồ, lệnh, ranh giới kiến trúc, Always/Ask/Never, quy ước domain, PR).
- [ ] `CLAUDE.md` = `@AGENTS.md` (import; symlink nếu không cần phần riêng và không trên Windows); config Gemini/Aider nếu team dùng.
- [ ] Mỗi luật đều kiểm chứng được; xoá mọi câu khẩu hiệu.

**Giai đoạn 2 — Phân tầng theo khu vực:**
- [ ] Nested `AGENTS.md` cho từng khu vực lớn (backend/frontend/tests) — chỉ chứa delta so với root.
- [ ] Luật gắn pattern file → rule path-scoped (bản canonical trong docs nếu cần dùng chung nhiều tool).

**Giai đoạn 3 — Quy trình & dữ liệu:**
- [ ] Nhận diện 3–5 quy trình lặp lại nhiều nhất → viết skill theo spec agentskills.io; validate bằng `skills-ref validate`.
- [ ] Khai báo MCP server cho dữ liệu sống mà agent hay cần; áp nguyên tắc consent/untrusted-description của spec MCP.
- [ ] Khai báo tập trung (agents.toml hoặc tương đương) → sinh/symlink config từng tool.

**Giai đoạn 4 — Vận hành & bảo trì:**
- [ ] Áp dụng research/plan/implement cho việc lớn; lưu artefact vào `specs/<feature>/` hoặc tương đương; review plan kỹ hơn review code.
- [ ] Bật memory của agent (nếu tool hỗ trợ) và audit định kỳ.
- [ ] Đưa cây context vào quy trình review: PR đổi hành vi hệ thống phải cập nhật file context tương ứng; định kỳ quét mâu thuẫn/lỗi thời.
- [ ] Nếu dự án xuất bản docs công khai: thêm `llms.txt` + bản `.md` cho các trang chính.

**Tiêu chí đo lường sức khoẻ context layer:**
- Tần suất agent lặp lại cùng một lỗi (phải giảm sau khi thêm luật tương ứng);
- Tỷ lệ luật trong cây còn đúng khi đối chiếu code (chống "thông tin sai");
- Token thường trực mỗi phiên (root + rules không-path) — có ngân sách và giữ dưới ngưỡng;
- Skill được kích hoạt đúng lúc (description đủ từ khoá) — quan sát qua phiên làm việc thật.

---

## 10. Nguồn tham khảo (đã fetch trực tiếp, 7/2026)

**Chuẩn mở:**
- AGENTS.md — https://agents.md/ ; repo https://github.com/agentsmd/agents.md (Agentic AI Foundation / Linux Foundation)
- Agent Skills spec — https://agentskills.io/specification ; repo https://github.com/agentskills/agentskills ; ví dụ chính thức https://github.com/anthropics/skills
- MCP — https://modelcontextprotocol.io/specification/latest (schema 2025-11-25); https://github.com/modelcontextprotocol/modelcontextprotocol ; reference servers https://github.com/modelcontextprotocol/servers ; TS SDK https://github.com/modelcontextprotocol/typescript-sdk
- llms.txt — https://llmstxt.org/ ; https://github.com/AnswerDotAI/llms-txt

**Lý thuyết & best practice:**
- Anthropic, *Effective context engineering for AI agents* — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Claude Code memory docs — https://code.claude.com/docs/en/memory
- LangChain context engineering (write/select/compress/isolate) — https://github.com/langchain-ai/context_engineering ; LangGraph — https://github.com/langchain-ai/langgraph
- HumanLayer 12-Factor Agents — https://github.com/humanlayer/12-factor-agents
- HumanLayer ACE-FCA — https://github.com/humanlayer/advanced-context-engineering-for-coding-agents (ace-fca.md)
- GitHub spec-kit — https://github.com/github/spec-kit
- Claude Code — https://github.com/anthropics/claude-code ; cookbooks https://github.com/anthropics/claude-cookbooks

**Case studies (AGENTS.md thực chiến, fetch trực tiếp):**
- Sentry — https://github.com/getsentry/sentry/blob/master/AGENTS.md ; https://github.com/getsentry/sentry/blob/master/static/AGENTS.md ; dotagents https://github.com/getsentry/dotagents ; skills https://github.com/getsentry/skills
- Apache Airflow — https://github.com/apache/airflow/blob/main/AGENTS.md
- OpenAI Codex — https://github.com/openai/codex/blob/main/AGENTS.md
- Cloudflare agents — https://github.com/cloudflare/agents/blob/main/AGENTS.md
- Coder — https://github.com/coder/coder/blob/main/AGENTS.md
- Temporal sdk-java — https://github.com/temporalio/sdk-java/blob/master/AGENTS.md
