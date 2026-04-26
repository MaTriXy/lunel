// AI manager — runs both OpenCode and Codex simultaneously and routes calls
// by the `backend` field in each request. Backends that fail to init are
// skipped gracefully; the available list is exposed to the app.

import type { AIProvider, AiEvent, AiEventEmitter, ModelSelector, FileAttachment, CodexPromptOptions, AiSyncState } from "./interface.js";

export type AiBackend = "opencode" | "codex";
const DEBUG_MODE = process.env.LUNEL_DEBUG === "1" || process.env.LUNEL_DEBUG_AI === "1";

export class AiManager {
  private _providers: Partial<Record<AiBackend, AIProvider>> = {};
  private _available: AiBackend[] = [];

  async init(): Promise<void> {
    await Promise.allSettled([
      this.tryInit("opencode"),
      this.tryInit("codex"),
    ]);
    if (this._available.length === 0) {
      console.warn("[ai] No AI backends available. CLI will continue without AI features.");
      return;
    }
    if (DEBUG_MODE) {
      console.log(`[ai] Available backends: ${this._available.join(", ")}`);
    }
  }

  private async tryInit(backend: AiBackend): Promise<void> {
    try {
      if (backend === "opencode") {
        const { OpenCodeProvider } = await import("./opencode.js");
        const p = new OpenCodeProvider();
        await p.init();
        this._providers.opencode = p;
      } else {
        const { CodexProvider } = await import("./codex.js");
        const p = new CodexProvider();
        await p.init();
        this._providers.codex = p;
      }
      this._available.push(backend);
    } catch (err) {
      if (DEBUG_MODE) {
        console.warn(`[ai] ${backend} backend unavailable: ${(err as Error).message}`);
      }
    }
  }

  availableBackends(): AiBackend[] {
    return [...this._available];
  }

  private get(backend: AiBackend): AIProvider {
    const p = this._providers[backend];
    if (!p) {
      throw Object.assign(new Error(`Backend "${backend}" is not available`), { code: "EUNAVAILABLE" });
    }
    return p;
  }

  // Wire each provider's events to the emitter, tagged with backend name.
  subscribe(emitter: (backend: AiBackend, event: AiEvent) => void): () => void {
    const cleanups = this._available.map((backend) =>
      this._providers[backend]!.subscribe((event) => emitter(backend, event))
    );
    return () => cleanups.forEach((c) => c());
  }

  async destroy(): Promise<void> {
    await Promise.allSettled(
      this._available.map((b) => this._providers[b]!.destroy())
    );
  }

  // List sessions from all available backends, each tagged with its backend.
  async listAllSessions(): Promise<{ sessions: Array<Record<string, unknown> & { backend: AiBackend }> }> {
    const results = await Promise.allSettled(
      this._available.map(async (backend) => {
        const res = await this._providers[backend]!.listSessions();
        const sessions = (res.sessions as unknown[]) ?? [];
        return (sessions as Array<Record<string, unknown>>).map((s) => ({ ...s, backend }));
      })
    );
    const sessions = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
    return { sessions };
  }

