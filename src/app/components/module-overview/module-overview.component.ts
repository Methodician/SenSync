import { Component } from '@angular/core';
import { Database, listVal, objectVal, ref } from '@angular/fire/database';
import { ActivatedRoute } from '@angular/router';
import { map, Observable, switchMap } from 'rxjs';

@Component({
  selector: 'sen-module-overview',
  templateUrl: './module-overview.component.html',
  styleUrls: ['./module-overview.component.scss']
})
export class ModuleOverviewComponent {
  readouts$: Observable<any>;
  module$: Observable<any>;

  constructor(private activeRoute: ActivatedRoute, private db: Database) {
    this.readouts$ = this.activeRoute.params.pipe(
      map(params => params['id']),
      switchMap(id => listVal(ref(this.db, `readoutsByModuleId/${id}`), {keyField: 'key'}))
    )
    this.module$ = this.activeRoute.params.pipe(
      map(params => params['id']),
      switchMap(id => objectVal(ref(this.db, `modules/${id}`), {keyField: 'key'}))
    )
   }


}
