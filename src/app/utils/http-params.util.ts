// src/app/utils/http-params.util.ts
import { HttpParams } from '@angular/common/http';

function isDate(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]';
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Convert a plain object to HttpParams.
 * - Skips null/undefined values
 * - Converts Date to ISO string
 * - Appends array values via .append
 * - Stringifies enums and simple objects
 */
export function toHttpParams(obj: Record<string, unknown>): HttpParams {
  let params = new HttpParams();
  Object.entries(obj ?? {}).forEach(([key, raw]) => {
    if (raw === null || raw === undefined) return;

    const add = (val: unknown) => {
      if (val === null || val === undefined) return;
      let str: string;
      if (isDate(val)) {
        str = val.toISOString();
      } else if (typeof val === 'string') {
        str = val;
      } else if (
        typeof val === 'number' ||
        typeof val === 'boolean'
      ) {
        str = String(val);
      } else if (isPlainObject(val)) {
        str = JSON.stringify(val);
      } else {
        // enums (string-valued) or other serializables
        str = String(val as unknown as string);
      }
      params = params.append(key, str);
    };

    if (Array.isArray(raw)) {
      raw.forEach(v => add(v));
    } else {
      add(raw);
    }
  });
  return params;
}


