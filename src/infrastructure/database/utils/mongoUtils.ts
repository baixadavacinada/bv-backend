import { Document } from 'mongoose';

/**
 * Utilitário para conversões seguras entre MongoDB Documents e entidades de domínio
 * Segue as melhores práticas de Domain-Driven Design mantendo os IDs como string
 */

export function convertObjectIdToString<T extends Document, U>(
  mongoDocument: T & { _id: any }
): U {
  const obj = mongoDocument.toObject();
  return convertAnyToString(obj) as U;
}

export function convertLeanDocumentToString<T>(
  leanDocument: any
): T {
  if (!leanDocument) return leanDocument;
  return convertAnyToString({ ...leanDocument }) as T;
}

export function convertLeanArrayToString<T>(
  leanArray: any[]
): T[] {
  return leanArray.map(item => convertLeanDocumentToString<T>(item));
}

function convertAnyToString(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (obj._id) {
    obj._id = obj._id.toString();
  }

  delete obj.__v;

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      if (value && typeof value === 'object' && value.constructor?.name === 'ObjectId') {
        obj[key] = value.toString();
      }

      else if (Array.isArray(value)) {
        obj[key] = value.map(item => {
          if (item && typeof item === 'object' && item.constructor?.name === 'ObjectId') {
            return item.toString();
          } else if (typeof item === 'object' && item !== null) {
            return convertAnyToString(item);
          }
          return item;
        });
      }

      else if (typeof value === 'object' && value !== null && value.constructor?.name !== 'Date') {
        obj[key] = convertAnyToString(value);
      }
    }
  }

  return obj;
}