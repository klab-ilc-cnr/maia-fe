import { SpanCoordinates } from "./span-coordinates"

export class Annotation {
  layer: any
  layerName: string | undefined
  value: string | undefined
  imported: boolean | undefined
  attributes: Record<string, any> = {}
  spans: Array<SpanCoordinates> | undefined
  id!: number
}
