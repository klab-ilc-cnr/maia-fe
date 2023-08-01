import { Pipe, PipeTransform } from '@angular/core';
import { Roles } from '../models/roles';
import { User } from '../models/user';
/**
 * Definisce se l'elemento è modificabile se l'utente è un amministratore o l'elemento è di sua proprietà
 */
@Pipe({
  name: 'shouldBeEditable'
})
export class ShouldBeEditablePipe implements PipeTransform {

  transform(elementOwnerId: number, currentUser: User): boolean {
    if(!currentUser.id) {
      return false;
    }
    return currentUser.role === Roles.AMMINISTRATORE || elementOwnerId === +currentUser.id;
  }

}
