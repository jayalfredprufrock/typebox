/*--------------------------------------------------------------------------

@sinclair/typebox/value

The MIT License (MIT)

Copyright (c) 2017-2023 Haydn Paterson (sinclair) <haydn.developer@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

---------------------------------------------------------------------------*/

import * as Types from '../typebox'
import { ValueClone } from './clone'
import { ValueCheck } from './check'

// ----------------------------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------------------------
export class ValueTransformUnknownTypeError extends Error {
  constructor(public readonly schema: Types.TSchema) {
    super('Unknown type')
  }
}
export class ValueTransformDereferenceError extends Error {
  constructor(public readonly schema: Types.TRef | Types.TThis) {
    super(`Unable to dereference schema with $id '${schema.$ref}'`)
  }
}
export class ValueTransformFallthroughError extends Error {
  constructor(public readonly schema: Types.TSchema, public readonly value: unknown, public mode: ValueTransformMode) {
    super('Unexpected transform error')
  }
}
export class ValueTransformCodecError extends Error {
  constructor(public readonly schema: Types.TSchema, public readonly value: unknown, public mode: ValueTransformMode, error: any) {
    super(`${error instanceof Error ? error.message : 'Unknown'}`)
  }
}
export type ValueTransformMode = 'encode' | 'decode'
export namespace ValueTransform {
  // ----------------------------------------------------------------------------------------------
  // Guards
  // ----------------------------------------------------------------------------------------------
  function IsObject(value: unknown): value is Record<keyof any, unknown> {
    return typeof value === 'object' && value !== null && !globalThis.Array.isArray(value)
  }
  function IsArray(value: unknown): value is unknown[] {
    return typeof value === 'object' && globalThis.Array.isArray(value)
  }
  function IsString(value: unknown): value is string {
    return typeof value === 'string'
  }
  // ----------------------------------------------------------------------------------------------
  // Apply
  // ----------------------------------------------------------------------------------------------
  function Apply(schema: Types.TSchema, value: any, mode: ValueTransformMode) {
    try {
      if (!(Types.Transform in schema)) return value
      const transform = schema[Types.Transform] as unknown as Types.TransformOptions
      if (mode === 'decode' && typeof transform.decode === 'function') return transform.decode(value)
      if (mode === 'encode' && typeof transform.encode === 'function') return transform.encode(value)
      return value
    } catch (error) {
      throw new ValueTransformCodecError(schema, value, mode, error)
    }
  }
  // ----------------------------------------------------------------------------------------------
  // Transform
  // ----------------------------------------------------------------------------------------------
  function Any(schema: Types.TAny, references: Types.TSchema[], value: any, mode: ValueTransformMode): any {
    return Apply(schema, value, mode)
  }
  function Array(schema: Types.TArray, references: Types.TSchema[], value: any, mode: ValueTransformMode): any {
    if (IsArray(value)) {
      const inner = value.map((value) => Visit(schema.items, references, value, mode))
      return Apply(schema, inner, mode)
    }
    throw new ValueTransformFallthroughError(schema, value, mode)
  }
  function BigInt(schema: Types.TBigInt, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Boolean(schema: Types.TBoolean, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Constructor(schema: Types.TConstructor, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Date(schema: Types.TDate, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Function(schema: Types.TFunction, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Integer(schema: Types.TInteger, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Intersect(schema: Types.TIntersect, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Literal(schema: Types.TLiteral, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Never(schema: Types.TNever, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Null(schema: Types.TNull, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Number(schema: Types.TNumber, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Object(schema: Types.TObject, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    if (IsObject(value))
      return globalThis.Object.keys(schema.properties).reduce((acc, key) => {
        return value[key] !== undefined ? { ...acc, [key]: Visit(schema.properties[key], references, value[key], mode) } : { ...acc }
      }, value)
    throw new ValueTransformFallthroughError(schema, value, mode)
  }
  function Promise(schema: Types.TSchema, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Record(schema: Types.TRecord<any, any>, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    const propertyKey = globalThis.Object.getOwnPropertyNames(schema.patternProperties)[0]
    const property = schema.patternProperties[propertyKey]
    const result = {} as Record<string, unknown>
    for (const [propKey, propValue] of globalThis.Object.entries(value)) {
      result[propKey] = Visit(property, references, propValue, mode)
    }
    return Apply(schema, result, mode)
  }
  function Ref(schema: Types.TRef<any>, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    const index = references.findIndex((foreign) => foreign.$id === schema.$ref)
    if (index === -1) throw new ValueTransformDereferenceError(schema)
    const target = references[index]
    const resolved = Visit(target, references, value, mode)
    return Apply(schema, resolved, mode)
  }
  function String(schema: Types.TString, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Symbol(schema: Types.TSymbol, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function TemplateLiteral(schema: Types.TTemplateLiteral, references: Types.TSchema[], value: any, mode: ValueTransformMode) {
    return Apply(schema, value, mode)
  }
  function This(schema: Types.TThis, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    const index = references.findIndex((foreign) => foreign.$id === schema.$ref)
    if (index === -1) throw new ValueTransformDereferenceError(schema)
    const target = references[index]
    const resolved = Visit(target, references, value, mode)
    return Apply(schema, resolved, mode)
  }
  function Tuple(schema: Types.TTuple<any[]>, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    if (IsArray(value) && schema.items !== undefined) {
      return Apply(
        schema,
        value.map((value, index) => {
          return index < schema.items!.length ? Visit(schema.items![index], references, value, mode) : value
        }),
        mode,
      )
    }
    throw new ValueTransformFallthroughError(schema, value, mode)
  }
  function Undefined(schema: Types.TUndefined, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Union(schema: Types.TUnion, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    for (const subschema of schema.anyOf) {
      const inner = Visit(subschema, references, value, mode)
      if (ValueCheck.Check(subschema, references, inner)) {
        return Apply(schema, inner, mode)
      }
    }
    throw new ValueTransformFallthroughError(schema, value, mode)
  }
  function Uint8Array(schema: Types.TUint8Array, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Unknown(schema: Types.TUnknown, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function Void(schema: Types.TVoid, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  function UserDefined(schema: Types.TSchema, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    return Apply(schema, value, mode)
  }
  export function Visit(schema: Types.TSchema, references: Types.TSchema[], value: any, mode: ValueTransformMode): unknown {
    const references_ = IsString(schema.$id) ? [...references, schema] : references
    const schema_ = schema as any
    switch (schema[Types.Kind]) {
      case 'Any':
        return Any(schema_, references_, value, mode)
      case 'Array':
        return Array(schema_, references_, value, mode)
      case 'BigInt':
        return BigInt(schema_, references_, value, mode)
      case 'Boolean':
        return Boolean(schema_, references_, value, mode)
      case 'Constructor':
        return Constructor(schema_, references_, value, mode)
      case 'Date':
        return Date(schema_, references_, value, mode)
      case 'Function':
        return Function(schema_, references_, value, mode)
      case 'Integer':
        return Integer(schema_, references_, value, mode)
      case 'Intersect':
        return Intersect(schema_, references_, value, mode)
      case 'Literal':
        return Literal(schema_, references_, value, mode)
      case 'Never':
        return Never(schema_, references_, value, mode)
      case 'Null':
        return Null(schema_, references_, value, mode)
      case 'Number':
        return Number(schema_, references_, value, mode)
      case 'Object':
        return Object(schema_, references_, value, mode)
      case 'Promise':
        return Promise(schema_, references_, value, mode)
      case 'Record':
        return Record(schema_, references_, value, mode)
      case 'Ref':
        return Ref(schema_, references_, value, mode)
      case 'String':
        return String(schema_, references_, value, mode)
      case 'Symbol':
        return Symbol(schema_, references_, value, mode)
      case 'TemplateLiteral':
        return TemplateLiteral(schema_, references_, value, mode)
      case 'This':
        return This(schema_, references_, value, mode)
      case 'Tuple':
        return Tuple(schema_, references_, value, mode)
      case 'Undefined':
        return Undefined(schema_, references_, value, mode)
      case 'Union':
        return Union(schema_, references_, value, mode)
      case 'Uint8Array':
        return Uint8Array(schema_, references_, value, mode)
      case 'Unknown':
        return Unknown(schema_, references_, value, mode)
      case 'Void':
        return Void(schema_, references_, value, mode)
      default:
        if (!Types.TypeRegistry.Has(schema_[Types.Kind])) throw new ValueTransformUnknownTypeError(schema_)
        return UserDefined(schema_, references_, value, mode)
    }
  }
  export function Encode<T extends Types.TSchema>(schema: T, references: Types.TSchema[], value: unknown): Types.Static<T> {
    return Visit(schema, references, ValueClone.Clone(value), 'encode')
  }
  export function Decode<T extends Types.TSchema>(schema: T, references: Types.TSchema[], value: any): unknown {
    return Visit(schema, references, ValueClone.Clone(value), 'decode')
  }
}
