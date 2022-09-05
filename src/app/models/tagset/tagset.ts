import { TagsetValue } from './tagset-value';

export class Tagset {
  id!: number
  name: string | undefined
  description: string | undefined
  values: Array<TagsetValue> | undefined
}