  async syncState(sessionIds: Partial<Record<AiBackend, string[]>> = {}): Promise<{
    sessions: Array<Record<string, unknown> & { backend: AiBackend }>;
    statuses: Array<Record<string, unknown> & { backend: AiBackend }>;
    messages: Record<string, unknown>;
    pendingPermissions: Array<Record<string, unknown> & { backend: AiBackend }>;
    pendingQuestions: Array<Record<string, unknown> & { backend: AiBackend }>;
    statusAuthoritativeByBackend: Partial<Record<AiBackend, boolean>>;
    syncedBackends: AiBackend[];
    generatedAt: number;
  }> {
    const results = await Promise.allSettled(
      this._available.map(async (backend) => {
        const provider = this._providers[backend]!;
        const state: AiSyncState = provider.syncState
          ? await provider.syncState(sessionIds[backend])
          : {
              sessions: (await provider.listSessions()).sessions as unknown[],
              statuses: [],
              messages: {},
              generatedAt: Date.now(),
            };
        return { backend, state };
      })
    );

    const sessions: Array<Record<string, unknown> & { backend: AiBackend }> = [];
    const statuses: Array<Record<string, unknown> & { backend: AiBackend }> = [];
    const messages: Record<string, unknown> = {};
    const pendingPermissions: Array<Record<string, unknown> & { backend: AiBackend }> = [];
    const pendingQuestions: Array<Record<string, unknown> & { backend: AiBackend }> = [];
    const statusAuthoritativeByBackend: Partial<Record<AiBackend, boolean>> = {};
    const syncedBackends: AiBackend[] = [];

    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const { backend, state } = result.value;
      syncedBackends.push(backend);
      statusAuthoritativeByBackend[backend] = state.statusAuthoritative !== false;
      sessions.push(...((state.sessions as Array<Record<string, unknown>> | undefined) ?? []).map((session) => ({ ...session, backend })));
      statuses.push(...(state.statuses ?? []).map((status) => ({ ...status, backend })));
      for (const [sessionId, value] of Object.entries(state.messages ?? {})) {
        messages[`${backend}:${sessionId}`] = value;
      }
      pendingPermissions.push(...((state.pendingPermissions ?? []) as Array<Record<string, unknown>>).map((permission) => ({ ...permission, backend })));
      pendingQuestions.push(...((state.pendingQuestions ?? []) as Array<Record<string, unknown>>).map((question) => ({ ...question, backend })));
    }

    return {
      sessions,
      statuses,
      messages,
      pendingPermissions,
      pendingQuestions,
      statusAuthoritativeByBackend,
      syncedBackends,
      generatedAt: Date.now(),
    };
  }

  // Session management — all require explicit backend
  createSession(backend: AiBackend, title?: string) { return this.get(backend).createSession(title); }
  getSession(backend: AiBackend, id: string) { return this.get(backend).getSession(id); }
  deleteSession(backend: AiBackend, id: string) { return this.get(backend).deleteSession(id); }
  renameSession(backend: AiBackend, id: string, title: string) { return this.get(backend).renameSession(id, title); }
  getMessages(backend: AiBackend, sessionId: string) { return this.get(backend).getMessages(sessionId); }

  prompt(
    backend: AiBackend,
    sessionId: string,
    text: string,
    model?: ModelSelector,
    agent?: string,
    files?: FileAttachment[],
    codexOptions?: CodexPromptOptions,
  ) {
    this.get(backend).setActiveSession?.(sessionId);
    return this.get(backend).prompt(sessionId, text, model, agent, files, codexOptions);
  }

  abort(backend: AiBackend, sessionId: string) { return this.get(backend).abort(sessionId); }

  // Metadata — backend is optional, falls back to first available
  agents(backend?: AiBackend) { return this.get(backend ?? this._available[0]).agents(); }
  providers(backend?: AiBackend) { return this.get(backend ?? this._available[0]).providers(); }
  setAuth(backend: AiBackend, providerId: string, key: string) { return this.get(backend).setAuth(providerId, key); }

  // Session operations
  command(backend: AiBackend, sessionId: string, command: string, args: string) { return this.get(backend).command(sessionId, command, args); }
  revert(backend: AiBackend, sessionId: string, messageId: string) { return this.get(backend).revert(sessionId, messageId); }
  unrevert(backend: AiBackend, sessionId: string) { return this.get(backend).unrevert(sessionId); }
  share(backend: AiBackend, sessionId: string) { return this.get(backend).share(sessionId); }
  permissionReply(backend: AiBackend, sessionId: string, permissionId: string, response: "once" | "always" | "reject") {
    return this.get(backend).permissionReply(sessionId, permissionId, response);
  }
  questionReply(backend: AiBackend, sessionId: string, questionId: string, answers: string[][]) {
    const provider = this.get(backend);
    if (!provider.questionReply) {
      throw new Error(`Backend "${backend}" does not support question replies`);
    }
    return provider.questionReply(sessionId, questionId, answers);
  }
  questionReject(backend: AiBackend, sessionId: string, questionId: string) {
    const provider = this.get(backend);
    if (!provider.questionReject) {
      throw new Error(`Backend "${backend}" does not support question rejection`);
    }
    return provider.questionReject(sessionId, questionId);
  }
}

export async function createAiManager(): Promise<AiManager> {
  const manager = new AiManager();
  await manager.init();
  return manager;
}

export type { AIProvider, AiEventEmitter, AiEvent, ModelSelector } from "./interface.js";
