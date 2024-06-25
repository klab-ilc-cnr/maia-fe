import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../models/user';
/**
 * Defines whether the element is editable if the user is an administrator or the element is owned by the user
 */
@Pipe({
  name: 'shouldBeEditable'
})
export class ShouldBeEditablePipe implements PipeTransform {

  /**
   * PipeTransform interface method that checks whether the element should be editable for a given user
   * @param elementOwnerId {number} owner user identifier
   * @param currentUser {User} current logged user
   * @returns {boolean} whether the element should be editable
   */
  transform(elementOwnerId: number, currentUser?: User): boolean {
    if(!currentUser || !currentUser.id) {
      return false;
    }
    return currentUser.role === "ADMINISTRATOR" || elementOwnerId === +currentUser.id;
  }

}
