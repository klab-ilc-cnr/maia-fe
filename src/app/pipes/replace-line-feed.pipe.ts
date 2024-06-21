import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'replaceEscapes'
})
export class ReplaceLineFeedPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) { return value; }

    return value.replace(/\n+/g, " ");
  }

}