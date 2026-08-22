declare module 'sql.js' {
	export interface SqlJsQueryExecResult {
		columns: string[];
		values: unknown[][];
	}

	export interface SqlJsDatabase {
		run(sql: string, params?: unknown[]): SqlJsDatabase;
		exec(sql: string): SqlJsQueryExecResult[];
		export(): Uint8Array;
		close(): void;
	}

	export interface SqlJsStatic {
		Database: new (data?: Uint8Array) => SqlJsDatabase;
	}

	export interface InitSqlJsOptions {
		locateFile?: (file: string) => string;
		wasmBinary?: ArrayBuffer;
	}

	export default function initSqlJs(config?: InitSqlJsOptions): Promise<SqlJsStatic>;
}
