import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import z from "@deepseek-ai/schemastery";
import { Remote, RemoteError, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
//#region lib/types/index.js
/**
* Customizations Remote owner: the Skills, MCP, and instruction-file inventory
* the Web Settings pane renders.
*
* The read projects state other owners already hold and invents none of its
* own: the skill registry's per-scope catalogs, the Loader rows whose module is
* the MCP client, the tools those rows registered, and the instruction files the
* agent-instructions plugin would load for this workspace. A skill catalog is
* scope-layered, so the read walks the composed agent presets and merges their
* catalogs by name; an MCP server's status derives from its row's enablement and
* fiber phase plus the `mcp__<server>__` tools actually present in the tool
* registry.
*
* Read-only: this service changes no configuration.
*
* @module @deepseek-ai/dsh-api-customizations-controller
*/
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) if (kind === "field") initializers.unshift(_);
		else descriptor[key] = _;
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
var __addDisposableResource = function(env, value, async) {
	if (value !== null && value !== void 0) {
		if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
		var dispose, inner;
		if (async) {
			if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
			dispose = value[Symbol.asyncDispose];
		}
		if (dispose === void 0) {
			if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
			dispose = value[Symbol.dispose];
			if (async) inner = dispose;
		}
		if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
		if (inner) dispose = function() {
			try {
				inner.call(this);
			} catch (e) {
				return Promise.reject(e);
			}
		};
		env.stack.push({
			value,
			dispose,
			async
		});
	} else if (async) env.stack.push({ async: true });
	return value;
};
var __disposeResources = (function(SuppressedError) {
	return function(env) {
		function fail(e) {
			env.error = env.hasError ? new SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
			env.hasError = true;
		}
		var r, s = 0;
		function next() {
			while (r = env.stack.pop()) try {
				if (!r.async && s === 1) return s = 0, env.stack.push(r), Promise.resolve().then(next);
				if (r.dispose) {
					var result = r.dispose.call(r.value);
					if (r.async) return s |= 2, Promise.resolve(result).then(next, function(e) {
						fail(e);
						return next();
					});
				} else s |= 1;
			} catch (e) {
				fail(e);
			}
			if (s === 1) return env.hasError ? Promise.reject(env.error) : Promise.resolve();
			if (env.hasError) throw env.error;
		}
		return next();
	};
})(typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
	var e = new Error(message);
	return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
});
/** The module specifier whose Loader rows are MCP servers. */
const MCP_CLIENT_MODULE = "@deepseek-ai/dsh-mcp-client";
/** Prefix one MCP server gives every tool it publishes. */
const MCP_TOOL_PREFIX = "mcp__";
/** The instruction file the harness home contributes, as `agent-instructions` reads it. */
const USER_INSTRUCTION_FILE = "AGENTS.md";
/** Runtime mirror: FiberState is a cross-package const enum. */
const FIBER_STATE = {
	PENDING: 0,
	LOADING: 1,
	ACTIVE: 2,
	FAILED: 3,
	DISPOSED: 4,
	UNLOADING: 5
};
/** Fiber phase as the wire spells it, with a disposed fiber reported as absent. */
const FIBER_PHASE = {
	[FIBER_STATE.PENDING]: "pending",
	[FIBER_STATE.LOADING]: "loading",
	[FIBER_STATE.ACTIVE]: "active",
	[FIBER_STATE.FAILED]: "failed",
	[FIBER_STATE.DISPOSED]: null,
	[FIBER_STATE.UNLOADING]: "unloading"
};
/** Fields the constructor re-checks, so a direct construction cannot bypass the schema. */
const POSITIVE_INTEGER_FIELDS = [
	"maxSkills",
	"maxMcpServers",
	"maxMcpTools",
	"maxRuleFiles",
	"maxRuleLevels",
	"bytesPerToken",
	"budgetTokens",
	"balanceTimeoutMs"
];
/** Whether a Loader config value is a plain object. */
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
* Read the fields this inventory shows out of one MCP row's Loader config.
*
* The Loader stores an entry's config as the file spelled it, without applying
* the plugin's schema defaults, so this narrows the value instead of trusting a
* type: a row whose config names neither a stdio command nor an HTTP endpoint
* contributes no server to the pane.
* @param config - the Loader entry's configured value.
* @returns the server facts, or undefined when the config names no usable target.
*/
function readMcpRow(config) {
	if (!isRecord(config)) return void 0;
	const serverName = config.serverName;
	if (typeof serverName !== "string" || !/^[A-Za-z0-9_-]{1,32}$/u.test(serverName)) return void 0;
	if (config.transport === "stdio" && typeof config.command === "string") {
		const args = Array.isArray(config.args) ? config.args.filter((argument) => typeof argument === "string") : [];
		return {
			serverName,
			transport: "stdio",
			target: [config.command, ...args].join(" ")
		};
	}
	if (config.transport === "streamable-http" && typeof config.url === "string") return {
		serverName,
		transport: "streamable-http",
		target: config.url
	};
}
/** Fold one scope's skills into the merged catalog, keeping the first metadata seen. */
function collect(merged, skills, preset) {
	for (const summary of skills) {
		const existing = merged.get(summary.name);
		if (existing === void 0) {
			merged.set(summary.name, {
				summary,
				presets: preset === void 0 ? [] : [preset]
			});
			continue;
		}
		if (preset !== void 0 && !existing.presets.includes(preset)) existing.presets.push(preset);
	}
}
/** Project one merged catalog entry onto the wire. */
function skillView(skill) {
	const { summary } = skill;
	return {
		name: summary.name,
		description: summary.description,
		...summary.whenToUse === void 0 ? {} : { whenToUse: summary.whenToUse },
		...summary.path === void 0 ? {} : { path: summary.path },
		source: summary.source,
		provider: summary.provider,
		modelInvocable: summary.invocation.modelInvocable,
		userInvocable: summary.invocation.userInvocable,
		presets: skill.presets
	};
}
/** UTF-8 bytes one string occupies on the wire. */
function byteLength(text) {
	return new TextEncoder().encode(text).length;
}
/** Bytes one skill contributes to the catalog the model is offered. */
function catalogBytesOf(skill) {
	return byteLength(skill.name) + byteLength(skill.description) + byteLength(skill.whenToUse ?? "");
}
/** Host Remote owner of the `customizations` namespace. */
let CustomizationsController = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _addMcpServer_decorators;
	let _removeMcpServer_decorators;
	let _setManagedMcpServerEnabled_decorators;
	let _balance_decorators;
	let _snapshot_decorators;
	return class CustomizationsController extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_addMcpServer_decorators = [Remote("addMcpServer")];
			_removeMcpServer_decorators = [Remote("removeMcpServer")];
			_setManagedMcpServerEnabled_decorators = [Remote("setManagedMcpServerEnabled")];
			_balance_decorators = [Remote("balance")];
			_snapshot_decorators = [Remote("snapshot")];
			__esDecorate(this, null, _addMcpServer_decorators, {
				kind: "method",
				name: "addMcpServer",
				static: false,
				private: false,
				access: {
					has: (obj) => "addMcpServer" in obj,
					get: (obj) => obj.addMcpServer
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _removeMcpServer_decorators, {
				kind: "method",
				name: "removeMcpServer",
				static: false,
				private: false,
				access: {
					has: (obj) => "removeMcpServer" in obj,
					get: (obj) => obj.removeMcpServer
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _setManagedMcpServerEnabled_decorators, {
				kind: "method",
				name: "setManagedMcpServerEnabled",
				static: false,
				private: false,
				access: {
					has: (obj) => "setManagedMcpServerEnabled" in obj,
					get: (obj) => obj.setManagedMcpServerEnabled
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _balance_decorators, {
				kind: "method",
				name: "balance",
				static: false,
				private: false,
				access: {
					has: (obj) => "balance" in obj,
					get: (obj) => obj.balance
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _snapshot_decorators, {
				kind: "method",
				name: "snapshot",
				static: false,
				private: false,
				access: {
					has: (obj) => "snapshot" in obj,
					get: (obj) => obj.snapshot
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		config = __runInitializers(this, _instanceExtraInitializers);
		static inject = ["loader", "tools"];
		static Config = z.object({
			maxSkills: z.number().step(1).min(1).default(500),
			maxMcpServers: z.number().step(1).min(1).default(100),
			maxMcpTools: z.number().step(1).min(1).default(200),
			maxRuleFiles: z.number().step(1).min(1).default(64),
			maxRuleLevels: z.number().step(1).min(1).default(64),
			bytesPerToken: z.number().step(1).min(1).default(4),
			budgetTokens: z.number().step(1).min(1).default(65536),
			projectMarker: z.string().default(".git"),
			instructionFileCandidates: z.array(String).default(["AGENTS.md", "CLAUDE.md"]),
			localInstructionFileCandidates: z.array(String).default(["AGENTS.local.md", "CLAUDE.local.md"]),
			instructionDirectories: z.array(String).default([".agents/rules"]),
			mcpServersFile: z.string().default(""),
			projectMcpFile: z.string().default(""),
			apiKeyEnv: z.string().default("DEEPSEEK_API_KEY"),
			balanceUrl: z.string().default("https://api.deepseek.com/user/balance"),
			balanceTimeoutMs: z.number().step(1).min(1).default(1e4)
		});
		/** Loader row id per managed record, for the rows this plugin mounted itself. */
		mounted = /* @__PURE__ */ new Map();
		/** Whether the panel-managed list has been read and mounted once. */
		synced = false;
		/** Workspace directory whose project rows are mounted, when discovery is enabled. */
		projectRoot;
		/** Project-declared rows this plugin mounted, by server name, with the config they were mounted from. */
		projectRows = /* @__PURE__ */ new Map();
		/**
		* @param ctx - Host context carrying the Loader and the tool registry.
		* @param config - deployment bounds and estimates for one snapshot.
		*/
		constructor(ctx, config) {
			super(ctx, "customizations", { namespace: "customizations" });
			this.config = config;
			for (const field of POSITIVE_INTEGER_FIELDS) {
				const value = config[field];
				if (!Number.isSafeInteger(value) || value < 1) throw new Error(`customizations-controller requires a positive integer ${field}`);
			}
			ctx.effect(() => () => this.releaseProjectRows(() => true), "customizations-controller: project MCP rows");
		}
		/**
		* Add one panel-managed MCP server and mount its row immediately.
		* @param server - the record to store and mount.
		* @returns nothing; the caller re-reads the snapshot.
		* @throws RemoteError when the record is invalid or cannot be written.
		*/
		async addMcpServer(server) {
			const record = validateManagedServer(server);
			const servers = await this.readStore();
			if (servers.some((existing) => existing.id === record.id)) throw new RemoteError("customizations/duplicate-id", `a managed server "${record.id}" exists`, { id: record.id });
			if (servers.some((existing) => existing.serverName === record.serverName)) throw new RemoteError("customizations/duplicate-name", `serverName "${record.serverName}" is taken`, { serverName: record.serverName });
			await this.writeStore([...servers, record]);
			if (record.enabled) await this.mount(record);
		}
		/**
		* Remove one panel-managed MCP server and unmount its row.
		* @param id - managed record id.
		* @returns nothing; a missing record is already in the asked-for state.
		* @throws RemoteError when the store cannot be written.
		*/
		async removeMcpServer(id) {
			const servers = await this.readStore();
			await this.writeStore(servers.filter((server) => server.id !== id));
			await this.unmount(id);
		}
		/**
		* Enable or disable one panel-managed MCP server without touching the profile.
		* @param id - managed record id.
		* @param enabled - whether the panel should mount the row.
		* @returns nothing; the caller re-reads the snapshot.
		* @throws RemoteError when the record is unknown or the store cannot be written.
		*/
		async setManagedMcpServerEnabled(id, enabled) {
			const servers = await this.readStore();
			const found = servers.find((server) => server.id === id);
			if (found === void 0) throw new RemoteError("customizations/unknown-server", `no managed server "${id}"`, { id });
			await this.writeStore(servers.map((server) => server.id === id ? {
				...server,
				enabled
			} : server));
			if (enabled) await this.mount({
				...found,
				enabled
			});
			else await this.unmount(id);
		}
		/**
		* Read the DeepSeek platform balance for this deployment's API key.
		*
		* A deployment without a stored key answers `no-key`; a refused or unreachable
		* request answers `failed`. Neither is an error: the pane reports what it knows.
		* @returns the wallet figures, or the state that explains their absence.
		*/
		async balance() {
			const key = await this.apiKey();
			if (key === void 0) return { state: "no-key" };
			try {
				const response = await fetch(this.config.balanceUrl, {
					headers: {
						accept: "application/json",
						authorization: `Bearer ${key}`
					},
					signal: AbortSignal.timeout(this.config.balanceTimeoutMs)
				});
				if (!response.ok) return { state: "failed" };
				return readBalance(await response.json());
			} catch {
				return { state: "failed" };
			}
		}
		/** The DeepSeek API key this deployment authenticates with, from credentials first. */
		async apiKey() {
			const credentials = this.ctx.get("credentials");
			if (credentials !== void 0) try {
				const resolved = await credentials.resolve(credentialRef(this.config.apiKeyEnv));
				if (resolved !== void 0 && resolved.value !== "") return resolved.value;
			} catch {}
			const ambient = process.env[this.config.apiKeyEnv];
			return ambient === void 0 || ambient === "" ? void 0 : ambient;
		}
		/**
		* Read every Skill, MCP server, and instruction file one Session's workspace holds.
		*
		* The read owns no Session, so it projects the workspace directory of the
		* Session identity a caller names: skills merge across the composed presets and
		* the global layer read under that directory, MCP rows come from the Loader
		* wherever they were declared, and instruction files are probed from that
		* Session's directory. Without a named Session — or for one whose header
		* records no directory — the read falls back to the first registered Workspace.
		* @param sessionId - Session whose workspace the project-scoped read follows.
		* @returns the merged catalog, the MCP rows, the instruction chain, and the estimate.
		*/
		async snapshot(sessionId) {
			const cwd = await this.workspaceCwd(sessionId);
			await this.syncStore();
			await this.syncProject(cwd);
			const skills = await this.readSkills(cwd);
			const rules = await this.readRules(cwd);
			const instructionBytes = rules.rules.reduce((total, rule) => total + rule.bytes, 0);
			const catalogBytes = skills.skills.reduce((total, skill) => total + catalogBytesOf(skill), 0);
			const usage = {
				instructionBytes,
				catalogBytes,
				estimatedTokens: Math.ceil((instructionBytes + catalogBytes) / this.config.bytesPerToken),
				budgetTokens: this.config.budgetTokens
			};
			return {
				...skills,
				...rules,
				usage,
				mcpServers: this.readMcpServers()
			};
		}
		/** Merge the global skill layer with every composed preset's catalog. */
		async readSkills(cwd) {
			const registry = this.ctx.get("skills");
			if (registry === void 0) return {
				skillsAvailable: false,
				presets: [],
				skills: [],
				skillsTruncated: false
			};
			const lookup = cwd === void 0 ? {} : { cwd };
			const merged = /* @__PURE__ */ new Map();
			try {
				collect(merged, await registry.list(lookup), void 0);
			} catch (error) {
				this.ctx.logger.warn(`customizations: global skill catalog unavailable: ${String(error)}`);
			}
			const presets = [];
			const roster = this.ctx.get("agentPresets");
			if (roster !== void 0) for (const preset of await roster.compositionInventory()) {
				presets.push(preset.id);
				try {
					const env_1 = {
						stack: [],
						error: void 0,
						hasError: false
					};
					try {
						const lease = __addDisposableResource(env_1, await roster.acquireScope(preset.id), true);
						collect(merged, await registry.list({
							scope: lease.key,
							...lookup
						}), preset.id);
					} catch (e_1) {
						env_1.error = e_1;
						env_1.hasError = true;
					} finally {
						const result_1 = __disposeResources(env_1);
						if (result_1) await result_1;
					}
				} catch (error) {
					this.ctx.logger.warn(`customizations: preset "${preset.id}" skill catalog unavailable: ${String(error)}`);
				}
			}
			const all = [...merged.values()].sort((left, right) => left.summary.name.localeCompare(right.summary.name));
			return {
				skillsAvailable: true,
				presets,
				skills: all.slice(0, this.config.maxSkills).map(skillView),
				skillsTruncated: all.length > this.config.maxSkills
			};
		}
		/** Read every MCP Loader row and the tools each one currently publishes. */
		readMcpServers() {
			const tools = this.ctx.tools.schemas();
			const manageable = this.ctx.get("pluginManager") !== void 0;
			const servers = [];
			for (const entry of this.ctx.loader.entries()) {
				if (entry.options.name !== MCP_CLIENT_MODULE) continue;
				const facts = readMcpRow(entry.options.config);
				if (facts === void 0) continue;
				const managedId = this.managedIdOf(entry.id);
				const projectName = this.projectNameOf(entry.id);
				servers.push({
					entryId: entry.id,
					serverName: facts.serverName,
					transport: facts.transport,
					target: facts.target,
					enabled: !entry.disabled,
					fiberPhase: entry.fiber === void 0 ? null : FIBER_PHASE[entry.fiber.state],
					tools: this.toolsOf(tools, facts.serverName),
					manageable,
					origin: managedId !== void 0 ? "panel" : projectName !== void 0 ? "project" : "profile",
					...managedId === void 0 ? {} : { managedId }
				});
				if (servers.length >= this.config.maxMcpServers) break;
			}
			return servers;
		}
		/** Read the tools registered under one server's namespace. */
		toolsOf(schemas, serverName) {
			const prefix = `${MCP_TOOL_PREFIX}${serverName}__`;
			return schemas.filter((schema) => schema.name.startsWith(prefix)).slice(0, this.config.maxMcpTools).map((schema) => ({
				name: schema.name.slice(prefix.length),
				description: schema.description
			}));
		}
		/**
		* Probe the instruction chain this workspace's agents load: the harness home's
		* own file first, then every existing candidate from the project root down to
		* the workspace directory, and every Markdown file the configured instruction
		* directories hold there.
		*
		* File discovery belongs to `agent-instructions`; this read mirrors its
		* candidate names, instruction directories, and root marker, which the
		* deployment configures here in the same terms, so the pane reports the files
		* that plugin would load.
		*/
		async readRules(cwd) {
			const fs = this.ctx.get("fs");
			if (fs === void 0 || cwd === void 0) return {
				rules: [],
				rulesTruncated: false
			};
			const files = [];
			const home = this.ctx.get("dshHomePath");
			if (home !== void 0) {
				const path = join(home(), USER_INSTRUCTION_FILE);
				const bytes = await readInstructionBytes(fs, path);
				if (bytes !== void 0) files.push({
					name: USER_INSTRUCTION_FILE,
					path,
					scope: "user",
					bytes
				});
			}
			const root = await projectRoot(fs, cwd, this.config);
			for (const directory of ancestors(root, cwd)) {
				const names = [
					...this.config.instructionFileCandidates,
					...this.config.localInstructionFileCandidates,
					...await directoryRuleFiles(fs, directory, this.config.instructionDirectories)
				];
				for (const name of names) {
					const path = join(directory, name);
					const bytes = await readInstructionBytes(fs, path);
					if (bytes !== void 0) files.push({
						name,
						path,
						scope: "project",
						bytes
					});
				}
			}
			return {
				rules: files.slice(0, this.config.maxRuleFiles),
				rulesTruncated: files.length > this.config.maxRuleFiles
			};
		}
		/** The managed record behind one Loader row, when this plugin mounted it. */
		managedIdOf(entryId) {
			for (const [id, mounted] of this.mounted) if (mounted === entryId) return id;
		}
		/** The project server name behind one Loader row, when the workspace declared it. */
		projectNameOf(entryId) {
			for (const [serverName, mounted] of this.projectRows) if (mounted.entryId === entryId) return serverName;
		}
		/**
		* Mount the rows the Session's workspace declares, and release the ones it does not.
		*
		* Discovery is opt-in: `projectMcpFile` names a workspace-relative file and an
		* empty setting mounts nothing. Because the file comes from the workspace and
		* every row it declares spawns a process, this plugin reads it only for the
		* directory the read already resolved, and rows the profile or the panel
		* already declare under the same server name win. A stdio row that names no
		* working directory runs in the workspace that declares it.
		* @param cwd - the workspace directory the read resolved, when it has one.
		*/
		async syncProject(cwd) {
			if (cwd === void 0 || this.config.projectMcpFile === "") {
				await this.releaseProjectRows(() => true);
				this.projectRoot = void 0;
				return;
			}
			if (this.projectRoot !== cwd) {
				await this.releaseProjectRows(() => true);
				this.projectRoot = cwd;
			}
			const taken = this.takenServerNames();
			const declared = (await this.readShared(resolve(cwd, this.config.projectMcpFile), this.ctx.get("fs"))).filter((server) => !taken.has(server.serverName));
			const names = new Set(declared.map((server) => server.serverName));
			await this.releaseProjectRows((serverName) => !names.has(serverName));
			for (const server of declared) {
				const resolved = server.transport === "stdio" && server.cwd === void 0 ? {
					...server,
					cwd
				} : server;
				const config = JSON.stringify(mcpConfigOf(resolved));
				const mounted = this.projectRows.get(resolved.serverName);
				if (mounted?.config === config) continue;
				if (mounted !== void 0) await this.disposeRow(mounted.entryId);
				const entryId = await this.ctx.loader.create({
					name: MCP_CLIENT_MODULE,
					config: mcpConfigOf(resolved)
				});
				this.projectRows.set(resolved.serverName, {
					entryId,
					config
				});
				await this.ctx.loader.resolve(entryId).fiber?.await();
			}
		}
		/** Server names the profile and the panel already declare, which the workspace file may not duplicate. */
		takenServerNames() {
			const names = /* @__PURE__ */ new Set();
			for (const entry of this.ctx.loader.entries()) {
				if (entry.options.name !== MCP_CLIENT_MODULE) continue;
				if (this.projectNameOf(entry.id) !== void 0) continue;
				const facts = readMcpRow(entry.options.config);
				if (facts !== void 0) names.add(facts.serverName);
			}
			return names;
		}
		/** Dispose every project row the selector names, in mount order. */
		async releaseProjectRows(select) {
			for (const [serverName, mounted] of [...this.projectRows]) {
				if (!select(serverName)) continue;
				this.projectRows.delete(serverName);
				await this.disposeRow(mounted.entryId);
			}
		}
		/** Dispose one Loader row this plugin created. */
		async disposeRow(entryId) {
			const entry = this.ctx.loader.store[entryId];
			if (entry === void 0) return;
			const disposal = entry.fiber?.dispose();
			this.ctx.loader.remove(entryId);
			await disposal;
		}
		/** Read and mount the managed list once per lifetime. */
		async syncStore() {
			if (this.synced) return;
			this.synced = true;
			for (const server of await this.readStore()) if (server.enabled) await this.mount(server);
		}
		/** Create the Loader row for one managed server, replacing any row it already owns. */
		async mount(server) {
			await this.unmount(server.id);
			const id = await this.ctx.loader.create({
				name: MCP_CLIENT_MODULE,
				config: mcpConfigOf(server)
			});
			this.mounted.set(server.id, id);
			await this.ctx.loader.resolve(id).fiber?.await();
		}
		/** Dispose the Loader row one managed server owns, when it has one. */
		async unmount(recordId) {
			const id = this.mounted.get(recordId);
			if (id === void 0) return;
			this.mounted.delete(recordId);
			await this.disposeRow(id);
		}
		/** The managed-server store path, or undefined when the deployment has no harness home. */
		storePath() {
			if (this.config.mcpServersFile !== "") return this.config.mcpServersFile;
			const home = this.ctx.get("dshHomePath");
			return home === void 0 ? void 0 : join(home(), "mcp.json");
		}
		/** Read the `mcpServers` map; an absent or unreadable file reads as empty. */
		readStore() {
			return this.readShared(this.storePath());
		}
		/**
		* Read one shared `mcpServers` file; an absent, unreadable, or foreign file reads as empty.
		* @param path - absolute file path, or undefined when the deployment has no such file.
		* @param fs - workspace filesystem provider, which owns a file inside a Session's workspace.
		*/
		async readShared(path, fs) {
			if (path === void 0) return [];
			try {
				let text;
				if (fs === void 0) text = await readFile(path, "utf8");
				else text = await fs.readText(await fs.resolve(path));
				const parsed = JSON.parse(text);
				if (!isRecord(parsed) || !isRecord(parsed.mcpServers)) return [];
				return Object.entries(parsed.mcpServers).flatMap(([name, entry]) => {
					const server = readSharedServer(name, entry);
					return server === void 0 ? [] : [server];
				});
			} catch {
				return [];
			}
		}
		/** Replace the `mcpServers` map atomically and privately, in the shared file format. */
		async writeStore(servers) {
			const path = this.storePath();
			if (path === void 0) throw new RemoteError("customizations/no-store", "this deployment has no harness home to store MCP servers in", {});
			const mcpServers = {};
			for (const server of servers) mcpServers[server.serverName] = sharedServerOf(server);
			await mkdir(dirname(path), { recursive: true });
			await writeFile(path, `${JSON.stringify({ mcpServers }, null, 2)}\n`, { mode: 384 });
		}
		/**
		* The workspace directory the project-scoped part of the read follows: the
		* named Session's own recorded directory, else the first registered Workspace.
		*
		* A Session header is the authoritative record of the directory its Agent runs
		* in, so the pane reports the same files that Session loads. A live Agent
		* answers from its header; a Session that is only stored is read through
		* `sessionPersistence`, whose `stat` does not load the event body.
		* @param sessionId - Session the caller is showing, when it named one.
		* @returns the directory to discover project skills and instruction files under.
		*/
		async workspaceCwd(sessionId) {
			if (sessionId !== void 0) {
				const live = this.ctx.get("sessions")?.get(sessionId)?.header.cwd;
				const stored = live === void 0 ? (await this.ctx.get("sessionPersistence")?.stat(sessionId))?.header.cwd : void 0;
				const recorded = live ?? stored;
				if (recorded !== void 0) return recorded;
			}
			return this.ctx.get("workspaceRegistry")?.list()[0]?.path;
		}
	};
})();
/**
* Read one instruction file's UTF-8 byte count, or undefined when it is absent or unreadable.
* @param fs - the host filesystem the probe runs through.
* @param path - absolute candidate path.
* @returns the byte count, or undefined when the path holds no readable file.
*/
async function readInstructionBytes(fs, path) {
	try {
		return byteLength(await fs.readText(await fs.resolve(path)));
	} catch {
		return;
	}
}
/**
* Every Markdown file the configured instruction directories hold under one directory.
*
* The names are directory-relative candidates in file-name order, matching what
* `agent-instructions` loads from the same directories. An absent or unreadable
* directory contributes nothing rather than failing the chain.
* @param fs - the host filesystem the listing runs through.
* @param directory - absolute ancestor directory being walked.
* @param instructionDirectories - configured same-directory instruction directories.
* @returns joinable relative paths, ordered by file name.
*/
async function directoryRuleFiles(fs, directory, instructionDirectories) {
	const names = [];
	for (const instructionDirectory of instructionDirectories) {
		let entries;
		try {
			entries = await fs.listDir(await fs.resolve(join(directory, instructionDirectory)));
		} catch {
			continue;
		}
		for (const entry of entries) if (entry.type === "file" && entry.name.endsWith(".md") && !entry.name.startsWith(".")) names.push(join(instructionDirectory, entry.name));
	}
	return names.sort();
}
/**
* Walk upward to the nearest directory carrying the project marker.
* @param fs - the host filesystem the probe runs through.
* @param cwd - the workspace directory the walk starts at.
* @param config - the marker name and the ancestor bound.
* @returns the marked ancestor, or the workspace directory when no probe finds one.
*/
async function projectRoot(fs, cwd, config) {
	let directory = cwd;
	for (let level = 0; level < config.maxRuleLevels; level += 1) {
		const parent = dirname(directory);
		/* v8 ignore next -- root is always an ancestor of cwd: projectRoot only walks upward */
		if (parent === directory) break;
		directory = parent;
		try {
			if (await fs.stat(await fs.resolve(join(directory, config.projectMarker))) !== void 0) return directory;
		} catch {}
	}
	return cwd;
}
/** Read the platform's wallet answer, or the state that explains an unreadable one. */
function readBalance(value) {
	if (!isRecord(value) || !Array.isArray(value.balance_infos)) return { state: "failed" };
	const first = value.balance_infos[0];
	if (!isRecord(first) || typeof first.currency !== "string" || typeof first.total_balance !== "string") return { state: "failed" };
	return {
		state: "ready",
		currency: first.currency,
		total: first.total_balance,
		...typeof first.granted_balance === "string" ? { granted: first.granted_balance } : {},
		...typeof first.topped_up_balance === "string" ? { toppedUp: first.topped_up_balance } : {}
	};
}
/** One string list, or undefined when the value is not a list of strings. */
function stringList(value) {
	if (!Array.isArray(value)) return void 0;
	return value.every((item) => typeof item === "string") ? [...value] : void 0;
}
/** One string record, or undefined when the value is not a record of strings. */
function stringRecord(value) {
	if (!isRecord(value)) return void 0;
	const entries = Object.entries(value);
	if (!entries.every(([, item]) => typeof item === "string")) return void 0;
	return Object.fromEntries(entries);
}
/**
* Read one `mcpServers` entry in the shared file format.
*
* The format is the one Claude, Cursor, and Antigravity write: a map keyed by
* server name, `command`/`args`/`env` for a local process and `url`/`headers`
* for an HTTP endpoint, with an optional `disabled` flag. The key becomes the
* server's tool namespace.
* @param name - the map key.
* @param entry - the parsed entry value.
* @returns the managed record, or undefined when the entry names no usable target.
*/
function readSharedServer(name, entry) {
	if (!isRecord(entry) || !/^[A-Za-z0-9_-]{1,32}$/u.test(name)) return void 0;
	const enabled = entry.disabled !== true;
	const args = stringList(entry.args);
	const env = stringRecord(entry.env);
	const headers = stringRecord(entry.headers);
	const cwd = typeof entry.cwd === "string" ? entry.cwd : void 0;
	if (entry.transport !== "streamable-http" && typeof entry.command === "string" && entry.command !== "") return {
		id: name,
		serverName: name,
		transport: "stdio",
		command: entry.command,
		...args === void 0 ? {} : { args },
		...env === void 0 ? {} : { env },
		...cwd === void 0 ? {} : { cwd },
		enabled
	};
	if (typeof entry.url === "string" && entry.url !== "") return {
		id: name,
		serverName: name,
		transport: "streamable-http",
		url: entry.url,
		...headers === void 0 ? {} : { headers },
		enabled
	};
}
/** Project one managed record back onto the shared file format. */
function sharedServerOf(server) {
	const disabled = !server.enabled;
	if (server.transport === "stdio") return {
		disabled,
		/* v8 ignore next -- a stdio record always carries the command its transport requires */
		command: server.command ?? "",
		args: [...server.args ?? []],
		...server.env === void 0 ? {} : { env: { ...server.env } },
		...server.cwd === void 0 || server.cwd === "" ? {} : { cwd: server.cwd }
	};
	return {
		disabled,
		transport: "streamable-http",
		/* v8 ignore next -- an HTTP record always carries the URL its transport requires */
		url: server.url ?? "",
		...server.headers === void 0 ? {} : { headers: { ...server.headers } }
	};
}
/**
* Reject a record the Loader could not mount, before it reaches the store.
* @param server - the record a caller asked to add.
* @returns the same record once it names a usable transport.
* @throws RemoteError when the id, name, or target is missing or malformed.
*/
function validateManagedServer(server) {
	if (typeof server.id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/u.test(server.id)) throw new RemoteError("customizations/bad-request", "id must start with a letter or digit and use [A-Za-z0-9_-]", {});
	if (!/^[A-Za-z0-9_-]{1,32}$/u.test(server.serverName)) throw new RemoteError("customizations/bad-request", "serverName must match [A-Za-z0-9_-]{1,32}", {});
	if (server.transport === "stdio" && (typeof server.command !== "string" || server.command === "")) throw new RemoteError("customizations/bad-request", "a stdio server needs a command", {});
	if (server.transport === "streamable-http" && (typeof server.url !== "string" || server.url === "")) throw new RemoteError("customizations/bad-request", "an http server needs a url", {});
	return server;
}
/** Project one managed record onto the MCP client's own config fields. */
function mcpConfigOf(server) {
	if (server.transport === "stdio") return {
		transport: "stdio",
		serverName: server.serverName,
		/* v8 ignore next -- a stdio record always carries the command its transport requires */
		command: server.command ?? "",
		args: [...server.args ?? []],
		...server.env === void 0 ? {} : { env: { ...server.env } },
		...server.cwd === void 0 || server.cwd === "" ? {} : { cwd: server.cwd }
	};
	return {
		transport: "streamable-http",
		serverName: server.serverName,
		/* v8 ignore next -- an HTTP record always carries the URL its transport requires */
		url: server.url ?? "",
		headers: { ...server.headers ?? {} }
	};
}
/** Every directory from one broad root down to a specific directory, inclusive. */
function ancestors(root, cwd) {
	if (root === cwd) return [cwd];
	const chain = [];
	let directory = cwd;
	while (directory !== root) {
		chain.unshift(directory);
		const parent = dirname(directory);
		/* v8 ignore next -- root is always an ancestor of cwd: projectRoot only walks upward */
		if (parent === directory) break;
		directory = parent;
	}
	/* v8 ignore next -- the walk stops at root, so the chain never starts there */
	if (chain[0] !== root) chain.unshift(root);
	return chain;
}
//#endregion
export { CustomizationsController, CustomizationsController as default };
