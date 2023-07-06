import { Value } from '@sinclair/typebox/value'
import { Type, TSchema, Static, Transform, Assert, Evaluate } from '@sinclair/typebox'

const JsonString = Type.Transform(Type.String(), {
  decode: (value) => JSON.parse(value),
  encode: (value) => JSON.stringify(value),
})

const decoded = Value.Decode(JsonString, '[1, 2, 3, 4]')
const encoded = Value.Encode(JsonString, decoded)

console.log(decoded)
console.log(encoded)
