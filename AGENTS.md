<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->
- AI code modernization streams from the server route src/routes/api/modernize.ts via Lovable AI Gateway; keeps the API key server-side.
- Pricing specials are public-read-only except for developer edits; plan activation validates global or account-specific eligibility in the database, preventing client-side plan tampering.
- A shared account provider owns auth state and plan reads; modernization requires a verified account and atomically reserves Basic usage in the database, preventing quota resets or concurrent overuse.
- Developer roles live in a separate protected table; every developer RPC verifies the caller in the database before returning private account data or changing settings.
- Successful modernization usage is recorded server-side independently of deletable history so usage totals persist when users clear history; imported history provides the available historical baseline.
- Promotion redemption is transactional with per-account uniqueness and a locked code row so repeated or concurrent redemptions cannot exceed configured limits.
- Hardware enquiries are validated and stored by a public server function; developer-only server checks and RLS protect inbox reads, and submitting never books a visit.
