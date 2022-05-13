import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-workspace-list',
  templateUrl: './workspace-list.component.html',
  styleUrls: ['./workspace-list.component.scss']
})
export class WorkspaceListComponent implements OnInit {

  private newId = 'new';
  private newWorkspace = false;

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,) { }

    ngOnInit(): void {
      this.activeRoute.paramMap.subscribe(params => {
  
        var id = params.get('id');
  
        if(id === this.newId)
        {
          this.newWorkspace = true;
          return;
        }
  
        if (id != null && id != undefined) {
          /* this.editUser = true;
          this.loadUser(id); */
          return;
        }
  
        /* this.editUser = false;
        this.loadCurrentUserProfile(); */
        
      });
    }

  public goToNewWorkspace() {
    var tempo = this.router.navigate(["/workspace", "new"], { relativeTo: this.activeRoute });
    console.log(tempo);
  }

}
